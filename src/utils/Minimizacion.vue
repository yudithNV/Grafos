<script setup>
import { computed } from 'vue'

const props = defineProps({
  matrix: { type: Array, required: true },
  labels: { type: Array, required: true }
})

// 1. Alfa (α): Mínimo de cada fila
const alpha = computed(() => {
  if (!props.matrix.length) return []
  return props.matrix.map(row => Math.min(...row))
})

// 2. Matriz reducida por Filas (C_ij - α_i)
const rowReducedMatrix = computed(() => {
  return props.matrix.map((row, i) => 
    row.map(val => val - alpha.value[i])
  )
})

// 3. Beta (β): Mínimo de cada columna sobre la matriz reducida por filas
const beta = computed(() => {
  if (!rowReducedMatrix.value.length) return []
  const cols = rowReducedMatrix.value[0].length
  const betaArr = []
  
  for (let j = 0; j < cols; j++) {
    const colValues = rowReducedMatrix.value.map(row => row[j])
    betaArr.push(Math.min(...colValues))
  }
  return betaArr
})

// 4. Matriz Reducida Final (C_ij - α_i - β_j)
const finalMatrix = computed(() => {
  return rowReducedMatrix.value.map(row => 
    row.map((val, j) => val - beta.value[j])
  )
})
</script>

<template>
  <div class="algorithm-container">
    <div class="vectors-bar">
      <!-- Muestra de Alfas -->
      <div class="vector-card alpha-card">
        <span class="vector-title">&alpha; (Mínimos por fila)</span>
        <div class="vector-chips">
          <span v-for="(val, idx) in alpha" :key="idx" class="chip">
            &alpha;<sub>{{ labels[idx] }}</sub> = {{ val }}
          </span>
        </div>
      </div>

      <!-- Muestra de Betas -->
      <div class="vector-card beta-card">
        <span class="vector-title">&beta; (Mínimos por columna)</span>
        <div class="vector-chips">
          <span v-for="(val, idx) in beta" :key="idx" class="chip">
            &beta;<sub>{{ labels[idx] }}</sub> = {{ val }}
          </span>
        </div>
      </div>
    </div>

    <!-- Matriz de Resultado Final -->
    <div class="table-wrapper">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="th-corner">De \ A</th>
            <th v-for="label in labels" :key="label" class="th-node">{{ label }}</th>
            <th class="th-alpha">&alpha;<sub>i</sub></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in finalMatrix" :key="i">
            <td class="td-node">{{ labels[i] }}</td>
            <td 
              v-for="(val, j) in row" 
              :key="j"
              class="td-cell"
              :class="{ 'td-zero': val === 0 }"
            >
              {{ val }}
            </td>
            <td class="td-alpha-val">{{ alpha[i] }}</td>
          </tr>
          <tr class="tr-beta">
            <td class="td-beta-label">&beta;<sub>j</sub></td>
            <td v-for="(bVal, j) in beta" :key="j" class="td-beta-val">
              {{ bVal }}
            </td>
            <td class="td-corner-empty">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.algorithm-container { display: flex; flex-direction: column; gap: 1rem; }
.vectors-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.vector-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.6rem 0.8rem; }
.vector-title { font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 0.35rem; }
.vector-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip { font-size: 0.7rem; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-weight: 600; color: #1e293b; }

.table-wrapper { overflow-x: auto; }
.matrix-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.th-corner, .th-node, .th-alpha { padding: 0.5rem; border: 1px solid #cbd5e1; background-color: #f1f5f9; text-align: center; font-weight: 600; }
.th-node { background-color: #eef2ff; color: #4f46e5; }
.th-alpha { background-color: #fef3c7; color: #d97706; }
.td-node { padding: 0.4rem; border: 1px solid #cbd5e1; background-color: #f1f5f9; text-align: center; font-weight: 600; }
.td-cell { padding: 0.4rem; border: 1px solid #cbd5e1; text-align: center; background-color: #ffffff; font-weight: 500; }
.td-zero { background-color: #d1fae5; color: #047857; font-weight: 700; }
.td-alpha-val { padding: 0.4rem; border: 1px solid #cbd5e1; background-color: #fef3c7; color: #d97706; text-align: center; font-weight: 700; }
.td-beta-label { padding: 0.4rem; border: 1px solid #cbd5e1; background-color: #dbeafe; color: #1d4ed8; text-align: center; font-weight: 700; }
.td-beta-val { padding: 0.4rem; border: 1px solid #cbd5e1; background-color: #dbeafe; color: #1d4ed8; text-align: center; font-weight: 700; }
.td-corner-empty { padding: 0.4rem; border: 1px solid #cbd5e1; background-color: #f1f5f9; text-align: center; color: #94a3b8; }
</style>