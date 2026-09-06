<template>
  <div class="app-root">
    <!-- View Switcher -->
    <WelcomeView
      v-if="currentView === 'welcome'"
      @start="startSimulator"
      @show-instructions="showInstructionsModal"
    />
    
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
    />

    <!-- General Purpose Custom Modal -->
    <CustomModal
      :show="modalConfig.show"
      :title="modalConfig.title"
      :label-text="modalConfig.labelText"
      :placeholder="modalConfig.placeholder"
      :type="modalConfig.type"
      :initial-value="modalConfig.initialValue"
      :delete-button-text="modalConfig.deleteButtonText"
      @close="closeModal"
      @submit="handleModalSubmit"
      @delete="handleModalDelete"
    />

    <!-- Matrix Modal -->
    <MatrixModal
      :show="showMatrix"
      :nodes="nodes"
      :edges="edges"
      @close="showMatrix = false"
    />

    <!-- Selector de Grafos Guardados -->
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
          
          <div 
            class="graph-item graph-item-new"
            @click="createNewGraph"
          >
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
import { ref, reactive, onMounted } from 'vue'
import WelcomeView from './components/WelcomeView.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import CustomModal from './components/CustomModal.vue'
import MatrixModal from './components/MatrixModal.vue'

// Routing State
const currentView = ref('welcome')

// Graph State
const nodes = ref([])
const edges = ref([])

// Modal Controller State
const modalConfig = reactive({
  show: false,
  title: '',
  labelText: '',
  placeholder: '',
  type: 'input',
  initialValue: '',
  deleteButtonText: '',
  onSubmitCallback: null,
  onDeleteCallback: null
})

// Matrix Modal State
const showMatrix = ref(false)

// Graph Selector State
const showGraphSelector = ref(false)
const savedGraphs = ref([])
const currentGraphIndex = ref(-1)

// Cargar lista de grafos guardados al iniciar
onMounted(() => {
  loadSavedGraphsList()
})

// ============ FUNCIONES DE GUARDADO ============

// Guardar grafo actual
// Guardar grafo actual
const saveGraph = (name = null) => {
  // Si no se proporciona nombre, usar el existente o crear uno nuevo
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

// Cargar todos los grafos guardados
const loadSavedGraphsList = () => {
  const saved = localStorage.getItem('savedGraphs')
  savedGraphs.value = saved ? JSON.parse(saved) : []
}

// Cargar un grafo específico
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

// Eliminar un grafo guardado
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

// Crear nuevo grafo vacío
const createNewGraph = () => {
  nodes.value = []
  edges.value = []
  currentGraphIndex.value = -1
  showGraphSelector.value = false
  currentView.value = 'canvas'
  setTimeout(() => {
    saveGraph('Nuevo Grafo')
  }, 100)
}

// ============ FUNCIONES DE NAVEGACIÓN ============

const startSimulator = () => {
  showGraphSelector.value = true
}

const backToWelcome = () => {
  currentView.value = 'welcome'
}

const showInstructionsModal = () => {
  window.open('/manual_grafos.pdf', '_blank')
}

const showMatrixModal = () => {
  showMatrix.value = true
}

// ============ FUNCIONES DEL MODAL ============

const closeModal = () => {
  modalConfig.show = false
}

const handleModalSubmit = (value) => {
  if (modalConfig.onSubmitCallback) {
    modalConfig.onSubmitCallback(value)
  }
  closeModal()
}

const handleModalDelete = () => {
  if (modalConfig.onDeleteCallback) {
    modalConfig.onDeleteCallback()
  }
  closeModal()
}

// ============ FUNCIONES DEL CANVAS ============

// 1. Create Node
const handleCreateNodeRequest = ({ x, y }) => {
  modalConfig.title = 'Crear Nuevo Nodo'
  modalConfig.labelText = 'Etiqueta / Nombre del Nodo'
  modalConfig.placeholder = 'Ej. A, V1, Terminal...'
  modalConfig.type = 'input'
  modalConfig.initialValue = ''
  modalConfig.onSubmitCallback = (value) => {
    const label = String(value).trim()
    if (!label) return
    
    const newNode = {
      id: 'node_' + Date.now(),
      label,
      x,
      y
    }
    nodes.value.push(newNode)
  }
  modalConfig.onDeleteCallback = null
  modalConfig.show = true
}

// 2. Create Edge
const handleCreateEdgeRequest = ({ sourceId, targetId }) => {
  const existingEdge = edges.value.find(e => e.sourceId === sourceId && e.targetId === targetId)
  if (existingEdge) {
    handleEditEdgeRequest(existingEdge)
    return
  }

  modalConfig.title = 'Crear Nueva Conexión'
  modalConfig.labelText = 'Peso / Valor numérico de la arista'
  modalConfig.placeholder = 'Ej. 5, 20, -2'
  modalConfig.type = 'number'
  modalConfig.initialValue = 1
  modalConfig.onSubmitCallback = (value) => {
    const weight = Number(value)
    if (isNaN(weight)) return
    
    const newEdge = {
      id: 'edge_' + Date.now(),
      sourceId,
      targetId,
      weight
    }
    edges.value.push(newEdge)
  }
  modalConfig.onDeleteCallback = null
  modalConfig.show = true
}

// 3. Edit Node
const handleEditNodeRequest = (node) => {
  modalConfig.title = 'Editar Nodo'
  modalConfig.labelText = 'Nombre / Etiqueta'
  modalConfig.placeholder = 'Ej. A, V1...'
  modalConfig.type = 'edit-node'
  modalConfig.initialValue = node.label
  modalConfig.deleteButtonText = 'Eliminar Nodo'
  
  modalConfig.onSubmitCallback = (value) => {
    const label = String(value).trim()
    if (!label) return
    const index = nodes.value.findIndex(n => n.id === node.id)
    if (index !== -1) {
      nodes.value[index] = {
        ...nodes.value[index],
        label: label
      }
    }
  }
  
  modalConfig.onDeleteCallback = () => {
    nodes.value = nodes.value.filter(n => n.id !== node.id)
    edges.value = edges.value.filter(e => e.sourceId !== node.id && e.targetId !== node.id)
  }
  
  modalConfig.show = true
}

// 4. Edit Edge
const handleEditEdgeRequest = (edge) => {
  modalConfig.title = 'Editar Peso de Conexión'
  modalConfig.labelText = 'Peso Numérico de la Arista'
  modalConfig.placeholder = 'Ej. 10, -5...'
  modalConfig.type = 'edit-edge'
  modalConfig.initialValue = edge.weight
  modalConfig.deleteButtonText = 'Eliminar Arista'
  
  modalConfig.onSubmitCallback = (value) => {
    const weight = Number(value)
    if (isNaN(weight)) return
    
    const index = edges.value.findIndex(e => e.id === edge.id)
    if (index !== -1) {
      edges.value[index] = {
        ...edges.value[index],
        weight: weight
      }
    }
  }
  
  modalConfig.onDeleteCallback = () => {
    edges.value = edges.value.filter(e => e.id !== edge.id)
  }
  
  modalConfig.show = true
}

// 5. Clear Canvas
const confirmClearCanvas = () => {
  modalConfig.title = '¿Limpiar Todo el Lienzo?'
  modalConfig.labelText = 'Se eliminarán todos los nodos y conexiones actuales. Esta acción no se puede deshacer.'
  modalConfig.type = 'confirm'
  modalConfig.initialValue = ''
  modalConfig.onSubmitCallback = () => {
    nodes.value = []
    edges.value = []
  }
  modalConfig.onDeleteCallback = null
  modalConfig.show = true
}

// 6. BOTÓN GUARDAR - CONFIRMACIÓN ANTES DE GUARDAR
// 6. BOTÓN GUARDAR - CON NOMBRE PERSONALIZADO
const handleSaveGraph = () => {
  if (nodes.value.length === 0 && edges.value.length === 0) {
    modalConfig.title = '⚠️ Grafo Vacío'
    modalConfig.labelText = 'No hay nodos ni aristas para guardar.'
    modalConfig.type = 'confirm'
    modalConfig.initialValue = ''
    modalConfig.deleteButtonText = ''
    modalConfig.onSubmitCallback = null
    modalConfig.onDeleteCallback = null
    modalConfig.show = true
    return
  }
  
  // Obtener el nombre actual del grafo
  let currentName = 'Grafo sin nombre'
  if (currentGraphIndex.value >= 0 && currentGraphIndex.value < savedGraphs.value.length) {
    currentName = savedGraphs.value[currentGraphIndex.value].name || currentName
  }
  
  // Pedir nombre con el valor actual
  modalConfig.title = '💾 Guardar Grafo'
  modalConfig.labelText = 'Nombre del grafo:'
  modalConfig.placeholder = 'Ej. Grafo Clase, Red Social...'
  modalConfig.type = 'input'
  modalConfig.initialValue = currentName  // ← Usa el nombre actual
  modalConfig.deleteButtonText = ''
  modalConfig.onSubmitCallback = (name) => {
    const graphName = String(name).trim() || 'Grafo sin nombre'
    
    // Guardar con el nombre elegido
    saveGraph(graphName)
    
    // Mostrar confirmación
    modalConfig.title = '✅ Guardado Correctamente'
    modalConfig.labelText = `"${graphName}" guardado con ${nodes.value.length} nodos y ${edges.value.length} aristas.`
    modalConfig.type = 'confirm'
    modalConfig.initialValue = ''
    modalConfig.deleteButtonText = ''
    modalConfig.onSubmitCallback = null
    modalConfig.onDeleteCallback = null
    modalConfig.show = true
  }
  modalConfig.onDeleteCallback = null
  modalConfig.show = true
}
</script>

<style scoped>
.app-root {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #0b0f19;
  color: #f1f5f9;
  position: relative;
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