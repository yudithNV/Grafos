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
      @clear="confirmClearCanvas"
      @create-node="handleCreateNodeRequest"
      @create-edge="handleCreateEdgeRequest"
      @edit-node="handleEditNodeRequest"
      @edit-edge="handleEditEdgeRequest"
    />

    <!-- Matrix Modal -->
    <MatrixModal
      :show="showMatrix"
      :nodes="nodes"
      :edges="edges"
      @close="showMatrix = false"
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import WelcomeView from './components/WelcomeView.vue'
import GraphCanvas from './components/GraphCanvas.vue'

import MatrixModal from './components/MatrixModal.vue'

import CustomModal from './components/CustomModal.vue'

// Routing State
const currentView = ref('welcome') // 'welcome' | 'canvas'
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
  // Callbacks for submission and deletion
  onSubmitCallback: null,
  onDeleteCallback: null
})

//agrega estado de la matriz de adyacencia
const showMatrix = ref(false)

const startSimulator = () => {
  currentView.value = 'canvas'
}

const backToWelcome = () => {
  currentView.value = 'welcome'
}

const showInstructionsModal = () => {
  window.open('/manual_grafos.pdf', '_blank')
}

//agrega manejador de la matriz de adyacencia
const showMatrixModal = () => {
  showMatrix.value = true
}

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

// Canvas Interactions

// 1. Create Node Request
const handleCreateNodeRequest = ({ x, y }) => {
  modalConfig.title = 'Crear Nuevo Nodo'
  modalConfig.labelText = 'Etiqueta / Nombre del Nodo'
  modalConfig.placeholder = 'Ej. A, V1, Terminal...'
  modalConfig.type = 'input'
  modalConfig.initialValue = ''
  modalConfig.onSubmitCallback = (value) => {
    const label = String(value).trim()
    if (!label) return
    
    // Add node at exact canvas location clicked
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

// 2. Create Edge Request
const handleCreateEdgeRequest = ({ sourceId, targetId }) => {
  // Check if connection in this exact direction already exists
  const existingEdge = edges.value.find(e => e.sourceId === sourceId && e.targetId === targetId)
  if (existingEdge) {
    // If it exists, redirect to edit it
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

// 3. Edit Node Request
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
    node.label = label
  }
  
  modalConfig.onDeleteCallback = () => {
    // Remove the node
    nodes.value = nodes.value.filter(n => n.id !== node.id)
    // Cascade delete connected edges
    edges.value = edges.value.filter(e => e.sourceId !== node.id && e.targetId !== node.id)
  }
  
  modalConfig.show = true
}

// 4. Edit Edge Request
// 4. Edit Edge Request - ¡VERSIÓN CORREGIDA!
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
    
    // ✅ CORRECTO: Reemplazar el edge en el array
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

// 5. Confirm clear canvas
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
</style>
