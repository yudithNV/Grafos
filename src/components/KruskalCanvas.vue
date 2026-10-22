<script setup>
import { computed, ref, watch } from 'vue'
import GraphCanvas from './GraphCanvas.vue'
import { calcularKruskal } from '../utils/kruskal'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true }
})
const emit = defineEmits([
  'back', 'show-instructions', 'show-matrix', 'save', 'open-load', 'clear',
  'create-node', 'create-edge', 'edit-node', 'edit-edge', 'delete-node', 'delete-edge'
])

const showObjectivePicker = ref(false)
const objective = ref('minimize')
const executionMode = ref('step')
const result = ref(null)
const currentStep = ref(0)
const selectedEdgeIds = computed(() => (result.value?.steps || [])
  .slice(0, currentStep.value)
  .filter(step => step.accepted)
  .map(step => step.edge.id))
const currentTotal = computed(() => (result.value?.steps || [])
  .slice(0, currentStep.value)
  .filter(step => step.accepted)
  .reduce((sum, step) => sum + Number(step.edge.weight), 0))
const finished = computed(() => Boolean(result.value) && currentStep.value >= result.value.steps.length)

const chooseExecutionMode = (mode) => {
  executionMode.value = mode
  showObjectivePicker.value = true
}
const run = (direction) => {
  if (!props.nodes.length || !props.edges.length) return
  objective.value = direction
  result.value = calcularKruskal(props.nodes, props.edges, direction)
  currentStep.value = executionMode.value === 'instant' ? result.value.steps.length : 0
  showObjectivePicker.value = false
}
const reset = () => {
  result.value = null
  currentStep.value = 0
}
watch(() => [props.nodes, props.edges], reset, { deep: true })
</script>

<template>
  <div class="kruskal-workspace">
    <GraphCanvas
      :nodes="props.nodes"
      :edges="props.edges"
      mode="undirected"
      title="Kruskal"
      node-fill="transparent"
      node-stroke-color="#ffffff"
      :highlighted-edge-ids="selectedEdgeIds"
      @back="emit('back')"
      @show-instructions="emit('show-instructions', 'kruskal')"
      @show-matrix="emit('show-matrix')"
      @save="emit('save')"
      @open-load="emit('open-load')"
      @clear="emit('clear')"
      @create-node="emit('create-node', $event)"
      @create-edge="emit('create-edge', $event)"
      @edit-node="emit('edit-node', $event)"
      @edit-edge="emit('edit-edge', $event)"
      @delete-node="emit('delete-node', $event)"
      @delete-edge="emit('delete-edge', $event)"
    />

    <aside class="kruskal-controls" aria-live="polite">
      <div class="controls-heading">
        <div>
          <span class="eyebrow">ÁRBOL DE EXPANSIÓN</span>
          <h3>Kruskal</h3>
        </div>
        <button v-if="result" class="reset-button" type="button" @click="reset">Reiniciar</button>
      </div>
      <p class="objective-label">{{ objective === 'minimize' ? 'Árbol de expansión mínimo' : 'Árbol de expansión máximo' }}</p>

      <template v-if="result">
        <div class="result-stats">
          <span>Peso acumulado</span><strong>{{ currentTotal }}</strong>
          <span>Aristas aceptadas</span><strong>{{ selectedEdgeIds.length }} / {{ Math.max(0, props.nodes.length - result.components) }}</strong>
        </div>
        <p class="step-description">
          <template v-if="finished">
            {{ result.components > 1 ? `Grafo desconectado: se obtuvo un bosque con ${result.components} componentes.` : 'Árbol de expansión completo.' }}
          </template>
          <template v-else-if="result.steps[currentStep]">
            {{ result.steps[currentStep].accepted ? 'Se agrega' : 'Se descarta porque formaría un ciclo' }}
            la conexión {{ result.steps[currentStep].edge.sourceLabel }} — {{ result.steps[currentStep].edge.targetLabel }}
            (peso {{ result.steps[currentStep].edge.weight }}).
          </template>
          <template v-else>Algoritmo listo. Avanza para revisar cada conexión.</template>
        </p>
        <div class="step-actions">
          <button type="button" :disabled="currentStep === 0" @click="currentStep--">Anterior</button>
          <span>{{ currentStep }} / {{ result.steps.length }}</span>
          <button type="button" :disabled="finished" @click="currentStep++">Siguiente</button>
        </div>
      </template>
      <div v-else class="run-options">
        <button class="run-button" type="button" @click="chooseExecutionMode('step')">Ejecutar paso a paso</button>
        <button class="run-button run-button-secondary" type="button" @click="chooseExecutionMode('instant')">Ver solución de una vez</button>
      </div>
    </aside>

    <div v-if="showObjectivePicker" class="objective-overlay" @click.self="showObjectivePicker = false">
      <section class="objective-card" role="dialog" aria-modal="true" aria-labelledby="kruskal-title">
        <button class="close-button" type="button" aria-label="Cerrar" @click="showObjectivePicker = false">×</button>
        <span class="eyebrow">ALGORITMO DE KRUSKAL</span>
        <h2 id="kruskal-title">¿Qué árbol quieres encontrar?</h2>
        <p>Kruskal procesa las conexiones por peso y evita ciclos.</p>
        <div class="objective-options">
          <button type="button" :disabled="!props.nodes.length || !props.edges.length" @click="run('minimize')"><strong>Minimizar</strong><span>Elegir primero los pesos menores</span></button>
          <button type="button" :disabled="!props.nodes.length || !props.edges.length" @click="run('maximize')"><strong>Maximizar</strong><span>Elegir primero los pesos mayores</span></button>
        </div>
        <small v-if="!props.nodes.length || !props.edges.length" class="picker-hint">Agrega nodos y al menos una conexión con peso para ejecutar el algoritmo.</small>
      </section>
    </div>
  </div>
</template>

<style scoped>
.kruskal-workspace { position: relative; width: 100%; height: 100%; min-height: 0; }
.kruskal-controls { position: absolute; z-index: 30; right: 1rem; bottom: 2.5rem; width: min(340px, calc(100vw - 2rem)); padding: 1rem; border: 1px solid var(--border-color); border-radius: 16px; background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 12px 32px rgba(15, 23, 42, .22); }
.controls-heading { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.eyebrow { color: var(--accent-solid); font-size: .65rem; font-weight: 800; letter-spacing: .12em; }
h3 { margin: .2rem 0 0; font-size: 1.15rem; }
.objective-label { margin: .6rem 0; color: var(--text-secondary); font-size: .82rem; }
.result-stats { display: grid; grid-template-columns: 1fr auto; gap: .3rem .75rem; padding: .75rem 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: .8rem; }
.result-stats strong { color: var(--text-primary); }
.step-description { min-height: 2.8em; margin: .7rem 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.45; }
.step-actions { display: flex; justify-content: space-between; align-items: center; gap: .5rem; font-size: .75rem; }
.step-actions button, .reset-button { border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface-2); color: var(--text-primary); padding: .45rem .7rem; cursor: pointer; }
button:disabled { opacity: .45; cursor: not-allowed; }
.run-options { display: grid; gap: .5rem; }
.run-button { width: 100%; margin-top: .35rem; padding: .7rem; border: 0; border-radius: 9px; background: var(--accent-solid); color: white; font-weight: 700; cursor: pointer; }
.run-button-secondary { border: 1px solid var(--accent-solid); background: var(--accent-soft-bg); color: var(--accent-solid); }
.objective-overlay { position: fixed; z-index: 200; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgba(5, 8, 20, .58); backdrop-filter: blur(5px); }
.objective-card { position: relative; width: min(520px, 100%); padding: 1.6rem; border: 1px solid var(--border-color); border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 20px 50px rgba(0, 0, 0, .3); }
.objective-card h2 { margin: .5rem 0; font-size: 1.35rem; }
.objective-card p { margin: 0 0 1rem; color: var(--text-secondary); font-size: .9rem; }
.objective-options { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.objective-options button { display: grid; gap: .45rem; min-height: 100px; padding: 1rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-surface-2); color: var(--text-primary); text-align: left; cursor: pointer; }
.objective-options button:hover { border-color: var(--accent-solid); }
.objective-options button:disabled { opacity: .45; cursor: not-allowed; }
.objective-options span { color: var(--text-secondary); font-size: .78rem; }
.picker-hint { display: block; margin-top: .8rem; color: var(--text-secondary); line-height: 1.4; }
.close-button { position: absolute; top: .7rem; right: .8rem; width: 2rem; height: 2rem; border: 0; border-radius: 8px; background: transparent; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; }
@media (max-width: 540px) { .kruskal-controls { right: .6rem; bottom: 2rem; } .objective-options { grid-template-columns: 1fr; } }
</style>

