
export interface Article {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  imageUrl: string;
  imageHint: string;
  content: {
    introduction: string;
    points: string[];
    conclusion?: string;
  };
  readMoreLink?: string;
  favoriteCount: number;
}

export interface TrafficInfraction {
  id: string;
  name: string;
}

