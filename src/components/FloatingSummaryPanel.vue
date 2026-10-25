<script setup>
import { ref, computed } from 'vue'
import { X, GripHorizontal, Calculator, ArrowRight } from '@lucide/vue'

const props = defineProps({
  show: Boolean,
  result: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close'])

// Lógica para arrastrar / mover el panel flotante
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })

const startDrag = (e) => {
  isDragging.value = true
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  startPos.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  position.value = {
    x: clientX - startPos.value.x,
    y: clientY - startPos.value.y
  }
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
}

// Normalización adaptativa de datos
const normalizedMode = computed(() => props.result?.mode || props.result?.modo || 'minimize')
const isMaximize = computed(() => normalizedMode.value === 'maximize')

const totalValue = computed(() => {
  if (props.result?.totalCost !== undefined && props.result?.totalCost !== null) return props.result.totalCost
  if (props.result?.costoTotal !== undefined && props.result?.costoTotal !== null) return props.result.costoTotal
  if (props.result?.totalBenefit !== undefined && props.result?.totalBenefit !== null) return props.result.totalBenefit
  return 0
})

const normalizedAssignments = computed(() => {
  const list = props.result?.assignments || props.result?.asignaciones || []
  return list.map(a => ({
    rowLabel: a.rowLabel || a.origen || a.row || 'Fila',
    colLabel: a.colLabel || a.destino || a.col || 'Col',
    originalCost: a.originalCost ?? a.costo ?? a.weight ?? 0
  }))
})
</script>

<template>
  <div
    v-if="show && result && normalizedAssignments.length > 0"
    class="fixed bottom-6 left-1/2 z-40 w-auto max-w-3xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md select-none transition-shadow hover:shadow-indigo-500/10"
    :style="{ transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` }"
  >
    <!-- Barra Superior de Arrastre -->
    <div
      @mousedown="startDrag"
      @touchstart="startDrag"
      class="px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 rounded-t-2xl flex items-center justify-between cursor-grab active:cursor-grabbing"
    >
      <div class="flex items-center gap-2 text-slate-400">
        <GripHorizontal class="w-4 h-4" />
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Resumen de Asignación Óptima
        </span>
      </div>

      <button
        @click="emit('close')"
        class="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition"
        title="Cerrar resumen"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Contenido del Resumen -->
    <div class="p-4 flex flex-col md:flex-row items-center gap-4">
      <!-- Tarjeta Valor Total -->
      <div
        class="px-4 py-2.5 rounded-xl border flex items-center gap-3 min-w-[200px]"
        :class="isMaximize ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-indigo-950/40 border-indigo-500/40'"
      >
        <div
          class="p-2 rounded-lg"
          :class="isMaximize ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'"
        >
          <Calculator class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider" :class="isMaximize ? 'text-emerald-400' : 'text-indigo-400'">
            {{ isMaximize ? 'Beneficio Total' : 'Costo Total' }}
          </div>
          <div class="text-xl font-black text-slate-100 font-mono">
            {{ totalValue }}
          </div>
        </div>
      </div>

      <!-- Lista de Asignaciones -->
      <div class="flex items-center gap-2 overflow-x-auto max-w-full py-1">
        <div
          v-for="(asig, idx) in normalizedAssignments"
          :key="idx"
          class="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-200 whitespace-nowrap flex items-center gap-2 shadow-sm"
        >
          <span class="text-indigo-300 font-bold">{{ asig.rowLabel }}</span>
          <ArrowRight class="w-3.5 h-3.5 text-slate-500" />
          <span class="text-emerald-400 font-bold">{{ asig.colLabel }}</span>
          <span class="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-700/50">
            Valor: {{ asig.originalCost }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>