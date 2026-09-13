<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      
      <!-- Cabecera -->
      <div class="modal-header">
        <div class="header-title-group">
          <h3 class="modal-title">Resolución Paso a Paso</h3>
          <span class="algorithm-badge" v-if="resultData?.metodo">
            {{ resultData.metodo }}
          </span>
        </div>
        <button @click="$emit('close')" class="btn-close-icon" title="Cerrar">&times;</button>
      </div>

      <!-- Cuerpo -->
      <div class="modal-body">
        
        <!-- Resumen de Métricas -->
        <div class="metrics-grid" v-if="resultData">
          <div class="metric-card highlight">
            <span class="metric-label">Costo Total Óptimo</span>
            <span class="metric-value">{{ resultData.costoTotal ?? 0 }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Asignaciones</span>
            <span class="metric-value">{{ resultData.asignaciones?.length ?? 0 }}</span>
          </div>
        </div>

        <!-- Tabla de Asignaciones Finales -->
        <div class="section-container" v-if="resultData?.asignaciones?.length">
          <h4 class="section-heading">Resumen de Asignaciones Óptimas</h4>
          <div class="table-wrapper">
            <table class="result-table">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th></th>
                  <th>Destino</th>
                  <th>Costo Original</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(asig, index) in resultData.asignaciones" :key="index">
                  <td class="font-medium">{{ asig.origen }}</td>
                  <td class="arrow-cell">→</td>
                  <td class="font-medium">{{ asig.destino }}</td>
                  <td class="cost-badge">{{ asig.costo }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Desglose Paso a Paso con Matrices -->
        <div class="section-container" v-if="resultData?.pasos?.length">
          <h4 class="section-heading">Evolución de la Matriz</h4>
          
          <div class="steps-accordion">
            <div v-for="(paso, pIndex) in resultData.pasos" :key="pIndex" class="step-card">
              <div class="step-card-header">
                <span class="step-title">{{ paso.titulo }}</span>
              </div>
              <p class="step-desc">{{ paso.descripcion }}</p>

              <!-- Renderizado de la Matriz del Paso -->
              <div class="matrix-preview-wrapper" v-if="paso.matrix && paso.matrix.length">
                <table class="step-matrix-table">
                  <thead>
                    <tr>
                      <th class="corner-cell"></th>
                      <th v-for="(label, colIdx) in paso.labels" :key="colIdx">
                        {{ label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIdx) in paso.matrix" :key="rowIdx">
                      <td class="row-label-cell">{{ paso.labels[rowIdx] }}</td>
                      <td 
                        v-for="(val, colIdx) in row" 
                        :key="colIdx"
                        :class="{ 
                          'zero-cell': val === 0,
                          'assigned-cell': isAssignedCell(paso.asignaciones, rowIdx, colIdx)
                        }"
                      >
                        {{ val === Infinity ? '-' : val }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- Pie de la Modal -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-primary">Aceptar</button>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  resultData: {
    type: Object,
    default: () => ({
      metodo: '',
      costoTotal: 0,
      asignaciones: [],
      pasos: []
    })
  }
})

defineEmits(['close'])

const isAssignedCell = (asignaciones, rIdx, cIdx) => {
  if (!asignaciones) return false
  return asignaciones.some(a => a.rowIdx === rIdx && a.colIdx === cIdx)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.algorithm-badge {
  background-color: #312e81;
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
}

.btn-close-icon {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  border-radius: 6px;
}

.btn-close-icon:hover {
  color: #ffffff;
  background-color: #334155;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.metric-card.highlight {
  border-color: #6366f1;
  background-color: rgba(99, 102, 241, 0.1);
}

.metric-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 0.25rem;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-heading {
  font-size: 0.875rem;
  font-weight: 600;
  color: #cbd5e1;
  margin: 0;
}

.table-wrapper {
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.result-table th {
  background-color: #0f172a;
  padding: 0.625rem 0.875rem;
  color: #94a3b8;
  font-weight: 500;
  text-align: left;
}

.result-table td {
  padding: 0.625rem 0.875rem;
  border-top: 1px solid #334155;
}

.arrow-cell {
  color: #6366f1;
  text-align: center;
}

.cost-badge {
  color: #38bdf8;
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

.steps-accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 1rem;
}

.step-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #818cf8;
}

.step-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.35rem 0 0.75rem 0;
}

.matrix-preview-wrapper {
  overflow-x: auto;
  border: 1px solid #334155;
  border-radius: 6px;
}

.step-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  text-align: center;
}

.step-matrix-table th, 
.step-matrix-table td {
  padding: 0.4rem 0.6rem;
  border: 1px solid #334155;
}

.step-matrix-table th {
  background-color: #1e293b;
  color: #94a3b8;
}

.row-label-cell {
  background-color: #1e293b;
  font-weight: 600;
  color: #94a3b8;
}

.zero-cell {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 700;
}

.assigned-cell {
  background-color: #16a34a !important;
  color: #ffffff !important;
  font-weight: 800;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background-color: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #4f46e5;
}
</style>