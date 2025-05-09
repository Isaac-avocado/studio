import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Tag } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={article.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="mb-2">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Tag size={14} /> {article.category}
          </Badge>
        </div>
        <CardTitle className="text-xl mb-2 line-clamp-2">{article.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {article.shortDescription}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Link href={`/dashboard/article/${article.slug}`} passHref legacyBehavior>
          <Button asChild className="w-full">
            <a>
              Ver Detalles
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
