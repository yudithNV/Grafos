<template>
  <Transition name="fade">
    <div v-if="show" class="matrix-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="matrix-container" @mousedown.stop>
          <div class="matrix-header">
            <h3 class="matrix-title">Algoritmo de Asignación</h3>
            <button @click="close" class="btn-close">
              <X class="icon-close" />
            </button>
          </div>

          <div class="matrix-scroll">
            <!-- VISTA: Minimización -->
            <Minimizacion 
              v-if="objective === 'min'" 
              :matrix="matrixData" 
              :labels="nodeLabels" 
            />

            <!-- VISTA: Maximización -->
            <Maximizacion 
              v-else-if="objective === 'max'" 
              :matrix="matrixData" 
              :labels="nodeLabels" 
            />
          </div>

          <div class="matrix-footer">
            <div class="optimization-control">
              <span class="opt-label">Objetivo:</span>
              <div class="opt-buttons">
                <button 
                  class="btn-opt btn-min" 
                  :class="{ active: objective === 'min' }" 
                  @click="objective = 'min'"
                >
                  Minimizar
                </button>
                <button 
                  class="btn-opt btn-max" 
                  :class="{ active: objective === 'max' }" 
                  @click="objective = 'max'"
                >
                  Maximizar
                </button>
              </div>
            </div>

            <button @click="close" class="btn-close-modal">Cerrar</button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, X } from '@lucide/vue' // O '@lucide/vue' según tu paquete

// --- Refs de Lienzo e Interacción ---
const canvasContainerRef = ref(null)
const svgRef = ref(null)
const panOffset = ref({ x: 0, y: 0 })

const selectedNodeId = ref(null)
const draggedNodeId = ref(null)
const hoveredNodeId = ref(null)
const hoveredEdgeId = ref(null)
const activeTool = ref('select')

// --- Modales y Selectores ---
const sourceNode = ref(null)
const targetNode = ref(null)
const isMatrixOpen = ref(false)
const objective = ref('minimize')

// --- Estado de Nodos y Aristas ---
const nodes = ref([
  { id: 1, label: 'Nodo A', x: 150, y: 150 },
  { id: 2, label: 'Nodo B', x: 350, y: 150 },
  { id: 3, label: 'Nodo C', x: 150, y: 300 },
  { id: 4, label: 'Nodo D', x: 350, y: 300 }
])

const edges = ref([
  { id: 1, sourceId: 1, targetId: 2, weight: 10 },
  { id: 2, sourceId: 1, targetId: 3, weight: 15 },
  { id: 3, sourceId: 2, targetId: 4, weight: 20 },
  { id: 4, sourceId: 3, targetId: 4, weight: 5 }
])

// --- Reactividad de Algoritmo de Asignación ---
const labels = computed(() => nodes.value.map(n => n.label))

// Matriz base de pesos
const rawMatrix = computed(() => {
  const n = nodes.value.length
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0))
  edges.value.forEach(e => {
    const sIdx = nodes.value.findIndex(node => node.id === e.sourceId)
    const tIdx = nodes.value.findIndex(node => node.id === e.targetId)
    if (sIdx !== -1 && tIdx !== -1) {
      matrix[sIdx][tIdx] = Number(e.weight) || 0
    }
  })
  return matrix
})

// Ajuste para Maximización / Minimización
const convertedMatrix = computed(() => {
  if (objective.value === 'minimize') return rawMatrix.value
  let maxVal = 0
  rawMatrix.value.forEach(row => row.forEach(val => { if (val > maxVal) maxVal = val }))
  return rawMatrix.value.map(row => row.map(val => maxVal - val))
})

// Paso 1: Alfa (α)
const alpha = computed(() => {
  return convertedMatrix.value.map(row => Math.min(...row))
})

const rowReducedMatrix = computed(() => {
  return convertedMatrix.value.map((row, i) => row.map(val => val - alpha.value[i]))
})

// Paso 2: Beta (β)
const beta = computed(() => {
  if (!rowReducedMatrix.value.length) return []
  const cols = rowReducedMatrix.value[0].length
  const betaArr = []
  for (let j = 0; j < cols; j++) {
    const colValues = rowReducedMatrix.value.map(row => row[j])
    betaArr.push(Math.min(...colValues))
  }
  return betaArr
})

// Matriz Reducida Final
const finalMatrix = computed(() => {
  return rowReducedMatrix.value.map(row => row.map((val, j) => val - beta.value[j]))
})

// Aristas procesadas para el SVG
const processedEdges = computed(() => {
  return edges.value.map(e => {
    const source = nodes.value.find(n => n.id === e.sourceId)
    const target = nodes.value.find(n => n.id === e.targetId)
    if (!source || !target) return null

    return {
      ...e,
      path: `M ${source.x} ${source.y} L ${target.x} ${target.y}`,
      labelX: (source.x + target.x) / 2,
      labelY: (source.y + target.y) / 2,
      rectW: String(e.weight).length * 10 + 16,
      color: '#6366f1',
      markerId: 'arrow-blue'
    }
  }).filter(Boolean)
})

// --- Métodos Auxiliares ---
const truncateLabel = (label) => label ? (label.length > 5 ? label.substring(0, 4) + '…' : label) : ''
const getFooterTip = () => 'Arrastra los nodos en el lienzo para ajustar la topología del grafo.'

const getWeight = (sId, tId) => {
  const edge = edges.value.find(e => e.sourceId === sId && e.targetId === tId)
  return edge ? edge.weight : 0
}

const getRowWeightSum = (sId) => edges.value.filter(e => e.sourceId === sId).reduce((sum, e) => sum + Number(e.weight), 0)
const getRowEdgeCount = (sId) => edges.value.filter(e => e.sourceId === sId).length
const getColWeightSum = (tId) => edges.value.filter(e => e.targetId === tId).reduce((sum, e) => sum + Number(e.weight), 0)
const getColEdgeCount = (tId) => edges.value.filter(e => e.targetId === tId).length
const getTotalWeight = () => edges.value.reduce((sum, e) => sum + Number(e.weight), 0)
const getTotalCount = () => edges.value.length

const handleObjectiveChange = (val) => { objective.value = val }

// Handlers del Lienzo (Previenen errores en el evento SVG)
const onCanvasMouseDown = (e) => {}
const onCanvasTouchStart = (e) => {}
const onMouseMove = (e) => {}
const onTouchMove = (e) => {}
const onMouseUp = () => {}
const onTouchEnd = () => {}
const onEdgeMouseDown = (edge, e) => {}
const onEdgeTouchStart = (edge, e) => {}
const onNodeMouseDown = (node, e) => { selectedNodeId.value = node.id }
const onNodeTouchStart = (node, e) => { selectedNodeId.value = node.id }
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
    max-width: 80vw;
    max-height: 85vh;
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
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
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

.icon-close {
  width: 1.25rem;
  height: 1.25rem;
}

.matrix-scroll {
  overflow: auto;
  padding: 1rem;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.matrix-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
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

.optimization-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.opt-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.opt-buttons {
  display: flex;
  background-color: #e2e8f0;
  padding: 2px;
  border-radius: 0.5rem;
}

.btn-opt {
  padding: 0.35rem 0.85rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  background: transparent;
  transition: all 0.15s ease;
}

.btn-min.active {
  background-color: #3b82f6;
  color: #ffffff;
}

.btn-max.active {
  background-color: #10b981;
  color: #ffffff;
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
.canvas-container { width: 100%; height: 60vh; background-color: #0f172a; position: relative; overflow: hidden; }
.svg-canvas { width: 100%; height: 100%; cursor: crosshair; }

.node-circle { fill: #38bdf8; stroke: #0284c7; stroke-width: 3px; cursor: pointer; }
.node-text { fill: #ffffff; font-size: 12px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
.edge-path { stroke-linecap: round; }
.edge-rect { fill: #1e293b; opacity: 0.9; }
.edge-text { font-size: 11px; font-weight: 600; text-anchor: middle; }

.canvas-footer { display: flex; justify-content: space-between; padding: 0.5rem 1rem; background-color: #1e293b; color: #94a3b8; font-size: 0.8rem; }
.footer-tips { display: flex; align-items: center; gap: 0.4rem; }
.footer-info-icon { width: 1rem; height: 1rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-card { background: #ffffff; border-radius: 0.75rem; width: 90%; max-width: 700px; padding: 1rem; color: #1e293b; }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }

.assignment-container { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: #1e293b; color: #f8fafc; border-radius: 0.5rem; margin-top: 1rem; }
.step-card { background: #334155; padding: 0.75rem; border-radius: 0.375rem; }
.step-title { font-weight: 700; font-size: 0.85rem; color: #38bdf8; display: block; margin-bottom: 0.5rem; }
.vector-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.vector-item { background: #0f172a; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; border: 1px solid #475569; }

.matrix-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 0.8rem; }
.matrix-table th, .matrix-table td { border: 1px solid #475569; padding: 0.4rem; }
.zero-cell { background-color: #059669; color: #ffffff; font-weight: bold; }

/* Transiciones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active, .scale-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.scale-enter-from, .scale-leave-to { transform: scale(0.92); opacity: 0; }
</style>