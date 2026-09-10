<template>
  <Transition name="fade">
    <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
      <Transition name="scale">
        <div class="modal-container" @mousedown.stop">
          <!-- Barra superior con color según tipo -->
          <div class="modal-accent-line" :class="type === 'confirm' ? 'modal-accent-danger' : 'modal-accent-primary'"></div>

          <!-- Cabecera -->
          <h3 class="modal-title">{{ title }}</h3>

          <!-- Formulario -->
          <form @submit.prevent="submit">
            <!-- Modo Confirmación -->
            <div v-if="type === 'confirm'" class="modal-confirm-text">
              <div class="confirm-icon-wrapper">
                <Trash2 class="confirm-icon" />
              </div>
              <p>{{ message || '¿Estás seguro?' }}</p>
            </div>

            <!-- Modo Edición -->
            <div v-else>
              <label v-if="label" class="modal-label">{{ label }}</label>
              <input
                ref="inputRef"
                :type="type === 'number' ? 'number' : 'text'"
                v-model="inputValue"
                :placeholder="placeholder"
                class="modal-input"
                required
              />
            </div>

            <!-- Boton Nombre Rapido (solo cuando el padre lo habilita) -->
            <button
              v-if="quickFill"
              type="button"
              @click="useQuickFill"
              class="btn btn-quick"
            >
              Nombre rápido ({{ quickFillValue }})
            </button>

            <!-- Botones -->
            <div class="modal-btn-group">
              <button type="submit" class="btn" :class="type === 'confirm' ? 'btn-danger' : 'btn-save'">
                {{ type === 'confirm' ? 'Eliminar' : 'Guardar' }}
              </button>
              <button type="button" @click="close" class="btn btn-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Trash2 } from '@lucide/vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'input' }, // 'input' | 'number' | 'confirm'
  message: { type: String, default: '' },
  initialValue: { type: [String, Number], default: '' },
  quickFill: { type: Boolean, default: false }, // Muestra el botón "Nombre rápido"
  quickFillValue: { type: String, default: '' } // Valor que se usará al presionarlo
})

const emit = defineEmits(['update:modelValue', 'submit'])

const inputValue = ref('')
const inputRef = ref(null)

watch(() => props.modelValue, (val) => {
  if (val) {
    inputValue.value = props.initialValue ?? ''
    nextTick(() => {
      if (inputRef.value && props.type !== 'confirm') {
        inputRef.value.focus()
        if (props.type === 'input') {
          inputRef.value.select()
        }
      }
    })
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const submit = () => {
  let val = inputValue.value
  if (props.type === 'number') {
    val = Number(val)
  }
  emit('submit', val)
  close()
}

// Rellena el nombre autogenerado (ej. N1, N2...) y envia directamente
const useQuickFill = () => {
  inputValue.value = props.quickFillValue
  submit()
}

// Escape para cerrar
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (isActive) => {
  if (isActive) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
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
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(3px);
}

.modal-container {
  background-color: #ffffff;
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
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.modal-accent-primary {
  background: linear-gradient(90deg, #a855f7 0%, #d946ef 50%, #ec4899 100%);
}

.modal-accent-danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
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
  background-color: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #1e293b;
  font-weight: 500;
  outline: none;
  transition: all 0.15s ease;
}

.modal-input:focus {
  border-color: #d946ef;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(217, 70, 239, 0.1);
}

.modal-input::placeholder {
  color: #cbd5e1;
}

.modal-confirm-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
}

.confirm-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.confirm-icon {
  width: 1.8rem;
  height: 1.8rem;
  color: #ef4444;
}

.modal-confirm-text p {
  margin: 0;
}

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
  background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%);
  color: #ffffff;
  font-weight: 600;
  border: none;
}

.btn-save:hover {
  background: linear-gradient(135deg, #9333ea 0%, #be185d 100%);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
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

.btn-quick {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  border: 1.5px dashed #a855f7;
  background-color: #faf5ff;
  color: #9333ea;
  transition: all 0.15s ease;
}

.btn-quick:hover {
  background-color: #f3e8ff;
  border-color: #9333ea;
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