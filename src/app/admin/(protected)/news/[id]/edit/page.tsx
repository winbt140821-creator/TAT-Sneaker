import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateNewsAction } from "../../actions";
import { NewsForm } from "../../NewsForm";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa bài viết</h1>
      <div className="mt-6">
        <NewsForm
          action={updateNewsAction.bind(null, article.id)}
          defaultValues={article}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
