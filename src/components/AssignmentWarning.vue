<template>
  <Transition name="fade">
    <div v-if="show" class="modal-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="modal-container" @mousedown.stop>
          <!-- Barra superior de acento danger -->
          <div class="modal-accent-line modal-accent-danger"></div>

          <!-- Cabecera -->
          <h3 class="modal-title">{{ title || 'Acción no permitida' }}</h3>

          <!-- Contenido de advertencia -->
          <div class="modal-confirm-text">
            <div class="confirm-icon-wrapper confirm-icon-danger">
              <AlertTriangle class="confirm-icon" />
            </div>
            <p class="warning-main-text">{{ message }}</p>
            <p v-if="subMessage" class="warning-sub-text">{{ subMessage }}</p>
          </div>

          <!-- Botón de acción -->
          <div class="modal-btn-group">
            <button type="button" @click="close" class="btn btn-danger">
              Entendido
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { AlertTriangle } from '@lucide/vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Dirección de retorno no permitida'
  },
  message: {
    type: String,
    default: 'No se permiten nodos de retorno para esta herramienta.'
  },
  subMessage: {
    type: String,
    default: 'El grafo debe tener una sola dirección (sin retornos ni ciclos).'
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.modal-container {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 26rem;
  box-shadow: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);
  position: relative;
  color: var(--text-primary);
}

.modal-accent-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.modal-accent-danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
  text-align: center;
}

.modal-confirm-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem 0 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.confirm-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

[data-theme='dark'] .confirm-icon-wrapper.confirm-icon-danger {
  background-color: rgba(239, 68, 68, 0.15);
}

.confirm-icon {
  width: 1.8rem;
  height: 1.8rem;
  color: #ef4444;
}

.warning-main-text {
  margin: 0;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.95rem;
}

.warning-sub-text {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
}

.modal-btn-group {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.btn {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.75rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  text-align: center;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  font-weight: 600;
  border: none;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.96);
  opacity: 0;
}
</style>
