export const calcularKruskal = (nodes, edges, objective = 'minimize') => {
  if (!nodes.length) throw new Error('Agrega nodos al grafo antes de ejecutar Kruskal.')
  const parent = new Map(nodes.map(node => [node.id, node.id]))
  const find = (id) => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root)
    while (parent.get(id) !== id) {
      const next = parent.get(id)
      parent.set(id, root)
      id = next
    }
    return root
  }
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const sorted = [...edges].sort((a, b) => {
    const difference = Number(a.weight) - Number(b.weight)
    return objective === 'maximize' ? -difference : difference
  })
  const steps = []
  for (const edge of sorted) {
    const left = find(edge.sourceId)
    const right = find(edge.targetId)
    const accepted = left !== right
    if (accepted) parent.set(left, right)
    steps.push({
      edge: {
        ...edge,
        sourceLabel: nodeById.get(edge.sourceId)?.label ?? edge.sourceId,
        targetLabel: nodeById.get(edge.targetId)?.label ?? edge.targetId
      },
      accepted
    })
  }
  return {
    steps,
    components: new Set(nodes.map(node => find(node.id))).size
  }
}
