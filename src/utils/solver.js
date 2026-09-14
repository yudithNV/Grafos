/**
 * Utilidad para la resolución del Algoritmo de Asignación (Método Húngaro / Reducción).
 * Reutilizable para múltiples algoritmos de optimización de grafos.
 */

export const INF = Number.MAX_SAFE_INTEGER

/**
 * Resuelve el algoritmo de asignación para grafos dirigidos.
 * 
 * @param {Array} nodes Lista de nodos [{ id, label, ... }]
 * @param {Array} edges Lista de aristas [{ id, sourceId, targetId, weight, ... }]
 * @param {'minimize'|'maximize'} mode Modo de optimización
 * @returns {Object} Resultado con pasos detallados y asignación óptima
 */
export function solveAlgorithm(nodes, edges, mode = 'minimize') {
  const n = nodes.length
  if (n === 0) {
    return {
      alpha: [],
      beta: [],
      costMatrix: [],
      rowReducedMatrix: [],
      finalMatrix: [],
      assignments: [],
      optimalEdgeIds: [],
      totalCost: 0,
      mode,
      maxWeight: 0,
      INF
    }
  }

  // 1. Obtener peso máximo global (para la transformación si es maximización)
  let maxWeight = 0
  edges.forEach(e => {
    const w = Number(e.weight) || 0
    if (w > maxWeight) maxWeight = w
  })

  // 2. Construir matriz de costos C[u][v] SOLO con aristas válidas (u !== v)
  // Las no existentes se inicializan con INF consistente
  const costMatrix = Array.from({ length: n }, () => Array(n).fill(INF))
  const rawCostMatrix = Array.from({ length: n }, () => Array(n).fill(INF))

  edges.forEach(edge => {
    const u = nodes.findIndex(node => node.id === edge.sourceId)
    const v = nodes.findIndex(node => node.id === edge.targetId)
    if (u !== -1 && v !== -1 && u !== v) {
      const w = Number(edge.weight) || 0
      rawCostMatrix[u][v] = w
      costMatrix[u][v] = mode === 'minimize' ? w : (maxWeight - w)
    }
  })

  // 3. Alpha seguro (filtrar INF): Mínimo de cada fila
  const alpha = costMatrix.map(row => {
    const valid = row.filter(v => v !== INF)
    return valid.length > 0 ? Math.min(...valid) : 0
  })

  // 4. Reducción por filas: C'_ij = C_ij - alpha_i
  const rowReducedMatrix = costMatrix.map((row, i) =>
    row.map(val => (val === INF ? INF : val - alpha[i]))
  )

  // 5. Beta seguro (filtrar INF): Mínimo de cada columna sobre rowReducedMatrix
  const beta = Array.from({ length: n }, (_, j) => {
    const col = rowReducedMatrix.map(row => row[j]).filter(v => v !== INF)
    return col.length > 0 ? Math.min(...col) : 0
  })

  // 6. Matriz Reducida Final: C''_ij = C'_ij - beta_j
  const finalMatrix = rowReducedMatrix.map(row =>
    row.map((val, j) => (val === INF ? INF : val - beta[j]))
  )

  // 7. Asignación 1-a-1 sobre los ceros mediante algoritmo de Kuhn (máximo emparejamiento bipartito)
  const matchTargetToSource = Array(n).fill(-1)

  function dfsKuhn(u, visited) {
    for (let v = 0; v < n; v++) {
      if (finalMatrix[u][v] === 0 && costMatrix[u][v] !== INF && !visited[v]) {
        visited[v] = true
        if (matchTargetToSource[v] < 0 || dfsKuhn(matchTargetToSource[v], visited)) {
          matchTargetToSource[v] = u
          return true
        }
      }
    }
    return false
  }

  // ✅ Ordenamos fuentes: primero las que tienen menos ceros disponibles (filas restrictivas),
  // y en empate, las de mejor peso según el modo (min: menor costo, max: mayor beneficio).
  const sourceIndices = Array.from({ length: n }, (_, i) => i)
  sourceIndices.sort((a, b) => {
    const zerosA = finalMatrix[a].filter((val, j) => val === 0 && costMatrix[a][j] !== INF).length
    const zerosB = finalMatrix[b].filter((val, j) => val === 0 && costMatrix[b][j] !== INF).length
    if (zerosA !== zerosB) return zerosA - zerosB

    const minRawA = Math.min(...rawCostMatrix[a].filter(v => v !== INF), 0)
    const minRawB = Math.min(...rawCostMatrix[b].filter(v => v !== INF), 0)
    return mode === 'minimize' ? minRawA - minRawB : minRawB - minRawA
  })

  for (const u of sourceIndices) {
    const visited = Array(n).fill(false)
    dfsKuhn(u, visited)
  }

  // 8. Construir lista de asignaciones y costo total con los pesos originales
  const assignments = []
  const optimalEdgeIds = []
  let totalCost = 0

  for (let v = 0; v < n; v++) {
    const u = matchTargetToSource[v]
    if (u !== -1) {
      const originalEdge = edges.find(
        e => e.sourceId === nodes[u].id && e.targetId === nodes[v].id
      )
      const origWeight = originalEdge ? (Number(originalEdge.weight) || 0) : (rawCostMatrix[u][v] !== INF ? rawCostMatrix[u][v] : 0)

      if (originalEdge) {
        optimalEdgeIds.push(originalEdge.id)
      }

      totalCost += origWeight

      assignments.push({
        sourceIndex: u,
        targetIndex: v,
        sourceNode: nodes[u],
        targetNode: nodes[v],
        sourceLabel: nodes[u]?.label || `Nodo ${u + 1}`,
        targetLabel: nodes[v]?.label || `Nodo ${v + 1}`,
        weight: origWeight,
        edgeId: originalEdge ? originalEdge.id : null
      })
    }
  }

  // Ordenar asignaciones por índice de origen para presentación limpia
  assignments.sort((a, b) => a.sourceIndex - b.sourceIndex)

  return {
    alpha,
    beta,
    costMatrix,
    rawCostMatrix,
    rowReducedMatrix,
    finalMatrix,
    assignments,
    optimalEdgeIds,
    totalCost,
    mode,
    maxWeight,
    INF
  }
}