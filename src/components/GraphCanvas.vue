
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

      <!-- Estadísticas Académicas -->
      <div class="stats-container">
        <div class="stat-badge">
          Nodos: <strong class="stat-number">{{ nodes.length }}</strong>
        </div>
        <div class="stat-badge">
          Aristas: <strong class="stat-number">{{ edges.length }}</strong>
        </div>
      </div>

      <!-- Acciones de Cabecera -->
      <div class="header-actions">
        <button @click="$emit('save')" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="$emit('show-matrix')" class="btn-text btn-matrix">
          <Grid3x3 class="btn-icon" />
          <span>Matriz</span>
        </button>
        <button @click="$emit('show-instructions')" class="btn-text">
          <BookOpen class="btn-icon" />
          <span>Manual</span>
        </button>
        <button @click="confirmClear" class="btn-text btn-danger">
          <Trash2 class="btn-icon" />
          <span>Limpiar</span>
        </button>

        <!-- BOTONES DE ALGORITMOS DE ASIGNACIÓN (Condicionados) -->
        <template v-if="algorithmType === 'asignacion'">
          <button @click="ejecutarMetodoCeros" class="btn-text btn-matrix">
            <component :is="Link" class="btn-icon" />
            <span>Método de Ceros</span>
          </button>

          <button @click="ejecutarMetodoHungaro" class="btn-text btn-matrix">
            <component :is="Link" class="btn-icon" />
            <span>Método Húngaro</span>
          </button>
        </template>
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

    <!-- Mensaje de ayuda según modo activo -->
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
          <!-- Marcadores de Flechas para las Aristas -->
          <defs>
            <marker
              id="arrow-slate"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#6366f1" />
            </marker>
            <marker
              id="arrow-rose"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ec4899" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#9333ea" />
            </marker>
          </defs>

          <!-- Dibujo de las Aristas -->
          <g v-for="edge in processedEdges" :key="edge.id" class="edge-group">
            <path
              :d="edge.path"
              fill="none"
              :stroke="edge.color"
              stroke-width="3"
              class="edge-path"
              :class="{ 'edge-highlight': hoveredEdgeId === edge.id }"
              :marker-end="`url(#${edge.markerId})`"
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

            <!-- Burbuja de Peso de la Arista -->
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
                :stroke="edge.color"
              />
              <text dy="5" class="edge-text" :fill="edge.color">
                {{ edge.weight }}
              </text>
            </g>
          </g>

          <!-- Dibujo de los Nodos -->
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node-group"
            :class="{ 
              'node-active': selectedNodeId === node.id, 
              'node-dragging': draggedNodeId === node.id,
              'node-hover': hoveredNodeId === node.id,
              'node-delete-mode': activeTool === 'delete'
            }"
            @mousedown.stop="onNodeMouseDown(node, $event)"
            @touchstart.stop.prevent="onNodeTouchStart(node, $event)"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
          >
            <circle r="28" class="node-circle" />
            <text dy="6" class="node-text">
              {{ truncateLabel(node.label) }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Pie del Lienzo / Leyendas Académicas -->
    <div class="canvas-footer">
      <div class="footer-tips">
        <Info class="footer-info-icon" />
        <span>{{ getFooterTip() }}</span>
      </div>
      <div class="legend-container">
        <span class="legend-item">
          <span class="legend-line line-slate"></span> Simple
        </span>
        <span class="legend-item">
          <span class="legend-line line-indigo"></span> Ida
        </span>
        <span class="legend-item">
          <span class="legend-line line-pink"></span> Retorno
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { resolverMetodoCeros } from '../utils/zeroMethod.js'
import { resolverMetodoHungaro } from '../utils/hungarianMethod.js'

import {
  ArrowLeft,
  Trash2,
  BookOpen,
  Info,
  MousePointerClick,
  Grid3x3,
  Save,
  Plus,
  Link,
  Hand,
  Eraser,
  Pencil
} from '@lucide/vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    required: true
  },
  algorithmType: {
    type: String,
    default: 'grafos'
  }
})

const emit = defineEmits([
  'back',
  'show-instructions',
  'show-matrix',
  'save',
  'clear',
  'create-node',
  'create-edge',
  'edit-node',
  'edit-edge',
  'delete-node',
  'delete-edge'
])

// ALGORITMOS DE ASIGNACIÓN
const ejecutarMetodoCeros = () => {
  const resultado = resolverMetodoCeros(props.nodes, props.edges)
  alert(`Ejecutando ${resultado.metodo}`)
}

const ejecutarMetodoHungaro = () => {
  const resultado = resolverMetodoHungaro(props.nodes, props.edges)
  alert(`Ejecutando ${resultado.metodo}`)
}

const canvasContainerRef = ref(null)
const svgRef = ref(null)

// Herramientas del panel lateral
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

// Touch tracking para canvas
const canvasTouchStart = ref({ x: 0, y: 0 })
const canvasTouchMoved = ref(false)
const TOUCH_THRESHOLD = 10

// Pan con 2 dedos
const panOffset = ref({ x: 0, y: 0 })
const twoFingerStart = ref({ x: 0, y: 0 })

// Prevenir scroll en móvil
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

const getFooterTip = () => {
  switch (activeTool.value) {
    case 'node':
      return 'Toca en cualquier zona vacía para crear un nodo.'
    case 'connect':
      return 'Toca un nodo origen y luego un nodo destino para conectarlos.'
    case 'move':
      return 'Arrastra cualquier nodo para moverlo libremente.'
    case 'delete':
      return 'Toca un nodo o arista para eliminarlo (confirmación requerida).'
    case 'edit':
      return 'Toca un nodo o arista para editar sus propiedades.'
    default:
      return 'Selecciona una herramienta en el panel izquierdo.'
  }
}

const truncateLabel = (label) => {
  return label.length > 6 ? label.slice(0, 5) + '..' : label
}

// Lógica de cálculo de curvas paralelas y rectas para aristas
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
    
    if (edge.sourceId === edge.targetId) {
      const r = nodeRadius
      const loopSize = 50
      const startAngle = -Math.PI * 0.75
      const endAngle = -Math.PI * 0.25
      const sx = x1 + r * Math.cos(startAngle)
      const sy = y1 + r * Math.sin(startAngle)
      const ex = x1 + r * Math.cos(endAngle)
      const ey = y1 + r * Math.sin(endAngle)
      const cp1x = x1 - loopSize * 0.6
      const cp1y = y1 - r - loopSize
      const cp2x = x1 + loopSize * 0.6
      const cp2y = y1 - r - loopSize
      const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`

      return {
        id: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, weight: edge.weight,
        path, labelX: x1, labelY: y1 - r - loopSize + 15,
        rectW: Math.max(28, String(edge.weight).length * 8 + 12),
        color: '#9333ea', markerId: 'arrow-purple'
      }
    }

    const hasReverse = props.edges.some(e => e.sourceId === edge.targetId && e.targetId === edge.sourceId)
    
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.hypot(dx, dy) || 1
    
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    
    const ux = dx / distance
    const uy = dy / distance
    const nx = -uy
    const ny = ux
    
    let path = ''
    let cx = mx
    let cy = my
    let offset = 0
    let color = '#64748b'
    let markerId = 'arrow-slate'
    
    if (hasReverse) {
      const isForward = edge.sourceId < edge.targetId
      offset = 30
      
      if (isForward) {
        color = '#6366f1'
        markerId = 'arrow-blue'
      } else {
        color = '#ec4899'
        markerId = 'arrow-rose'
      }
      
      cx = mx + nx * offset
      cy = my + ny * offset
      
      const dxStart = cx - x1
      const dyStart = cy - y1
      const lenStart = Math.hypot(dxStart, dyStart) || 1
      const sx = x1 + (dxStart / lenStart) * nodeRadius
      const sy = y1 + (dyStart / lenStart) * nodeRadius
      
      const dxEnd = x2 - cx
      const dyEnd = y2 - cy
      const lenEnd = Math.hypot(dxEnd, dyEnd) || 1
      const ex = x2 - (dxEnd / lenEnd) * nodeRadius
      const ey = y2 - (dyEnd / lenEnd) * nodeRadius
      
      path = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
    } else {
      const sx = x1 + ux * nodeRadius
      const sy = y1 + uy * nodeRadius
      const ex = x2 - ux * nodeRadius
      const ey = y2 - uy * nodeRadius
      
      path = `M ${sx} ${sy} L ${ex} ${ey}`
    }
    
    let labelX = mx
    let labelY = my
    if (hasReverse) {
      labelX = 0.5 * mx + 0.5 * cx
      labelY = 0.5 * my + 0.5 * cy
      labelX += nx * 6
      labelY += ny * 6
    } else {
      labelX -= nx * 14
      labelY -= ny * 14
    }
    
    const rectW = Math.max(28, String(edge.weight).length * 8 + 12)
    
    return {
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      weight: edge.weight,
      path,
      labelX,
      labelY,
      rectW,
      color,
      markerId
    }
  }).filter(Boolean)
})

// Manejo de clics en el lienzo según herramienta activa
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

// Lógica de arrastre de Nodos
const onNodeMouseDown = (node, e) => {
  if (activeTool.value === 'delete') {
    handleDeleteNode(node)
    return
  }
  
  if (activeTool.value === 'edit') {
    handleEditNode(node)
    return
  }
  
  if (activeTool.value === 'connect') {
    handleConnectNode(node)
    return
  }
  
  if (activeTool.value === 'move') {
    draggedNodeId.value = node.id
    hasDragged.value = false
    dragOffset.value = {
      x: e.clientX - node.x,
      y: e.clientY - node.y
    }
  }
}

const onNodeTouchStart = (node, e) => {
  if (activeTool.value === 'delete') {
    handleDeleteNode(node)
    return
  }
  
  if (activeTool.value === 'edit') {
    handleEditNode(node)
    return
  }
  
  if (activeTool.value === 'connect') {
    handleConnectNode(node)
    return
  }
  
  if (activeTool.value === 'move' && e.touches.length === 1) {
    draggedNodeId.value = node.id
    hasDragged.value = false
    const touch = e.touches[0]
    dragOffset.value = {
      x: touch.clientX - node.x,
      y: touch.clientY - node.y
    }
  }
}

const onEdgeMouseDown = (edge, e) => {
  if (activeTool.value === 'delete') {
    handleDeleteEdge(edge)
    return
  }
  
  if (activeTool.value === 'edit') {
    handleEditEdge(edge)
    return
  }
}

const onEdgeTouchStart = (edge, e) => {
  e.stopPropagation()
  e.preventDefault()
  
  if (activeTool.value === 'delete') {
    handleDeleteEdge(edge)
    return
  }
  
  if (activeTool.value === 'edit') {
    handleEditEdge(edge)
    return
  }
}

const handleConnectNode = (node) => {
  if (!selectedNodeId.value) {
    selectedNodeId.value = node.id
  } else {
    if (selectedNodeId.value === node.id) {
      emit('create-edge', {
        sourceId: node.id,
        targetId: node.id
      })
      selectedNodeId.value = null
    } else {
      emit('create-edge', {
        sourceId: selectedNodeId.value,
        targetId: node.id
      })
      selectedNodeId.value = null
    }
  }
}

const handleDeleteNode = (node) => {
  emit('delete-node', node.id)
}

const handleDeleteEdge = (edge) => {
  emit('delete-edge', edge.id)
}

const handleEditNode = (node) => {
  emit('edit-node', node)
}

const handleEditEdge = (edge) => {
  emit('edit-edge', edge)
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
    const node = props.nodes.find(n => n.id === draggedNodeId.value)
    if (node) {
      const rect = svgRef.value.getBoundingClientRect()
      const touch = e.touches[0]
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
  
  if (draggedNodeId.value && activeTool.value === 'move') {
    draggedNodeId.value = null
    return
  }
  
  if (!canvasTouchMoved.value && activeTool.value === 'node' && !selectedNodeId.value) {
    const rect = svgRef.value.getBoundingClientRect()
    const x = canvasTouchStart.value.x - rect.left - panOffset.value.x
    const y = canvasTouchStart.value.y - rect.top - panOffset.value.y
    
    emit('create-node', { x, y })
  }
  
  canvasTouchMoved.value = false
}

const confirmClear = () => {
  if (confirm('¿Eliminar todos los nodos y aristas del lienzo?')) {
    emit('clear')
  }
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
  .header-left {
    flex: 1;
  }
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

.btn-icon-only:active {
  transform: scale(0.95);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.header-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

@media (min-width: 640px) {
  .header-title {
    font-size: 1rem;
  }
}

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

@media (min-width: 640px) {
  .header-subtitle {
    font-size: 0.7rem;
  }
}

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
}

@media (min-width: 640px) {
  .stat-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }
}

.stat-number {
  color: var(--text-primary);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
}

.btn-matrix {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  color: var(--accent-solid);
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

@media (min-width: 640px) {
  .header-actions {
    width: auto;
    justify-content: flex-end;
    flex-wrap: nowrap;
  }
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

.btn-text:active {
  transform: scale(0.95);
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

.btn-icon {
  width: 0.9rem;
  height: 0.9rem;
}

@media (min-width: 640px) {
  .btn-icon {
    width: 1rem;
    height: 1rem;
  }
}

/* ===== PANEL LATERAL IZQUIERDO ===== */
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
  .side-panel {
    left: 1rem;
    padding: 0.6rem 0.5rem;
    gap: 0.4rem;
  }
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
  .tool-btn {
    min-width: 3.8rem;
    min-height: 3.8rem;
    padding: 0.5rem 0.4rem;
  }
}

.tool-btn:hover {
  background-color: var(--bg-surface-2);
}

.tool-btn:active {
  transform: scale(0.92);
}

.tool-active {
  border-color: var(--accent-solid);
  background-color: var(--accent-soft-bg);
  color: var(--accent-solid);
}

.tool-icon {
  width: 1.2rem;
  height: 1.2rem;
}

@media (min-width: 640px) {
  .tool-icon {
    width: 1.4rem;
    height: 1.4rem;
  }
}

.tool-label {
  font-size: 0.5rem;
  font-weight: 600;
  margin-top: 0.1rem;
}

@media (min-width: 640px) {
  .tool-label {
    font-size: 0.6rem;
    margin-top: 0.15rem;
  }
}

/* ===== FIN PANEL LATERAL ===== */

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

.empty-icon {
  width: 1.8rem;
  height: 1.8rem;
}

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

.delete-tip {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

[data-theme='dark'] .delete-tip {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(248, 113, 113, 0.35);
  color: #f87171;
}

.edit-tip {
  background-color: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

[data-theme='dark'] .edit-tip {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(96, 165, 250, 0.35);
  color: #60a5fa;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--accent-solid);
  animation: pulse 1s infinite;
}

.delete-tip .pulse-dot {
  background-color: #ef4444;
}

.edit-tip .pulse-dot {
  background-color: #3b82f6;
}

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

.edge-path:active {
  stroke-width: 5px;
}

.edge-highlight {
  stroke-width: 4px;
  filter: brightness(1.2);
}

.edge-touch-area {
  cursor: pointer;
}

.edge-label-group {
  cursor: pointer;
}

.edge-rect {
  fill: var(--bg-surface);
  stroke: var(--border-color);
  stroke-width: 1.5px;
}

.edge-text {
  font-family: system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
}

.node-circle {
  fill: var(--bg-surface);
  stroke: var(--text-secondary);
  stroke-width: 2.5px;
  transition: all 0.15s ease-in-out;
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

.node-hover .node-circle {
  stroke-width: 3px;
}

.node-delete-mode .node-circle {
  stroke: #ef4444;
  stroke-dasharray: 4 4;
}

.node-delete-mode .node-group:hover .node-circle {
  stroke: #dc2626;
  fill: #fef2f2;
  stroke-width: 3px;
}

[data-theme='dark'] .node-delete-mode .node-circle {
  stroke: #f87171;
}

[data-theme='dark'] .node-delete-mode .node-group:hover .node-circle {
  stroke: #fca5a5;
  fill: rgba(239, 68, 68, 0.1);
}

.canvas-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  font-size: 0.6rem;
  color: var(--text-secondary);
  gap: 0.3rem;
  z-index: 20;
}

@media (min-width: 640px) {
  .canvas-footer {
    padding: 0.5rem 1.5rem;
    font-size: 0.7rem;
    gap: 0.5rem;
  }
}

.footer-tips {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.footer-info-icon {
  width: 0.8rem;
  height: 0.8rem;
  color: #3b82f6;
}

@media (min-width: 640px) {
  .footer-info-icon {
    width: 1rem;
    height: 1rem;
  }
}

.legend-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.6rem;
}

@media (min-width: 640px) {
  .legend-item {
    font-size: 0.7rem;
    gap: 0.3rem;
  }
}

.legend-line {
  width: 0.8rem;
  height: 2.5px;
  border-radius: 2px;
}

@media (min-width: 640px) {
  .legend-line {
    width: 1rem;
  }
}

.line-slate { background-color: #64748b; }
.line-indigo { background-color: #6366f1; }
.line-pink { background-color: #ec4899; }
</style>