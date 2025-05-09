import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Link2, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ArticleViewContentProps {
  article: Article;
}

export function ArticleViewContent({ article }: ArticleViewContentProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard" className="mb-8 inline-flex items-center text-primary hover:underline animate-in fade-in-0 slide-in-from-left-5 duration-500">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Panel
      </Link>

      <Card className="shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-97 duration-500 delay-100">
        <CardHeader className="p-0 ">
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={article.imageHint}
              priority 
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-300">
            <Badge variant="outline" className="flex items-center gap-1">
                <Tag size={14} /> {article.category}
            </Badge>
            {/* Placeholder for date if available */}
            {/* <span className="text-sm text-muted-foreground">Publicado el DD/MM/AAAA</span> */}
          </div>

          <CardTitle className="text-3xl md:text-4xl font-bold mb-4 text-primary animate-in fade-in-0 slide-in-from-top-3 duration-500 delay-400">
            {article.title}
          </CardTitle>
          
          <Separator className="my-6 animate-in fade-in-0 duration-500 delay-500" />

          <div className="prose prose-lg max-w-none text-foreground/90 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-600">
            <p className="lead text-lg mb-6">{article.content.introduction}</p>
            
            {article.content.points && article.content.points.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary/90 flex items-center ">
                  <BookOpen className="mr-2 h-5 w-5" /> Puntos Clave:
                </h3>
                <ul className="list-disc space-y-2 pl-5 mb-6">
                  {article.content.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </>
            )}

            {article.content.conclusion && (
              <p className="mt-6 border-l-4 border-primary pl-4 italic text-foreground/80">{article.content.conclusion}</p>
            )}
          </div>

          {article.readMoreLink && article.readMoreLink !== '#' && (
            <div className="mt-10 text-center animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-700">
              <Button asChild size="lg" variant="outline">
                <a href={article.readMoreLink} target="_blank" rel="noopener noreferrer">
                  <Link2 className="mr-2 h-5 w-5" />
                  Leer Más (Fuente Externa)
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
