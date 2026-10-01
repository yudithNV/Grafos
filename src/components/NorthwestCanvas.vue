<template>
  <div class="canvas-workspace">
    <StarryBackground />

    <!-- Barra superior (misma estructura que Asignación) -->
    <div class="canvas-header">
      <div class="header-left">
        <button @click="$emit('back')" class="btn-icon-only" title="Volver a la página anterior">
          <ArrowLeft class="icon" />
        </button>
        <div class="header-info">
          <h2 class="header-title">
            Pizarra de Transporte
            <span class="status-indicator"></span>
          </h2>
          <p class="header-subtitle">{{ modeDescription }}</p>
        </div>
      </div>

      <div class="stats-container">
        <div class="stat-badge">
          Orígenes: <strong class="stat-number">{{ originCount }}</strong>
        </div>
        <div class="stat-badge">
          Destinos: <strong class="stat-number">{{ destinationCount }}</strong>
        </div>
        <div v-if="finished" class="stat-badge stat-badge-optimal">
          Costo: <strong class="stat-number">{{ totalCost }}</strong>
          <button @click="resetAllocations" class="btn-clear-opt" title="Quitar solución">✕</button>
        </div>
      </div>

      <div class="header-actions">
        <button @click="saveBoard" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="showMatrixModal = true" class="btn-text btn-matrix">
          <Grid3x3 class="btn-icon" />
          <span>Matriz</span>
        </button>
        <button @click="openSolver" class="btn-text btn-resolver">
          <Sparkles class="btn-icon" />
          <span>Resolver</span>
        </button>
        <button @click="$emit('show-instructions', 'northwest')" class="btn-text">
          <BookOpen class="btn-icon" />
          <span>Manual</span>
        </button>
        <button @click="showClearModal = true" class="btn-text btn-danger">
          <Trash2 class="btn-icon" />
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="board-container">
      <!-- Controles del método -->
      <section class="controls">
        <label class="field">
          <span>Orígenes</span>
          <input v-model.number="originCount" type="number" min="1" :max="MAX_SIZE" @change="resizeTable" />
        </label>
        <label class="field">
          <span>Destinos</span>
          <input v-model.number="destinationCount" type="number" min="1" :max="MAX_SIZE" @change="resizeTable" />
        </label>

        <div class="controls-actions">
          <button class="btn-text" @click="undoStep" :disabled="history.length === 0">
            <Undo2 class="btn-icon" />
            <span>Atrás</span>
          </button>
          <button class="btn-text btn-step" @click="runNextStep" :disabled="finished">
            <StepForward class="btn-icon" />
            <span>{{ finished ? 'Completado' : nextStepLabel }}</span>
          </button>
          <button class="btn-text" @click="runAll" :disabled="finished">
            <FastForward class="btn-icon" />
            <span>Ejecutar todo</span>
          </button>
          <button class="btn-text" @click="resetAllocations">
            <RotateCcw class="btn-icon" />
            <span>Reiniciar</span>
          </button>
        </div>
      </section>

      <!-- Aviso de balance -->
      <div v-if="!isBalanced" class="connection-tip balance-tip">
        <span class="pulse-dot"></span>
        <span>
          La disponibilidad total ({{ totalAvailability }}) y la demanda total ({{ totalDemand }}) no coinciden.
          Ajusta los valores para obtener una solución completa.
        </span>
      </div>

      <!-- Tabla de transporte -->
      <section class="board-card">
        <div class="table-scroll">
          <table class="transport-table">
            <thead>
              <tr>
                <th>Origen / Destino</th>
                <th v-for="(_, column) in destinationCount" :key="`heading-${column}`">
                  Destino {{ column + 1 }}
                </th>
                <th>Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, origin) in costs" :key="`row-${origin}`">
                <th>Origen {{ origin + 1 }}</th>
                <td
                  v-for="(_, destination) in row"
                  :key="`cell-${origin}-${destination}`"
                  :class="{
                    active: currentCell?.row === origin && currentCell?.column === destination,
                    assigned: visited[origin]?.[destination]
                  }"
                >
                  <input v-model.number="costs[origin][destination]" type="number" @input="resetAllocations" />
                  <span v-if="visited[origin]?.[destination]" class="allocation">
                    +{{ allocations[origin][destination] }}
                  </span>
                </td>
                <td class="supply-cell">
                  <input v-model.number="availability[origin]" type="number" min="0" @input="resetAllocations" />
                  <span v-if="history.length" class="remaining">Resta: {{ remainingSupply[origin] }}</span>
                </td>
              </tr>
              <tr class="demand-row">
                <th>Demanda</th>
                <td v-for="(_, destination) in demand" :key="`demand-${destination}`">
                  <input v-model.number="demand[destination]" type="number" min="0" @input="resetAllocations" />
                  <span v-if="history.length" class="remaining">Resta: {{ remainingDemand[destination] }}</span>
                </td>
                <td class="total-cell">{{ totalAvailability }} / {{ totalDemand }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div><span>Costo acumulado</span><strong>{{ totalCost }}</strong></div>
          <div><span>Asignaciones</span><strong>{{ assignmentCount }}</strong></div>
          <div><span>Estado</span><strong>{{ finished ? 'Solución inicial lista' : 'Pendiente' }}</strong></div>
        </div>
      </section>

      <!-- Explicación del paso actual -->
      <section class="step-card-main">
        <h3 class="step-main-title">{{ currentStep.title }}</h3>
        <p class="step-main-desc">{{ currentStep.description }}</p>
        <p class="step-main-note">
          Los números dentro de las celdas son costos unitarios. Las cantidades asignadas aparecen en color junto a cada costo.
        </p>
      </section>
    </div>

    <!-- Modal Matriz -->
    <div v-if="showMatrixModal" class="modal-overlay" @click.self="showMatrixModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title-group">
            <h3 class="modal-title">Matriz de Transporte</h3>
            <span class="algorithm-badge">Northwest</span>
          </div>
          <button @click="showMatrixModal = false" class="btn-close-icon">&times;</button>
        </div>

        <div class="modal-body">
          <div class="section-container">
            <h4 class="section-heading">Costos unitarios</h4>
            <div class="matrix-preview-wrapper">
              <table class="step-matrix-table">
                <thead>
                  <tr>
                    <th class="corner-cell">Origen \ Destino</th>
                    <th v-for="(_, c) in destinationCount" :key="'mc' + c">Destino {{ c + 1 }}</th>
                    <th>Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, r) in costs" :key="'mr' + r">
                    <td class="row-label-cell">Origen {{ r + 1 }}</td>
                    <td v-for="(val, c) in row" :key="'mv' + r + '-' + c">{{ val }}</td>
                    <td class="row-label-cell">{{ availability[r] }}</td>
                  </tr>
                  <tr>
                    <td class="row-label-cell">Demanda</td>
                    <td v-for="(val, c) in demand" :key="'md' + c" class="row-label-cell">{{ val }}</td>
                    <td class="row-label-cell">{{ totalAvailability }} / {{ totalDemand }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-heading">Cantidades asignadas</h4>
            <div class="matrix-preview-wrapper">
              <table class="step-matrix-table">
                <thead>
                  <tr>
                    <th class="corner-cell">Origen \ Destino</th>
                    <th v-for="(_, c) in destinationCount" :key="'ac' + c">Destino {{ c + 1 }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, r) in allocations" :key="'ar' + r">
                    <td class="row-label-cell">Origen {{ r + 1 }}</td>
                    <td
                      v-for="(val, c) in row"
                      :key="'av' + r + '-' + c"
                      :class="{ 'assigned-cell': val > 0, 'zero-cell': visited[r][c] && val === 0 }"
                    >
                      {{ visited[r][c] ? val : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showMatrixModal = false" class="btn-primary">Aceptar</button>
        </div>
      </div>
    </div>

    <!-- Modal Resolución Paso a Paso -->
    <div v-if="showStepsModal" class="modal-overlay" @click.self="showStepsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title-group">
            <h3 class="modal-title">Resolución Paso a Paso</h3>
            <span class="algorithm-badge">Esquina Noroeste</span>
          </div>
          <button @click="showStepsModal = false" class="btn-close-icon">&times;</button>
        </div>

        <div class="modal-body">
          <div class="metrics-grid">
            <div class="metric-card highlight">
              <span class="metric-label">Costo Total (solución inicial)</span>
              <span class="metric-value">{{ totalCost }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Asignaciones</span>
              <span class="metric-value">{{ assignmentList.length }}</span>
            </div>
          </div>

          <div class="section-container" v-if="assignmentList.length">
            <h4 class="section-heading">Resumen de Asignaciones</h4>
            <div class="table-wrapper">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th class="arrow-header"></th>
                    <th>Destino</th>
                    <th>Cantidad</th>
                    <th>Costo unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in assignmentList" :key="index">
                    <td class="font-medium">Origen {{ item.origin }}</td>
                    <td class="arrow-cell">→</td>
                    <td class="font-medium">Destino {{ item.destination }}</td>
                    <td>{{ item.amount }}</td>
                    <td>{{ item.unitCost }}</td>
                    <td class="cost-badge">{{ item.subtotal }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-container" v-if="history.length">
            <h4 class="section-heading">Evolución de la Matriz</h4>

            <div class="steps-accordion">
              <div v-for="(step, sIndex) in history" :key="sIndex" class="step-card">
                <span class="step-title">Paso {{ sIndex + 1 }}: {{ step.title }}</span>
                <p class="step-desc">{{ step.description }}</p>

                <div class="matrix-preview-wrapper">
                  <table class="step-matrix-table">
                    <thead>
                      <tr>
                        <th class="corner-cell">Origen \ Destino</th>
                        <th v-for="(_, c) in destinationCount" :key="'sc' + sIndex + '-' + c">Destino {{ c + 1 }}</th>
                        <th>Disp. restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, r) in step.allocations" :key="'sr' + sIndex + '-' + r">
                        <td class="row-label-cell">Origen {{ r + 1 }}</td>
                        <td
                          v-for="(val, c) in row"
                          :key="'sv' + sIndex + '-' + r + '-' + c"
                          :class="{
                            'assigned-cell': step.row === r && step.column === c,
                            'zero-cell': step.visited[r][c] && val === 0 && !(step.row === r && step.column === c)
                          }"
                        >
                          {{ step.visited[r][c] ? val : '—' }}
                          <small class="cell-cost">c: {{ costs[r][c] }}</small>
                        </td>
                        <td class="row-label-cell">{{ step.remainingSupply[r] }}</td>
                      </tr>
                      <tr>
                        <td class="row-label-cell">Dem. restante</td>
                        <td v-for="(val, c) in step.remainingDemand" :key="'sd' + sIndex + '-' + c" class="row-label-cell">
                          {{ val }}
                        </td>
                        <td class="row-label-cell"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
            Se borrarán los costos, la disponibilidad, la demanda y la solución actual. ¿Quieres continuar?
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
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  Trash2,
  BookOpen,
  Grid3x3,
  Save,
  Sparkles,
  Undo2,
  StepForward,
  FastForward,
  RotateCcw
} from '@lucide/vue'
import StarryBackground from './StarryBackground.vue'
import AssignmentWarning from './AssignmentWarning.vue'

const emit = defineEmits(['back', 'show-instructions', 'save', 'clear', 'solution-found'])

const MAX_SIZE = 8

/* ---------- Helpers ---------- */
const num = (value) => Math.max(0, Number(value) || 0)
const makeMatrix = (rows, cols, fill) => Array.from({ length: rows }, () => Array(cols).fill(fill))
const cloneMatrix = (matrix) => matrix.map((row) => [...row])

/* ---------- Datos del problema ---------- */
const originCount = ref(3)
const destinationCount = ref(3)
const costs = ref([
  [4, 6, 8],
  [5, 3, 7],
  [6, 5, 4]
])
const availability = ref([20, 30, 25])
const demand = ref([10, 35, 30])

/* ---------- Estado del método ---------- */
const allocations = ref(makeMatrix(3, 3, 0))
const visited = ref(makeMatrix(3, 3, false))
const currentCell = ref(null)
const finished = ref(false)
const history = ref([])

/* ---------- Modales ---------- */
const showMatrixModal = ref(false)
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

/* ---------- Computados ---------- */
const totalAvailability = computed(() => availability.value.reduce((sum, v) => sum + num(v), 0))
const totalDemand = computed(() => demand.value.reduce((sum, v) => sum + num(v), 0))
const isBalanced = computed(() => totalAvailability.value === totalDemand.value)
const hasData = computed(() => totalAvailability.value > 0 && totalDemand.value > 0)

const remainingSupply = computed(() =>
  availability.value.map((value, row) => {
    const used = (allocations.value[row] || []).reduce((sum, amount) => sum + amount, 0)
    return num(value) - used
  })
)

const remainingDemand = computed(() =>
  demand.value.map((value, column) => {
    const used = allocations.value.reduce((sum, row) => sum + (row[column] || 0), 0)
    return num(value) - used
  })
)

const totalCost = computed(() =>
  allocations.value.reduce(
    (sum, row, origin) =>
      sum + row.reduce((rowSum, amount, destination) => rowSum + amount * (Number(costs.value[origin]?.[destination]) || 0), 0),
    0
  )
)

const assignmentCount = computed(() => allocations.value.flat().filter((amount) => amount > 0).length)

const assignmentList = computed(() => {
  const list = []
  allocations.value.forEach((row, origin) => {
    row.forEach((amount, destination) => {
      if (amount > 0) {
        const unitCost = Number(costs.value[origin]?.[destination]) || 0
        list.push({ origin: origin + 1, destination: destination + 1, amount, unitCost, subtotal: amount * unitCost })
      }
    })
  })
  return list
})

const nextStepLabel = computed(() => (currentCell.value ? 'Siguiente paso' : 'Iniciar método'))

const modeDescription = computed(() => {
  if (finished.value) return 'Solución inicial lista. Revisa el costo y el paso a paso.'
  if (currentCell.value) return `Siguiente celda: Origen ${currentCell.value.row + 1} → Destino ${currentCell.value.column + 1}`
  return 'Asigna desde la esquina noroeste hasta cubrir disponibilidad y demanda'
})

const currentStep = computed(() => {
  if (finished.value) {
    const last = history.value[history.value.length - 1]
    return {
      title: 'Solución inicial completada',
      description: `${last ? last.description + ' ' : ''}Northwest terminó las asignaciones con un costo total de ${totalCost.value}. Esta solución es factible, pero no necesariamente tiene el costo mínimo.`
    }
  }
  const last = history.value[history.value.length - 1]
  if (last) return { title: last.title, description: last.description }
  return {
    title: 'Comienza en la esquina noroeste',
    description: 'Presiona “Iniciar método” para asignar la cantidad posible en la primera celda.'
  }
})

/* ---------- Tamaño de la tabla ---------- */
function resizeTable() {
  originCount.value = Math.min(MAX_SIZE, Math.max(1, Math.floor(Number(originCount.value)) || 1))
  destinationCount.value = Math.min(MAX_SIZE, Math.max(1, Math.floor(Number(destinationCount.value)) || 1))

  const oldCosts = costs.value
  const oldAvailability = availability.value
  const oldDemand = demand.value

  costs.value = Array.from({ length: originCount.value }, (_, r) =>
    Array.from({ length: destinationCount.value }, (_, c) => oldCosts[r]?.[c] ?? 0)
  )
  availability.value = Array.from({ length: originCount.value }, (_, r) => oldAvailability[r] ?? 0)
  demand.value = Array.from({ length: destinationCount.value }, (_, c) => oldDemand[c] ?? 0)
  resetAllocations()
}

/* ---------- Método Northwest ---------- */
function resetAllocations() {
  allocations.value = makeMatrix(originCount.value, destinationCount.value, 0)
  visited.value = makeMatrix(originCount.value, destinationCount.value, false)
  currentCell.value = null
  finished.value = false
  history.value = []
}

function runNextStep() {
  if (finished.value) return false

  if (!hasData.value) {
    openWarning(
      'Tabla sin datos',
      'La disponibilidad o la demanda total es 0.',
      'Ingresa valores de disponibilidad y demanda antes de ejecutar el método.'
    )
    return false
  }

  if (!currentCell.value) currentCell.value = { row: 0, column: 0 }

  const { row, column } = currentCell.value
  const supplyLeft = remainingSupply.value[row]
  const demandLeft = remainingDemand.value[column]
  const amount = Math.max(0, Math.min(supplyLeft, demandLeft))

  allocations.value[row][column] += amount
  visited.value[row][column] = true

  const supplyAfter = supplyLeft - amount
  const demandAfter = demandLeft - amount
  const isLastRow = row === originCount.value - 1
  const isLastColumn = column === destinationCount.value - 1

  let next = null
  let moveText = ''

  if (supplyAfter === 0 && demandAfter === 0) {
    if (!isLastColumn) {
      next = { row, column: column + 1 }
      moveText = 'El origen y el destino quedaron en 0, así que avanzamos a la derecha.'
    } else if (!isLastRow) {
      next = { row: row + 1, column }
      moveText = 'El origen y el destino quedaron en 0, así que bajamos a la siguiente fila.'
    }
  } else if (supplyAfter === 0) {
    if (!isLastRow) {
      next = { row: row + 1, column }
      moveText = `El Origen ${row + 1} se agotó, así que bajamos a la siguiente fila.`
    }
  } else if (demandAfter === 0) {
    if (!isLastColumn) {
      next = { row, column: column + 1 }
      moveText = `El Destino ${column + 1} quedó cubierto, así que avanzamos a la derecha.`
    }
  }

  history.value.push({
    title: `Asignación en Origen ${row + 1} → Destino ${column + 1}`,
    description:
      `Se asignan ${amount} unidades, el mínimo entre la disponibilidad restante (${supplyLeft}) y la demanda restante (${demandLeft}). ` +
      moveText,
    row,
    column,
    amount,
    allocations: cloneMatrix(allocations.value),
    visited: cloneMatrix(visited.value),
    remainingSupply: [...remainingSupply.value],
    remainingDemand: [...remainingDemand.value],
    nextCell: next,
    finished: !next
  })

  currentCell.value = next

  if (!next) {
    finished.value = true
    emit('solution-found', {
      metodo: 'Esquina Noroeste',
      costoTotal: totalCost.value,
      asignaciones: assignmentList.value,
      allocations: cloneMatrix(allocations.value)
    })
  }

  return true
}

function runAll() {
  let guard = 0
  while (!finished.value && guard < MAX_SIZE * MAX_SIZE * 2) {
    if (runNextStep() === false) break
    guard += 1
  }
}

function undoStep() {
  if (history.value.length === 0) return
  history.value.pop()
  const last = history.value[history.value.length - 1]

  if (!last) {
    resetAllocations()
    return
  }

  allocations.value = cloneMatrix(last.allocations)
  visited.value = cloneMatrix(last.visited)
  currentCell.value = last.nextCell
  finished.value = last.finished
}

/* ---------- Acciones de la barra superior ---------- */
function openSolver() {
  if (!hasData.value) {
    openWarning(
      'Tabla sin datos',
      'No hay disponibilidad o demanda para resolver.',
      'Ingresa los valores de la tabla antes de resolver.'
    )
    return
  }
  if (!finished.value) runAll()
  if (finished.value) showStepsModal.value = true
}

function saveBoard() {
  emit('save', {
    algorithm: 'northwest',
    originCount: originCount.value,
    destinationCount: destinationCount.value,
    costs: cloneMatrix(costs.value),
    availability: [...availability.value],
    demand: [...demand.value],
    allocations: cloneMatrix(allocations.value),
    totalCost: totalCost.value
  })
}

function confirmClear() {
  costs.value = makeMatrix(originCount.value, destinationCount.value, 0)
  availability.value = Array(originCount.value).fill(0)
  demand.value = Array(destinationCount.value).fill(0)
  resetAllocations()
  showClearModal.value = false
  emit('clear')
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
</style>