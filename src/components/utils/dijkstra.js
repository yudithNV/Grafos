// ==========================================
// ALGORITMO DE DIJKSTRA
// Calcula el camino mínimo entre dos nodos
// ==========================================

export const calcularDijkstra = (
  nodes,
  edges,
  inicioId,
  destinoId = null
) => {

  // ==========================================
  // 1. VALIDACIONES
  // ==========================================

  if (!nodes || nodes.length === 0) {
    throw new Error('El grafo no tiene nodos.')
  }

  if (!nodes.some(node => node.id === inicioId)) {
    throw new Error('El nodo inicial no existe.')
  }

  if (
    destinoId !== null &&
    !nodes.some(node => node.id === destinoId)
  ) {
    throw new Error('El nodo destino no existe.')
  }

  // Validar conexiones y pesos
  for (const edge of edges) {

    const peso = Number(edge.weight)

    if (
      edge.weight === null ||
      edge.weight === undefined ||
      String(edge.weight).trim() === '' ||
      !Number.isFinite(peso) ||
      peso < 0
    ) {
      throw new Error(
        'Dijkstra solo permite pesos numéricos mayores o iguales a cero.'
      )
    }

    if (
      !nodes.some(node => node.id === edge.sourceId) ||
      !nodes.some(node => node.id === edge.targetId)
    ) {
      throw new Error(
        'Existe una conexión que contiene nodos inexistentes.'
      )
    }
  }

  // ==========================================
  // 2. INICIALIZAR VARIABLES
  // ==========================================

  const distancias = {}
  const anteriores = {}
  const aristaAnterior = {}

  const visitados = new Set()

  nodes.forEach(node => {
    distancias[node.id] = Infinity
    anteriores[node.id] = null
    aristaAnterior[node.id] = null
  })

  // La distancia del origen hacia sí mismo es 0
  distancias[inicioId] = 0

  // ==========================================
  // 3. EJECUTAR DIJKSTRA
  // ==========================================

  while (visitados.size < nodes.length) {

    let nodoActual = null
    let distanciaMinima = Infinity

    // Buscar el nodo no visitado con menor distancia
    for (const node of nodes) {

      if (
        !visitados.has(node.id) &&
        distancias[node.id] < distanciaMinima
      ) {
        distanciaMinima = distancias[node.id]
        nodoActual = node.id
      }
    }

    // No existen más nodos alcanzables
    if (nodoActual === null) {
      break
    }

    // Marcar nodo como visitado
    visitados.add(nodoActual)

    // Revisar conexiones que salen del nodo actual
    const conexiones = edges.filter(
      edge => edge.sourceId === nodoActual
    )

    for (const edge of conexiones) {

      const vecino = edge.targetId
      const peso = Number(edge.weight)

      if (visitados.has(vecino)) {
        continue
      }

      // Calcular nueva distancia
      const nuevaDistancia =
        distancias[nodoActual] + peso

      // Actualizar si encontramos un camino más corto
      if (nuevaDistancia < distancias[vecino]) {

        distancias[vecino] = nuevaDistancia

        anteriores[vecino] = nodoActual

        aristaAnterior[vecino] = edge.id
      }
    }
  }

  // ==========================================
  // 4. RECONSTRUIR CAMINO MÍNIMO
  // ==========================================

  const camino = []
  const aristasCamino = []

  if (
    destinoId !== null &&
    distancias[destinoId] !== Infinity
  ) {

    let actual = destinoId

    while (actual !== null) {

      camino.unshift(actual)

      const edgeId = aristaAnterior[actual]

      if (edgeId !== null) {
        aristasCamino.unshift(edgeId)
      }

      actual = anteriores[actual]
    }
  }

  // ==========================================
  // 5. DEVOLVER RESULTADOS
  // ==========================================

  return {
    inicioId,
    destinoId,

    distancias,
    anteriores,

    camino,
    aristasCamino,

    costoTotal:
      destinoId !== null
        ? distancias[destinoId]
        : null,

    alcanzable:
      destinoId !== null
        ? distancias[destinoId] !== Infinity
        : true
  }
}