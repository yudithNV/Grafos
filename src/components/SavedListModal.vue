<template>
  <div v-if="show" class="graph-selector-overlay" @click.self="$emit('close')">
    <div class="graph-selector-modal">
      <div class="graph-selector-header" :style="headerBg ? { background: headerBg } : null">
        <h3>{{ title }}</h3>
        <button class="btn-close-selector" @click="$emit('close')">✕</button>
      </div>

      <div v-if="info" class="assignment-selector-info">{{ info }}</div>

      <div class="graph-selector-list">
        <div v-for="(item, i) in items" :key="i" class="graph-item" @click="$emit('load', i)">
          <div class="graph-item-info">
            <span class="graph-item-name">{{ item.name || `${itemLabel} ${i + 1}` }}</span>
            <span class="graph-item-date">{{ item.date }}</span>
          </div>
          <div class="graph-item-stats">
            <span v-for="s in stats(item)" :key="s">{{ s }}</span>
          </div>
          <button class="btn-delete-graph" @click.stop="$emit('delete', i)">🗑️</button>
        </div>

        <div class="graph-item graph-item-new" @click="$emit('create')">
          <div class="graph-item-info">
            <span class="graph-item-name graph-item-name-new">{{ newLabel }}</span>
            <span class="graph-item-date">Empezar desde cero</span>
          </div>
        </div>

        <div v-if="items.length === 0" class="empty-graphs">
          <p>No hay elementos guardados</p>
          <p class="empty-graphs-hint">Haz clic en "{{ newLabel }}" para empezar</p>
        </div>
      </div>

      <div class="graph-selector-footer">
        <button class="btn-cancel-selector" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String,
  info: String,
  items: { type: Array, default: () => [] },
  itemLabel: { type: String, default: 'Elemento' },
  newLabel: { type: String, default: 'Crear nuevo' },
  headerBg: String,
  stats: { type: Function, default: () => [] }
})
defineEmits(['load', 'create', 'delete', 'close'])
</script>

<style scoped>
.graph-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  pointer-events: auto;
}

.graph-selector-modal {
  position: relative;
  z-index: 1;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px var(--shadow-color);
  overflow: hidden;
  color: var(--text-primary);
}

.graph-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-start, #a855f7) 0%, var(--accent-end, #d946ef) 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.graph-selector-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.assignment-selector-info {
  background: rgba(2, 132, 199, 0.08);
  border-bottom: 1px solid rgba(2, 132, 199, 0.2);
  padding: 0.6rem 1.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.btn-close-selector {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  width: 2rem;
  height: 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.btn-close-selector:hover {
  background: rgba(255, 255, 255, 0.3);
}

.graph-selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.graph-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-primary);
}
.graph-item:hover {
  background-color: var(--accent-soft-bg);
  border-color: var(--accent-solid);
  transform: translateX(4px);
}

.graph-item-new {
  border: 2px dashed var(--accent-solid) !important;
  background-color: var(--accent-soft-bg) !important;
}
.graph-item-new:hover {
  filter: brightness(1.05);
}

.graph-item-info {
  flex: 1;
  min-width: 0;
}
.graph-item-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.graph-item-name-new {
  color: var(--accent-solid);
  font-size: 1rem;
}
.graph-item-date {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.graph-item-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-delete-graph {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
  opacity: 0.7;
}
.btn-delete-graph:hover {
  background: rgba(239, 68, 68, 0.2);
  opacity: 1;
  transform: scale(1.1);
}

.empty-graphs {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}
.empty-graphs-hint {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.graph-selector-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.btn-cancel-selector {
  padding: 0.5rem 1.5rem;
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}
.btn-cancel-selector:hover {
  background-color: var(--bg-surface);
  border-color: var(--accent-solid);
  color: var(--text-primary);
}

@media (max-width: 480px) {
  .graph-selector-modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 0.75rem;
  }
  .graph-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .graph-item-stats {
    font-size: 0.65rem;
  }
}
</style>