const cloneNode = (node) => {
  if (!node) return null
  const root = {
    id: node.id,
    value: node.value,
    left: null,
    right: null
  }
  const pending = [{ source: node, target: root }]
  while (pending.length) {
    const { source, target } = pending.pop()
    for (const side of ['left', 'right']) {
      if (!source[side]) continue
      target[side] = {
        id: source[side].id,
        value: source[side].value,
        left: null,
        right: null
      }
      pending.push({ source: source[side], target: target[side] })
    }
  }
  return root
}

const normalizeValue = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new TypeError('El valor del nodo debe ser un número finito.')
  }
  return number
}

export class BinarySearchTree {
  constructor(root = null) {
    this.root = cloneNode(root)
    this.nextId = this.findNextId(this.root)
  }

  findNextId(node) {
    let maximum = 0
    const pending = node ? [node] : []
    while (pending.length) {
      const current = pending.pop()
      maximum = Math.max(maximum, Number(String(current.id).replace(/^bst-/, '')) || 0)
      if (current.left) pending.push(current.left)
      if (current.right) pending.push(current.right)
    }
    return maximum
  }

  getStructure() {
    return cloneNode(this.root)
  }

  insert(value) {
    const numericValue = normalizeValue(value)
    const steps = []
    const node = { id: `bst-${++this.nextId}`, value: numericValue, left: null, right: null }
    if (!this.root) {
      this.root = node
      steps.push({ nodeId: node.id, value: node.value, action: 'inserted', direction: null })
      return { tree: this.getStructure(), inserted: true, node, steps }
    }

    let current = this.root
    while (true) {
      const direction = numericValue < current.value ? 'left' : numericValue > current.value ? 'right' : null
      steps.push({ nodeId: current.id, value: current.value, action: direction ? 'compare' : 'duplicate', direction })
      if (!direction) return { tree: this.getStructure(), inserted: false, node: current, steps }
      if (!current[direction]) {
        current[direction] = node
        steps.push({ nodeId: node.id, value: node.value, action: 'inserted', direction })
        return { tree: this.getStructure(), inserted: true, node, steps }
      }
      current = current[direction]
    }
  }

  search(value) {
    const numericValue = normalizeValue(value)
    const steps = []
    let current = this.root
    while (current) {
      const direction = numericValue < current.value ? 'left' : numericValue > current.value ? 'right' : null
      steps.push({
        nodeId: current.id,
        value: current.value,
        action: direction ? 'compare' : 'found',
        direction
      })
      if (!direction) break
      current = current[direction]
    }
    return { tree: this.getStructure(), found: Boolean(current), node: current ? cloneNode(current) : null, steps }
  }

  delete(value) {
    const numericValue = normalizeValue(value)
    const steps = []
    let parent = null
    let side = null
    let current = this.root
    while (current && current.value !== numericValue) {
      side = numericValue < current.value ? 'left' : 'right'
      steps.push({ nodeId: current.id, value: current.value, action: 'compare', direction: side })
      parent = current
      current = current[side]
    }
    if (!current) return { tree: this.getStructure(), removed: false, steps }
    steps.push({ nodeId: current.id, value: current.value, action: 'remove', direction: null })

    if (current.left && current.right) {
      let successorParent = current
      let successor = current.right
      while (successor.left) {
        successorParent = successor
        successor = successor.left
        steps.push({ nodeId: successor.id, value: successor.value, action: 'find-successor', direction: 'left' })
      }
      current.value = successor.value
      if (successorParent === current) successorParent.right = successor.right
      else successorParent.left = successor.right
    } else {
      const replacement = current.left || current.right
      if (!parent) this.root = replacement
      else parent[side] = replacement
    }
    return { tree: this.getStructure(), removed: true, steps }
  }

  countNodes(node) {
    let count = 0
    const pending = node ? [node] : []
    while (pending.length) {
      const current = pending.pop()
      count += 1
      if (current.left) pending.push(current.left)
      if (current.right) pending.push(current.right)
    }
    return count
  }

  traverse(order = 'inorder') {
    const normalizedOrder = String(order).toLowerCase()
    const sequence = []
    const steps = []
    const visit = (node, pending = []) => {
      sequence.push(node.value)
      steps.push({
        index: steps.length + 1,
        nodeId: node.id,
        value: node.value,
        stack: [...pending].reverse(),
        sequence: [...sequence]
      })
    }

    const validOrders = ['inorder', 'preorder', 'postorder']
    if (!validOrders.includes(normalizedOrder)) {
      throw new RangeError(`Recorrido no válido: ${order}`)
    }
    const pending = this.root ? [{ node: this.root, stage: 0, path: [] }] : []
    while (pending.length) {
      const frame = pending.pop()
      if (frame.stage === 0) {
        const path = [...frame.path, frame.node.value]
        if (normalizedOrder === 'preorder') visit(frame.node, path)
        pending.push({ node: frame.node, stage: 1, path })
        if (frame.node.left) pending.push({ node: frame.node.left, stage: 0, path })
      } else if (frame.stage === 1) {
        if (normalizedOrder === 'inorder') visit(frame.node, frame.path)
        pending.push({ node: frame.node, stage: 2, path: frame.path })
        if (frame.node.right) pending.push({ node: frame.node.right, stage: 0, path: frame.path })
      } else if (normalizedOrder === 'postorder') {
        visit(frame.node, frame.path)
      }
    }

    const labels = {
      inorder: 'Inorden',
      preorder: 'Preorden',
      postorder: 'Postorden'
    }
    return {
      tree: this.getStructure(),
      traversal: labels[normalizedOrder],
      order: normalizedOrder,
      sequence,
      steps
    }
  }
}

export const createBinarySearchTree = (values = []) => {
  const tree = new BinarySearchTree()
  values.forEach((value) => tree.insert(value))
  return tree
}

export const traverseBinaryTree = (root, order) => new BinarySearchTree(root).traverse(order)

const validateReconstructionTraversals = (traversal, inorder) => {
  if (!Array.isArray(traversal) || !Array.isArray(inorder)) {
    throw new TypeError('Los recorridos deben ser arreglos.')
  }
  if (traversal.length === 0 || traversal.length > 3000 || traversal.length !== inorder.length) {
    throw new RangeError('Los recorridos deben tener la misma longitud entre 1 y 3000.')
  }

  const inorderIndexes = new Map()
  inorder.forEach((value, index) => {
    if (!Number.isInteger(value)) throw new TypeError('Los recorridos solo pueden contener números enteros.')
    if (inorderIndexes.has(value)) throw new RangeError('Los recorridos no pueden contener valores duplicados.')
    inorderIndexes.set(value, index)
  })
  const traversalValues = new Set()
  traversal.forEach((value) => {
    if (!Number.isInteger(value)) throw new TypeError('Los recorridos solo pueden contener números enteros.')
    if (traversalValues.has(value)) throw new RangeError('Los recorridos no pueden contener valores duplicados.')
    if (!inorderIndexes.has(value)) throw new RangeError('Los dos recorridos deben contener los mismos valores.')
    traversalValues.add(value)
  })
  return inorderIndexes
}

export function construirDesdePreIn(preorder, inorder) {
  const indexes = validateReconstructionTraversals(preorder, inorder)
  let traversalIndex = 0
  let root = null
  const pending = [{ start: 0, end: inorder.length - 1, parent: null, side: null }]
  while (pending.length) {
    const frame = pending.pop()
    if (frame.start > frame.end) continue
    if (traversalIndex >= preorder.length) {
      throw new RangeError('Los recorridos no representan un árbol binario válido.')
    }
    const value = preorder[traversalIndex++]
    const rootIndex = indexes.get(value)
    if (rootIndex < frame.start || rootIndex > frame.end) {
      throw new RangeError('Los recorridos no representan un árbol binario válido.')
    }
    const node = { valor: value, izquierda: null, derecha: null }
    if (frame.parent) frame.parent[frame.side] = node
    else root = node
    pending.push({ start: rootIndex + 1, end: frame.end, parent: node, side: 'derecha' })
    pending.push({ start: frame.start, end: rootIndex - 1, parent: node, side: 'izquierda' })
  }
  if (traversalIndex !== preorder.length) {
    throw new RangeError('Los recorridos no representan un árbol binario válido.')
  }
  return root
}

export function construirDesdePostIn(postorder, inorder) {
  const indexes = validateReconstructionTraversals(postorder, inorder)
  let traversalIndex = postorder.length - 1
  let root = null
  const pending = [{ start: 0, end: inorder.length - 1, parent: null, side: null }]
  while (pending.length) {
    const frame = pending.pop()
    if (frame.start > frame.end) continue
    if (traversalIndex < 0) {
      throw new RangeError('Los recorridos no representan un árbol binario válido.')
    }
    const value = postorder[traversalIndex--]
    const rootIndex = indexes.get(value)
    if (rootIndex < frame.start || rootIndex > frame.end) {
      throw new RangeError('Los recorridos no representan un árbol binario válido.')
    }
    const node = { valor: value, izquierda: null, derecha: null }
    if (frame.parent) frame.parent[frame.side] = node
    else root = node
    pending.push({ start: frame.start, end: rootIndex - 1, parent: node, side: 'izquierda' })
    pending.push({ start: rootIndex + 1, end: frame.end, parent: node, side: 'derecha' })
  }
  if (traversalIndex !== -1) {
    throw new RangeError('Los recorridos no representan un árbol binario válido.')
  }
  return root
}
