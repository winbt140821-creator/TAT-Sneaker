import { absoluteUrl } from "@/lib/seo";

// Meta Graph API (Facebook Page + linked Instagram Business account) —
// connect flow, page listing, and post publishing.
//
// Deliberately a SEPARATE Meta App from AUTH_FACEBOOK_ID/SECRET (used for
// customer "Đăng nhập bằng Facebook" via next-auth, see src/auth.ts). Meta
// App "types" are fixed at creation and can't be changed afterward — the
// existing app is a Consumer-type app (Authentication use case only), which
// per Meta's own docs can never add the Pages API/Instagram Graph API use
// case regardless of Business Portfolio/verification status. Posting to
// Pages/Instagram requires a Business-type app, hence META_APP_ID/SECRET
// pointing at a dedicated app instead.
const API_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

const SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

function appId() {
  return process.env.META_APP_ID;
}
function appSecret() {
  return process.env.META_APP_SECRET;
}

export function isMetaConfigured() {
  return Boolean(appId() && appSecret());
}

export function facebookCallbackUrl() {
  return absoluteUrl("/admin/social/facebook-callback");
}

export function getFacebookLoginUrl() {
  const params = new URLSearchParams({
    client_id: appId()!,
    redirect_uri: facebookCallbackUrl(),
    scope: SCOPES,
    response_type: "code",
  });
  return `https://www.facebook.com/${API_VERSION}/dialog/oauth?${params}`;
}

class GraphError extends Error {}

async function graph(pathAndQuery: string, init?: RequestInit) {
  const url = pathAndQuery.startsWith("http") ? pathAndQuery : `${BASE}/${pathAndQuery}`;
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GraphError(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: appId()!,
    client_secret: appSecret()!,
    redirect_uri: facebookCallbackUrl(),
    code,
  });
  const data = await graph(`oauth/access_token?${params}`);
  return data.access_token;
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId()!,
    client_secret: appSecret()!,
    fb_exchange_token: shortToken,
  });
  const data = await graph(`oauth/access_token?${params}`);
  return data.access_token;
}

export type ConnectedAccount = {
  platform: "FACEBOOK" | "INSTAGRAM";
  pageId: string;
  igUserId?: string;
  name: string;
  accessToken: string;
  avatarUrl: string | null;
};

export async function getPagesAndInstagram(userToken: string): Promise<ConnectedAccount[]> {
  const fields =
    "id,name,access_token,instagram_business_account{id,username,profile_picture_url},picture{url}";
  const data = await graph(`me/accounts?fields=${fields}&access_token=${userToken}`);

  const accounts: ConnectedAccount[] = [];
  for (const page of data.data ?? []) {
    accounts.push({
      platform: "FACEBOOK",
      pageId: page.id,
      name: page.name,
      accessToken: page.access_token,
      avatarUrl: page.picture?.data?.url ?? null,
    });
    if (page.instagram_business_account) {
      const ig = page.instagram_business_account;
      accounts.push({
        platform: "INSTAGRAM",
        pageId: page.id,
        igUserId: ig.id,
        name: ig.username,
        accessToken: page.access_token,
        avatarUrl: ig.profile_picture_url ?? null,
      });
    }
  }
  return accounts;
}

export type PublishTarget = {
  platform: "FACEBOOK" | "INSTAGRAM";
  pageId: string;
  igUserId: string | null;
  accessToken: string;
  name: string;
};

export type PublishResult = { id: string; url: string };

async function postToFacebook(
  target: PublishTarget,
  { message, images }: { message: string; images: string[] }
): Promise<PublishResult> {
  if (images.length === 0) {
    const params = new URLSearchParams({ message, access_token: target.accessToken });
    const data = await graph(`${target.pageId}/feed?${params}`, { method: "POST" });
    return { id: data.id, url: `https://facebook.com/${data.id}` };
  }
  if (images.length === 1) {
    const params = new URLSearchParams({
      url: images[0],
      caption: message,
      access_token: target.accessToken,
    });
    const data = await graph(`${target.pageId}/photos?${params}`, { method: "POST" });
    const id = data.post_id ?? data.id;
    return { id, url: `https://facebook.com/${id}` };
  }
  // Nhiều ảnh -> album: upload từng ảnh (chưa đăng), rồi gộp vào 1 bài
  const mediaIds: string[] = [];
  for (const img of images) {
    const params = new URLSearchParams({
      url: img,
      published: "false",
      access_token: target.accessToken,
    });
    const data = await graph(`${target.pageId}/photos?${params}`, { method: "POST" });
    mediaIds.push(data.id);
  }
  const form = new URLSearchParams({ message, access_token: target.accessToken });
  mediaIds.forEach((id, i) => form.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const data = await graph(`${target.pageId}/feed?${form}`, { method: "POST" });
  return { id: data.id, url: `https://facebook.com/${data.id}` };
}

async function igCreateContainer(target: PublishTarget, fields: Record<string, string>) {
  const params = new URLSearchParams({ ...fields, access_token: target.accessToken });
  const data = await graph(`${target.igUserId}/media?${params}`, { method: "POST" });
  return data.id as string;
}

async function postToInstagram(
  target: PublishTarget,
  { message, images }: { message: string; images: string[] }
): Promise<PublishResult> {
  if (images.length === 0) throw new GraphError("Instagram bắt buộc phải có ảnh.");

  let creationId: string;
  if (images.length === 1) {
    creationId = await igCreateContainer(target, { image_url: images[0], caption: message });
  } else {
    const children: string[] = [];
    for (const img of images.slice(0, 10)) {
      children.push(await igCreateContainer(target, { image_url: img, is_carousel_item: "true" }));
    }
    creationId = await igCreateContainer(target, {
      media_type: "CAROUSEL",
      caption: message,
      children: children.join(","),
    });
  }
  const pubParams = new URLSearchParams({ creation_id: creationId, access_token: target.accessToken });
  const published = await graph(`${target.igUserId}/media_publish?${pubParams}`, { method: "POST" });
  return { id: published.id, url: `https://instagram.com/${target.name}` };
}

export async function publishToTarget(
  target: PublishTarget,
  content: { message: string; images: string[] }
): Promise<PublishResult> {
  if (target.platform === "FACEBOOK") return postToFacebook(target, content);
  return postToInstagram(target, content);
}
