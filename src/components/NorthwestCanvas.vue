<template>
  <main class="northwest-view">
    <!-- Fondo estrellado igual que en el lienzo de grafos -->
    <StarryBackground class="starry-background" />

    <header class="northwest-header">
      <button class="back-button" @click="$emit('back')">← Volver</button>
      <div>
        <span class="eyebrow">PIZARRA DE TRANSPORTE</span>
        <h1>Método Northwest</h1>
        <p>Asigna comenzando por la esquina noroeste hasta satisfacer toda la disponibilidad y demanda.</p>
      </div>
      <button class="reset-button" @click="resetAllocations">Reiniciar</button>
    </header>

    <section class="controls">
      <label>Orígenes <input v-model.number="originCount" type="number" min="1" max="8" @change="resizeTable" /></label>
      <label>Destinos <input v-model.number="destinationCount" type="number" min="1" max="8" @change="resizeTable" /></label>
      <button class="primary-button" @click="runNextStep">
        {{ finished ? 'Completado' : nextStepLabel }}
      </button>
      <button class="secondary-button" @click="runAll" :disabled="finished">Ejecutar todo</button>
    </section>

    <p v-if="warning" class="warning">{{ warning }}</p>

    <section class="board-card">
      <div class="table-scroll">
        <table class="transport-table">
          <thead>
            <tr>
              <th>Origen / Destino</th>
              <th v-for="(_, column) in costs[0]" :key="`heading-${column}`">
                Demanda {{ column + 1 }}
              </th>
              <th>Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, origin) in costs" :key="`row-${origin}`">
              <th>Origen {{ origin + 1 }}</th>
              <td
                v-for="(_, destination) in row"
                :key="`cell-${origin}-${destination}`"
                :class="{ active: currentCell?.row === origin && currentCell?.column === destination, assigned: allocations[origin][destination] > 0 }"
              >
                <input v-model.number="costs[origin][destination]" type="number" min="0" />
                <span v-if="allocations[origin][destination] > 0" class="allocation">
                  +{{ allocations[origin][destination] }}
                </span>
              </td>
              <td class="supply-cell"><input v-model.number="availability[origin]" type="number" min="0" /></td>
            </tr>
            <tr class="demand-row">
              <th>Demanda</th>
              <td v-for="(value, destination) in demand" :key="`demand-${destination}`">
                <input v-model.number="demand[destination]" type="number" min="0" />
              </td>
              <td class="total-cell">{{ totalAvailability }} / {{ totalDemand }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="summary">
        <div><span>Costo acumulado</span><strong>{{ totalCost }}</strong></div>
        <div><span>Asignaciones</span><strong>{{ assignmentCount }}</strong></div>
        <div><span>Estado</span><strong>{{ finished ? 'Solución inicial lista' : 'Pendiente' }}</strong></div>
      </div>
    </section>

    <section class="step-card">
      <span class="eyebrow">EXPLICACIÓN</span>
      <h2>{{ currentStep.title }}</h2>
      <p>{{ currentStep.description }}</p>
      <p class="note">Los números dentro de las celdas son costos unitarios. Las cantidades asignadas aparecen en color junto a cada costo.</p>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import StarryBackground from './StarryBackground.vue'

defineEmits(['back'])

const originCount = ref(3)
const destinationCount = ref(3)
const costs = ref([
  [4, 6, 8],
  [5, 3, 7],
  [6, 5, 4]
])
const availability = ref([20, 30, 25])
const demand = ref([10, 35, 30])
const allocations = ref(createAllocationMatrix())
const currentCell = ref(null)
const finished = ref(false)
const currentStep = ref({
  title: 'Comienza en la esquina noroeste',
  description: 'Presiona “Siguiente paso” para asignar la cantidad posible en la primera celda.'
})

const totalAvailability = computed(() => availability.value.reduce((sum, value) => sum + (Number(value) || 0), 0))
const totalDemand = computed(() => demand.value.reduce((sum, value) => sum + (Number(value) || 0), 0))
const totalCost = computed(() => allocations.value.reduce((sum, row, origin) => sum + row.reduce((rowSum, amount, destination) => rowSum + amount * (Number(costs.value[origin][destination]) || 0), 0), 0))
const assignmentCount = computed(() => allocations.value.flat().filter(Boolean).length)
const nextStepLabel = computed(() => currentCell.value ? 'Siguiente paso' : 'Iniciar método')
const warning = computed(() => totalAvailability.value === totalDemand.value ? '' : 'La disponibilidad total y la demanda total no coinciden. Ajusta los valores para obtener una solución completa.')

function createAllocationMatrix() {
  return Array.from({ length: originCount.value }, () => Array(destinationCount.value).fill(0))
}

function resizeTable() {
  originCount.value = Math.min(8, Math.max(1, Number(originCount.value) || 1))
  destinationCount.value = Math.min(8, Math.max(1, Number(destinationCount.value) || 1))
  costs.value = Array.from({ length: originCount.value }, (_, row) => Array.from({ length: destinationCount.value }, (_, column) => costs.value[row]?.[column] ?? 0))
  availability.value = Array.from({ length: originCount.value }, (_, row) => availability.value[row] ?? 0)
  demand.value = Array.from({ length: destinationCount.value }, (_, column) => demand.value[column] ?? 0)
  resetAllocations()
}

function resetAllocations() {
  allocations.value = createAllocationMatrix()
  currentCell.value = null
  finished.value = false
  currentStep.value = {
    title: 'Comienza en la esquina noroeste',
    description: 'Presiona “Siguiente paso” para asignar la cantidad posible en la primera celda.'
  }
}

function runNextStep() {
  if (finished.value) return
  if (!currentCell.value) currentCell.value = { row: 0, column: 0 }

  const { row, column } = currentCell.value
  const available = Number(availability.value[row]) || 0
  const required = Number(demand.value[column]) || 0
  const amount = Math.min(available, required)
  allocations.value[row][column] += amount
  availability.value[row] = available - amount
  demand.value[column] = required - amount
  currentStep.value = {
    title: `Asignación en Origen ${row + 1} → Demanda ${column + 1}`,
    description: `Se asignan ${amount} unidades, el mínimo entre la disponibilidad restante (${available}) y la demanda restante (${required}).`
  }

  if (availability.value[row] === 0 && demand.value[column] === 0) {
    if (column + 1 < destinationCount.value) currentCell.value = { row, column: column + 1 }
    else if (row + 1 < originCount.value) currentCell.value = { row: row + 1, column }
    else finish()
  } else if (availability.value[row] === 0) {
    if (row + 1 < originCount.value) currentCell.value = { row: row + 1, column }
    else finish()
  } else if (demand.value[column] === 0) {
    if (column + 1 < destinationCount.value) currentCell.value = { row, column: column + 1 }
    else finish()
  }

  if (totalAvailability.value === 0 || totalDemand.value === 0) finish()
}

function runAll() {
  let guard = 0
  while (!finished.value && guard < 100) {
    runNextStep()
    guard += 1
  }
}

function finish() {
  finished.value = true
  currentStep.value = {
    title: 'Solución inicial completada',
    description: 'Northwest terminó las asignaciones. Esta solución es factible, pero no necesariamente tiene el costo mínimo.'
  }
}
</script>

<style scoped>
/* === CONTENEDOR PRINCIPAL === */
.northwest-view {
  position: relative;
  min-height: 100vh;
  padding: 5rem clamp(1rem, 4vw, 4rem);
  background: var(--bg-body);
  color: var(--text-primary);
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}

/* Fondo estrellado igual que en el lienzo de grafos */
.northwest-view > :deep(.starry-background) {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Todo el contenido por encima del fondo */
.northwest-header,
.controls,
.warning,
.board-card,
.step-card {
  position: relative;
  z-index: 1;
}

/* === HEADER === */
.northwest-header {
  max-width: 1100px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  justify-content: space-between;
  flex-wrap: wrap;
}
.northwest-header h1 {
  margin: .5rem 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -.05em;
}
.northwest-header p {
  color: var(--text-secondary);
  margin: 0;
  max-width: 620px;
  line-height: 1.6;
}
.eyebrow {
  color: var(--accent-solid);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .14em;
}

/* === BOTONES === */
.back-button,
.reset-button,
.secondary-button {
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: .6rem;
  padding: .65rem .85rem;
  cursor: pointer;
  white-space: nowrap;
}
.back-button:hover,
.reset-button:hover,
.secondary-button:hover:not(:disabled) {
  background: var(--bg-body);
}

/* === CONTROLES === */
.controls,
.board-card,
.step-card {
  max-width: 1100px;
  margin: 0 auto 1rem;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  align-items: end;
}
.controls label {
  display: grid;
  gap: .35rem;
  color: var(--text-secondary);
  font-size: .78rem;
}
.controls input {
  width: 5rem;
  padding: .65rem;
  border: 1px solid var(--border-color);
  border-radius: .5rem;
  background: var(--bg-surface);
  color: var(--text-primary);
}
.primary-button {
  padding: .7rem 1rem;
  border: 0;
  border-radius: .6rem;
  color: #fff;
  background: var(--accent-solid);
  cursor: pointer;
}
.primary-button:hover {
  opacity: .9;
}
.secondary-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* === ADVERTENCIA === */
.warning {
  max-width: 1100px;
  margin: 1rem auto;
  padding: .75rem 1rem;
  border: 1px solid #f59e0b66;
  border-radius: .6rem;
  color: #d97706;
}

/* === TARJETAS === */
.board-card,
.step-card {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: var(--bg-surface);
}

/* === TABLA === */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.transport-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}
.transport-table th,
.transport-table td {
  padding: .7rem;
  border: 1px solid var(--border-color);
  text-align: center;
}
.transport-table th {
  color: var(--text-secondary);
  font-size: .8rem;
}
.transport-table input {
  width: 4.5rem;
  padding: .45rem;
  border: 1px solid var(--border-color);
  border-radius: .4rem;
  background: var(--bg-body);
  color: var(--text-primary);
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
  margin-top: .35rem;
  color: var(--accent-solid);
  font-size: .75rem;
  font-weight: 700;
}
.supply-cell,
.demand-row td,
.total-cell {
  background: var(--bg-body);
  font-weight: 700;
}

/* === RESUMEN === */
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}
.summary div {
  flex: 1;
  min-width: 150px;
  padding: .75rem;
  border-radius: .6rem;
  background: var(--bg-body);
}
.summary span,
.summary strong {
  display: block;
}
.summary span {
  color: var(--text-secondary);
  font-size: .75rem;
}
.summary strong {
  margin-top: .3rem;
}

/* === PASO A PASO === */
.step-card h2 {
  margin: .6rem 0 .4rem;
}
.step-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: .35rem 0;
}
.note {
  font-size: .8rem;
}

/* === RESPONSIVE === */
@media (max-width: 650px) {
  .northwest-view {
    padding: 2rem 1rem;
  }
  .northwest-header {
    display: grid;
    gap: 1rem;
  }
  .northwest-header .reset-button {
    justify-self: start;
  }
  .back-button {
    justify-self: start;
  }
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  .controls input {
    width: 100%;
  }
  .summary div {
    min-width: 100%;
  }
}
</style>