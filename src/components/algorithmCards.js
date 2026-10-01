import { Network } from '@lucide/vue'

// Fuente única de datos: la usan el carrusel y la lista
// Para agregar imágenes: import img from '@/assets/algo-grafos.png' y ponla en image
export const cards = [
  {
    id: 'grafos',
    title: 'Pizarra de grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
    image: null,
    comingSoon: false
  },
  {
    id: 'asignacion',
    title: 'Algoritmo de asignación',
    desc: 'Resuelve problemas de asignación óptima sobre un grafo bipartito.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: null,
    comingSoon: false
  },
  {
    id: 'johnson',
    title: 'Algoritmo de Johnson',
    desc: 'Encuentra los caminos más cortos entre todos los pares de vértices en un grafo con pesos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: null,
    comingSoon: false
  },
  {
    id: 'northwest',
    title: 'Método Northwest',
    desc: 'Construye una solución inicial para problemas de transporte usando disponibilidad, demanda y costos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    image: null,
    comingSoon: false
  }
]