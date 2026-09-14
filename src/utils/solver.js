//solver.js corregido
/**
 * Utilidad para la resolucion del Algoritmo de Asignacion.
 * Filtra automaticamente las filas por Nodos Origen y las columnas por Nodos Destino.
 */

export const INF = Number.MAX_SAFE_INTEGER

export function solveAlgorithm(nodes, edges, mode = 'minimize') {
  if (nodes.length === 0 || edges.length === 0) {
    return {
      costoTotal: 0,
      metodo: `Asignacion (${mode === 'maximize' ? 'Maximizar' : 'Minimizar'})`,
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
  const targetAssignments = Math.min(numRows, numCols)

  // 2. Obtener peso maximo para maximizacion
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

  pasos.push({
    titulo: '1. Matriz de Trabajo Inicial',
    descripcion: 'Matriz original entre origenes (filas) y destinos (columnas).',
    rowLabels,
    colLabels,
    matrix: rawCostMatrix.map(r => [...r])
  })

  if (mode === 'maximize') {
    pasos.push({
      titulo: '2. Conversion por Maximizacion',
      descripcion: `Inversion de costos (M = ${maxWeight}) calculada como C'ij = M - Cij.`,
      rowLabels,
      colLabels,
      matrix: costMatrix.map(r => [...r])
    })
  }

  // 4. Reduccion por Filas (Alpha)
  const alpha = costMatrix.map(row => {
    const valid = row.filter(v => v !== INF)
    return valid.length > 0 ? Math.min(...valid) : 0
  })

  const rowReducedMatrix = costMatrix.map((row, i) =>
    row.map(val => (val === INF ? INF : val - alpha[i]))
  )

  pasos.push({
    titulo: `${mode === 'maximize' ? '3' : '2'}. Reduccion por Filas`,
    descripcion: `Minimos restados por fila (alpha): [${alpha.join(', ')}].`,
    rowLabels,
    colLabels,
    matrix: rowReducedMatrix.map(r => [...r])
  })

  // 5. Reduccion por Columnas (Beta)
  const beta = Array.from({ length: numCols }, (_, j) => {
    const col = rowReducedMatrix.map(r => r[j]).filter(v => v !== INF)
    return col.length > 0 ? Math.min(...col) : 0
  })

  let finalMatrix = rowReducedMatrix.map(row =>
    row.map((val, j) => (val === INF ? INF : val - beta[j]))
  )

  pasos.push({
    titulo: `${mode === 'maximize' ? '4' : '3'}. Reduccion por Columnas`,
    descripcion: `Minimos restados por columna (beta): [${beta.join(', ')}].`,
    rowLabels,
    colLabels,
    matrix: finalMatrix.map(r => [...r])
  })

  // 6. Emparejamiento por ceros + ajuste hungaro iterativo.
  let matchTargetToSource = findZeroMatching(finalMatrix, costMatrix, numRows, numCols)
  let matchedCount = countMatches(matchTargetToSource)
  let iteration = 1

  while (matchedCount < targetAssignments) {
    const cover = findMinimumZeroCover(finalMatrix, costMatrix, matchTargetToSource, numRows, numCols)
    const lineCount = countCoveredLines(cover)

    pasos.push({
      titulo: `${mode === 'maximize' ? '5' : '4'}.${iteration} Cobertura de Ceros`,
      descripcion: `Lineas necesarias: ${lineCount}. Ceros independientes: ${matchedCount}/${targetAssignments}.`,
      rowLabels,
      colLabels,
      matrix: finalMatrix.map(r => [...r]),
      coveredRows: [...cover.coveredRows],
      coveredCols: [...cover.coveredCols]
    })

    if (lineCount >= targetAssignments) break

    const minUncovered = findMinUncovered(finalMatrix, costMatrix, cover.coveredRows, cover.coveredCols, numRows, numCols)
    if (minUncovered === INF) break

    finalMatrix = applyHungarianAdjustment(finalMatrix, cover.coveredRows, cover.coveredCols, minUncovered)

    pasos.push({
      titulo: `${mode === 'maximize' ? '5' : '4'}.${iteration} Ajuste Hungaro`,
      descripcion: `Menor no cubierto: ${minUncovered}. Se resta a celdas no cubiertas y se suma en intersecciones.`,
      rowLabels,
      colLabels,
      matrix: finalMatrix.map(r => [...r]),
      coveredRows: [...cover.coveredRows],
      coveredCols: [...cover.coveredCols]
    })

    matchTargetToSource = findZeroMatching(finalMatrix, costMatrix, numRows, numCols)
    matchedCount = countMatches(matchTargetToSource)
    iteration++
  }

  matchTargetToSource = findZeroMatching(finalMatrix, costMatrix, numRows, numCols)

  // 7. Extraer Asignaciones Optimas
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
    titulo: `${mode === 'maximize' ? '6' : '5'}. Asignacion Optima`,
    descripcion: `Ceros independientes seleccionados: ${uiAsignaciones.length}/${targetAssignments}.`,
    rowLabels,
    colLabels,
    matrix: finalMatrix.map(r => [...r]),
    asignaciones: uiAsignaciones
  })

  return {
    metodo: `Asignacion (Metodo de Ceros - ${mode === 'maximize' ? 'Maximizar' : 'Minimizar'})`,
    costoTotal: totalCost,
    asignaciones: uiAsignaciones,
    optimalEdgeIds,
    pasos,
    INF
  }
}

function findZeroMatching(matrix, costMatrix, numRows, numCols) {
  const matchTargetToSource = Array(numCols).fill(-1)

  function dfsKuhn(u, visited) {
    for (let v = 0; v < numCols; v++) {
      if (matrix[u][v] === 0 && costMatrix[u][v] !== INF && !visited[v]) {
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

  return matchTargetToSource
}

function countMatches(matchTargetToSource) {
  return matchTargetToSource.filter(sourceIdx => sourceIdx !== -1).length
}

function countCoveredLines(cover) {
  return cover.coveredRows.filter(Boolean).length + cover.coveredCols.filter(Boolean).length
}

function findMinimumZeroCover(matrix, costMatrix, matchTargetToSource, numRows, numCols) {
  const matchedRows = Array(numRows).fill(false)
  const markedRows = Array(numRows).fill(false)
  const markedCols = Array(numCols).fill(false)

  matchTargetToSource.forEach(sourceIdx => {
    if (sourceIdx !== -1) matchedRows[sourceIdx] = true
  })

  for (let i = 0; i < numRows; i++) {
    if (!matchedRows[i]) markedRows[i] = true
  }

  let changed = true
  while (changed) {
    changed = false

    for (let i = 0; i < numRows; i++) {
      if (!markedRows[i]) continue

      for (let j = 0; j < numCols; j++) {
        if (matrix[i][j] === 0 && costMatrix[i][j] !== INF && !markedCols[j]) {
          markedCols[j] = true
          changed = true
        }
      }
    }

    for (let j = 0; j < numCols; j++) {
      const matchedRow = matchTargetToSource[j]
      if (markedCols[j] && matchedRow !== -1 && !markedRows[matchedRow]) {
        markedRows[matchedRow] = true
        changed = true
      }
    }
  }

  return {
    coveredRows: markedRows.map(marked => !marked),
    coveredCols: markedCols
  }
}

function findMinUncovered(matrix, costMatrix, coveredRows, coveredCols, numRows, numCols) {
  let min = INF

  for (let i = 0; i < numRows; i++) {
    if (coveredRows[i]) continue

    for (let j = 0; j < numCols; j++) {
      if (!coveredCols[j] && costMatrix[i][j] !== INF && matrix[i][j] < min) {
        min = matrix[i][j]
      }
    }
  }

  return min
}

function applyHungarianAdjustment(matrix, coveredRows, coveredCols, minUncovered) {
  return matrix.map((row, i) =>
    row.map((value, j) => {
      if (value === INF) return INF
      if (!coveredRows[i] && !coveredCols[j]) return value - minUncovered
      if (coveredRows[i] && coveredCols[j]) return value + minUncovered
      return value
    })
  )
}
