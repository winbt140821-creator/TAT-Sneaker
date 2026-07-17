import { getSiteSettings } from "@/lib/settings";
import { getLiveExchangeRates } from "@/lib/fx";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SelectField } from "@/components/admin/form/SelectField";
import { SingleImageUploadForm } from "@/components/admin/form/SingleImageUploadForm";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { VIETQR_BANKS } from "@/lib/vietqr-banks";
import {
  updateVnpayQrAction,
  updatePaypalQrAction,
  updateBankTransferQrAction,
  updateBankTransferInfoAction,
  updateCodOptionAction,
  updateAutoCancelHoursAction,
  updateAutoCancelCodHoursAction,
} from "../actions";

function formatRate(rate: number | null) {
  return rate ? new Intl.NumberFormat("vi-VN").format(Math.round(rate)) : null;
}

export default async function AdminSettingsPaymentsPage() {
  const [settings, rates] = await Promise.all([getSiteSettings(), getLiveExchangeRates()]);
  // Back-compat: accounts configured before the bank dropdown existed only
  // have a free-text bankName saved — best-effort match it to a bin so the
  // select doesn't look reset to "— Chọn ngân hàng —" the first time this
  // page loads for them.
  const bankBinDefault =
    settings?.bankBin ??
    VIETQR_BANKS.find((b) => b.name.toLowerCase() === settings?.bankName?.toLowerCase())?.bin ??
    "";

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-xl text-ink">Chuyển khoản ngân hàng</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Hiện ở trang thanh toán khi khách chọn trả bằng chuyển khoản — khách tự chuyển
          theo thông tin này, bạn vào Đơn hàng đánh dấu &quot;Đã thanh toán&quot; sau khi
          nhận được tiền. Chọn đúng ngân hàng từ danh sách để hệ thống tạo mã QR
          (VietQR) tự động điền sẵn đúng số tiền cần chuyển cho khách.
        </p>

        <form action={updateBankTransferInfoAction} className="mt-6 flex max-w-md flex-col gap-4">
          <SelectField
            id="bankBin"
            name="bankBin"
            label="Ngân hàng"
            defaultValue={bankBinDefault}
          >
            <option value="">— Chọn ngân hàng —</option>
            {VIETQR_BANKS.map((b) => (
              <option key={b.bin} value={b.bin}>
                {b.name}
              </option>
            ))}
          </SelectField>
          <TextField
            id="bankAccountNumber"
            name="bankAccountNumber"
            label="Số tài khoản"
            defaultValue={settings?.bankAccountNumber ?? ""}
          />
          <TextField
            id="bankAccountHolder"
            name="bankAccountHolder"
            label="Tên chủ tài khoản"
            placeholder="VIẾT HOA KHÔNG DẤU, giống trên thẻ/sổ"
            defaultValue={settings?.bankAccountHolder ?? ""}
          />
          <SubmitButton>Lưu thay đổi</SubmitButton>
        </form>

        <SingleImageUploadForm
          action={updateBankTransferQrAction}
          id="bankTransferQrImage"
          name="image"
          label={settings?.bankTransferQrUrl ? "Thay mã QR mới" : "Tải lên mã QR (tùy chọn)"}
          currentUrl={settings?.bankTransferQrUrl}
          currentAlt="Mã QR chuyển khoản hiện tại"
          previewWidth={200}
          previewHeight={200}
          previewClassName="die-cut h-auto w-full max-w-[200px] object-cover"
          removeFieldName="remove"
          removeLabel="Gỡ mã QR"
          unoptimized
          extra={
            <p className="font-mono text-[10px] text-graphite">
              Có thể tự tạo mã QR chuyển khoản nhanh (VietQR) rồi tải lên đây — không bắt buộc,
              khách vẫn chuyển được bằng số tài khoản phía trên nếu bỏ trống.
            </p>
          }
        />
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Nội dung mục &quot;Thanh toán khi nhận hàng (COD)&quot;</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Tự viết tiêu đề và mô tả cho mục này ở trang thanh toán và trang xác nhận đơn hàng —
          ví dụ nêu rõ % đặt cọc, chính sách hoàn cọc... Để trống thì hệ thống tự hiện thông
          tin đặt cọc + chuyển khoản mặc định như hiện tại.
        </p>

        <form action={updateCodOptionAction} className="mt-6 flex max-w-md flex-col gap-4">
          <TextField
            id="codOptionTitle"
            name="codOptionTitle"
            label="Tiêu đề"
            placeholder="VD: Hỗ trợ đặt cọc 30% qua Zalo – Nhận hàng sau 6-10 ngày"
            defaultValue={settings?.codOptionTitle ?? ""}
          />
          <TextAreaField
            id="codOptionNote"
            name="codOptionNote"
            label="Mô tả chi tiết"
            rows={5}
            placeholder="VD: Để đảm bảo đơn hàng được xử lý nhanh chóng, vui lòng đặt cọc 30% giá trị đơn hàng khi xác nhận đặt mua. Phần còn lại thanh toán khi nhận hàng (COD)."
            defaultValue={settings?.codOptionNote ?? ""}
          />
          <TextField
            id="codOptionZaloPhone"
            name="codOptionZaloPhone"
            label="Số Zalo hỗ trợ (hiện nút bấm-là-chat)"
            type="tel"
            placeholder="VD: 0393002410"
            defaultValue={settings?.codOptionZaloPhone ?? ""}
          />
          <SubmitButton className="mt-1 w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60">
            Lưu thay đổi
          </SubmitButton>
        </form>
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Mã QR đặt cọc — VNPay</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          VNPay đang tạm ẩn khỏi trang đặt hàng nên mã QR này chưa hiển thị cho khách — giữ lại
          phần này để bạn có thể bật lại VNPay sau khi có tài khoản VNPay Sandbox/thật.
        </p>

        <SingleImageUploadForm
          action={updateVnpayQrAction}
          id="vnpayQrImage"
          name="image"
          label={settings?.vnpayQrUrl ? "Thay mã QR mới" : "Tải lên mã QR"}
          currentUrl={settings?.vnpayQrUrl}
          currentAlt="Mã QR VNPay hiện tại"
          previewWidth={200}
          previewHeight={200}
          previewClassName="die-cut h-auto w-full max-w-[200px] object-cover"
          removeFieldName="remove"
          removeLabel="Gỡ mã QR"
          unoptimized
        />
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Mã QR đặt cọc — PayPal</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Hiện khi khách chọn thanh toán cọc qua PayPal ở trang thanh toán, cho những đơn hàng cần
          đặt cọc trước.
        </p>

        <SingleImageUploadForm
          action={updatePaypalQrAction}
          id="paypalQrImage"
          name="image"
          label={settings?.paypalQrUrl ? "Thay mã QR mới" : "Tải lên mã QR"}
          currentUrl={settings?.paypalQrUrl}
          currentAlt="Mã QR PayPal hiện tại"
          previewWidth={200}
          previewHeight={200}
          previewClassName="die-cut h-auto w-full max-w-[200px] object-cover"
          removeFieldName="remove"
          removeLabel="Gỡ mã QR"
          unoptimized
        />
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Tỷ giá USD / CNY</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Tự động lấy theo tỷ giá thị trường thực tế (cập nhật mỗi giờ), dùng để hiện giá
          USD/CNY cho khách xem trang bằng tiếng Anh/Trung và để quy đổi tiền khi thanh
          toán qua PayPal. Không còn nhập tay — nếu API tỷ giá tạm thời không truy cập
          được, hệ thống dùng lại giá trị đã lấy được gần nhất.
        </p>

        <div className="mt-4 flex max-w-xs flex-col gap-2 font-mono text-sm text-ink">
          <p>
            1 USD = {formatRate(rates.usdExchangeRate) ?? "—"}₫
          </p>
          <p>
            1 CNY = {formatRate(rates.cnyExchangeRate) ?? "—"}₫
          </p>
        </div>
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Tự động hủy đơn chưa đặt cọc</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Đơn hàng cần đặt cọc (bắt buộc theo sản phẩm, hoặc khách chọn trả toàn bộ online)
          nhưng chưa thanh toán sau số giờ này sẽ tự động chuyển sang &quot;Đã hủy&quot;. Để
          trống để tắt tính năng này — bạn tự hủy đơn thủ công.
        </p>

        <form action={updateAutoCancelHoursAction} className="mt-6 flex max-w-xs flex-col gap-1.5">
          <TextField
            id="autoCancelUnpaidDepositHours"
            name="autoCancelUnpaidDepositHours"
            label="Số giờ trước khi tự hủy"
            type="number"
            min={1}
            step={1}
            placeholder="Để trống = tắt"
            defaultValue={settings?.autoCancelUnpaidDepositHours ?? ""}
          />
          <SubmitButton className="mt-3 w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60">
            Lưu thay đổi
          </SubmitButton>
        </form>
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Tự động hủy đơn COD chưa xác nhận</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Đơn thanh toán khi nhận hàng (COD) mà nhân viên chưa xác nhận sau số giờ này sẽ tự
          động chuyển sang &quot;Đã hủy&quot; và trả lại tồn kho. Vì thanh toán không yêu cầu đăng
          nhập, đây cũng là lớp bảo vệ chống spam đặt đơn ảo để chiếm tồn kho. Để trống để tắt
          tính năng này.
        </p>

        <form action={updateAutoCancelCodHoursAction} className="mt-6 flex max-w-xs flex-col gap-1.5">
          <TextField
            id="autoCancelUnpaidCodHours"
            name="autoCancelUnpaidCodHours"
            label="Số giờ trước khi tự hủy"
            type="number"
            min={1}
            step={1}
            placeholder="Để trống = tắt"
            defaultValue={settings?.autoCancelUnpaidCodHours ?? ""}
          />
          <SubmitButton className="mt-3 w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60">
            Lưu thay đổi
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
