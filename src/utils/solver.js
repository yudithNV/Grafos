/**
 * Utilidad para la resolución del Algoritmo de Asignación (Método Húngaro).
 * Soporta Minimización y Maximización directa mediante reducción por columna (vector Alpha).
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

  // 1. Identificar Nodos Origen (filas) y Nodos Destino (columnas)
  const sourceIds = [...new Set(edges.map(e => e.sourceId))]
  const targetIds = [...new Set(edges.map(e => e.targetId))]

  const sourceNodes = nodes.filter(n => sourceIds.includes(n.id))
  const targetNodes = nodes.filter(n => targetIds.includes(n.id))

  const numRows = sourceNodes.length
  const numCols = targetNodes.length

  // Dimensión cuadrada N x N para el Método Húngaro
  const N = Math.max(numRows, numCols)
  const targetAssignments = N

  // Generar etiquetas (incluyendo ficticios si la matriz no es cuadrada)
  const rowLabels = sourceNodes.map(n => n.label)
  for (let i = numRows + 1; i <= N; i++) {
    rowLabels.push(`Ficticio ${i - numRows}`)
  }

  const colLabels = targetNodes.map(n => n.label)
  for (let j = numCols + 1; j <= N; j++) {
    colLabels.push(`Ficticio ${j - numCols}`)
  }

  // 2. Construir Matriz Balanceada Original (A)
  const rawCostMatrix = Array.from({ length: N }, () => Array(N).fill(0))
  const edgeMatrix = Array.from({ length: N }, () => Array(N).fill(null))

  edges.forEach(edge => {
    const rIdx = sourceNodes.findIndex(n => n.id === edge.sourceId)
    const cIdx = targetNodes.findIndex(n => n.id === edge.targetId)
    if (rIdx !== -1 && cIdx !== -1 && edgeMatrix[rIdx][cIdx] === null) {
      const parsedWeight = Number(edge.weight)
      const w = Number.isFinite(parsedWeight) ? parsedWeight : 0
      edgeMatrix[rIdx][cIdx] = edge
      rawCostMatrix[rIdx][cIdx] = w
    }
  })

  const pasos = []

  // Paso 1: Matriz Inicial
  pasos.push({
    titulo: '1. Matriz de Trabajo Inicial',
    descripcion: numRows !== numCols
      ? `Matriz balanceada (${N}x${N}) agregando ${numRows < N ? 'filas' : 'columnas'} ficticias con costo 0.`
      : 'Matriz original balanceada.',
    rowLabels,
    colLabels,
    matrix: rawCostMatrix.map(r => [...r])
  })

  let workingMatrix = Array.from({ length: N }, () => Array(N).fill(0))
  let alpha = []

  // 3. Conversión de Maximización (Vector Alpha = Máximos por Columna)
  if (mode === 'maximize') {
    alpha = Array.from({ length: N }, (_, j) => {
      const col = rawCostMatrix.map(r => r[j])
      return Math.max(...col)
    })

    // C'ij = Alpha_j - A_ij
    workingMatrix = rawCostMatrix.map((row) =>
      row.map((val, j) => alpha[j] - val)
    )

    pasos.push({
      titulo: '2. Máximos por Columna (Alpha)',
      descripcion: `Vector Alpha (Máximos de columna): [${alpha.join(', ')}]. Matriz reducida C'ij = Alpha_j - A_ij.`,
      rowLabels,
      colLabels,
      matrix: workingMatrix.map(r => [...r]),
      alpha
    })
  } else {
    // Minimización: Mínimos por fila (Alpha)
    alpha = rawCostMatrix.map(row => Math.min(...row))
    workingMatrix = rawCostMatrix.map((row, i) =>
      row.map(val => val - alpha[i])
    )

    pasos.push({
      titulo: '2. Reducción por Filas (Alpha)',
      descripcion: `Mínimos de fila restados (Alpha): [${alpha.join(', ')}].`,
      rowLabels,
      colLabels,
      matrix: workingMatrix.map(r => [...r]),
      alpha
    })
  }

  // 4. Reducción por Columnas / Filas Secundarias (Beta)
  const beta = Array.from({ length: N }, (_, j) => {
    const col = workingMatrix.map(r => r[j])
    return Math.min(...col)
  })

  let finalMatrix = workingMatrix.map(row =>
    row.map((val, j) => val - beta[j])
  )

  pasos.push({
    titulo: mode === 'maximize' ? '3. Reducción Secundaría (Beta)' : '3. Reducción por Columnas (Beta)',
    descripcion: `Vector Beta (Mínimos sobrantes): [${beta.join(', ')}].`,
    rowLabels,
    colLabels,
    matrix: finalMatrix.map(r => [...r]),
    beta
  })

  // 5. Cobertura Mínima de Ceros y Ajuste Húngaro Iterativo
  let matchTargetToSource = findZeroMatching(finalMatrix, N, N)
  let matchedCount = countMatches(matchTargetToSource)
  let iteration = 1

  while (matchedCount < targetAssignments) {
    const cover = findMinimumZeroCover(finalMatrix, N, N)
    const lineCount = countCoveredLines(cover)

    pasos.push({
      titulo: `4.${iteration} Cobertura de Ceros`,
      descripcion: `Líneas trazadas: ${lineCount}. Ceros independientes: ${matchedCount}/${targetAssignments}.`,
      rowLabels,
      colLabels,
      matrix: finalMatrix.map(r => [...r]),
      coveredRows: [...cover.coveredRows],
      coveredCols: [...cover.coveredCols]
    })

    if (lineCount >= targetAssignments) break

    const minUncovered = findMinUncovered(finalMatrix, cover.coveredRows, cover.coveredCols, N, N)
    if (minUncovered === INF) break

    finalMatrix = applyHungarianAdjustment(finalMatrix, cover.coveredRows, cover.coveredCols, minUncovered)

    pasos.push({
      titulo: `4.${iteration} Ajuste Húngaro (gamma = ${minUncovered})`,
      descripcion: `Valor no cubierto menor: ${minUncovered}. Restado a celdas descubiertas y sumado a intersecciones.`,
      rowLabels,
      colLabels,
      matrix: finalMatrix.map(r => [...r]),
      coveredRows: [...cover.coveredRows],
      coveredCols: [...cover.coveredCols]
    })

    matchTargetToSource = findZeroMatching(finalMatrix, N, N)
    matchedCount = countMatches(matchTargetToSource)
    iteration++
  }

  matchTargetToSource = findZeroMatching(finalMatrix, N, N)

  // 6. Extracción de Asignaciones Óptimas
  const uiAsignaciones = []
  const optimalEdgeIds = []
  let totalCost = 0

  for (let v = 0; v < N; v++) {
    const u = matchTargetToSource[v]
    if (u !== -1) {
      const isRealRow = u < numRows
      const isRealCol = v < numCols

      const origenLabel = rowLabels[u]
      const destinoLabel = colLabels[v]

      let origWeight = (isRealRow && isRealCol) ? rawCostMatrix[u][v] : 0

      if (isRealRow && isRealCol) {
        const edge = edgeMatrix[u][v]
        if (edge) optimalEdgeIds.push(edge.id)
      }

      totalCost += origWeight

      uiAsignaciones.push({
        origen: origenLabel,
        destino: destinoLabel,
        costo: origWeight,
        rowIdx: u,
        colIdx: v,
        esFicticio: !(isRealRow && isRealCol)
      })
    }
  }

  pasos.push({
    titulo: '5. Asignación Óptima Final',
    descripcion: `Asignaciones independientes seleccionadas. Beneficio/Costo Total: ${totalCost}.`,
    rowLabels,
    colLabels,
    matrix: finalMatrix.map(r => [...r]),
    asignaciones: uiAsignaciones
  })

  return {
    metodo: `Asignación (Método Húngaro - ${mode === 'maximize' ? 'Maximizar' : 'Minimizar'})`,
    costoTotal: totalCost,
    asignaciones: uiAsignaciones,
    optimalEdgeIds,
    pasos,
    INF
  }
}

// Algoritmo de Kuhn para emparejamiento máximo en grafos bipartitos
function findZeroMatching(matrix, numRows, numCols) {
  const matchTargetToSource = Array(numCols).fill(-1)

  function dfsKuhn(u, visited) {
    for (let v = 0; v < numCols; v++) {
      if (matrix[u][v] === 0 && !visited[v]) {
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
  return matchTargetToSource.filter(s => s !== -1).length
}

function countCoveredLines(cover) {
  return cover.coveredRows.filter(Boolean).length + cover.coveredCols.filter(Boolean).length
}

// Teorema de König para la cobertura mínima de ceros
function findMinimumZeroCover(matrix, numRows, numCols) {
  const matchTargetToSource = findZeroMatching(matrix, numRows, numCols)
  const matchedRows = Array(numRows).fill(false)
  const markedRows = Array(numRows).fill(false)
  const markedCols = Array(numCols).fill(false)

  matchTargetToSource.forEach(s => {
    if (s !== -1) matchedRows[s] = true
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
        if (matrix[i][j] === 0 && !markedCols[j]) {
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
    coveredRows: markedRows.map(m => !m),
    coveredCols: markedCols
  }
}

function findMinUncovered(matrix, coveredRows, coveredCols, numRows, numCols) {
  let min = INF
  for (let i = 0; i < numRows; i++) {
    if (coveredRows[i]) continue
    for (let j = 0; j < numCols; j++) {
      if (!coveredCols[j] && matrix[i][j] < min) {
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