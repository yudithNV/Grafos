
import { ref } from 'vue'

// { tab: 'grafos' | 'algoritmos' } o null si se entra a la página normal
export const requestedTheoryTab = ref(null)

export const requestTheoryTab = (tab) => {
  requestedTheoryTab.value = { tab }
}

export const clearTheoryTab = () => {
  requestedTheoryTab.value = null
}