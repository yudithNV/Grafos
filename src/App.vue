<template>
  <div class="app-root" :class="{ 'app-root-fixed': currentView === 'canvas' }">
    <!-- Navbar -->
    <Navbar
      v-if="currentView !== 'canvas'"
      :current="currentView"
      :theme="theme"
      @navigate="goTo"
      @toggle-theme="toggleTheme"
    />

    <!-- Views -->
    <HomeView
      v-if="currentView === 'home'"
      mode="home"
      @select="onSelectAlgorithm"
    />

    <HomeView
      v-else-if="currentView === 'algoritmos'"
      mode="algoritmos"
      @select="onSelectAlgorithm"
    />

    <AboutView v-else-if="currentView === 'about'" />

    <GraphCanvas
      v-else-if="currentView === 'canvas'"
      :nodes="nodes"
      :edges="edges"
      @back="backToWelcome"
      @show-instructions="showInstructionsModal"
      @show-matrix="showMatrixModal"
      @save="handleSaveGraph"
      @clear="confirmClearCanvas"
      @create-node="handleCreateNodeRequest"
      @create-edge="handleCreateEdgeRequest"
      @edit-node="handleEditNodeRequest"
      @edit-edge="handleEditEdgeRequest"
      @delete-node="handleDeleteNodeRequest"
      @delete-edge="handleDeleteEdgeRequest"
    />

    <!-- Custom Modal -->
    <CustomModal
      v-model="showModal"
      :title="modalTitle"
      :label="modalLabel"
      :placeholder="modalPlaceholder"
      :type="modalType"
      :message="modalMessage"
      :initial-value="modalInitialValue"
      @submit="handleModalSubmit"
    />

    <!-- Matrix Modal -->
    <MatrixModal
      :show="showMatrix"
      :nodes="nodes"
      :edges="edges"
      @close="showMatrix = false"
    />

    <Footer v-if="currentView !== 'canvas'" />

    <!-- Graph Selector -->
    <div v-if="showGraphSelector" class="graph-selector-overlay" @click.self="showGraphSelector = false">
      <div class="graph-selector-modal">
        <div class="graph-selector-header">
          <h3>Cargar Grafo Guardado</h3>
          <button @click="showGraphSelector = false" class="btn-close-selector">✕</button>
        </div>
        <div class="graph-selector-list">
          <div 
            v-for="(graph, index) in savedGraphs" 
            :key="index"
            class="graph-item"
            @click="loadSelectedGraph(index)"
          >
            <div class="graph-item-info">
              <span class="graph-item-name">{{ graph.name || `Grafo ${index + 1}` }}</span>
              <span class="graph-item-date">{{ graph.date }}</span>
            </div>
            <div class="graph-item-stats">
              <span>{{ graph.nodes.length }} nodos</span>
              <span>{{ graph.edges.length }} aristas</span>
            </div>
            <button @click.stop="deleteSavedGraph(index)" class="btn-delete-graph">🗑️</button>
          </div>
          
          <div class="graph-item graph-item-new" @click="createNewGraph">
            <div class="graph-item-info">
              <span class="graph-item-name" style="color: #4f46e5; font-size: 1rem;">
                ➕ Crear Nuevo Grafo
              </span>
              <span class="graph-item-date">Empezar desde cero</span>
            </div>
          </div>
          
          <div v-if="savedGraphs.length === 0" class="empty-graphs">
            <p>No hay grafos guardados</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem;">Haz clic en "Crear Nuevo Grafo" para empezar</p>
          </div>
        </div>
        <div class="graph-selector-footer">
          <button @click="showGraphSelector = false" class="btn-cancel-selector">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import Navbar from './components/Navbar.vue'
import HomeView from './components/HomeView.vue'
import AboutView from './components/AboutView.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import CustomModal from './components/CustomModal.vue'
import MatrixModal from './components/MatrixModal.vue'
import Footer from './components/Footer.vue'

// Routing
const currentView = ref('home')
const scrollToAlgorithms = () => {
  const carousel = document.getElementById('algorithms-carousel')
  carousel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const goTo = async (view) => {
  if (view === 'algoritmos') {
    currentView.value = 'home'
    await nextTick()
    scrollToAlgorithms()
    return
  }

  currentView.value = view
  if (view === 'home') {
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(currentView, (view) => {
  document.body.classList.toggle('canvas-lock', view === 'canvas')
}, { immediate: true })

// Tema
const theme = ref(localStorage.getItem('theme') || 'light')
const applyTheme = (value) => {
  document.documentElement.setAttribute('data-theme', value)
}
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

watch(theme, (value) => {
  localStorage.setItem('theme', value)
  applyTheme(value)
}, { immediate: true })

// Graph State
const nodes = ref([])
const edges = ref([])

// Modal State
const showModal = ref(false)
const modalTitle = ref('')
const modalLabel = ref('')
const modalPlaceholder = ref('')
const modalType = ref('input')
const modalMessage = ref('')
const modalInitialValue = ref('')
let modalCallback = null

// Matrix Modal
const showMatrix = ref(false)

// Graph Selector
const showGraphSelector = ref(false)
const savedGraphs = ref([])
const currentGraphIndex = ref(-1)

onMounted(() => {
  loadSavedGraphsList()
})

// ============ FUNCIONES DEL MODAL ============

const openModal = ({ title, label, placeholder, type, initialValue, message, callback }) => {
  modalTitle.value = title || ''
  modalLabel.value = label || ''
  modalPlaceholder.value = placeholder || ''
  modalType.value = type || 'input'
  modalMessage.value = message || ''
  modalInitialValue.value = initialValue ?? ''
  modalCallback = callback
  showModal.value = true
}

const handleModalSubmit = (value) => {
  if (modalCallback) {
    modalCallback(value)
    modalCallback = null
  }
}

// ============ FUNCIONES DEL CANVAS ============

const handleCreateNodeRequest = ({ x, y }) => {
  openModal({
    title: 'Crear Nuevo Nodo',
    label: 'Etiqueta / Nombre del Nodo',
    placeholder: 'Ej. A, V1, Terminal...',
    type: 'input',
    callback: (value) => {
      const label = String(value).trim()
      if (!label) return
      nodes.value.push({
        id: 'node_' + Date.now(),
        label,
        x,
        y
      })
    }
  })
}

const handleCreateEdgeRequest = ({ sourceId, targetId }) => {
  const existingEdge = edges.value.find(e => e.sourceId === sourceId && e.targetId === targetId)
  if (existingEdge) {
    handleEditEdgeRequest(existingEdge)
    return
  }

  openModal({
    title: 'Crear Nueva Conexión',
    label: 'Peso / Valor numérico de la arista',
    placeholder: 'Ej. 5, 20, -2',
    type: 'number',
    initialValue: 1,
    callback: (value) => {
      const weight = Number(value)
      if (isNaN(weight)) return
      edges.value.push({
        id: 'edge_' + Date.now(),
        sourceId,
        targetId,
        weight
      })
    }
  })
}

const handleEditNodeRequest = (node) => {
  openModal({
    title: 'Editar Nodo',
    label: 'Nombre / Etiqueta',
    placeholder: 'Ej. A, V1...',
    type: 'input',
    initialValue: node.label,
    callback: (value) => {
      const label = String(value).trim()
      if (!label) return
      const index = nodes.value.findIndex(n => n.id === node.id)
      if (index !== -1) {
        nodes.value[index] = { ...nodes.value[index], label }
      }
    }
  })
}

const handleEditEdgeRequest = (edge) => {
  openModal({
    title: 'Editar Peso de Conexión',
    label: 'Peso Numérico de la Arista',
    placeholder: 'Ej. 10, -5...',
    type: 'number',
    initialValue: edge.weight,
    callback: (value) => {
      const weight = Number(value)
      if (isNaN(weight)) return
      const index = edges.value.findIndex(e => e.id === edge.id)
      if (index !== -1) {
        edges.value[index] = { ...edges.value[index], weight }
      }
    }
  })
}

const handleDeleteNodeRequest = (nodeId) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return
  
  openModal({
    title: 'Confirmar Eliminación',
    message: `¿Eliminar el nodo "${node.label}" y todas sus conexiones?`,
    type: 'confirm',
    callback: () => {
      nodes.value = nodes.value.filter(n => n.id !== nodeId)
      edges.value = edges.value.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId)
    }
  })
}

const handleDeleteEdgeRequest = (edgeId) => {
  const edge = edges.value.find(e => e.id === edgeId)
  if (!edge) return
  
  const source = nodes.value.find(n => n.id === edge.sourceId)
  const target = nodes.value.find(n => n.id === edge.targetId)
  const label = `${source?.label || '?'} → ${target?.label || '?'}`
  
  openModal({
    title: 'Confirmar Eliminación',
    message: `¿Eliminar la arista ${label} con peso ${edge.weight}?`,
    type: 'confirm',
    callback: () => {
      edges.value = edges.value.filter(e => e.id !== edgeId)
    }
  })
}

const confirmClearCanvas = () => {
  openModal({
    title: '¿Limpiar Todo el Lienzo?',
    message: 'Se eliminarán todos los nodos y conexiones actuales. Esta acción no se puede deshacer.',
    type: 'confirm',
    callback: () => {
      nodes.value = []
      edges.value = []
    }
  })
}

// ============ GUARDADO ============

const saveGraph = (name = null) => {
  let finalName = name
  if (!finalName) {
    if (currentGraphIndex.value >= 0 && currentGraphIndex.value < savedGraphs.value.length) {
      finalName = savedGraphs.value[currentGraphIndex.value].name
    } else {
      finalName = `Grafo ${new Date().toLocaleString()}`
    }
  }
  
  const data = {
    name: finalName,
    date: new Date().toLocaleString(),
    nodes: nodes.value,
    edges: edges.value
  }
  
  const saved = localStorage.getItem('savedGraphs')
  let graphs = saved ? JSON.parse(saved) : []
  
  if (currentGraphIndex.value >= 0 && currentGraphIndex.value < graphs.length) {
    graphs[currentGraphIndex.value] = data
  } else {
    graphs.push(data)
    currentGraphIndex.value = graphs.length - 1
  }
  
  localStorage.setItem('savedGraphs', JSON.stringify(graphs))
  loadSavedGraphsList()
}

const handleSaveGraph = () => {
  if (nodes.value.length === 0 && edges.value.length === 0) {
    openModal({
      title: '⚠️ Grafo Vacío',
      message: 'No hay nodos ni aristas para guardar.',
      type: 'confirm'
    })
    return
  }
  
  let currentName = 'Grafo sin nombre'
  if (currentGraphIndex.value >= 0 && currentGraphIndex.value < savedGraphs.value.length) {
    currentName = savedGraphs.value[currentGraphIndex.value].name || currentName
  }
  
  openModal({
    title: '💾 Guardar Grafo',
    label: 'Nombre del grafo:',
    placeholder: 'Ej. Grafo Clase, Red Social...',
    type: 'input',
    initialValue: currentName,
    callback: (name) => {
      const graphName = String(name).trim() || 'Grafo sin nombre'
      saveGraph(graphName)
      
      // Mostrar confirmación
      openModal({
        title: '✅ Guardado Correctamente',
        message: `"${graphName}" guardado con ${nodes.value.length} nodos y ${edges.value.length} aristas.`,
        type: 'confirm'
      })
    }
  })
}

// ============ OTRAS FUNCIONES ============

const onSelectAlgorithm = (id) => {
  if (id === 'grafos') {
    showGraphSelector.value = true
    return
  }
  openModal({
    title: '🚧 Próximamente',
    message: 'Este algoritmo todavía está en construcción.',
    type: 'confirm'
  })
}

const loadSavedGraphsList = () => {
  const saved = localStorage.getItem('savedGraphs')
  savedGraphs.value = saved ? JSON.parse(saved) : []
}

const loadSelectedGraph = (index) => {
  const graph = savedGraphs.value[index]
  if (graph) {
    nodes.value = JSON.parse(JSON.stringify(graph.nodes))
    edges.value = JSON.parse(JSON.stringify(graph.edges))
    currentGraphIndex.value = index
    showGraphSelector.value = false
    currentView.value = 'canvas'
  }
}

const deleteSavedGraph = (index) => {
  if (confirm('¿Eliminar este grafo guardado?')) {
    const graphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]')
    graphs.splice(index, 1)
    localStorage.setItem('savedGraphs', JSON.stringify(graphs))
    loadSavedGraphsList()
    if (currentGraphIndex.value === index) {
      currentGraphIndex.value = -1
    }
  }
}

const createNewGraph = () => {
  nodes.value = []
  edges.value = []
  currentGraphIndex.value = -1
  showGraphSelector.value = false
  currentView.value = 'canvas'
  setTimeout(() => saveGraph('Nuevo Grafo'), 100)
}

const backToWelcome = () => {
  currentView.value = 'home'
}

const showInstructionsModal = () => {
  window.open('/manual_grafos.pdf', '_blank')
}

const showMatrixModal = () => {
  showMatrix.value = true
}
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-body);
  color: var(--text-primary);
  position: relative;
}

.app-root-fixed {
  height: 100vh;
  overflow: hidden;
}

/* ========== GRAPH SELECTOR ========== */
.graph-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.graph-selector-modal {
  background-color: #ffffff;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.graph-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.graph-selector-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.btn-close-selector {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  width: 2rem;
  height: 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.btn-close-selector:hover {
  background: rgba(255, 255, 255, 0.3);
}

.graph-selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.graph-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.graph-item:hover {
  background-color: #eef2ff;
  border-color: #c7d2fe;
  transform: translateX(4px);
}

.graph-item-new {
  border: 2px dashed #c7d2fe !important;
  background-color: #eef2ff !important;
}

.graph-item-new:hover {
  background-color: #e0e7ff !important;
  border-color: #4f46e5 !important;
}

.graph-item-info {
  flex: 1;
  min-width: 0;
}

.graph-item-name {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.graph-item-date {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
}

.graph-item-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}

.btn-delete-graph {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
  opacity: 0.6;
}

.btn-delete-graph:hover {
  background: #fee2e2;
  opacity: 1;
  transform: scale(1.1);
}

.empty-graphs {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
}

.graph-selector-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-cancel-selector {
  padding: 0.5rem 1.5rem;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #475569;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-cancel-selector:hover {
  background-color: #e2e8f0;
}

@media (max-width: 480px) {
  .graph-selector-modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 0.75rem;
  }
  .graph-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .graph-item-stats {
    font-size: 0.65rem;
  }
}
</style>
