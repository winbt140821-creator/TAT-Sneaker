// Turns a supplier's Chinese album title into a Vietnamese product name, and
// reads the sizes the album lists — for Sản phẩm → Nhập từ Yupoo. A fixed
// fashion glossary rather than a translation service: free, instant, and
// predictable. Anything it doesn't know is dropped, and imported products
// start hidden, so staff read every name before shoppers do.
//
// Chinese puts the garment last ("刺绣…卫衣"); Vietnamese puts it first
// ("Áo nỉ … thêu"). So the last garment word becomes the head and the words
// before it follow in reverse, which reads naturally in most titles:
//   "Burberry/巴宝莉 25Fw 格纹战马贴布拉链连帽外套"
//   → "Áo khoác Burberry có mũ khoá kéo đắp vải logo kỵ sĩ kẻ caro FW25"
// Isomorphic: no server imports, so the import screen previews names too.

type Entry = { vi: string; kind: "garment" | "weak" | "mod" | "drop"; mod?: string };

const g = (vi: string): Entry => ({ vi, kind: "garment" });
const m = (vi: string): Entry => ({ vi, kind: "mod" });
// Sleeve words name the garment only when nothing else does ("主场长袖" is a
// long-sleeve shirt); next to a garment they just describe it.
const weak = (vi: string, mod: string): Entry => ({ vi, kind: "weak", mod });
const DROP: Entry = { vi: "", kind: "drop" };

const GLOSSARY: Record<string, Entry> = {
  // Tops & outerwear
  外套: g("áo khoác"), 夹克: g("áo jacket"), 夹克外套: g("áo khoác jacket"), 棒球服: g("áo khoác bóng chày"),
  棒球服外套: g("áo khoác bóng chày"), 飞行员夹克: g("áo bomber"), 飞行夹克: g("áo bomber"), 羽绒服: g("áo phao lông vũ"),
  羽绒外套: g("áo phao lông vũ"), 棉服: g("áo phao"), 棉衣: g("áo phao"), 马甲: g("áo gile"), 背心: g("áo ba lỗ"),
  冲锋衣: g("áo khoác gió"), 风衣: g("áo măng tô"), 大衣: g("áo khoác dạ"), 西装: g("áo vest"), 西服: g("áo vest"),
  西装外套: g("áo vest"), 卫衣: g("áo nỉ"), 连帽卫衣: g("áo hoodie"), 帽衫: g("áo hoodie"), 毛衣: g("áo len"),
  针织衫: g("áo len dệt kim"), 开衫: g("áo cardigan"), 针织开衫: g("áo cardigan dệt kim"), 毛衣开衫: g("áo cardigan len"),
  衬衫: g("áo sơ mi"), 衬衣: g("áo sơ mi"), T恤: g("áo thun"), 体恤: g("áo thun"), polo衫: g("áo polo"), polo: g("áo polo"),
  打底衫: g("áo giữ nhiệt"), 上衣: g("áo"), 球衣: g("áo đấu"), 出场服: g("áo khoác ra sân"), 训练服: g("áo tập"),
  皮衣: g("áo khoác da"), 皮夹克: g("áo khoác da"), 牛仔外套: g("áo khoác jean"), 牛仔夹克: g("áo khoác jean"),
  牛仔衬衫: g("áo sơ mi jean"), 连体衣: g("bộ liền thân"),
  短袖: weak("áo ngắn tay", "ngắn tay"), 长袖: weak("áo dài tay", "dài tay"),
  // Bottoms, dresses, sets
  裤子: g("quần"), 裤: g("quần"), 长裤: g("quần dài"), 短裤: g("quần short"), 牛仔裤: g("quần jean"),
  休闲裤: g("quần casual"), 运动裤: g("quần thể thao"), 卫裤: g("quần nỉ"), 工装裤: g("quần túi hộp"), 西裤: g("quần âu"),
  阔腿裤: g("quần ống rộng"), 直筒裤: g("quần ống đứng"), 束脚裤: g("quần jogger"), 裙: g("váy"), 裙子: g("váy"),
  连衣裙: g("váy liền"), 半身裙: g("chân váy"), 短裙: g("chân váy ngắn"), 套装: g("bộ quần áo"), 运动套装: g("bộ thể thao"),
  // Shoes
  鞋: g("giày"), 鞋子: g("giày"), 运动鞋: g("giày thể thao"), 板鞋: g("giày sneaker"), 休闲鞋: g("giày casual"),
  跑鞋: g("giày chạy bộ"), 篮球鞋: g("giày bóng rổ"), 帆布鞋: g("giày vải canvas"), 老爹鞋: g("giày chunky"),
  靴: g("giày boot"), 靴子: g("giày boot"), 拖鞋: g("dép lê"), 凉鞋: g("dép sandal"), 乐福鞋: g("giày loafer"),
  皮鞋: g("giày da"), 高帮: m("cổ cao"), 低帮: m("cổ thấp"), 中帮: m("cổ vừa"),
  // Accessories
  帽: g("mũ"), 帽子: g("mũ"), 棒球帽: g("mũ lưỡi trai"), 鸭舌帽: g("mũ lưỡi trai"), 渔夫帽: g("mũ bucket"),
  毛线帽: g("mũ len"), 包: g("túi"), 背包: g("balo"), 双肩包: g("balo"), 斜挎包: g("túi đeo chéo"), 手提包: g("túi xách"),
  钱包: g("ví"), 腰带: g("thắt lưng"), 皮带: g("thắt lưng da"), 围巾: g("khăn quàng"), 袜子: g("tất"),
  // Collar, sleeve, fit
  圆领: m("cổ tròn"), 翻领: m("cổ bẻ"), 立领: m("cổ đứng"), 高领: m("cổ lọ"), 半高领: m("cổ lọ thấp"), v领: m("cổ tim"),
  连帽: m("có mũ"), 半拉链: m("half-zip"), 半开拉链: m("half-zip"), 拉链: m("khoá kéo"), 双拉链: m("hai khoá kéo"),
  无袖: m("sát nách"), 宽松: m("dáng rộng"), 修身: m("ôm dáng"), 廓形: m("dáng oversize"), 落肩: m("vai rơi"),
  直筒: m("ống đứng"), 阔腿: m("ống rộng"), 微喇: m("ống loe nhẹ"), 短款: m("dáng ngắn"), 长款: m("dáng dài"),
  // Techniques
  刺绣: m("thêu"), 绣花: m("thêu hoa"), 印花: m("in họa tiết"), 烫钻: m("đính đá"), 烫金: m("ép kim"), 贴布: m("đắp vải"),
  拼接: m("phối"), 撞色: m("phối màu"), 提花: m("jacquard"), 水洗: m("wash"), 做旧: m("hiệu ứng cũ"), 破洞: m("rách"),
  涂鸦: m("graffiti"), 手绘: m("vẽ tay"), 扎染: m("loang màu"), 渐变: m("chuyển màu"), 植绒: m("in nhung"),
  发泡: m("in nổi"), 数码印花: m("in kỹ thuật số"), 满印: m("in toàn thân"), 贴标: m("gắn nhãn"),
  // Patterns & marks
  格纹: m("kẻ caro"), 格子: m("kẻ caro"), 条纹: m("kẻ sọc"), 老花: m("monogram"), 字母: m("chữ"), 迷彩: m("rằn ri"),
  豹纹: m("da báo"), 波点: m("chấm bi"), 纯色: m("trơn"), 徽标: m("logo"), 标志: m("logo"), logo: m("logo"),
  三角标: m("logo tam giác"), 签名: m("chữ ký"), 胸口: m("ngực"), 胸前: m("ngực"), 后背: m("lưng"), 背后: m("lưng"),
  口袋: m("túi"), 后口袋: m("túi sau"), 贴袋: m("túi đắp"), 爱心: m("trái tim"), 小爱心: m("trái tim nhỏ"),
  十字架: m("thánh giá"), 马蹄: m("móng ngựa"), 马蹄铁: m("móng ngựa"), 骷髅: m("đầu lâu"), 星星: m("ngôi sao"),
  大钩子: m("logo swoosh lớn"), 钩子: m("logo swoosh"), 小钩: m("logo swoosh nhỏ"), 战马: m("logo kỵ sĩ"),
  草间弥生: m("Yayoi Kusama"), 花卉: m("hoa"), 纹花: m("hoa văn"), 趣味: m("vui nhộn"), 太阳: m("mặt trời"), 太阳花: m("hoa mặt trời"),
  // Materials
  棉: m("cotton"), 纯棉: m("cotton"), 羊毛: m("len lông cừu"), 羊绒: m("cashmere"), 真丝: m("lụa"), 丝绸: m("lụa"),
  亚麻: m("linen"), 皮革: m("da"), 真皮: m("da thật"), 牛皮: m("da bò"), 羊皮: m("da cừu"), 麂皮: m("da lộn"),
  翻毛皮: m("da lộn"), 尼龙: m("nylon"), 涤纶: m("polyester"), 牛仔: m("denim"), 灯芯绒: m("nhung tăm"),
  华夫格: m("vải tổ ong"), 毛圈: m("nỉ da cá"), 抓绒: m("nỉ lông"), 摇粒绒: m("nỉ lông cừu"), 加绒: m("lót nỉ"),
  羽绒: m("lông vũ"), 针织: m("dệt kim"), 粗针: m("đan sợi to"), 细针: m("len mịn"), 毛呢: m("dạ"), 呢子: m("dạ"),
  // Colours
  黑色: m("đen"), 白色: m("trắng"), 灰色: m("xám"), 红色: m("đỏ"), 蓝色: m("xanh dương"), 藏青: m("xanh navy"),
  藏蓝: m("xanh navy"), 深蓝: m("xanh đậm"), 浅蓝: m("xanh nhạt"), 天蓝: m("xanh da trời"), 绿色: m("xanh lá"),
  军绿: m("xanh rêu"), 墨绿: m("xanh rêu"), 黄色: m("vàng"), 粉色: m("hồng"), 紫色: m("tím"), 棕色: m("nâu"),
  咖啡色: m("nâu cà phê"), 卡其: m("kaki"), 卡其色: m("kaki"), 杏色: m("màu be"), 米色: m("màu kem"), 米白: m("trắng kem"),
  橙色: m("cam"), 酒红: m("đỏ rượu"), 银色: m("bạc"), 金色: m("vàng kim"), 黑: m("đen"), 白: m("trắng"), 灰: m("xám"),
  红: m("đỏ"), 蓝: m("xanh dương"), 绿: m("xanh lá"), 黄: m("vàng"), 粉: m("hồng"), 紫: m("tím"), 棕: m("nâu"),
  // Style, season, fit-for
  休闲: m("casual"), 运动: m("thể thao"), 复古: m("retro"), 情侣: m("đôi"), 男女同款: m("unisex"), 中性: m("unisex"),
  男款: m("nam"), 女款: m("nữ"), 男: m("nam"), 女: m("nữ"), 联名: m("collab"), 限定: m("limited"), 经典: m("classic"),
  基础款: m("basic"), 秋冬: m("thu đông"), 春夏: m("xuân hè"), 主场: m("sân nhà"), 客场: m("sân khách"),
  // Sales talk that means nothing to a shopper
  官网: DROP, 同款: DROP, 最新: DROP, 爆款: DROP, 原版: DROP, 顶级: DROP, 高版本: DROP, 高品质: DROP, 正品: DROP,
  专柜: DROP, 代购: DROP, 版本: DROP, 款: DROP, 系列: DROP, 新品: DROP, 新款: DROP, 现货: DROP, 大: DROP, 小: DROP,
};

// Brands suppliers often write only in Chinese.
const BRANDS_ZH: Record<string, string> = {
  路易威登: "Louis Vuitton", 巴黎世家: "Balenciaga", 古驰: "Gucci", 普拉达: "Prada", 迪奥: "Dior", 香奈儿: "Chanel",
  巴宝莉: "Burberry", 博柏利: "Burberry", 罗意威: "Loewe", 克罗心: "Chrome Hearts", 缪缪: "Miu Miu", 纪梵希: "Givenchy",
  范思哲: "Versace", 芬迪: "Fendi", 圣罗兰: "Saint Laurent", 华伦天奴: "Valentino", 阿玛尼: "Armani",
  拉夫劳伦: "Ralph Lauren", 耐克: "Nike", 阿迪达斯: "Adidas", 蒙克莱: "Moncler", 盟可睐: "Moncler", 始祖鸟: "Arc'teryx",
  北面: "The North Face", 斯图西: "Stussy", 爱马仕: "Hermès", 赛琳: "Celine", 思琳: "Celine", 葆蝶家: "Bottega Veneta",
  迪赛: "Diesel", 巴尔曼: "Balmain", 麦昆: "Alexander McQueen", 汤姆布朗: "Thom Browne", 石头岛: "Stone Island",
  加拿大鹅: "Canada Goose", 新百伦: "New Balance", 彪马: "Puma", 匡威: "Converse", 万斯: "Vans", 亚瑟士: "Asics",
  鬼冢虎: "Onitsuka Tiger", 乔丹: "Jordan", 蔻驰: "Coach", 马吉拉: "Maison Margiela", 杰尼亚: "Zegna",
  艾米: "Ami Paris", 川久保玲: "Comme des Garçons", 奥夫怀特: "Off-White", 美津浓: "Mizuno", 萨洛蒙: "Salomon",
};

// Looked up lower-cased so "Polo衫", "POLO衫" and "polo衫" all match.
const LOOKUP = new Map(Object.entries(GLOSSARY).map(([key, entry]) => [key.toLowerCase(), entry]));
const MAX_KEY = Math.max(...[...LOOKUP.keys()].map((k) => k.length));
const HAN = /[㐀-鿿]/;
const SEASON = /^(\d{2})(fw|ss|aw)$|^(fw|ss|aw)(\d{2})$/i;
// Latin words that start a title but aren't a brand.
const NOT_BRAND = new Set(["t", "polo", "logo", "v", "oversize", "vintage", "new"]);

/** Full-width letters/digits/punctuation → ASCII, dash variants → "-". */
function normalize(text: string) {
  return text
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .replace(/[—–~～〜]|至|到/g, "-");
}

const LETTER_LADDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];
const LETTER = "(?:XXS|XS|XXXXL|XXXL|XXL|XL|[2-6]XL|S|M|L)";

function letterSize(raw: string) {
  const s = raw.toUpperCase();
  if (s === "2XL") return "XXL";
  if (s === "XXXL") return "3XL";
  if (s === "XXXXL") return "4XL";
  return s;
}

/** Sizes an album lists — "S-3XL", "尺码：M L XL", "36-45", "码数 39 40 41" —
 *  in size order. Letter sizes for clothing, EU numbers for shoes; empty
 *  when nothing recognisable is written. */
export function parseSizes(text: string, department: "SHOES" | "CLOTHING"): string[] {
  const src = normalize(text);
  const found = new Set<string>();
  if (department === "CLOTHING") {
    for (const r of src.matchAll(new RegExp(`(?<![A-Z0-9])(${LETTER})\\s*-\\s*(${LETTER})(?![A-Z0-9])`, "gi"))) {
      const a = LETTER_LADDER.indexOf(letterSize(r[1]));
      const b = LETTER_LADDER.indexOf(letterSize(r[2]));
      if (a !== -1 && b > a) LETTER_LADDER.slice(a, b + 1).forEach((s) => found.add(s));
    }
    for (const line of src.split(/\n/)) {
      if (!/码|尺寸|size/i.test(line)) continue;
      for (const t of line.matchAll(new RegExp(`(?<![A-Z0-9])(${LETTER})(?![A-Z0-9])`, "gi"))) found.add(letterSize(t[1]));
    }
    if (found.size === 0 && /均码|free\s*size|one\s*size/i.test(src)) return ["Free size"];
    return LETTER_LADDER.filter((s) => found.has(s));
  }
  for (const r of src.matchAll(/(?<![\d.])(3[4-9]|4\d)\s*-\s*(3[5-9]|4\d|50)(?![\d.])/g)) {
    const [a, b] = [Number(r[1]), Number(r[2])];
    if (b > a && b - a <= 16) for (let n = a; n <= b; n++) found.add(String(n));
  }
  for (const line of src.split(/\n/)) {
    if (!/码|尺寸|size/i.test(line)) continue;
    for (const t of line.matchAll(/(?<![\d.])((?:3[4-9]|4\d|50)(?:\.5)?)(?![\d.])/g)) found.add(t[1]);
  }
  return [...found].sort((a, b) => Number(a) - Number(b));
}

/** Removes the parts of a title that aren't the product's name: sizes,
 *  prices, bracketed codes. */
function stripNoise(title: string) {
  return title
    .replace(new RegExp(`(?<![A-Z0-9])${LETTER}\\s*-\\s*${LETTER}(?![A-Z0-9])`, "gi"), " ")
    .replace(/(?<![\d.])(3[4-9]|4\d)\s*-\s*(3[5-9]|4\d|50)(?![\d.])/g, " ")
    .replace(/(尺码|码数)[:：]?[^\n]*/g, " ")
    .replace(/[¥$💰]\s*\d+(?:\.\d+)?|\bP\s?\d{2,4}\b|\d+\s*(?:元|rmb)/gi, " ")
    .replace(/[【】\[\]()（）#]/g, " ");
}

function extractBrand(text: string): { brand: string | null; rest: string } {
  // "Louis Vuitton/路易威登 …", "Miumiu/缪缪 …"
  const slash = text.match(/^\s*([A-Za-z][A-Za-z0-9 .&'+-]*?)\s*\/\s*[㐀-鿿]+/);
  if (slash) return { brand: slash[1].trim(), rest: text.slice(slash[0].length) };
  // "Ami Paris 小爱心…", "Louis Vuitton & NBA 21Fw 联名…"
  const lead = text.match(/^\s*([A-Za-z][A-Za-z.'+-]*(?:\s+(?:&\s+)?[A-Za-z][A-Za-z.'+-]*)*)(?=\s|$|[㐀-鿿])/);
  if (lead) {
    const words = lead[1].trim();
    const known = Object.values(BRANDS_ZH).find((b) => b.toLowerCase() === words.toLowerCase());
    const separated = /\s/.test(text.charAt(lead[0].length) || " ");
    if (known || (separated && words.length >= 2 && !NOT_BRAND.has(words.toLowerCase()))) {
      return { brand: known ?? words, rest: text.slice(lead[0].length) };
    }
  }
  // "路易威登老花…"
  const trimmed = text.trimStart();
  for (const [zh, brand] of Object.entries(BRANDS_ZH)) {
    if (trimmed.startsWith(zh)) return { brand, rest: trimmed.slice(zh.length) };
  }
  return { brand: null, rest: text };
}

type Token = { vi: string; kind: Entry["kind"]; mod?: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const lower = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    let hit: [string, Entry] | null = null;
    for (let len = Math.min(MAX_KEY, text.length - i); len >= 1; len--) {
      const key = lower.slice(i, i + len);
      const entry = LOOKUP.get(key);
      // A Latin glossary key only counts as a whole word ("logo", not the
      // "logo" inside "logos").
      if (entry && !(/[a-z]$/.test(key) && /[a-z]/i.test(text.charAt(i + len)))) {
        hit = [key, entry];
        break;
      }
    }
    if (hit) {
      if (hit[1].kind !== "drop") tokens.push({ vi: hit[1].vi, kind: hit[1].kind, mod: hit[1].mod });
      i += hit[0].length;
      continue;
    }
    const brand = Object.keys(BRANDS_ZH).find((zh) => text.startsWith(zh, i));
    if (brand) {
      i += brand.length; // already the product's brand, or a collab partner's Chinese name
      continue;
    }
    const word = text.slice(i).match(/^[A-Za-z0-9][A-Za-z0-9.'&+-]*/)?.[0];
    if (word) {
      const season = word.match(SEASON);
      tokens.push({
        vi: season ? `${(season[2] ?? season[3]).toUpperCase()}${season[1] ?? season[4]}` : word,
        kind: "mod",
      });
      i += word.length;
      continue;
    }
    i += 1; // unknown Chinese character or punctuation
  }
  return tokens;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Vietnamese product name for a Yupoo album title. Falls back to the
 *  original title when nothing in it is recognised. */
export function translateTitle(title: string): string {
  const original = title.trim();
  const { brand, rest } = extractBrand(stripNoise(normalize(original)));
  const tokens = tokenize(rest);

  // The head is the last garment word — or, when several garment words sit
  // together ("棒球服夹克外套": baseball jacket + jacket + coat), the first of
  // that run, which is the most specific; the generic ones after it go.
  let headIndex = -1;
  let runEnd = -1;
  for (const kind of ["garment", "weak"] as const) {
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].kind !== kind) continue;
      runEnd = i;
      headIndex = i;
      while (headIndex > 0 && tokens[headIndex - 1].kind === kind) headIndex--;
      break;
    }
    if (headIndex !== -1) break;
  }

  const head = headIndex === -1 ? null : tokens[headIndex].vi;
  const mods = tokens
    .filter((_, i) => i < headIndex || i > runEnd || headIndex === -1)
    .map((t) => (t.kind === "weak" ? t.mod! : t.vi));
  // The season code reads best at the end; everything else in reverse order.
  const seasons = mods.filter((w) => /^(FW|SS|AW)\d{2}$/.test(w));
  const others = mods.filter((w) => !seasons.includes(w));
  // Repeated words ("logo … logo") collapse; the brand is left alone, since
  // some repeat on purpose ("Miu Miu").
  const described = [...(head ? others.reverse() : others), ...seasons]
    .join(" ")
    .split(/\s+/)
    .filter((w, i, all) => w && w.toLowerCase() !== all[i - 1]?.toLowerCase())
    .join(" ");
  const name = [head ? capitalize(head) : "", brand ?? "", described].filter(Boolean).join(" ").trim();

  if (!name || (!head && !brand && tokens.length === 0)) return original;
  if (!HAN.test(name) && name.length >= 2) return capitalize(name);
  return original;
}

/** The supplier's note under the album, minus the lines a shopper must not
 *  see: prices, WeChat/QQ/phone contacts, links. */
export function cleanDescription(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/微信|wechat|vx|qq|whatsapp|电话|手机|http|www\.|[¥💰]|\d{7,}|价格|批发|代理/i.test(line))
    .join("\n");
}
