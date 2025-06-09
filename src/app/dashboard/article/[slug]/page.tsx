import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import { ArticleViewContent } from '@/components/article-view-content';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Artículo no encontrado - Mi Asesor Vial',
    };
  }

  return {
    title: `${article.title} - Mi Asesor Vial`,
    description: article.shortDescription,
  };
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);

  console.log("Fetched article:", JSON.stringify(article, null, 2)); // Add this line
  if (!article) {
    notFound();
  }

  return <ArticleViewContent article={article} />;
}
