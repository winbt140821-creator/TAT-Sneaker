import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateStaticPageAction } from "../../actions";
import { PageForm } from "../../PageForm";

export default async function EditStaticPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa trang: {page.title}</h1>
      <div className="mt-6">
        <PageForm
          action={updateStaticPageAction.bind(null, page.id)}
          defaultValues={page}
        />
      </div>
    </div>
  );
}
