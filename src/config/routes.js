import { Network } from '@lucide/vue'

export const VIEW_ROUTES = {
  home: '#/',
  teoria: '#/teoria',
  interactivos: '#/interactivos',
  about: '#/about'
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
    title: 'Pizarra de grafos',
    name: 'Grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
    image: '/img/pizzara.png',
    route: '#/pizarra/grafos',
    comingSoon: false,
    showInTheory: false
  },
  {
    id: 'asignacion',
    title: 'Algoritmo de asignación',
    name: 'Asignación',
    desc: 'Resuelve problemas de asignación óptima sobre un grafo bipartito.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: '/img/asignacion.png',
    route: '#/pizarra/asignacion',
    comingSoon: false,
    showInTheory: true
  },
  {
    id: 'johnson',
    title: 'Algoritmo de Johnson',
    name: 'Johnson',
    desc: 'Encuentra los caminos más cortos entre todos los pares de vértices en un grafo con pesos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: '/img/johnson.png',
    route: '#/pizarra/johnson',
    comingSoon: false,
    showInTheory: true
  },
  {
    id: 'northwest',
    title: 'Método Northwest',
    name: 'Northwest',
    desc: 'Construye una solución inicial para problemas de transporte usando disponibilidad, demanda y costos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    image: '/img/northwest.png',
    route: '#/pizarra/northwest',
    comingSoon: false,
    showInTheory: true
  }
]

export const ALGORITHM_ROUTES = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.id, algorithm.route])
)

export const getViewRoute = (view) => VIEW_ROUTES[view] || VIEW_ROUTES.home

export const getAlgorithmRoute = (id) => ALGORITHM_ROUTES[id] || VIEW_ROUTES.interactivos

export const getAlgorithm = (id) => ALGORITHMS.find((algorithm) => algorithm.id === id)

export const parseAppRoute = ({ hash = '', pathname = '/' } = {}) => {
  const cleanHash = hash.replace(/^#\/?/, '')

  if (!cleanHash) return { type: 'view', view: 'home' }
  if (VIEW_ROUTES[cleanHash]) return { type: 'view', view: cleanHash }
  if (cleanHash === 'algoritmos-interactivos') return { type: 'view', view: 'interactivos' }

  const boardMatch = cleanHash.match(/^pizarra\/([^/]+)$/)
  if (boardMatch && getAlgorithm(boardMatch[1])) {
    return { type: 'algorithm', algorithm: boardMatch[1] }
  }

  // Compatibilidad con hashes antiguos: #asignacion, #johnson, #northwest.
  if (getAlgorithm(cleanHash)) return { type: 'algorithm', algorithm: cleanHash }

  if (pathname === '/algoritmos-interactivos') {
    return cleanHash && getAlgorithm(cleanHash)
      ? { type: 'algorithm', algorithm: cleanHash }
      : { type: 'view', view: 'interactivos' }
  }

  return null
}
