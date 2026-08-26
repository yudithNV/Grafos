<template>
  <Transition name="fade">
    <div v-if="show" class="modal-backdrop" @mousedown.self="onCancel">
      <Transition name="scale">
        <div class="modal-container" @mousedown.stop>
          <!-- Barra superior plana - MORADO/ROSA -->
          <div class="modal-accent-line"></div>

          <!-- Cabecera -->
          <h3 class="modal-title">{{ title }}</h3>

          <!-- Formulario -->
          <form @submit.prevent="onSubmit" class="modal-form">
            <div v-if="type !== 'confirm'">
              <label v-if="labelText" class="modal-label">
                {{ labelText }}
              </label>
              <input
                ref="inputRef"
                :type="inputType"
                v-model="localValue"
                :placeholder="placeholder"
                class="modal-input"
                :required="type !== 'confirm'"
              />
            </div>
            <div v-else class="modal-confirm-text">
              {{ labelText }}
            </div>

            <!-- Botones de Acción -->
            <div class="modal-btn-group">
              <button type="submit" class="btn btn-save">
                Aceptar
              </button>
              <button type="button" @click="onCancel" class="btn btn-cancel">
                Cancelar
              </button>
            </div>

            <!-- Borrado para Edición -->
            <div v-if="showDelete" class="modal-delete-section">
              <button type="button" @click="onDelete" class="btn btn-delete">
                {{ deleteButtonText || 'Eliminar' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  title: String,
  labelText: String,
  placeholder: String,
  type: {
    type: String,
    default: 'input' // 'input' | 'number' | 'edit-node' | 'edit-edge' | 'confirm'
  },
  initialValue: [String, Number],
  deleteButtonText: String
})

const emit = defineEmits(['close', 'submit', 'delete'])

const localValue = ref('')
const inputRef = ref(null)

const inputType = computed(() => {
  return props.type === 'number' || props.type === 'edit-edge' ? 'number' : 'text'
})

const showDelete = computed(() => {
  return props.type === 'edit-node' || props.type === 'edit-edge'
})

// Escucha cambios de visibilidad
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      localValue.value = props.initialValue !== undefined ? props.initialValue : ''
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
          if (inputType.value === 'text') {
            inputRef.value.select()
          }
        }
      })
    }
  },
  { immediate: true }
)

const onSubmit = () => {
  let val = localValue.value
  if (inputType.value === 'number') {
    val = Number(val)
  }
  emit('submit', val)
}

const onCancel = () => {
  emit('close')
}

const onDelete = () => {
  emit('delete')
}

// Atajo Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) {
    onCancel()
  }
}

watch(
  () => props.show,
  (isActive) => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown)
    } else {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.15); /* Fondo oscuro translúcido suave */
  backdrop-filter: blur(3px);
}

.modal-container {
  background-color: #ffffff; /* Blanco limpio */
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 26rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12);
  position: relative;
}

.modal-accent-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a855f7 0%, #d946ef 50%, #ec4899 100%); /* Morado → Rosa */
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.375rem;
}

.modal-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f8fafc; /* Gris muy claro */
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #1e293b;
  font-weight: 500;
  outline: none;
  transition: all 0.15s ease;
}

.modal-input:focus {
  border-color: #d946ef; /* Rosa en focus */
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(217, 70, 239, 0.1);
}

.modal-input::placeholder {
  color: #cbd5e1;
}

.modal-confirm-text {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
  padding: 0.5rem 0;
}

/* Botones */
.modal-btn-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (min-width: 640px) {
  .modal-btn-group {
    flex-direction: row-reverse;
  }
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

@media (min-width: 640px) {
  .btn {
    width: 50%;
  }
}

.btn-save {
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%); /* Morado a Rosa */
  color: #ffffff;
  font-weight: 600;
  border: none;
}

.btn-save:hover {
  background: linear-gradient(135deg, #9333ea 0%, #be185d 100%);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
}

.btn-cancel {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
  font-weight: 500;
}

.btn-cancel:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
  color: #1e293b;
}

.modal-delete-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.btn-delete {
  background-color: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #dc2626;
  width: 100%;
  font-weight: 500;
}

.btn-delete:hover {
  background-color: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #b91c1c;
}

/* Transiciones */
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