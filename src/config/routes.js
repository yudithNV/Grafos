import { Network, ArrowDownUp, ListOrdered, Layers, GitMerge, Share2 } from '@lucide/vue'

export const VIEW_ROUTES = {
  home: '/',
  teoria: '/teoria',
  interactivos: '/interactivos',
  about: '/about'
}

export const NAV_ITEMS = [
  { id: 'home', label: 'Inicio', route: VIEW_ROUTES.home },
  { id: 'teoria', label: 'Fundamentos', route: VIEW_ROUTES.teoria },
  { id: 'interactivos', label: 'Algoritmos Interactivos', route: VIEW_ROUTES.interactivos },
  { id: 'about', label: 'Quiénes somos', route: VIEW_ROUTES.about }
]

export const ALGORITHMS = [
  {
    id: 'grafos',
    category: 'grafos',
    title: 'Pizarra de grafos',
    name: 'Grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
    image: '/img/pizzara.png',
    route: '/pizarra/grafos',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'asignacion',
    category: 'grafos',
    title: 'Algoritmo de asignación',
    name: 'Asignación',
    desc: 'Resuelve problemas de asignación óptima sobre un grafo bipartito.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: '/img/asignacion.png',
    route: '/pizarra/asignacion',
    complexity: 'O(n³) de tiempo y O(n²) de memoria',
    comingSoon: false,
    showInTheory: true
  },
  {
    id: 'johnson',
    category: 'grafos',
    title: 'Algoritmo de Johnson',
    name: 'Johnson',
    desc: 'Encuentra los caminos más cortos entre todos los pares de vértices en un grafo con pesos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: '/img/johnson.png',
    route: '/pizarra/johnson',
    complexity: 'O(VE + V² log V) de tiempo y O(V + E) de memoria',
    comingSoon: false,
    showInTheory: true
  },
  {
    id: 'kruskal',
    category: 'grafos',
    title: 'Algoritmo de Kruskal',
    name: 'Kruskal',
    desc: 'Encuentra un árbol de expansión mínimo o máximo en un grafo no dirigido con pesos.',
    icon: Share2,
    iconBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    route: '/pizarra/kruskal',
    complexity: 'O(E log E) de tiempo y O(V) de memoria',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'northwest',
    category: 'grafos',
    title: 'Método Northwest',
    name: 'Northwest',
    desc: 'Construye una solución inicial para problemas de transporte usando disponibilidad, demanda y costos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    image: '/img/northwest.png',
    route: '/pizarra/northwest',
    complexity: 'O(m + n) de tiempo y O(m + n) de memoria',
    comingSoon: false,
    showInTheory: true
  },
  {
    id: 'seleccion',
    category: 'ordenamiento',
    title: 'Ordenamiento por selección',
    name: 'Selection Sort',
    desc: 'Ordena una lista eligiendo en cada pasada el menor (o mayor) elemento y llevándolo a su posición.',
    icon: ArrowDownUp,
    iconBg: 'linear-gradient(135deg, #22c55e, #06b6d4)',
    image: '/img/seleccion.png',
    route: '/pizarra/seleccion',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'insercion',
    category: 'ordenamiento',
    title: 'Ordenamiento por inserción',
    name: 'Insertion Sort',
    desc: 'Ordena una lista tomando cada elemento y deslizándolo hasta su lugar dentro de la parte ya ordenada.',
    icon: ListOrdered,
    iconBg: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    image: '/img/insercion.png',
    route: '/pizarra/insercion',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'shell',
    category: 'ordenamiento',
    title: 'Ordenamiento Shell',
    name: 'Shell Sort',
    desc: 'Mejora la inserción comparando elementos separados por un salto (gap) que se reduce hasta 1.',
    icon: Layers,
    iconBg: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    image: '/img/shell.png',
    route: '/pizarra/shell',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'merge',
    category: 'ordenamiento',
    title: 'Ordenamiento por mezcla',
    name: 'Merge Sort',
    desc: 'Divide la lista por la mitad hasta tener elementos sueltos y luego los mezcla ordenadamente.',
    icon: GitMerge,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    image: '/img/merge.png',
    route: '/pizarra/merge',
    comingSoon: false,
    showInTheory: false
  }
]

// Categorías en las que se agrupan las pizarras de "Algoritmos Interactivos"
export const ALGORITHM_CATEGORIES = [
  {
    id: 'grafos',
    title: 'Grafos y redes',
    desc: 'Construye un grafo o una matriz y observa cómo el algoritmo encuentra la mejor solución.'
  },
  {
    id: 'ordenamiento',
    title: 'Algoritmos de ordenamiento',
    desc: 'Ingresa una lista de números y mira paso a paso cómo cada algoritmo la ordena y cuántos pasos necesita.'
  }
]

export const getAlgorithmsByCategory = (categoryId) =>
  ALGORITHMS.filter((algorithm) => algorithm.category === categoryId)

export const ALGORITHM_ROUTES = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.id, algorithm.route])
)

export const getViewRoute = (view) => VIEW_ROUTES[view] || VIEW_ROUTES.home

export const getAlgorithmRoute = (id) => ALGORITHM_ROUTES[id] || VIEW_ROUTES.interactivos

export const getAlgorithm = (id) => ALGORITHMS.find((algorithm) => algorithm.id === id)

export const parseAppRoute = ({ hash = '', pathname = '/' } = {}) => {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'
  const cleanHash = hash.replace(/^#\/?/, '')

  if (cleanPath === '/') return { type: 'view', view: 'home' }
  if (cleanPath === '/algoritmos-interactivos') return { type: 'view', view: 'interactivos' }

  const view = Object.entries(VIEW_ROUTES)
    .find(([, route]) => route === cleanPath)?.[0]
  if (view) return { type: 'view', view }

  const boardMatch = cleanPath.match(/^\/pizarra\/([^/]+)$/)
  if (boardMatch && getAlgorithm(boardMatch[1])) {
    return { type: 'algorithm', algorithm: boardMatch[1] }
  }

  // Compatibilidad con URLs antiguas basadas en hash.
  if (cleanHash === '' && cleanPath === '/') return { type: 'view', view: 'home' }
  if (VIEW_ROUTES[cleanHash]) return { type: 'view', view: cleanHash }
  if (cleanHash === 'algoritmos-interactivos') return { type: 'view', view: 'interactivos' }
  if (cleanHash.startsWith('pizarra/')) {
    const algorithm = cleanHash.slice('pizarra/'.length)
    if (getAlgorithm(algorithm)) return { type: 'algorithm', algorithm }
  }
  if (getAlgorithm(cleanHash)) return { type: 'algorithm', algorithm: cleanHash }

  return null
}
