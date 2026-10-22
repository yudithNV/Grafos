const cloneNode = (node) => {
  if (!node) return null
  return {
    id: node.id,
    value: node.value,
    left: cloneNode(node.left),
    right: cloneNode(node.right)
  }
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
    if (!node) return 0
    const current = Number(String(node.id).replace(/^bst-/, '')) || 0
    return Math.max(current, this.findNextId(node.left), this.findNextId(node.right))
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
    const remove = (node) => {
      if (!node) return null
      const direction = numericValue < node.value ? 'left' : numericValue > node.value ? 'right' : null
      steps.push({ nodeId: node.id, value: node.value, action: direction ? 'compare' : 'remove', direction })
      if (direction) {
        node[direction] = remove(node[direction])
        return node
      }
      if (!node.left) return node.right
      if (!node.right) return node.left

      let successor = node.right
      while (successor.left) {
        successor = successor.left
        steps.push({ nodeId: successor.id, value: successor.value, action: 'find-successor', direction: 'left' })
      }
      node.value = successor.value
      node.right = this.removeMinimum(node.right)
      return node
    }

    const before = this.countNodes(this.root)
    this.root = remove(this.root)
    return {
      tree: this.getStructure(),
      removed: this.countNodes(this.root) < before,
      steps
    }
  }

  removeMinimum(node) {
    if (!node.left) return node.right
    node.left = this.removeMinimum(node.left)
    return node
  }

  countNodes(node) {
    return node ? 1 + this.countNodes(node.left) + this.countNodes(node.right) : 0
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
    const walk = (node, path = []) => {
      if (!node) return
      const nextPath = [...path, node.value]
      if (normalizedOrder === 'preorder') visit(node, nextPath)
      walk(node.left, nextPath)
      if (normalizedOrder === 'inorder') visit(node, nextPath)
      walk(node.right, nextPath)
      if (normalizedOrder === 'postorder') visit(node, nextPath)
    }
    walk(this.root)

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
