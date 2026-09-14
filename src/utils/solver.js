/**
 * Utilidad para la resolución del Algoritmo de Asignación.
 * Filtra automáticamente las filas por Nodos Origen y las columnas por Nodos Destino.
 */

export const INF = Number.MAX_SAFE_INTEGER

export function solveAlgorithm(nodes, edges, mode = 'minimize') {
  if (nodes.length === 0 || edges.length === 0) {
    return {
      costoTotal: 0,
      metodo: `Asignación (${mode === 'maximize' ? 'Maximizar' : 'Minimizar'})`,
      asignaciones: [],
      pasos: [],
      optimalEdgeIds: []
    }
  }

  // 1. Identificar Nodos Origen (salidas) y Nodos Destino (entradas)
  const sourceIds = [...new Set(edges.map(e => e.sourceId))]
  const targetIds = [...new Set(edges.map(e => e.targetId))]

  const sourceNodes = nodes.filter(n => sourceIds.includes(n.id))
  const targetNodes = nodes.filter(n => targetIds.includes(n.id))

  const rowLabels = sourceNodes.map(n => n.label)
  const colLabels = targetNodes.map(n => n.label)

  const numRows = sourceNodes.length
  const numCols = targetNodes.length

  // 2. Obtener peso máximo para maximización
  let maxWeight = 0
  edges.forEach(e => {
    const w = Number(e.weight) || 0
    if (w > maxWeight) maxWeight = w
  })

  // 3. Construir Matriz Rectangular [numRows x numCols]
  const rawCostMatrix = Array.from({ length: numRows }, () => Array(numCols).fill(INF))
  const costMatrix = Array.from({ length: numRows }, () => Array(numCols).fill(INF))

  edges.forEach(edge => {
    const rIdx = sourceNodes.findIndex(n => n.id === edge.sourceId)
    const cIdx = targetNodes.findIndex(n => n.id === edge.targetId)
    if (rIdx !== -1 && cIdx !== -1) {
      const w = Number(edge.weight) || 0
      rawCostMatrix[rIdx][cIdx] = w
      costMatrix[rIdx][cIdx] = mode === 'minimize' ? w : (maxWeight - w)
    }
  })

  const pasos = []

  // Paso 1: Matriz Inicial
  pasos.push({
    titulo: '1. Matriz de Trabajo Inicial',
    descripcion: mode === 'maximize'
      ? 'Matriz original entre orígenes (filas) y destinos (columnas).'
      : 'Matriz original entre orígenes (filas) y destinos (columnas).',
    rowLabels,
    colLabels,
    matrix: rawCostMatrix.map(r => [...r])
  })

  // Paso 2 (Maximizar): Conversión
  if (mode === 'maximize') {
    pasos.push({
      titulo: '2. Conversión por Maximización',
      descripcion: `Inversión de costos (M = ${maxWeight}) calculada como C'ij = M - Cij.`,
      rowLabels,
      colLabels,
      matrix: costMatrix.map(r => [...r])
    })
  }

  // 4. Reducción por Filas (Alpha)
  const alpha = costMatrix.map(row => {
    const valid = row.filter(v => v !== INF)
    return valid.length > 0 ? Math.min(...valid) : 0
  })

  const rowReducedMatrix = costMatrix.map((row, i) =>
    row.map(val => (val === INF ? INF : val - alpha[i]))
  )

  pasos.push({
    titulo: `${mode === 'maximize' ? '3' : '2'}. Reducción por Filas`,
    descripcion: `Mínimos restados por fila (α): [${alpha.join(', ')}].`,
    rowLabels,
    colLabels,
    matrix: rowReducedMatrix.map(r => [...r])
  })

  // 5. Reducción por Columnas (Beta)
  const beta = Array.from({ length: numCols }, (_, j) => {
    const col = rowReducedMatrix.map(r => r[j]).filter(v => v !== INF)
    return col.length > 0 ? Math.min(...col) : 0
  })

  const finalMatrix = rowReducedMatrix.map(row =>
    row.map((val, j) => (val === INF ? INF : val - beta[j]))
  )

  // 6. Emparejamiento por Ceros (Algoritmo de Kuhn)
  const matchTargetToSource = Array(numCols).fill(-1)

  function dfsKuhn(u, visited) {
    for (let v = 0; v < numCols; v++) {
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

  for (let u = 0; u < numRows; u++) {
    const visited = Array(numCols).fill(false)
    dfsKuhn(u, visited)
  }

  // 7. Extraer Asignaciones Óptimas
  const uiAsignaciones = []
  const optimalEdgeIds = []
  let totalCost = 0

  for (let v = 0; v < numCols; v++) {
    const u = matchTargetToSource[v]
    if (u !== -1) {
      const sNode = sourceNodes[u]
      const tNode = targetNodes[v]

      const edge = edges.find(e => e.sourceId === sNode.id && e.targetId === tNode.id)
      const origWeight = edge ? (Number(edge.weight) || 0) : 0

      if (edge) optimalEdgeIds.push(edge.id)
      totalCost += origWeight

      uiAsignaciones.push({
        origen: sNode.label,
        destino: tNode.label,
        costo: origWeight,
        rowIdx: u,
        colIdx: v
      })
    }
  }

  pasos.push({
    titulo: `${mode === 'maximize' ? '4' : '3'}. Reducción por Columnas`,
    descripcion: `Mínimos restados por columna (β): [${beta.join(', ')}].`,
    rowLabels,
    colLabels,
    matrix: finalMatrix.map(r => [...r]),
    asignaciones: uiAsignaciones
  })

  return {
    metodo: `Asignación (Método de Ceros — ${mode === 'maximize' ? 'Maximizar' : 'Minimizar'})`,
    costoTotal: totalCost,
    asignaciones: uiAsignaciones,
    optimalEdgeIds,
    pasos,
    INF
  }
}