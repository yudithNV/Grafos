// ==========================================
// CAMINO MÁXIMO EN UN GRAFO DIRIGIDO ACÍCLICO
// ==========================================

export const calcularCaminoMaximo = (
  nodes,
  edges,
  origenId,
  destinoId
) => {

  // ======================================
  // 1. VALIDACIONES
  // ======================================

  if (!nodes.length) {
    throw new Error('El grafo no tiene nodos.')
  }

  const ids = new Set(nodes.map(node => node.id))

  if (!ids.has(origenId) || !ids.has(destinoId)) {
    throw new Error('Selecciona un origen y destino válidos.')
  }

  // ======================================
  // 2. CREAR LISTA DE ADYACENCIA
  // ======================================

  const adyacencia = new Map()
  const gradoEntrada = new Map()

  nodes.forEach(node => {
    adyacencia.set(node.id, [])
    gradoEntrada.set(node.id, 0)
  })

  edges.forEach(edge => {

    const peso = Number(edge.weight)

    if (!ids.has(edge.sourceId) || !ids.has(edge.targetId)) {
      throw new Error('Existen conexiones con nodos inválidos.')
    }

    if (!Number.isFinite(peso)) {
      throw new Error('Todas las conexiones deben tener un peso numérico.')
    }

    adyacencia.get(edge.sourceId).push({
      id: edge.id,
      destino: edge.targetId,
      peso
    })

    gradoEntrada.set(
      edge.targetId,
      gradoEntrada.get(edge.targetId) + 1
    )
  })

  // ======================================
  // 3. ORDENAMIENTO TOPOLÓGICO
  // ======================================

  const cola = []

  nodes.forEach(node => {
    if (gradoEntrada.get(node.id) === 0) {
      cola.push(node.id)
    }
  })

  const ordenTopologico = []

  let indice = 0

  while (indice < cola.length) {

    const actual = cola[indice++]

    ordenTopologico.push(actual)

    for (const edge of adyacencia.get(actual)) {

      const nuevoGrado =
        gradoEntrada.get(edge.destino) - 1

      gradoEntrada.set(edge.destino, nuevoGrado)

      if (nuevoGrado === 0) {
        cola.push(edge.destino)
      }
    }
  }

  // Si no procesamos todos los nodos, existe un ciclo.
  if (ordenTopologico.length !== nodes.length) {
    throw new Error(
      'No se puede maximizar: el grafo contiene ciclos. ' +
      'El cálculo del camino máximo requiere un grafo dirigido acíclico.'
    )
  }

  // ======================================
  // 4. INICIALIZAR DISTANCIAS
  // ======================================

  const distancias = new Map()
  const anteriores = new Map()
  const aristasAnteriores = new Map()

  nodes.forEach(node => {
    distancias.set(node.id, -Infinity)
    anteriores.set(node.id, null)
  })

  distancias.set(origenId, 0)

  // ======================================
  // 5. CALCULAR CAMINO MÁXIMO
  // ======================================

  for (const actual of ordenTopologico) {

    const distanciaActual = distancias.get(actual)

    if (distanciaActual === -Infinity) {
      continue
    }

    for (const edge of adyacencia.get(actual)) {

      const nuevaDistancia =
        distanciaActual + edge.peso

      if (
        nuevaDistancia >
        distancias.get(edge.destino)
      ) {

        distancias.set(
          edge.destino,
          nuevaDistancia
        )

        anteriores.set(
          edge.destino,
          actual
        )

        aristasAnteriores.set(
          edge.destino,
          edge.id
        )
      }
    }
  }

  // ======================================
  // 6. VERIFICAR SI EXISTE CAMINO
  // ======================================

  if (distancias.get(destinoId) === -Infinity) {
    return {
      alcanzable: false,
      distancia: null,
      camino: [],
      aristasCamino: []
    }
  }

  // ======================================
  // 7. RECONSTRUIR CAMINO MÁXIMO
  // ======================================

  const camino = []
  const aristasCamino = []

  let actual = destinoId

  while (actual !== null) {

    camino.unshift(actual)

    const aristaId = aristasAnteriores.get(actual)

    if (aristaId !== undefined) {
      aristasCamino.unshift(aristaId)
    }

    actual = anteriores.get(actual)
  }

  return {
    alcanzable: true,
    distancia: distancias.get(destinoId),
    camino,
    aristasCamino
  }
}