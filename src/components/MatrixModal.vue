<template>
  <Transition name="fade">
    <div v-if="show" class="matrix-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="matrix-container" @mousedown.stop>
          <div class="matrix-header">
            <h3 class="matrix-title">Matriz de Adyacencia</h3>
            <button @click="close" class="btn-close">
              <X class="icon-close" />
            </button>
          </div>

          <div class="matrix-scroll">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="th-corner">De \ A</th>
                  <th v-for="node in nodes" :key="node.id" class="th-node">
                    {{ node.label }}
                  </th>
                  <th class="th-sum">Salida</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in matrixData" :key="rowIndex">
                  <td class="td-node">{{ nodes[rowIndex].label }}</td>
                  <td 
                    v-for="(cell, colIndex) in row" 
                    :key="colIndex"
                    class="td-cell"
                    :class="{ 'td-zero': cell === 0 }"
                  >
                    {{ cell }}
                  </td>
                  <td class="td-sum">{{ rowSums[rowIndex] }}</td>
                </tr>
                <tr class="tr-sum">
                  <td class="td-node-sum">Entrada</td>
                  <td 
                    v-for="(colSum, colIndex) in colSums" 
                    :key="colIndex"
                    class="td-sum-col"
                  >
                    {{ colSum }}
                  </td>
                  <td class="td-sum-total">{{ totalSum }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="matrix-footer">
            <div class="matrix-legend">
              <span class="legend-dot dot-out">●</span> Grado de Salida (fila)
              <span class="legend-dot dot-in">●</span> Grado de Entrada (columna)
            </div>
            <button @click="close" class="btn-close-modal">Cerrar</button>
          </div>
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
  nodes: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close'])

// Construir matriz de adyacencia
const matrixData = computed(() => {
  const n = props.nodes.length
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0))

  props.edges.forEach(edge => {
    const sourceIdx = props.nodes.findIndex(n => n.id === edge.sourceId)
    const targetIdx = props.nodes.findIndex(n => n.id === edge.targetId)
    if (sourceIdx !== -1 && targetIdx !== -1) {
      matrix[sourceIdx][targetIdx] = edge.weight
    }
  })

  return matrix
})

// Sumas por fila (grado de salida)
const rowSums = computed(() => {
  return matrixData.value.map(row => 
    row.reduce((sum, val) => sum + val, 0)
  )
})

// Sumas por columna (grado de entrada)
const colSums = computed(() => {
  const n = props.nodes.length
  const sums = Array(n).fill(0)
  matrixData.value.forEach(row => {
    row.forEach((val, colIdx) => {
      sums[colIdx] += val
    })
  })
  return sums
})

// Suma total
const totalSum = computed(() => {
  return rowSums.value.reduce((sum, val) => sum + val, 0)
})

const close = () => {
  emit('close')
}
</script>

<style scoped>
.matrix-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.matrix-container {
  background-color: #ffffff;
  border-radius: 1rem;
  width: 100%;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

@media (min-width: 640px) {
  .matrix-container {
    max-width: 90vw;
    max-height: 85vh;
  }
}

@media (min-width: 1024px) {
  .matrix-container {
    max-width: 80vw;
    max-height: 80vh;
  }
}

.matrix-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  flex-shrink: 0;
}

.matrix-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

@media (min-width: 640px) {
  .matrix-title {
    font-size: 1.25rem;
  }
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.5rem;
  color: #ffffff;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-close:active {
  transform: scale(0.9);
}

.icon-close {
  width: 1.25rem;
  height: 1.25rem;
}

.matrix-scroll {
  overflow: auto;
  padding: 0.75rem;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 640px) {
  .matrix-scroll {
    padding: 1rem;
  }
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  min-width: 200px;
}

@media (min-width: 640px) {
  .matrix-table {
    font-size: 0.85rem;
  }
}

.th-corner,
.th-node,
.th-sum {
  padding: 0.4rem 0.3rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .th-corner,
  .th-node,
  .th-sum {
    padding: 0.5rem 0.6rem;
  }
}

.th-node {
  background-color: #eef2ff;
  color: #4f46e5;
  min-width: 30px;
}

@media (min-width: 640px) {
  .th-node {
    min-width: 40px;
  }
}

.th-sum {
  background-color: #fef3c7;
  color: #d97706;
}

.td-node {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .td-node {
    padding: 0.4rem 0.5rem;
  }
}

.td-cell {
  padding: 0.3rem 0.2rem;
  text-align: center;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  font-weight: 500;
  min-width: 25px;
}

@media (min-width: 640px) {
  .td-cell {
    padding: 0.4rem 0.5rem;
    min-width: 35px;
  }
}

.td-zero {
  color: #94a3b8;
}

.td-sum {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  background-color: #fef3c7;
  color: #d97706;
}

@media (min-width: 640px) {
  .td-sum {
    padding: 0.4rem 0.5rem;
  }
}

.tr-sum {
  background-color: #f1f5f9;
}

.td-node-sum {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background-color: #fef3c7;
  color: #d97706;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .td-node-sum {
    padding: 0.4rem 0.5rem;
  }
}

.td-sum-col {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  background-color: #fef3c7;
  color: #d97706;
}

@media (min-width: 640px) {
  .td-sum-col {
    padding: 0.4rem 0.5rem;
  }
}

.td-sum-total {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  background-color: #fde68a;
  color: #b45309;
}

@media (min-width: 640px) {
  .td-sum-total {
    padding: 0.4rem 0.5rem;
  }
}

.matrix-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .matrix-footer {
    flex-direction: row;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
  }
}

.matrix-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.65rem;
  color: #475569;
}

@media (min-width: 640px) {
  .matrix-legend {
    font-size: 0.75rem;
    gap: 1rem;
  }
}

.legend-dot {
  font-size: 0.6rem;
}

@media (min-width: 640px) {
  .legend-dot {
    font-size: 0.7rem;
  }
}

.dot-out {
  color: #d97706;
}

.dot-in {
  color: #4f46e5;
}

.btn-close-modal {
  padding: 0.4rem 1.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  border: none;
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 2.5rem;
  width: 100%;
}

@media (min-width: 640px) {
  .btn-close-modal {
    padding: 0.5rem 2rem;
    width: auto;
    min-height: auto;
  }
}

.btn-close-modal:active {
  transform: scale(0.95);
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.92);
  opacity: 0;
}
</style>