<template>
  <Transition name="fade">
    <div v-if="show" class="matrix-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div
          class="matrix-container"
          :class="{ 'container-solver': mode === 'solver' }"
          @mousedown.stop
        >

          <!-- HEADER -->
          <div class="matrix-header">
            <div class="header-left">
              <component :is="mode === 'solver' ? Sparkles : Grid3x3" class="header-icon" />
              <h3 class="matrix-title">
                {{ mode === 'solver' ? 'Resolver Algoritmo' : 'Matriz de Adyacencia (Balanceada)' }}
              </h3>
            </div>
            <button @click="close" class="btn-close">
              <X class="icon-close" />
            </button>
          </div>

          <!-- MODO SOLVER: pregunta MIN/MAX -->
          <div v-if="mode === 'solver'" class="selection-body">
            <h4 class="modal-title">¿Qué deseas hacer?</h4>
            <p class="modal-subtitle">Elige el tipo de optimización para el algoritmo de asignación</p>

            <div class="modal-buttons">
              <button @click="choose('minimize')" class="btn-choice btn-minimize">
                <TrendingDown class="btn-choice-icon" />
                <div class="btn-choice-text">
                  <span class="btn-choice-title">Minimizar Costos</span>
                  <span class="btn-choice-desc">Encuentra la asignación más económica</span>
                </div>
              </button>

              <button @click="choose('maximize')" class="btn-choice btn-maximize">
                <TrendingUp class="btn-choice-icon" />
                <div class="btn-choice-text">
                  <span class="btn-choice-title">Maximizar Beneficios</span>
                  <span class="btn-choice-desc">Encuentra la asignación más rentable</span>
                </div>
              </button>
            </div>
          </div>

          <!-- MODO MATRIX: solo la tabla -->
          <template v-else>
            <div class="matrix-scroll">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th class="th-corner">
                      <ArrowRightLeft class="th-icon" />
                      De \ A
                    </th>
                    <th v-for="col in matrixHeaders.cols" :key="col.id" class="th-node">
                      {{ col.label }}
                    </th>
                    <th class="th-sum">
                      <Sigma class="th-icon" />
                      Σ Pesos
                    </th>
                    <th class="th-count">
                      <Hash class="th-icon" />
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in matrixHeaders.rows" :key="row.id">
                    <td class="td-node">{{ row.label }}</td>
                    <td
                      v-for="col in matrixHeaders.cols"
                      :key="`${row.id}-${col.id}`"
                      class="td-cell"
                      :class="{ 
                        'td-zero': getWeight(row, col) === 0,
                        'td-dummy': row.isDummy || col.isDummy 
                      }"
                    >
                      {{ getWeight(row, col) }}
                    </td>
                    <td class="td-sum">{{ getRowSum(row) }}</td>
                    <td class="td-count">{{ getRowCount(row) }}</td>
                  </tr>
                  <tr class="tr-sum">
                    <td class="td-node-sum">
                      <Sigma class="td-icon" />
                      Σ Pesos
                    </td>
                    <td v-for="col in matrixHeaders.cols" :key="`sum-${col.id}`" class="td-sum-col">
                      {{ getColSum(col) }}
                    </td>
                    <td class="td-sum-total">{{ totalSum }}</td>
                    <td class="td-count-total">{{ totalCount }}</td>
                  </tr>
                  <tr class="tr-count">
                    <td class="td-node-count">
                      <Hash class="td-icon" />
                      Cantidad
                    </td>
                    <td v-for="col in matrixHeaders.cols" :key="`count-${col.id}`" class="td-count-col">
                      {{ getColCount(col) }}
                    </td>
                    <td class="td-count-total">{{ totalCount }}</td>
                    <td class="td-count-total">{{ totalCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="matrix-footer">
              <div class="matrix-legend">
                <span class="legend-item">
                  <span class="legend-dot dot-sum"></span>
                  Suma de Pesos
                </span>
                <span class="legend-item">
                  <span class="legend-dot dot-count"></span>
                  Cantidad de Conexiones
                </span>
              </div>
              <button @click="close" class="btn-close-modal">
                <X class="btn-icon-sm" />
                Cerrar
              </button>
            </div>
          </template>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import {
  X,
  Grid3x3,
  Sparkles,
  Sigma,
  Hash,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown
} from '@lucide/vue'

const props = defineProps({
  show: Boolean,
  mode: { type: String, default: 'matrix' },
  nodes: { type: Array, required: true, default: () => [] },
  edges: { type: Array, required: true, default: () => [] }
})

const emit = defineEmits(['close', 'resolve'])

// Calcula filas y columnas incluyendo ficticias para balancear a N x N
const matrixHeaders = computed(() => {
  const sourceIds = [...new Set(props.edges.map(e => e.sourceId))]
  const targetIds = [...new Set(props.edges.map(e => e.targetId))]

  const sourceNodes = props.nodes.filter(n => sourceIds.includes(n.id))
  const targetNodes = props.nodes.filter(n => targetIds.includes(n.id))

  const numRows = sourceNodes.length
  const numCols = targetNodes.length
  const N = Math.max(numRows, numCols)

  // Construir filas
  const rows = sourceNodes.map(n => ({ id: n.id, label: n.label, isDummy: false }))
  for (let i = numRows + 1; i <= N; i++) {
    rows.push({ id: `dummy-row-${i}`, label: `Ficticio ${i - numRows}`, isDummy: true })
  }

  // Construir columnas
  const cols = targetNodes.map(n => ({ id: n.id, label: n.label, isDummy: false }))
  for (let j = numCols + 1; j <= N; j++) {
    cols.push({ id: `dummy-col-${j}`, label: `Ficticio ${j - numCols}`, isDummy: true })
  }

  return { rows, cols }
})

const getWeight = (row, col) => {
  if (row.isDummy || col.isDummy) return 0
  if (row.id === col.id) return 0
  const edge = props.edges.find(e => e.sourceId === row.id && e.targetId === col.id)
  return edge ? Number(edge.weight) || 0 : 0
}

const getRowSum = (row) => {
  let sum = 0
  matrixHeaders.value.cols.forEach(col => sum += getWeight(row, col))
  return sum
}

const getRowCount = (row) => {
  let count = 0
  matrixHeaders.value.cols.forEach(col => {
    if (getWeight(row, col) !== 0) count += 1
  })
  return count
}

const getColSum = (col) => {
  let sum = 0
  matrixHeaders.value.rows.forEach(row => sum += getWeight(row, col))
  return sum
}

const getColCount = (col) => {
  let count = 0
  matrixHeaders.value.rows.forEach(row => {
    if (getWeight(row, col) !== 0) count += 1
  })
  return count
}

const totalSum = computed(() => {
  let sum = 0
  matrixHeaders.value.rows.forEach(row => sum += getRowSum(row))
  return sum
})

const totalCount = computed(() => props.edges.length)

const close = () => emit('close')
const choose = (m) => emit('resolve', m)
</script>

<style scoped>
/* ===== BACKDROP ===== */
.matrix-backdrop {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 0.5rem;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
}

/* ===== CONTENEDOR ===== */
.matrix-container {
  background-color: var(--bg-surface, #ffffff);
  color: var(--text-primary, #1e293b);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 1rem;
  width: 100%;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.matrix-container.container-solver {
  max-width: 24rem;
}

@media (min-width: 640px) { .matrix-container { max-width: 90vw; } }
@media (min-width: 1024px) { .matrix-container { max-width: 80vw; } }

/* ===== HEADER ===== */
.matrix-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  flex-shrink: 0;
}
.header-left {
  display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0;
}
.header-icon {
  width: 1.25rem; height: 1.25rem; color: #ffffff;
  flex-shrink: 0;
}
.matrix-title {
  font-size: 1rem; font-weight: 600; color: #ffffff;
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (min-width: 640px) { .matrix-title { font-size: 1.1rem; } }

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none; border-radius: 0.5rem; color: #ffffff;
  cursor: pointer; padding: 0.3rem;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s ease;
  flex-shrink: 0;
}
.btn-close:hover { background: rgba(255, 255, 255, 0.35); }
.icon-close { width: 1.15rem; height: 1.15rem; }

/* ===== MODO SOLVER ===== */
.selection-body {
  padding: 1.5rem 1.25rem;
  text-align: center;
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
}
.modal-title {
  font-size: 1.1rem; font-weight: 700;
  color: var(--text-primary, #1e293b);
  margin: 0;
}
.modal-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}
.modal-buttons {
  display: flex; flex-direction: column;
  gap: 0.6rem; width: 100%;
}
.btn-choice {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.65rem;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}
.btn-choice:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
.btn-choice:active { transform: scale(0.98); }

.btn-choice-icon { width: 1.5rem; height: 1.5rem; flex-shrink: 0; }
.btn-choice-text { display: flex; flex-direction: column; gap: 0.1rem; }
.btn-choice-title { font-size: 0.9rem; font-weight: 700; }
.btn-choice-desc { font-size: 0.7rem; font-weight: 400; opacity: 0.9; }

.btn-minimize { background-color: #3b82f6; }
.btn-minimize:hover { background-color: #2563eb; }

.btn-maximize { background-color: #10b981; }
.btn-maximize:hover { background-color: #059669; }

/* ===== TABLA ===== */
.matrix-scroll {
  overflow: auto; padding: 0.75rem; flex: 1;
  -webkit-overflow-scrolling: touch;
  background-color: var(--bg-surface, #ffffff);
}
@media (min-width: 640px) { .matrix-scroll { padding: 1rem; } }

.matrix-table {
  width: 100%; border-collapse: collapse;
  font-size: 0.65rem; min-width: 250px;
  color: var(--text-primary, #1e293b);
}
@media (min-width: 640px) { .matrix-table { font-size: 0.8rem; } }

.th-corner, .th-node, .th-sum, .th-count {
  padding: 0.35rem 0.3rem; text-align: center; font-weight: 600;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: var(--bg-surface-2, #f1f5f9);
  color: var(--text-primary, #1e293b);
  white-space: nowrap;
}
@media (min-width: 640px) {
  .th-corner, .th-node, .th-sum, .th-count { padding: 0.55rem 0.6rem; }
}

.th-icon {
  width: 0.75rem; height: 0.75rem;
  display: inline-block; vertical-align: -2px; margin-right: 0.2rem;
}

.th-corner { background-color: var(--bg-surface-2, #f1f5f9); }
.th-node {
  background-color: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}
.th-sum {
  background-color: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
.th-count {
  background-color: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

.td-node {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 600;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: var(--bg-surface-2, #f1f5f9);
  color: var(--text-primary, #1e293b);
  white-space: nowrap;
}
@media (min-width: 640px) { .td-node { padding: 0.4rem 0.5rem; } }

.td-cell {
  padding: 0.3rem 0.2rem; text-align: center;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: var(--bg-surface, #ffffff);
  color: var(--text-primary, #1e293b);
  font-weight: 500; min-width: 25px;
}
@media (min-width: 640px) { .td-cell { padding: 0.4rem 0.5rem; min-width: 40px; } }
.td-zero { color: var(--text-secondary, #94a3b8); opacity: 0.6; }
.td-dummy { opacity: 0.75; font-style: italic; }

.td-sum {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
.td-count {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}
@media (min-width: 640px) {
  .td-sum, .td-count { padding: 0.4rem 0.5rem; }
}

.tr-sum, .tr-count { background-color: var(--bg-surface-2, #f1f5f9); }

.td-node-sum, .td-node-count {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 600;
  border: 1px solid var(--border-color, #cbd5e1);
  white-space: nowrap;
}
.td-node-sum {
  background-color: rgba(217, 119, 6, 0.2);
  color: #d97706;
}
.td-node-count {
  background-color: rgba(37, 99, 235, 0.2);
  color: #2563eb;
}
@media (min-width: 640px) {
  .td-node-sum, .td-node-count { padding: 0.4rem 0.5rem; }
}

.td-icon {
  width: 0.7rem; height: 0.7rem;
  display: inline-block; vertical-align: -2px; margin-right: 0.2rem;
}

.td-sum-col {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
.td-count-col {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}
@media (min-width: 640px) {
  .td-sum-col, .td-count-col { padding: 0.4rem 0.5rem; }
}

.td-sum-total {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(217, 119, 6, 0.3);
  color: #b45309;
}
.td-count-total {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 700;
  border: 1px solid var(--border-color, #cbd5e1);
  background-color: rgba(37, 99, 235, 0.3);
  color: #1d4ed8;
}
@media (min-width: 640px) {
  .td-sum-total, .td-count-total { padding: 0.4rem 0.5rem; }
}

/* ===== FOOTER ===== */
.matrix-footer {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-surface-2, #f8fafc);
  flex-shrink: 0;
}
@media (min-width: 640px) {
  .matrix-footer { flex-direction: row; justify-content: space-between; }
}

.matrix-legend {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 0.75rem; font-size: 0.6rem;
  color: var(--text-secondary, #475569);
}
@media (min-width: 640px) {
  .matrix-legend { font-size: 0.7rem; gap: 1rem; }
}
.legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
.legend-dot {
  width: 0.6rem; height: 0.6rem; border-radius: 50%;
  display: inline-block;
}
.dot-sum { background-color: #d97706; box-shadow: 0 0 6px rgba(217, 119, 6, 0.6); }
.dot-count { background-color: #2563eb; box-shadow: 0 0 6px rgba(37, 99, 235, 0.6); }

.btn-close-modal {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  border: none; border-radius: 0.5rem; color: #ffffff;
  font-weight: 600; font-size: 0.8rem; cursor: pointer;
  transition: all 0.15s ease; min-height: 2.5rem; width: 100%;
}
@media (min-width: 640px) {
  .btn-close-modal { padding: 0.5rem 2rem; width: auto; min-height: auto; }
}
.btn-close-modal:hover { filter: brightness(1.1); }
.btn-close-modal:active { transform: scale(0.95); }
.btn-icon-sm { width: 0.9rem; height: 0.9rem; }

/* ===== TRANSICIONES ===== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active, .scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.scale-enter-from, .scale-leave-to { transform: scale(0.92); opacity: 0; }
</style>