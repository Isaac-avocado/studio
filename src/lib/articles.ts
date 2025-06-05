
import type { Article, TrafficInfraction, Category } from '@/types';

// Lista inicial de categorías. Idealmente, esto vendría de Firestore.
export const initialCategories: Category[] = [
  { id: 'reglamentos-infracciones', name: 'Reglamentos e Infracciones' },
  { id: 'seguridad-vial', name: 'Seguridad Vial' },
  { id: 'obligaciones', name: 'Obligaciones' },
  { id: 'infracciones-graves', name: 'Infracciones Graves' },
  { id: 'consejos-generales', name: 'Consejos Generales' },
];


const articlesData: Article[] = [
  {
    id: '1',
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
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
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
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
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
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'riesgos-manejar-influencia',
    title: 'Riesgos de Manejar Bajo la Influencia (DUI)',
    shortDescription: 'Comprende los graves peligros y las repercusiones legales de manejar bajo la influencia del alcohol o drogas.',
    category: 'Infracciones Graves', // Cambiado para usar una de las initialCategories
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
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'articulo-borrador-ejemplo',
    title: 'Ejemplo de Artículo en Borrador (Solo Admin)',
    shortDescription: 'Este es un artículo de ejemplo que está en estado de borrador y solo debería ser visible para administradores.',
    category: 'Consejos Generales',
    imageUrl: 'https://picsum.photos/seed/draft/600/400',
    imageHint: 'documento borrador',
    content: {
      introduction: 'Este artículo sirve como demostración de cómo se verían los artículos en borrador en la sección de administración.',
      points: [
        'Los borradores no son visibles para usuarios regulares.',
        'Los administradores pueden editarlos y publicarlos.',
        'Este es un punto de prueba.',
      ],
      conclusion: 'Próximamente más contenido aquí.',
    },
    readMoreLink: '#',
    favoriteCount: 5,
    status: 'draft', // Este es un borrador
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// TODO: Reemplazar esto con llamadas a Firestore
export const getAllArticles = (): Article[] => {
  // En un futuro, esto obtendría artículos de Firestore.
  // Por ahora, para el dashboard de admin, podríamos filtrar por status.
  return articlesData;
};

export const getPublishedArticles = (): Article[] => {
  return articlesData.filter(article => article.status === 'published');
};

export const getDraftArticles = (): Article[] => {
  return articlesData.filter(article => article.status === 'draft');
};

export const getArticleBySlug = (slug: string): Article | undefined => {
  // Esto también necesitaría buscar en Firestore
  return articlesData.find((article) => article.slug === slug);
};

export const getCategories = (): Category[] => {
    return initialCategories;
}

export const commonTrafficInfractions: TrafficInfraction[] = [
  { id: 'speeding', name: 'Exceso de velocidad' },
  { id: 'red-light', name: 'No respetar semáforo en rojo' },
  { id: 'illegal-parking', name: 'Estacionamiento en lugar prohibido' },
  { id: 'dui', name: 'Manejar bajo los efectos del alcohol o drogas' },
  { id: 'mobile-phone', name: 'Uso del celular al manejar' },
  { id: 'seatbelt', name: 'No usar cinturón de seguridad' },
];
