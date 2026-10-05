<template>
  <div class="canvas-workspace ss-workspace">
    <StarryBackground />

    <!-- Forma del pino compartida por todos los pinos -->
    <svg width="0" height="0" class="svg-defs" aria-hidden="true">
      <defs>
        <clipPath id="ss-pin-clip" clipPathUnits="userSpaceOnUse">
          <path :d="PIN_PATH" />
        </clipPath>
        <linearGradient id="ss-pin-shade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity="0.22" />
          <stop offset="0.32" stop-color="#fff" stop-opacity="0.55" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
          <stop offset="1" stop-color="#000" stop-opacity="0.28" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Barra superior (misma estructura que Northwest) -->
    <div class="canvas-header">
      <div class="header-left">
        <button @click="$emit('back')" class="btn-icon-only" title="Volver a la página anterior">
          <ArrowLeft class="icon" />
        </button>
        <div class="header-info">
          <h2 class="header-title">
            Pizarra de Ordenamiento
            <span class="status-indicator"></span>
          </h2>
          <p class="header-subtitle">{{ meta.name }} · {{ modeDescription }}</p>
        </div>
      </div>

      <div class="stats-container">
        <div class="stat-badge">
          n: <strong class="stat-number">{{ cells.length }}</strong>
        </div>
        <div class="stat-badge stat-badge-optimal">
          Pasos: <strong class="stat-number">{{ current.comparisons + current.moves }}</strong>
        </div>
        <div class="stat-badge">
          Comparaciones: <strong class="stat-number">{{ current.comparisons }}</strong>
        </div>
        <div class="stat-badge">
          {{ meta.movesLabel }}: <strong class="stat-number">{{ current.moves }}</strong>
        </div>
      </div>

      <div class="header-actions">
        <button @click="saveBoard" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="openSolver" class="btn-text btn-resolver">
          <Sparkles class="btn-icon" />
          <span>Resolver</span>
        </button>
        <button @click="showClearModal = true" class="btn-text btn-danger">
          <Trash2 class="btn-icon" />
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="board-container">
      <!-- ===== Datos de entrada ===== -->
      <section class="board-card">
        <div class="data-row">
          <label class="field field-n">
            <span>Cantidad de números (n)</span>
            <div class="n-control">
              <input
                type="range"
                :min="N_MIN"
                :max="N_MAX"
                :value="cells.length"
                @input="setN($event.target.value)"
                aria-label="Cantidad de números"
              />
              <input
                type="number"
                :min="N_MIN"
                :max="N_MAX"
                :value="cells.length"
                @change="setN($event.target.value)"
                aria-label="Cantidad de números"
              />
            </div>
          </label>

          <label class="field">
            <span>Orden</span>
            <select v-model="order">
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </label>

          <button class="btn-text btn-random" @click="randomize">
            <Shuffle class="btn-icon" />
            <span>Random</span>
          </button>
        </div>

        <div class="values-label">
          <span>Escribe tus números ({{ V_MIN }} a {{ V_MAX }}) o usa Random</span>
          <span>La altura de cada pino depende de su valor</span>
        </div>
        <div class="values-grid">
          <label v-for="(cell, index) in cells" :key="cell.id" class="value-cell">
            <input
              v-model="cell.raw"
              type="number"
              inputmode="numeric"
              :min="V_MIN"
              :max="V_MAX"
              :class="{ invalid: parseCell(cell.raw) === null }"
              :aria-label="`Número en la posición ${index}`"
            />
            <span>[{{ index }}]</span>
          </label>
        </div>

        <div v-if="invalidCount > 0" class="connection-tip balance-tip data-tip">
          <span class="pulse-dot"></span>
          <span v-if="invalidCount === cells.length">Escribe tus números o presiona Random para empezar.</span>
          <span v-else>
            Hay {{ invalidCount }} casilla{{ invalidCount > 1 ? 's' : '' }} vacía{{ invalidCount > 1 ? 's' : '' }}
            o con un valor fuera de rango. Usa números enteros del {{ V_MIN }} al {{ V_MAX }}.
          </span>
        </div>
      </section>

      <!-- ===== Controles del algoritmo ===== -->
      <section class="controls">
        <div class="controls-actions">
          <button class="btn-text" @click="undoStep" :disabled="stepIndex < 0">
            <Undo2 class="btn-icon" />
            <span>Atrás</span>
          </button>
          <button class="btn-text btn-step" @click="manualNext" :disabled="finished || !canSort">
            <StepForward class="btn-icon" />
            <span>{{ finished ? 'Completado' : nextStepLabel }}</span>
          </button>
          <button class="btn-text" @click="togglePlay" :disabled="finished || !canSort">
            <component :is="playing ? Pause : Play" class="btn-icon" />
            <span>{{ playing ? 'Pausar' : 'Reproducir' }}</span>
          </button>
          <button class="btn-text" @click="runAll" :disabled="finished || !canSort">
            <FastForward class="btn-icon" />
            <span>Ejecutar todo</span>
          </button>
          <button class="btn-text" @click="resetSteps">
            <RotateCcw class="btn-icon" />
            <span>Reiniciar</span>
          </button>
          <label class="field field-inline">
            <span>Velocidad</span>
            <select v-model.number="speed" @change="restartTimer">
              <option :value="1100">Lenta</option>
              <option :value="600">Normal</option>
              <option :value="250">Rápida</option>
            </select>
          </label>
        </div>
      </section>

      <!-- ===== Pista de boliche ===== -->
      <section class="board-card lane-card">
        <div class="lane">
          <TransitionGroup ref="pinsRef" name="pin" tag="div" class="pins">
            <div
              v-for="(item, index) in current.array"
              :key="item.id"
              class="pin-slot"
              :class="pinClass(index)"
              :style="{ visibility: item.value === null ? 'hidden' : 'visible' }"
            >
              <span class="pin-value">{{ item.value }}</span>
              <svg
                class="pin-svg"
                viewBox="0 0 40 100"
                preserveAspectRatio="none"
                :style="pinSize(item.value)"
                aria-hidden="true"
              >
                <g clip-path="url(#ss-pin-clip)">
                  <rect class="pin-body" x="0" y="0" width="40" height="100" />
                  <rect class="pin-stripe" x="0" y="23" width="40" height="3.2" />
                  <rect class="pin-stripe" x="0" y="28.5" width="40" height="3.2" />
                  <rect x="0" y="0" width="40" height="100" fill="url(#ss-pin-shade)" />
                </g>
                <path class="pin-outline" :d="PIN_PATH" />
              </svg>
              <span class="pin-spot"></span>
            </div>
          </TransitionGroup>
        </div>

        <div class="pin-labels" aria-hidden="true">
          <div v-for="(item, index) in current.array" :key="'l' + index" class="pin-label">
            <span>{{ index }}</span>
            <span class="tags">
              <template v-for="tag in tags" :key="tag.mark">
                <em v-if="!finished && current.marks[tag.mark] === index" class="tag" :class="tag.cls">{{ tag.label }}</em>
              </template>
            </span>
          </div>
        </div>

        <div class="legend">
          <span v-for="item in legend" :key="item.cls"><i class="dot" :class="item.cls"></i>{{ item.label }}</span>
        </div>
      </section>

      <!-- ===== Contador de pasos / Big O ===== -->
      <section class="board-card">
        <h3 class="step-main-title">Contador de pasos y complejidad</h3>
        <div class="bigo-grid">
          <div>
            <div class="counter-main">
              <span class="counter-number">{{ current.comparisons + current.moves }}</span>
              <span class="counter-caption">pasos realizados<br />(comparaciones + {{ meta.movesLabel.toLowerCase() }})</span>
            </div>
            <div class="counter-split">
              <div><span>Comparaciones</span><strong>{{ current.comparisons }}</strong></div>
              <div><span>{{ meta.movesLabel }}</span><strong>{{ current.moves }}</strong></div>
              <div><span>Pasada</span><strong>{{ current.pass }} de {{ Math.max(cells.length - 1, 0) }}</strong></div>
            </div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Comparaciones realizadas"
              aria-valuemin="0"
              :aria-valuemax="maxComparisons"
              :aria-valuenow="current.comparisons"
            >
              <div :style="{ width: progressPct + '%' }"></div>
            </div>
            <p class="progress-caption">
              {{ current.comparisons }} comparaciones · {{ theory.movesNote }}
            </p>
          </div>

          <div class="theory">
            <p>{{ theory.text }}</p>
            <table class="complexity-table">
              <thead>
                <tr><th>Caso</th><th>Comparaciones</th><th>Big O</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in theory.rows" :key="row[0]">
                  <td>{{ row[0] }}</td><td>{{ row[1] }}</td><td>{{ row[2] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ===== Explicación + pseudocódigo ===== -->
      <div class="explain-grid">
        <section class="step-card-main">
          <h3 class="step-main-title">{{ current.title }}</h3>
          <p class="step-main-desc">{{ current.description }}</p>
          <p class="step-main-note">{{ meta.note(order) }}</p>
        </section>

        <section class="step-card-main">
          <h3 class="step-main-title">Pseudocódigo</h3>
          <pre class="pseudocode"><code><span
            v-for="(line, index) in pseudocode"
            :key="index"
            class="code-line"
            :class="{ 'code-line-active': current.line === index }"
          >{{ line }}</span></code></pre>
        </section>
      </div>
    </div>

    <!-- Modal Resolución Paso a Paso -->
    <div v-if="showStepsModal" class="modal-overlay" @click.self="showStepsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title-group">
            <h3 class="modal-title">Resolución Paso a Paso</h3>
            <span class="algorithm-badge">{{ meta.name }}</span>
          </div>
          <button @click="showStepsModal = false" class="btn-close-icon">&times;</button>
        </div>

        <div class="modal-body">
          <div class="metrics-grid metrics-3">
            <div class="metric-card highlight">
              <span class="metric-label">Pasos totales</span>
              <span class="metric-value">{{ lastStep.comparisons + lastStep.moves }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Comparaciones</span>
              <span class="metric-value">{{ lastStep.comparisons }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">{{ meta.movesLabel }}</span>
              <span class="metric-value">{{ lastStep.moves }}</span>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-heading">Arreglo original</h4>
            <div class="mini-array">
              <span v-for="item in validItems" :key="'o' + item.id" class="mini-cell">{{ item.value }}</span>
            </div>
            <h4 class="section-heading">Arreglo ordenado ({{ order === 'asc' ? 'ascendente' : 'descendente' }})</h4>
            <div class="mini-array">
              <span v-for="item in lastStep.array" :key="'f' + item.id" class="mini-cell mini-cell-sorted">{{ item.value }}</span>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-heading">Evolución por pasada</h4>
            <div class="steps-accordion">
              <div v-for="pass in passSummary" :key="pass.number" class="step-card">
                <span class="step-title">Pasada {{ pass.number }}</span>
                <p class="step-desc">{{ pass.description }}</p>
                <div class="mini-array">
                  <span
                    v-for="(item, index) in pass.array"
                    :key="'p' + pass.number + '-' + item.id"
                    class="mini-cell"
                    :class="{
                      'mini-cell-swap': pass.highlight.includes(index),
                      'mini-cell-sorted': !pass.highlight.includes(index) && index < pass.sortedCount
                    }"
                  >{{ item.value }}</span>
                </div>
                <p class="pass-count">
                  {{ pass.comparisons }} comparaci{{ pass.comparisons === 1 ? 'ón' : 'ones' }} y
                  {{ pass.moves }} {{ meta.movesSingular }}{{ pass.moves === 1 ? '' : (meta.movesSingular.endsWith('n') ? 'es' : 's') }}
                </p>
              </div>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-heading">Complejidad</h4>
            <p class="step-desc">{{ meta.summary(cells.length, lastStep) }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showStepsModal = false" class="btn-primary">Aceptar</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar limpieza -->
    <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal = false">
      <div class="modal-card modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">Limpiar pizarra</h3>
          <button @click="showClearModal = false" class="btn-close-icon">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Se borrarán todos los números y el progreso del ordenamiento. ¿Quieres continuar?
          </p>
        </div>
        <div class="modal-footer footer-split">
          <button @click="showClearModal = false" class="btn-secondary">Cancelar</button>
          <button @click="confirmClear" class="btn-danger-solid">Limpiar</button>
        </div>
      </div>
    </div>

    <!-- Modal de advertencia -->
    <AssignmentWarning
      :show="showWarningModal"
      :title="warningTitle"
      :message="warningMessage"
      :sub-message="warningSubMessage"
      @close="showWarningModal = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  ArrowLeft,
  Trash2,
  Save,
  Sparkles,
  Undo2,
  StepForward,
  FastForward,
  RotateCcw,
  Shuffle,
  Play,
  Pause
} from '@lucide/vue'
import StarryBackground from './StarryBackground.vue'
import AssignmentWarning from './AssignmentWarning.vue'
import { SORT_ALGORITHMS } from '../utils/sorting'

const emit = defineEmits(['back', 'save', 'clear'])

const props = defineProps({
  // Id del algoritmo en src/utils/sorting.js: 'seleccion' | 'insercion'
  algorithm: { type: String, default: 'seleccion' },
  initialData: { type: Object, default: null }
})

const meta = computed(() => SORT_ALGORITHMS[props.algorithm] || SORT_ALGORITHMS.seleccion)

/* ---------- Configuración ---------- */
const N_DEFAULT = 10
const N_MIN = 2
const N_MAX = 20
const V_MIN = 1
const V_MAX = 99

// Silueta del pino de boliche (viewBox 0 0 40 100)
const PIN_PATH =
  'M20 0 C27 0 29.5 6 29.5 12 C29.5 18.5 25.5 22 24.5 28 C23.5 34 33.5 45 35.5 58 ' +
  'C37.5 72 33.5 88 30.5 100 L9.5 100 C6.5 88 2.5 72 4.5 58 C6.5 45 16.5 34 15.5 28 ' +
  'C14.5 22 10.5 18.5 10.5 12 C10.5 6 13 0 20 0 Z'

/* ---------- Datos ---------- */
let nextId = 0
const randomValue = () => Math.floor(Math.random() * (V_MAX - V_MIN + 1)) + V_MIN

// Cada casilla es un pino: { id, raw } (raw = lo que escribe el usuario)
const cells = ref([])
const order = ref('asc')

const parseCell = (raw) => {
  const text = String(raw ?? '').trim()
  if (!/^\d+$/.test(text)) return null
  const value = Number(text)
  return value >= V_MIN && value <= V_MAX ? value : null
}

const parsedItems = computed(() => cells.value.map((cell) => ({ id: cell.id, value: parseCell(cell.raw) })))
const invalidCount = computed(() => parsedItems.value.filter((item) => item.value === null).length)
const canSort = computed(() => cells.value.length >= N_MIN && invalidCount.value === 0)
const validItems = computed(() => (canSort.value ? parsedItems.value : []))

function setN(value) {
  const n = Math.min(N_MAX, Math.max(N_MIN, Math.floor(Number(value)) || N_DEFAULT))
  const list = cells.value.slice(0, n)
  while (list.length < n) list.push({ id: nextId++, raw: String(randomValue()) })
  cells.value = list
}

function randomize() {
  cells.value = cells.value.map(() => ({ id: nextId++, raw: String(randomValue()) }))
}

/* ---------- Estado del algoritmo ---------- */
const stepIndex = ref(-1)
const playing = ref(false)
const speed = ref(600)
let timer = null

/* ---------- Modales ---------- */
const showStepsModal = ref(false)
const showClearModal = ref(false)
const showWarningModal = ref(false)
const warningTitle = ref('')
const warningMessage = ref('')
const warningSubMessage = ref('')

const openWarning = (title, message, subMessage = '') => {
  warningTitle.value = title
  warningMessage.value = message
  warningSubMessage.value = subMessage
  showWarningModal.value = true
}

/* ---------- Pasos del algoritmo (ver src/utils/sorting.js) ---------- */
const pseudocode = computed(() => meta.value.pseudocode(order.value))
const tags = computed(() => meta.value.tags(order.value))
const legend = computed(() => meta.value.legend(order.value))

const steps = computed(() => (canSort.value ? meta.value.generate(validItems.value, order.value) : []))

const initialState = computed(() => ({
  array: parsedItems.value,
  marks: {},
  sortedCount: 0,
  comparisons: 0,
  moves: 0,
  line: null,
  pass: 0,
  swapped: null,
  title: canSort.value ? 'Listo para ordenar' : 'Faltan datos',
  description: canSort.value
    ? 'Presiona “Iniciar” para avanzar paso a paso, o “Reproducir” para verlo de forma automática.'
    : `Completa todas las casillas con números del ${V_MIN} al ${V_MAX}, o presiona Random.`
}))

const current = computed(() => (stepIndex.value >= 0 ? steps.value[stepIndex.value] : initialState.value))
const lastStep = computed(() => steps.value[steps.value.length - 1] || initialState.value)
const finished = computed(() => canSort.value && stepIndex.value === steps.value.length - 1)

const nextStepLabel = computed(() => (stepIndex.value < 0 ? 'Iniciar' : 'Siguiente paso'))
const maxComparisons = computed(() => meta.value.maxComparisons(cells.value.length))
const progressPct = computed(() =>
  maxComparisons.value ? (current.value.comparisons / maxComparisons.value) * 100 : 0
)
const theory = computed(() =>
  meta.value.theory(
    cells.value.length,
    canSort.value ? validItems.value.map((item) => item.value) : null,
    order.value
  )
)

const modeDescription = computed(() => {
  if (!canSort.value) return 'Completa los números para ordenarlos'
  if (finished.value) return 'Arreglo ordenado. Mira el resumen con “Resolver”.'
  if (stepIndex.value < 0) return `Ordena ${order.value === 'asc' ? 'de menor a mayor' : 'de mayor a menor'}`
  return `Pasada ${current.value.pass} de ${cells.value.length - 1}`
})

const passSummary = computed(() =>
  steps.value
    .filter((step) => step.endOfPass)
    .map((step) => ({
      number: step.pass,
      array: step.array,
      sortedCount: step.sortedCount,
      highlight: step.highlight || [],
      description: step.description,
      comparisons: step.passComparisons,
      moves: step.passMoves
    }))
)

// Cualquier cambio en los números o en el orden reinicia el recorrido
watch([cells, order], () => resetSteps(), { deep: true })

/* ---------- Pinos: tamaño según el valor ---------- */
const pinsRef = ref(null)
const laneHeight = ref(330)
let resizeObserver = null

const maxValue = computed(() => {
  const values = parsedItems.value.map((item) => item.value).filter((value) => value !== null)
  return Math.max(V_MAX * 0.25, ...values)
})

const pinSize = (value) => {
  if (value === null) return { height: '0px', width: '0px' }
  const maxPinHeight = Math.max(laneHeight.value - 40, 120)
  const height = Math.max(22, (value / maxValue.value) * maxPinHeight)
  return { height: `${height}px`, width: `min(86%, ${height * 0.4}px)` }
}

const pinClass = (index) => {
  const step = current.value
  const marks = finished.value ? {} : step.marks
  const isSwap = !finished.value && step.swapped?.includes(index)
  const isKey = marks.key === index
  return {
    'st-sorted': index < step.sortedCount && !isSwap && !isKey,
    'st-min': marks.min === index && !isSwap,
    'st-j': marks.j === index,
    'st-swap': isSwap && !isKey,
    'st-key': isKey,
    'st-i': marks.i === index
  }
}

onMounted(() => {
  const el = pinsRef.value?.$el
  if (!el || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => { laneHeight.value = el.clientHeight || 330 })
  resizeObserver.observe(el)
})

/* ---------- Navegación entre pasos ---------- */
function nextStep() {
  if (!canSort.value || finished.value) {
    stopPlay()
    return
  }
  stepIndex.value++
  if (finished.value) stopPlay()
}

function manualNext() {
  stopPlay()
  nextStep()
}

function undoStep() {
  stopPlay()
  if (stepIndex.value >= 0) stepIndex.value--
}

function runAll() {
  stopPlay()
  if (canSort.value) stepIndex.value = steps.value.length - 1
}

function resetSteps() {
  stopPlay()
  stepIndex.value = -1
}

/* ---------- Reproducción automática ---------- */
function stopPlay() {
  playing.value = false
  if (timer) clearInterval(timer)
  timer = null
}

function togglePlay() {
  if (playing.value) {
    stopPlay()
    return
  }
  if (!canSort.value || finished.value) return
  playing.value = true
  nextStep()
  if (playing.value) timer = setInterval(nextStep, speed.value)
}

function restartTimer() {
  if (!playing.value) return
  clearInterval(timer)
  timer = setInterval(nextStep, speed.value)
}

onBeforeUnmount(() => {
  stopPlay()
  resizeObserver?.disconnect()
})

/* ---------- Acciones de la barra superior ---------- */
function openSolver() {
  if (!canSort.value) {
    openWarning('Faltan datos', 'No hay números válidos para ordenar.', `Completa las casillas con números del ${V_MIN} al ${V_MAX}, o usa Random.`)
    return
  }
  runAll()
  showStepsModal.value = true
}

function saveBoard() {
  if (!canSort.value) {
    openWarning('Faltan datos', 'No hay números válidos para guardar.', `Completa las casillas con números del ${V_MIN} al ${V_MAX}, o usa Random.`)
    return
  }
  emit('save', {
    algorithm: props.algorithm,
    values: validItems.value.map((item) => item.value),
    order: order.value
  })
}

function confirmClear() {
  cells.value = cells.value.map(() => ({ id: nextId++, raw: '' }))
  showClearModal.value = false
  emit('clear')
}

/* ---------- Carga inicial (arreglo guardado o 10 aleatorios) ---------- */
const saved = props.initialData
if (saved && Array.isArray(saved.values) && saved.values.length >= N_MIN) {
  cells.value = saved.values.slice(0, N_MAX).map((value) => ({ id: nextId++, raw: String(value) }))
  order.value = saved.order === 'desc' ? 'desc' : 'asc'
} else {
  setN(N_DEFAULT)
}
</script>

<style scoped>
/* ===== CONTENEDOR ===== */
.canvas-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-body);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
}

.canvas-workspace > :deep(.starry-background) {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* ===== HEADER ===== */
.canvas-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  position: relative;
  z-index: 20;
}

@media (min-width: 640px) {
  .canvas-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
  }
}

.header-left { display: flex; align-items: center; gap: 0.5rem; }

@media (min-width: 640px) { .header-left { flex: 1; } }

.btn-icon-only {
  padding: 0.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.btn-icon-only:active { transform: scale(0.95); }

.icon { width: 1.25rem; height: 1.25rem; }

.header-info { display: flex; flex-direction: column; flex: 1; }

.header-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

@media (min-width: 640px) { .header-title { font-size: 1rem; } }

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #10b981;
}

.header-subtitle { font-size: 0.6rem; color: var(--text-secondary); margin: 0; }

@media (min-width: 640px) { .header-subtitle { font-size: 0.7rem; } }

.stats-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  width: 100%;
}

@media (min-width: 640px) {
  .stats-container { width: auto; gap: 1rem; font-size: 0.8rem; justify-content: flex-start; }
}

.stat-badge {
  padding: 0.25rem 0.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

@media (min-width: 640px) {
  .stat-badge { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
}

.stat-number { color: var(--text-primary); font-weight: 600; }

.stat-badge-optimal {
  background-color: rgba(0, 242, 255, 0.15);
  border-color: rgba(0, 242, 255, 0.4);
  color: #00f2ff;
}

.btn-clear-opt {
  background: transparent;
  border: none;
  color: #00f2ff;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 0.2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
}

@media (min-width: 640px) {
  .header-actions { width: auto; justify-content: flex-end; flex-wrap: nowrap; }
}

/* ===== BOTONES ===== */
.btn-text {
  padding: 0.4rem 0.6rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  min-height: 2.5rem;
}

@media (min-width: 640px) {
  .btn-text { padding: 0.4rem 0.8rem; font-size: 0.8rem; gap: 0.375rem; min-height: auto; }
}

.btn-text:active:not(:disabled) { transform: scale(0.95); }
.btn-text:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-icon { width: 0.9rem; height: 0.9rem; }

@media (min-width: 640px) { .btn-icon { width: 1rem; height: 1rem; } }

.btn-matrix {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  color: var(--accent-solid);
}

.btn-resolver {
  background: linear-gradient(135deg, var(--accent-start, #a855f7) 0%, var(--accent-end, #d946ef) 100%);
  color: #ffffff !important;
  border: none !important;
  font-weight: 600;
}

.btn-resolver:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 10px var(--accent-soft-bg);
}

.btn-save-graph {
  background-color: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

[data-theme='dark'] .btn-save-graph {
  background-color: rgba(22, 163, 74, 0.15);
  border-color: rgba(74, 222, 128, 0.35);
  color: #4ade80;
}

.btn-danger {
  background-color: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

[data-theme='dark'] .btn-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(248, 113, 113, 0.35);
  color: #f87171;
}

.btn-step {
  background-color: var(--accent-solid);
  border-color: var(--accent-solid);
  color: #ffffff;
  font-weight: 600;
}

.btn-step:hover:not(:disabled) { filter: brightness(1.1); }

/* ===== ÁREA PRINCIPAL ===== */
.board-container {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem 0.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

@media (min-width: 640px) {
  .board-container { padding: 1.5rem 1.5rem 3rem; }
}

.controls,
.board-card,
.step-card-main {
  width: 100%;
  max-width: 1100px;
  box-sizing: border-box;
}

/* ===== CONTROLES ===== */
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.field input {
  width: 4.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-body);
  color: var(--text-primary);
}

.controls-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
}

@media (max-width: 640px) {
  .controls-actions { margin-left: 0; width: 100%; }
  .controls-actions .btn-text { flex: 1; justify-content: center; }
}

/* ===== AVISO ===== */
.connection-tip {
  padding: 0.6rem 1rem;
  background-color: var(--accent-soft-bg);
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--accent-solid);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 1100px;
  width: 100%;
  box-sizing: border-box;
}

.balance-tip {
  background-color: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.5);
  color: #d97706;
}

.pulse-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* ===== TARJETAS ===== */
.board-card,
.step-card-main {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: var(--bg-surface);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
}

/* ===== TABLA ===== */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.transport-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

.transport-table th,
.transport-table td {
  padding: 0.7rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.transport-table th { color: var(--text-secondary); font-size: 0.8rem; }

.transport-table input {
  width: 4.5rem;
  padding: 0.45rem;
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  background: var(--bg-body);
  color: var(--text-primary);
  text-align: center;
}

.transport-table td.active {
  background: var(--accent-soft-bg);
  outline: 2px solid var(--accent-solid);
  outline-offset: -2px;
}

.transport-table td.assigned {
  background: color-mix(in srgb, var(--accent-soft-bg) 60%, transparent);
}

.allocation {
  display: block;
  margin-top: 0.35rem;
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 700;
}

.remaining {
  display: block;
  margin-top: 0.3rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
}

.supply-cell,
.demand-row td,
.total-cell {
  background: var(--bg-body);
  font-weight: 700;
}

/* ===== RESUMEN ===== */
.summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }

.summary div {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem;
  border-radius: 0.6rem;
  background: var(--bg-body);
}

.summary span,
.summary strong { display: block; }

.summary span { color: var(--text-secondary); font-size: 0.75rem; }
.summary strong { margin-top: 0.3rem; }

@media (max-width: 650px) {
  .summary div { min-width: 100%; }
}

/* ===== EXPLICACIÓN ===== */
.step-main-title {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.step-main-desc {
  margin: 0.35rem 0;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.step-main-note {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* ===== MODALES ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  overflow: hidden;
}

.modal-card.modal-sm { max-width: 420px; }

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group { display: flex; align-items: center; gap: 0.75rem; }

.modal-title { font-size: 1.25rem; font-weight: 600; color: #f8fafc; margin: 0; }

.algorithm-badge {
  background: #312e81;
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #4338ca;
}

.btn-close-icon {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close-icon:hover { color: #f8fafc; }

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.confirm-text { margin: 0; font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; }

.metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

.metric-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-card.highlight { border-color: #6366f1; background: rgba(99, 102, 241, 0.1); }

.metric-label { font-size: 0.85rem; color: #94a3b8; }
.metric-value { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }

.section-container { display: flex; flex-direction: column; gap: 0.75rem; }
.section-heading { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin: 0; }

.table-wrapper { border: 1px solid #334155; border-radius: 8px; overflow: hidden; }

.result-table,
.step-matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
}

.result-table th,
.step-matrix-table th {
  background: #0f172a;
  color: #94a3b8;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid #334155;
}

.result-table td,
.step-matrix-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #1e293b;
  color: #e2e8f0;
}

.font-medium { font-weight: 500; }
.arrow-cell { color: #6366f1; }
.cost-badge { color: #38bdf8; font-weight: 600; }

.steps-accordion { display: flex; flex-direction: column; gap: 1rem; }

.step-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}

.step-title { font-weight: 600; color: #818cf8; display: block; margin-bottom: 0.25rem; }
.step-desc { font-size: 0.85rem; color: #94a3b8; margin: 0 0 0.75rem 0; line-height: 1.5; }

.matrix-preview-wrapper { overflow-x: auto; }

.step-matrix-table { border: 1px solid #334155; }

.step-matrix-table td,
.step-matrix-table th { border: 1px solid #334155; }

.corner-cell,
.row-label-cell {
  background: #1e293b !important;
  color: #94a3b8;
  font-weight: 600;
}

.cell-cost {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.65rem;
  font-weight: 500;
  color: #64748b;
}

.zero-cell { background: rgba(234, 179, 8, 0.15); color: #facc15; font-weight: 700; }

.assigned-cell {
  background: rgba(34, 197, 94, 0.25) !important;
  color: #4ade80 !important;
  font-weight: 700;
  border: 1px solid #22c55e !important;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #0f172a;
}

.btn-primary {
  background: #6366f1;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #4f46e5; }

.btn-secondary {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover { background: #1e293b; }

.btn-danger-solid {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger-solid:hover { background: #dc2626; }


/* ================================================================
   ESTILOS PROPIOS DE SELECTION SORT (pinos de boliche)
   ================================================================ */
.ss-workspace {
  --pin-body: #fbf8f1;
  --pin-stripe: #dc2626;
  --st-sorted: #22c55e;
  --st-i: #8b5cf6;
  --st-min: #f59e0b;
  --st-j: #3b82f6;
  --st-swap: #ec4899;
  --lane-1: #e9c79a;
  --lane-2: #d9b07c;
  --lane-edge: #b98a55;
  --code-bg: #f0ecff;
}
:global([data-theme='dark']) .ss-workspace {
  --lane-1: #6b4a2b;
  --lane-2: #5a3d22;
  --lane-edge: #3d2915;
  --code-bg: #0f0c1c;
}
.svg-defs { position: absolute; width: 0; height: 0; }

.board-container > .board-card,
.board-container > .explain-grid { width: 100%; max-width: 1100px; box-sizing: border-box; }

/* ----- Datos de entrada ----- */
.data-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.75rem 1.25rem; }
.field-n { flex: 1 1 240px; }
.n-control { display: flex; align-items: center; gap: 0.6rem; }
.n-control input[type='range'] { flex: 1; accent-color: #8b5cf6; padding: 0; border: none; background: none; }
.n-control input[type='number'] { width: 4.2rem; }
.field select {
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.85rem;
}
.field-inline { flex-direction: row; align-items: center; gap: 0.5rem; }
.btn-random { color: #3b82f6; border-color: rgba(59, 130, 246, 0.45); }

.values-label {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 1rem 0 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(3.4rem, 1fr)); gap: 0.4rem; }
.value-cell { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
.value-cell span { font-size: 0.65rem; color: var(--text-secondary); }
.value-cell input {
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  padding: 0.4rem 0.2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  font-weight: 600;
  -moz-appearance: textfield;
  appearance: textfield;
}
.value-cell input::-webkit-outer-spin-button,
.value-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.value-cell input.invalid { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.data-tip { margin-top: 0.75rem; }

/* ----- Pista y pinos ----- */
.lane-card { padding-bottom: 0.75rem; }
.lane {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: repeating-linear-gradient(90deg, var(--lane-1) 0 22px, var(--lane-2) 22px 24px);
  border: 1px solid var(--lane-edge);
}
.lane::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 45%, rgba(0, 0, 0, 0.12));
  pointer-events: none;
}
.pins {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(2px, 0.8vw, 10px);
  height: 330px;
  padding: 0 0.5rem;
  overflow-x: auto;
}
.pin-slot {
  flex: 1 1 0;
  max-width: 68px;
  min-width: 22px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.pin-move { transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pin-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #2b1a0c;
  padding: 0.05rem 0.35rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.75);
  margin-bottom: 0.2rem;
}
.pin-svg { display: block; overflow: visible; transition: height 0.35s ease, width 0.35s ease, filter 0.2s ease; }
.pin-body { fill: var(--pin-body); transition: fill 0.25s ease; }
.pin-stripe { fill: var(--pin-color, var(--pin-stripe)); transition: fill 0.25s ease; }
.pin-outline { fill: none; stroke: rgba(60, 35, 10, 0.35); stroke-width: 0.8; vector-effect: non-scaling-stroke; }
.pin-spot { width: 70%; height: 6px; margin-top: 1px; border-radius: 50%; background: rgba(0, 0, 0, 0.25); }

.st-sorted { --pin-color: var(--st-sorted); }
.st-sorted .pin-body { fill: color-mix(in srgb, var(--st-sorted) 22%, var(--pin-body)); }
.st-j { --pin-color: var(--st-j); }
.st-j .pin-body { fill: color-mix(in srgb, var(--st-j) 25%, var(--pin-body)); }
.st-min { --pin-color: var(--st-min); }
.st-min .pin-body { fill: color-mix(in srgb, var(--st-min) 35%, var(--pin-body)); }
.st-swap { --pin-color: var(--st-swap); }
.st-swap .pin-body { fill: color-mix(in srgb, var(--st-swap) 30%, var(--pin-body)); }
.st-i .pin-svg { filter: drop-shadow(0 0 0 var(--st-i)) drop-shadow(0 0 4px var(--st-i)); }

.pin-labels { display: flex; justify-content: center; gap: clamp(2px, 0.8vw, 10px); padding: 0.35rem 0.5rem 0; }
.pin-label {
  flex: 1 1 0;
  max-width: 68px;
  min-width: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.tags { display: flex; gap: 2px; min-height: 1.05rem; }
.tag { font-style: normal; padding: 0 0.3rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; color: #fff; line-height: 1.05rem; }
.tag-i { background: var(--st-i); }
.tag-min { background: var(--st-min); }
.tag-j { background: var(--st-j); }

.legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem 1rem; margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary); }
.legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
.dot { width: 0.7rem; height: 0.7rem; border-radius: 3px; display: inline-block; }
.dot-sorted { background: var(--st-sorted); }
.dot-i { box-shadow: inset 0 0 0 2px var(--st-i); }
.dot-min { background: var(--st-min); }
.dot-j { background: var(--st-j); }
.dot-swap { background: var(--st-swap); }

/* ----- Contador de pasos / Big O ----- */
.bigo-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 0.5rem; }
@media (min-width: 760px) { .bigo-grid { grid-template-columns: 1.1fr 1fr; } }
.counter-main { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
.counter-number {
  font-size: clamp(2.4rem, 6vw, 3.4rem);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.counter-caption { font-size: 0.85rem; color: var(--text-secondary); }
.counter-split { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
.counter-split div {
  flex: 1 1 120px;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: var(--bg-surface-2, var(--bg-surface));
  border: 1px solid var(--border-color);
}
.counter-split span { display: block; font-size: 0.72rem; color: var(--text-secondary); }
.counter-split strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; }
.progress { margin-top: 0.9rem; height: 8px; border-radius: 999px; background: var(--bg-surface-2, var(--border-color)); overflow: hidden; }
.progress > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-start), var(--accent-end)); transition: width 0.3s ease; }
.progress-caption { margin: 0.35rem 0 0; font-size: 0.75rem; color: var(--text-secondary); }
.theory p { margin: 0 0 0.6rem; font-size: 0.85rem; line-height: 1.55; color: var(--text-secondary); }
.theory strong { color: var(--text-primary); }
.complexity-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.complexity-table th, .complexity-table td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border-color); }
.complexity-table th { color: var(--text-secondary); font-weight: 500; }
.complexity-table td:last-child { font-weight: 600; }

/* ----- Explicación y pseudocódigo ----- */
.explain-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 860px) { .explain-grid { grid-template-columns: 1.2fr 1fr; } }
.explain-grid .step-card-main { max-width: none; }
.pseudocode {
  margin: 0;
  padding: 0.6rem;
  border-radius: 10px;
  background: var(--code-bg);
  color: var(--text-primary);
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.75;
}
.code-line { display: block; padding: 0 0.45rem; border-radius: 5px; white-space: pre; }
.code-line-active { background: rgba(139, 92, 246, 0.3); font-weight: 600; }

/* ----- Modal de resolución ----- */
.metrics-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 560px) { .metrics-3 { grid-template-columns: 1fr; } .pins { height: 260px; } }
.mini-array { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.mini-cell {
  min-width: 2rem;
  padding: 0.3rem 0.4rem;
  text-align: center;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 600;
}
.mini-cell-sorted { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #86efac; }
.mini-cell-swap { border-color: #ec4899; background: rgba(236, 72, 153, 0.18); color: #f9a8d4; }
.pass-count { margin: 0.5rem 0 0; font-size: 0.75rem; color: #94a3b8; }

@media (prefers-reduced-motion: reduce) {
  .pin-move, .pin-svg, .pin-body, .pin-stripe, .progress > div { transition: none; }
}

/* ----- Insertion Sort: la llave se levanta ----- */
.ss-workspace { --st-key: #8b5cf6; }
.st-key { --pin-color: var(--st-key); }
.st-key .pin-body { fill: color-mix(in srgb, var(--st-key) 30%, var(--pin-body)); }
.st-key .pin-svg { transform: translateY(-18px); filter: drop-shadow(0 10px 6px rgba(0, 0, 0, 0.3)); }
.st-key .pin-value { transform: translateY(-18px); }
.pin-svg, .pin-value { transition: height 0.35s ease, width 0.35s ease, transform 0.3s ease, filter 0.2s ease; }
.tag-key { background: var(--st-key); }
.dot-key { background: var(--st-key); }
</style>
