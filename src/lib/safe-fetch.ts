import dns from "dns";
import http from "http";
import https from "https";
import net from "net";
import zlib from "zlib";

// Fetches a page or photo from a link staff pasted — any site at all, so
// the link can't be trusted to point somewhere public. Every connection
// (including each redirect hop) is checked at the moment it's made: the
// host must resolve only to public addresses, so a link can't reach our
// own server, the cloud provider's metadata service or a private network,
// and a DNS answer can't change between the check and the connection.
// Server-only.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const MAX_REDIRECTS = 5;

export class SafeFetchError extends Error {
  constructor(
    message: string,
    readonly kind: "blocked" | "too-large" | "network" = "network"
  ) {
    super(message);
  }
}

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return v6 === "::" || v6 === "::1" || /^(fc|fd|fe[89ab]|ff)/.test(v6) || v6.startsWith("64:ff9b:");
}

// Handed to http(s).request as its DNS lookup, so the address checked is
// the address connected to.
const publicOnlyLookup = ((
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) {
      return callback(new SafeFetchError("Link này trỏ tới địa chỉ nội bộ, không được phép.", "blocked"), "");
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}) as unknown as net.LookupFunction;

function checkUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError("Chỉ hỗ trợ link http/https.", "blocked");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new SafeFetchError("Link này dùng cổng lạ, không được phép.", "blocked");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isPrivateAddress(host)) {
    throw new SafeFetchError("Link này trỏ tới địa chỉ nội bộ, không được phép.", "blocked");
  }
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host)) {
    throw new SafeFetchError("Link này trỏ tới địa chỉ nội bộ, không được phép.", "blocked");
  }
}

export type SafeResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  // Where the content actually came from, after redirects.
  url: string;
};

function requestOnce(
  url: URL,
  { accept, referer, maxBytes, timeoutMs }: { accept: string; referer?: string; maxBytes: number; timeoutMs: number }
): Promise<Omit<SafeResponse, "url">> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: publicOnlyLookup,
        timeout: timeoutMs,
        headers: {
          "User-Agent": UA,
          Accept: accept,
          "Accept-Language": "vi,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          ...(referer ? { Referer: referer } : {}),
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, headers: res.headers, body: Buffer.alloc(0) });
        }
        let stream: NodeJS.ReadableStream = res;
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        if (encoding.includes("gzip")) stream = res.pipe(zlib.createGunzip());
        else if (encoding.includes("br")) stream = res.pipe(zlib.createBrotliDecompress());
        else if (encoding.includes("deflate")) stream = res.pipe(zlib.createInflate());
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy();
            reject(new SafeFetchError("Nội dung quá lớn.", "too-large"));
            return;
          }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }));
        stream.on("error", (err) => reject(err instanceof SafeFetchError ? err : new SafeFetchError("Tải nội dung bị lỗi.")));
      }
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("Trang phản hồi quá lâu.")));
    req.on("error", (err) => reject(err instanceof SafeFetchError ? err : new SafeFetchError("Không kết nối được tới trang này.")));
    req.end();
  });
}

/** GET `input`, following redirects, with every hop checked (see top). */
export async function safeFetch(
  input: string,
  {
    accept = "*/*",
    referer,
    maxBytes,
    timeoutMs = 15_000,
  }: { accept?: string; referer?: string; maxBytes: number; timeoutMs?: number }
): Promise<SafeResponse> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeFetchError("Link không hợp lệ.", "blocked");
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    checkUrl(url);
    const res = await requestOnce(url, { accept, referer, maxBytes, timeoutMs });
    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    return { ...res, url: url.href };
  }
  throw new SafeFetchError("Trang chuyển hướng quá nhiều lần.");
}
