/**
 * Clasifica los nodos según la dirección de sus aristas:
 * - "origen": solo tiene aristas salientes (nunca es destino de otra).
 * - "destino": solo tiene aristas entrantes (nunca es origen de otra).
 * - "ambiguo": tiene ambas a la vez, o ninguna (nodo aislado / mal conectado).
 *
 * Esto reemplaza la necesidad de que el usuario marque manualmente qué es
 * cada nodo: la propia estructura del grafo lo determina.
 */
export function clasificarNodos(nodes, edges) {
  const outCount = new Map(nodes.map(n => [n.id, 0]))
  const inCount = new Map(nodes.map(n => [n.id, 0]))

  edges.forEach(e => {
    if (outCount.has(e.sourceId)) outCount.set(e.sourceId, outCount.get(e.sourceId) + 1)
    if (inCount.has(e.targetId)) inCount.set(e.targetId, inCount.get(e.targetId) + 1)
  })

  const origenes = []
  const destinos = []
  const ambiguos = []

  nodes.forEach(n => {
    const outC = outCount.get(n.id) || 0
    const inC = inCount.get(n.id) || 0
    if (outC > 0 && inC === 0) {
      origenes.push(n)
    } else if (inC > 0 && outC === 0) {
      destinos.push(n)
    } else {
      ambiguos.push(n)
    }
  })

  return { origenes, destinos, ambiguos }
}

/**
 * Construye la matriz de asignación (filas = orígenes, columnas = destinos),
 * sin las columnas de resumen (Σ Pesos / # Cantidad) que no aportan a la
 * resolución del problema de asignación.
 *
 * Si el número de orígenes y destinos no coincide, se agregan filas/columnas
 * ficticias de costo 0 para "balancear" la matriz (requisito del método de
 * ceros / método húngaro, que exigen una matriz cuadrada).
 */
export function construirMatrizAsignacion(nodes, edges) {
  const { origenes, destinos, ambiguos } = clasificarNodos(nodes, edges)

  const size = Math.max(origenes.length, destinos.length, 0)

  const rowLabels = []
  const colLabels = []
  const rowIds = []
  const colIds = []

  for (let i = 0; i < size; i++) {
    if (origenes[i]) {
      rowLabels.push(origenes[i].label)
      rowIds.push(origenes[i].id)
    } else {
      rowLabels.push(`Ficticio ${i + 1}`)
      rowIds.push(null)
    }

    if (destinos[i]) {
      colLabels.push(destinos[i].label)
      colIds.push(destinos[i].id)
    } else {
      colLabels.push(`Ficticio ${i + 1}`)
      colIds.push(null)
    }
  }

  const matrix = Array.from({ length: size }, () => Array(size).fill(0))

  edges.forEach(edge => {
    const i = rowIds.indexOf(edge.sourceId)
    const j = colIds.indexOf(edge.targetId)
    if (i !== -1 && j !== -1) {
      const w = Number(edge.weight)
      matrix[i][j] = isNaN(w) ? 0 : w
    }
  })

  return { matrix, rowLabels, colLabels, rowIds, colIds, origenes, destinos, ambiguos }
}
