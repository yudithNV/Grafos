import { ref } from 'vue'

export function useSavedList(key) {
  const items = ref([])
  const read = () => JSON.parse(localStorage.getItem(key) || '[]')
  const write = (list) => {
    localStorage.setItem(key, JSON.stringify(list))
    items.value = list
  }

  const load = () => { items.value = read() }
  const add = (entry) => write([...read(), entry])
  const update = (i, entry) => { const l = read(); l[i] = entry; write(l) }
  const remove = (i) => { const l = read(); l.splice(i, 1); write(l) }

  return { items, load, add, update, remove }
}