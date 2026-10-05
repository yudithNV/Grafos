// =============================================================
// Algoritmos de ordenamiento para la pizarra de pinos (SortingCanvas.vue)
//
// Cada algoritmo genera de antemano la lista completa de pasos. Cada paso
// es una "foto" del arreglo con:
//   array        -> [{ id, value }] en el orden de ese momento
//   comparisons  -> comparaciones acumuladas
//   moves        -> intercambios / desplazamientos acumulados
//   marks        -> índices destacados: { i, j, min, key }
//   swapped      -> par de índices que acaban de moverse (o null)
//   sortedCount  -> cuántas posiciones del inicio ya están ordenadas
//   line         -> línea del pseudocódigo que se está ejecutando
//   pass         -> número de pasada
//   endOfPass    -> true en el último paso de cada pasada (para el resumen)
//
// Para agregar otro algoritmo basta con añadir una entrada a SORT_ALGORITHMS.
// =============================================================

const tri = (n) => (n * (n - 1)) / 2
const copy = (arr) => arr.map((item) => ({ ...item }))

/* ---------------- SELECTION SORT ---------------- */
function selectionSteps(source, direction) {
  const arr = copy(source)
  const n = arr.length
  const word = direction === 'asc' ? 'menor' : 'mayor'
  const better = (a, b) => (direction === 'asc' ? a < b : a > b)
  const steps = []
  let comparisons = 0
  let moves = 0

  const snap = (extra) => steps.push({
    array: copy(arr), comparisons, moves, marks: {}, swapped: null, endOfPass: false, ...extra
  })

  for (let i = 0; i < n - 1; i++) {
    let min = i
    const compsBefore = comparisons
    snap({
      marks: { i, min }, sortedCount: i, line: 1, pass: i + 1,
      title: `Pasada ${i + 1}: buscar el ${word} desde la posición ${i}`,
      description: `Suponemos que el ${word} de la parte sin ordenar es A[${i}] = ${arr[i].value}. Ahora lo comparamos con los pinos de su derecha.`
    })

    for (let j = i + 1; j < n; j++) {
      comparisons++
      const prev = arr[min].value
      if (better(arr[j].value, prev)) {
        min = j
        snap({
          marks: { i, j, min }, sortedCount: i, line: 4, pass: i + 1,
          title: `Nuevo ${word}: ${arr[j].value}`,
          description: `Comparamos A[${j}] = ${arr[j].value} con el ${word} actual (${prev}). Como ${arr[j].value} es ${word}, ahora min apunta a la posición ${j}.`
        })
      } else {
        snap({
          marks: { i, j, min }, sortedCount: i, line: 3, pass: i + 1,
          title: `Comparar A[${j}] con A[${min}]`,
          description: `${arr[j].value} no es ${word} que ${prev}, así que el ${word} sigue siendo A[${min}] = ${prev}.`
        })
      }
    }

    const passComparisons = comparisons - compsBefore
    if (min !== i) {
      const a = arr[i].value
      const b = arr[min].value
      ;[arr[i], arr[min]] = [arr[min], arr[i]]
      moves++
      snap({
        marks: { i }, sortedCount: i + 1, line: 5, pass: i + 1, swapped: [i, min], endOfPass: true,
        passComparisons, passMoves: 1, highlight: [i, min],
        title: `Intercambio: ${b} ↔ ${a}`,
        description: `El ${word} de la pasada es ${b} (posición ${min}). Se intercambia con A[${i}] = ${a} y la posición ${i} queda ordenada.`
      })
    } else {
      snap({
        marks: { i }, sortedCount: i + 1, line: 5, pass: i + 1, endOfPass: true,
        passComparisons, passMoves: 0, highlight: [],
        title: `Sin intercambio en la pasada ${i + 1}`,
        description: `A[${i}] = ${arr[i].value} ya era el ${word}, así que no se intercambia. La posición ${i} queda ordenada.`
      })
    }
  }

  snap({
    sortedCount: n, line: null, pass: Math.max(n - 1, 0),
    title: '¡Pinos ordenados!',
    description: `Terminamos en ${n - 1} pasadas: ${comparisons} comparaciones y ${moves} intercambios, en total ${comparisons + moves} pasos. El último pino queda en su lugar automáticamente.`
  })
  return steps
}

/* ---------------- INSERTION SORT ---------------- */
function insertionSteps(source, direction) {
  const arr = copy(source)
  const n = arr.length
  const bigger = direction === 'asc' ? 'mayor' : 'menor'
  const outOfPlace = (a, key) => (direction === 'asc' ? a > key : a < key)
  const steps = []
  let comparisons = 0
  let moves = 0

  const snap = (extra) => steps.push({
    array: copy(arr), comparisons, moves, marks: {}, swapped: null, endOfPass: false, ...extra
  })

  for (let i = 1; i < n; i++) {
    const key = arr[i].value
    let keyIdx = i
    const compsBefore = comparisons
    const movesBefore = moves

    snap({
      marks: { key: i }, sortedCount: i + 1, line: 1, pass: i,
      title: `Pasada ${i}: tomar la llave A[${i}] = ${key}`,
      description: `Los pinos de las posiciones 0 a ${i - 1} ya están ordenados entre sí. Levantamos el pino ${key} y buscamos dónde insertarlo dentro de esa parte.`
    })

    let j = i - 1
    while (j >= 0) {
      comparisons++
      const value = arr[j].value
      if (outOfPlace(value, key)) {
        snap({
          marks: { key: keyIdx, j }, sortedCount: i + 1, line: 3, pass: i,
          title: `Comparar A[${j}] = ${value} con la llave ${key}`,
          description: `${value} es ${bigger} que ${key}, así que tiene que moverse una posición a la derecha.`
        })
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        moves++
        keyIdx = j
        snap({
          marks: { key: keyIdx }, sortedCount: i + 1, line: 4, pass: i, swapped: [j, j + 1],
          title: `Desplazar ${value} a la derecha`,
          description: `${value} pasa a la posición ${j + 1} y la llave ${key} avanza a la posición ${j}.`
        })
        j--
      } else {
        snap({
          marks: { key: keyIdx, j }, sortedCount: i + 1, line: 3, pass: i,
          title: `Comparar A[${j}] = ${value} con la llave ${key}`,
          description: `${value} no es ${bigger} que ${key}, así que nos detenemos: la llave va justo a su derecha, en la posición ${j + 1}.`
        })
        break
      }
    }

    const passMoves = moves - movesBefore
    snap({
      marks: { key: keyIdx }, sortedCount: i + 1, line: 6, pass: i, endOfPass: true,
      passComparisons: comparisons - compsBefore, passMoves, highlight: [keyIdx],
      title: passMoves === 0 ? `${key} ya estaba en su lugar` : `Insertar ${key} en la posición ${keyIdx}`,
      description: passMoves === 0
        ? `No hubo que desplazar ningún pino. Ahora las posiciones 0 a ${i} están ordenadas entre sí.`
        : `Se desplazaron ${passMoves} pino${passMoves > 1 ? 's' : ''} y la llave ${key} quedó en la posición ${keyIdx}${j < 0 ? ', al inicio del arreglo' : ''}. Ahora las posiciones 0 a ${i} están ordenadas entre sí.`
    })
  }

  snap({
    sortedCount: n, line: null, pass: Math.max(n - 1, 0),
    title: '¡Pinos ordenados!',
    description: `Terminamos en ${n - 1} pasadas: ${comparisons} comparaciones y ${moves} desplazamientos, en total ${comparisons + moves} pasos.`
  })
  return steps
}

// Cantidad de inversiones (pares fuera de orden) = desplazamientos de Insertion Sort
export function countInversions(values, direction) {
  let inversions = 0
  for (let a = 0; a < values.length; a++) {
    for (let b = a + 1; b < values.length; b++) {
      if (direction === 'asc' ? values[a] > values[b] : values[a] < values[b]) inversions++
    }
  }
  return inversions
}

/* ---------------- CATÁLOGO ---------------- */
export const SORT_ALGORITHMS = {
  seleccion: {
    id: 'seleccion',
    name: 'Selection Sort',
    movesLabel: 'Intercambios',
    movesSingular: 'intercambio',
    generate: selectionSteps,
    pseudocode: (direction) => [
      'para i ← 0 hasta n − 2',
      '  min ← i',
      '  para j ← i + 1 hasta n − 1',
      `    si A[j] ${direction === 'asc' ? '<' : '>'} A[min] entonces`,
      '      min ← j',
      '  si min ≠ i entonces intercambiar A[i] y A[min]'
    ],
    tags: (direction) => [
      { mark: 'i', label: 'i', cls: 'tag-i' },
      { mark: 'min', label: direction === 'asc' ? 'min' : 'max', cls: 'tag-min' },
      { mark: 'j', label: 'j', cls: 'tag-j' }
    ],
    legend: (direction) => [
      { cls: 'dot-sorted', label: 'Ordenado' },
      { cls: 'dot-i', label: 'Posición i' },
      { cls: 'dot-min', label: `${direction === 'asc' ? 'Mínimo' : 'Máximo'} actual` },
      { cls: 'dot-j', label: 'Comparando (j)' },
      { cls: 'dot-swap', label: 'Intercambio' }
    ],
    note: (direction) =>
      `En cada pasada se busca el ${direction === 'asc' ? 'menor' : 'mayor'} de la parte sin ordenar y se lleva al inicio de esa parte con un solo intercambio.`,
    // Máximo de comparaciones posible (para la barra de progreso)
    maxComparisons: (n) => tri(n),
    theory: (n) => ({
      text: `Con n = ${n}, Selection Sort siempre hace n(n − 1)/2 = ${tri(n)} comparaciones, sin importar cómo vengan los números. Por eso su complejidad es O(n²) en todos los casos: si duplicas n, las comparaciones se multiplican casi por 4 (con n = ${n * 2} serían ${tri(n * 2)}).`,
      rows: [
        ['Mejor (ya ordenado)', tri(n), 'O(n²)'],
        ['Promedio', tri(n), 'O(n²)'],
        ['Peor', tri(n), 'O(n²)']
      ],
      movesNote: `los intercambios nunca superan n − 1 = ${Math.max(n - 1, 0)}`
    }),
    summary: (n, last) =>
      `Con n = ${n} se hicieron ${last.comparisons} comparaciones, que es exactamente n(n − 1)/2. Esa cantidad no cambia aunque los números ya vengan ordenados, por eso Selection Sort es O(n²) en todos los casos. Los intercambios sí dependen de los datos, pero nunca son más de n − 1 = ${n - 1}.`
  },

  insercion: {
    id: 'insercion',
    name: 'Insertion Sort',
    movesLabel: 'Desplazamientos',
    movesSingular: 'desplazamiento',
    generate: insertionSteps,
    pseudocode: (direction) => [
      'para i ← 1 hasta n − 1',
      '  llave ← A[i]',
      '  j ← i − 1',
      `  mientras j ≥ 0 y A[j] ${direction === 'asc' ? '>' : '<'} llave`,
      '    A[j + 1] ← A[j]     (desplazar)',
      '    j ← j − 1',
      '  A[j + 1] ← llave'
    ],
    tags: () => [
      { mark: 'key', label: 'llave', cls: 'tag-key' },
      { mark: 'j', label: 'j', cls: 'tag-j' }
    ],
    legend: () => [
      { cls: 'dot-sorted', label: 'Parte ordenada' },
      { cls: 'dot-key', label: 'Llave (pino levantado)' },
      { cls: 'dot-j', label: 'Comparando (j)' },
      { cls: 'dot-swap', label: 'Desplazamiento' }
    ],
    note: () =>
      'En cada pasada se levanta el siguiente pino (la llave) y se desliza hacia la izquierda hasta encontrar su lugar dentro de la parte ya ordenada, como cuando ordenas cartas en la mano.',
    maxComparisons: (n) => tri(n),
    theory: (n, values, direction) => {
      const inversions = values ? countInversions(values, direction) : null
      return {
        text: `Con n = ${n}, Insertion Sort depende de cómo vengan los números. Si ya están ordenados solo hace n − 1 = ${Math.max(n - 1, 0)} comparaciones: O(n). Si están al revés hace n(n − 1)/2 = ${tri(n)}: O(n²).` +
          (inversions !== null
            ? ` Tu arreglo tiene ${inversions} pares fuera de orden (inversiones), así que hará exactamente ${inversions} desplazamientos.`
            : ''),
        rows: [
          ['Mejor (ya ordenado)', Math.max(n - 1, 0), 'O(n)'],
          ['Promedio', `≈ ${Math.round(tri(n) / 2)}`, 'O(n²)'],
          ['Peor (al revés)', tri(n), 'O(n²)']
        ],
        movesNote: `peor caso: ${tri(n)} comparaciones`
      }
    },
    summary: (n, last) =>
      `Con n = ${n} se hicieron ${last.comparisons} comparaciones y ${last.moves} desplazamientos. Insertion Sort es O(n) en el mejor caso (arreglo ya ordenado: ${n - 1} comparaciones) y O(n²) en el peor (arreglo al revés: ${tri(n)} comparaciones). Los desplazamientos siempre son iguales a la cantidad de pares fuera de orden del arreglo.`
  }
}
