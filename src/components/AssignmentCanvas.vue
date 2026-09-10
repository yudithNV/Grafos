<template>
  <div class="canvas-workspace">
    
    <!-- Barra de Herramientas Superior -->
    <div class="canvas-header">
      <div class="header-left">
        <button @click="$emit('back')" class="btn-icon-only" title="Volver a Inicio">
          <ArrowLeft class="icon" />
        </button>
        <div class="header-info">
          <h2 class="header-title">
            Lienzo de Grafo
            <span class="status-indicator"></span>
          </h2>
          <p class="header-subtitle">
            {{ getModeDescription() }}
          </p>
        </div>
      </div>

      <div class="stats-container">
        <div class="stat-badge">
          Nodos: <strong class="stat-number">{{ nodes.length }}</strong>
        </div>
        <div class="stat-badge">
          Aristas: <strong class="stat-number">{{ edges.length }}</strong>
        </div>
        <div v-if="optimalEdgeIds && optimalEdgeIds.length > 0" class="stat-badge stat-badge-optimal">
          Asignados: <strong class="stat-number">{{ optimalEdgeIds.length }}</strong>
          <button @click="$emit('clear-optimal')" class="btn-clear-opt" title="Quitar solución">✕</button>
        </div>
      </div>

      <div class="header-actions">
        <button @click="$emit('save')" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="showMatrixModal = true" class="btn-text btn-matrix">
          <Grid3x3 class="btn-icon" />
          <span>Matriz</span>
        </button>
        <button @click="openSolverChoiceModal" class="btn-text btn-resolver">
          <Sparkles class="btn-icon" />
          <span>➕ Resolver</span>
        </button>
        <button @click="$emit('show-instructions')" class="btn-text">
          <BookOpen class="btn-icon" />
          <span>Manual</span>
        </button>
        <button @click="confirmClear" class="btn-text btn-danger">
          <Trash2 class="btn-icon" />
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Panel Lateral Izquierdo -->
    <div class="side-panel">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-btn"
        :class="{ 'tool-active': activeTool === tool.id }"
        @click="setActiveTool(tool.id)"
        :title="tool.description"
      >
        <component :is="tool.icon" class="tool-icon" />
        <span class="tool-label">{{ tool.label }}</span>
      </button>
    </div>

    <!-- Indicador de Lienzo Vacío -->
    <div v-if="nodes.length === 0 && activeTool !== 'delete'" class="empty-indicator">
      <div class="empty-icon-wrapper">
        <MousePointerClick class="empty-icon" />
      </div>
      <h3 class="empty-title">Lienzo Vacío</h3>
      <p class="empty-desc">
        Selecciona <strong>Nodo</strong> en el panel izquierdo y toca el lienzo para crear uno.
      </p>
    </div>

    <!-- Mensajes de Ayuda -->
    <div v-if="activeTool === 'connect' && selectedNodeId" class="connection-tip">
      <span class="pulse-dot"></span>
      <span>Nodo origen seleccionado. Toca un nodo destino para conectar o el fondo para cancelar.</span>
    </div>

    <div v-if="activeTool === 'delete'" class="connection-tip delete-tip">
      <span class="pulse-dot"></span>
      <span>Modo Eliminar: Toca un nodo o arista para eliminarlo (confirmación requerida).</span>
    </div>

    <div v-if="activeTool === 'edit'" class="connection-tip edit-tip">
      <span class="pulse-dot"></span>
      <span>Modo Editar: Toca un nodo o arista para editar sus propiedades.</span>
    </div>

    <!-- Contenedor del Lienzo SVG -->
    <div
      class="canvas-container"
      ref="canvasContainerRef"
      @mousedown="onCanvasMouseDown"
      @touchstart="onCanvasTouchStart"
    >
      <svg
        ref="svgRef"
        class="svg-canvas"
        @mousemove="onMouseMove"
        @touchmove="onTouchMove"
        @mouseup="onMouseUp"
        @touchend="onTouchEnd"
      >
        <g :transform="`translate(${panOffset.x}, ${panOffset.y})`">
          <defs>
            <marker id="arrow-assignment-slate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <marker id="arrow-assignment-hover" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#6366f1" />
            </marker>
            <marker id="arrow-assignment-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#00f2ff" />
            </marker>
          </defs>

          <g v-for="edge in processedEdges" :key="edge.id" class="edge-group">
            <path
              :d="edge.path"
              fill="none"
              :stroke="edge.isOptimal ? '#00f2ff' : edge.color"
              :stroke-width="edge.isOptimal ? 4 : 2.5"
              class="edge-path"
              :class="{ 
                'edge-highlight': hoveredEdgeId === edge.id,
                'edge-optimal-flow': edge.isOptimal
              }"
              :marker-end="`url(#${edge.isOptimal ? 'arrow-assignment-cyan' : edge.markerId})`"
              @mousedown.stop="onEdgeMouseDown(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouchStart(edge, $event)"
              @mouseenter="hoveredEdgeId = edge.id"
              @mouseleave="hoveredEdgeId = null"
            />
            <path
              :d="edge.path"
              fill="none"
              stroke="transparent"
              stroke-width="40"
              class="edge-touch-area"
              @mousedown.stop="onEdgeMouseDown(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouchStart(edge, $event)"
            />
            <g
              :transform="`translate(${edge.labelX}, ${edge.labelY})`"
              class="edge-label-group"
              @mousedown.stop="onEdgeMouseDown(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouchStart(edge, $event)"
            >
              <rect
                :x="-edge.rectW / 2"
                :y="-12"
                :width="edge.rectW"
                :height="24"
                rx="6"
                class="edge-rect"
                :class="{ 'edge-rect-optimal': edge.isOptimal }"
              />
              <text 
                y="4" 
                class="edge-text"
                :class="{ 'edge-text-optimal': edge.isOptimal }"
              >
                {{ edge.weight }}
              </text>
            </g>
          </g>

          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node-group"
            :class="{
              'node-active': selectedNodeId === node.id,
              'node-hover': hoveredNodeId === node.id,
              'node-dragging': draggedNodeId === node.id,
              'node-delete-mode': activeTool === 'delete'
            }"
            @mousedown.stop="onNodeMouseDown(node, $event)"
            @touchstart.stop.prevent="onNodeTouchStart(node, $event)"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
          >
            <circle 
              r="28" 
              class="node-circle" 
              :class="{ 'node-circle-optimal': isNodeInOptimal(node.id) }"
            />
            <text class="node-text" y="1" dominant-baseline="middle">
              {{ truncateLabel(node.label) }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- ✅ MODAL DE MATRIZ (esto faltaba) -->
    <!-- Modal Matriz (solo tabla) -->
<AssignmentMatrix
  :show="showMatrixModal"
  mode="matrix"
  :nodes="nodes"
  :edges="edges"
  @close="showMatrixModal = false"
/>

<!-- Modal Resolver (pregunta MIN/MAX) -->
<AssignmentMatrix
  :show="showSolverChoiceModal"
  mode="solver"
  :nodes="nodes"
  :edges="edges"
  @close="showSolverChoiceModal = false"
  @resolve="handleSolverChoice"
/>

    <!-- Modal de Advertencia -->
    <AssignmentWarning
      :show="showWarningModal"
      :title="warningTitle"
      :message="warningMessage"
      :sub-message="warningSubMessage"
      @close="showWarningModal = false"
    />

    <!-- Modal de Resolución Paso a Paso -->
    <Transition name="fade">
      <div v-if="isStepsModalOpen" class="matrix-backdrop" @mousedown.self="isStepsModalOpen = false">
        <Transition name="scale">
          <div class="matrix-container solver-modal-container" @mousedown.stop>
            <div class="matrix-header">
              <h3 class="matrix-title">
                Resolución Óptima ({{ solverMode === 'minimize' ? 'Minimización' : 'Maximización' }})
              </h3>
              <button @click="isStepsModalOpen = false" class="btn-close">
                <X class="icon-close" />
              </button>
            </div>

            <div class="matrix-scroll solver-steps-scroll">
              <div class="solver-mode-selector">
                <span class="mode-selector-label">Objetivo:</span>
                <div class="mode-buttons">
                  <button 
                    class="btn-mode" 
                    :class="{ 'btn-mode-active': solverMode === 'minimize' }"
                    @click="executeSolver('minimize')"
                  >
                    ⚡ Minimizar Costo
                  </button>
                  <button 
                    class="btn-mode" 
                    :class="{ 'btn-mode-active': solverMode === 'maximize' }"
                    @click="executeSolver('maximize')"
                  >
                    🔥 Maximizar Beneficio
                  </button>
                </div>
              </div>

              <div v-if="solverMode === 'maximize'" class="step-card step-conversion">
                <span class="step-title">Paso 0: Conversión por Maximización</span>
                <p class="step-desc">
                  Elemento Máximo Global ($M$) = <strong>{{ solverResult.maxWeight }}</strong>. Matriz invertida de costos calculada como $C'_{ij} = M - C_{ij}$.
                </p>
              </div>

              <div class="step-card">
                <span class="step-title">Paso 1: Reducción por Filas (&alpha;)</span>
                <div class="vector-list">
                  <div v-for="(val, idx) in solverResult.alpha" :key="'alpha_' + idx" class="vector-item">
                    &alpha;({{ nodes[idx]?.label }}): <strong>{{ val }}</strong>
                  </div>
                </div>
              </div>

              <div class="step-card">
                <span class="step-title">Paso 2: Reducción por Columnas (&beta;)</span>
                <div class="vector-list">
                  <div v-for="(val, idx) in solverResult.beta" :key="'beta_' + idx" class="vector-item">
                    &beta;({{ nodes[idx]?.label }}): <strong>{{ val }}</strong>
                  </div>
                </div>
              </div>

              <div class="step-card">
                <span class="step-title">Paso 3: Matriz Reducida Final</span>
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th class="th-corner">De \ A</th>
                      <th v-for="node in nodes" :key="'col_' + node.id" class="th-node">{{ node.label }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in solverResult.finalMatrix" :key="'row_' + i">
                      <td class="td-node">{{ nodes[i]?.label }}</td>
                      <td 
                        v-for="(val, j) in row" 
                        :key="'cell_' + j" 
                        class="td-cell"
                        :class="{ 'td-zero': val === 0 }"
                      >
                        {{ val === solverResult.INF || val >= 1000000 ? '—' : val }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="step-card result-summary">
                <span class="step-title">Asignación Óptima Encontrada:</span>
                <div v-if="solverResult.assignments && solverResult.assignments.length > 0" class="assignments-tags">
                  <div v-for="(item, idx) in solverResult.assignments" :key="idx" class="assignment-tag">
                    <span class="tag-edge">{{ item.sourceLabel }} → {{ item.targetLabel }}</span>
                    <span class="tag-weight">Peso: {{ item.weight }}</span>
                  </div>
                </div>
                <p v-else class="no-assignments-text">
                  No se encontraron suficientes ceros independientes para cubrir todos los nodos. Intenta añadir más conexiones.
                </p>
                <div class="optimal-total-bar">
                  <span>{{ solverMode === 'minimize' ? 'Costo Total Mínimo:' : 'Beneficio Total Máximo:' }}</span>
                  <strong class="total-number">{{ solverResult.totalCost }}</strong>
                </div>
              </div>
            </div>

            <div class="matrix-footer">
              <button @click="applySolutionOnCanvas" class="btn-apply-solution">
                🎯 Ver Solución en Lienzo
              </button>
              <button @click="isStepsModalOpen = false" class="btn-close-modal">
                Cerrar
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ArrowLeft,
  Trash2,
  BookOpen,
  MousePointerClick,
  Grid3x3,
  Save,
  Plus,
  Link,
  Hand,
  Eraser,
  Pencil,
  Sparkles,
  X
} from '@lucide/vue'
import AssignmentMatrix from './AssignmentMatrixModal.vue'
import AssignmentWarning from './AssignmentWarning.vue'
import { solveAlgorithm } from '../utils/solver.js'

const props = defineProps({
  nodes: { type: Array, required: true, default: () => [] },
  edges: { type: Array, required: true, default: () => [] },
  optimalEdgeIds: { type: Array, default: () => [] },
  algorithmType: { type: String, default: 'asignacion' }
})

const emit = defineEmits([
  'back', 'show-instructions', 'save', 'clear',
  'create-node', 'create-edge', 'edit-node', 'edit-edge',
  'delete-node', 'delete-edge', 'clear-optimal', 'solution-found'
])

const canvasContainerRef = ref(null)
const svgRef = ref(null)

const tools = [
  { id: 'node', label: 'Nodo', icon: Plus, description: 'Crear nodos (toca lienzo)' },
  { id: 'connect', label: 'Conectar', icon: Link, description: 'Conectar 2 nodos' },
  { id: 'move', label: 'Mover', icon: Hand, description: 'Arrastrar nodos' },
  { id: 'delete', label: 'Borrar', icon: Eraser, description: 'Eliminar con confirmación' },
  { id: 'edit', label: 'Editar', icon: Pencil, description: 'Editar (nodos o aristas)' }
]

const activeTool = ref('node')
const selectedNodeId = ref(null)
const draggedNodeId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
const hoveredNodeId = ref(null)
const hoveredEdgeId = ref(null)

const showMatrixModal = ref(false)
const showSolverChoiceModal = ref(false)
const isStepsModalOpen = ref(false)
const solverMode = ref('minimize')

const solverResult = ref({
  alpha: [], beta: [], costMatrix: [], rawCostMatrix: [],
  rowReducedMatrix: [], finalMatrix: [], assignments: [],
  optimalEdgeIds: [], totalCost: 0, mode: 'minimize',
  maxWeight: 0, INF: Number.MAX_SAFE_INTEGER
})

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

const canvasTouchStart = ref({ x: 0, y: 0 })
const canvasTouchMoved = ref(false)
const TOUCH_THRESHOLD = 10
const panOffset = ref({ x: 0, y: 0 })
const twoFingerStart = ref({ x: 0, y: 0 })

const preventScroll = (e) => {
  if (e.target.closest('.canvas-container')) {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('touchmove', preventScroll, { passive: false })
})

onUnmounted(() => {
  document.removeEventListener('touchmove', preventScroll)
})

const setActiveTool = (toolId) => {
  activeTool.value = toolId
  selectedNodeId.value = null
}

const getModeDescription = () => {
  const tool = tools.find(t => t.id === activeTool.value)
  return tool ? tool.description : 'Selecciona una herramienta'
}

const truncateLabel = (label) => {
  if (!label) return ''
  return label.length > 6 ? label.slice(0, 5) + '..' : label
}

const isNodeInOptimal = (nodeId) => {
  if (!props.optimalEdgeIds || props.optimalEdgeIds.length === 0) return false
  return props.edges.some(
    e => props.optimalEdgeIds.includes(e.id) && (e.sourceId === nodeId || e.targetId === nodeId)
  )
}

const confirmClear = () => {
  emit('clear')
}

const openSolverChoiceModal = () => {
  if (props.nodes.length === 0) {
    openWarning(
      'Lienzo Vacío',
      'No hay nodos en el lienzo para resolver.',
      'Crea nodos y conexiones unidireccionales antes de resolver.'
    )
    return
  }
  showSolverChoiceModal.value = true
}

const handleSolverChoice = (mode) => {
  showSolverChoiceModal.value = false
  executeSolver(mode)
  isStepsModalOpen.value = true
}

const executeSolver = (mode) => {
  solverMode.value = mode
  solverResult.value = solveAlgorithm(props.nodes, props.edges, mode)
}

const applySolutionOnCanvas = () => {
  emit('solution-found', solverResult.value)
  isStepsModalOpen.value = false
}

const hasDirectedPath = (startId, endId, visited = new Set()) => {
  if (startId === endId) return true
  visited.add(startId)
  const outgoing = props.edges.filter(e => e.sourceId === startId)
  for (const edge of outgoing) {
    if (!visited.has(edge.targetId)) {
      if (hasDirectedPath(edge.targetId, endId, visited)) return true
    }
  }
  return false
}

const processedEdges = computed(() => {
  const nodeRadius = 28

  return props.edges.map(edge => {
    const sourceNode = props.nodes.find(n => n.id === edge.sourceId)
    const targetNode = props.nodes.find(n => n.id === edge.targetId)

    if (!sourceNode || !targetNode) return null

    const x1 = sourceNode.x
    const y1 = sourceNode.y
    const x2 = targetNode.x
    const y2 = targetNode.y

    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.hypot(dx, dy) || 1

    const ux = dx / distance
    const uy = dy / distance
    const nx = -uy
    const ny = ux

    const sx = x1 + ux * nodeRadius
    const sy = y1 + uy * nodeRadius
    const ex = x2 - ux * nodeRadius
    const ey = y2 - uy * nodeRadius

    const path = `M ${sx} ${sy} L ${ex} ${ey}`

    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const labelX = mx - nx * 14
    const labelY = my - ny * 14

    const rectW = Math.max(28, String(edge.weight).length * 8 + 12)
    const isOptimal = props.optimalEdgeIds && props.optimalEdgeIds.includes(edge.id)

    return {
      id: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, weight: edge.weight,
      path, labelX, labelY, rectW,
      color: '#64748b', markerId: 'arrow-assignment-slate', isOptimal
    }
  }).filter(Boolean)
})

const onCanvasMouseDown = (e) => {
  if (activeTool.value !== 'node') {
    if (activeTool.value === 'connect' && selectedNodeId.value) {
      selectedNodeId.value = null
    }
    return
  }

  if (selectedNodeId.value) {
    selectedNodeId.value = null
    return
  }

  const rect = svgRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left - panOffset.value.x
  const y = e.clientY - rect.top - panOffset.value.y

  emit('create-node', { x, y })
}

const onCanvasTouchStart = (e) => {
  if (activeTool.value !== 'node') {
    if (activeTool.value === 'connect' && selectedNodeId.value) {
      selectedNodeId.value = null
    }
    return
  }

  if (selectedNodeId.value) {
    selectedNodeId.value = null
    return
  }

  if (e.touches.length !== 1) return

  const touch = e.touches[0]
  canvasTouchStart.value = { x: touch.clientX, y: touch.clientY }
  canvasTouchMoved.value = false
}

const onNodeMouseDown = (node, e) => {
  if (activeTool.value === 'delete') { emit('delete-node', node.id); return }
  if (activeTool.value === 'edit') { emit('edit-node', node); return }
  if (activeTool.value === 'connect') { handleConnectNode(node); return }

  if (activeTool.value === 'move') {
    draggedNodeId.value = node.id
    hasDragged.value = false
    dragOffset.value = { x: e.clientX - node.x, y: e.clientY - node.y }
  }
}

const onNodeTouchStart = (node, e) => {
  if (activeTool.value === 'delete') { emit('delete-node', node.id); return }
  if (activeTool.value === 'edit') { emit('edit-node', node); return }
  if (activeTool.value === 'connect') { handleConnectNode(node); return }

  if (activeTool.value === 'move' && e.touches.length === 1) {
    draggedNodeId.value = node.id
    hasDragged.value = false
    const touch = e.touches[0]
    dragOffset.value = { x: touch.clientX - node.x, y: touch.clientY - node.y }
  }
}

const onEdgeMouseDown = (edge, e) => {
  if (activeTool.value === 'delete') { emit('delete-edge', edge.id); return }
  if (activeTool.value === 'edit') { emit('edit-edge', edge); return }
}

const onEdgeTouchStart = (edge, e) => {
  e.stopPropagation()
  e.preventDefault()
  if (activeTool.value === 'delete') { emit('delete-edge', edge.id); return }
  if (activeTool.value === 'edit') { emit('edit-edge', edge); return }
}

const handleConnectNode = (node) => {
  if (!selectedNodeId.value) {
    selectedNodeId.value = node.id
    return
  }

  const sourceId = selectedNodeId.value
  const targetId = node.id

  if (sourceId === targetId) {
    openWarning('Auto-conexión no permitida', 'Un nodo no puede conectarse a sí mismo en asignación.')
    selectedNodeId.value = null
    return
  }

  const directReverse = props.edges.some(e => e.sourceId === targetId && e.targetId === sourceId)
  const createsCycle = directReverse || hasDirectedPath(targetId, sourceId)

  if (createsCycle) {
    openWarning(
      'Dirección de retorno no permitida',
      'No se permiten nodos de retorno para esta herramienta.',
      'El grafo debe tener una sola dirección (sin retornos ni ciclos).'
    )
    selectedNodeId.value = null
    return
  }

  const alreadyExists = props.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)
  if (alreadyExists) {
    const existing = props.edges.find(e => e.sourceId === sourceId && e.targetId === targetId)
    if (existing) emit('edit-edge', existing)
    selectedNodeId.value = null
    return
  }

  emit('create-edge', { sourceId, targetId })
  selectedNodeId.value = null
}

const onMouseMove = (e) => {
  if (!draggedNodeId.value || activeTool.value !== 'move') return

  hasDragged.value = true
  const node = props.nodes.find(n => n.id === draggedNodeId.value)
  if (node) {
    const rect = svgRef.value.getBoundingClientRect()
    node.x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left - panOffset.value.x))
    node.y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top - panOffset.value.y))
  }
}

const onMouseUp = () => {
  draggedNodeId.value = null
}

const onTouchMove = (e) => {
  if (e.touches.length === 2) {
    hasDragged.value = true
    canvasTouchMoved.value = true

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const currentX = (touch1.clientX + touch2.clientX) / 2
    const currentY = (touch1.clientY + touch2.clientY) / 2

    if (twoFingerStart.value.x === 0) {
      twoFingerStart.value = { x: currentX, y: currentY }
      return
    }

    const deltaX = currentX - twoFingerStart.value.x
    const deltaY = currentY - twoFingerStart.value.y

    panOffset.value.x += deltaX
    panOffset.value.y += deltaY

    twoFingerStart.value = { x: currentX, y: currentY }
    return
  }

  if (draggedNodeId.value && e.touches.length === 1 && activeTool.value === 'move') {
    hasDragged.value = true
    const touch = e.touches[0]
    const node = props.nodes.find(n => n.id === draggedNodeId.value)
    if (node) {
      const rect = svgRef.value.getBoundingClientRect()
      node.x = Math.max(30, Math.min(rect.width - 30, touch.clientX - rect.left - panOffset.value.x))
      node.y = Math.max(30, Math.min(rect.height - 30, touch.clientY - rect.top - panOffset.value.y))
    }
  }

  if (e.touches.length === 1 && !canvasTouchMoved.value && activeTool.value === 'node') {
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - canvasTouchStart.value.x)
    const dy = Math.abs(touch.clientY - canvasTouchStart.value.y)

    if (dx > TOUCH_THRESHOLD || dy > TOUCH_THRESHOLD) {
      canvasTouchMoved.value = true
    }
  }
}

const onTouchEnd = () => {
  twoFingerStart.value = { x: 0, y: 0 }
  draggedNodeId.value = null
}
</script>

<style scoped>
.canvas-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-body);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.canvas-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-surface);
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

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .header-left { flex: 1; }
}

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

.header-subtitle {
  font-size: 0.6rem;
  color: var(--text-secondary);
  margin: 0;
}

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
  .stats-container {
    width: auto;
    gap: 1rem;
    font-size: 0.8rem;
    justify-content: flex-start;
  }
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
  background: transparent; border: none; color: #00f2ff;
  cursor: pointer; font-size: 0.7rem; padding: 0 0.2rem;
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
  .header-actions {
    width: auto;
    justify-content: flex-end;
    flex-wrap: nowrap;
  }
}

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
  .btn-text {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    gap: 0.375rem;
    min-height: auto;
  }
}

.btn-text:active { transform: scale(0.95); }

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

.btn-icon { width: 0.9rem; height: 0.9rem; }

@media (min-width: 640px) { .btn-icon { width: 1rem; height: 1rem; } }

.side-panel {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 25;
  background-color: var(--bg-surface);
  padding: 0.5rem 0.4rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px var(--shadow-color);
}

@media (min-width: 640px) {
  .side-panel { left: 1rem; padding: 0.6rem 0.5rem; gap: 0.4rem; }
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.3rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 3.2rem;
  min-height: 3.2rem;
}

@media (min-width: 640px) {
  .tool-btn { min-width: 3.8rem; min-height: 3.8rem; padding: 0.5rem 0.4rem; }
}

.tool-btn:hover { background-color: var(--bg-surface-2); }
.tool-btn:active { transform: scale(0.92); }

.tool-active {
  border-color: var(--accent-solid);
  background-color: var(--accent-soft-bg);
  color: var(--accent-solid);
}

.tool-icon { width: 1.2rem; height: 1.2rem; }

@media (min-width: 640px) { .tool-icon { width: 1.4rem; height: 1.4rem; } }

.tool-label { font-size: 0.5rem; font-weight: 600; margin-top: 0.1rem; }

@media (min-width: 640px) { .tool-label { font-size: 0.6rem; margin-top: 0.15rem; } }

.empty-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 18rem;
  pointer-events: none;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  z-index: 10;
}

.empty-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: var(--accent-soft-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: var(--accent-solid);
}

.empty-icon { width: 1.8rem; height: 1.8rem; }

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  margin-top: 0;
}

.empty-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.connection-tip {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1rem;
  background-color: var(--accent-soft-bg);
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--accent-solid);
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 20;
  max-width: 90%;
  text-align: center;
}

.delete-tip { background-color: #fef2f2; border-color: #ef4444; color: #ef4444; }

[data-theme='dark'] .delete-tip {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(248, 113, 113, 0.35);
  color: #f87171;
}

.edit-tip { background-color: #eff6ff; border-color: #3b82f6; color: #3b82f6; }

[data-theme='dark'] .edit-tip {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(96, 165, 250, 0.35);
  color: #60a5fa;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--accent-solid);
  animation: pulse 1s infinite;
}

.delete-tip .pulse-dot { background-color: #ef4444; }
.edit-tip .pulse-dot { background-color: #3b82f6; }

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.canvas-container {
  flex-grow: 1;
  width: 100%;
  height: 100%;
  position: relative;
  cursor: crosshair;
  overflow: hidden;
  touch-action: none;
}

.svg-canvas {
  width: 100%;
  height: 100%;
  background-color: var(--bg-body);
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 24px 24px;
  touch-action: none;
}

.edge-path {
  transition: stroke-width 0.15s ease, stroke 0.15s ease, filter 0.15s ease;
  cursor: pointer;
}

.edge-path:active { stroke-width: 5px; }

.edge-highlight { stroke-width: 4px; filter: brightness(1.2); }

.edge-optimal-flow {
  stroke: #00f2ff !important;
  stroke-width: 4px !important;
  stroke-dasharray: 6 3;
  animation: dashFlow 1s linear infinite;
  filter: drop-shadow(0 0 6px rgba(0, 242, 255, 0.6));
}

@keyframes dashFlow {
  from { stroke-dashoffset: 18; }
  to { stroke-dashoffset: 0; }
}

.edge-touch-area { cursor: pointer; }
.edge-label-group { cursor: pointer; }

.edge-rect {
  fill: var(--bg-surface);
  stroke: var(--border-color);
  stroke-width: 1.5px;
}

.edge-rect-optimal {
  stroke: #00f2ff !important;
  fill: var(--bg-surface-2) !important;
}

.edge-text {
  font-family: system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
  fill: var(--text-primary);
}

.edge-text-optimal { fill: #00f2ff !important; font-weight: 800; }

.node-circle {
  fill: var(--bg-surface);
  stroke: var(--text-secondary);
  stroke-width: 2.5px;
  transition: all 0.15s ease-in-out;
}

.node-circle-optimal {
  stroke: #00f2ff !important;
  stroke-width: 3.5px !important;
}

.node-text {
  font-family: system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  fill: var(--text-primary);
  text-anchor: middle;
  user-select: none;
}

.node-group:active .node-circle {
  stroke: var(--accent-solid);
  fill: var(--accent-soft-bg);
}

.node-active .node-circle {
  stroke: var(--accent-solid) !important;
  stroke-width: 3px;
  fill: var(--accent-soft-bg);
}

.node-dragging .node-circle {
  stroke: var(--accent-solid) !important;
  fill: var(--accent-soft-bg);
}

.node-hover .node-circle { stroke-width: 3px; }

.node-delete-mode .node-circle {
  stroke: #ef4444;
  stroke-dasharray: 4 4;
}

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
  .matrix-container { max-width: 90vw; max-height: 85vh; }
}

@media (min-width: 1024px) {
  .matrix-container { max-width: 80vw; max-height: 80vh; }
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

@media (min-width: 640px) { .matrix-title { font-size: 1.25rem; } }

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

.btn-close:hover { background: rgba(255, 255, 255, 0.3); }
.btn-close:active { transform: scale(0.9); }

.icon-close { width: 1.25rem; height: 1.25rem; }

.matrix-scroll {
  overflow: auto;
  padding: 0.75rem;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 640px) { .matrix-scroll { padding: 1rem; } }

.solver-steps-scroll {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.solver-mode-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.mode-selector-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

.mode-buttons { display: flex; gap: 0.5rem; }

.btn-mode {
  padding: 0.35rem 0.85rem;
  border-radius: 0.4rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-mode-active {
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  color: #ffffff;
  border-color: transparent;
}

.step-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.step-conversion { background: #ecfdf5; border-color: #a7f3d0; }

.step-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.step-desc { font-size: 0.8rem; color: #047857; margin: 0; }

.vector-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.vector-item {
  font-size: 0.8rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
  color: #334155;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.65rem;
  min-width: 200px;
}

@media (min-width: 640px) { .matrix-table { font-size: 0.8rem; } }

.th-corner, .th-node {
  padding: 0.3rem 0.2rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

@media (min-width: 640px) { .th-corner, .th-node { padding: 0.5rem 0.6rem; } }

.th-node { background-color: #eef2ff; color: #4f46e5; }

.td-node {
  padding: 0.2rem 0.1rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

@media (min-width: 640px) { .td-node { padding: 0.4rem 0.5rem; } }

.td-cell {
  padding: 0.2rem 0.1rem;
  text-align: center;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  font-weight: 500;
}

@media (min-width: 640px) { .td-cell { padding: 0.4rem 0.5rem; } }

.td-zero { background-color: #d1fae5; color: #047857; font-weight: 700; }

.result-summary { background: #f0fdf4; border-color: #86efac; }

.assignments-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }

.assignment-tag {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #bbf7d0;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
}

.tag-edge { font-weight: 700; color: #15803d; }
.tag-weight { color: #64748b; font-size: 0.75rem; }

.no-assignments-text {
  font-size: 0.8rem;
  color: #b45309;
  margin: 0 0 0.5rem 0;
}

.optimal-total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #15803d;
  color: #ffffff;
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
}

.total-number { font-size: 1.15rem; color: #bbf7d0; }

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
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
  }
}

.btn-apply-solution {
  padding: 0.4rem 1.25rem;
  background: #10b981;
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
  .btn-apply-solution { width: auto; min-height: auto; }
}

.btn-apply-solution:hover { background: #059669; }

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