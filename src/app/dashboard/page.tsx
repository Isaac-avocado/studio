import { getAllArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/article-card';
import { AiSuggester } from '@/components/ai-suggester';
import { Newspaper, Lightbulb } from 'lucide-react';

export const metadata = {
  title: 'Panel Principal - Mi Asesor Vial',
  description: 'Explora artículos sobre seguridad vial y obtén consejos de nuestra IA.',
};

export default function DashboardPage() {
  const articles = getAllArticles();

  return (
    <div className="bg-[hsl(var(--dashboard-background))] text-[hsl(var(--dashboard-foreground))] -m-4 md:-m-8 p-4 md:p-8 min-h-[calc(100vh-var(--header-height,10rem))] rounded-lg shadow-inner">
      <div className="container mx-auto">
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-10 h-10 text-primary-foreground drop-shadow-sm" />
            <h2 className="text-3xl font-bold text-primary-foreground drop-shadow-sm">Asesoría con IA</h2>
          </div>
          <AiSuggester />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
             <Newspaper className="w-10 h-10 text-primary-foreground drop-shadow-sm" />
            <h2 className="text-3xl font-bold text-primary-foreground drop-shadow-sm">Artículos Destacados</h2>
          </div>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-primary-foreground/80">No hay artículos disponibles en este momento.</p>
          )}
        </section>
      </div>
    </div>
  );
}
