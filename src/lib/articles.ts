import type { Article, TrafficInfraction } from '@/types';

const articles: Article[] = [
  {
    slug: 'entendiendo-limites-velocidad',
    title: 'Entendiendo los Límites de Velocidad y sus Consecuencias',
    shortDescription: 'Conoce los diferentes límites de velocidad y las posibles multas por excederlos.',
    category: 'Reglamentos e Infracciones',
    imageUrl: 'https://picsum.photos/seed/speeding/600/400',
    imageHint: 'carretera velocidad',
    content: {
      introduction: 'Los límites de velocidad son cruciales para la seguridad vial. Entenderlos ayuda a prevenir accidentes y multas. Este artículo explora los tipos de límites de velocidad y las consecuencias de las infracciones.',
      points: [
        'Límites de velocidad en zona urbana vs. carretera.',
        'Factores que afectan los cambios de límite de velocidad (zonas escolares, construcción).',
        'Multas y puntos en la licencia por exceso de velocidad.',
        'Impacto del exceso de velocidad en la gravedad de los accidentes.',
      ],
      conclusion: 'Respetar los límites de velocidad es una responsabilidad que cada conductor comparte para garantizar vialidades más seguras para todos.',
    },
    readMoreLink: '#',
    favoriteCount: 120,
  },
  {
    slug: 'importancia-semaforos',
    title: 'La Importancia de las Señales del Semáforo',
    shortDescription: 'Descubre por qué los semáforos son esenciales para un flujo vehicular ordenado y para prevenir choques.',
    category: 'Seguridad Vial',
    imageUrl: 'https://picsum.photos/seed/trafficlight/600/400',
    imageHint: 'semaforo calle',
    content: {
      introduction: 'Los semáforos son fundamentales para administrar los cruces y los pasos de peatones. Este artículo explica su importancia y cómo interpretar correctamente las señales.',
      points: [
        'Significado de las luces roja, amarilla y verde.',
        'Derecho de paso en cruces con semáforos.',
        'Consecuencias de pasarse un semáforo en rojo.',
        'Señales peatonales y seguridad.',
      ],
      conclusion: 'Respetar las señales de tránsito es fundamental para mantener el orden y la seguridad en nuestras vialidades.',
    },
    readMoreLink: '#',
    favoriteCount: 95,
  },
  {
    slug: 'practicas-estacionamiento-seguro',
    title: 'Prácticas de Estacionamiento Seguro para Evitar Multas',
    shortDescription: 'Domina las reglas de estacionamiento seguro y legal para evitar infracciones y garantizar la accesibilidad.',
    category: 'Obligaciones',
    imageUrl: 'https://picsum.photos/seed/parking/600/400',
    imageHint: 'auto estacionado',
    content: {
      introduction: 'Estacionarse correctamente es tan importante como manejar de forma segura. Esta guía cubre regulaciones comunes de estacionamiento y consejos para evitar multas.',
      points: [
        'Entender las zonas de no estacionarse y las señales.',
        'Técnicas y reglas para estacionarse en paralelo.',
        'Estacionamiento en pendientes y cerca de hidrantes.',
        'Reglamento de estacionamiento para personas con discapacidad y etiqueta.',
      ],
      conclusion: 'El estacionamiento adecuado contribuye al flujo vehicular y la seguridad pública. Siempre pon atención a las señales de estacionamiento y las ordenanzas locales.',
    },
    readMoreLink: '#',
    favoriteCount: 78,
  },
  {
    slug: 'riesgos-manejar-influencia',
    title: 'Riesgos de Manejar Bajo la Influencia (DUI)',
    shortDescription: 'Comprende los graves peligros y las repercusiones legales de manejar bajo la influencia del alcohol o drogas.',
    category: 'Infracciones',
    imageUrl: 'https://picsum.photos/seed/dui/600/400',
    imageHint: 'peligro volante',
    content: {
      introduction: 'Manejar bajo la influencia (DUI, por sus siglas en inglés) es una falta grave con consecuencias que pueden cambiar la vida. Este artículo detalla los riesgos implicados para ti y para los demás.',
      points: [
        'Cómo el alcohol y las drogas afectan la habilidad para manejar.',
        'Límites legales de concentración de alcohol en la sangre (BAC).',
        'Sanciones por DUI: multas, suspensión de licencia, tiempo en cárcel.',
        'Impacto a largo plazo de una condena por DUI.',
        'Alternativas a manejar en estado inconveniente.',
      ],
      conclusion: 'Nunca manejes bajo la influencia. Planea con anticipación un transporte seguro a casa para proteger vidas.',
    },
    readMoreLink: '#',
    favoriteCount: 150,
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
  { id: 'illegal-parking', name: 'Estacionamiento en lugar prohibido' },
  { id: 'dui', name: 'Manejar bajo los efectos del alcohol o drogas' },
  { id: 'mobile-phone', name: 'Uso del celular al manejar' },
  { id: 'seatbelt', name: 'No usar cinturón de seguridad' },
];
