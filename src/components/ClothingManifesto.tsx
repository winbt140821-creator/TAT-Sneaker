// A short brand-voice statement between the hero and the product rail —
// real fashion homepages give the story a beat before the grid starts.
// The copy itself is the parent brand's own real tagline ("Không rẻ nhất,
// nhưng đáng tiền nhất" — see src/lib/site-config.ts) translated into a
// garment-longevity claim, not generic aspirational filler.
export function ClothingManifesto() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-graphite">Tuyên ngôn</p>
      <p className="mx-auto mt-6 max-w-2xl font-display text-3xl italic leading-snug text-ink sm:text-5xl">
        Không phải kiểu rẻ nhất.
        <br />
        <span className="text-forest">Là kiểu còn mặc được sau mười năm.</span>
      </p>
      <p className="mx-auto mt-6 max-w-md font-body text-sm text-graphite">
        Từng đường may, chất vải và form dáng đều được kiểm tra trước khi lên kệ —
        cùng một tiêu chuẩn kiểm định chúng tôi áp dụng cho mỗi đôi giày.
      </p>
    </section>
  );
}
