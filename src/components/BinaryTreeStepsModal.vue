<template>
  <Transition name="fade">
    <div v-if="show" class="steps-backdrop" @click.self="close">
      <section class="steps-modal" role="dialog" aria-modal="true" aria-labelledby="steps-title">
        <header class="steps-header">
          <div>
            <span class="steps-eyebrow">RECORRIDO DE ÁRBOL</span>
            <h2 id="steps-title">{{ result.traversal }}</h2>
          </div>
          <button class="icon-button" aria-label="Cerrar" @click="close"><X :size="20" /></button>
        </header>

        <div class="steps-content">
          <div class="step-progress">
            <div class="progress-track"><span :style="{ width: `${progress}%` }"></span></div>
            <span>{{ result.steps.length ? currentStep + 1 : 0 }} / {{ result.steps.length }}</span>
          </div>

          <div class="step-card">
            <span class="step-number">Paso {{ result.steps.length ? currentStep + 1 : 0 }}</span>
            <h3>{{ activeStep ? `Visitar ${activeStep.value}` : 'Árbol vacío' }}</h3>
            <p v-if="activeStep">
              Se visita este nodo siguiendo el orden {{ result.traversal.toLowerCase() }}.
            </p>
            <p v-else>Inserta valores en el árbol para generar un recorrido.</p>
            <div v-if="activeStep" class="pending-state">
              <div><strong>Pila / camino</strong>
                <span>{{ activeStep.stack.join(' → ') || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="sequence-panel">
            <div class="sequence-title"><ListOrdered :size="16" /><strong>Secuencia generada</strong></div>
            <div class="sequence-values">
              <span v-for="(value, index) in activeStep?.sequence || []" :key="`${index}-${value}`">{{ value }}</span>
              <span v-if="!activeStep?.sequence?.length" class="sequence-empty">Aún no hay valores visitados</span>
            </div>
          </div>
        </div>

        <footer class="steps-footer">
          <button class="step-control secondary" :disabled="currentStep <= 0" @click="goTo(currentStep - 1)">
            <ChevronLeft :size="17" /> Anterior
          </button>
          <button class="step-control" :disabled="currentStep >= result.steps.length - 1" @click="goTo(currentStep + 1)">
            Siguiente <ChevronRight :size="17" />
          </button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, ListOrdered, X } from '@lucide/vue'

const props = defineProps({
  show: Boolean,
  result: { type: Object, default: () => ({ traversal: '', order: '', steps: [] }) }
})
const emit = defineEmits(['close', 'step-change', 'path-change'])
const currentStep = ref(0)
const activeStep = computed(() => props.result.steps?.[currentStep.value] || null)
const progress = computed(() => props.result.steps?.length
  ? ((currentStep.value + 1) / props.result.steps.length) * 100
  : 0)
let playbackTimer = null

const stopPlayback = () => {
  if (playbackTimer) clearInterval(playbackTimer)
  playbackTimer = null
}
const goTo = (index) => {
  currentStep.value = Math.max(0, Math.min(index, (props.result.steps?.length || 1) - 1))
}
const close = () => {
  stopPlayback()
  emit('close')
}

watch(() => [props.show, props.result], ([visible]) => {
  stopPlayback()
  if (visible) currentStep.value = 0
}, { deep: true })
watch([() => props.show, activeStep], ([visible, step]) => {
  emit('step-change', visible ? step?.nodeId || null : null)
  if (visible) emit('path-change', step?.sequence || [])
})
onBeforeUnmount(stopPlayback)
</script>

<style scoped>
.steps-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:1rem;background:rgba(2,6,23,.76);backdrop-filter:blur(8px)}
.steps-modal{width:min(640px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(99,102,241,.35);border-radius:1.25rem;background:linear-gradient(145deg,#0f172a,#020617);color:#e2e8f0;box-shadow:0 25px 80px rgba(0,0,0,.55)}
.steps-header{display:flex;align-items:center;justify-content:space-between;padding:1.3rem 1.5rem;border-bottom:1px solid rgba(148,163,184,.15)}
.steps-eyebrow{font-size:.68rem;letter-spacing:.16em;color:#22d3ee;font-weight:800}
.steps-header h2{margin:.25rem 0 0;font-size:1.35rem}
.icon-button{display:grid;place-items:center;width:2.25rem;height:2.25rem;border:1px solid #334155;border-radius:.7rem;background:#0f172a;color:#cbd5e1;cursor:pointer}
.steps-content{padding:1.5rem}
.step-progress{display:flex;align-items:center;gap:.75rem;color:#94a3b8;font-size:.78rem}
.progress-track{height:5px;flex:1;border-radius:99px;background:#1e293b;overflow:hidden}
.progress-track span{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#22d3ee);transition:width .25s}
.step-card{min-height:170px;margin-top:1.25rem;padding:1.25rem;border:1px solid rgba(99,102,241,.25);border-radius:1rem;background:rgba(15,23,42,.8)}
.step-number{color:#67e8f9;font-size:.75rem;font-weight:700}
.step-card h3{margin:.55rem 0;font-size:1.25rem}
.step-card p{margin:0;color:#94a3b8;line-height:1.55}
.pending-state{display:flex;gap:1rem;margin-top:1rem;padding-top:.85rem;border-top:1px solid #1e293b}
.pending-state div{display:grid;gap:.25rem}.pending-state strong{font-size:.72rem;color:#94a3b8}.pending-state span{color:#c4b5fd;font-variant-numeric:tabular-nums}
.sequence-panel{margin-top:1rem;padding:1rem;border:1px solid #1e293b;border-radius:.9rem;background:rgba(2,6,23,.7)}
.sequence-title{display:flex;align-items:center;gap:.5rem;color:#cbd5e1;font-size:.85rem}
.sequence-title svg{color:#22d3ee}
.sequence-values{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.75rem}
.sequence-values span:not(.sequence-empty){display:grid;place-items:center;min-width:2.1rem;height:2.1rem;padding:0 .5rem;border:1px solid rgba(34,211,238,.3);border-radius:999px;background:rgba(8,145,178,.13);color:#a5f3fc;font-weight:700}
.sequence-empty{color:#64748b;font-size:.8rem}
.steps-footer{display:flex;justify-content:space-between;padding:1rem 1.5rem;border-top:1px solid rgba(148,163,184,.15)}
.step-control{display:inline-flex;align-items:center;gap:.45rem;padding:.65rem .9rem;border:1px solid #4f46e5;border-radius:.7rem;background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;font-weight:700;cursor:pointer}
.step-control.secondary{border-color:#334155;background:#0f172a;color:#cbd5e1}
.step-control:disabled{opacity:.42;cursor:not-allowed}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}
</style>
