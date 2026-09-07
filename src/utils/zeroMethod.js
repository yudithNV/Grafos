// src/utils/zeroMethod.js

/**
 * Resuelve el problema de asignación mediante el Método de los Ceros.
 * @param {Array} nodes Listado de nodos del grafo [{ id, label }]
 * @param {Array} edges Listado de conexiones [{ sourceId, targetId, weight }]
 */
export function resolverMetodoCeros(nodes, edges) {
  if (!nodes.length || !edges.length) {
    return {
      exito: false,
      mensaje: 'El grafo debe tener nodos y conexiones con pesos numéricos.'
    }
  }

  // 1. Identificar Orígenes (salidas) y Destinos (entradas)
  const sourceIds = [...new Set(edges.map(e => e.sourceId))]
  const targetIds = [...new Set(edges.map(e => e.targetId))]

  const fuentes = nodes.filter(n => sourceIds.includes(n.id))
  const destinos = nodes.filter(n => targetIds.includes(n.id))

  if (fuentes.length === 0 || destinos.length === 0) {
    return {
      exito: false,
      mensaje: 'Debes conectar nodos origen hacia nodos destino usando aristas con peso.'
    }
  }

  // 2. Construir la Matriz de Costos Original
  const matrizOriginal = fuentes.map(f => {
    return destinos.map(d => {
      const edge = edges.find(e => e.sourceId === f.id && e.targetId === d.id)
      return edge ? Number(edge.weight) : Infinity
    })
  })

  // Clonar matriz para aplicar reducción por ceros
  const matriz = matrizOriginal.map(row => [...row])
  const numFilas = matriz.length
  const numCols = matriz[0].length

  // 3. Paso 1: Restar el mínimo de cada fila (Ceros en filas)
  for (let i = 0; i < numFilas; i++) {
    const minFila = Math.min(...matriz[i].filter(v => v !== Infinity))
    if (minFila !== Infinity && minFila > 0) {
      for (let j = 0; j < numCols; j++) {
        if (matriz[i][j] !== Infinity) matriz[i][j] -= minFila
      }
    }
  }

  // 4. Paso 2: Restar el mínimo de cada columna (Ceros en columnas)
  for (let j = 0; j < numCols; j++) {
    const colVals = matriz.map(r => r[j]).filter(v => v !== Infinity)
    const minCol = Math.min(...colVals)
    if (minCol !== Infinity && minCol > 0) {
      for (let i = 0; i < numFilas; i++) {
        if (matriz[i][j] !== Infinity) matriz[i][j] -= minCol
      }
    }
  }

  // 5. Asignación voraz sobre posiciones con valor 0
  const asignaciones = []
  const filasUsadas = new Set()
  const colsUsadas = new Set()
  let costoTotal = 0

  for (let i = 0; i < numFilas; i++) {
    for (let j = 0; j < numCols; j++) {
      if (matriz[i][j] === 0 && !filasUsadas.has(i) && !colsUsadas.has(j)) {
        const costoOriginal = matrizOriginal[i][j]
        
        filasUsadas.add(i)
        colsUsadas.add(j)

        asignaciones.push({
          origen: fuentes[i].label,
          destino: destinos[j].label,
          costo: costoOriginal
        })

        costoTotal += costoOriginal
        break
      }
    }
  }

  return {
    exito: true,
    metodo: 'Método de los Ceros',
    asignaciones,
    costoTotal,
    matrizReducida: matriz
  }
}