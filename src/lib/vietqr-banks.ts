// Curated list of Vietnamese banks supported by the VietQR.io quick-link
// image API (img.vietqr.io) — the BIN is the Napas bank identifier VietQR
// needs to render a scannable QR that pre-fills the transfer amount.
export const VIETQR_BANKS: { bin: string; name: string }[] = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970437", name: "HDBank" },
  { bin: "970443", name: "SHB" },
  { bin: "970441", name: "VIB" },
  { bin: "970440", name: "SeABank" },
  { bin: "970448", name: "OCB" },
  { bin: "970426", name: "MSB" },
  { bin: "970431", name: "Eximbank" },
  { bin: "970429", name: "SCB" },
  { bin: "970428", name: "Nam A Bank" },
  { bin: "970425", name: "ABBank" },
  { bin: "970409", name: "Bac A Bank" },
  { bin: "970412", name: "PVcomBank" },
  { bin: "970454", name: "Viet Capital Bank (Bản Việt)" },
  { bin: "970449", name: "LienVietPostBank" },
  { bin: "970452", name: "KienLongBank" },
  { bin: "970406", name: "DongA Bank" },
  { bin: "970438", name: "BaoViet Bank" },
  { bin: "970433", name: "VietBank" },
  { bin: "970430", name: "PGBank" },
  { bin: "970400", name: "SaigonBank" },
];

export function getBankByBin(bin: string): { bin: string; name: string } | undefined {
  return VIETQR_BANKS.find((b) => b.bin === bin);
}

export function buildVietQrUrl({
  bin,
  accountNumber,
  accountName,
  amount,
  addInfo,
}: {
  bin: string;
  accountNumber: string;
  accountName?: string | null;
  amount: number;
  addInfo: string;
}): string {
  const params = new URLSearchParams({ amount: String(amount), addInfo });
  if (accountName) params.set("accountName", accountName);
  return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?${params.toString()}`;
}
