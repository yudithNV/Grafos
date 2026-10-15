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


/* ---------------- SHELL SORT ---------------- */
// Secuencia de Shell original: n/2, n/4, ..., 1
export const shellGaps = (n) => {
  const gaps = []
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) gaps.push(gap)
  return gaps
}

function shellSteps(source, direction) {
  const arr = copy(source)
  const n = arr.length
  const bigger = direction === 'asc' ? 'mayor' : 'menor'
  const outOfPlace = (a, key) => (direction === 'asc' ? a > key : a < key)
  const steps = []
  let comparisons = 0
  let moves = 0
  const gaps = shellGaps(n)

  const snap = (extra) => steps.push({
    array: copy(arr), comparisons, moves, marks: {}, swapped: null, endOfPass: false, focus: null, ...extra
  })
  // Índices que pertenecen al mismo subgrupo (misma distancia gap) que la posición i
  const groupOf = (i, gap) => {
    const out = []
    for (let k = i % gap; k < n; k += gap) out.push(k)
    return out
  }

  gaps.forEach((gap, g) => {
    const pass = g + 1
    const compsBefore = comparisons
    const movesBefore = moves

    snap({
      sortedCount: 0, line: 1, pass, gap,
      title: `Pasada ${pass}: distancia gap = ${gap}`,
      description: gap === 1
        ? 'Con gap = 1 se hace un Insertion Sort normal, pero el arreglo ya está casi ordenado gracias a las pasadas anteriores, así que hay muy pocos desplazamientos.'
        : `Se comparan pinos que están a ${gap} posiciones de distancia. Así los valores lejos de su lugar avanzan varias posiciones de un solo salto.`
    })

    for (let i = gap; i < n; i++) {
      const key = arr[i].value
      let keyIdx = i
      const focus = groupOf(i, gap)
      const sc = gap === 1 ? i : 0

      snap({
        marks: { key: i }, sortedCount: sc, line: 3, pass, gap, focus,
        title: `Tomar la llave A[${i}] = ${key} (gap ${gap})`,
        description: `Levantamos el pino ${key} y lo comparamos con los pinos de su subgrupo, que están a ${gap} posiciones hacia la izquierda.`
      })

      let j = i
      while (j >= gap) {
        comparisons++
        const value = arr[j - gap].value
        if (outOfPlace(value, key)) {
          snap({
            marks: { key: keyIdx, j: j - gap }, sortedCount: sc, line: 4, pass, gap, focus,
            title: `Comparar A[${j - gap}] = ${value} con la llave ${key}`,
            description: `${value} es ${bigger} que ${key}, así que salta ${gap} posiciones a la derecha.`
          })
          ;[arr[j - gap], arr[j]] = [arr[j], arr[j - gap]]
          moves++
          keyIdx = j - gap
          snap({
            marks: { key: keyIdx }, sortedCount: sc, line: 5, pass, gap, focus, swapped: [j - gap, j],
            title: `Desplazar ${value} de ${j - gap} a ${j}`,
            description: `${value} pasa a la posición ${j} y la llave ${key} queda en la posición ${j - gap}.`
          })
          j -= gap
        } else {
          snap({
            marks: { key: keyIdx, j: j - gap }, sortedCount: sc, line: 4, pass, gap, focus,
            title: `Comparar A[${j - gap}] = ${value} con la llave ${key}`,
            description: `${value} no es ${bigger} que ${key}: la llave se queda en la posición ${j}.`
          })
          break
        }
      }
    }

    const passMoves = moves - movesBefore
    snap({
      sortedCount: gap === 1 ? n : 0, line: 7, pass, gap, endOfPass: true,
      passComparisons: comparisons - compsBefore, passMoves, highlight: [],
      passTitle: `gap = ${gap}`,
      title: `Fin de la pasada con gap = ${gap}`,
      description: gap === 1
        ? `Última pasada (gap = 1): el arreglo queda ordenado. Se hicieron ${passMoves} desplazamientos en esta pasada.`
        : `Todos los subgrupos separados por ${gap} posiciones quedaron ordenados (${passMoves} desplazamientos). Ahora el gap baja a ${Math.floor(gap / 2)}.`
    })
  })

  snap({
    sortedCount: n, line: null, pass: gaps.length,
    title: '¡Pinos ordenados!',
    description: `Terminamos en ${gaps.length} pasadas (gaps: ${gaps.join(', ')}): ${comparisons} comparaciones y ${moves} desplazamientos, en total ${comparisons + moves} pasos.`
  })
  return steps
}

/* ---------------- MERGE SORT ---------------- */
// Escrituras que hace Merge Sort: no dependen de los datos, solo de n
const mergeWrites = (n) => (n <= 1 ? 0 : n + mergeWrites(Math.ceil(n / 2)) + mergeWrites(Math.floor(n / 2)))
const mergeMerges = (n) => Math.max(n - 1, 0)
const log2ceil = (n) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)))

function mergeSteps(source, direction) {
  const arr = copy(source)
  const n = arr.length
  const takeLeft = (a, b) => (direction === 'asc' ? a <= b : a >= b)
  const word = direction === 'asc' ? 'menor' : 'mayor'
  const steps = []
  let comparisons = 0
  let moves = 0
  let mergeCount = 0
  const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
  const vals = (lo, hi) => arr.slice(lo, hi + 1).map((it) => it.value).join(', ')

  const snap = (extra) => steps.push({
    array: copy(arr), comparisons, moves, marks: {}, swapped: null, endOfPass: false, focus: null, ...extra
  })

  function sort(lo, hi, depth) {
    if (lo >= hi) return
    const mid = Math.floor((lo + hi) / 2)
    snap({
      sortedCount: 0, line: 2, pass: mergeCount, focus: range(lo, hi), depth, phase: 'divide',
      title: `Dividir [${lo}..${hi}] en [${lo}..${mid}] y [${mid + 1}..${hi}]`,
      description: `La parte [${vals(lo, hi)}] se parte por la mitad. Cada mitad se ordena por separado y después se mezclan.`
    })
    sort(lo, mid, depth + 1)
    sort(mid + 1, hi, depth + 1)
    merge(lo, mid, hi)
  }

  function merge(lo, mid, hi) {
    mergeCount++
    const pass = mergeCount
    const focus = range(lo, hi)
    const left = arr.slice(lo, mid + 1)
    const right = arr.slice(mid + 1, hi + 1)
    const placed = []
    let a = 0
    let b = 0
    const compsBefore = comparisons
    const movesBefore = moves
    // Reacomoda visualmente: lo ya colocado, luego lo que queda de la izquierda y de la derecha
    const layout = () => {
      const seq = [...placed, ...left.slice(a), ...right.slice(b)]
      seq.forEach((item, k) => { arr[lo + k] = item })
    }
    const headL = () => lo + placed.length
    const headR = () => lo + placed.length + (left.length - a)

    snap({
      sortedCount: 0, line: 5, pass, focus,
      marks: { j: headL(), min: headR() },
      title: `Mezclar [${left.map((x) => x.value).join(', ')}] con [${right.map((x) => x.value).join(', ')}]`,
      description: 'Las dos mitades ya están ordenadas. Comparamos siempre el primer pino de cada una y colocamos el ' + word + '.'
    })

    while (a < left.length && b < right.length) {
      comparisons++
      const L = left[a].value
      const R = right[b].value
      const fromLeft = takeLeft(L, R)
      snap({
        sortedCount: 0, line: 6, pass, focus, marks: { j: headL(), min: headR() },
        title: `Comparar ${L} (izquierda) con ${R} (derecha)`,
        description: fromLeft
          ? `${L} es ${word} o igual que ${R}, así que se coloca ${L}.`
          : `${R} es ${word} que ${L}, así que se coloca ${R}.`
      })
      const target = headL()
      const from = fromLeft ? headL() : headR()
      placed.push(fromLeft ? left[a++] : right[b++])
      moves++
      layout()
      snap({
        sortedCount: 0, line: 7, pass, focus, swapped: from === target ? [target] : [target, from],
        marks: { j: a < left.length ? headL() : undefined, min: b < right.length ? headR() : undefined },
        title: `Colocar ${placed[placed.length - 1].value} en la posición ${target}`,
        description: `Se escribe ${placed[placed.length - 1].value} en la posición ${target} de la mezcla.`
      })
    }

    const rest = left.length - a + right.length - b
    if (rest > 0) {
      const restVals = [...left.slice(a), ...right.slice(b)].map((x) => x.value)
      placed.push(...left.slice(a), ...right.slice(b))
      a = left.length
      b = right.length
      moves += rest
      layout()
      snap({
        sortedCount: 0, line: 8, pass, focus, swapped: range(hi - rest + 1, hi),
        title: `Copiar los que sobran: ${restVals.join(', ')}`,
        description: `Una de las mitades se terminó, así que los ${rest} pino${rest > 1 ? 's' : ''} restante${rest > 1 ? 's' : ''} se copian al final sin comparar.`
      })
    }

    snap({
      sortedCount: 0, line: 8, pass, focus, endOfPass: true,
      passComparisons: comparisons - compsBefore, passMoves: moves - movesBefore, highlight: focus,
      passTitle: `[${lo}..${hi}]`,
      title: `Mezcla lista: [${vals(lo, hi)}]`,
      description: `Las posiciones ${lo} a ${hi} ya forman una parte ordenada: [${vals(lo, hi)}].`
    })
  }

  sort(0, n - 1, 0)

  snap({
    sortedCount: n, line: null, pass: mergeCount,
    title: '¡Pinos ordenados!',
    description: `Terminamos con ${mergeCount} mezclas: ${comparisons} comparaciones y ${moves} escrituras, en total ${comparisons + moves} pasos.`
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
  },
  shell: {
    id: 'shell',
    name: 'Shell Sort',
    movesLabel: 'Desplazamientos',
    movesSingular: 'desplazamiento',
    passLabel: 'Pasada',
    totalPasses: (n) => shellGaps(n).length,
    generate: shellSteps,
    pseudocode: (direction) => [
      'gap ← ⌊n / 2⌋',
      'mientras gap > 0',
      '  para i ← gap hasta n − 1',
      '    llave ← A[i];  j ← i',
      `    mientras j ≥ gap y A[j − gap] ${direction === 'asc' ? '>' : '<'} llave`,
      '      A[j] ← A[j − gap];  j ← j − gap   (desplazar)',
      '    A[j] ← llave',
      '  gap ← ⌊gap / 2⌋'
    ],
    tags: () => [
      { mark: 'key', label: 'llave', cls: 'tag-key' },
      { mark: 'j', label: 'j − gap', cls: 'tag-j' }
    ],
    legend: () => [
      { cls: 'dot-group', label: 'Subgrupo del gap' },
      { cls: 'dot-key', label: 'Llave (pino levantado)' },
      { cls: 'dot-j', label: 'Comparando (j − gap)' },
      { cls: 'dot-swap', label: 'Desplazamiento' },
      { cls: 'dot-sorted', label: 'Ordenado' }
    ],
    note: () =>
      'Shell Sort es un Insertion Sort "con saltos": primero ordena pinos separados por una distancia grande (gap) y la va reduciendo a la mitad hasta llegar a 1. Así los valores lejanos llegan rápido cerca de su lugar.',
    theory: (n, values, direction) => {
      const gaps = shellGaps(n)
      const best = gaps.reduce((sum, gap) => sum + (n - gap), 0)
      return {
        text: `Con n = ${n} se usan los gaps ${gaps.join(', ') || '—'} (${gaps.length} pasadas). Si el arreglo ya está ordenado solo hace ${best} comparaciones. Su complejidad depende de la secuencia de gaps: con la secuencia de Shell (n/2, n/4, …, 1) el peor caso es O(n²), pero en la práctica suele ser mucho más rápido que Insertion Sort.`,
        rows: [
          ['Mejor (ya ordenado)', best, 'O(n log n)'],
          ['Promedio', 'depende de los gaps', '≈ O(n^1.5)'],
          ['Peor', 'depende de los datos', 'O(n²)']
        ],
        movesNote: `gaps: ${gaps.join(' → ') || '—'}`
      }
    },
    summary: (n, last) =>
      `Con n = ${n} se hicieron ${last.comparisons} comparaciones y ${last.moves} desplazamientos usando los gaps ${shellGaps(n).join(', ')}. Shell Sort mejora a Insertion Sort porque mueve los pinos lejanos de varios saltos a la vez; con esta secuencia de gaps su peor caso sigue siendo O(n²), pero el caso típico es mucho menor.`
  },

  merge: {
    id: 'merge',
    name: 'Merge Sort',
    movesLabel: 'Escrituras',
    movesSingular: 'escritura',
    passLabel: 'Mezcla',
    totalPasses: (n) => mergeMerges(n),
    generate: mergeSteps,
    pseudocode: () => [
      'mergeSort(A, izq, der)',
      '  si izq < der',
      '    mid ← ⌊(izq + der) / 2⌋',
      '    mergeSort(A, izq, mid);  mergeSort(A, mid + 1, der)',
      '    mezclar(A, izq, mid, der)',
      'mezclar: mientras queden pinos en las dos mitades',
      '  comparar el primero de cada mitad',
      '  colocar el elegido en la siguiente posición',
      'copiar los que sobren'
    ],
    tags: () => [
      { mark: 'j', label: 'izq', cls: 'tag-j' },
      { mark: 'min', label: 'der', cls: 'tag-min' }
    ],
    legend: () => [
      { cls: 'dot-group', label: 'Parte que se está trabajando' },
      { cls: 'dot-j', label: 'Primero de la izquierda' },
      { cls: 'dot-min', label: 'Primero de la derecha' },
      { cls: 'dot-swap', label: 'Pino colocado' },
      { cls: 'dot-sorted', label: 'Ordenado' }
    ],
    note: () =>
      'Merge Sort usa "divide y vencerás": parte el arreglo por la mitad una y otra vez hasta quedar con pinos sueltos, y luego los mezcla de dos en dos ya ordenados.',
    theory: (n) => {
      const L = log2ceil(n)
      const worst = n <= 1 ? 0 : n * L - 2 ** L + 1
      return {
        text: `Con n = ${n} el arreglo se divide en ${L} niveles (⌈log₂ ${n}⌉ = ${L}) y se hacen ${mergeMerges(n)} mezclas. En cada nivel se recorren los n pinos, por eso su complejidad es O(n log n) en todos los casos. Siempre escribe ${mergeWrites(n)} veces, y compara como máximo ${worst} veces.`,
        rows: [
          ['Mejor', `≈ ${Math.floor((n * L) / 2)}`, 'O(n log n)'],
          ['Promedio', `≈ ${worst}`, 'O(n log n)'],
          ['Peor', worst, 'O(n log n)']
        ],
        movesNote: `escrituras siempre = ${mergeWrites(n)} · niveles = ${L}`
      }
    },
    summary: (n, last) =>
      `Con n = ${n} se hicieron ${last.comparisons} comparaciones y ${last.moves} escrituras en ${mergeMerges(n)} mezclas. Merge Sort es O(n log n) en el mejor, promedio y peor caso, porque siempre divide en ${log2ceil(n)} niveles; a cambio necesita memoria extra para mezclar las mitades.`
  }
}

/* =============================================================
   TIEMPO DE EJECUCIÓN
   Versiones "puras" de cada algoritmo (sin guardar pasos ni fotos)
   para medir cuánto tarda realmente en ordenar el arreglo.
   ============================================================= */
const before = (direction) => (direction === 'asc' ? (a, b) => a < b : (a, b) => a > b)

const PURE_SORTS = {
  seleccion(a, direction) {
    const lt = before(direction)
    for (let i = 0; i < a.length - 1; i++) {
      let m = i
      for (let j = i + 1; j < a.length; j++) if (lt(a[j], a[m])) m = j
      if (m !== i) { const t = a[i]; a[i] = a[m]; a[m] = t }
    }
    return a
  },
  insercion(a, direction) {
    const lt = before(direction)
    for (let i = 1; i < a.length; i++) {
      const key = a[i]
      let j = i - 1
      while (j >= 0 && lt(key, a[j])) { a[j + 1] = a[j]; j-- }
      a[j + 1] = key
    }
    return a
  },
  shell(a, direction) {
    const lt = before(direction)
    for (let gap = Math.floor(a.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < a.length; i++) {
        const key = a[i]
        let j = i
        while (j >= gap && lt(key, a[j - gap])) { a[j] = a[j - gap]; j -= gap }
        a[j] = key
      }
    }
    return a
  },
  merge(a, direction) {
    const lt = before(direction)
    const tmp = new Array(a.length)
    const sort = (lo, hi) => {
      if (lo >= hi) return
      const mid = (lo + hi) >> 1
      sort(lo, mid)
      sort(mid + 1, hi)
      let i = lo, j = mid + 1, k = lo
      while (i <= mid && j <= hi) tmp[k++] = lt(a[j], a[i]) ? a[j++] : a[i++]
      while (i <= mid) tmp[k++] = a[i++]
      while (j <= hi) tmp[k++] = a[j++]
      for (k = lo; k <= hi; k++) a[k] = tmp[k]
    }
    sort(0, a.length - 1)
    return a
  }
}

// Devuelve el tiempo promedio en milisegundos. Con pocos datos un solo
// ordenamiento dura microsegundos, así que se repite varias veces y se promedia.
export function measureExecutionTime(algorithmId, values, direction, budgetMs = 15) {
  const run = PURE_SORTS[algorithmId]
  if (!run || !values.length) return 0
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  run(values.slice(), direction) // calentamiento
  let reps = 0
  const start = now()
  let elapsed = 0
  do {
    run(values.slice(), direction)
    reps++
    elapsed = now() - start
  } while (elapsed < budgetMs && reps < 100000)
  return elapsed / reps
}

export function formatExecutionTime(ms) {
  // Siempre en milisegundos; con pocos datos el valor es una fracción de ms
  if (!ms) return '0 ms'
  return `${ms >= 1 ? ms.toFixed(3) : Number(ms.toPrecision(3))} ms`
}

/* =============================================================
   CONTEO RÁPIDO DE OPERACIONES
   Cuenta comparaciones y movimientos igual que la pizarra, pero sin
   guardar los pasos de la animación. Se usa para comparar los 4
   algoritmos con los mismos datos (tabla de Resultados).
   ============================================================= */
export function countOperations(algorithmId, values, direction) {
  const a = values.slice()
  const n = a.length
  const lt = before(direction)
  let comparisons = 0
  let moves = 0

  if (algorithmId === 'seleccion') {
    for (let i = 0; i < n - 1; i++) {
      let m = i
      for (let j = i + 1; j < n; j++) {
        comparisons++
        if (lt(a[j], a[m])) m = j
      }
      if (m !== i) { const t = a[i]; a[i] = a[m]; a[m] = t; moves++ }
    }
  } else if (algorithmId === 'insercion' || algorithmId === 'shell') {
    const gaps = algorithmId === 'shell' ? shellGaps(n) : [1]
    for (const gap of gaps) {
      for (let i = gap; i < n; i++) {
        const key = a[i]
        let j = i
        while (j >= gap) {
          comparisons++
          if (lt(key, a[j - gap])) { a[j] = a[j - gap]; j -= gap; moves++ } else break
        }
        a[j] = key
      }
    }
  } else if (algorithmId === 'merge') {
    const sort = (lo, hi) => {
      if (lo >= hi) return
      const mid = Math.floor((lo + hi) / 2)
      sort(lo, mid)
      sort(mid + 1, hi)
      const left = a.slice(lo, mid + 1)
      const right = a.slice(mid + 1, hi + 1)
      let i = 0, j = 0, k = lo
      while (i < left.length && j < right.length) {
        comparisons++
        // Igual que la pizarra: en empate se toma el de la izquierda (estable)
        a[k++] = lt(right[j], left[i]) ? right[j++] : left[i++]
        moves++
      }
      while (i < left.length) { a[k++] = left[i++]; moves++ }
      while (j < right.length) { a[k++] = right[j++]; moves++ }
    }
    sort(0, n - 1)
  }

  return { comparisons, moves, steps: comparisons + moves }
}
