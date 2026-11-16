<template>
  <div class="rv-wrap">
    <!-- Deslizadores: otra forma de mover las entradas -->
    <div class="rv-sliders">
      <label v-for="(v, i) in system.inputs" :key="i" class="rv-slider">
        <span class="rv-slider-name">{{ v.name }}</span>
        <input
          type="range"
          :min="v.range[0]"
          :max="v.range[1]"
          :step="stepOf(v)"
          :value="x[i]"
          :aria-label="`Valor de ${v.name}`"
          @input="setX(i, Number($event.target.value))"
        />
        <input
          type="number"
          class="rv-num"
          :min="v.range[0]"
          :max="v.range[1]"
          :step="stepOf(v)"
          :value="fmt(x[i])"
          :aria-label="`Valor exacto de ${v.name}`"
          @change="setX(i, Number($event.target.value))"
        />
      </label>
    </div>

    <svg
      ref="svgEl"
      class="rv-svg"
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      :aria-label="`Visor de reglas: ${system.output.name} = ${fmt(result?.valor)}`"
      @pointermove="onMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <!-- Encabezados -->
      <text
        v-for="(v, i) in system.inputs"
        :key="'h' + i"
        :x="colX(i) + colW / 2"
        :y="18"
        class="rv-head"
        text-anchor="middle"
      >{{ v.name }} = {{ fmt(x[i]) }}</text>
      <text :x="colX(nIn) + colW / 2" :y="18" class="rv-head out" text-anchor="middle">
        {{ system.output.name }} = {{ fmt(result?.valor) }}{{ result?.etiqueta ? ` (${result.etiqueta})` : '' }}
      </text>

      <!-- Filas de reglas -->
      <g v-for="(rule, r) in rules" :key="'r' + r">
        <text :x="LEFT - 8" :y="rowY(r) + ROW_H / 2 + 4" class="rv-num-label" text-anchor="end">{{ r + 1 }}</text>
        <!-- entradas -->
        <g v-for="(v, i) in system.inputs" :key="'c' + i">
          <rect :x="colX(i)" :y="rowY(r)" :width="colW" :height="ROW_H" class="rv-cell" />
          <polygon
            v-if="rule.antecedents[i] > 0"
            :points="mfPolygon(v.mfs[rule.antecedents[i] - 1], v.range, colX(i), rowY(r))"
            class="rv-in-mf"
          />
        </g>
        <!-- salida de la regla -->
        <rect :x="colX(nIn)" :y="rowY(r)" :width="colW" :height="ROW_H" class="rv-cell" />
        <template v-if="!sugeno">
          <polyline :points="mfLine(system.output.mfs[rule.output - 1], outRange, colX(nIn), rowY(r))" class="rv-out-line" />
          <polygon :points="clipPolygon(system.output.mfs[rule.output - 1], strength(r), colX(nIn), rowY(r))" class="rv-out-fill" />
        </template>
        <line
          v-else-if="Number.isFinite(result?.z?.[r])"
          :x1="outX(result.z[r])" :y1="rowY(r) + ROW_H"
          :x2="outX(result.z[r])" :y2="rowY(r) + ROW_H - strength(r) * (ROW_H - 4)"
          class="rv-stem"
        />
      </g>

      <!-- Resultado final: conjunto agregado (Mamdani) o salidas de las reglas (Sugeno) -->
      <rect :x="colX(nIn)" :y="aggY" :width="colW" :height="AGG_H" class="rv-cell" />
      <polygon v-if="!sugeno && result?.agregada" :points="aggPolygon" class="rv-out-fill strong" />
      <template v-if="sugeno && result?.z">
        <line
          v-for="(z, r) in result.z"
          :key="'s' + r"
          v-show="strength(r) > 0"
          :x1="outX(z)" :y1="aggY + AGG_H"
          :x2="outX(z)" :y2="aggY + AGG_H - strength(r) * (AGG_H - 6)"
          class="rv-stem"
        />
      </template>
      <line
        v-if="Number.isFinite(result?.valor)"
        :x1="outX(result.valor)" :y1="aggY"
        :x2="outX(result.valor)" :y2="aggY + AGG_H"
        class="rv-result"
      />
      <text
        v-for="t in outTicks"
        :key="'t' + t.v"
        :x="t.x"
        :y="aggY + AGG_H + 14"
        class="rv-tick"
        text-anchor="middle"
      >{{ t.v }}</text>

      <!-- Líneas rojas de las entradas (se arrastran) -->
      <g v-for="(v, i) in system.inputs" :key="'d' + i">
        <rect
          :x="colX(i)" :y="TOP" :width="colW" :height="rules.length * (ROW_H + GAP) - GAP"
          class="rv-drag-area"
          @pointerdown="startDrag(i, $event)"
        />
        <line
          :x1="inX(i)" :y1="TOP - 4"
          :x2="inX(i)" :y2="TOP + rules.length * (ROW_H + GAP) - GAP"
          class="rv-input-line"
          :class="{ active: dragging === i }"
          pointer-events="none"
        />
        <circle :cx="inX(i)" :cy="TOP - 4" r="5" class="rv-input-knob" pointer-events="none" />
      </g>
    </svg>

    <p class="rv-hint">
      Arrastra las <strong>líneas rojas</strong> (o usa los deslizadores) para cambiar las entradas: Python recalcula cada regla al instante.
      <span v-if="error" class="rv-error">{{ error }}</span>
    </p>
  </div>
</template>

<script setup>
// Visor de reglas interactivo (como ruleview de MATLAB). Python calcula cada punto.
import { ref, computed, watch, onMounted } from 'vue'
import { evalMF, linspace } from '../utils/fuzzy'
import { pointInPython } from '../utils/pythonSimulator'

const props = defineProps({
  system: { type: Object, required: true },     // sistema con el que se simuló
  startValues: { type: Array, required: true }  // valores del escenario elegido
})

const W = 920
const LEFT = 30
const TOP = 34
const ROW_H = 40
const GAP = 4
const AGG_H = 62
const COL_GAP = 10

const svgEl = ref(null)
const x = ref([])
const result = ref(null)
const error = ref('')
const dragging = ref(null)

const sugeno = computed(() => props.system.type === 'sugeno')
const nIn = computed(() => props.system.inputs.length)
// Mismas reglas que usa Python: solo las completas
const rules = computed(() => props.system.rules.filter((r) => r.output > 0 && r.antecedents.some((a) => a > 0)))
const colW = computed(() => (W - LEFT - COL_GAP * nIn.value) / (nIn.value + 1))
const colX = (i) => LEFT + i * (colW.value + COL_GAP)
const rowY = (r) => TOP + r * (ROW_H + GAP)
const aggY = computed(() => TOP + rules.value.length * (ROW_H + GAP) + 4)
const H = computed(() => aggY.value + AGG_H + 22)

const fmt = (n) => (Number.isFinite(n) ? Number(Number(n).toFixed(3)).toString() : '—')
const clampTo = (v, [lo, hi]) => Math.min(Math.max(v, Number(lo)), Number(hi))
const stepOf = (v) => {
  const span = Number(v.range[1]) - Number(v.range[0])
  return Number((span / 200).toPrecision(2))
}
const strength = (r) => Math.min(Math.max(result.value?.fuerzas?.[r] ?? 0, 0), 1)

/* ---------- rango de la salida ---------- */
// En Sugeno los valores z pueden salir del rango: se amplía (sin encogerse) para que no salte al arrastrar
const sugRange = ref(null)
const outRange = computed(() => {
  const [lo, hi] = props.system.output.range.map(Number)
  if (!sugeno.value) return [lo, hi]
  return sugRange.value || [lo, hi]
})
watch(result, (res) => {
  if (!sugeno.value || !res?.z) return
  const vals = [...outRange.value, ...res.z.filter(Number.isFinite), res.valor].filter(Number.isFinite)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  if (!sugRange.value || lo < sugRange.value[0] || hi > sugRange.value[1]) {
    const pad = (hi - lo) * 0.04 || 1
    sugRange.value = [lo - pad, hi + pad]
  }
})

const outX = (v) => {
  const [lo, hi] = outRange.value
  return colX(nIn.value) + ((v - lo) / (hi - lo || 1)) * colW.value
}
const inX = (i) => {
  const [lo, hi] = props.system.inputs[i].range.map(Number)
  return colX(i) + ((x.value[i] - lo) / (hi - lo || 1)) * colW.value
}
const outTicks = computed(() => {
  const [lo, hi] = outRange.value
  return linspace(lo, hi, 5).map((v) => ({ v: fmt(v), x: outX(v) }))
})

/* ---------- dibujos ---------- */
const mu = (mf, v) => {
  const y = mf ? evalMF(mf, v) : 0
  return Number.isFinite(y) ? Math.min(Math.max(y, 0), 1) : 0
}
function mfLine(mf, range, x0, y0, n = 70) {
  const [lo, hi] = range.map(Number)
  return linspace(lo, hi, n)
    .map((v, k) => `${(x0 + (k / (n - 1)) * colW.value).toFixed(1)},${(y0 + ROW_H - mu(mf, v) * (ROW_H - 4)).toFixed(1)}`)
    .join(' ')
}
function mfPolygon(mf, range, x0, y0) {
  return `${x0},${y0 + ROW_H} ${mfLine(mf, range, x0, y0)} ${x0 + colW.value},${y0 + ROW_H}`
}
function clipPolygon(mf, w, x0, y0, n = 70) {
  const [lo, hi] = outRange.value
  const pts = linspace(lo, hi, n)
    .map((v, k) => `${(x0 + (k / (n - 1)) * colW.value).toFixed(1)},${(y0 + ROW_H - Math.min(w, mu(mf, v)) * (ROW_H - 4)).toFixed(1)}`)
  return `${x0},${y0 + ROW_H} ${pts.join(' ')} ${x0 + colW.value},${y0 + ROW_H}`
}
const aggPolygon = computed(() => {
  const r = result.value
  if (!r?.ys) return ''
  const pts = r.ys.map((y, k) => `${outX(y).toFixed(1)},${(aggY.value + AGG_H - Math.min(r.agregada[k], 1) * (AGG_H - 6)).toFixed(1)}`)
  return `${outX(r.ys[0])},${aggY.value + AGG_H} ${pts.join(' ')} ${outX(r.ys[r.ys.length - 1])},${aggY.value + AGG_H}`
})

/* ---------- Python: un pedido a la vez; si llegan más mientras tanto, se manda el último ---------- */
let inflight = false
let queued = null
async function request(values) {
  if (inflight) { queued = values; return }
  inflight = true
  const r = await pointInPython({ system: props.system, values })
  inflight = false
  if (r.ok) { result.value = r; error.value = '' } else error.value = r.error
  if (queued) {
    const q = queued
    queued = null
    request(q)
  }
}

function setX(i, v) {
  if (!Number.isFinite(v)) return
  const next = [...x.value]
  next[i] = clampTo(v, props.system.inputs[i].range)
  x.value = next
  request(next)
}

/* ---------- arrastrar las líneas rojas ---------- */
function svgPointX(evt) {
  const svg = svgEl.value
  const pt = svg.createSVGPoint()
  pt.x = evt.clientX
  pt.y = evt.clientY
  return pt.matrixTransform(svg.getScreenCTM().inverse()).x
}
function moveTo(i, evt) {
  const [lo, hi] = props.system.inputs[i].range.map(Number)
  const t = (svgPointX(evt) - colX(i)) / colW.value
  const step = stepOf(props.system.inputs[i]) || 1e-6
  setX(i, Math.round((lo + t * (hi - lo)) / step) * step)
}
function startDrag(i, evt) {
  dragging.value = i
  svgEl.value.setPointerCapture?.(evt.pointerId)
  moveTo(i, evt)
}
function onMove(evt) {
  if (dragging.value !== null) moveTo(dragging.value, evt)
}
function endDrag() {
  dragging.value = null
}

function reset() {
  sugRange.value = null
  x.value = props.system.inputs.map((v, i) => clampTo(Number(props.startValues[i]) || 0, v.range))
  request(x.value)
}
watch(() => [props.system, props.startValues], reset)
onMounted(reset)
</script>

<style scoped>
.rv-wrap { margin-top: 0.75rem; }
.rv-sliders { display: flex; flex-wrap: wrap; gap: 0.6rem 1.2rem; margin-bottom: 0.6rem; }
.rv-slider { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: var(--text-secondary); }
.rv-slider-name { font-weight: 600; color: var(--text-primary); }
.rv-slider input[type='range'] { width: 130px; accent-color: #dc2626; }
.rv-num {
  width: 4.6rem; padding: 0.2rem 0.35rem; border-radius: 6px;
  border: 1px solid var(--border-color); background: var(--bg-surface-2, transparent); color: var(--text-primary); font: inherit;
}
.rv-svg {
  width: 100%; height: auto; display: block; touch-action: none;
  border-radius: 12px; border: 1px solid var(--border-color); background: #ffffff; padding: 6px;
}
.rv-head { font-size: 12px; font-weight: 700; fill: #1e293b; }
.rv-head.out { fill: #1d4ed8; }
.rv-num-label, .rv-tick { font-size: 10px; fill: #64748b; }
.rv-cell { fill: #ffffff; stroke: #cbd5e1; stroke-width: 1; }
.rv-in-mf { fill: rgba(250, 204, 21, 0.55); stroke: #a16207; stroke-width: 1; }
.rv-out-line { fill: none; stroke: #1e3a8a; stroke-width: 1; }
.rv-out-fill { fill: rgba(59, 130, 246, 0.6); stroke: none; }
.rv-out-fill.strong { fill: rgba(59, 130, 246, 0.7); }
.rv-stem { stroke: #2563eb; stroke-width: 4; stroke-linecap: round; }
.rv-result { stroke: #dc2626; stroke-width: 2.4; }
.rv-drag-area { fill: transparent; cursor: ew-resize; }
.rv-input-line { stroke: #dc2626; stroke-width: 2; }
.rv-input-line.active { stroke-width: 3.2; }
.rv-input-knob { fill: #dc2626; stroke: #fff; stroke-width: 1.5; }
.rv-hint { margin: 0.45rem 0 0; font-size: 0.75rem; color: var(--text-secondary); }
.rv-error { display: block; color: #dc2626; margin-top: 0.25rem; }
</style>
