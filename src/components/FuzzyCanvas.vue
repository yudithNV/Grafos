<template>
  <div class="canvas-workspace fz-workspace">
    <StarryBackground />

    <!-- Barra superior (misma estructura que las demás pizarras) -->
    <div class="canvas-header">
      <div class="header-left">
        <button @click="$emit('back')" class="btn-icon-only" title="Volver a la página anterior">
          <ArrowLeft class="icon" />
        </button>
        <div class="header-info">
          <h2 class="header-title">
            Pizarra de Lógica Difusa
            <span class="status-indicator"></span>
          </h2>
          <p class="header-subtitle">Diseña el sistema y las reglas aquí; simula los escenarios en MATLAB</p>
        </div>
      </div>

      <div class="stats-container">
        <div class="stat-badge">Entradas: <strong class="stat-number">{{ system.inputs.length }}</strong></div>
        <div class="stat-badge">Reglas: <strong class="stat-number">{{ completeRules }}</strong></div>
        <div class="stat-badge">Escenarios: <strong class="stat-number">{{ scenarios.length }}</strong></div>
      </div>

      <div class="header-actions">
        <button @click="saveBoard" class="btn-text btn-save-graph">
          <Save class="btn-icon" />
          <span>Guardar</span>
        </button>
        <button @click="$emit('open-load')" class="btn-text btn-load-graph" title="Abrir un sistema guardado">
          <FolderOpen class="btn-icon" />
          <span>Cargar</span>
        </button>
        <button @click="downloadFis" class="btn-text" :disabled="hasProblems" title="Archivo para el Fuzzy Logic Designer de MATLAB">
          <FileDown class="btn-icon" />
          <span>.fis</span>
        </button>
        <button @click="downloadMatlab" class="btn-text btn-matlab" :disabled="hasProblems">
          <Play class="btn-icon" />
          <span>Simular en MATLAB</span>
        </button>
        <button @click="$emit('show-instructions', 'difusa')" class="btn-text" title="Abrir el manual de uso de esta pizarra">
          <BookOpen class="btn-icon" />
          <span>Manual</span>
        </button>
        <button @click="showClearModal = true" class="btn-text btn-danger">
          <Trash2 class="btn-icon" />
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <div class="board-container">
      <!-- Problemas que impiden simular -->
      <div v-if="hasProblems" class="connection-tip balance-tip fz-problems">
        <span class="pulse-dot"></span>
        <div>
          <strong>Corrige esto para poder simular:</strong>
          <ul>
            <li v-for="(problem, i) in problems.slice(0, 5)" :key="i">{{ problem }}</li>
          </ul>
          <small v-if="problems.length > 5">…y {{ problems.length - 5 }} más.</small>
        </div>
      </div>

      <!-- ===== Diagrama del sistema (como el Fuzzy Logic Designer) ===== -->
      <section class="board-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Sistema difuso</h3>
            <p class="card-sub">
              Nombre:
              <input v-model="system.name" class="name-input" maxlength="40" aria-label="Nombre del sistema" />
              <span class="type-toggle" role="group" aria-label="Tipo de sistema difuso">
                <button type="button" :class="{ on: !sugeno }" :aria-pressed="!sugeno" @click="setType('mamdani')">Mamdani</button>
                <button type="button" :class="{ on: sugeno }" :aria-pressed="sugeno" @click="setType('sugeno')">Sugeno</button>
              </span>
              <span class="method-text">{{ methodText }}</span>
            </p>
          </div>
          <div class="card-actions">
            <button class="btn-text" @click="addInput" :disabled="system.inputs.length >= MAX_INPUTS">
              <Plus class="btn-icon" />
              <span>Entrada</span>
            </button>
            <button
              class="btn-text"
              @click="removeSelectedInput"
              :disabled="selected.kind !== 'input' || system.inputs.length <= 1"
              title="Quitar la entrada seleccionada"
            >
              <Minus class="btn-icon" />
              <span>Quitar entrada</span>
            </button>
          </div>
        </div>

        <div class="diagram-scroll">
          <svg class="diagram" :viewBox="`0 0 ${DIAGRAM.width} ${diagramHeight}`" :style="{ minWidth: '640px' }">
            <!-- conexiones -->
            <line
              v-for="(box, i) in inputBoxes"
              :key="'l' + i"
              :x1="box.x + box.w" :y1="box.y + box.h / 2"
              :x2="DIAGRAM.center.x" :y2="centerBox.y + centerBox.h / 2"
              class="diagram-link"
            />
            <line
              :x1="centerBox.x + centerBox.w" :y1="centerBox.y + centerBox.h / 2"
              :x2="outputBox.x" :y2="outputBox.y + outputBox.h / 2"
              class="diagram-link"
            />

            <!-- entradas -->
            <g
              v-for="(box, i) in inputBoxes"
              :key="'in' + i"
              class="var-box var-input"
              :class="{ active: selected.kind === 'input' && selected.index === i }"
              tabindex="0"
              role="button"
              :aria-label="`Editar entrada ${system.inputs[i].name}`"
              @click="select('input', i)"
              @keydown.enter="select('input', i)"
            >
              <rect :x="box.x" :y="box.y" :width="box.w" :height="box.h" rx="8" />
              <polyline
                v-for="(mf, m) in system.inputs[i].mfs"
                :key="m"
                :points="miniCurve(system.inputs[i], mf, box)"
                class="mini-curve"
              />
              <text :x="box.x + box.w / 2" :y="box.y + box.h + 15" class="var-name">{{ system.inputs[i].name }}</text>
            </g>

            <!-- motor de reglas -->
            <g class="var-box var-center" tabindex="0" role="button" aria-label="Ir a las reglas" @click="scrollToRules" @keydown.enter="scrollToRules">
              <rect :x="centerBox.x" :y="centerBox.y" :width="centerBox.w" :height="centerBox.h" rx="10" />
              <text :x="centerBox.x + centerBox.w / 2" :y="centerBox.y + centerBox.h / 2 - 8" class="center-title">{{ system.name || 'sistema' }}</text>
              <text :x="centerBox.x + centerBox.w / 2" :y="centerBox.y + centerBox.h / 2 + 12" class="center-sub">({{ sugeno ? 'Sugeno' : 'Mamdani' }} · {{ completeRules }} reglas)</text>
            </g>

            <!-- salida -->
            <g
              class="var-box var-output"
              :class="{ active: selected.kind === 'output' }"
              tabindex="0"
              role="button"
              :aria-label="`Editar salida ${system.output.name}`"
              @click="select('output', 0)"
              @keydown.enter="select('output', 0)"
            >
              <rect :x="outputBox.x" :y="outputBox.y" :width="outputBox.w" :height="outputBox.h" rx="8" />
              <template v-if="sugeno">
                <line
                  v-for="(st, m) in miniStems"
                  :key="'s' + m"
                  :x1="st.x" :y1="outputBox.y + outputBox.h - 8"
                  :x2="st.x" :y2="outputBox.y + 10"
                  class="mini-curve"
                />
                <line :x1="outputBox.x + 8" :y1="outputBox.y + outputBox.h - 8" :x2="outputBox.x + outputBox.w - 8" :y2="outputBox.y + outputBox.h - 8" class="mini-curve" />
              </template>
              <template v-else>
                <polyline
                  v-for="(mf, m) in system.output.mfs"
                  :key="m"
                  :points="miniCurve(system.output, mf, outputBox)"
                  class="mini-curve"
                />
              </template>
              <text :x="outputBox.x + outputBox.w / 2" :y="outputBox.y + outputBox.h + 15" class="var-name">{{ system.output.name }}</text>
            </g>
          </svg>
        </div>
        <p class="card-hint">Haz clic en una entrada o en la salida para editar su rango y sus funciones de pertenencia.</p>
      </section>

      <!-- ===== Editor de la variable seleccionada ===== -->
      <section class="board-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">
              {{ selected.kind === 'output' ? 'Salida' : `Entrada ${selected.index + 1}` }}:
              <span class="accent">{{ currentVar.name }}</span>
            </h3>
            <p class="card-sub">{{ sugenoOutput ? 'Funciones de salida de Sugeno: constante (z = c) o lineal (z = p1·x1 + … + c)' : 'Funciones de pertenencia de la variable' }}</p>
          </div>
        </div>

        <div class="var-fields">
          <label class="field">
            <span>Nombre (sin espacios)</span>
            <input :value="currentVar.name" @change="renameVar($event.target.value)" maxlength="30" />
          </label>
          <label class="field">
            <span>Rango mínimo</span>
            <input v-model.number="currentVar.range[0]" type="number" step="any" />
          </label>
          <label class="field">
            <span>Rango máximo</span>
            <input v-model.number="currentVar.range[1]" type="number" step="any" />
          </label>
        </div>

        <div class="mf-layout">
          <div class="mf-table-wrap">
            <table class="mf-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Parámetros</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(mf, m) in currentVar.mfs" :key="m">
                  <td><span class="swatch" :style="{ background: mfColor(m) }"></span></td>
                  <td><input v-model="mf.name" class="mf-name" maxlength="20" :aria-label="`Nombre de la función ${m + 1}`" /></td>
                  <td>
                    <select :value="mf.type" @change="changeType(mf, $event.target.value)" :aria-label="`Tipo de la función ${m + 1}`">
                      <option v-for="(info, key) in typeOptions" :key="key" :value="key">{{ info.label }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="params">
                      <label v-for="(label, p) in paramLabels(mf)" :key="p" class="param" :title="label">
                        <span>{{ label }}</span>
                        <input v-model.number="mf.params[p]" type="number" step="any" />
                      </label>
                    </div>
                  </td>
                  <td>
                    <button class="icon-btn" @click="removeMf(m)" :disabled="currentVar.mfs.length <= 1" title="Quitar función">
                      <X class="btn-icon" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button class="btn-text add-row" @click="addMf" :disabled="currentVar.mfs.length >= MAX_MFS">
              <Plus class="btn-icon" />
              <span>Agregar función</span>
            </button>
          </div>

          <!-- Gráfica de las funciones -->
          <div class="mf-plot">
            <svg :viewBox="`0 0 ${PLOT.w} ${PLOT.h}`" role="img" :aria-label="`Funciones de pertenencia de ${currentVar.name}`">
              <line :x1="PLOT.l" :y1="PLOT.t" :x2="PLOT.l" :y2="PLOT.b" class="axis" />
              <line :x1="PLOT.l" :y1="PLOT.b" :x2="PLOT.r" :y2="PLOT.b" class="axis" />
              <text :x="PLOT.l - 6" :y="PLOT.t + 4" class="tick" text-anchor="end">1</text>
              <text :x="PLOT.l - 6" :y="PLOT.b + 4" class="tick" text-anchor="end">0</text>
              <text v-for="t in ticks(currentVar)" :key="t.v" :x="t.x" :y="PLOT.b + 16" class="tick" text-anchor="middle">{{ t.v }}</text>

              <template v-if="sugenoOutput">
                <g v-for="(st, m) in bigStems" :key="'st' + m">
                  <line :x1="st.x" :y1="PLOT.b" :x2="st.x" :y2="PLOT.t + 6" class="big-curve" :style="{ stroke: mfColor(m) }" />
                  <circle :cx="st.x" :cy="PLOT.t + 6" r="4" :style="{ fill: mfColor(m) }" />
                  <text :x="st.labelX" :y="PLOT.t - 6" class="curve-label" :style="{ fill: mfColor(m) }" text-anchor="middle">{{ currentVar.mfs[m].name }}</text>
                </g>
              </template>
              <template v-else>
                <polyline
                  v-for="(mf, m) in currentVar.mfs"
                  :key="'c' + m"
                  :points="bigCurve(currentVar, mf)"
                  class="big-curve"
                  :style="{ stroke: mfColor(m) }"
                />
                <text
                  v-for="(mf, m) in currentVar.mfs"
                  :key="'t' + m"
                  :x="peakX(currentVar, mf)"
                  :y="PLOT.t - 6"
                  class="curve-label"
                  :style="{ fill: mfColor(m) }"
                  text-anchor="middle"
                >{{ mf.name }}</text>
              </template>

              <!-- valores de los escenarios (entradas) o resultados (salida) -->
              <g v-for="(mark, k) in markers" :key="'m' + k">
                <line :x1="mark.x" :y1="PLOT.t" :x2="mark.x" :y2="PLOT.b" class="marker" :style="{ stroke: SCENARIO_COLORS[k] }" />
              </g>
            </svg>
            <div class="plot-legend">
              <span v-for="(sc, k) in scenarios" :key="k"><i :style="{ background: SCENARIO_COLORS[k] }"></i>{{ sc.name }}</span>
              <small>{{ selected.kind === 'output' ? 'Líneas = resultado de cada escenario' : 'Líneas = valor de cada escenario' }}</small>
              <small v-if="sugenoOutput && hasLinear" class="plot-note">Las salidas lineales se dibujan con los valores de {{ scenarios[0]?.name || 'el escenario 1' }}.</small>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Reglas ===== -->
      <section ref="rulesRef" class="board-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Reglas</h3>
            <p class="card-sub">SI … ENTONCES … · “—” significa que esa entrada no importa en la regla</p>
          </div>
          <div class="card-actions">
            <button class="btn-text" @click="addRule">
              <Plus class="btn-icon" />
              <span>Agregar regla</span>
            </button>
          </div>
        </div>

        <div class="rules-scroll">
          <table class="rules-table">
            <thead>
              <tr>
                <th>#</th>
                <th v-for="(v, i) in system.inputs" :key="i">SI {{ v.name }} es</th>
                <th>Conector</th>
                <th>ENTONCES {{ system.output.name }} es</th>
                <th>Peso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rule, r) in system.rules" :key="r" :class="{ incomplete: !isComplete(rule) }">
                <td class="rule-num">{{ r + 1 }}</td>
                <td v-for="(v, i) in system.inputs" :key="i">
                  <select v-model.number="rule.antecedents[i]" :aria-label="`Regla ${r + 1}: ${v.name}`">
                    <option :value="0">—</option>
                    <option v-for="(mf, m) in v.mfs" :key="m" :value="m + 1">{{ mf.name }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="rule.connector" :aria-label="`Regla ${r + 1}: conector`">
                    <option value="and">{{ sugeno ? 'Y (prod)' : 'Y (mín)' }}</option>
                    <option value="or">{{ sugeno ? 'O (probor)' : 'O (máx)' }}</option>
                  </select>
                </td>
                <td>
                  <select v-model.number="rule.output" :aria-label="`Regla ${r + 1}: salida`">
                    <option :value="0">—</option>
                    <option v-for="(mf, m) in system.output.mfs" :key="m" :value="m + 1">{{ mf.name }}</option>
                  </select>
                </td>
                <td><input v-model.number="rule.weight" type="number" min="0" max="1" step="0.1" class="weight" :aria-label="`Regla ${r + 1}: peso`" /></td>
                <td>
                  <button class="icon-btn" @click="system.rules.splice(r, 1)" title="Quitar regla">
                    <X class="btn-icon" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ol class="rules-text">
          <li v-for="(rule, r) in system.rules" :key="r" :class="{ incomplete: !isComplete(rule) }">{{ ruleToText(system, rule) }}</li>
        </ol>
      </section>

      <!-- ===== Escenarios ===== -->
      <section class="board-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">Escenarios</h3>
            <p class="card-sub">Estos valores se envían a MATLAB, que simula cada escenario. Aquí ves una vista previa.</p>
          </div>
        </div>

        <div class="rules-scroll">
          <table class="rules-table scenarios-table">
            <thead>
              <tr>
                <th>Escenario</th>
                <th v-for="(v, i) in system.inputs" :key="i">{{ v.name }} <small>[{{ v.range[0] }} – {{ v.range[1] }}]</small></th>
                <th>Vista previa: {{ system.output.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sc, k) in scenarios" :key="k">
                <td>
                  <span class="swatch" :style="{ background: SCENARIO_COLORS[k] }"></span>
                  <input v-model="sc.name" class="mf-name" maxlength="20" :aria-label="`Nombre del escenario ${k + 1}`" />
                </td>
                <td v-for="(v, i) in system.inputs" :key="i">
                  <input
                    v-model.number="sc.values[i]"
                    type="number"
                    step="any"
                    :class="{ 'out-of-range': outOfRange(sc.values[i], v) }"
                    :title="outOfRange(sc.values[i], v) ? 'Fuera de rango: MATLAB usará el límite más cercano' : ''"
                    :aria-label="`${sc.name}: ${v.name}`"
                  />
                </td>
                <td class="preview-cell">
                  <template v-if="results[k]">
                    <svg viewBox="0 0 120 34" class="mini-agg" aria-hidden="true">
                      <template v-if="results[k].sugeno">
                        <line
                          v-for="(st, r) in previewStems(results[k])"
                          :key="r"
                          :x1="st.x" y1="34" :x2="st.x" :y2="34 - st.h"
                          class="preview-stem"
                          :style="{ stroke: SCENARIO_COLORS[k] }"
                        />
                      </template>
                      <polygon v-else :points="aggPolygon(results[k])" :style="{ fill: SCENARIO_COLORS[k] }" />
                      <line :x1="aggX(results[k].value)" y1="0" :x2="aggX(results[k].value)" y2="34" class="agg-line" />
                    </svg>
                    <strong>{{ formatNum(results[k].value) }}</strong>
                    <span class="result-label">{{ results[k].label }}</span>
                  </template>
                  <span v-else class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== Cómo simular en MATLAB ===== -->
      <section class="step-card-main matlab-card">
        <h3 class="step-main-title">Simular en MATLAB</h3>
        <ol class="matlab-steps">
          <li>Presiona <strong>Simular en MATLAB</strong>: se descarga <code>{{ scriptName }}</code>.</li>
          <li>Ábrelo en MATLAB (doble clic) y presiona <strong>Run</strong> (F5).</li>
          <li>MATLAB simula cada escenario y muestra las gráficas. Con el Fuzzy Logic Toolbox también abre <code>fuzzy</code> con tu sistema: variables, funciones y reglas (menú View → Rules, Rule Viewer y Surface Viewer).</li>
        </ol>
        <p class="step-main-note">
          Con <strong>Descargar .fis</strong> puedes abrir el mismo sistema en el Fuzzy Logic Designer
          (en la terminal: <code>fuzzy('{{ fisName }}')</code>).
        </p>
        <div class="matlab-actions">
          <button @click="downloadMatlab" class="btn-text btn-matlab" :disabled="hasProblems">
            <Play class="btn-icon" />
            <span>Simular en MATLAB</span>
          </button>
          <button @click="downloadFis" class="btn-text" :disabled="hasProblems">
            <FileDown class="btn-icon" />
            <span>Descargar .fis</span>
          </button>
        </div>
      </section>
    </div>

    <!-- Modal Limpiar -->
    <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal = false">
      <div class="modal-card modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">Limpiar pizarra</h3>
          <button @click="showClearModal = false" class="btn-close-icon">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">Se reemplazará el sistema actual. ¿Con qué quieres empezar?</p>
        </div>
        <div class="modal-footer footer-split">
          <button @click="resetTo('example')" class="btn-secondary">Ejemplo (propina)</button>
          <button @click="resetTo('empty')" class="btn-danger-solid">Sistema en blanco</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, Save, FolderOpen, FileDown, Play, Trash2, Plus, Minus, X, BookOpen } from '@lucide/vue'
import StarryBackground from './StarryBackground.vue'
import {
  MF_TYPES,
  SUGENO_MF_TYPES,
  isSugeno,
  sugenoValue,
  toSugenoOutput,
  toMamdaniOutput,
  resizeLinearOutputs,
  evalMF,
  evaluate,
  validateSystem,
  ruleToText,
  toFis,
  toMatlabScript,
  exampleSystem,
  exampleScenarios,
  emptySystem,
  linspace
} from '../utils/fuzzy'

const emit = defineEmits(['back', 'save', 'open-load', 'show-instructions'])

const props = defineProps({
  initialData: { type: Object, default: null }
})

const MAX_INPUTS = 6
const MAX_MFS = 7
const MF_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#ef4444']
const SCENARIO_COLORS = ['#4f46e5', '#0f9d6e', '#db2777']
const clone = (o) => JSON.parse(JSON.stringify(o))

/* ---------------- Estado ---------------- */
const system = ref(clone(props.initialData?.system || exampleSystem()))
const scenarios = ref(clone(props.initialData?.scenarios || exampleScenarios()))
const selected = ref({ kind: 'input', index: 0 })
const showClearModal = ref(false)
const rulesRef = ref(null)

const currentVar = computed(() =>
  selected.value.kind === 'output' ? system.value.output : system.value.inputs[selected.value.index]
)
const sugeno = computed(() => isSugeno(system.value))
const sugenoOutput = computed(() => sugeno.value && selected.value.kind === 'output')
const methodText = computed(() =>
  sugeno.value ? 'Y = producto · O = suma probabilística · promedio ponderado' : 'Y = mín · O = máx · centroide'
)
const typeOptions = computed(() => (sugenoOutput.value ? SUGENO_MF_TYPES : MF_TYPES))
const hasLinear = computed(() => system.value.output.mfs.some((mf) => mf.type === 'linear'))
function paramLabels(mf) {
  if (sugenoOutput.value) {
    return mf.type === 'linear' ? [...system.value.inputs.map((v) => `× ${v.name}`), '+ c'] : ['c']
  }
  return MF_TYPES[mf.type]?.params || []
}

/* ---------------- Mamdani ↔ Sugeno ---------------- */
// Guarda la salida de cada tipo para recuperarla al volver (mismas funciones y nombres)
const savedOutputs = {}
function setType(type) {
  const current = sugeno.value ? 'sugeno' : 'mamdani'
  if (type === current) return
  const out = system.value.output
  savedOutputs[current] = clone(out)
  let next = type === 'sugeno' ? toSugenoOutput(out) : toMamdaniOutput(out, system.value.inputs)
  const prev = savedOutputs[type]
  if (prev && prev.mfs.length === out.mfs.length) {
    // Recupera tipos y parámetros anteriores, pero conserva nombres y rango actuales
    next = { ...next, mfs: prev.mfs.map((mf, m) => ({ ...clone(mf), name: out.mfs[m].name })) }
    if (type === 'sugeno') resizeLinearOutputs(next, system.value.inputs.length)
  }
  system.value.output = next
  system.value.type = type
}

const problems = computed(() => validateSystem(system.value))
const hasProblems = computed(() => problems.value.length > 0)
const isComplete = (rule) => rule.output > 0 && rule.antecedents.some((a) => a > 0)
const completeRules = computed(() => system.value.rules.filter(isComplete).length)

const results = computed(() => {
  if (hasProblems.value) return []
  return scenarios.value.map((sc) => evaluate(system.value, sc.values))
})

const fisName = computed(() => `${(system.value.name || 'sistema_difuso').trim().replace(/\s+/g, '_')}.fis`)
const scriptName = computed(() => {
  const base = (system.value.name || 'sistema').trim().replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z]+/, '')
  return `simular_${base || 'sistema'}.m`
})

/* ---------------- Diagrama ---------------- */
const DIAGRAM = { width: 900, center: { x: 360 } }
const BOX = { w: 170, h: 64, gap: 34 }
const diagramHeight = computed(() => Math.max(230, system.value.inputs.length * (BOX.h + BOX.gap) + 30))
const inputBoxes = computed(() => {
  const n = system.value.inputs.length
  const total = n * BOX.h + (n - 1) * BOX.gap
  const top = (diagramHeight.value - total) / 2 - 8
  return system.value.inputs.map((_, i) => ({ x: 20, y: top + i * (BOX.h + BOX.gap), w: BOX.w, h: BOX.h }))
})
const centerBox = computed(() => ({ x: 360, y: diagramHeight.value / 2 - 50, w: 180, h: 92 }))
const outputBox = computed(() => ({ x: 710, y: diagramHeight.value / 2 - 48, w: 170, h: 84 }))

function miniCurve(variable, mf, box) {
  const [lo, hi] = variable.range.map(Number)
  if (!(hi > lo)) return ''
  const pad = 8
  return linspace(lo, hi, 60)
    .map((x) => {
      const px = box.x + pad + ((x - lo) / (hi - lo)) * (box.w - 2 * pad)
      const py = box.y + box.h - pad - safeMf(mf, x) * (box.h - 2 * pad)
      return `${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')
}

// Sugeno: valor z de cada función de salida (las lineales, con el escenario 1)
const scenarioX = computed(() => system.value.inputs.map((v, i) => {
  const [lo, hi] = v.range.map(Number)
  const x = Number(scenarios.value[0]?.values[i])
  return Number.isFinite(x) ? Math.min(Math.max(x, lo), hi) : (lo + hi) / 2
}))
const outputZ = computed(() => system.value.output.mfs.map((mf) => {
  const z = sugenoValue(mf, scenarioX.value)
  return Number.isFinite(z) ? z : 0
}))
// Rango de la gráfica de salida: el rango de la variable, ampliado si algún z o resultado queda fuera
const outputPlotRange = computed(() => {
  const [lo, hi] = system.value.output.range.map(Number)
  if (!sugeno.value) return [lo, hi]
  const vals = [lo, hi, ...outputZ.value, ...results.value.map((r) => r.value)].filter(Number.isFinite)
  return [Math.min(...vals), Math.max(...vals)]
})
const miniStems = computed(() => {
  const [lo, hi] = outputPlotRange.value
  const box = outputBox.value
  return outputZ.value.map((z) => ({ x: box.x + 10 + ((z - lo) / (hi - lo || 1)) * (box.w - 20) }))
})

function select(kind, index) {
  selected.value = { kind, index }
}

function scrollToRules() {
  rulesRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ---------------- Gráfica grande ---------------- */
const PLOT = { w: 520, h: 230, l: 34, r: 506, t: 26, b: 200 }
const safeMf = (mf, x) => {
  const y = evalMF(mf, x)
  return Number.isFinite(y) ? Math.min(Math.max(y, 0), 1) : 0
}
const rangeOf = (variable) => (variable === system.value.output ? outputPlotRange.value : variable.range.map(Number))
const plotX = (variable, x) => {
  const [lo, hi] = rangeOf(variable)
  return PLOT.l + ((x - lo) / (hi - lo || 1)) * (PLOT.r - PLOT.l)
}
function bigCurve(variable, mf) {
  const [lo, hi] = variable.range.map(Number)
  if (!(hi > lo)) return ''
  return linspace(lo, hi, 200)
    .map((x) => `${plotX(variable, x).toFixed(1)},${(PLOT.b - safeMf(mf, x) * (PLOT.b - PLOT.t)).toFixed(1)}`)
    .join(' ')
}
function peakX(variable, mf) {
  const [lo, hi] = variable.range.map(Number)
  if (!(hi > lo)) return PLOT.l
  let best = lo
  let bestY = -1
  linspace(lo, hi, 200).forEach((x) => {
    const y = safeMf(mf, x)
    if (y > bestY + 1e-9) { bestY = y; best = x }
  })
  return Math.min(Math.max(plotX(variable, best), PLOT.l + 20), PLOT.r - 20)
}
const bigStems = computed(() => {
  const v = system.value.output
  const xs = outputZ.value.map((z) => plotX(v, z))
  // separa un poco las etiquetas que quedarían encimadas
  const labels = xs.map((x, m) => ({ x, m })).sort((a, b) => a.x - b.x)
  for (let i = 1; i < labels.length; i++) labels[i].x = Math.max(labels[i].x, labels[i - 1].x + 48)
  const labelX = []
  labels.forEach((l) => { labelX[l.m] = Math.min(Math.max(l.x, PLOT.l + 20), PLOT.r - 20) })
  return xs.map((x, m) => ({ x, labelX: labelX[m] }))
})
function ticks(variable) {
  const [lo, hi] = rangeOf(variable)
  if (!(hi > lo)) return []
  return linspace(lo, hi, 6).map((v) => ({ v: formatNum(v), x: plotX(variable, v) }))
}
const markers = computed(() => {
  const v = currentVar.value
  const [lo, hi] = v.range.map(Number)
  if (!(hi > lo)) return []
  if (selected.value.kind === 'output') {
    return results.value.map((r) => ({ x: plotX(v, r.value) }))
  }
  return scenarios.value.map((sc) => {
    const x = Math.min(Math.max(Number(sc.values[selected.value.index]), lo), hi)
    return { x: plotX(v, Number.isFinite(x) ? x : lo) }
  })
})
const mfColor = (m) => MF_COLORS[m % MF_COLORS.length]

/* ---------------- Mini gráfica de la vista previa ---------------- */
function aggX(value) {
  const [lo, hi] = outputPlotRange.value
  return Math.min(Math.max(((value - lo) / (hi - lo || 1)) * 120, 1), 119)
}
function previewStems(result) {
  return result.strengths
    .map((w, r) => ({ w, z: result.ruleOutputs[r] }))
    .filter((st) => st.w > 0 && Number.isFinite(st.z))
    .map((st) => ({ x: aggX(st.z), h: Math.min(st.w, 1) * 32 }))
}
function aggPolygon(result) {
  const pts = result.ys.map((y, k) => `${aggX(y).toFixed(1)},${(34 - result.aggregated[k] * 32).toFixed(1)}`)
  return `0,34 ${pts.join(' ')} 120,34`
}

const formatNum = (n) => (Number.isFinite(n) ? Number(n.toFixed(4)).toString() : '—')
const outOfRange = (value, v) => Number(value) < Number(v.range[0]) || Number(value) > Number(v.range[1])

/* ---------------- Edición ---------------- */
function renameVar(value) {
  currentVar.value.name = String(value).trim().replace(/\s+/g, '_')
}

function defaultParams(type, range, center, width) {
  const [lo, hi] = range.map(Number)
  const span = hi - lo || 1
  const c = Number.isFinite(center) ? center : lo + span / 2
  const w = width || span / 4
  const r = (n) => Number(n.toFixed(3))
  if (type === 'trapmf') return [r(c - w), r(c - w / 2), r(c + w / 2), r(c + w)]
  if (type === 'gaussmf') return [r(w / 2), r(c)]
  return [r(c - w), r(c), r(c + w)]
}

function mfCenter(mf) {
  const p = mf.params.map(Number)
  if (mf.type === 'gaussmf') return p[1]
  if (mf.type === 'trapmf') return (p[1] + p[2]) / 2
  return p[1]
}

function changeType(mf, type) {
  if (sugenoOutput.value) {
    const z = sugenoValue(mf, scenarioX.value)
    const c = Number((Number.isFinite(z) ? z : 0).toFixed(3))
    mf.type = type
    mf.params = type === 'linear' ? [...system.value.inputs.map(() => 0), c] : [c]
    return
  }
  const center = mfCenter(mf)
  mf.type = type
  mf.params = defaultParams(type, currentVar.value.range, center)
}

function addMf() {
  const v = currentVar.value
  const [lo, hi] = v.range.map(Number)
  const n = v.mfs.length + 1
  // Redistribuir para que la nueva función no quede encima de las demás
  const center = lo + ((hi - lo) * n) / (n + 1)
  if (sugenoOutput.value) {
    v.mfs.push({ name: `mf${n}`, type: 'constant', params: [Number(center.toFixed(3))] })
    return
  }
  v.mfs.push({ name: `mf${n}`, type: 'trimf', params: defaultParams('trimf', v.range, center, (hi - lo) / (n + 1)) })
}

function removeMf(m) {
  const v = currentVar.value
  if (v.mfs.length <= 1) return
  v.mfs.splice(m, 1)
  // Ajustar las reglas que usaban esa función o las siguientes
  const fix = (idx) => (idx === m + 1 ? 0 : idx > m + 1 ? idx - 1 : idx)
  system.value.rules.forEach((rule) => {
    if (selected.value.kind === 'output') rule.output = fix(rule.output)
    else rule.antecedents[selected.value.index] = fix(rule.antecedents[selected.value.index])
  })
}

function addInput() {
  if (system.value.inputs.length >= MAX_INPUTS) return
  const i = system.value.inputs.length + 1
  system.value.inputs.push({
    name: `entrada${i}`,
    range: [0, 10],
    mfs: [
      { name: 'bajo', type: 'trimf', params: [0, 0, 5] },
      { name: 'medio', type: 'trimf', params: [0, 5, 10] },
      { name: 'alto', type: 'trimf', params: [5, 10, 10] }
    ]
  })
  system.value.rules.forEach((rule) => rule.antecedents.push(0))
  scenarios.value.forEach((sc) => sc.values.push(5))
  const n = system.value.inputs.length
  resizeLinearOutputs(system.value.output, n, { insert: n - 1 })
  if (savedOutputs.sugeno) resizeLinearOutputs(savedOutputs.sugeno, n, { insert: n - 1 })
  select('input', system.value.inputs.length - 1)
}

function removeSelectedInput() {
  if (selected.value.kind !== 'input' || system.value.inputs.length <= 1) return
  const i = selected.value.index
  system.value.inputs.splice(i, 1)
  system.value.rules.forEach((rule) => rule.antecedents.splice(i, 1))
  const n = system.value.inputs.length
  resizeLinearOutputs(system.value.output, n, { remove: i })
  if (savedOutputs.sugeno) resizeLinearOutputs(savedOutputs.sugeno, n, { remove: i })
  scenarios.value.forEach((sc) => sc.values.splice(i, 1))
  select('input', Math.max(0, i - 1))
}

function addRule() {
  system.value.rules.push({
    antecedents: system.value.inputs.map(() => 0),
    output: 0,
    weight: 1,
    connector: 'and'
  })
}

function resetTo(kind) {
  const type = sugeno.value ? 'sugeno' : 'mamdani'
  Object.keys(savedOutputs).forEach((k) => delete savedOutputs[k])
  if (kind === 'example') {
    system.value = exampleSystem()
    scenarios.value = exampleScenarios()
  } else {
    system.value = emptySystem()
    scenarios.value = exampleScenarios().map((sc) => ({
      name: sc.name,
      values: system.value.inputs.map((v) => (Number(v.range[0]) + Number(v.range[1])) / 2)
    }))
  }
  // Mantener el tipo elegido (Mamdani o Sugeno)
  if (type === 'sugeno') setType('sugeno')
  select('input', 0)
  showClearModal.value = false
}

/* ---------------- Descargas ---------------- */
function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadMatlab() {
  if (hasProblems.value) return
  download(scriptName.value, toMatlabScript(system.value, scenarios.value))
}

function downloadFis() {
  if (hasProblems.value) return
  download(fisName.value, toFis(system.value))
}

function saveBoard() {
  emit('save', { system: clone(system.value), scenarios: clone(scenarios.value) })
}
</script>

<style scoped>
/* ===== CONTENEDOR ===== */
.canvas-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-body);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
}

.canvas-workspace > :deep(.starry-background) {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* ===== HEADER ===== */
.canvas-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  position: relative;
  z-index: 20;
}

@media (min-width: 640px) {
  .canvas-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
  }
}

.header-left { display: flex; align-items: center; gap: 0.5rem; }

@media (min-width: 640px) { .header-left { flex: 1; } }

.btn-icon-only {
  padding: 0.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.btn-icon-only:active { transform: scale(0.95); }

.icon { width: 1.25rem; height: 1.25rem; }

.header-info { display: flex; flex-direction: column; flex: 1; }

.header-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

@media (min-width: 640px) { .header-title { font-size: 1rem; } }

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #10b981;
}

.header-subtitle { font-size: 0.6rem; color: var(--text-secondary); margin: 0; }

@media (min-width: 640px) { .header-subtitle { font-size: 0.7rem; } }

.stats-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  width: 100%;
}

@media (min-width: 640px) {
  .stats-container { width: auto; gap: 1rem; font-size: 0.8rem; justify-content: flex-start; }
}

.stat-badge {
  padding: 0.25rem 0.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

@media (min-width: 640px) {
  .stat-badge { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
}

.stat-number { color: var(--text-primary); font-weight: 600; }

.stat-badge-optimal {
  background-color: rgba(0, 242, 255, 0.15);
  border-color: rgba(0, 242, 255, 0.4);
  color: #00f2ff;
}

.btn-clear-opt {
  background: transparent;
  border: none;
  color: #00f2ff;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 0.2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
}

@media (min-width: 640px) {
  .header-actions { width: auto; justify-content: flex-end; flex-wrap: nowrap; }
}

/* ===== BOTONES ===== */
.btn-text {
  padding: 0.4rem 0.6rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  min-height: 2.5rem;
}

@media (min-width: 640px) {
  .btn-text { padding: 0.4rem 0.8rem; font-size: 0.8rem; gap: 0.375rem; min-height: auto; }
}

.btn-text:active:not(:disabled) { transform: scale(0.95); }
.btn-text:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-icon { width: 0.9rem; height: 0.9rem; }

@media (min-width: 640px) { .btn-icon { width: 1rem; height: 1rem; } }

.btn-matrix {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  color: var(--accent-solid);
}

.btn-resolver {
  background: linear-gradient(135deg, var(--accent-start, #a855f7) 0%, var(--accent-end, #d946ef) 100%);
  color: #ffffff !important;
  border: none !important;
  font-weight: 600;
}

.btn-resolver:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 10px var(--accent-soft-bg);
}

.btn-save-graph {
  background-color: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

[data-theme='dark'] .btn-save-graph {
  background-color: rgba(22, 163, 74, 0.15);
  border-color: rgba(74, 222, 128, 0.35);
  color: #4ade80;
}

.btn-danger {
  background-color: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

[data-theme='dark'] .btn-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(248, 113, 113, 0.35);
  color: #f87171;
}

.btn-step {
  background-color: var(--accent-solid);
  border-color: var(--accent-solid);
  color: #ffffff;
  font-weight: 600;
}

.btn-step:hover:not(:disabled) { filter: brightness(1.1); }

/* ===== ÁREA PRINCIPAL ===== */
.board-container {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem 0.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

@media (min-width: 640px) {
  .board-container { padding: 1.5rem 1.5rem 3rem; }
}

.controls,
.board-card,
.step-card-main {
  width: 100%;
  max-width: 1100px;
  box-sizing: border-box;
}

/* ===== CONTROLES ===== */
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.field input {
  width: 4.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-body);
  color: var(--text-primary);
}

.controls-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
}

@media (max-width: 640px) {
  .controls-actions { margin-left: 0; width: 100%; }
  .controls-actions .btn-text { flex: 1; justify-content: center; }
}

/* ===== AVISO ===== */
.connection-tip {
  padding: 0.6rem 1rem;
  background-color: var(--accent-soft-bg);
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--accent-solid);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 1100px;
  width: 100%;
  box-sizing: border-box;
}

.balance-tip {
  background-color: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.5);
  color: #d97706;
}

.pulse-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* ===== TARJETAS ===== */
.board-card,
.step-card-main {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: var(--bg-surface);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
}

/* ===== TABLA ===== */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.transport-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

.transport-table th,
.transport-table td {
  padding: 0.7rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.transport-table th { color: var(--text-secondary); font-size: 0.8rem; }

.transport-table input {
  width: 4.5rem;
  padding: 0.45rem;
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  background: var(--bg-body);
  color: var(--text-primary);
  text-align: center;
}

.transport-table td.active {
  background: var(--accent-soft-bg);
  outline: 2px solid var(--accent-solid);
  outline-offset: -2px;
}

.transport-table td.assigned {
  background: color-mix(in srgb, var(--accent-soft-bg) 60%, transparent);
}

.allocation {
  display: block;
  margin-top: 0.35rem;
  color: var(--accent-solid);
  font-size: 0.75rem;
  font-weight: 700;
}

.remaining {
  display: block;
  margin-top: 0.3rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
}

.supply-cell,
.demand-row td,
.total-cell {
  background: var(--bg-body);
  font-weight: 700;
}

/* ===== RESUMEN ===== */
.summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }

.summary div {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem;
  border-radius: 0.6rem;
  background: var(--bg-body);
}

.summary span,
.summary strong { display: block; }

.summary span { color: var(--text-secondary); font-size: 0.75rem; }
.summary strong { margin-top: 0.3rem; }

@media (max-width: 650px) {
  .summary div { min-width: 100%; }
}

/* ===== EXPLICACIÓN ===== */
.step-main-title {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.step-main-desc {
  margin: 0.35rem 0;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.step-main-note {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* ===== MODALES ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  overflow: hidden;
}

.modal-card.modal-sm { max-width: 420px; }

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group { display: flex; align-items: center; gap: 0.75rem; }

.modal-title { font-size: 1.25rem; font-weight: 600; color: #f8fafc; margin: 0; }

.algorithm-badge {
  background: #312e81;
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #4338ca;
}

.btn-close-icon {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close-icon:hover { color: #f8fafc; }

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.confirm-text { margin: 0; font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; }

.metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

.metric-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-card.highlight { border-color: #6366f1; background: rgba(99, 102, 241, 0.1); }

.metric-label { font-size: 0.85rem; color: #94a3b8; }
.metric-value { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }

.section-container { display: flex; flex-direction: column; gap: 0.75rem; }
.section-heading { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin: 0; }

.table-wrapper { border: 1px solid #334155; border-radius: 8px; overflow: hidden; }

.result-table,
.step-matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
}

.result-table th,
.step-matrix-table th {
  background: #0f172a;
  color: #94a3b8;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid #334155;
}

.result-table td,
.step-matrix-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #1e293b;
  color: #e2e8f0;
}

.font-medium { font-weight: 500; }
.arrow-cell { color: #6366f1; }
.cost-badge { color: #38bdf8; font-weight: 600; }

.steps-accordion { display: flex; flex-direction: column; gap: 1rem; }

.step-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}

.step-title { font-weight: 600; color: #818cf8; display: block; margin-bottom: 0.25rem; }
.step-desc { font-size: 0.85rem; color: #94a3b8; margin: 0 0 0.75rem 0; line-height: 1.5; }

.matrix-preview-wrapper { overflow-x: auto; }

.step-matrix-table { border: 1px solid #334155; }

.step-matrix-table td,
.step-matrix-table th { border: 1px solid #334155; }

.corner-cell,
.row-label-cell {
  background: #1e293b !important;
  color: #94a3b8;
  font-weight: 600;
}

.cell-cost {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.65rem;
  font-weight: 500;
  color: #64748b;
}

.zero-cell { background: rgba(234, 179, 8, 0.15); color: #facc15; font-weight: 700; }

.assigned-cell {
  background: rgba(34, 197, 94, 0.25) !important;
  color: #4ade80 !important;
  font-weight: 700;
  border: 1px solid #22c55e !important;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #0f172a;
}

.btn-primary {
  background: #6366f1;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #4f46e5; }

.btn-secondary {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover { background: #1e293b; }

.btn-danger-solid {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger-solid:hover { background: #dc2626; }

/* ================================================================
   ESTILOS PROPIOS DE LA PIZARRA DIFUSA
   ================================================================ */
.board-container > .board-card,
.board-container > .step-card-main,
.board-container > .fz-problems { width: 100%; max-width: 1100px; box-sizing: border-box; }

.btn-load-graph { background-color: #dbeafe; border-color: #93c5fd; color: #2563eb; }
[data-theme='dark'] .btn-load-graph { background-color: rgba(37, 99, 235, 0.15); border-color: rgba(96, 165, 250, 0.35); color: #60a5fa; }
.btn-matlab { background: linear-gradient(135deg, #f97316, #ea580c); border-color: #ea580c; color: #fff; font-weight: 600; }
.btn-matlab:hover:not(:disabled) { filter: brightness(1.08); }
.fz-workspace .header-title { white-space: nowrap; }
@media (max-width: 1360px) {
  .fz-workspace .header-subtitle, .fz-workspace .stats-container { display: none; }
}

.fz-problems { align-items: flex-start; }
.fz-problems ul { margin: 0.3rem 0 0; padding-left: 1.1rem; }
.fz-problems li { margin-bottom: 0.15rem; }

.card-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.5rem 1rem; margin-bottom: 0.75rem; }
.card-title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary); }
.card-title .accent { color: #8b5cf6; }
.card-sub { margin: 0.2rem 0 0; font-size: 0.78rem; color: var(--text-secondary); }
.card-hint { margin: 0.5rem 0 0; font-size: 0.72rem; color: var(--text-secondary); text-align: center; }
.card-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.name-input, .mf-name {
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.8rem;
  max-width: 160px;
}

/* ----- Diagrama ----- */
.diagram-scroll { overflow-x: auto; }
.diagram { display: block; width: 100%; height: auto; }
.diagram-link { stroke: var(--text-secondary); stroke-width: 1.4; stroke-dasharray: 5 4; opacity: 0.7; }
.var-box { cursor: pointer; outline: none; }
.var-box rect { stroke-width: 1.5; transition: stroke 0.15s ease, filter 0.15s ease; }
.var-input rect { fill: #fdf3c4; stroke: #d9b84a; }
.var-output rect { fill: #cdeefb; stroke: #4fb7e0; }
.var-center rect { fill: #ffffff; stroke: #94a3b8; }
[data-theme='dark'] .var-input rect { fill: #3b3417; stroke: #a8902f; }
[data-theme='dark'] .var-output rect { fill: #10313f; stroke: #2a8db5; }
[data-theme='dark'] .var-center rect { fill: #1e1b33; stroke: #4b4870; }
.var-box:hover rect, .var-box:focus-visible rect { filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.55)); }
.var-box.active rect { stroke: #8b5cf6; stroke-width: 3; }
.mini-curve { fill: none; stroke: #374151; stroke-width: 1.2; }
[data-theme='dark'] .mini-curve { stroke: #e2e8f0; }
.var-name { font-size: 12px; font-weight: 600; fill: var(--text-primary); text-anchor: middle; }
.center-title { font-size: 13px; font-weight: 700; fill: var(--text-primary); text-anchor: middle; }
.center-sub { font-size: 11px; fill: var(--text-secondary); text-anchor: middle; }

/* ----- Editor de variable ----- */
.var-fields { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; margin-bottom: 0.9rem; }
.var-fields .field input { width: 9rem; }
.mf-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.25rem; align-items: start; }
@media (max-width: 1080px) { .mf-layout { grid-template-columns: 1fr; } }
.mf-table-wrap { overflow-x: auto; }
.mf-table, .rules-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.mf-table th, .mf-table td, .rules-table th, .rules-table td {
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  vertical-align: middle;
}
.mf-table th, .rules-table th { font-size: 0.72rem; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
.rules-table th small { font-weight: 400; opacity: 0.8; }
.mf-table .mf-name { max-width: 110px; }
.mf-table select, .rules-table select, .rules-table input, .param input {
  padding: 0.25rem 0.35rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.78rem;
}
.params { display: flex; gap: 0.3rem; }
.param { display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.65rem; color: var(--text-secondary); }
.param input { width: 3.6rem; }
.params { flex-wrap: wrap; }
.param span { max-width: 4.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-toggle { display: inline-flex; margin: 0 0.35rem; border: 1px solid var(--border-color); border-radius: 999px; padding: 2px; background: var(--bg-surface-2); vertical-align: middle; }
.type-toggle button { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.7rem; border-radius: 999px; cursor: pointer; }
.type-toggle button.on { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; }
.type-toggle button:focus-visible { outline: 2px solid #ea580c; outline-offset: 1px; }
.method-text { white-space: nowrap; }
.preview-stem { stroke-width: 3; stroke-linecap: round; opacity: 0.85; }
.plot-note { display: block; width: 100%; color: var(--text-secondary); }
.swatch { display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: 3px; vertical-align: middle; margin-right: 0.35rem; }
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.icon-btn:hover:not(:disabled) { color: #ef4444; border-color: #ef4444; }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.add-row { margin-top: 0.6rem; }

.mf-plot svg { display: block; width: 100%; height: auto; }
.axis { stroke: var(--text-secondary); stroke-width: 1; opacity: 0.6; }
.tick { font-size: 10px; fill: var(--text-secondary); }
.big-curve { fill: none; stroke-width: 2.2; }
.curve-label { font-size: 11px; font-weight: 600; }
.marker { stroke-width: 2; stroke-dasharray: 5 3; }
.plot-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.9rem; font-size: 0.72rem; color: var(--text-secondary); }
.plot-legend span { display: inline-flex; align-items: center; gap: 0.3rem; }
.plot-legend i { display: inline-block; width: 0.9rem; height: 0.18rem; border-radius: 2px; }
.plot-legend small { margin-left: auto; }

/* ----- Reglas ----- */
.rules-scroll { overflow-x: auto; }
.rules-table { min-width: 560px; }
.rule-num { font-weight: 700; color: var(--text-secondary); }
.weight { width: 4rem; }
.rules-table tr.incomplete td { background: rgba(245, 158, 11, 0.08); }
.rules-text { margin: 0.8rem 0 0; padding-left: 1.6rem; list-style: decimal; font-size: 0.8rem; color: var(--text-secondary); }
.rules-text li { margin-bottom: 0.2rem; }
.rules-text li.incomplete { color: #d97706; }

/* ----- Escenarios ----- */
.scenarios-table input[type='number'] { width: 5.5rem; }
.out-of-range { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.12) !important; }
.preview-cell { display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; }
.mini-agg { width: 96px; height: 28px; border-bottom: 1px solid var(--border-color); }
.mini-agg polygon { opacity: 0.55; }
.agg-line { stroke: var(--text-primary); stroke-width: 1.6; }
.result-label {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}
.muted { color: var(--text-secondary); }

/* ----- MATLAB ----- */
.matlab-card { border-color: rgba(234, 88, 12, 0.45); }
.matlab-steps { margin: 0.4rem 0 0.6rem; padding-left: 1.3rem; list-style: decimal; font-size: 0.86rem; color: var(--text-primary); line-height: 1.6; }
.matlab-card code {
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: var(--bg-surface-2, rgba(139, 92, 246, 0.1));
  font-size: 0.8rem;
}
.matlab-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
</style>
