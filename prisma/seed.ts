import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "../src/lib/db";
import { categories as staticCategories } from "../src/lib/site-config";
import { products as staticProducts } from "./seed-data";
import { slugify } from "../src/lib/slugify";

async function main() {
  const categoryIdBySlug = new Map<string, string>();

  for (const [topIndex, cat] of staticCategories.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.brand },
      update: { label: cat.label, hot: !!cat.hot, sale: !!cat.sale, sortOrder: topIndex },
      create: {
        slug: cat.brand,
        label: cat.label,
        hot: !!cat.hot,
        sale: !!cat.sale,
        sortOrder: topIndex,
      },
    });
    categoryIdBySlug.set(cat.brand, parent.id);

    for (const [i, childLabel] of (cat.children ?? []).entries()) {
      const childSlug = `${cat.brand}-${slugify(childLabel)}`;
      const childHot = childLabel.includes("Travis Scott");
      await prisma.category.upsert({
        where: { slug: childSlug },
        update: { label: childLabel, parentId: parent.id, sortOrder: i, hot: childHot },
        create: {
          slug: childSlug,
          label: childLabel,
          parentId: parent.id,
          sortOrder: i,
          hot: childHot,
        },
      });
    }
  }

  // "Luxury" is a real, manually-curated category (not a price heuristic) —
  // tag the priciest sample items into it in addition to their brand.
  const luxuryId = categoryIdBySlug.get("Luxury");
  const priciest = [...staticProducts].sort((a, b) => b.price - a.price).slice(0, 4);

  for (const p of staticProducts) {
    const brandCategoryId = categoryIdBySlug.get(p.brand);
    const connectIds = [
      ...(brandCategoryId ? [brandCategoryId] : []),
      ...(luxuryId && priciest.includes(p) ? [luxuryId] : []),
    ];

    const sizeQuantities: Record<string, number> = {};
    for (const s of [...new Set([...p.sizes, ...p.soldSizes])]) {
      sizeQuantities[String(s)] = p.soldSizes.includes(s) ? 0 : 1;
    }

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        price: p.price,
        quality: p.quality,
        accent: p.accent,
        sizeQuantities: JSON.stringify(sizeQuantities),
        categories: { set: connectIds.map((id) => ({ id })) },
      },
      create: {
        sku: p.sku,
        name: p.name,
        price: p.price,
        quality: p.quality,
        accent: p.accent,
        sizeQuantities: JSON.stringify(sizeQuantities),
        categories: { connect: connectIds.map((id) => ({ id })) },
      },
    });
  }

  const staticPages: { slug: string; title: string; content: string }[] = [
    {
      slug: "doi-tra-bao-hanh",
      title: "Chính Sách Đổi Trả/Bảo Hành",
      content:
        'Shop chỉ chấp nhận bảo hành, đổi trả khi đã xác nhận sản phẩm được mua tại trang web hoặc tại cửa hàng TAT Sneaker.\n**Lưu ý**: Khi Quý khách đã mua tại cửa hàng, đã kiểm tra nhận hóa đơn khỏi cửa hàng. Chúng tôi sẽ không có trách nhiệm đổi trả hàng.\n\nQuy định đổi trả hàng có hiệu lực trong vòng **10 ngày kể từ ngày mua sản phẩm**.\n\nSản phẩm đổi phải trong tình trạng mới 100%, chưa qua sử dụng, còn đầy đủ hộp, hộp không bị bóp méo, giấy gói, các giấy tờ kèm theo khi mua hàng còn nguyên vẹn. Trường hợp nếu hộp giày không còn nguyên vẹn shop sẽ tính phí và trừ vào số tiền hoàn trả cho khách.\n\n**Chính sách Bảo Hành khi mua sắm tại TAT Sneaker:**\n\nSản phẩm được bảo hành với lỗi của nhà sản xuất như bung chỉ, bung keo, bung đế.\nThời gian bảo hành cho tất cả các sản phẩm giày là 10 ngày kể từ ngày nhận hàng.\nThời gian bảo hành từ 5-7 ngày làm việc. Ngay khi hoàn tất bảo hành, shop sẽ liên hệ ngay để gửi trả.\n\n**Chính sách Đổi Trả được áp dụng khi:**\n\nNgoài các lỗi do nhà sản xuất nêu ở trên, chúng tôi chấp nhận đổi trả nếu: Hàng giao không đúng mẫu mã, đúng size, sai màu, chất liệu so với trên web.\n\n1. Hỗ trợ đổi size tại nhà mà KHÔNG mất thêm phụ phí, khách hàng vui lòng thanh toán phí ship 2 chiều.\n2. Trường hợp không còn size để đổi trả, khách hàng được đổi 1 lần duy nhất sang mẫu giày khác và không thấp hơn giá trị sản phẩm đã mua.',
    },
    {
      slug: "bao-mat-thong-tin",
      title: "Bảo mật thông tin",
      content:
        "Thông tin khách hàng (họ tên, số điện thoại, địa chỉ) chỉ được sử dụng để xử lý đơn hàng và liên hệ giao nhận.\n\nTAT Sneaker không chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ trường hợp cần thiết để hoàn tất việc giao hàng (đơn vị vận chuyển).\n\nKhách hàng có thể liên hệ để yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân đã cung cấp.",
    },
    {
      slug: "dieu-khoan-su-dung",
      title: "Điều khoản sử dụng",
      content:
        "Khi đặt hàng tại TAT Sneaker, khách hàng đồng ý cung cấp thông tin chính xác để việc giao nhận diễn ra thuận lợi.\n\nGiá bán hiển thị trên website là giá niêm yết cuối cùng, không phát sinh thêm phụ phí.\n\nTAT Sneaker có quyền từ chối đơn hàng trong trường hợp sản phẩm hết hàng đột xuất hoặc thông tin đặt hàng không hợp lệ, và sẽ liên hệ khách hàng để xử lý.",
    },
    {
      slug: "huong-dan-dat-hang",
      title: "Hướng dẫn đặt hàng",
      content:
        "1. Chọn sản phẩm và size còn hàng, bấm \"Thêm vào giỏ hàng\" hoặc \"Mua ngay\".\n\n2. Kiểm tra giỏ hàng tại mục Giỏ hàng, điều chỉnh số lượng nếu cần.\n\n3. Điền thông tin người nhận (họ tên, số điện thoại, địa chỉ) tại trang Thanh toán.\n\n4. Xác nhận đơn hàng — nhân viên TAT Sneaker sẽ gọi điện xác nhận trước khi giao.",
    },
    {
      slug: "huong-dan-thanh-toan",
      title: "Hướng dẫn thanh toán",
      content:
        "TAT Sneaker áp dụng hình thức thanh toán khi nhận hàng (COD) cho tất cả đơn hàng.\n\nKhách hàng kiểm tra sản phẩm khi nhận và thanh toán trực tiếp cho nhân viên giao hàng.\n\nGiá thanh toán đúng bằng giá hiển thị trên đơn hàng — không phát sinh thêm phụ phí.",
    },
    {
      slug: "van-chuyen",
      title: "Vận chuyển",
      content:
        "TAT Sneaker giao hàng toàn quốc thông qua các đơn vị vận chuyển uy tín.\n\nThời gian giao hàng dự kiến 2-5 ngày làm việc tùy khu vực.\n\nĐơn hàng được đóng gói cẩn thận, kèm mã đơn để khách hàng tiện theo dõi.",
    },
    {
      slug: "gioi-thieu",
      title: "Giới thiệu",
      content:
        "TAT Sneaker là địa chỉ chuyên giày sneaker chính hãng, mỗi đôi đều qua kiểm định 3 bước trước khi lên kệ.\n\nChúng tôi hướng đến việc mang lại trải nghiệm mua sắm sneaker minh bạch: rõ mã SKU, rõ tình trạng, rõ size còn hàng — khách hàng không cần hỏi lại.",
    },
    {
      slug: "tuyen-dung",
      title: "Tuyển dụng",
      content:
        "TAT Sneaker hiện chưa có vị trí tuyển dụng nào được đăng công khai.\n\nNếu bạn quan tâm đến cơ hội làm việc cùng chúng tôi, vui lòng gửi thông tin liên hệ qua mục Liên hệ — chúng tôi sẽ phản hồi khi có vị trí phù hợp.",
    },
    {
      slug: "lien-he",
      title: "Liên hệ",
      content:
        "Bạn có câu hỏi về sản phẩm hoặc đơn hàng? Liên hệ với TAT Sneaker qua thông tin bên dưới, hoặc nhắn tin trực tiếp qua Messenger / Zalo ở góc màn hình.",
    },
  ];

  for (const page of staticPages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cophouse.vn";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "cophouse-admin-2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.staff.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Quản trị viên",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  // Google-login admin — this Gmail address is matched by the "Đăng nhập
  // bằng Google" button on /admin/login (see src/app/admin/google-callback).
  // The password below is random and never surfaced anywhere; this account
  // is meant to be used via Google only.
  const googleAdminEmail = process.env.SEED_GOOGLE_ADMIN_EMAIL ?? "winbt140821@gmail.com";
  const randomPasswordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);

  await prisma.staff.upsert({
    where: { email: googleAdminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "Quản trị viên (Google)",
      email: googleAdminEmail,
      passwordHash: randomPasswordHash,
      role: "ADMIN",
    },
  });

  console.log(`Seed complete.`);
  console.log(`Admin login (mật khẩu) -> ${adminEmail} / ${adminPassword}`);
  console.log(`Admin login (Google)   -> ${googleAdminEmail}`);
  console.log(`(Change the password-based admin's password after first login via /admin/staff.)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
