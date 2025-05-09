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
  const article = getArticleBySlug(params.slug);

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
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return <ArticleViewContent article={article} />;
}
