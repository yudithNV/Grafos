/**
 * Convierte los nodos y aristas del lienzo en una matriz de costos N x N.
 */
function construirMatrizInicial(nodes, edges) {
  const labels = nodes.map((n, i) => n.label || n.name || `N${i + 1}`)
  const n = labels.length

  if (n === 0) return { matrix: [], labels: [] }

  // 1. Inicializar matriz NxN con Infinity
  const matrix = Array.from({ length: n }, () => Array(n).fill(Infinity))

  // Mapear IDs convirtiendo siempre a String para evitar fallos de tipo (ej: 1 vs "1")
  const nodeIndexMap = new Map()
  nodes.forEach((node, index) => {
    nodeIndexMap.set(String(node.id), index)
  })

  // 2. Extraer aristas probando todas las propiedades de origen/destino
  edges.forEach(edge => {
    const sourceId = String(edge.source ?? edge.from ?? edge.sourceId ?? edge.fromId ?? '')
    const targetId = String(edge.target ?? edge.to ?? edge.targetId ?? edge.toId ?? '')

    const fromIdx = nodeIndexMap.get(sourceId)
    const toIdx = nodeIndexMap.get(targetId)

    const rawWeight = edge.weight ?? edge.label ?? edge.cost ?? edge.value ?? 0
    const weight = Number(rawWeight)

    if (fromIdx !== undefined && toIdx !== undefined) {
      matrix[fromIdx][toIdx] = isNaN(weight) ? Infinity : weight
    }
  })

  return { matrix, labels }
}

/**
 * Resuelve el Método de Ceros registrando la matriz en cada fase.
 */
export function resolverMetodoCeros(nodes, edges) {
  const { matrix: originalMatrix, labels } = construirMatrizInicial(nodes, edges)
  const n = originalMatrix.length

  if (n === 0) {
    return {
      metodo: 'Método de Ceros',
      costoTotal: 0,
      asignaciones: [],
      pasos: []
    }
  }

  const pasos = []

  // --- PASO 1: Matriz Inicial ---
  const copyOriginal = originalMatrix.map(row => [...row])
  pasos.push({
    titulo: '1. Matriz de Costos Inicial',
    descripcion: 'Matriz extraída directamente de las conexiones y pesos del lienzo.',
    matrix: copyOriginal.map(row => [...row]),
    labels
  })

  // --- PASO 2: Reducción por Filas ---
  const rowReducedMatrix = copyOriginal.map(row => [...row])
  const minFilas = []

  for (let i = 0; i < n; i++) {
    // Filtrar Infinity para encontrar el mínimo real de la fila
    const valoresValidos = rowReducedMatrix[i].filter(v => v !== Infinity)
    const minVal = valoresValidos.length > 0 ? Math.min(...valoresValidos) : 0
    minFilas.push(minVal === Infinity ? 0 : minVal)

    if (minVal !== Infinity && minVal > 0) {
      for (let j = 0; j < n; j++) {
        if (rowReducedMatrix[i][j] !== Infinity) {
          rowReducedMatrix[i][j] -= minVal
        }
      }
    }
  }

  pasos.push({
    titulo: '2. Reducción por Filas',
    descripcion: `Se resta el elemento mínimo de cada fila: [${minFilas.join(', ')}].`,
    matrix: rowReducedMatrix.map(row => [...row]),
    labels
  })

  // --- PASO 3: Reducción por Columnas ---
  const colReducedMatrix = rowReducedMatrix.map(row => [...row])
  const minCols = []

  for (let j = 0; j < n; j++) {
    let minVal = Infinity
    for (let i = 0; i < n; i++) {
      if (colReducedMatrix[i][j] < minVal) minVal = colReducedMatrix[i][j]
    }
    const finalMin = minVal === Infinity ? 0 : minVal
    minCols.push(finalMin)

    if (finalMin > 0) {
      for (let i = 0; i < n; i++) {
        if (colReducedMatrix[i][j] !== Infinity) {
          colReducedMatrix[i][j] -= finalMin
        }
      }
    }
  }

  pasos.push({
    titulo: '3. Reducción por Columnas',
    descripcion: `Se resta el elemento mínimo de cada columna: [${minCols.join(', ')}].`,
    matrix: colReducedMatrix.map(row => [...row]),
    labels
  })

  // --- PASO 4: Asignación de Ceros ---
  const asignaciones = []
  const rowAssigned = new Array(n).fill(false)
  const colAssigned = new Array(n).fill(false)
  let costoTotal = 0

  // 1ra pasada: Filas con un único cero
  for (let i = 0; i < n; i++) {
    const zeroCols = []
    for (let j = 0; j < n; j++) {
      if (colReducedMatrix[i][j] === 0 && !colAssigned[j]) {
        zeroCols.push(j)
      }
    }
    if (zeroCols.length === 1) {
      const j = zeroCols[0]
      rowAssigned[i] = true
      colAssigned[j] = true
      const costoOriginal = originalMatrix[i][j]
      costoTotal += (costoOriginal === Infinity ? 0 : costoOriginal)
      asignaciones.push({
        origen: labels[i],
        destino: labels[j],
        costo: costoOriginal === Infinity ? 0 : costoOriginal,
        rowIdx: i,
        colIdx: j
      })
    }
  }

  // 2da pasada: Asignar ceros restantes disponibles
  for (let i = 0; i < n; i++) {
    if (rowAssigned[i]) continue
    for (let j = 0; j < n; j++) {
      if (!colAssigned[j] && colReducedMatrix[i][j] === 0) {
        rowAssigned[i] = true
        colAssigned[j] = true
        const costoOriginal = originalMatrix[i][j]
        costoTotal += (costoOriginal === Infinity ? 0 : costoOriginal)
        asignaciones.push({
          origen: labels[i],
          destino: labels[j],
          costo: costoOriginal === Infinity ? 0 : costoOriginal,
          rowIdx: i,
          colIdx: j
        })
        break
      }
    }
  }

  pasos.push({
    titulo: '4. Matriz Final con Asignación de Ceros',
    descripcion: 'Ubicación de los ceros independientes seleccionados para la solución óptima.',
    matrix: colReducedMatrix.map(row => [...row]),
    labels,
    asignaciones
  })

  return {
    metodo: 'Método de Ceros',
    costoTotal,
    asignaciones,
    pasos
  }
}