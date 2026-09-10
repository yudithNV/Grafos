<template>
  <Transition name="fade">
    <div v-if="show" class="matrix-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="matrix-container" @mousedown.stop>

          <!-- HEADER -->
          <div class="matrix-header">
            <h3 class="matrix-title">
              {{ mode === 'solver' ? 'Resolver Algoritmo' : 'Matriz de Adyacencia (Asignación)' }}
            </h3>
            <button @click="close" class="btn-close">
              <X class="icon-close" />
            </button>
          </div>

          <!-- MODO SOLVER: pregunta MIN/MAX -->
          <div v-if="mode === 'solver'" class="selection-body">
            <h4 class="modal-title">¿Qué deseas hacer?</h4>
            <div class="modal-buttons">
              <button @click="choose('minimize')" class="btn-minimize">
                ⚡ Minimizar Costo
              </button>
              <button @click="choose('maximize')" class="btn-maximize">
                🔥 Maximizar Beneficio
              </button>
            </div>
            <button @click="close" class="btn-cancel">Cancelar</button>
          </div>

          <!-- MODO MATRIX: solo la tabla -->
          <template v-else>
            <div class="matrix-scroll">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th class="th-corner">De \ A</th>
                    <th v-for="destId in uniqueDestinations" :key="destId" class="th-node">
                      {{ getNodeLabel(destId) }}
                    </th>
                    <th class="th-sum">Σ Pesos</th>
                    <th class="th-count"># Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sourceId in uniqueSources" :key="sourceId">
                    <td class="td-node">{{ getNodeLabel(sourceId) }}</td>
                    <td
                      v-for="destId in uniqueDestinations"
                      :key="`${sourceId}-${destId}`"
                      class="td-cell"
                      :class="{ 'td-zero': getWeight(sourceId, destId) === 0 }"
                    >
                      {{ getWeight(sourceId, destId) === 0 ? '0' : getWeight(sourceId, destId) }}
                    </td>
                    <td class="td-sum">{{ getRowSum(sourceId) }}</td>
                    <td class="td-count">{{ getRowCount(sourceId) }}</td>
                  </tr>
                  <tr class="tr-sum">
                    <td class="td-node-sum">Σ Pesos</td>
                    <td v-for="destId in uniqueDestinations" :key="`sum-${destId}`" class="td-sum-col">
                      {{ getColSum(destId) }}
                    </td>
                    <td class="td-sum-total">{{ totalSum }}</td>
                    <td class="td-count-total">{{ totalCount }}</td>
                  </tr>
                  <tr class="tr-count">
                    <td class="td-node-count"># Cantidad</td>
                    <td v-for="destId in uniqueDestinations" :key="`count-${destId}`" class="td-count-col">
                      {{ getColCount(destId) }}
                    </td>
                    <td class="td-count-total">{{ totalCount }}</td>
                    <td class="td-count-total">{{ totalCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="matrix-footer">
              <div class="matrix-legend">
                <span class="legend-dot dot-sum">●</span> Suma de Pesos
                <span class="legend-dot dot-count">●</span> Cantidad de Conexiones
              </div>
              <button @click="close" class="btn-close-modal">Cerrar</button>
            </div>
          </template>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  show: Boolean,
  mode: { type: String, default: 'matrix' },
  nodes: { type: Array, required: true, default: () => [] },
  edges: { type: Array, required: true, default: () => [] }
})

const emit = defineEmits(['close', 'resolve'])

const uniqueSources = computed(() => {
  const sources = new Set()
  props.edges.forEach(edge => sources.add(edge.sourceId))
  return Array.from(sources).sort()
})

const uniqueDestinations = computed(() => {
  const dests = new Set()
  props.edges.forEach(edge => dests.add(edge.targetId))
  return Array.from(dests).sort()
})

const getWeight = (sourceId, destId) => {
  if (sourceId === destId) return 0
  const edge = props.edges.find(e => e.sourceId === sourceId && e.targetId === destId)
  return edge ? Number(edge.weight) || 0 : 0
}

const getNodeLabel = (nodeId) => {
  const node = props.nodes.find(n => n.id === nodeId)
  return node ? node.label : '?'
}

const getRowSum = (sourceId) => {
  let sum = 0
  uniqueDestinations.value.forEach(destId => sum += getWeight(sourceId, destId))
  return sum
}

const getRowCount = (sourceId) => {
  let count = 0
  uniqueDestinations.value.forEach(destId => {
    if (getWeight(sourceId, destId) !== 0) count += 1
  })
  return count
}

const getColSum = (destId) => {
  let sum = 0
  uniqueSources.value.forEach(sourceId => sum += getWeight(sourceId, destId))
  return sum
}

const getColCount = (destId) => {
  let count = 0
  uniqueSources.value.forEach(sourceId => {
    if (getWeight(sourceId, destId) !== 0) count += 1
  })
  return count
}

const totalSum = computed(() => {
  let sum = 0
  uniqueSources.value.forEach(sourceId => sum += getRowSum(sourceId))
  return sum
})

const totalCount = computed(() => props.edges.length)

const close = () => emit('close')
const choose = (m) => emit('resolve', m)
</script>

<style scoped>
.matrix-backdrop {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 0.5rem; background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
.matrix-container {
  background-color: #ffffff; border-radius: 1rem;
  width: 100%; max-width: 95vw; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;
}
@media (min-width: 640px) { .matrix-container { max-width: 90vw; } }
@media (min-width: 1024px) { .matrix-container { max-width: 80vw; } }

.matrix-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  flex-shrink: 0;
}
.matrix-title {
  font-size: 1rem; font-weight: 600; color: #ffffff;
  margin: 0; flex: 1;
}
@media (min-width: 640px) { .matrix-title { font-size: 1.1rem; } }

.btn-close {
  background: rgba(255, 255, 255, 0.2); border: none;
  border-radius: 0.5rem; color: #ffffff; cursor: pointer;
  padding: 0.25rem; display: flex; align-items: center;
  justify-content: center; transition: background 0.15s ease;
}
.btn-close:hover { background: rgba(255, 255, 255, 0.3); }
.icon-close { width: 1.25rem; height: 1.25rem; }

/* SOLVER */
.selection-body {
  padding: 2rem 1.5rem; text-align: center;
  display: flex; flex-direction: column;
  align-items: center; gap: 1rem;
}
.modal-title {
  font-size: 1.1rem; font-weight: 600;
  color: #1e293b; margin: 0 0 0.5rem;
}
.modal-buttons {
  display: flex; flex-direction: column;
  gap: 0.75rem; width: 100%; max-width: 300px;
}
.btn-minimize, .btn-maximize {
  padding: 0.8rem 1.5rem; border: none; border-radius: 0.5rem;
  color: #ffffff; font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-minimize { background-color: #3b82f6; }
.btn-minimize:hover { background-color: #2563eb; }
.btn-maximize { background-color: #10b981; }
.btn-maximize:hover { background-color: #059669; }
.btn-minimize:active, .btn-maximize:active { transform: scale(0.95); }
.btn-cancel {
  padding: 0.4rem 1rem; background-color: #f3f4f6;
  border: 1px solid #d1d5db; border-radius: 0.5rem;
  color: #6b7280; font-weight: 500; font-size: 0.8rem;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-cancel:hover { background-color: #e5e7eb; }

/* TABLA */
.matrix-scroll {
  overflow: auto; padding: 0.75rem; flex: 1;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 640px) { .matrix-scroll { padding: 1rem; } }

.matrix-table {
  width: 100%; border-collapse: collapse;
  font-size: 0.65rem; min-width: 250px;
}
@media (min-width: 640px) { .matrix-table { font-size: 0.8rem; } }

.th-corner, .th-node, .th-sum, .th-count {
  padding: 0.3rem 0.2rem; text-align: center; font-weight: 600;
  border: 1px solid #cbd5e1; background-color: #f1f5f9;
  color: #1e293b; white-space: nowrap;
}
@media (min-width: 640px) {
  .th-corner, .th-node, .th-sum, .th-count { padding: 0.5rem 0.6rem; }
}
.th-node { background-color: #eef2ff; color: #4f46e5; min-width: 30px; }
.th-sum { background-color: #fef3c7; color: #d97706; }
.th-count { background-color: #dbeafe; color: #2563eb; }

.td-node {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 600;
  border: 1px solid #cbd5e1; background-color: #f1f5f9;
  color: #1e293b; white-space: nowrap;
}
@media (min-width: 640px) { .td-node { padding: 0.4rem 0.5rem; } }

.td-cell {
  padding: 0.2rem 0.1rem; text-align: center; border: 1px solid #cbd5e1;
  background-color: #ffffff; color: #1e293b; font-weight: 500; min-width: 25px;
}
@media (min-width: 640px) { .td-cell { padding: 0.4rem 0.5rem; min-width: 40px; } }
.td-zero { color: #94a3b8; }

.td-sum {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #fef3c7; color: #d97706;
}
.td-count {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #dbeafe; color: #2563eb;
}
@media (min-width: 640px) {
  .td-sum, .td-count { padding: 0.4rem 0.5rem; }
}

.tr-sum, .tr-count { background-color: #f1f5f9; }

.td-node-sum {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 600;
  border: 1px solid #cbd5e1; background-color: #fef3c7;
  color: #d97706; white-space: nowrap;
}
.td-node-count {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 600;
  border: 1px solid #cbd5e1; background-color: #dbeafe;
  color: #2563eb; white-space: nowrap;
}
@media (min-width: 640px) {
  .td-node-sum, .td-node-count { padding: 0.4rem 0.5rem; }
}

.td-sum-col {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #fef3c7; color: #d97706;
}
.td-count-col {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #dbeafe; color: #2563eb;
}
@media (min-width: 640px) {
  .td-sum-col, .td-count-col { padding: 0.4rem 0.5rem; }
}

.td-sum-total {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #fde68a; color: #b45309;
}
.td-count-total {
  padding: 0.2rem 0.1rem; text-align: center; font-weight: 700;
  border: 1px solid #cbd5e1; background-color: #93c5fd; color: #1d4ed8;
}
@media (min-width: 640px) {
  .td-sum-total, .td-count-total { padding: 0.4rem 0.5rem; }
}

.matrix-footer {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0; background-color: #f8fafc; flex-shrink: 0;
}
@media (min-width: 640px) {
  .matrix-footer { flex-direction: row; justify-content: space-between; }
}

.matrix-legend {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 0.75rem; font-size: 0.6rem; color: #475569;
}
@media (min-width: 640px) {
  .matrix-legend { font-size: 0.7rem; gap: 1rem; }
}
.legend-dot { font-size: 0.6rem; }
.dot-sum { color: #d97706; }
.dot-count { color: #2563eb; }

.btn-close-modal {
  padding: 0.4rem 1.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  border: none; border-radius: 0.5rem; color: #ffffff;
  font-weight: 600; font-size: 0.8rem; cursor: pointer;
  transition: all 0.15s ease; min-height: 2.5rem; width: 100%;
}
@media (min-width: 640px) {
  .btn-close-modal { padding: 0.5rem 2rem; width: auto; min-height: auto; }
}
.btn-close-modal:active { transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active, .scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.scale-enter-from, .scale-leave-to { transform: scale(0.92); opacity: 0; }
</style>