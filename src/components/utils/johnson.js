// =====================================================
// ALGORITMO DE JOHNSON
// =====================================================
//
// MODOS:
//
// MAXIMIZAR
// - IDA: SUMAR + elegir el MAYOR
// - Resultado: camino de MAYOR valor
//
// MINIMIZAR
// - IDA: SUMAR + elegir el MENOR
// - Resultado: camino de MENOR valor
//
// MAXIMIZAR mantiene además:
// - recorrido de regreso
// - holguras
// - camino crítico
//
// HOLGURA:
// H = B2 - A1 - atributo
//
// Soporta:
// - varios nodos iniciales
// - varios nodos finales
// - maximizar
// - minimizar
//
// =====================================================


// =====================================================
// 1. ENCONTRAR TODOS LOS NODOS INICIALES
// =====================================================
// Son los nodos a los que NO llega ninguna arista.
export function encontrarNodosInicio(nodes, edges) {
  return nodes.filter(node => {
    return !edges.some(
      edge => edge.targetId === node.id
    )
  })
}


// =====================================================
// 2. ENCONTRAR TODOS LOS NODOS FINALES
// =====================================================
// Son los nodos de los que NO sale ninguna arista.
export function encontrarNodosFinales(nodes, edges) {
  return nodes.filter(node => {
    return !edges.some(
      edge => edge.sourceId === node.id
    )
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


  // Nodos que no tienen entradas
  const cola = nodes
    .filter(
      node => gradoEntrada[node.id] === 0
    )
    .map(
      node => node.id
    )


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


  // Si no pudimos ordenar todos los nodos,
  // significa que existe un ciclo.
  if (orden.length !== nodes.length) {

    throw new Error(
      'El grafo contiene ciclos. Johnson requiere un grafo dirigido acíclico.'
    )

  }


  return orden
}


// =====================================================
// 4. RECORRIDO DE IDA
// =====================================================
//
// MAXIMIZAR
// SUMAR + MAYOR
//
// MINIMIZAR
// SUMAR + MENOR
//
// Todos los nodos iniciales comienzan en 0.
//
// =====================================================
export function calcularIda(
  nodes,
  edges,
  iniciosIds,
  modo = 'maximizar'
) {

  const orden =
    ordenarTopologicamente(
      nodes,
      edges
    )


  const ida = {}


  // ==========================================
  // VALORES INICIALES
  // ==========================================

  nodes.forEach(node => {

    if (modo === 'minimizar') {

      // Para minimizar necesitamos
      // empezar con infinito positivo.
      ida[node.id] = Infinity

    } else {

      // Para maximizar necesitamos
      // empezar con infinito negativo.
      ida[node.id] = -Infinity

    }

  })


  // Todos los nodos iniciales comienzan en 0.
  iniciosIds.forEach(id => {

    ida[id] = 0

  })


  // ==========================================
  // RECORRIDO
  // ==========================================

  for (const nodeId of orden) {


    // Si el nodo todavía no es alcanzable,
    // no continuamos desde él.
    if (!Number.isFinite(ida[nodeId])) {
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


      // SUMAR
      const candidato =
        ida[nodeId] + peso


      // ======================================
      // MINIMIZAR
      // ======================================

      if (modo === 'minimizar') {

        ida[edge.targetId] =
          Math.min(
            ida[edge.targetId],
            candidato
          )

      }

      // ======================================
      // MAXIMIZAR
      // ======================================

      else {

        ida[edge.targetId] =
          Math.max(
            ida[edge.targetId],
            candidato
          )

      }

    }

  }


  return ida
}


// =====================================================
// 5. RECORRIDO DE REGRESO
// =====================================================
//
// Se mantiene para el cálculo tradicional
// del camino crítico:
//
// RESTAR + elegir el MENOR.
//
// Todos los nodos finales empiezan
// con la duración total.
//
// =====================================================
export function calcularRegreso(
  nodes,
  edges,
  finalesIds,
  duracionProyecto
) {

  const orden =
    ordenarTopologicamente(
      nodes,
      edges
    )


  const ordenInvertido =
    [...orden].reverse()


  const regreso = {}


  nodes.forEach(node => {

    regreso[node.id] = Infinity

  })


  // Todos los finales reciben
  // la duración total.
  finalesIds.forEach(id => {

    regreso[id] = duracionProyecto

  })


  for (const nodeId of ordenInvertido) {


    const salientes = edges.filter(
      edge => edge.sourceId === nodeId
    )


    for (const edge of salientes) {


      if (
        regreso[edge.targetId] === Infinity
      ) {
        continue
      }


      const peso =
        Number(edge.weight)


      if (Number.isNaN(peso)) {
        continue
      }


      // RESTAR
      const candidato =
        regreso[edge.targetId] - peso


      // Elegir el MENOR
      regreso[nodeId] =
        Math.min(
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
// =====================================================
export function calcularHolguras(
  edges,
  ida,
  regreso
) {

  return edges.map(edge => {


    const A1 =
      ida[edge.sourceId]


    const B2 =
      regreso[edge.targetId]


    const atributo =
      Number(edge.weight)


    if (
      A1 === undefined ||
      B2 === undefined ||
      !Number.isFinite(A1) ||
      !Number.isFinite(B2) ||
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
export function obtenerAristasCriticas(
  holguras
) {

  return holguras.filter(
    edge => edge.critica === true
  )

}


// =====================================================
// 8. OBTENER CAMINO ÓPTIMO
// =====================================================
//
// Esta función reconstruye el camino elegido
// según los valores calculados en IDA.
//
// Sirve tanto para:
//
// MAXIMIZAR
// MINIMIZAR
//
// Una arista pertenece al camino posible cuando:
//
// ida[origen] + peso = ida[destino]
//
// =====================================================
export function obtenerCaminoOptimo(
  nodes,
  edges,
  ida,
  finalesIds,
  resultado
) {

  // ==========================================
  // BUSCAR EL NODO FINAL CORRECTO
  // ==========================================

  const finalId =
    finalesIds.find(
      id => ida[id] === resultado
    )


  if (!finalId) {
    return []
  }


  const caminoInvertido = []

  let actual = finalId

  const visitados = new Set()


  // ==========================================
  // RECORRER HACIA ATRÁS
  // ==========================================

  while (actual) {


    // Seguridad adicional
    if (visitados.has(actual)) {
      break
    }


    visitados.add(actual)


    const entrantes = edges.filter(
      edge => edge.targetId === actual
    )


    // Si no tiene aristas entrantes,
    // llegamos al nodo inicial.
    if (entrantes.length === 0) {
      break
    }


    // Buscar qué arista produjo exactamente
    // el valor actual.
    const edgeCorrecta =
      entrantes.find(edge => {

        const peso =
          Number(edge.weight)


        if (Number.isNaN(peso)) {
          return false
        }


        const valorOrigen =
          ida[edge.sourceId]


        const valorDestino =
          ida[edge.targetId]


        if (
          !Number.isFinite(valorOrigen) ||
          !Number.isFinite(valorDestino)
        ) {
          return false
        }


        return (
          valorOrigen + peso ===
          valorDestino
        )

      })


    if (!edgeCorrecta) {
      break
    }


    caminoInvertido.push(
      edgeCorrecta
    )


    actual =
      edgeCorrecta.sourceId

  }


  // Como recorrimos desde el final
  // hacia el inicio, invertimos.
  return caminoInvertido.reverse()
}


// =====================================================
// 9. FUNCIÓN PRINCIPAL
// =====================================================
export function calcularJohnson(
  nodes,
  edges,
  modo = 'maximizar'
) {

  // ==========================================
  // VALIDAR MODO
  // ==========================================

  if (
    modo !== 'maximizar' &&
    modo !== 'minimizar'
  ) {

    throw new Error(
      'El modo debe ser maximizar o minimizar.'
    )

  }


  // ==========================================
  // VALIDAR NODOS
  // ==========================================

  if (
    !Array.isArray(nodes) ||
    nodes.length === 0
  ) {

    throw new Error(
      'No hay nodos para calcular el algoritmo.'
    )

  }


  // ==========================================
  // VALIDAR ARISTAS
  // ==========================================

  if (
    !Array.isArray(edges) ||
    edges.length === 0
  ) {

    throw new Error(
      'No hay aristas para calcular el algoritmo.'
    )

  }


  // ==========================================
  // VALIDAR QUE NO EXISTAN CICLOS
  // ==========================================

  ordenarTopologicamente(
    nodes,
    edges
  )


  // ==========================================
  // ENCONTRAR NODOS INICIALES
  // ==========================================

  const inicios =
    encontrarNodosInicio(
      nodes,
      edges
    )


  if (inicios.length === 0) {

    throw new Error(
      'No se encontraron nodos iniciales.'
    )

  }


  // ==========================================
  // ENCONTRAR NODOS FINALES
  // ==========================================

  const finales =
    encontrarNodosFinales(
      nodes,
      edges
    )


  if (finales.length === 0) {

    throw new Error(
      'No se encontraron nodos finales.'
    )

  }


  const iniciosIds =
    inicios.map(
      node => node.id
    )


  const finalesIds =
    finales.map(
      node => node.id
    )


  // ==========================================
  // CALCULAR IDA
  // ==========================================

  const ida =
    calcularIda(
      nodes,
      edges,
      iniciosIds,
      modo
    )


  // ==========================================
  // OBTENER VALORES DE LOS NODOS FINALES
  // ==========================================

  const valoresFinales =
    finalesIds
      .map(id => ida[id])
      .filter(
        valor => Number.isFinite(valor)
      )


  if (valoresFinales.length === 0) {

    throw new Error(
      'No se pudo determinar el resultado.'
    )

  }


  // ==========================================
  // RESULTADO FINAL
  // ==========================================
  //
  // MAXIMIZAR -> MAYOR
  // MINIMIZAR -> MENOR
  //
  // ==========================================

  const duracionProyecto =
    modo === 'minimizar'
      ? Math.min(...valoresFinales)
      : Math.max(...valoresFinales)


  // ==========================================
  // CAMINO ÓPTIMO
  // ==========================================

  const caminoOptimo =
    obtenerCaminoOptimo(
      nodes,
      edges,
      ida,
      finalesIds,
      duracionProyecto
    )


  // ==========================================
  // REGRESO / HOLGURAS
  // ==========================================
  //
  // Se utilizan normalmente para MAXIMIZAR
  // (camino crítico).
  //
  // Para MINIMIZAR el camino se obtiene
  // mediante caminoOptimo.
  //
  // ==========================================

  let regreso = {}

  let holguras = []

  let aristasCriticas = []


  if (modo === 'maximizar') {


    // -----------------------------------------
    // REGRESO
    // -----------------------------------------

    regreso =
      calcularRegreso(
        nodes,
        edges,
        finalesIds,
        duracionProyecto
      )


    // -----------------------------------------
    // HOLGURAS
    // -----------------------------------------

    holguras =
      calcularHolguras(
        edges,
        ida,
        regreso
      )


    // -----------------------------------------
    // ARISTAS CRÍTICAS
    // -----------------------------------------

    aristasCriticas =
      obtenerAristasCriticas(
        holguras
      )

  }


  // ==========================================
  // RESULTADO
  // ==========================================

  return {

    // Modo seleccionado
    modo,


    // Nodos iniciales
    inicioIds:
      iniciosIds,


    // Nodos finales
    finIds:
      finalesIds,


    // Valores calculados
    ida,

    regreso,


    // Holguras
    holguras,


    // Aristas críticas
    aristasCriticas,


    // Camino seleccionado
    caminoOptimo,


    // Resultado final
    duracionProyecto

  }
}