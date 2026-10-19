<script setup>
import { ref, computed, watch } from 'vue'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Calculator,
  TrendingUp,
  TrendingDown
} from '@lucide/vue'

const props = defineProps({
  show: Boolean,
  result: {
    type: Object,
    required: true,
    default: () => ({})
  },
  rows: { type: Array, default: () => [] },
  cols: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'apply'])

const currentStep = ref(0)
const maxSteps = 5

// --- 1. Modo (Minimización o Maximización) ---
const normalizedMode = computed(() => props.result?.mode || props.result?.modo || 'minimize')
const isMaximize = computed(() => normalizedMode.value === 'maximize')

// --- 2. Valor Total (Costo o Beneficio) ---
const totalValue = computed(() => {
  if (props.result?.totalCost !== undefined && props.result?.totalCost !== null) return props.result.totalCost
  if (props.result?.costoTotal !== undefined && props.result?.costoTotal !== null) return props.result.costoTotal
  if (props.result?.totalBenefit !== undefined && props.result?.totalBenefit !== null) return props.result.totalBenefit
  return 0
})

// --- 3. Normalización de Asignaciones Óptimas ---
const normalizedAssignments = computed(() => {
  const list = props.result?.assignments || props.result?.asignaciones || []
  return list.map(a => {
    const rIdx = a.rowIdx ?? a.rIdx ?? a.rowIndex ?? 0
    const cIdx = a.colIdx ?? a.cIdx ?? a.colIndex ?? 0
    return {
      rowLabel: a.rowLabel || a.origen || a.row || `Fila ${rIdx + 1}`,
      colLabel: a.colLabel || a.destino || a.col || `Col ${cIdx + 1}`,
      originalCost: a.originalCost ?? a.costo ?? a.weight ?? 0,
      rowIdx: rIdx,
      colIdx: cIdx
    }
  })
})

// --- 4. Etiquetas de Filas y Columnas del Paso Activo ---
const currentLabels = computed(() => {
  const pasos = props.result?.pasos || []
  
  if (pasos.length > 0) {
    let paso = null
    if (currentStep.value === 1) paso = pasos[0]
    else if (currentStep.value === 2) paso = pasos.find(p => p.titulo?.toLowerCase().includes('fila')) || pasos[1] || pasos[0]
    else if (currentStep.value === 3) paso = pasos.find(p => p.titulo?.toLowerCase().includes('columna')) || pasos[2] || pasos[1] || pasos[0]
    else if (currentStep.value === 4) paso = pasos[pasos.length - 1]

    if (paso && Array.isArray(paso.rowLabels) && Array.isArray(paso.colLabels)) {
      return {
        rowLabels: paso.rowLabels,
        colLabels: paso.colLabels
      }
    }
  }

  // Fallback usando las props rows/cols
  const rLabels = props.rows && props.rows.length > 0 
    ? props.rows.map(r => typeof r === 'object' ? r.label : r)
    : (props.result?.rowLabels || [])
    
  const cLabels = props.cols && props.cols.length > 0 
    ? props.cols.map(c => typeof c === 'object' ? c.label : c)
    : (props.result?.colLabels || [])

  return { rowLabels: rLabels, colLabels: cLabels }
})

// --- 5. Matriz Numérica del Paso Activo ---
const currentStepMatrix = computed(() => {
  const pasos = props.result?.pasos || []

  // Paso 1: Matriz Inicial
  if (currentStep.value === 1) {
    if (pasos[0]?.matrix) return pasos[0].matrix
    return props.result?.rawCostMatrix || props.result?.costMatrix || props.result?.matrizInicial || []
  }

  // Paso 2: Reducción por Filas
  if (currentStep.value === 2) {
    const step2 = pasos.find(p => p.titulo?.toLowerCase().includes('fila')) || pasos[1]
    if (step2?.matrix) return step2.matrix
    return props.result?.rowReducedMatrix || props.result?.matrizReducidaFilas || pasos[0]?.matrix || []
  }

  // Paso 3: Reducción por Columnas
  if (currentStep.value === 3) {
    const step3 = pasos.find(p => p.titulo?.toLowerCase().includes('columna')) || pasos[2]
    if (step3?.matrix) return step3.matrix
    return props.result?.finalMatrix || props.result?.matrizFinal || pasos[1]?.matrix || []
  }

  // Paso 4: Matriz Resuelta Final
  if (currentStep.value === 4) {
    if (pasos.length > 0 && pasos[pasos.length - 1]?.matrix) {
      return pasos[pasos.length - 1].matrix
    }
    return props.result?.finalMatrix || props.result?.matrizFinal || []
  }

  return []
})

// --- 6. Cálculo del Vector Alpha (Mínimos de Filas) ---
const alphaVector = computed(() => {
  if (Array.isArray(props.result?.alpha) && props.result.alpha.length > 0) return props.result.alpha
  if (Array.isArray(props.result?.vectorAlpha) && props.result.vectorAlpha.length > 0) return props.result.vectorAlpha

  const pasos = props.result?.pasos || []
  const step2 = pasos.find(p => p.titulo?.toLowerCase().includes('fila')) || pasos[1]
  if (step2?.alpha) return step2.alpha
  if (step2?.vectorAlpha) return step2.vectorAlpha

  // Calcular directamente desde la matriz inicial del Paso 1
  const baseMat = pasos[0]?.matrix || props.result?.rawCostMatrix || props.result?.costMatrix || []
  if (baseMat.length > 0) {
    return baseMat.map(row => {
      if (!Array.isArray(row) || row.length === 0) return 0
      const validNums = row.filter(v => typeof v === 'number' && !isNaN(v) && Math.abs(v) < 999999)
      return validNums.length > 0 ? Math.min(...validNums) : 0
    })
  }
  return []
})

// --- 7. Cálculo del Vector Beta (Mínimos de Columnas) ---
const betaVector = computed(() => {
  if (Array.isArray(props.result?.beta) && props.result.beta.length > 0) return props.result.beta
  if (Array.isArray(props.result?.vectorBeta) && props.result.vectorBeta.length > 0) return props.result.vectorBeta

  const pasos = props.result?.pasos || []
  const step3 = pasos.find(p => p.titulo?.toLowerCase().includes('columna')) || pasos[2]
  if (step3?.beta) return step3.beta
  if (step3?.vectorBeta) return step3.vectorBeta

  const step2Mat = pasos.find(p => p.titulo?.toLowerCase().includes('fila'))?.matrix || pasos[1]?.matrix || []
  if (step2Mat.length > 0) {
    const numCols = step2Mat[0]?.length || 0
    const betas = []
    for (let c = 0; c < numCols; c++) {
      const colVals = step2Mat.map(r => r[c]).filter(v => typeof v === 'number' && !isNaN(v) && Math.abs(v) < 999999)
      betas.push(colVals.length > 0 ? Math.min(...colVals) : 0)
    }
    return betas
  }
  return []
})

// --- Títulos dinámicos según el paso actual ---
const stepTitles = computed(() => [
  `Resumen del Resultado Óptimo (${isMaximize.value ? 'Maximización' : 'Minimización'})`,
  'Paso 1: Matriz de Trabajo Inicial',
  'Paso 2: Reducción por Filas (Vector α)',
  'Paso 3: Reducción por Columnas (Vector β)',
  'Paso 4: Matriz Resuelta y Asignación Final'
])

watch(() => props.show, (newVal) => {
  if (newVal) currentStep.value = 0
})

const nextStep = () => {
  if (currentStep.value < maxSteps - 1) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

// Verifica si la celda (rIdx, cIdx) es una asignación óptima
const isAssigned = (rIdx, cIdx) => {
  const rLabel = currentLabels.value.rowLabels[rIdx]
  const cLabel = currentLabels.value.colLabels[cIdx]

  return normalizedAssignments.value.some(a => {
    const indexMatch = a.rowIdx === rIdx && a.colIdx === cIdx
    const labelMatch = Boolean(a.rowLabel && a.colLabel && a.rowLabel === rLabel && a.colLabel === cLabel)
    return indexMatch || labelMatch
  })
}

// Formato de celdas de matriz (se muestra '-' sólo si no existe la arista o si es Infinito)
const formatCost = (val) => {
  const infThreshold = props.result?.INF || 999999
  if (val === undefined || val === null || isNaN(val) || val === Infinity || val === -Infinity || Math.abs(val) >= infThreshold) {
    return '—'
  }
  return val
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
    <div class="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Encabezado -->
      <div class="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles class="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-100 tracking-wide uppercase">RESOLUCIÓN PASO A PASO</h2>
            <p class="text-xs text-indigo-400 font-medium">{{ stepTitles[currentStep] }} (Paso {{ currentStep + 1 }} de {{ maxSteps }})</p>
          </div>
        </div>
        
        <button @click="emit('close')" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Cuerpo del Carrusel -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">

        <Transition name="carousel" mode="out-in">
          <!-- PASO 0: Resumen Óptimo Inicial -->
          <div v-if="currentStep === 0" key="step-0" class="space-y-6">
            <div 
              class="p-4 rounded-xl border flex items-center justify-between"
              :class="isMaximize ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/30'"
            >
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" :class="isMaximize ? 'text-emerald-400' : 'text-indigo-400'">
                  {{ isMaximize ? 'Beneficio Total Óptimo' : 'Costo Total Óptimo' }}
                </span>
                <div class="text-3xl font-extrabold text-slate-100 mt-1">
                  {{ totalValue }}
                  <span class="text-xs font-normal text-slate-400">
                    ({{ isMaximize ? 'Maximización' : 'Minimización' }})
                  </span>
                </div>
              </div>
              <div 
                class="px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5"
                :class="isMaximize ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'"
              >
                <component :is="isMaximize ? TrendingUp : TrendingDown" class="w-4 h-4" />
                {{ isMaximize ? 'Máximo Beneficio' : 'Mínimo Costo' }}
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4 text-emerald-400" />
                Resumen de Asignaciones Óptimas
              </h3>
              
              <div v-if="normalizedAssignments.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  v-for="(asig, idx) in normalizedAssignments" 
                  :key="idx" 
                  class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between"
                >
                  <div class="flex items-center gap-2 text-sm text-slate-200">
                    <span class="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-xs">{{ asig.rowLabel }}</span>
                    <ArrowRight class="w-3.5 h-3.5 text-indigo-400" />
                    <span class="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 font-mono text-xs border border-indigo-500/30">{{ asig.colLabel }}</span>
                  </div>
                  <span class="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                    Valor: {{ asig.originalCost }}
                  </span>
                </div>
              </div>
              <p v-else class="text-xs text-slate-500 italic">No hay asignaciones registradas.</p>
            </div>
          </div>

          <!-- PASO 1: Matriz Inicial -->
          <div v-else-if="currentStep === 1" key="step-1" class="space-y-4">
            <p class="text-xs text-slate-400">
              {{ isMaximize ? 'Matriz invertida/ajustada balanceada (N x N) para resolver maximización.' : 'Matriz de costos inicial balanceada (N x N).' }}
            </p>
            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-2">
              <table class="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th class="p-2 text-xs text-slate-500 font-mono">Filas \ Cols</th>
                    <th v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-xs font-semibold text-indigo-300 font-mono">
                      {{ colLabel }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rowLabel, rIdx) in currentLabels.rowLabels" :key="rIdx" class="border-t border-slate-800/50">
                    <td class="p-2 text-xs font-semibold text-slate-300 font-mono text-left bg-slate-800/30">{{ rowLabel }}</td>
                    <td v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-sm font-mono text-slate-300">
                      {{ formatCost(currentStepMatrix[rIdx]?.[cIdx]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PASO 2: Reducción por Filas -->
          <div v-else-if="currentStep === 2" key="step-2" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400">Extracción del menor elemento de cada fila (Vector α) descontado en su fila.</p>
              <span class="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono border border-amber-500/20 animate-pulse">
                Vector α
              </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-2">
              <table class="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th class="p-2 text-xs text-slate-500 font-mono">Filas</th>
                    <th v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-xs font-semibold text-indigo-300 font-mono">
                      {{ colLabel }}
                    </th>
                    <th class="p-2 text-xs font-bold text-amber-400 font-mono bg-amber-950/20 border-l border-amber-500/20">Vector α</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rowLabel, rIdx) in currentLabels.rowLabels" :key="rIdx" class="border-t border-slate-800/50">
                    <td class="p-2 text-xs font-semibold text-slate-300 font-mono text-left bg-slate-800/30">{{ rowLabel }}</td>
                    <td v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-sm font-mono text-slate-300">
                      {{ formatCost(currentStepMatrix[rIdx]?.[cIdx]) }}
                    </td>
                    <td class="p-2 text-sm font-bold text-amber-300 font-mono bg-amber-950/30 border-l border-amber-500/20">
                      <div class="inline-block px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                        {{ alphaVector[rIdx] ?? 0 }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PASO 3: Reducción por Columnas -->
          <div v-else-if="currentStep === 3" key="step-3" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs text-slate-400">Extracción del menor elemento de cada columna (Vector β) descontado globalmente.</p>
              <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 animate-pulse">
                Vector β
              </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-2">
              <table class="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th class="p-2 text-xs text-slate-500 font-mono">Filas \ Cols</th>
                    <th v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-xs font-semibold text-indigo-300 font-mono">
                      {{ colLabel }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rowLabel, rIdx) in currentLabels.rowLabels" :key="rIdx" class="border-t border-slate-800/50">
                    <td class="p-2 text-xs font-semibold text-slate-300 font-mono text-left bg-slate-800/30">{{ rowLabel }}</td>
                    <td v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-sm font-mono text-slate-300">
                      {{ formatCost(currentStepMatrix[rIdx]?.[cIdx]) }}
                    </td>
                  </tr>
                  <tr class="border-t-2 border-emerald-500/40 bg-emerald-950/20">
                    <td class="p-2 text-xs font-bold text-emerald-400 font-mono text-left">Vector β</td>
                    <td v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-sm font-bold text-emerald-300 font-mono">
                      <div class="inline-block px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                        {{ betaVector[cIdx] ?? 0 }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PASO 4: Matriz Resuelta y Tarjeta Inferior -->
          <div v-else-if="currentStep === 4" key="step-4" class="space-y-6">
            <p class="text-xs text-slate-400">Asignaciones independientes de coste nulo alcanzadas.</p>

            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-2">
              <table class="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th class="p-2 text-xs text-slate-500 font-mono">Filas \ Cols</th>
                    <th v-for="(colLabel, cIdx) in currentLabels.colLabels" :key="cIdx" class="p-2 text-xs font-semibold text-indigo-300 font-mono">
                      {{ colLabel }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rowLabel, rIdx) in currentLabels.rowLabels" :key="rIdx" class="border-t border-slate-800/50">
                    <td class="p-2 text-xs font-semibold text-slate-300 font-mono text-left bg-slate-800/30">{{ rowLabel }}</td>
                    <td 
                      v-for="(colLabel, cIdx) in currentLabels.colLabels" 
                      :key="cIdx" 
                      class="p-2 text-sm font-mono transition-all duration-300"
                      :class="isAssigned(rIdx, cIdx) 
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/50 scale-105 rounded shadow-lg' 
                        : 'text-slate-400'"
                    >
                      <span v-if="isAssigned(rIdx, cIdx)">[0]</span>
                      <span v-else>{{ formatCost(currentStepMatrix[rIdx]?.[cIdx]) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pantalla pequeña flotante inferior -->
            <div class="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Calculator class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ isMaximize ? 'Beneficio Total Óptimo' : 'Costo Total Óptimo' }}
                  </span>
                  <div class="text-2xl font-black text-emerald-300 font-mono">
                    {{ totalValue }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 overflow-x-auto max-w-full">
                <div 
                  v-for="(asig, idx) in normalizedAssignments" 
                  :key="idx" 
                  class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 whitespace-nowrap flex items-center gap-1.5"
                >
                  <span class="text-indigo-400">{{ asig.rowLabel }}</span>
                  <ArrowRight class="w-3 h-3 text-slate-500" />
                  <span class="text-emerald-400">{{ asig.colLabel }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>

      </div>

      <!-- Footer de Navegación -->
      <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <button 
          @click="prevStep" 
          :disabled="currentStep === 0"
          class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold flex items-center gap-2 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <ChevronLeft class="w-4 h-4" />
          Atrás
        </button>

        <div class="flex items-center gap-1.5">
          <span 
            v-for="sIdx in maxSteps" 
            :key="sIdx"
            @click="currentStep = sIdx - 1"
            class="w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300"
            :class="currentStep === (sIdx - 1) ? 'bg-indigo-500 w-6' : 'bg-slate-700 hover:bg-slate-600'"
          ></span>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="emit('close')" 
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
          >
            Cerrar
          </button>

          <button 
            @click="nextStep" 
            :disabled="currentStep === maxSteps - 1"
            class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition shadow-lg shadow-indigo-600/20"
          >
            Siguiente
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.carousel-enter-active,
.carousel-leave-active {
  transition: all 0.3s ease-in-out;
}

.carousel-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.carousel-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>