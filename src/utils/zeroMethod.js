import { construirMatrizAsignacion } from './assignmentMatrix.js'

/**
 * Aplica la reducción por filas/columnas y la asignación de ceros sobre una
 * matriz de trabajo ya construida (cuadrada). `originalMatrix` se usa para
 * reportar el costo/beneficio REAL de cada asignación (por si `workMatrix`
 * viene invertida para el caso de maximización).
 */
function reducirYAsignar(workMatrix, originalMatrix, rowLabels, colLabels) {
  const n = workMatrix.length
  const pasos = []

  // --- PASO 1: Matriz de trabajo inicial ---
  const copyOriginal = workMatrix.map(row => [...row])
  pasos.push({
    titulo: '1. Matriz de Trabajo Inicial',
    descripcion: 'Matriz de orígenes (filas) contra destinos (columnas), ya balanceada.',
    matrix: copyOriginal.map(row => [...row]),
    labels: rowLabels,
    colLabels
  })

  // --- PASO 2: Reducción por Filas ---
  const rowReducedMatrix = copyOriginal.map(row => [...row])
  const minFilas = []
  for (let i = 0; i < n; i++) {
    const minVal = Math.min(...rowReducedMatrix[i])
    minFilas.push(minVal)
    if (minVal > 0) {
      for (let j = 0; j < n; j++) rowReducedMatrix[i][j] -= minVal
    }
  }
  pasos.push({
    titulo: '2. Reducción por Filas',
    descripcion: `Se resta el elemento mínimo de cada fila: [${minFilas.join(', ')}].`,
    matrix: rowReducedMatrix.map(row => [...row]),
    labels: rowLabels,
    colLabels
  })

  // --- PASO 3: Reducción por Columnas ---
  const colReducedMatrix = rowReducedMatrix.map(row => [...row])
  const minCols = []
  for (let j = 0; j < n; j++) {
    let minVal = Infinity
    for (let i = 0; i < n; i++) {
      if (colReducedMatrix[i][j] < minVal) minVal = colReducedMatrix[i][j]
    }
    minCols.push(minVal)
    if (minVal > 0) {
      for (let i = 0; i < n; i++) colReducedMatrix[i][j] -= minVal
    }
  }
  pasos.push({
    titulo: '3. Reducción por Columnas',
    descripcion: `Se resta el elemento mínimo de cada columna: [${minCols.join(', ')}].`,
    matrix: colReducedMatrix.map(row => [...row]),
    labels: rowLabels,
    colLabels
  })

  // --- PASO 4: Asignación de Ceros ---
  const asignaciones = []
  const rowAssigned = new Array(n).fill(false)
  const colAssigned = new Array(n).fill(false)
  let costoTotal = 0

  // 1ra pasada: filas con un único cero disponible
  for (let i = 0; i < n; i++) {
    const zeroCols = []
    for (let j = 0; j < n; j++) {
      if (colReducedMatrix[i][j] === 0 && !colAssigned[j]) zeroCols.push(j)
    }
    if (zeroCols.length === 1) {
      const j = zeroCols[0]
      rowAssigned[i] = true
      colAssigned[j] = true
      const costoOriginal = originalMatrix[i][j]
      costoTotal += costoOriginal
      asignaciones.push({
        origen: rowLabels[i],
        destino: colLabels[j],
        costo: costoOriginal,
        rowIdx: i,
        colIdx: j
      })
    }
  }

  // 2da pasada: asigna ceros restantes disponibles
  for (let i = 0; i < n; i++) {
    if (rowAssigned[i]) continue
    for (let j = 0; j < n; j++) {
      if (!colAssigned[j] && colReducedMatrix[i][j] === 0) {
        rowAssigned[i] = true
        colAssigned[j] = true
        const costoOriginal = originalMatrix[i][j]
        costoTotal += costoOriginal
        asignaciones.push({
          origen: rowLabels[i],
          destino: colLabels[j],
          costo: costoOriginal,
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
    labels: rowLabels,
    colLabels,
    asignaciones
  })

  return { asignaciones, costoTotal, pasos }
}

/**
 * Resuelve el problema de asignación a partir del lienzo, con UN SOLO punto
 * de entrada (ya no hay botones separados de "maximizar" / "minimizar").
 *
 * SUPUESTO (ajústalo si tu profesora indica lo contrario): el peso de cada
 * arista representa un COSTO, por lo que por defecto se MINIMIZA. Si en tu
 * caso el peso representa una ganancia/beneficio, cambia el valor por
 * defecto de `modo` a 'maximizar' más abajo.
 */
export function resolverAsignacion(nodes, edges, modo = 'minimizar') {
  const { matrix, rowLabels, colLabels, ambiguos } = construirMatrizAsignacion(nodes, edges)
  const n = matrix.length

  if (n === 0) {
    return {
      metodo: 'Asignación (Método de Ceros)',
      modo,
      costoTotal: 0,
      asignaciones: [],
      pasos: [],
      advertencias: ['El grafo está vacío. Agrega nodos de origen y destino conectados por aristas.']
    }
  }

  let workMatrix = matrix
  if (modo === 'maximizar') {
    const maxVal = Math.max(...matrix.flat(), 0)
    workMatrix = matrix.map(row => row.map(v => maxVal - v))
  }

  const { asignaciones, costoTotal, pasos } = reducirYAsignar(workMatrix, matrix, rowLabels, colLabels)

  const advertencias = []
  if (ambiguos.length > 0) {
    advertencias.push(
      `${ambiguos.length} nodo(s) no se pudieron clasificar como origen/destino (tienen conexiones de entrada y salida a la vez, o ninguna): ${ambiguos.map(n => n.label).join(', ')}.`
    )
  }

  return {
    metodo: `Asignación (Método de Ceros — ${modo === 'maximizar' ? 'Maximizar' : 'Minimizar'})`,
    modo,
    costoTotal,
    asignaciones,
    pasos,
    advertencias
  }
}

// Se conserva por compatibilidad, por si algo más del proyecto la sigue llamando así.
export function resolverMetodoCeros(nodes, edges) {
  return resolverAsignacion(nodes, edges, 'minimizar')
}