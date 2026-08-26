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
          <p class="header-subtitle">Toca arista para editar | Doble toque nodo para editar</p>
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
      </div>
    </div>

    <!-- Indicador de Lienzo Vacío -->
    <div v-if="nodes.length === 0" class="empty-indicator">
      <div class="empty-icon-wrapper">
        <MousePointerClick class="empty-icon" />
      </div>
      <h3 class="empty-title">Lienzo Vacío</h3>
      <p class="empty-desc">
        Toca en cualquier zona vacía para crear un nodo.
      </p>
    </div>

    <!-- Mensaje de ayuda para aristas -->
    <div v-if="selectedNodeId" class="connection-tip">
      <span class="pulse-dot"></span>
      <span>Nodo origen seleccionado. Toque el destino para conectar o el fondo para cancelar.</span>
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
        <!-- Grupo que contiene TODO (nodos + aristas + background) con transform para pan -->
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
            <!-- Arista Principal -->
            <path
              :d="edge.path"
              fill="none"
              :stroke="edge.color"
              stroke-width="3"
              class="edge-path"
              :marker-end="`url(#${edge.markerId})`"
              @mousedown.stop="onEdgeTouch(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouch(edge, $event)"
            />

            <!-- Área sensible táctil más ancha para facilitar clicks -->
            <path
              :d="edge.path"
              fill="none"
              stroke="transparent"
              stroke-width="40"
              class="edge-touch-area"
              @mousedown.stop="onEdgeTouch(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouch(edge, $event)"
            />

            <!-- Burbuja de Peso de la Arista -->
            <g
              :transform="`translate(${edge.labelX}, ${edge.labelY})`"
              class="edge-label-group"
              @mousedown.stop="onEdgeTouch(edge, $event)"
              @touchstart.stop.prevent="onEdgeTouch(edge, $event)"
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

          <!-- Dibujo de los Nodos (Círculos Planos) -->
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node-group"
            :class="{ 'node-active': selectedNodeId === node.id, 'node-dragging': draggedNodeId === node.id }"
            @mousedown.stop="onNodeMouseDown(node, $event)"
            @touchstart.stop.prevent="onNodeTouchStart(node, $event)"
          >
            <!-- Círculo del Nodo -->
            <circle r="28" class="node-circle" />

            <!-- Texto del Nodo -->
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
        <span>Arrastra nodos para mover. Toca un nodo y luego otro para conectarlos.</span>
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
import {
  ArrowLeft,
  Trash2,
  BookOpen,
  Info,
  MousePointerClick,
  Grid3x3
} from '@lucide/vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'back',
  'show-instructions',
  'show-matrix',
  'clear',
  'create-node',
  'create-edge',
  'edit-node',
  'edit-edge'
])

const canvasContainerRef = ref(null)
const svgRef = ref(null)

// Selección y arrastre de Nodos
const selectedNodeId = ref(null)
const draggedNodeId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const hasDragged = ref(false)

// Registradores de clicks para Doble Click/Doble Toque
const nodeLastTaps = ref({})
const edgeLastTaps = ref({})

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

    // Verifica si hay arista en dirección contraria
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

// Clic en fondo del lienzo para crear nodo
const onCanvasMouseDown = (e) => {
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
  if (selectedNodeId.value) {
    selectedNodeId.value = null
    return
  }
  
  if (e.touches.length !== 1) {
    return
  }
  
  const touch = e.touches[0]
  canvasTouchStart.value = { x: touch.clientX, y: touch.clientY }
  canvasTouchMoved.value = false
}

// Lógica de arrastre de Nodos (Mouse)
const onNodeMouseDown = (node, e) => {
  draggedNodeId.value = node.id
  hasDragged.value = false
  dragOffset.value = {
    x: e.clientX - node.x,
    y: e.clientY - node.y
  }
}

const onMouseMove = (e) => {
  if (!draggedNodeId.value) return
  
  hasDragged.value = true
  const node = props.nodes.find(n => n.id === draggedNodeId.value)
  if (node) {
    const rect = svgRef.value.getBoundingClientRect()
    
    node.x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left - panOffset.value.x))
    node.y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top - panOffset.value.y))
  }
}

const onMouseUp = () => {
  if (!draggedNodeId.value) return
  
  const node = props.nodes.find(n => n.id === draggedNodeId.value)
  if (node && !hasDragged.value) {
    const now = Date.now()
    const lastTap = nodeLastTaps.value[node.id] || 0
    
    if (now - lastTap < 500) {
      onNodeDblClick(node)
    } else {
      handleNodeClick(node)
    }
    nodeLastTaps.value[node.id] = now
  }
  
  draggedNodeId.value = null
}

// Lógica de arrastre de Nodos (Táctil)
const onNodeTouchStart = (node, e) => {
  if (e.touches.length === 1) {
    draggedNodeId.value = node.id
    hasDragged.value = false
    const touch = e.touches[0]
    dragOffset.value = {
      x: touch.clientX - node.x,
      y: touch.clientY - node.y
    }
  }
}

const onTouchMove = (e) => {
  // PAN CON 2 DEDOS
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
  
  // ARRASTRAR NODO (1 dedo)
  if (draggedNodeId.value && e.touches.length === 1) {
    hasDragged.value = true
    const node = props.nodes.find(n => n.id === draggedNodeId.value)
    if (node) {
      const rect = svgRef.value.getBoundingClientRect()
      const touch = e.touches[0]
      
      node.x = Math.max(30, Math.min(rect.width - 30, touch.clientX - rect.left - panOffset.value.x))
      node.y = Math.max(30, Math.min(rect.height - 30, touch.clientY - rect.top - panOffset.value.y))
    }
  }
  
  // Detectar movimiento en el canvas
  if (e.touches.length === 1 && !canvasTouchMoved.value) {
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
  
  if (draggedNodeId.value) {
    const node = props.nodes.find(n => n.id === draggedNodeId.value)
    if (node && !hasDragged.value) {
      const now = Date.now()
      const lastTap = nodeLastTaps.value[node.id] || 0
      
      if (now - lastTap < 500) {
        onNodeDblClick(node)
      } else {
        handleNodeClick(node)
      }
      nodeLastTaps.value[node.id] = now
    }
    
    draggedNodeId.value = null
    return
  }
  
  if (!canvasTouchMoved.value && !selectedNodeId.value) {
    const rect = svgRef.value.getBoundingClientRect()
    const x = canvasTouchStart.value.x - rect.left - panOffset.value.x
    const y = canvasTouchStart.value.y - rect.top - panOffset.value.y
    
    emit('create-node', { x, y })
  }
  
  canvasTouchMoved.value = false
}

// Lógica de selección y conexiones
const handleNodeClick = (node) => {
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

const onNodeDblClick = (node) => {
  selectedNodeId.value = null
  emit('edit-node', node)
}

// 🔥 FUNCIÓN SIMPLIFICADA PARA ARISTAS - CLIC ÚNICO 🔥
const onEdgeTouch = (edge, e) => {
  e.stopPropagation()
  e.preventDefault()
  // Abrir edición directamente con un solo toque/clic
  onEdgeDblClick(edge)
}

const onEdgeDblClick = (edge) => {
  emit('edit-edge', edge)
}

const confirmClear = () => {
  emit('clear')
}
</script>

<style scoped>
.canvas-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8fafc;
  color: #1e293b;
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
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
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
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.btn-icon-only:active {
  background-color: #e2e8f0;
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
  color: #0f172a;
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
  color: #64748b;
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
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.7rem;
}

@media (min-width: 640px) {
  .stat-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }
}

.stat-number {
  color: #0f172a;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-matrix {
  background-color: #eef2ff;
  border-color: #c7d2fe;
  color: #4f46e5;
}

.btn-matrix:active {
  background-color: #e0e7ff;
}

@media (min-width: 640px) {
  .header-actions {
    width: auto;
    justify-content: flex-end;
  }
}

.btn-text {
  padding: 0.4rem 0.6rem;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #334155;
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
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.empty-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #4f46e5;
}

.empty-icon {
  width: 1.8rem;
  height: 1.8rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.25rem;
  margin-top: 0;
}

.empty-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.connection-tip {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1rem;
  background-color: #e0e7ff;
  color: #3730a3;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 20;
  max-width: 90%;
  text-align: center;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #4f46e5;
  animation: pulse 1s infinite;
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
  background-color: #f8fafc;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
  touch-action: none;
}

.edge-path {
  transition: stroke-width 0.15s ease, stroke 0.15s ease;
  cursor: pointer;
}

.edge-path:active {
  stroke-width: 5px;
}

.edge-touch-area {
  cursor: pointer;
}

.edge-label-group {
  cursor: pointer;
}

.edge-rect {
  fill: #ffffff;
  stroke: #cbd5e1;
  stroke-width: 1.5px;
}

.edge-text {
  font-family: system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
}

.node-circle {
  fill: #ffffff;
  stroke: #475569;
  stroke-width: 2.5px;
  transition: all 0.15s ease-in-out;
}

.node-text {
  font-family: system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  fill: #1e293b;
  text-anchor: middle;
  user-select: none;
}

.node-group:active .node-circle {
  stroke: #2563eb;
  fill: #f1f5f9;
}

.node-active .node-circle {
  stroke: #4f46e5 !important;
  stroke-width: 3px;
  fill: #e0e7ff;
}

.node-dragging .node-circle {
  stroke: #4f46e5 !important;
  fill: #e0e7ff;
}

.canvas-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  border-top: 1px solid #e2e8f0;
  background-color: #ffffff;
  font-size: 0.6rem;
  color: #64748b;
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