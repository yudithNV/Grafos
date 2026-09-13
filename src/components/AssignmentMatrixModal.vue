<template>
  <Transition name="fade">
    <div v-if="show" class="matrix-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="matrix-container" @mousedown.stop>
          <div class="matrix-header">
            <h3 class="matrix-title">Matriz de Asignación</h3>
            <button @click="close" class="btn-close">
              <X class="icon-close" />
            </button>
          </div>

          <div class="matrix-scroll">
            <p v-if="ambiguos.length" class="warning-text">
              ⚠️ {{ ambiguos.length }} nodo(s) no se pudieron clasificar como origen o destino
              (tienen conexiones de entrada y salida a la vez, o ninguna):
              {{ ambiguos.map(n => n.label).join(', ') }}.
            </p>

            <div v-if="rowLabels.length === 0" class="empty-min">
              Agrega nodos de origen y destino conectados por aristas para ver la matriz.
            </div>

            <table v-else class="matrix-table">
              <thead>
                <tr>
                  <th class="th-corner">Origen \ Destino</th>
                  <th v-for="(label, j) in colLabels" :key="j" class="th-node">
                    {{ label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in matrix" :key="i">
                  <td class="td-node">{{ rowLabels[i] }}</td>
                  <td
                    v-for="(val, j) in row"
                    :key="j"
                    class="td-cell"
                    :class="{ 'td-zero': val === 0 }"
                  >
                    {{ val }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="matrix-footer">
            <div class="matrix-legend">
              Filas = orígenes · Columnas = destinos (determinado por la dirección de las aristas)
            </div>
            <button @click="close" class="btn-close-modal">Cerrar</button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { construirMatrizAsignacion } from '../utils/assignmentMatrix.js'

const props = defineProps({
  show: Boolean,
  nodes: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close'])

const built = computed(() => construirMatrizAsignacion(props.nodes, props.edges))
const matrix = computed(() => built.value.matrix)
const rowLabels = computed(() => built.value.rowLabels)
const colLabels = computed(() => built.value.colLabels)
const ambiguos = computed(() => built.value.ambiguos)

const close = () => emit('close')
</script>

<style scoped>
.matrix-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.matrix-container {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px var(--shadow-color);
  overflow: hidden;
  color: var(--text-primary);
}

.matrix-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-start, #a855f7) 0%, var(--accent-end, #d946ef) 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.matrix-title {
  margin: 0;
  font-size: 1.05rem;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-close {
  width: 1rem;
  height: 1rem;
}

.matrix-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}

.warning-text {
  background-color: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #b45309;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  margin: 0 0 1rem;
}

[data-theme='dark'] .warning-text {
  color: #fbbf24;
}

.empty-min {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem 0;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid var(--border-color);
  padding: 0.45rem 0.7rem;
  text-align: center;
}

.th-corner,
.th-node,
.td-node {
  background-color: var(--bg-surface-2);
  font-weight: 600;
}

.td-zero {
  color: var(--accent-solid);
  font-weight: 700;
}

.matrix-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 1rem;
}

.matrix-legend {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-close-modal {
  padding: 0.5rem 1.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.btn-close-modal:hover {
  background-color: var(--bg-surface);
  border-color: var(--accent-solid);
  color: var(--text-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
