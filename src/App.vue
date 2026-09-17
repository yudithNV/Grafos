<template>
  <div class="app-root" :class="{ 'app-root-fixed': currentView === 'canvas' }">
    <!-- Navbar -->
    <Navbar v-if="currentView !== 'canvas'" :current="currentView" :theme="theme" @navigate="goTo"
      @toggle-theme="toggleTheme" />

    <!-- Views -->
    <HomeView v-if="currentView === 'home'" @select="onSelectAlgorithm" @navigate="goTo" />

    <TheoryView v-else-if="currentView === 'teoria'" />

    <InteractiveView v-else-if="currentView === 'interactivos'" @select="onSelectAlgorithm" />

    <AboutView v-else-if="currentView === 'about'" />

    <GraphCanvas
      v-if="currentView === 'canvas' && selectedAlgorithm === 'grafos'"
      :nodes="nodes"
      :edges="edges"
      :mode="canvasMode"
      algorithm-type="grafos"
      @back="backToWelcome"
      @show-instructions="showInstructionsModal"
      @show-matrix="showMatrixModal"
      @save="handleSaveGraph"
      @open-load="openLoadFromCanvas"
      @clear="confirmClearCanvas"
      @create-node="handleCreateNodeRequest"
      @create-edge="handleCreateEdgeRequest"
      @edit-node="handleEditNodeRequest"
      @edit-edge="handleEditEdgeRequest"
      @delete-node="handleDeleteNodeRequest"
      @delete-edge="handleDeleteEdgeRequest"
    />
    <GraphCanvas
      v-else-if="currentView === 'canvas' && selectedAlgorithm === 'johnson'"
      :nodes="nodes"
      :edges="edges"
      :mode="canvasMode"
      @back="backToWelcome"
      @show-instructions="showInstructionsModal"
      @show-matrix="showMatrixModal"
      @save="handleSaveGraph"
      @open-load="openLoadFromCanvas"
      @clear="confirmClearCanvas"
      @create-node="handleCreateNodeRequest"
      @create-edge="handleCreateEdgeRequest"
      @edit-node="handleEditNodeRequest"
      @edit-edge="handleEditEdgeRequest"
      @delete-node="handleDeleteNodeRequest"
      @delete-edge="handleDeleteEdgeRequest"
    />
    <!-- Módulo Aislado del Algoritmo de Asignación -->
    <AssignmentCanvas
      v-else-if="currentView === 'canvas' && selectedAlgorithm === 'asignacion'"
      :nodes="nodes"
      :edges="edges"
      :optimal-edge-ids="optimalAssignmentEdges"
      algorithm-type="asignacion"
      @back="backToWelcome"
      @show-instructions="showInstructionsModal"
      @show-matrix="showMatrixModal"
      @save="handleSaveGraph"
      @open-load="openLoadAssignmentFromCanvas"
      @clear="confirmClearCanvas"
      @create-node="handleCreateNodeRequest"
      @create-edge="handleCreateEdgeRequest"
      @edit-node="handleEditNodeRequest"
      @edit-edge="handleEditEdgeRequest"
      @delete-node="handleDeleteNodeRequest"
      @delete-edge="handleDeleteEdgeRequest"
      @clear-optimal="optimalAssignmentEdges = []"
      @solution-found="handleSolutionFound"
    />

    <!-- Custom Modal -->
    <CustomModal
      v-model="showModal"
      :icon-name="modalIconName" 
      :title="modalTitle"
      :label="modalLabel"
      :placeholder="modalPlaceholder"
      :type="modalType"
      :message="modalMessage"
      :initial-value="modalInitialValue"
      :quick-fill="modalQuickFill"
      :quick-fill-value="modalQuickFillValue"
      :show-color-picker="modalShowColorPicker"
      :initial-color="modalInitialColor"
      @submit="handleModalSubmit"
    />

    <!-- Matrix Modal -->
    <MatrixModal
      :show="showMatrix"
      :nodes="nodes"
      :edges="edges"
      :show-solver="selectedAlgorithm === 'asignacion'"
      :algorithm-type="selectedAlgorithm"
      :mode="canvasMode"
      @close="showMatrix = false"
      @solution-found="handleSolutionFound"
    />

    <Footer v-if="currentView !== 'canvas'" />

    <!-- Graph Selector para Pizarra de Grafos -->
    <div v-if="showGraphSelector" class="graph-selector-overlay" @click.self="showGraphSelector = false">
      <div class="graph-selector-modal">
        <div class="graph-selector-header">
          <h3>{{ selectedAlgorithm === 'johnson' ? 'Cargar Grafo Johnson' : 'Cargar Grafo Guardado' }}</h3>
          <button @click="showGraphSelector = false" class="btn-close-selector">✕</button>
        </div>
        <div class="assignment-selector-info">
          {{
            selectedAlgorithm === 'johnson'
              ? 'En Johnson crea un grafo dirigido aciclico con pesos no negativos para calcular ruta critica, ida, regreso y holguras.'
              : 'En este modo puedes crear grafos con aristas de ida y vuelta, auto-bucles y pesos negativos.'
          }}
        </div>
        <div class="graph-selector-list">
          <div v-for="(graph, index) in savedGraphs" :key="index" class="graph-item" @click="loadSelectedGraph(index)">
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
              <span class="graph-item-name graph-item-name-new">
                {{ selectedAlgorithm === 'johnson' ? 'Crear Nuevo Grafo Johnson' : 'Crear Nuevo Grafo' }}
              </span>
              <span class="graph-item-date">Empezar desde cero</span>
            </div>
          </div>

          <div v-if="savedGraphs.length === 0" class="empty-graphs">
            <p>No hay grafos guardados</p>
            <p class="empty-graphs-hint">Haz clic en "Crear Nuevo Grafo" para empezar</p>
          </div>
        </div>
        <div class="graph-selector-footer">
          <button @click="showGraphSelector = false" class="btn-cancel-selector">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Graph Selector para Algoritmo de Asignación (Unidireccional) -->
    <div v-if="showAssignmentGraphSelector" class="graph-selector-overlay" @click.self="showAssignmentGraphSelector = false">
      <div class="graph-selector-modal">
        <div class="graph-selector-header header-assignment-selector">
          <div class="selector-title-group">
            <h3>Cargar Grafo de Asignación</h3>
            <span class="badge-selector-unidirectional"> Flujo Unidireccional</span>
          </div>
          <button @click="showAssignmentGraphSelector = false" class="btn-close-selector">✕</button>
        </div>
        <div class="assignment-selector-info">
          En este modo todas las aristas son estrictamente de ida (sin retornos ni auto-bucles).
        </div>
        <div class="graph-selector-list">
          <div 
            v-for="(graph, index) in savedAssignmentGraphs" 
            :key="'asig_' + index"
            class="graph-item"
            @click="loadSelectedAssignmentGraph(index)"
          >
            <div class="graph-item-info">
              <span class="graph-item-name">{{ graph.name || `Grafo Asignación ${index + 1}` }}</span>
              <span class="graph-item-date">{{ graph.date }}</span>
            </div>
            <div class="graph-item-stats">
              <span>{{ graph.nodes.length }} nodos</span>
              <span>{{ graph.edges.length }} aristas</span>
            </div>
            <button @click.stop="deleteSavedAssignmentGraph(index)" class="btn-delete-graph">🗑️</button>
          </div>
          
          <div class="graph-item graph-item-new" @click="createNewAssignmentGraph">
            <div class="graph-item-info">
              <span class="graph-item-name graph-item-name-new">
                ➕ Crear Nuevo Grafo de Asignación
              </span>
              <span class="graph-item-date">Empezar desde cero en flujo unidireccional</span>
            </div>
          </div>
          
          <div v-if="savedAssignmentGraphs.length === 0" class="empty-graphs">
            <p>No hay grafos de asignación guardados</p>
            <p class="empty-graphs-hint">Haz clic en "Crear Nuevo Grafo de Asignación" para empezar</p>
          </div>
        </div>
        <div class="graph-selector-footer">
          <button @click="showAssignmentGraphSelector = false" class="btn-cancel-selector">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import Navbar from './components/Navbar.vue'
import HomeView from './components/HomeView.vue'
import TheoryView from './components/TheoryView.vue'
import InteractiveView from './components/InteractiveView.vue'
import AboutView from './components/AboutView.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import CustomModal from './components/CustomModal.vue'
import MatrixModal from './components/MatrixModal.vue'
import Footer from './components/Footer.vue'
import AssignmentCanvas from './components/AssignmentCanvas.vue'

// Routing

const currentView = ref('home')
const selectedAlgorithm = ref('grafos')
const optimalAssignmentEdges = ref([])
const showAssignmentGraphSelector = ref(false)
const savedAssignmentGraphs = ref([])
const canvasMode = ref('normal')
const goTo = async (view) => {
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
const modalQuickFill = ref(false)
const modalQuickFillValue = ref('')
let modalCallback = null
const modalShowColorPicker = ref(false)
const modalInitialColor = ref('#64748b')

// Matrix Modal
const showMatrix = ref(false)

// Graph Selector
const showGraphSelector = ref(false)
const savedGraphs = ref([])
const currentGraphIndex = ref(-1)

onMounted(() => {
  loadSavedGraphsList()
})


// Modal Icon
const modalIconName = ref('')

// ============ FUNCIONES DEL MODAL ============

const openModal = ({ title, label, placeholder, type, initialValue, message, callback, quickFill, quickFillValue, showColorPicker, initialColor, iconName }) => {
  modalTitle.value = title || ''
  modalLabel.value = label || ''
  modalPlaceholder.value = placeholder || ''
  modalType.value = type || 'input'
  modalMessage.value = message || ''
  modalInitialValue.value = initialValue ?? ''
  modalQuickFill.value = quickFill || false
  modalQuickFillValue.value = quickFillValue || ''
  modalShowColorPicker.value = showColorPicker || false
  modalInitialColor.value = initialColor || '#64748b'
  modalIconName.value = iconName || ''
  modalCallback = callback
  showModal.value = true
}

const handleModalSubmit = (payload) => {
  if (modalCallback) {
    // Si el modal tenía selector de color, payload es un objeto {value, color}
    if (modalShowColorPicker.value && typeof payload === 'object' && payload.value !== undefined) {
      modalCallback(payload.value, payload.color)
    } else {
      // Si no, payload es solo el valor
      modalCallback(payload)
    }
    modalCallback = null
  }
}

// ============ FUNCIONES DEL CANVAS ============

// Convierte un numero (1, 2, 3...) a letras tipo columnas de Excel (A, B, ... Z, AA, AB...)
const numberToLetters = (num) => {
  let letters = ''
  while (num > 0) {
    const remainder = (num - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    num = Math.floor((num - 1) / 26)
  }
  return letters
}

// Calcula la siguiente letra disponible: A, B, C... (y AA, AB... si se acaba el alfabeto)
const getNextQuickName = () => {
  const usedNumbers = nodes.value
    .map(n => {
      if (!/^[A-Z]+$/.test(n.label)) return null
      let num = 0
      for (const char of n.label) {
        num = num * 26 + (char.charCodeAt(0) - 64)
      }
      return num
    })
    .filter(n => n !== null)

  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1
  return numberToLetters(nextNumber)
}

const handleCreateNodeRequest = ({ x, y }) => {
  openModal({
    title: 'Crear Nuevo Nodo',
    label: 'Etiqueta / Nombre del Nodo',
    placeholder: 'Ej. A, V1, Terminal...',
    type: 'input',
    quickFill: true,
    quickFillValue: getNextQuickName(),
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

  // Regla "Duplicidad": un nodo no puede conectarse a OTRO nodo que tenga
  // exactamente el mismo nombre (sensible a mayúsculas/minúsculas: "A" no
  // puede conectarse a otra "A", pero sí puede conectarse a "a"). No aplica
  // a los bucles (un nodo conectándose a sí mismo), que siguen permitidos.
  if (sourceId !== targetId) {
    const sourceNode = nodes.value.find(n => n.id === sourceId)
    const targetNode = nodes.value.find(n => n.id === targetId)
    if (sourceNode && targetNode && sourceNode.label === targetNode.label) {
      openModal({
        title: '⚠️ Conexión no permitida (Duplicidad)',
        message: `No puedes conectar "${sourceNode.label}" con otro nodo que tenga exactamente el mismo nombre. Cambia el nombre de uno de los dos, o usa mayúsculas/minúsculas distintas (por ejemplo "A" y "a" sí se pueden conectar).`,
        type: 'confirm'
      })
      return
    }
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

      // En Johnson no permitir pesos negativos
      if (canvasMode.value === 'johnson' && weight < 0) {

        setTimeout(() => {
          openModal({
            title: '⚠️ Peso no permitido',
            message: 'En Johnson no se permiten valores negativos. Ingresa un valor mayor o igual a 0.',
            type: 'confirm'
          })
        }, 150)

        return
      }

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
    showColorPicker: true,
    initialColor: node.color || '#64748b',
    callback: (value, color) => {
      const label = String(value).trim()
      if (!label) return
      const index = nodes.value.findIndex(n => n.id === node.id)
      if (index !== -1) {
        nodes.value[index] = { 
          ...nodes.value[index], 
          label,
          color: color || '#64748b'
        }
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
    showColorPicker: true,
    initialColor: edge.color || '#64748b',
    callback: (value, color) => {
      const weight = Number(value)

      if (isNaN(weight)) return

      // En Johnson no permitir pesos negativos
      // En Johnson no permitir pesos negativos
      if (canvasMode.value === 'johnson' && weight < 0) {

        setTimeout(() => {
          openModal({
            title: '⚠️ Peso no permitido',
            message: 'En Johnson no se permiten valores negativos. Ingresa un valor mayor o igual a 0.',
            type: 'confirm'
          })
        }, 150)

        return
      }

      const index = edges.value.findIndex(e => e.id === edge.id)

      if (index !== -1) {
        edges.value[index] = { 
          ...edges.value[index], 
          weight,
          color: color || '#64748b'
        }
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
  const isAssignment = selectedAlgorithm.value === 'asignacion'
  const storageKey = isAssignment ? 'savedAssignmentGraphs' : 'savedGraphs'
  const currentList = isAssignment ? savedAssignmentGraphs.value : savedGraphs.value

  let finalName = name
  if (!finalName) {
    const currentGraph = isAssignment
      ? currentList[currentGraphIndex.value]
      : currentList.find(graph => graph._storageIndex === currentGraphIndex.value)
    if (currentGraph) {
      finalName = currentGraph.name
    } else {
      finalName = `${isAssignment ? 'Grafo Asignación' : 'Grafo'} ${new Date().toLocaleString()}`
    }
  }

  // Nombre automático
  if (!finalName) {
    finalName = `Grafo ${new Date().toLocaleString()}`
  }

  const data = {
    name: finalName,
    date: new Date().toLocaleString(),

    // IMPORTANTE:
    // guardar si pertenece a Pizarra o Johnson
    mode: canvasMode.value,

    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }
  const saved = localStorage.getItem(storageKey)
  let graphs = saved ? JSON.parse(saved) : []

  if (currentGraphIndex.value >= 0 && currentGraphIndex.value < graphs.length) {
    graphs[currentGraphIndex.value] = data
  }
  else {
    graphs.push(data)
    currentGraphIndex.value = graphs.length - 1
  }
  localStorage.setItem(storageKey, JSON.stringify(graphs))
  if (isAssignment) {
    loadSavedAssignmentGraphsList()
  } else {
    loadSavedGraphsList()
  }
}

const handleSaveGraph = () => {
  if (nodes.value.length === 0 && edges.value.length === 0) {
    openModal({
      title: 'Grafo Vacío',
      iconName: 'warning',         // ← agrega esto
      message: 'No hay nodos ni aristas para guardar.',
      type: 'confirm'
    })
    return
  }
  const isAssignment = selectedAlgorithm.value === 'asignacion'
  const currentList = isAssignment ? savedAssignmentGraphs.value : savedGraphs.value
  let currentName = isAssignment ? 'Grafo Asignación sin nombre' : 'Grafo sin nombre'
  const currentGraph = isAssignment
    ? currentList[currentGraphIndex.value]
    : currentList.find(graph => graph._storageIndex === currentGraphIndex.value)
  if (currentGraph?.name) {
    currentName = currentGraph.name
  }

  openModal({
    title: 'Guardar Grafo',
    iconName: 'save',  
    label: 'Nombre del grafo:',
    placeholder: 'Ej. Grafo Clase, Red Social...',
    type: 'input',
    initialValue: currentName,
    callback: (name) => {
      const graphName = String(name).trim() || currentName
      saveGraph(graphName)
      
      setTimeout(() => {
        openModal({
          title: 'Guardado Correctamente',
          iconName: 'success',
          message: `"${graphName}" guardado con ${nodes.value.length} nodos y ${edges.value.length} aristas.`,
          type: 'info'   // 👈 antes 'confirm'
        })
      }, 250)  // espera a que el primer modal termine de cerrarse
    }
  })
}

// ============ OTRAS FUNCIONES ============

const onSelectAlgorithm = (id) => {
  if (!id) return
  selectedAlgorithm.value = id

  if (id === 'grafos') {
    canvasMode.value = 'normal'
    nodes.value = []
    edges.value = []
    currentGraphIndex.value = -1
    loadSavedGraphsList()
    showGraphSelector.value = true

    return
  }

  if (id === 'asignacion') {
    canvasMode.value = 'normal'
    loadSavedAssignmentGraphsList()
    showAssignmentGraphSelector.value = true
    return
  }

  if (id === 'johnson') {
    canvasMode.value = 'johnson'

    nodes.value = []
    edges.value = []
    currentGraphIndex.value = -1

    // Cargar SOLO grafos Johnson
    loadSavedGraphsList()

    // Mostrar el mismo selector
    showGraphSelector.value = true

    return
  }
  openModal({
    title: 'Próximamente',
    iconName: 'construction',    // ← agrega esto
    message: 'Este algoritmo todavía está en construcción.',
    type: 'confirm'
  })
}

// Abre el selector de grafos guardados SIN salir del lienzo (Pizarra / Johnson).
const openLoadFromCanvas = () => {
  currentGraphIndex.value = -1
  loadSavedGraphsList()
  showGraphSelector.value = true
}

// Igual que arriba, pero para el selector propio del modo Asignación.
const openLoadAssignmentFromCanvas = () => {
  loadSavedAssignmentGraphsList()
  showAssignmentGraphSelector.value = true
}

const loadSavedGraphsList = () => {
  const saved = localStorage.getItem('savedGraphs')
  const allGraphs = saved ? JSON.parse(saved) : []

  // Filtrar según el modo actual
  savedGraphs.value = allGraphs
    .map((graph, storageIndex) => ({
      ...graph,

      // Los grafos viejos que no tienen mode
      // se consideran grafos normales de Pizarra
      mode: graph.mode || 'normal',

      // Guardamos la posición REAL en localStorage
      _storageIndex: storageIndex
    }))
    .filter(graph => graph.mode === canvasMode.value)
}

const loadSavedAssignmentGraphsList = () => {
  const saved = localStorage.getItem('savedAssignmentGraphs')
  savedAssignmentGraphs.value = saved ? JSON.parse(saved) : []
}

const loadSelectedGraph = (index) => {
  const graph = savedGraphs.value[index]
  if (graph) {
    canvasMode.value = graph.mode || (selectedAlgorithm.value === 'johnson' ? 'johnson' : 'normal')
    nodes.value = JSON.parse(JSON.stringify(graph.nodes))
    edges.value = JSON.parse(JSON.stringify(graph.edges))
    optimalAssignmentEdges.value = []
    currentGraphIndex.value = graph._storageIndex ?? index
    showGraphSelector.value = false
    currentView.value = 'canvas'
  }
}

const loadSelectedAssignmentGraph = (index) => {
  const graph = savedAssignmentGraphs.value[index]
  if (graph) {
    nodes.value = JSON.parse(JSON.stringify(graph.nodes))
    edges.value = JSON.parse(JSON.stringify(graph.edges))
    optimalAssignmentEdges.value = []
    currentGraphIndex.value = index
    showAssignmentGraphSelector.value = false
    currentView.value = 'canvas'
  }
}

const deleteSavedGraph = (index) => {
  const graph = savedGraphs.value[index]

  if (!graph) return

  openModal({
    title: 'Confirmar Eliminación',

    message:
      `¿Eliminar el grafo "${graph.name || `Grafo ${index + 1}`}"? Esta acción no se puede deshacer.`,

    type: 'confirm',

    callback: () => {
      const graphs =
        JSON.parse(
          localStorage.getItem('savedGraphs') || '[]'
        )

      // Índice REAL dentro de localStorage
      const storageIndex =
        graph._storageIndex

      graphs.splice(storageIndex, 1)

      localStorage.setItem(
        'savedGraphs',
        JSON.stringify(graphs)
      )

      if (
        currentGraphIndex.value === storageIndex
      ) {
        currentGraphIndex.value = -1
      }

      // Volver a cargar solamente
      // los grafos del modo actual
      loadSavedGraphsList()
    }
  })
}

const deleteSavedAssignmentGraph = (index) => {
  const graph = savedAssignmentGraphs.value[index]
  if (!graph) return
  
  openModal({
    title: 'Confirmar Eliminación',
    message: `¿Eliminar el grafo de asignación "${graph.name || `Grafo ${index + 1}`}"? Esta acción no se puede deshacer.`,
    type: 'confirm',
    callback: () => {
      const graphs = JSON.parse(localStorage.getItem('savedAssignmentGraphs') || '[]')
      graphs.splice(index, 1)
      localStorage.setItem('savedAssignmentGraphs', JSON.stringify(graphs))
      loadSavedAssignmentGraphsList()
      if (currentGraphIndex.value === index) {
        currentGraphIndex.value = -1
      }
    }
  })
}

const createNewGraph = () => {
  canvasMode.value = selectedAlgorithm.value === 'johnson' ? 'johnson' : 'normal'
  nodes.value = []
  edges.value = []
  optimalAssignmentEdges.value = []
  currentGraphIndex.value = -1
  showGraphSelector.value = false
  currentView.value = 'canvas'
}

const createNewAssignmentGraph = () => {
  nodes.value = []
  edges.value = []
  optimalAssignmentEdges.value = []
  currentGraphIndex.value = -1
  showAssignmentGraphSelector.value = false
  currentView.value = 'canvas'
}

const handleSolutionFound = (result) => {
  optimalAssignmentEdges.value = result.optimalEdgeIds || []
}

const backToWelcome = () => {
  currentView.value = 'home'
}

const showInstructionsModal = (manual = 'grafos') => {
  const file = {
    asignacion: '/manual_asignacion.pdf',
    johnson: '/manual_grafos.pdf',
    grafos: '/Manual_Graphix_Dark.pdf'
  }[manual] || '/Manual_Graphix_Dark.pdf'

  window.open(file, '_blank')
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

/* ========== GRAPH SELECTOR - ADAPTADO A TEMA ========== */
.graph-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
   pointer-events: auto; /* 🔥 asegura que capture clicks */
}

.graph-selector-modal {
  position: relative;
  z-index: 1;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px var(--shadow-color);
  overflow: hidden;
  color: var(--text-primary);
}

.graph-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-start, #a855f7) 0%, var(--accent-end, #d946ef) 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.header-assignment-selector {
  background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%) !important;
}

.selector-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge-selector-unidirectional {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.assignment-selector-info {
  background: rgba(2, 132, 199, 0.08);
  border-bottom: 1px solid rgba(2, 132, 199, 0.2);
  padding: 0.6rem 1.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
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
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-primary);
}

.graph-item:hover {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  transform: translateX(4px);
}

.graph-item-new {
  border: 2px dashed var(--accent-solid) !important;
  background-color: var(--accent-soft-bg) !important;
}

.graph-item-new:hover {
  background-color: var(--accent-soft-bg) !important;
  filter: brightness(1.05);
}

.graph-item-info {
  flex: 1;
  min-width: 0;
}

.graph-item-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.graph-item-name-new {
  color: var(--accent-solid);
  font-size: 1rem;
}

.graph-item-date {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.graph-item-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-delete-graph {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
  opacity: 0.7;
}

.btn-delete-graph:hover {
  background: rgba(239, 68, 68, 0.2);
  opacity: 1;
  transform: scale(1.1);
}

.empty-graphs {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-graphs-hint {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.graph-selector-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-cancel-selector {
  padding: 0.5rem 1.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-cancel-selector:hover {
  background-color: var(--bg-surface);
  border-color: var(--accent-solid);
  color: var(--text-primary);
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