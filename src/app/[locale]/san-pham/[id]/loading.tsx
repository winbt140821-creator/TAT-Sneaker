import { Header } from "@/components/Header";
import { getDepartment } from "@/lib/department";
import { ProductPageSkeleton } from "./ProductPageSkeleton";

// Shown the moment a product is tapped, until the page arrives — see
// ProductPageSkeleton. The real header stays in place so the tap feels like
// the page opened, not like the site went blank.
export default async function ProductLoading() {
  const department = await getDepartment();
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProductPageSkeleton department={department} />
      </main>
    </>
  );
}
