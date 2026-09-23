// Content pages the storefront footer links to, in both stores (the footer
// itself labels them from translations — keep the slugs in Footer.tsx in
// step with this list). Admin's dashboard flags any that hasn't been
// created yet: its footer link would otherwise open a "not found" page.
export const FOOTER_PAGES = [
  { slug: "doi-tra-bao-hanh", title: "Đổi trả & bảo hành" },
  { slug: "bao-mat-thong-tin", title: "Bảo mật thông tin" },
  { slug: "dieu-khoan-su-dung", title: "Điều khoản sử dụng" },
  { slug: "huong-dan-dat-hang", title: "Hướng dẫn đặt hàng" },
  { slug: "huong-dan-thanh-toan", title: "Hướng dẫn thanh toán" },
  { slug: "van-chuyen", title: "Vận chuyển" },
  { slug: "gioi-thieu", title: "Giới thiệu" },
  { slug: "tuyen-dung", title: "Tuyển dụng" },
  { slug: "lien-he", title: "Liên hệ" },
] as const;
