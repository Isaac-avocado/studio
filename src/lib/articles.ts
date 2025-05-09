import type { Article, TrafficInfraction } from '@/types';

const articles: Article[] = [
  {
    slug: 'understanding-speed-limits',
    title: 'Understanding Speed Limits and Consequences',
    shortDescription: 'Learn about different speed limits and the potential penalties for exceeding them.',
    category: 'Regulations & Infractions',
    imageUrl: 'https://picsum.photos/seed/speeding/600/400',
    imageHint: 'road speed',
    content: {
      introduction: 'Speed limits are crucial for road safety. Understanding them helps prevent accidents and fines. This article explores the types of speed limits and the consequences of violations.',
      points: [
        'Urban vs. highway speed limits.',
        'Factors affecting speed limit changes (school zones, construction).',
        'Fines and points on license for speeding.',
        'Impact of speeding on accident severity.',
      ],
      conclusion: 'Adhering to speed limits is a responsibility every driver shares to ensure safer roads for everyone.',
    },
    readMoreLink: '#',
  },
  {
    slug: 'importance-of-traffic-lights',
    title: 'The Importance of Traffic Light Signals',
    shortDescription: 'Discover why traffic lights are essential for orderly traffic flow and preventing collisions.',
    category: 'Road Safety',
    imageUrl: 'https://picsum.photos/seed/trafficlight/600/400',
    imageHint: 'traffic light',
    content: {
      introduction: 'Traffic lights are fundamental to managing intersections and pedestrian crossings. This article explains their significance and how to interpret signals correctly.',
      points: [
        'Meaning of red, yellow, and green lights.',
        'Right-of-way at intersections with traffic lights.',
        'Consequences of running a red light.',
        'Pedestrian signals and safety.',
      ],
      conclusion: 'Respecting traffic signals is paramount for maintaining order and safety on our roads.',
    },
  },
  {
    slug: 'safe-parking-practices',
    title: 'Safe Parking Practices to Avoid Fines',
    shortDescription: 'Master the rules of safe and legal parking to prevent tickets and ensure accessibility.',
    category: 'Obligations',
    imageUrl: 'https://picsum.photos/seed/parking/600/400',
    imageHint: 'parking car',
    content: {
      introduction: 'Parking correctly is as important as driving safely. This guide covers common parking regulations and tips to avoid fines.',
      points: [
        'Understanding no-parking zones and signs.',
        'Parallel parking techniques and rules.',
        'Parking on hills and near fire hydrants.',
        'Disabled parking regulations and etiquette.',
      ],
      conclusion: 'Proper parking contributes to traffic flow and public safety. Always be mindful of parking signs and local ordinances.',
    },
    readMoreLink: '#',
  },
  {
    slug: 'risks-of-dui',
    title: 'Risks of Driving Under the Influence (DUI)',
    shortDescription: 'Understand the severe dangers and legal repercussions of driving under the influence of alcohol or drugs.',
    category: 'Infractions',
    imageUrl: 'https://picsum.photos/seed/dui/600/400',
    imageHint: 'driving danger',
    content: {
      introduction: 'Driving under the influence (DUI) is a critical offense with life-altering consequences. This article details the risks involved for yourself and others.',
      points: [
        'How alcohol and drugs impair driving ability.',
        'Legal blood alcohol concentration (BAC) limits.',
        'Penalties for DUI: fines, license suspension, jail time.',
        'Long-term impact of a DUI conviction.',
        'Alternatives to driving impaired.',
      ],
      conclusion: 'Never drive under the influence. Plan ahead for a safe ride home to protect lives.',
    },
    readMoreLink: '#',
  },
];

export const getAllArticles = (): Article[] => {
  return articles;
};

export const getArticleBySlug = (slug: string): Article | undefined => {
  return articles.find((article) => article.slug === slug);
};

export const commonTrafficInfractions: TrafficInfraction[] = [
  { id: 'speeding', name: 'Exceso de velocidad' },
  { id: 'red-light', name: 'No respetar semáforo en rojo' },
  { id: 'illegal-parking', name: 'Estacionamiento indebido' },
  { id: 'dui', name: 'Conducir bajo los efectos del alcohol' },
  { id: 'mobile-phone', name: 'Uso del teléfono móvil al conducir' },
  { id: 'seatbelt', name: 'No usar cinturón de seguridad' },
];
