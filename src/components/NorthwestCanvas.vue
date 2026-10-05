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
        <div class="stat-badge">
          Objetivo: <strong class="stat-number">{{ objective === 'maximize' ? 'Maximizar' : 'Minimizar' }}</strong>
        </div>
        <div v-if="finished" class="stat-badge stat-badge-optimal">
          {{ objectiveLabel }}: <strong class="stat-number">{{ totalCost }}</strong>
          <button @click="resetAllocations" class="btn-clear-opt" title="Quitar solución">✕</button>
        </div>
        <div v-if="modiResult" class="stat-badge" :class="modiResult.optimal ? 'badge-ok' : 'badge-warn'">
          {{ modiResult.optimal ? 'Óptimo alcanzado ✓' : 'Óptimo no determinado' }}
        </div>
      </div>

      <div class="header-actions">
        <button @click="saveBoard" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="$emit('open-load')" class="btn-text btn-load-graph" title="Abrir un problema guardado">
          <FolderOpen class="btn-icon" />
          <span>Cargar</span>
        </button>
        <button @click="showMatrixModal = true" class="btn-text btn-matrix">
          <Grid3x3 class="btn-icon" />
          <span>Matriz</span>
        </button>
        <button @click="openSolver" class="btn-text btn-resolver">
          <Sparkles class="btn-icon" />
          <span>Ver paso a paso</span>
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
        <!-- Caja: Northwest -->
        <div class="control-box control-box-main">
          <h4 class="control-title">Northwest</h4>
          <div class="control-body">
            <label class="field">
              <span>Orígenes/Filas</span>
              <input v-model.number="originCount" type="number" min="1" :max="MAX_SIZE" @change="resizeTable" />
            </label>
            <label class="field">
              <span>Destinos/Columnas</span>
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
          </div>
        </div>

        <!-- Caja: Objetivo -->
        <div class="control-box">
          <h4 class="control-title">Objetivo</h4>
          <div class="control-body">
            <div class="segmented" role="group" aria-label="Objetivo de la optimización">
              <button
                type="button"
                class="seg-btn"
                :class="{ 'seg-active seg-neon': objective === 'minimize' }"
                @click="setObjective('minimize')"
              >
                <TrendingDown class="seg-icon" />
                <span>Minimizar</span>
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ 'seg-active seg-neon': objective === 'maximize' }"
                @click="setObjective('maximize')"
              >
                <TrendingUp class="seg-icon" />
                <span>Maximizar</span>
              </button>
            </div>
          </div>
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
        <!-- Interruptor Óptimo / Inicial -->
        <div v-if="canToggleView" class="view-switch">
          <span class="view-switch-label">Ver reparto:</span>
          <div class="segmented" role="group" aria-label="Reparto a mostrar">
            <button type="button" class="seg-btn" :class="{ 'seg-active': viewMode === 'optimal' }" @click="viewMode = 'optimal'">
              Óptimo
            </button>
            <button type="button" class="seg-btn" :class="{ 'seg-active': viewMode === 'initial' }" @click="viewMode = 'initial'">
              Inicial (Northwest)
            </button>
          </div>
        </div>

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
                    assigned: isAssigned(origin, destination) && !showOptimal,
                    'neon-cell': showOptimal && isAssigned(origin, destination)
                  }"
                >
                  <input v-model.number="costs[origin][destination]" type="number" @input="resetAllocations" />
                  <span v-if="isAssigned(origin, destination)" class="allocation">
                    +{{ cellAmount(origin, destination) }}
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
          <div>
            <span>{{ objectiveLabel }} total</span>
            <strong>{{ totalCost }}</strong>
            <small v-if="showOptimal && initialCost !== totalCost" class="summary-sub">Northwest (inicial): {{ initialCost }}</small>
          </div>
          <div><span>Asignaciones</span><strong>{{ assignmentCount }}</strong></div>
          <div><span>Estado</span><strong>{{ statusText }}</strong></div>
          <div class="summary-opt" :class="'opt-' + optimalityTone">
            <span>Optimalidad</span>
            <strong>{{ optimalityText }}</strong>
            <button v-if="modiResult" class="link-btn" @click="showStepsModal = true">Ver detalle</button>
          </div>
        </div>
      </section>

      <!-- Explicación del paso actual -->
      <section class="step-card-main">
        <h3 class="step-main-title">{{ currentStep.title }}</h3>
        <p class="step-main-desc">{{ currentStep.description }}</p>
        <p class="step-main-note">
          Los números dentro de las celdas son costos unitarios. Las cantidades asignadas aparecen en color junto a cada costo.
        </p>
        <p class="step-main-note">
          El objetivo (minimizar o maximizar) no cambia la solución inicial de Northwest. Se usa para buscar el reparto óptimo con MODI.
        </p>
      </section>
    </div>

    <!-- Modal Matriz -->
    <div v-if="showMatrixModal" class="modal-overlay" @click.self="showMatrixModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title-group">
            <h3 class="modal-title">Matriz de Transporte</h3>
            <span class="algorithm-badge">{{ showOptimal ? 'Solución óptima' : 'Northwest' }}</span>
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
            <h4 class="section-heading">Cantidades asignadas{{ showOptimal ? ' (solución óptima)' : '' }}</h4>
            <div class="matrix-preview-wrapper">
              <table class="step-matrix-table">
                <thead>
                  <tr>
                    <th class="corner-cell">Origen \ Destino</th>
                    <th v-for="(_, c) in destinationCount" :key="'ac' + c">Destino {{ c + 1 }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, r) in displayAllocations" :key="'ar' + r">
                    <td class="row-label-cell">Origen {{ r + 1 }}</td>
                    <td
                      v-for="(val, c) in row"
                      :key="'av' + r + '-' + c"
                      :class="{
                        'assigned-cell': !showOptimal && val > 0,
                        'neon-cell': showOptimal && val > 0,
                        'zero-cell': !showOptimal && visited[r]?.[c] && val === 0
                      }"
                    >
                      {{ isAssigned(r, c) ? val : '—' }}
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

    <!-- Modal Resolución Paso a Paso (Northwest + MODI) -->
    <div v-if="showStepsModal" class="modal-overlay" @click.self="showStepsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title-group">
            <h3 class="modal-title">Resolución Paso a Paso</h3>
            <span class="algorithm-badge">Northwest{{ modiResult ? ' + MODI' : '' }}</span>
          </div>
          <button @click="showStepsModal = false" class="btn-close-icon">&times;</button>
        </div>

        <div class="modal-body">
          <!-- PARTE 1: Northwest -->
          <h3 class="part-title">
            <span class="part-badge">1</span>
            Solución inicial (Northwest)
          </h3>

          <div class="metrics-grid">
            <div class="metric-card" :class="{ highlight: !modiResult }">
              <span class="metric-label">{{ objectiveLabel }} de Northwest (inicial)</span>
              <span class="metric-value">{{ initialCost }}</span>
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

          <!-- Aviso si no se puede aplicar MODI -->
          <div v-if="finished && !isBalanced" class="verdict verdict-warn">
            <strong>MODI no se puede aplicar</strong>
            <p>Para mejorar la solución hasta el óptimo, la disponibilidad total y la demanda total deben coincidir.</p>
          </div>

          <!-- PARTE 2: MODI -->
          <template v-if="modiResult">
            <h3 class="part-title part-title-2">
              <span class="part-badge">2</span>
              Mejora hasta el óptimo (MODI · {{ objective === 'maximize' ? 'Maximizar' : 'Minimizar' }})
            </h3>

            <div class="verdict" :class="'verdict-' + modiResult.tone">
              <strong>{{ modiResult.title }}</strong>
              <p>{{ modiResult.text }}</p>
            </div>

            <div class="metrics-grid">
              <div class="metric-card">
                <span class="metric-label">{{ objectiveLabel }} de Northwest (inicial)</span>
                <span class="metric-value">{{ modiResult.initialCost }}</span>
              </div>
              <div class="metric-card highlight metric-neon">
                <span class="metric-label">{{ objectiveLabel }} {{ modiResult.optimal ? 'óptimo' : 'final' }}</span>
                <span class="metric-value">{{ modiResult.finalCost }}</span>
              </div>
            </div>

            <div class="section-container" v-if="modiResult.assignments.length">
              <h4 class="section-heading">Solución {{ modiResult.optimal ? 'óptima' : 'final' }}</h4>
              <div class="table-wrapper neon-wrapper">
                <table class="result-table">
                  <thead>
                    <tr>
                      <th>Origen</th>
                      <th class="arrow-header"></th>
                      <th>Destino</th>
                      <th>Cantidad</th>
                      <th>Valor unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in modiResult.assignments" :key="index">
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

            <div class="section-container">
              <h4 class="section-heading">Iteraciones</h4>
              <div class="steps-accordion">
                <div v-for="(it, i) in modiResult.iterations" :key="'it' + i" class="step-card">
                  <span class="step-title">Iteración {{ i + 1 }}</span>
                  <p class="step-desc">
                    En las celdas asignadas se cumple u + v = valor. Para cada celda vacía se calcula Δ = valor − (u + v).
                  </p>

                  <div class="matrix-preview-wrapper">
                    <table class="step-matrix-table">
                      <thead>
                        <tr>
                          <th class="corner-cell">Origen \ Destino</th>
                          <th v-for="(_, c) in destinationCount" :key="'mh' + i + '-' + c">Destino {{ c + 1 }}</th>
                          <th>u</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, r) in it.allocations" :key="'mr' + i + '-' + r">
                          <td class="row-label-cell">Origen {{ r + 1 }}</td>
                          <td v-for="(val, c) in row" :key="'mc' + i + '-' + r + '-' + c" :class="modiCellClass(it, r, c)">
                            <template v-if="it.basis[r][c]">{{ val }}</template>
                            <template v-else>Δ {{ it.deltas[r][c] }}</template>
                            <small class="cell-cost">valor: {{ costs[r][c] }}</small>
                          </td>
                          <td class="row-label-cell">{{ it.u[r] }}</td>
                        </tr>
                        <tr>
                          <td class="row-label-cell">v</td>
                          <td v-for="(val, c) in it.v" :key="'mv' + i + '-' + c" class="row-label-cell">{{ val }}</td>
                          <td class="row-label-cell"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p class="step-desc modi-note">{{ it.explanation }}</p>
                </div>
              </div>
            </div>
          </template>
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
  FolderOpen,
  Sparkles,
  Undo2,
  StepForward,
  FastForward,
  RotateCcw,
  TrendingDown,   // 👈 nuevo
  TrendingUp      // 👈 nuevo
} from '@lucide/vue'
import StarryBackground from './StarryBackground.vue'
import AssignmentWarning from './AssignmentWarning.vue'

const emit = defineEmits(['back', 'show-instructions', 'save', 'open-load', 'clear', 'solution-found'])

const props = defineProps({
  initialData: { type: Object, default: null }
})

const MAX_SIZE = 8
const MAX_MODI_STEPS = 30

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

/* ---------- Objetivo y optimalidad (MODI) ---------- */
const objective = ref('minimize')
// 'optimal' = reparto óptimo (MODI), 'initial' = reparto de Northwest
const viewMode = ref('optimal')
const modiResult = computed(() => (finished.value && isBalanced.value ? runModi() : null))

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

// ¿Se muestra el reparto óptimo en la tabla?
const showOptimal = computed(() => viewMode.value === 'optimal' && !!modiResult.value?.optimal)

// ¿Tiene sentido el interruptor? (solo si el óptimo es distinto del inicial)
const canToggleView = computed(() => !!modiResult.value?.optimal && !modiResult.value.initialOptimal)

// Matriz que se muestra: la óptima (MODI) o la de Northwest
const displayAllocations = computed(() =>
  showOptimal.value ? modiResult.value.finalAllocations : allocations.value
)

const cellAmount = (r, c) => displayAllocations.value[r]?.[c] ?? 0

const isAssigned = (r, c) => (showOptimal.value ? cellAmount(r, c) > 0 : !!visited.value[r]?.[c])

const costFromMatrix = (matrix) =>
  matrix.reduce(
    (sum, row, origin) =>
      sum + row.reduce((rowSum, amount, destination) => rowSum + amount * (Number(costs.value[origin]?.[destination]) || 0), 0),
    0
  )

// Costo / ganancia de la solución inicial de Northwest
const initialCost = computed(() => costFromMatrix(allocations.value))

// Costo / ganancia mostrado (óptimo si corresponde)
const totalCost = computed(() => costFromMatrix(displayAllocations.value))

const assignmentCount = computed(() => displayAllocations.value.flat().filter((amount) => amount > 0).length)

// Asignaciones de Northwest (para la Parte 1 del paso a paso)
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

const statusText = computed(() => {
  if (!finished.value) return 'Pendiente'
  return showOptimal.value ? 'Solución óptima lista' : 'Solución inicial lista'
})

const optimalityText = computed(() => {
  if (!finished.value) return 'Se calcula al terminar Northwest'
  if (!isBalanced.value) return 'Requiere disponibilidad = demanda'
  if (!modiResult.value) return 'No se pudo determinar'
  if (modiResult.value.optimal) return 'Óptimo alcanzado ✓'
  return 'No se pudo determinar'
})

const optimalityTone = computed(() => {
  if (!modiResult.value) return 'none'
  return modiResult.value.optimal ? 'ok' : 'warn'
})

const objectiveLabel = computed(() => (objective.value === 'maximize' ? 'Ganancia' : 'Costo'))

const nextStepLabel = computed(() => (currentCell.value ? 'Siguiente paso' : 'Iniciar método'))

const modeDescription = computed(() => {
  if (finished.value) {
    return showOptimal.value
      ? 'Solución óptima lista. Revisa el resultado y el paso a paso.'
      : 'Solución inicial lista. Revisa el resultado y el paso a paso.'
  }
  if (currentCell.value) return `Siguiente celda: Origen ${currentCell.value.row + 1} → Destino ${currentCell.value.column + 1}`
  return 'Asigna desde la esquina noroeste hasta cubrir disponibilidad y demanda'
})

const currentStep = computed(() => {
  if (finished.value) {
    const last = history.value[history.value.length - 1]
    const better = objective.value === 'maximize' ? 'de mayor ganancia' : 'de menor costo'
    const noun = objective.value === 'maximize' ? 'una ganancia' : 'un costo'
    const modi = modiResult.value

    let extra
    if (modi?.optimal && viewMode.value === 'optimal') {
      extra = modi.initialOptimal
        ? 'La solución de Northwest ya es la óptima.'
        : `MODI encontró rutas mejores y llevó el resultado de ${modi.initialCost} a ${modi.finalCost}, que es el óptimo. La tabla muestra ese reparto óptimo.`
    } else if (modi?.optimal) {
      extra = `Estás viendo el reparto inicial de Northwest (${modi.initialCost}). El óptimo es ${modi.finalCost}.`
    } else if (!isBalanced.value) {
      extra = 'Para comprobar el óptimo, la disponibilidad y la demanda deben coincidir. Esta solución es factible, pero no necesariamente la ' + better.replace('de ', 'de ') + '.'
    } else {
      extra = 'No se pudo determinar el óptimo.'
    }

    return {
      title: showOptimal.value ? 'Solución óptima completada' : 'Solución inicial completada',
      description: `${last ? last.description + ' ' : ''}Northwest terminó las asignaciones con ${noun} total de ${initialCost.value}. ${extra}`
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
  viewMode.value = 'optimal'
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
      costoTotal: initialCost.value,
      asignaciones: assignmentList.value,
      allocations: cloneMatrix(allocations.value),
      costoOptimo: modiResult.value?.optimal ? modiResult.value.finalCost : null,
      allocationsOptimas: modiResult.value?.optimal ? cloneMatrix(modiResult.value.finalAllocations) : null
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

// Validar que la matriz no esté vacía
function isMatrixEmpty() {
  // Verificar si la matriz de costos está vacía (todos ceros o nulos)
  for (let i = 0; i < costs.value.length; i++) {
    for (let j = 0; j < costs.value[i].length; j++) {
      if (costs.value[i][j] !== 0 && costs.value[i][j] !== null && costs.value[i][j] !== undefined) {
        return false
      }
    }
  }
  return true
}

// Validar que disponibilidad y demanda no estén vacías
function isAvailabilityOrDemandEmpty() {
  const hasAvailability = availability.value.some(v => v !== 0 && v !== null && v !== undefined)
  const hasDemand = demand.value.some(v => v !== 0 && v !== null && v !== undefined)
  return !hasAvailability || !hasDemand
}

function saveBoard() {
  // Validar que la matriz no esté vacía
  if (isMatrixEmpty()) {
    openWarning(
      'Tabla vacía',
      'La matriz de costos está vacía.',
      'Ingresa valores en la matriz de costos antes de guardar.'
    )
    return
  }

  // Validar que haya disponibilidad y demanda
  if (isAvailabilityOrDemandEmpty()) {
    openWarning(
      'Datos incompletos',
      'No hay disponibilidad o demanda ingresada.',
      'Ingresa valores en disponibilidad y demanda antes de guardar.'
    )
    return
  }

  emit('save', {
    algorithm: 'northwest',
    objective: objective.value,
    originCount: originCount.value,
    destinationCount: destinationCount.value,
    costs: cloneMatrix(costs.value),
    availability: [...availability.value],
    demand: [...demand.value],
    allocations: cloneMatrix(displayAllocations.value),
    totalCost: totalCost.value,
    initialCost: initialCost.value
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

/* ---------- Optimalidad (MODI) ---------- */
function setObjective(mode) {
  if (objective.value === mode) return
  objective.value = mode
}

const isImproving = (delta) => (objective.value === 'maximize' ? delta > 0 : delta < 0)

function modiCellClass(it, r, c) {
  if (it.entering && it.entering.row === r && it.entering.column === c) return 'enter-cell'
  if (it.basis[r][c]) return 'assigned-cell'
  return isImproving(it.deltas[r][c]) ? 'zero-cell' : ''
}

// Calcula u y v usando las celdas asignadas (u + v = valor), con u1 = 0
function computePotentials(valueMatrix, basis, m, n) {
  const u = Array(m).fill(null)
  const v = Array(n).fill(null)
  u[0] = 0
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (!basis[r][c]) continue
        if (u[r] !== null && v[c] === null) {
          v[c] = valueMatrix[r][c] - u[r]
          changed = true
        } else if (v[c] !== null && u[r] === null) {
          u[r] = valueMatrix[r][c] - v[c]
          changed = true
        }
      }
    }
  }
  return { u: u.map((x) => x ?? 0), v: v.map((x) => x ?? 0) }
}

// Busca el ciclo que pasa por la celda entrante y celdas asignadas (alterna horizontal / vertical)
function findCycle(basis, enter, m, n) {
  const path = [enter]
  const used = new Set([`${enter.row}-${enter.column}`])

  const dfs = (cell, horizontal) => {
    if (path.length >= 4) {
      if (horizontal && cell.row === enter.row) return true
      if (!horizontal && cell.column === enter.column) return true
    }
    const candidates = []
    if (horizontal) {
      for (let c = 0; c < n; c++) {
        if (c !== cell.column && basis[cell.row][c] && !used.has(`${cell.row}-${c}`)) candidates.push({ row: cell.row, column: c })
      }
    } else {
      for (let r = 0; r < m; r++) {
        if (r !== cell.row && basis[r][cell.column] && !used.has(`${r}-${cell.column}`)) candidates.push({ row: r, column: cell.column })
      }
    }
    for (const next of candidates) {
      path.push(next)
      used.add(`${next.row}-${next.column}`)
      if (dfs(next, !horizontal)) return true
      path.pop()
      used.delete(`${next.row}-${next.column}`)
    }
    return false
  }

  return dfs(enter, true) ? [...path] : null
}

function runModi() {
  const m = originCount.value
  const n = destinationCount.value
  const maximize = objective.value === 'maximize'
  const label = maximize ? 'ganancia' : 'costo'
  const unit = costs.value.map((row) => row.map((v) => Number(v) || 0))

  let alloc = cloneMatrix(allocations.value)
  const basis = cloneMatrix(visited.value)
  const costOf = (a) => a.reduce((sum, row, r) => sum + row.reduce((rs, amt, c) => rs + amt * unit[r][c], 0), 0)
  const cellName = (cell) => `Origen ${cell.row + 1} → Destino ${cell.column + 1}`

  const iterations = []
  let optimal = false

  for (let step = 0; step < MAX_MODI_STEPS; step++) {
    const { u, v } = computePotentials(unit, basis, m, n)
    const deltas = makeMatrix(m, n, null)
    let entering = null

    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        if (basis[r][c]) continue
        const delta = unit[r][c] - (u[r] + v[c])
        deltas[r][c] = delta
        if (isImproving(delta) && (!entering || (maximize ? delta > entering.delta : delta < entering.delta))) {
          entering = { row: r, column: c, delta }
        }
      }
    }

    const cost = costOf(alloc)
    const iteration = {
      u, v, deltas,
      basis: cloneMatrix(basis),
      allocations: cloneMatrix(alloc),
      cost, entering,
      optimal: !entering,
      cycle: [], theta: 0, leaving: null, costAfter: cost,
      explanation: ''
    }
    iterations.push(iteration)

    if (!entering) {
      optimal = true
      iteration.explanation = `Todos los Δ de las celdas vacías son ${maximize ? '≤ 0' : '≥ 0'}. Ninguna ruta mejora el ${label}, así que esta solución es óptima.`
      break
    }

    const cycle = findCycle(basis, entering, m, n)
    if (!cycle) {
      iteration.explanation = 'No se pudo formar el ciclo de mejora para esta celda.'
      break
    }

    const minusCells = cycle.filter((_, i) => i % 2 === 1)
    const theta = Math.min(...minusCells.map((cell) => alloc[cell.row][cell.column]))
    const leaving = minusCells.find((cell) => alloc[cell.row][cell.column] === theta)

    cycle.forEach((cell, i) => {
      alloc[cell.row][cell.column] += i % 2 === 0 ? theta : -theta
    })
    basis[entering.row][entering.column] = true
    basis[leaving.row][leaving.column] = false

    iteration.cycle = cycle.map((cell, i) => ({ ...cell, sign: i % 2 === 0 ? '+' : '−' }))
    iteration.theta = theta
    iteration.leaving = leaving
    iteration.costAfter = costOf(alloc)
    iteration.explanation =
      `Mejor opción: ${cellName(entering)} con Δ = ${entering.delta}. ` +
      `Ciclo: ${iteration.cycle.map((cell) => `${cell.sign} (O${cell.row + 1}, D${cell.column + 1})`).join(', ')}. ` +
      `Se mueven θ = ${theta} unidades y sale ${cellName(leaving)}. ` +
      `El ${label} pasa de ${cost} a ${iteration.costAfter}.`
  }

  const initialCostValue = iterations[0].cost
  const finalCost = costOf(alloc)
  const initialOptimal = iterations[0].optimal

  let tone = 'ok'
  let title = 'La solución inicial ya es óptima'
  let text = `Ninguna ruta vacía permite mejorar el ${label}. Northwest dio directamente el mejor resultado.`
  if (!optimal) {
    tone = 'bad'
    title = 'No se alcanzó el óptimo'
    text = 'Se llegó al límite de iteraciones o no se pudo formar un ciclo. Revisa los datos.'
  } else if (!initialOptimal) {
    tone = 'warn'
    title = 'La solución inicial no era óptima: MODI la mejoró'
    text = `Se mejoró en ${iterations.length - 1} iteración(es) y el ${label} pasó de ${initialCostValue} a ${finalCost}, que es el óptimo.`
  }

  const assignments = []
  alloc.forEach((row, r) => {
    row.forEach((amount, c) => {
      if (amount > 0) assignments.push({ origin: r + 1, destination: c + 1, amount, unitCost: unit[r][c], subtotal: amount * unit[r][c] })
    })
  })

  return {
    iterations,
    optimal,
    initialOptimal,
    initialCost: initialCostValue,
    finalCost,
    finalAllocations: cloneMatrix(alloc),
    tone,
    title,
    text,
    assignments
  }
}

/* ---------- Cargar problema guardado ---------- */
if (props.initialData) {
  const d = props.initialData
  originCount.value = d.originCount
  destinationCount.value = d.destinationCount
  costs.value = d.costs
  availability.value = d.availability
  demand.value = d.demand
  objective.value = d.objective === 'maximize' ? 'maximize' : 'minimize'
  resetAllocations()
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

.btn-load-graph {
  background-color: #dbeafe;
  border-color: #93c5fd;
  color: #2563eb;
}

[data-theme='dark'] .btn-load-graph {
  background-color: rgba(37, 99, 235, 0.15);
  border-color: rgba(96, 165, 250, 0.35);
  color: #60a5fa;
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
  align-items: stretch;
  gap: 0.75rem;
}

.control-box {
  padding: 0.6rem 0.75rem 0.75rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-box-main { flex: 1 1 28rem; }

.control-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.control-body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
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

/* ===== INTERRUPTOR ÓPTIMO / INICIAL ===== */
.view-switch {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.view-switch-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
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
  position: relative;
  z-index: 1;
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
  position: relative;
  z-index: 1;
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

/* ===== CELDAS DE LA SOLUCIÓN ÓPTIMA (MORADO NEÓN) ===== */
.neon-cell {
  --neon-core: #a855f7;
  --neon-glow: #d946ef;
  position: relative;
  background: rgba(168, 85, 247, 0.14) !important;
}

[data-theme='dark'] .neon-cell,
.modal-card .neon-cell {
  --neon-core: #d8b4fe;
  --neon-glow: #c026d3;
}

/* Marco con brillo suave */
.neon-cell::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1.5px solid color-mix(in srgb, var(--neon-core) 70%, transparent);
  border-radius: 0.5rem;
  box-shadow:
    0 0 8px rgba(168, 85, 247, 0.75),
    0 0 18px rgba(217, 70, 239, 0.35),
    inset 0 0 12px rgba(168, 85, 247, 0.35);
  pointer-events: none;
  animation: neonPulse 2.4s ease-in-out infinite;
}

/* Vértices brillantes: cuatro esquinas en L */
.neon-cell::after {
  content: '';
  position: absolute;
  inset: 3px;
  pointer-events: none;
  background:
    linear-gradient(var(--neon-core), var(--neon-core)) left top / 14px 3px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) left top / 3px 14px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) right top / 14px 3px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) right top / 3px 14px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) left bottom / 14px 3px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) left bottom / 3px 14px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) right bottom / 14px 3px no-repeat,
    linear-gradient(var(--neon-core), var(--neon-core)) right bottom / 3px 14px no-repeat;
  filter: drop-shadow(0 0 3px var(--neon-glow)) drop-shadow(0 0 7px #a855f7);
  animation: neonPulse 2.4s ease-in-out infinite;
}

.neon-cell .allocation {
  color: #9333ea;
  font-size: 0.8rem;
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.55);
}

[data-theme='dark'] .neon-cell .allocation,
.modal-card .neon-cell .allocation {
  color: #f3e8ff;
  text-shadow: 0 0 8px #a855f7, 0 0 14px #c026d3;
}

.modal-card td.neon-cell {
  color: #f3e8ff !important;
  font-weight: 700;
  text-shadow: 0 0 8px #a855f7;
}

@keyframes neonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

@media (prefers-reduced-motion: reduce) {
  .neon-cell::before,
  .neon-cell::after { animation: none; }
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

.summary-sub {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
}

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

/* Títulos de las dos partes del paso a paso */
.part-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.part-title-2 {
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #475569;
}

.part-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #6366f1;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.part-title-2 .part-badge {
  background: #a855f7;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
}

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

.metric-card.metric-neon {
  border-color: #c084fc;
  background: rgba(168, 85, 247, 0.12);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.55), inset 0 0 10px rgba(168, 85, 247, 0.2);
}

.metric-card.metric-neon .metric-value { color: #f3e8ff; text-shadow: 0 0 10px #a855f7; }

.metric-label { font-size: 0.85rem; color: #94a3b8; }
.metric-value { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }

.section-container { display: flex; flex-direction: column; gap: 0.75rem; }
.section-heading { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin: 0; }

.table-wrapper { border: 1px solid #334155; border-radius: 8px; overflow: hidden; }

.table-wrapper.neon-wrapper {
  border: 1.5px solid #c084fc;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.6), 0 0 26px rgba(217, 70, 239, 0.25), inset 0 0 10px rgba(168, 85, 247, 0.2);
}

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

.neon-wrapper .arrow-cell { color: #c084fc; text-shadow: 0 0 6px #a855f7; }
.neon-wrapper .cost-badge { color: #f3e8ff; text-shadow: 0 0 8px #a855f7; }

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

/* ===== OBJETIVO (MIN / MAX) ===== */
/* ===== OBJETIVO (MIN / MAX) ===== */
.segmented {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--bg-body);
}

.seg-btn {
  padding: 0.5rem 0.8rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seg-btn + .seg-btn { border-left: 1px solid var(--border-color); }

/* ✨ Seleccionado con brillo morado simple */
.seg-active {
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  box-shadow:
    0 0 8px rgba(168, 85, 247, 0.7),
    inset 0 0 8px rgba(168, 85, 247, 0.3);
  text-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
}

[data-theme='dark'] .seg-active {
  background: rgba(168, 85, 247, 0.25);
  color: #f3e8ff;
}

.btn-verify {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  color: var(--accent-solid);
  font-weight: 600;
}

.badge-ok {
  background-color: rgba(34, 197, 94, 0.15);
  border-color: rgba(74, 222, 128, 0.4);
  color: #4ade80;
}

.badge-warn {
  background-color: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.45);
  color: #f59e0b;
}

/* ===== MODI ===== */
.verdict {
  padding: 0.9rem 1rem;
  border-radius: 8px;
  border: 1px solid #334155;
}

.verdict strong { display: block; font-size: 1rem; }
.verdict p { margin: 0.35rem 0 0; font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; }

.verdict-ok { background: rgba(34, 197, 94, 0.12); border-color: #22c55e; color: #4ade80; }
.verdict-warn { background: rgba(245, 158, 11, 0.12); border-color: #f59e0b; color: #fbbf24; }
.verdict-bad { background: rgba(239, 68, 68, 0.12); border-color: #ef4444; color: #f87171; }

.enter-cell {
  background: rgba(0, 242, 255, 0.18) !important;
  color: #00f2ff !important;
  font-weight: 700;
  border: 1px solid #00f2ff !important;
}

.modi-note { margin: 0.75rem 0 0; }

/* ===== OPTIMALIDAD EN EL RESUMEN ===== */
.opt-ok strong { color: #4ade80; }
.opt-warn strong { color: #f59e0b; }

.link-btn {
  margin-top: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>