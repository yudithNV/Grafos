// =====================================================
// ALGORITMO DE JOHNSON / CAMINO CRÍTICO
// =====================================================
//
// LADO IZQUIERDO = IDA
// SUMAR + elegir el MAYOR
//
// LADO DERECHO = REGRESO
// RESTAR + elegir el MENOR
//
// HOLGURA:
// H = B2 - A1 - atributo
//
// Soporta:
// - varios nodos iniciales
// - varios nodos finales
//
// =====================================================


// =====================================================
// 1. ENCONTRAR TODOS LOS NODOS INICIALES
// =====================================================
// Son los nodos a los que NO llega ninguna arista.
export function encontrarNodosInicio(nodes, edges) {
  return nodes.filter(node => {
    return !edges.some(edge => edge.targetId === node.id)
  })
}


// =====================================================
// 2. ENCONTRAR TODOS LOS NODOS FINALES
// =====================================================
// Son los nodos de los que NO sale ninguna arista.
export function encontrarNodosFinales(nodes, edges) {
  return nodes.filter(node => {
    return !edges.some(edge => edge.sourceId === node.id)
  })
}


// =====================================================
// 3. ORDEN TOPOLÓGICO
// =====================================================
export function ordenarTopologicamente(nodes, edges) {
  const gradoEntrada = {}

  nodes.forEach(node => {
    gradoEntrada[node.id] = 0
  })

  edges.forEach(edge => {
    if (gradoEntrada[edge.targetId] !== undefined) {
      gradoEntrada[edge.targetId]++
    }
  })

  const cola = nodes
    .filter(node => gradoEntrada[node.id] === 0)
    .map(node => node.id)

  const orden = []

  while (cola.length > 0) {
    const actual = cola.shift()

    orden.push(actual)

    const salientes = edges.filter(
      edge => edge.sourceId === actual
    )

    salientes.forEach(edge => {
      gradoEntrada[edge.targetId]--

      if (gradoEntrada[edge.targetId] === 0) {
        cola.push(edge.targetId)
      }
    })
  }

  if (orden.length !== nodes.length) {
    throw new Error(
      'El grafo contiene ciclos. El cálculo de camino crítico requiere un grafo dirigido acíclico.'
    )
  }

  return orden
}


// =====================================================
// 4. RECORRIDO DE IDA
// =====================================================
//
// SUMA + MAYOR
//
// TODOS los nodos iniciales comienzan en 0.
//
export function calcularIda(nodes, edges, iniciosIds) {
  const orden = ordenarTopologicamente(nodes, edges)

  const ida = {}

  nodes.forEach(node => {
    ida[node.id] = -Infinity
  })

  // Todos los inicios comienzan en 0
  iniciosIds.forEach(id => {
    ida[id] = 0
  })

  for (const nodeId of orden) {

    if (ida[nodeId] === -Infinity) {
      continue
    }

    const salientes = edges.filter(
      edge => edge.sourceId === nodeId
    )

    for (const edge of salientes) {

      const peso = Number(edge.weight)

      if (Number.isNaN(peso)) {
        continue
      }

      const candidato =
        ida[nodeId] + peso

      ida[edge.targetId] = Math.max(
        ida[edge.targetId],
        candidato
      )
    }
  }

  return ida
}


// =====================================================
// 5. RECORRIDO DE REGRESO
// =====================================================
//
// RESTA + MENOR
//
// TODOS los nodos finales empiezan con la duración total.
//
export function calcularRegreso(
  nodes,
  edges,
  finalesIds,
  duracionProyecto
) {
  const orden = ordenarTopologicamente(nodes, edges)

  const ordenInvertido = [...orden].reverse()

  const regreso = {}

  nodes.forEach(node => {
    regreso[node.id] = Infinity
  })

  // Todos los finales reciben la duración total
  finalesIds.forEach(id => {
    regreso[id] = duracionProyecto
  })

  for (const nodeId of ordenInvertido) {

    const salientes = edges.filter(
      edge => edge.sourceId === nodeId
    )

    for (const edge of salientes) {

      if (regreso[edge.targetId] === Infinity) {
        continue
      }

      const peso = Number(edge.weight)

      if (Number.isNaN(peso)) {
        continue
      }

      const candidato =
        regreso[edge.targetId] - peso

      regreso[nodeId] = Math.min(
        regreso[nodeId],
        candidato
      )
    }
  }

  return regreso
}


// =====================================================
// 6. CALCULAR HOLGURAS
// =====================================================
//
// H = B2 - A1 - atributo
//
export function calcularHolguras(
  edges,
  ida,
  regreso
) {
  return edges.map(edge => {

    const A1 = ida[edge.sourceId]
    const B2 = regreso[edge.targetId]
    const atributo = Number(edge.weight)

    if (
      A1 === undefined ||
      B2 === undefined ||
      A1 === -Infinity ||
      B2 === Infinity ||
      Number.isNaN(atributo)
    ) {
      return {
        ...edge,
        holgura: null,
        critica: false
      }
    }

    const holgura =
      B2 - A1 - atributo

    return {
      ...edge,
      holgura,
      critica: holgura === 0
    }
  })
}


// =====================================================
// 7. ARISTAS CRÍTICAS
// =====================================================
export function obtenerAristasCriticas(holguras) {
  return holguras.filter(
    edge => edge.critica === true
  )
}


// =====================================================
// 8. FUNCIÓN PRINCIPAL
// =====================================================
export function calcularJohnson(nodes, edges) {

  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(
      'No hay nodos para calcular el algoritmo.'
    )
  }

  if (!Array.isArray(edges) || edges.length === 0) {
    throw new Error(
      'No hay aristas para calcular el algoritmo.'
    )
  }

  // -----------------------------------------------
  // Detectar todos los inicios
  // -----------------------------------------------
  const inicios =
    encontrarNodosInicio(nodes, edges)

  if (inicios.length === 0) {
    throw new Error(
      'No se encontraron nodos iniciales.'
    )
  }

  // -----------------------------------------------
  // Detectar todos los finales
  // -----------------------------------------------
  const finales =
    encontrarNodosFinales(nodes, edges)

  if (finales.length === 0) {
    throw new Error(
      'No se encontraron nodos finales.'
    )
  }

  const iniciosIds =
    inicios.map(node => node.id)

  const finalesIds =
    finales.map(node => node.id)

  // -----------------------------------------------
  // IDA
  // -----------------------------------------------
  const ida =
    calcularIda(
      nodes,
      edges,
      iniciosIds
    )

  // -----------------------------------------------
  // DURACIÓN TOTAL
  // -----------------------------------------------
  //
  // El mayor valor entre todos los nodos finales.
  //
  const duracionProyecto = Math.max(
    ...finalesIds.map(id => ida[id])
  )

  if (
    duracionProyecto === -Infinity ||
    !Number.isFinite(duracionProyecto)
  ) {
    throw new Error(
      'No se pudo determinar la duración del proyecto.'
    )
  }

  // -----------------------------------------------
  // REGRESO
  // -----------------------------------------------
  const regreso =
    calcularRegreso(
      nodes,
      edges,
      finalesIds,
      duracionProyecto
    )

  // -----------------------------------------------
  // HOLGURAS
  // -----------------------------------------------
  const holguras =
    calcularHolguras(
      edges,
      ida,
      regreso
    )

  // -----------------------------------------------
  // ARISTAS CRÍTICAS
  // -----------------------------------------------
  const aristasCriticas =
    obtenerAristasCriticas(holguras)

  // -----------------------------------------------
  // RESULTADO
  // -----------------------------------------------
  return {
    inicioIds: iniciosIds,
    finIds: finalesIds,

    ida,
    regreso,

    holguras,

    aristasCriticas,

    duracionProyecto
  }
}