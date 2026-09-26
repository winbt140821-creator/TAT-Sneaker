-- Content for the nine pages both stores' footers link to (Đổi trả, Liên
-- hệ, Giới thiệu…) — production had none of them, so every footer link
-- opened a "not found" page. One copy per store: the clothing store's names
-- itself TAT STORE and talks about clothes instead of shoes.
--
-- Only inserts pages that don't exist yet, so nothing staff already wrote
-- is overwritten, and it is safe to replay. Staff edit them afterwards in
-- admin → Trang nội dung.

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_doi_tra_bao_hanh', 'doi-tra-bao-hanh', 'Chính sách đổi trả & bảo hành', 'Shop chỉ chấp nhận bảo hành, đổi trả khi đã xác nhận sản phẩm được mua tại trang web hoặc tại cửa hàng TAT Sneaker.
**Lưu ý**: Khi Quý khách đã mua tại cửa hàng, đã kiểm tra hàng và nhận hóa đơn khỏi cửa hàng, chúng tôi sẽ không có trách nhiệm đổi trả hàng.

Quy định đổi trả hàng có hiệu lực trong vòng **10 ngày kể từ ngày mua sản phẩm**.

Sản phẩm đổi phải trong tình trạng mới 100%, chưa qua sử dụng, còn đầy đủ hộp (hộp không bị bóp méo), giấy gói và các giấy tờ kèm theo khi mua hàng. Trường hợp hộp giày không còn nguyên vẹn, shop sẽ tính phí và trừ vào số tiền hoàn trả cho khách.

**Chính sách bảo hành khi mua sắm tại TAT Sneaker:**

Sản phẩm được bảo hành với lỗi của nhà sản xuất như bung chỉ, bung keo, bung đế.
Thời gian bảo hành cho tất cả các sản phẩm là 10 ngày kể từ ngày nhận hàng.
Thời gian xử lý bảo hành từ 5-7 ngày làm việc. Ngay khi hoàn tất bảo hành, shop sẽ liên hệ để gửi trả.

**Chính sách đổi trả được áp dụng khi:**

Ngoài các lỗi do nhà sản xuất nêu ở trên, chúng tôi chấp nhận đổi trả nếu hàng giao không đúng mẫu mã, sai size, sai màu hoặc sai chất liệu so với trên web.

1. Hỗ trợ đổi size KHÔNG mất thêm phụ phí, khách hàng vui lòng thanh toán phí ship 2 chiều.
2. Trường hợp không còn size để đổi, khách hàng được đổi 1 lần duy nhất sang mẫu giày khác có giá trị không thấp hơn sản phẩm đã mua.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'doi-tra-bao-hanh' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_bao_mat_thong_tin', 'bao-mat-thong-tin', 'Bảo mật thông tin', 'Thông tin khách hàng (họ tên, số điện thoại, địa chỉ, email) chỉ được sử dụng để xử lý đơn hàng, giao hàng và liên hệ khi cần.

TAT Sneaker không chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ trường hợp cần thiết để hoàn tất việc giao hàng (đơn vị vận chuyển) hoặc thanh toán (ngân hàng, PayPal).

Khi đăng nhập bằng Google hoặc Facebook, shop chỉ nhận tên, email và ảnh đại diện để tạo tài khoản — không nhận mật khẩu của bạn.

Khách hàng có thể liên hệ để yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân đã cung cấp.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'bao-mat-thong-tin' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_dieu_khoan_su_dung', 'dieu-khoan-su-dung', 'Điều khoản sử dụng', 'Khi đặt hàng tại TAT Sneaker, khách hàng đồng ý cung cấp thông tin chính xác để việc giao nhận diễn ra thuận lợi.

Giá sản phẩm và phí vận chuyển (nếu có) được hiển thị rõ ở bước thanh toán trước khi khách xác nhận đặt hàng.

TAT Sneaker có quyền từ chối đơn hàng trong trường hợp sản phẩm hết hàng đột xuất hoặc thông tin đặt hàng không hợp lệ, và sẽ liên hệ khách hàng để xử lý (hoàn lại tiền đã thanh toán nếu có).', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'dieu-khoan-su-dung' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_huong_dan_dat_hang', 'huong-dan-dat-hang', 'Hướng dẫn đặt hàng', '1. Chọn sản phẩm và size còn hàng, bấm "Thêm vào giỏ hàng" hoặc "Mua ngay".
2. Kiểm tra giỏ hàng, điều chỉnh số lượng nếu cần.
3. Điền thông tin người nhận (họ tên, số điện thoại, địa chỉ) tại trang Thanh toán.
4. Chọn cách thanh toán và xác nhận đơn hàng — nhân viên TAT Sneaker sẽ liên hệ xác nhận trước khi giao.

Sau khi đặt, bạn có thể xem tình trạng đơn bất cứ lúc nào tại mục **Tra cứu đơn hàng** bằng mã đơn và email đặt hàng.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'huong-dan-dat-hang' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_huong_dan_thanh_toan', 'huong-dan-thanh-toan', 'Hướng dẫn thanh toán', 'TAT Sneaker nhận các hình thức thanh toán sau (hiện ở bước Thanh toán tùy theo đơn hàng):

**Thanh toán khi nhận hàng (COD):** khách kiểm tra sản phẩm khi nhận và thanh toán trực tiếp cho nhân viên giao hàng.

**Chuyển khoản ngân hàng:** quét mã QR hiện ở bước thanh toán — số tiền và nội dung chuyển khoản đã được điền sẵn. Shop xác nhận ngay khi nhận được tiền.

**Đặt cọc:** với sản phẩm cần đặt cọc (thường là hàng đặt trước), khách chuyển khoản trước số tiền cọc ghi trên trang sản phẩm, phần còn lại thanh toán khi nhận hàng.

**PayPal:** dành cho khách ở nước ngoài.

Số tiền thanh toán đúng bằng tổng tiền hiển thị trên đơn hàng.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'huong-dan-thanh-toan' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_van_chuyen', 'van-chuyen', 'Vận chuyển', 'TAT Sneaker giao hàng toàn quốc thông qua các đơn vị vận chuyển uy tín.

Thời gian giao hàng dự kiến 2-5 ngày làm việc tùy khu vực. Sản phẩm đặt trước có thời gian về hàng riêng, được ghi rõ trên trang sản phẩm.

Đơn hàng được đóng gói cẩn thận, kèm mã đơn để khách hàng tiện theo dõi tại mục Tra cứu đơn hàng.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'van-chuyen' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_gioi_thieu', 'gioi-thieu', 'Giới thiệu', 'TAT Sneaker là địa chỉ chuyên giày sneaker chính hãng, mỗi đôi đều qua kiểm định 3 bước trước khi lên kệ.

Chúng tôi hướng đến việc mang lại trải nghiệm mua sắm sneaker minh bạch: rõ mã SKU, rõ tình trạng, rõ size còn hàng — khách hàng không cần hỏi lại.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'gioi-thieu' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_tuyen_dung', 'tuyen-dung', 'Tuyển dụng', 'TAT Sneaker hiện chưa có vị trí tuyển dụng nào được đăng công khai.

Nếu bạn quan tâm đến cơ hội làm việc cùng chúng tôi, vui lòng gửi thông tin qua mục Liên hệ — chúng tôi sẽ phản hồi khi có vị trí phù hợp.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'tuyen-dung' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_shoes_lien_he', 'lien-he', 'Liên hệ', 'Bạn có câu hỏi về sản phẩm hoặc đơn hàng? Liên hệ với TAT Sneaker qua thông tin bên dưới, hoặc nhắn tin trực tiếp qua Messenger / Zalo ở góc màn hình.', 'SHOES', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'lien-he' AND "department" = 'SHOES');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_doi_tra_bao_hanh', 'doi-tra-bao-hanh', 'Chính sách đổi trả & bảo hành', 'Shop chỉ chấp nhận bảo hành, đổi trả khi đã xác nhận sản phẩm được mua tại trang web hoặc tại cửa hàng TAT STORE.
**Lưu ý**: Khi Quý khách đã mua tại cửa hàng, đã kiểm tra hàng và nhận hóa đơn khỏi cửa hàng, chúng tôi sẽ không có trách nhiệm đổi trả hàng.

Quy định đổi trả hàng có hiệu lực trong vòng **10 ngày kể từ ngày mua sản phẩm**.

Sản phẩm đổi phải trong tình trạng mới 100%: chưa mặc, chưa giặt, không có mùi lạ hay vết bẩn, còn nguyên tem nhãn, túi đựng và các giấy tờ kèm theo khi mua hàng.

**Chính sách bảo hành khi mua sắm tại TAT STORE:**

Sản phẩm được bảo hành với lỗi của nhà sản xuất như bung chỉ, đứt đường may, hỏng khóa kéo hoặc cúc.
Thời gian bảo hành cho tất cả các sản phẩm là 10 ngày kể từ ngày nhận hàng.
Thời gian xử lý bảo hành từ 5-7 ngày làm việc. Ngay khi hoàn tất bảo hành, shop sẽ liên hệ để gửi trả.

**Chính sách đổi trả được áp dụng khi:**

Ngoài các lỗi do nhà sản xuất nêu ở trên, chúng tôi chấp nhận đổi trả nếu hàng giao không đúng mẫu mã, sai size, sai màu hoặc sai chất liệu so với trên web.

1. Hỗ trợ đổi size KHÔNG mất thêm phụ phí, khách hàng vui lòng thanh toán phí ship 2 chiều.
2. Trường hợp không còn size để đổi, khách hàng được đổi 1 lần duy nhất sang mẫu khác có giá trị không thấp hơn sản phẩm đã mua.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'doi-tra-bao-hanh' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_bao_mat_thong_tin', 'bao-mat-thong-tin', 'Bảo mật thông tin', 'Thông tin khách hàng (họ tên, số điện thoại, địa chỉ, email) chỉ được sử dụng để xử lý đơn hàng, giao hàng và liên hệ khi cần.

TAT STORE không chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ trường hợp cần thiết để hoàn tất việc giao hàng (đơn vị vận chuyển) hoặc thanh toán (ngân hàng, PayPal).

Khi đăng nhập bằng Google hoặc Facebook, shop chỉ nhận tên, email và ảnh đại diện để tạo tài khoản — không nhận mật khẩu của bạn.

Khách hàng có thể liên hệ để yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân đã cung cấp.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'bao-mat-thong-tin' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_dieu_khoan_su_dung', 'dieu-khoan-su-dung', 'Điều khoản sử dụng', 'Khi đặt hàng tại TAT STORE, khách hàng đồng ý cung cấp thông tin chính xác để việc giao nhận diễn ra thuận lợi.

Giá sản phẩm và phí vận chuyển (nếu có) được hiển thị rõ ở bước thanh toán trước khi khách xác nhận đặt hàng.

TAT STORE có quyền từ chối đơn hàng trong trường hợp sản phẩm hết hàng đột xuất hoặc thông tin đặt hàng không hợp lệ, và sẽ liên hệ khách hàng để xử lý (hoàn lại tiền đã thanh toán nếu có).', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'dieu-khoan-su-dung' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_huong_dan_dat_hang', 'huong-dan-dat-hang', 'Hướng dẫn đặt hàng', '1. Chọn sản phẩm và size còn hàng, bấm "Thêm vào giỏ hàng" hoặc "Mua ngay".
2. Kiểm tra giỏ hàng, điều chỉnh số lượng nếu cần.
3. Điền thông tin người nhận (họ tên, số điện thoại, địa chỉ) tại trang Thanh toán.
4. Chọn cách thanh toán và xác nhận đơn hàng — nhân viên TAT STORE sẽ liên hệ xác nhận trước khi giao.

Sau khi đặt, bạn có thể xem tình trạng đơn bất cứ lúc nào tại mục **Tra cứu đơn hàng** bằng mã đơn và email đặt hàng.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'huong-dan-dat-hang' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_huong_dan_thanh_toan', 'huong-dan-thanh-toan', 'Hướng dẫn thanh toán', 'TAT STORE nhận các hình thức thanh toán sau (hiện ở bước Thanh toán tùy theo đơn hàng):

**Thanh toán khi nhận hàng (COD):** khách kiểm tra sản phẩm khi nhận và thanh toán trực tiếp cho nhân viên giao hàng.

**Chuyển khoản ngân hàng:** quét mã QR hiện ở bước thanh toán — số tiền và nội dung chuyển khoản đã được điền sẵn. Shop xác nhận ngay khi nhận được tiền.

**Đặt cọc:** với sản phẩm cần đặt cọc (thường là hàng đặt trước), khách chuyển khoản trước số tiền cọc ghi trên trang sản phẩm, phần còn lại thanh toán khi nhận hàng.

**PayPal:** dành cho khách ở nước ngoài.

Số tiền thanh toán đúng bằng tổng tiền hiển thị trên đơn hàng.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'huong-dan-thanh-toan' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_van_chuyen', 'van-chuyen', 'Vận chuyển', 'TAT STORE giao hàng toàn quốc thông qua các đơn vị vận chuyển uy tín.

Thời gian giao hàng dự kiến 2-5 ngày làm việc tùy khu vực. Sản phẩm đặt trước có thời gian về hàng riêng, được ghi rõ trên trang sản phẩm.

Đơn hàng được đóng gói cẩn thận, kèm mã đơn để khách hàng tiện theo dõi tại mục Tra cứu đơn hàng.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'van-chuyen' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_gioi_thieu', 'gioi-thieu', 'Giới thiệu', 'TAT STORE là cửa hàng quần áo của TAT — cùng nhà với TAT Sneaker.

Mỗi món đồ đều được chọn kỹ về chất liệu, đường may và phom dáng trước khi lên kệ, để có thể ở lại lâu trong tủ đồ của bạn.

Trên từng sản phẩm đều ghi rõ mã SKU, tình trạng và size còn hàng — bạn chọn nhanh mà không cần hỏi lại.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'gioi-thieu' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_tuyen_dung', 'tuyen-dung', 'Tuyển dụng', 'TAT STORE hiện chưa có vị trí tuyển dụng nào được đăng công khai.

Nếu bạn quan tâm đến cơ hội làm việc cùng chúng tôi, vui lòng gửi thông tin qua mục Liên hệ — chúng tôi sẽ phản hồi khi có vị trí phù hợp.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'tuyen-dung' AND "department" = 'CLOTHING');

INSERT INTO "StaticPage" ("id", "slug", "title", "content", "department", "updatedAt")
SELECT 'footerpage_clothing_lien_he', 'lien-he', 'Liên hệ', 'Bạn có câu hỏi về sản phẩm, size hay đơn hàng? Liên hệ với TAT STORE qua thông tin bên dưới.', 'CLOTHING', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "StaticPage" WHERE "slug" = 'lien-he' AND "department" = 'CLOTHING');
