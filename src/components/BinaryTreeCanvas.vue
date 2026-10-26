<template>
  <div class="tree-workspace">
    <div class="tree-header">
      <div class="header-left">
        <button class="icon-button" title="Volver" @click="emit('back')"><ArrowLeft :size="19" /></button>
        <div>
          <h1>{{ isGeneralTree ? 'Árbol Binario General' : 'Árbol Binario de Búsqueda' }} <span class="status-dot"></span></h1>
          <p>{{ isGeneralTree ? 'Gestiona la estructura reconstruida y explora sus recorridos.' : 'Inserta valores y explora cómo se organiza y recorre un BST.' }}</p>
        </div>
      </div>
      <div class="tree-stats"><span>Nodos <strong>{{ nodeCount }}</strong></span><span>Niveles <strong>{{ height }}</strong></span></div>
      <div class="header-actions">
        <button @click="saveTree"><Save :size="16" />Guardar</button>
        <button @click="emit('open-load')"><FolderOpen :size="16" />Cargar</button>
        <button @click="emit('show-instructions', 'arboles-binarios')"><BookOpen :size="16" />Manual</button>
        <button class="danger-action" @click="showClearConfirmation = true"><Trash2 :size="16" />Limpiar</button>
      </div>
    </div>

    <main class="tree-main">
      <aside class="control-panel">
        <div class="panel-heading"><GitFork :size="18" /><div><h2>Operaciones</h2><p>Gestiona el árbol</p></div></div>

        <div class="operations-tabs" role="tablist" aria-label="Pestañas de operaciones">
          <button
            type="button"
            class="operations-tab"
            :class="{ active: operationsTab === 'construction' }"
            role="tab"
            :aria-selected="operationsTab === 'construction'"
            @click="operationsTab = 'construction'"
          >
            Construcción de Árbol
          </button>
          <button
            type="button"
            class="operations-tab"
            :class="{ active: operationsTab === 'reconstruction' }"
            role="tab"
            :aria-selected="operationsTab === 'reconstruction'"
            @click="operationsTab = 'reconstruction'"
          >
            Reconstrucción de Árbol
          </button>
        </div>

        <template v-if="operationsTab === 'construction'">
          <form v-if="!isGeneralTree" class="operation-form" @submit.prevent="insertValue">
            <label for="insert-value">Insertar nodo</label>
            <div class="input-row">
              <input id="insert-value" v-model="insertInput" type="number" step="any" placeholder="Ej. 42" required />
              <button class="primary-button" aria-label="Insertar"><Plus :size="18" /></button>
            </div>
            <p class="reconstruction-note">Se ubicará automáticamente comparando: menor a la izquierda, mayor a la derecha.</p>
          </form>
          <form class="operation-form" @submit.prevent="deleteValue">
            <label for="delete-value">Eliminar nodo</label>
            <div class="input-row">
              <input id="delete-value" v-model="deleteInput" type="number" step="any" placeholder="Valor a eliminar" required />
              <button class="secondary-button" aria-label="Eliminar"><Minus :size="18" /></button>
            </div>
          </form>
          <form class="operation-form" @submit.prevent="searchValue">
            <label for="search-value">Buscar valor</label>
            <div class="input-row">
              <input id="search-value" v-model="searchInput" type="number" step="any" placeholder="Valor a buscar" required />
              <button class="secondary-button" aria-label="Buscar"><Search :size="18" /></button>
            </div>
          </form>

          <form v-if="isGeneralTree" class="operation-form general-insert-form" @submit.prevent="insertValue">
            <label for="general-insert-value">Agregar nodo al árbol</label>
            <input id="general-insert-value" v-model="insertInput" type="number" step="any" placeholder="Nuevo valor" required />
            <template v-if="nodeCount">
              <label for="parent-node">Nodo padre</label>
              <select id="parent-node" v-model="parentNodeValue" required>
                <option value="" disabled>Selecciona el padre</option>
                <option v-for="node in availableParents" :key="node.id" :value="String(node.value)">{{ node.value }}</option>
              </select>
              <label for="child-side">Ubicación del nuevo hijo</label>
              <select id="child-side" v-model="childSide" required>
                <option value="left" :disabled="selectedParent?.left">Hijo izquierdo{{ selectedParent?.left ? ' (ocupado)' : '' }}</option>
                <option value="right" :disabled="selectedParent?.right">Hijo derecho{{ selectedParent?.right ? ' (ocupado)' : '' }}</option>
              </select>
            </template>
            <p v-else class="reconstruction-note">El valor ingresado será la raíz del árbol.</p>
            <button class="reconstruct-button" type="submit"><Plus :size="16" /> Agregar nodo</button>
          </form>
        </template>

        <template v-else>
          <section class="reconstruction-panel">
            <div class="reconstruction-heading"><GitFork :size="16" /><h3>Reconstrucción de árbol</h3></div>
            <label for="reconstruction-order">Recorridos disponibles</label>
            <select id="reconstruction-order" v-model="reconstructionOrder">
              <option value="pre-in">Preorden + Inorden</option>
              <option value="post-in">Postorden + Inorden</option>
            </select>
            <template v-if="reconstructionOrder === 'pre-in'">
              <label for="preorder-input">Preorden</label>
              <textarea id="preorder-input" v-model="preorderInput" rows="2" placeholder="Ej. 3, 9, 20, 15, 7"></textarea>
            </template>
            <template v-else>
              <label for="postorder-input">Postorden</label>
              <textarea id="postorder-input" v-model="postorderInput" rows="2" placeholder="Ej. 9, 15, 7, 20, 3"></textarea>
            </template>
            <label for="inorder-input">Inorden</label>
            <textarea id="inorder-input" v-model="inorderInput" rows="2" placeholder="Ej. 9, 3, 15, 20, 7"></textarea>
            <button class="reconstruct-button" type="button" @click="reconstructTree">
              <GitFork :size="16" /> Reconstruir árbol
            </button>
            <p v-if="isGeneralTree && nodeCount" class="reconstruction-note">
              Modo árbol general: agrega eligiendo padre y lado; al eliminar, el nodo más profundo y derecho ocupa su lugar.
            </p>
          </section>
        </template>

        <div class="divider"></div>
        <label for="traversal-select" class="traversal-label">Recorrido a explicar</label>
        <select id="traversal-select" v-model="selectedTraversal">
          <option value="inorder">Inorden (izq. · raíz · der.)</option>
          <option value="preorder">Preorden (raíz · izq. · der.)</option>
          <option value="postorder">Postorden (izq. · der. · raíz)</option>
        </select>
        <button class="resolve-button" :disabled="nodeCount === 0" @click="resolveTraversal">
          <Sparkles :size="17" /> Resolver / Recorridos
        </button>
        <p class="operation-message" :class="{ error: messageType === 'error' }" aria-live="polite">{{ message }}</p>
      </aside>

      <section class="canvas-card">
        <div class="canvas-toolbar">
          <div><span class="live-indicator"></span>Visualización interactiva</div>
          <span>{{ isGeneralTree ? 'Árbol binario reconstruido' : 'Los valores menores van a la izquierda' }}</span>
        </div>
        <div class="tree-scroll">
          <div v-if="!layout.nodes.length" class="empty-state">
            <div class="empty-tree-icon"><GitFork :size="28" /></div>
            <h2>Lienzo vacío</h2>
            <p>Inserta un valor desde el panel para crear la raíz del árbol binario.</p>
          </div>
          <svg v-else class="tree-svg" :viewBox="`0 0 ${layout.width} ${layout.height}`"
            :style="{ width: `${layout.width}px`, minWidth: `${layout.width}px`, height: `${layout.height}px` }" role="img" aria-label="Visualización del árbol binario">
            <g class="branches">
              <line v-for="edge in layout.edges" :key="edge.id" :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" />
            </g>
            <g class="traversal-paths" aria-label="Camino del recorrido">
              <path
                v-for="edge in traversalPaths"
                :key="edge.id"
                :d="edge.path"
                :style="{ animationDelay: `${edge.index * 90}ms` }"
              />
            </g>
            <g v-for="node in layout.nodes" :key="node.id" class="tree-node"
              :class="{ highlighted: node.id === highlightedNodeId }" :transform="`translate(${node.x} ${node.y})`">
              <circle r="27" />
              <text text-anchor="middle" dominant-baseline="central">{{ node.value }}</text>
            </g>
          </svg>
        </div>
        <div v-if="traversalResult.sequence?.length" class="traversal-vector">
          <div class="traversal-vector-heading">
            <ListOrdered :size="16" />
            <strong>Resultado {{ traversalResult.traversal }}:</strong>
            <code>[{{ traversalResult.sequence.join(', ') }}]</code>
          </div>
          <div class="traversal-vector-items" aria-label="Valores del recorrido">
            <span v-for="(value, index) in traversalResult.sequence" :key="`${index}-${value}`">{{ value }}</span>
          </div>
        </div>
        <div v-if="lastSearch" class="search-result" :class="{ found: lastSearch.found }">
          <CheckCircle2 v-if="lastSearch.found" :size="16" /><CircleX v-else :size="16" />
          {{ lastSearch.found ? `Valor ${lastSearch.value} encontrado` : `Valor ${lastSearch.value} no encontrado` }}
        </div>
      </section>
    </main>

    <Transition name="fade">
      <div v-if="showClearConfirmation" class="confirm-backdrop" @click.self="showClearConfirmation = false">
        <div class="confirm-card">
          <h3>¿Limpiar el árbol?</h3><p>Se eliminarán todos los nodos. Esta acción no se puede deshacer.</p>
          <div><button @click="showClearConfirmation = false">Cancelar</button><button class="confirm-danger" @click="clearTree">Limpiar</button></div>
        </div>
      </div>
    </Transition>

    <BinaryTreeStepsModal :show="showSteps" :result="traversalResult" @close="showSteps = false"
      @step-change="highlightedNodeId = $event" @path-change="traversalSequence = $event" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  ArrowLeft, BookOpen, CheckCircle2, CircleX, FolderOpen, GitFork, ListOrdered,
  Minus, Plus, Save, Search, Sparkles, Trash2
} from '@lucide/vue'
import {
  BinarySearchTree,
  construirDesdePostIn,
  construirDesdePreIn,
  createBinarySearchTree
} from '../utils/binaryTreeSolver'
import BinaryTreeStepsModal from './BinaryTreeStepsModal.vue'

const props = defineProps({ initialData: { type: Object, default: null } })
const emit = defineEmits(['back', 'save', 'open-load', 'show-instructions', 'clear'])
const isSearchTree = (root) => {
  const pending = root ? [{ node: root, minimum: -Infinity, maximum: Infinity }] : []
  while (pending.length) {
    const { node, minimum, maximum } = pending.pop()
    if (node.value <= minimum || node.value >= maximum) return false
    if (node.left) pending.push({ node: node.left, minimum, maximum: node.value })
    if (node.right) pending.push({ node: node.right, minimum: node.value, maximum })
  }
  return true
}
const makeTree = (data) => data?.structure
  ? new BinarySearchTree(data.structure)
  : createBinarySearchTree(Array.isArray(data?.values) ? data.values : [])
const tree = ref(makeTree(props.initialData))
const isGeneralTree = ref(props.initialData?.mode === 'general'
  || Boolean(props.initialData?.structure && !isSearchTree(props.initialData.structure)))
const insertInput = ref('')
const deleteInput = ref('')
const searchInput = ref('')
const parentNodeValue = ref('')
const childSide = ref('left')
const reconstructionOrder = ref('pre-in')
const preorderInput = ref('')
const inorderInput = ref('')
const postorderInput = ref('')
const selectedTraversal = ref('inorder')
const operationsTab = ref('construction')
const message = ref('')
const messageType = ref('')
const highlightedNodeId = ref(null)
const traversalSequence = ref([])
const lastSearch = ref(null)
const showSteps = ref(false)
const showClearConfirmation = ref(false)
const traversalResult = ref({ traversal: '', order: '', steps: [], sequence: [] })
let searchTimer = null

watch(() => props.initialData, (data) => {
  tree.value = makeTree(data)
  isGeneralTree.value = data?.mode === 'general'
    || Boolean(data?.structure && !isSearchTree(data.structure))
  parentNodeValue.value = ''
}, { deep: true })
const nodesList = computed(() => {
  const nodes = []
  const edges = []
  let maxDepth = 0
  const pending = tree.value.root ? [{ node: tree.value.root, depth: 0, parentId: null }] : []
  while (pending.length) {
    const { node, depth, parentId } = pending.pop()
    const item = { ...node, depth, x: 0, y: 82 + depth * 122 }
    maxDepth = Math.max(maxDepth, depth)
    nodes.push(item)
    if (parentId) edges.push({ id: `${parentId}-${node.id}`, parentId, childId: node.id })
    if (node.right) pending.push({ node: node.right, depth: depth + 1, parentId: node.id })
    if (node.left) pending.push({ node: node.left, depth: depth + 1, parentId: node.id })
  }
  return { nodes, edges, maxDepth }
})
const layout = computed(() => {
  const { nodes, edges, maxDepth } = nodesList.value
  const width = Math.max(760, nodes.length * 88 + 120)
  const height = Math.max(460, (maxDepth + 1) * 122 + 95)
  const gap = Math.max(72, Math.min(112, width / Math.max(nodes.length + 1, 2)))
  const byId = new Map()
  const depths = new Map(nodes.map((node) => [node.id, node.depth]))
  let positionIndex = 0
  const pending = []
  let current = tree.value.root
  while (current || pending.length) {
    while (current) {
      pending.push(current)
      current = current.left
    }
    current = pending.pop()
    byId.set(current.id, {
      x: 58 + (positionIndex + 0.5) * gap,
      y: 82 + depths.get(current.id) * 122
    })
    positionIndex += 1
    current = current.right
  }
  const positionedNodes = nodes.map((node) => ({ ...node, ...(byId.get(node.id) || {}) }))
  const positions = new Map(positionedNodes.map((node) => [node.id, node]))
  return {
    width: Math.max(width, positionedNodes.length ? Math.max(...positionedNodes.map((node) => node.x)) + 70 : width),
    height,
    nodes: positionedNodes,
    edges: edges.map((edge) => {
      const parent = positions.get(edge.parentId)
      const child = positions.get(edge.childId)
      return { ...edge, x1: parent.x, y1: parent.y + 24, x2: child.x, y2: child.y - 24 }
    })
  }
})
const nodeCount = computed(() => nodesList.value.nodes.length)
const height = computed(() => nodeCount.value ? nodesList.value.maxDepth + 1 : 0)
const selectedParent = computed(() => nodesList.value.nodes.find(
  (node) => String(node.value) === parentNodeValue.value
))
const availableParents = computed(() => nodesList.value.nodes.filter((node) => !node.left || !node.right))
const traversalPaths = computed(() => {
  const positions = new Map(layout.value.nodes.map((node) => [node.value, node]))
  return traversalSequence.value.slice(1).flatMap((value, index) => {
    const from = positions.get(traversalSequence.value[index])
    const to = positions.get(value)
    if (!from || !to) return []
    const midpointX = (from.x + to.x) / 2
    const midpointY = (from.y + to.y) / 2
    const bend = Math.max(24, Math.min(64, Math.abs(to.x - from.x) * 0.18))
    const controlY = midpointY + (to.x >= from.x ? -bend : bend)
    return [{
      id: `${index}-${from.id}-${to.id}`,
      index,
      path: `M ${from.x} ${from.y} Q ${midpointX} ${controlY} ${to.x} ${to.y}`
    }]
  })
})
watch(parentNodeValue, () => {
  const parent = selectedParent.value
  if (parent) childSide.value = parent.left ? 'right' : 'left'
})
watch(parentNodeValue, () => {
  const parent = selectedParent.value
  if (parent) childSide.value = parent.left ? 'right' : 'left'
})

function clearSearchTimer() {
  if (searchTimer) clearInterval(searchTimer)
  searchTimer = null
}
function showMessage(text, type = '') {
  message.value = text
  messageType.value = type
}
function clearTraversalResult() {
  traversalResult.value = { traversal: '', order: '', steps: [], sequence: [] }
}
function insertValue() {
  clearSearchTimer()
  traversalSequence.value = []
  clearTraversalResult()
  if (isGeneralTree.value) {
    const value = Number(insertInput.value)
    const parent = selectedParent.value
    const parentNode = parent ? findTreeNodeById(parent.id) : null
    if (!Number.isFinite(value)) {
      showMessage('Ingresa un valor numérico válido.', 'error')
      return
    }
    if (nodesList.value.nodes.some((node) => node.value === value)) {
      showMessage(`El valor ${value} ya existe en el árbol.`, 'error')
      return
    }
    if (!tree.value.root) {
      const node = { id: `bst-${++tree.value.nextId}`, value, left: null, right: null }
      tree.value.root = node
      insertInput.value = ''
      highlightedNodeId.value = node.id
      lastSearch.value = null
      showMessage(`Nodo ${value} agregado como raíz del árbol.`)
      return
    }
    if (!parentNode) {
      showMessage('Selecciona un nodo padre para agregar el nodo.', 'error')
      return
    }
    if (parentNode[childSide.value]) {
      showMessage(`El lado ${childSide.value === 'left' ? 'izquierdo' : 'derecho'} ya está ocupado.`, 'error')
      return
    }
    const node = { id: `bst-${++tree.value.nextId}`, value, left: null, right: null }
    parentNode[childSide.value] = node
    insertInput.value = ''
    parentNodeValue.value = ''
    highlightedNodeId.value = node.id
    lastSearch.value = null
    showMessage(`Nodo ${value} agregado como hijo ${childSide.value === 'left' ? 'izquierdo' : 'derecho'} de ${parentNode.value}.`)
    return
  }

  const result = tree.value.insert(insertInput.value)
  if (!result.inserted) {
    showMessage(`El valor ${result.node.value} ya existe en el árbol.`, 'error')
    return
  }
  insertInput.value = ''
  highlightedNodeId.value = result.node.id
  lastSearch.value = null
  showMessage(`Nodo ${result.node.value} insertado correctamente.`)
}
function deleteValue() {
  clearSearchTimer()
  traversalSequence.value = []
  const value = Number(deleteInput.value)
  if (isGeneralTree.value) {
    const queue = tree.value.root ? [{ node: tree.value.root, parent: null, side: null }] : []
    let target = null
    let last = null
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]
      last = current
      if (current.node.value === value) target = current
      if (current.node.left) queue.push({ node: current.node.left, parent: current.node, side: 'left' })
      if (current.node.right) queue.push({ node: current.node.right, parent: current.node, side: 'right' })
    }
    deleteInput.value = ''
    clearTraversalResult()
    highlightedNodeId.value = null
    lastSearch.value = null
    if (!target || !last) {
      showMessage(`No existe el valor ${value} en el árbol.`, 'error')
      return
    }
    if (target.node === last.node) {
      if (!last.parent) tree.value.root = null
      else last.parent[last.side] = null
      parentNodeValue.value = ''
      showMessage(`Nodo ${value} eliminado.`)
      return
    }
    target.node.value = last.node.value
    last.parent[last.side] = null
    parentNodeValue.value = ''
    showMessage(`Nodo ${value} eliminado; el nodo más profundo y derecho (${last.node.value}) ocupó su lugar.`)
    return
  }

  clearTraversalResult()
  const result = tree.value.delete(value)
  deleteInput.value = ''
  highlightedNodeId.value = null
  lastSearch.value = null
  showMessage(result.removed ? `Nodo ${value} eliminado.` : `No existe el valor ${value} en el árbol.`, result.removed ? '' : 'error')
}
function searchValue() {
  clearSearchTimer()
  traversalSequence.value = []
  const value = Number(searchInput.value)
  clearTraversalResult()
  const result = isGeneralTree.value ? searchGeneralTree(value) : tree.value.search(value)
  lastSearch.value = { value, found: result.found }
  highlightedNodeId.value = null
  let index = 0
  if (!result.steps.length) {
    showMessage('El árbol está vacío.', 'error')
    return
  }
  const animateNext = () => {
    const step = result.steps[index]
    if (!step) {
      clearSearchTimer()
      showMessage(result.found ? `Valor ${value} encontrado.` : `Valor ${value} no encontrado.`, result.found ? '' : 'error')
      return
    }
    highlightedNodeId.value = step.nodeId
    index += 1
  }
  animateNext()
  searchTimer = setInterval(animateNext, 550)
}
function findTreeNodeById(id) {
  const pending = tree.value.root ? [tree.value.root] : []
  while (pending.length) {
    const node = pending.pop()
    if (node.id === id) return node
    if (node.right) pending.push(node.right)
    if (node.left) pending.push(node.left)
  }
  return null
}
function searchGeneralTree(value) {
  const steps = []
  const pending = tree.value.root ? [tree.value.root] : []
  let foundNode = null
  while (pending.length) {
    const node = pending.pop()
    const found = node.value === value
    steps.push({
      nodeId: node.id,
      value: node.value,
      action: found ? 'found' : 'compare',
      direction: found ? null : 'children',
      stack: pending.map((item) => item.value)
    })
    if (found) {
      foundNode = node
      break
    }
    if (node.right) pending.push(node.right)
    if (node.left) pending.push(node.left)
  }
  return { tree: tree.value.getStructure(), found: Boolean(foundNode), node: foundNode, steps }
}
function resolveTraversal() {
  if (!nodeCount.value) return
  clearSearchTimer()
  traversalSequence.value = []
  traversalResult.value = tree.value.traverse(selectedTraversal.value)
  showSteps.value = true
}
function parseTraversalInput(raw, label) {
  const parts = raw.trim().split(/[\s,;]+/).filter(Boolean)
  if (!parts.length) throw new Error(`Ingresa el recorrido ${label}.`)
  const values = parts.map(Number)
  if (values.some((value) => !Number.isInteger(value))) {
    throw new Error(`El recorrido ${label} solo debe contener números enteros.`)
  }
  return values
}
function toInternalTree(root) {
  if (!root) return null
  let nextId = 1
  const converted = { id: `bst-${nextId++}`, value: root.valor, left: null, right: null }
  const pending = [{ source: root, target: converted }]
  while (pending.length) {
    const { source, target } = pending.pop()
    if (source.izquierda) {
      target.left = { id: `bst-${nextId++}`, value: source.izquierda.valor, left: null, right: null }
      pending.push({ source: source.izquierda, target: target.left })
    }
    if (source.derecha) {
      target.right = { id: `bst-${nextId++}`, value: source.derecha.valor, left: null, right: null }
      pending.push({ source: source.derecha, target: target.right })
    }
  }
  return converted
}
function reconstructTree() {
  try {
    const inorder = parseTraversalInput(inorderInput.value, 'inorden')
    const root = reconstructionOrder.value === 'pre-in'
      ? construirDesdePreIn(parseTraversalInput(preorderInput.value, 'preorden'), inorder)
      : construirDesdePostIn(parseTraversalInput(postorderInput.value, 'postorden'), inorder)
    clearSearchTimer()
    tree.value = new BinarySearchTree(toInternalTree(root))
    isGeneralTree.value = !isSearchTree(tree.value.root)
    highlightedNodeId.value = null
    traversalSequence.value = []
    lastSearch.value = null
    clearTraversalResult()
    parentNodeValue.value = ''
    showMessage(isGeneralTree.value
      ? `Árbol reconstruido con ${nodeCount.value} nodos. Conserva su estructura y agrega eligiendo padre y lado.`
      : `Árbol reconstruido con ${nodeCount.value} nodos. La inserción automática por comparación está habilitada.`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'No se pudo reconstruir el árbol.', 'error')
  }
}
function clearTree() {
  clearSearchTimer()
  tree.value = new BinarySearchTree()
  isGeneralTree.value = false
  highlightedNodeId.value = null
  traversalSequence.value = []
  clearTraversalResult()
  lastSearch.value = null
  showClearConfirmation.value = false
  showMessage('Árbol limpiado.')
  emit('clear')
}
function valuesPreorder() {
  const values = []
  const pending = tree.value.root ? [tree.value.root] : []
  while (pending.length) {
    const node = pending.pop()
    values.push(node.value)
    if (node.right) pending.push(node.right)
    if (node.left) pending.push(node.left)
  }
  return values
}
function saveTree() {
  if (!nodeCount.value) {
    showMessage('Inserta al menos un nodo antes de guardar.', 'error')
    return
  }
  emit('save', {
    values: valuesPreorder(),
    structure: tree.value.getStructure(),
    mode: isGeneralTree.value ? 'general' : 'bst'
  })
}
onBeforeUnmount(clearSearchTimer)
</script>

<style scoped>
.tree-workspace{height:100vh;min-height:560px;display:flex;flex-direction:column;overflow:hidden;background:#020617;color:#e2e8f0}
.tree-header{z-index:2;display:flex;align-items:center;gap:1rem;padding:.85rem 1.1rem;border-bottom:1px solid rgba(148,163,184,.15);background:rgba(15,23,42,.9);backdrop-filter:blur(16px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
.header-left{display:flex;align-items:center;gap:.8rem;min-width:260px;flex:1}.header-left h1{margin:0;font-size:1rem;font-weight:750;letter-spacing:.01em}.header-left p{margin:.25rem 0 0;color:#94a3b8;font-size:.72rem}.status-dot,.live-indicator{display:inline-block;width:.48rem;height:.48rem;margin-left:.3rem;border-radius:50%;background:#22d3ee;box-shadow:0 0 12px #22d3ee}
.icon-button{display:grid;place-items:center;width:2.25rem;height:2.25rem;border:1px solid #334155;border-radius:.65rem;background:#0f172a;color:#cbd5e1;cursor:pointer;transition:.2s}.icon-button:hover{border-color:#22d3ee;color:#67e8f9}
.tree-stats{display:flex;gap:.5rem}.tree-stats span{padding:.42rem .65rem;border:1px solid rgba(148,163,184,.17);border-radius:.6rem;background:rgba(2,6,23,.65);color:#94a3b8;font-size:.7rem}.tree-stats strong{margin-left:.2rem;color:#e2e8f0}
.header-actions{display:flex;gap:.4rem}.header-actions button{display:flex;align-items:center;gap:.4rem;padding:.55rem .65rem;border:1px solid #334155;border-radius:.65rem;background:rgba(15,23,42,.8);color:#cbd5e1;font-size:.72rem;font-weight:650;cursor:pointer;transition:.2s}.header-actions button:hover{border-color:#6366f1;background:#1e1b4b;color:#fff}.header-actions .danger-action:hover{border-color:#ef4444;background:#450a0a}
.tree-main{display:grid;grid-template-columns:290px minmax(0,1fr);gap:1rem;flex:1;min-height:0;padding:1rem;background:radial-gradient(ellipse at 65% 20%,rgba(30,64,175,.1),transparent 50%),#020617}
.control-panel,.canvas-card{border:1px solid rgba(148,163,184,.16);border-radius:1rem;background:rgba(15,23,42,.76);backdrop-filter:blur(14px);box-shadow:0 16px 50px rgba(0,0,0,.24)}
.control-panel{display:flex;flex-direction:column;gap:1rem;padding:1.1rem;overflow:auto}.panel-heading{display:flex;align-items:center;gap:.65rem;padding-bottom:.8rem;border-bottom:1px solid #1e293b;color:#67e8f9}.panel-heading h2{margin:0;color:#e2e8f0;font-size:.92rem}.panel-heading p{margin:.2rem 0 0;color:#64748b;font-size:.7rem}
.operations-tabs{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;padding:.35rem;border:1px solid rgba(148,163,184,.15);border-radius:.8rem;background:rgba(15,23,42,.7)}
.operations-tab{padding:.62rem .5rem;border:1px solid transparent;border-radius:.65rem;background:transparent;color:#94a3b8;font-size:.69rem;font-weight:700;cursor:pointer;transition:all .2s ease}.operations-tab.active{border-color:rgba(99,102,241,.7);background:rgba(79,70,229,.18);color:#e2e8f0;box-shadow:inset 0 0 0 1px rgba(129,140,248,.2)}
.operation-form{display:grid;gap:.4rem}.operation-form label,.traversal-label{color:#cbd5e1;font-size:.75rem;font-weight:650}.input-row{display:flex;gap:.4rem}.input-row input,.control-panel select{min-width:0;width:100%;padding:.62rem .7rem;border:1px solid #334155;border-radius:.65rem;outline:none;background:#020617;color:#e2e8f0;font-size:.78rem}.input-row input:focus,.control-panel select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.14)}.input-row input::placeholder{color:#475569}
.input-row button{display:grid;place-items:center;min-width:2.5rem;border:1px solid rgba(34,211,238,.35);border-radius:.65rem;background:rgba(8,145,178,.16);color:#67e8f9;cursor:pointer;transition:.2s}.input-row button:hover{background:#0e7490;color:white}.input-row .secondary-button{border-color:#475569;background:rgba(51,65,85,.35);color:#cbd5e1}.input-row .secondary-button:hover{border-color:#818cf8;background:#312e81}
.general-insert-form{padding:.75rem;border:1px solid rgba(34,211,238,.2);border-radius:.75rem;background:rgba(8,47,73,.2)}.general-insert-form>input,.general-insert-form>select{min-width:0;width:100%;padding:.58rem .65rem;border:1px solid #334155;border-radius:.6rem;outline:none;background:#020617;color:#e2e8f0;font-size:.75rem}.control-panel .general-insert-form>select{margin-top:0}.general-insert-form>input:focus,.general-insert-form>select:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.1)}.general-insert-form>label{margin-top:.25rem;color:#cbd5e1;font-size:.7rem;font-weight:650}
.reconstruction-panel{display:grid;gap:.45rem;padding:.8rem;border:1px solid rgba(99,102,241,.25);border-radius:.8rem;background:rgba(30,41,59,.38)}.reconstruction-heading{display:flex;align-items:center;gap:.45rem;margin-bottom:.15rem;color:#67e8f9}.reconstruction-heading h3{margin:0;color:#e2e8f0;font-size:.78rem}.reconstruction-panel>label{margin-top:.25rem;color:#cbd5e1;font-size:.7rem;font-weight:650}.reconstruction-panel select,.reconstruction-panel textarea{width:100%;min-width:0;margin-top:0;padding:.55rem .6rem;border:1px solid #334155;border-radius:.6rem;outline:none;background:#020617;color:#e2e8f0;font:inherit;font-size:.72rem}.control-panel .reconstruction-panel select{margin-top:0}.reconstruction-panel select:focus,.reconstruction-panel textarea:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}.reconstruction-panel textarea{resize:vertical;min-height:3rem;line-height:1.4}.reconstruction-panel textarea::placeholder{color:#475569}.reconstruct-button{display:flex;align-items:center;justify-content:center;gap:.4rem;margin-top:.25rem;padding:.58rem;border:1px solid rgba(99,102,241,.55);border-radius:.6rem;background:rgba(79,70,229,.2);color:#c7d2fe;font-size:.73rem;font-weight:700;cursor:pointer;transition:.2s}.reconstruct-button:hover{background:#3730a3;color:white}.reconstruction-note{margin:0;color:#fbbf24;font-size:.67rem;line-height:1.45}
.divider{height:1px;background:#1e293b}.control-panel select{margin-top:-.5rem}.resolve-button{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.72rem;border:1px solid rgba(99,102,241,.6);border-radius:.7rem;background:linear-gradient(120deg,#4f46e5,#0891b2);color:#fff;font-size:.78rem;font-weight:750;cursor:pointer;box-shadow:0 8px 22px rgba(79,70,229,.18);transition:transform .2s,filter .2s}.resolve-button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.12)}.resolve-button:disabled{opacity:.45;cursor:not-allowed}.operation-message{min-height:1.2rem;margin:0;color:#67e8f9;font-size:.73rem;line-height:1.45}.operation-message.error{color:#fca5a5}.canvas-card{position:relative;display:flex;flex-direction:column;min-width:0;overflow:hidden}.canvas-toolbar{display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.75rem 1rem;border-bottom:1px solid rgba(148,163,184,.12);color:#94a3b8;font-size:.7rem}.canvas-toolbar>div{display:flex;align-items:center;gap:.45rem;color:#cbd5e1}.live-indicator{width:.38rem;height:.38rem;margin:0}
.tree-scroll{position:relative;display:flex;flex:1;min-height:0;overflow:auto;align-items:flex-start;justify-content:center;background-image:radial-gradient(rgba(148,163,184,.12) .7px,transparent .7px);background-size:22px 22px}.tree-svg{display:block;flex:none;overflow:visible}.branches line{stroke:#475569;stroke-width:2.5;filter:drop-shadow(0 0 5px rgba(99,102,241,.2));transition:stroke .2s}.traversal-paths path{fill:none;stroke:#22d3ee;stroke-width:4;stroke-linecap:round;stroke-dasharray:11 8;filter:drop-shadow(0 0 7px rgba(34,211,238,.85));opacity:.95;animation:flow 1s linear infinite,draw-path .55s ease-out both}.tree-node circle{fill:#0f172a;stroke:#6366f1;stroke-width:2.5;filter:drop-shadow(0 0 10px rgba(99,102,241,.3));transition:all .25s}.tree-node text{fill:#e0e7ff;font-size:14px;font-weight:750;pointer-events:none}.tree-node.highlighted circle{fill:#164e63;stroke:#22d3ee;stroke-width:4;filter:drop-shadow(0 0 16px rgba(34,211,238,.8));animation:pulse .75s ease-in-out infinite alternate}.tree-node.highlighted text{fill:#cffafe}
.traversal-vector{display:grid;gap:.55rem;padding:.75rem 1rem;border-top:1px solid rgba(34,211,238,.2);background:rgba(8,47,73,.28)}.traversal-vector-heading{display:flex;align-items:center;flex-wrap:wrap;gap:.45rem;color:#cbd5e1;font-size:.75rem}.traversal-vector-heading svg{color:#67e8f9}.traversal-vector-heading code{color:#a5f3fc;font-size:.75rem}.traversal-vector-items{display:flex;flex-wrap:wrap;gap:.35rem;max-height:5rem;overflow:auto}.traversal-vector-items span{display:grid;place-items:center;min-width:1.8rem;height:1.8rem;padding:0 .35rem;border:1px solid rgba(34,211,238,.28);border-radius:.5rem;background:rgba(8,145,178,.12);color:#a5f3fc;font-size:.72rem;font-weight:700}
.empty-state{align-self:center;max-width:340px;padding:2rem;text-align:center}.empty-tree-icon{display:grid;place-items:center;width:3.5rem;height:3.5rem;margin:0 auto 1rem;border:1px solid rgba(34,211,238,.25);border-radius:1rem;background:rgba(8,145,178,.1);color:#67e8f9}.empty-state h2{margin:0;color:#e2e8f0;font-size:1rem}.empty-state p{color:#64748b;font-size:.78rem;line-height:1.55}
.search-result{position:absolute;right:1rem;bottom:1rem;display:flex;align-items:center;gap:.45rem;padding:.6rem .8rem;border:1px solid rgba(248,113,113,.3);border-radius:.7rem;background:rgba(69,10,10,.8);color:#fecaca;font-size:.75rem;backdrop-filter:blur(8px)}.search-result.found{border-color:rgba(34,211,238,.3);background:rgba(8,47,73,.85);color:#a5f3fc}
.confirm-backdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:1rem;background:rgba(2,6,23,.75);backdrop-filter:blur(6px)}.confirm-card{width:min(390px,100%);padding:1.25rem;border:1px solid #334155;border-radius:1rem;background:#0f172a;box-shadow:0 20px 60px #0008}.confirm-card h3{margin:0 0 .5rem}.confirm-card p{color:#94a3b8;font-size:.85rem;line-height:1.5}.confirm-card>div{display:flex;justify-content:flex-end;gap:.55rem;margin-top:1.2rem}.confirm-card button{padding:.55rem .8rem;border:1px solid #334155;border-radius:.6rem;background:#1e293b;color:#cbd5e1;cursor:pointer}.confirm-card button.confirm-danger{border-color:#b91c1c;background:#991b1b;color:white}
.fade-enter-active,.fade-leave-active{transition:opacity .18s}.fade-enter-from,.fade-leave-to{opacity:0}@keyframes pulse{to{transform:scale(1.08);filter:drop-shadow(0 0 20px rgba(34,211,238,.9))}}@keyframes flow{to{stroke-dashoffset:-38}}@keyframes draw-path{from{stroke-dasharray:0 1000}to{stroke-dasharray:11 8}}
@media(max-width:900px){.tree-header{flex-wrap:wrap}.header-left{min-width:240px}.tree-stats{display:none}.tree-main{grid-template-columns:250px minmax(0,1fr)}}
@media(max-width:650px){.tree-workspace{height:auto;min-height:100vh;overflow:visible}.tree-header{padding:.7rem;gap:.65rem}.header-left{min-width:0;flex-basis:100%}.header-left h1{font-size:.9rem}.header-actions{width:100%;justify-content:space-between}.header-actions button{padding:.5rem;font-size:.65rem}.tree-main{grid-template-columns:1fr;padding:.65rem}.control-panel{gap:.75rem}.canvas-card{height:60vh;min-height:350px}.canvas-toolbar>span{display:none}}
</style>
