export interface Category {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'food',
    label: 'Alimentos y Bebidas',
    color: '#f97316',
    bgColor: 'bg-orange-500/20',
    icon: '🍽️',
    keywords: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'sushi', 'taco', 'comida', 'bebida', 'super', 'walmart', 'oxxo', 'soriana'],
  },
  {
    id: 'transport',
    label: 'Transporte',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/20',
    icon: '🚗',
    keywords: ['uber', 'didi', 'taxi', 'gasolina', 'gas', 'shell', 'pemex', 'bp', 'transport', 'bus', 'metro', 'parking'],
  },
  {
    id: 'shopping',
    label: 'Compras',
    color: '#ec4899',
    bgColor: 'bg-pink-500/20',
    icon: '🛍️',
    keywords: ['amazon', 'mercadolibre', 'zara', 'h&m', 'tienda', 'ropa', 'zapatos', 'electronics', 'apple', 'samsung'],
  },
  {
    id: 'entertainment',
    label: 'Entretenimiento',
    color: '#a855f7',
    bgColor: 'bg-purple-500/20',
    icon: '🎬',
    keywords: ['netflix', 'spotify', 'cinema', 'cine', 'teatro', 'concierto', 'videojuego', 'steam', 'gaming'],
  },
  {
    id: 'health',
    label: 'Salud',
    color: '#10b981',
    bgColor: 'bg-emerald-500/20',
    icon: '🏥',
    keywords: ['farmacia', 'doctor', 'medico', 'hospital', 'clinica', 'gym', 'gimnasio', 'medicina', 'salud'],
  },
  {
    id: 'housing',
    label: 'Hogar y Servicios',
    color: '#84cc16',
    bgColor: 'bg-lime-500/20',
    icon: '🏠',
    keywords: ['renta', 'luz', 'cfe', 'agua', 'telmex', 'telcel', 'internet', 'gas natural', 'hogar', 'limpieza'],
  },
  {
    id: 'education',
    label: 'Educación',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/20',
    icon: '📚',
    keywords: ['escuela', 'universidad', 'colegio', 'curso', 'libro', 'udemy', 'coursera', 'educacion'],
  },
  {
    id: 'travel',
    label: 'Viajes',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/20',
    icon: '✈️',
    keywords: ['hotel', 'airbnb', 'vuelo', 'aeroméxico', 'volaris', 'viaje', 'travel', 'booking', 'airfare'],
  },
  {
    id: 'business',
    label: 'Negocios',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/20',
    icon: '💼',
    keywords: ['office', 'software', 'subscripcion', 'servicio', 'freelance', 'negocio', 'empresa'],
  },
  {
    id: 'other',
    label: 'Otros',
    color: '#94a3b8',
    bgColor: 'bg-slate-500/20',
    icon: '📦',
    keywords: [],
  },
];

export function getCategoryById(id: string, customCategories: Category[] = []): Category {
  return CATEGORIES.find((c) => c.id === id) ??
         customCategories.find((c) => c.id === id) ??
         CATEGORIES[CATEGORIES.length - 1];
}

export function autoDetectCategory(text: string, customCategories: Category[] = []): string {
  const lower = text.toLowerCase();
  const allCategories = [...CATEGORIES.slice(0, -1), ...customCategories];
  
  for (const category of allCategories) {
    // Manejar string separados por comas para compatibilidad con la base de datos
    const kwList = typeof category.keywords === 'string' 
      ? category.keywords.split(',').filter(Boolean) 
      : (category.keywords || []);
      
    if (kwList.some((kw) => lower.includes(kw.trim()))) {
      return category.id;
    }
  }
  return 'other';
}
