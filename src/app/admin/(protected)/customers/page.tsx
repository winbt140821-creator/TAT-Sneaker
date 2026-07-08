import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
};

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const searchWhere = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { addresses: { some: { phone: { contains: query } } } },
        ],
      }
    : {};

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where: searchWhere,
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        _count: { select: { orders: true, addresses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where: searchWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Khách hàng</h1>

      <form action="/admin/customers" method="GET" className="mt-4 flex max-w-md gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Tìm theo tên, email hoặc SĐT..."
          className="die-cut-flat flex-1 bg-paper px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          Tìm
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {customers.length === 0 && (
          <p className="font-mono text-sm text-graphite">
            {query ? "Không tìm thấy khách hàng phù hợp." : "Chưa có khách hàng nào."}
          </p>
        )}
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/admin/customers/${customer.id}`}
            className="die-cut flex flex-wrap items-center justify-between gap-3 bg-paper p-4 transition-colors hover:bg-kraft-dark/10"
          >
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-ink">
                {customer.name || "Chưa đặt tên"}
              </p>
              <p className="truncate font-mono text-xs text-graphite">{customer.email}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide bg-kraft-dark/30 text-ink">
                {PROVIDER_LABEL[customer.provider] ?? customer.provider}
              </span>
              <span className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide bg-ink text-paper">
                {customer._count.orders} đơn hàng
              </span>
              <span className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide bg-graphite text-paper">
                {customer._count.addresses} địa chỉ
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/customers?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`}
              aria-current={p === page ? "page" : undefined}
              className={
                "die-cut-flat flex h-9 w-9 cursor-pointer items-center justify-center font-mono text-sm " +
                (p === page ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-kraft-dark/40")
              }
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
