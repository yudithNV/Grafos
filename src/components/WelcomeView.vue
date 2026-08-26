<template>
  <div class="welcome-container">
    <div class="welcome-content">
      
      <!-- Logo Grafos (Estilo Académico Plano) -->
      <div class="logo-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" class="logo-svg">
          <!-- Conexiones -->
          <line x1="80" y1="25" x2="35" y2="105" class="edge-line edge-violet" />
          <line x1="80" y1="25" x2="125" y2="105" class="edge-line edge-cyan" />
          <line x1="35" y1="105" x2="125" y2="105" class="edge-line edge-pink" />
          
          <!-- Nodos -->
          <circle cx="80" cy="25" r="14" class="node-circle node-violet" />
          <circle cx="35" cy="105" r="14" class="node-circle node-pink" />
          <circle cx="125" cy="105" r="14" class="node-circle node-cyan" />

          <!-- Puntos centrales -->
          <circle cx="80" cy="25" r="4" fill="#ffffff" />
          <circle cx="35" cy="105" r="4" fill="#ffffff" />
          <circle cx="125" cy="105" r="4" fill="#ffffff" />
        </svg>
      </div>

      <!-- Título de la Aplicación -->
      <h1 class="app-title">GraphFlow</h1>
      
      <!-- Subtítulo -->
      <p class="app-subtitle">
        Simulador interactivo para el estudio y diseño de estructuras de grafos.
      </p>

      <!-- Botones de Acción -->
      <div class="btn-group">
        <button @click="$emit('start')" class="btn btn-primary">
          <Play class="btn-icon" />
          <span>Iniciar Simulador</span>
        </button>
        <button @click="$emit('show-instructions')" class="btn btn-secondary">
          <BookOpen class="btn-icon" />
          <span>Manual de Usuario</span>
        </button>
      </div>

      <!-- Cuadrícula de Características Académicas -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon-wrapper text-violet">
            <Sparkles class="w-5 h-5" />
          </div>
          <h3 class="feature-title">Lienzo Interactivo</h3>
          <p class="feature-desc">
            Inserción de nodos con clics en espacios vacíos y posicionamiento libre mediante arrastre.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-wrapper text-pink">
            <GitFork class="w-5 h-5 rotate-90" />
          </div>
          <h3 class="feature-title">Aristas Bidireccionales</h3>
          <p class="feature-desc">
            Soporte para conexiones de ida y vuelta representadas con curvas paralelas independientes.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-wrapper text-cyan">
            <Sliders class="w-5 h-5" />
          </div>
          <h3 class="feature-title">Edición Completa</h3>
          <p class="feature-desc">
            Edición de etiquetas y pesos de aristas, y borrado de elementos con doble clic.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { Play, BookOpen, Sparkles, GitFork, Sliders } from '@lucide/vue'

defineEmits(['start', 'show-instructions'])
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-color: #f8fafc; /* Fondo plano Slate 900 */
  overflow-y: auto;
}

.welcome-content {
  max-w-4xl: 56rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 10;
}

/* Ilustración del Grafo */
.logo-container {
  margin-bottom: 2rem;
}

.logo-svg {
  width: 7.5rem;
  height: 7.5rem;
}

.edge-line {
  stroke-width: 3px;
  stroke-linecap: round;
}

.edge-violet { stroke: #6366f1; }
.edge-cyan { stroke: #06b6d4; }
.edge-pink { stroke: #ec4899; }

.node-circle {
  stroke: #1e293b;
  stroke-width: 2px;
}

.node-violet { fill: #6366f1; }
.node-pink { fill: #ec4899; }
.node-cyan { fill: #06b6d4; }

/* Tipografía */
/* Titulo principal */
.app-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  margin-bottom: 1rem;
  color: #0f172a;
}

@media (min-width: 768px) {
  .app-title {
    font-size: 4.5rem;
  }
}

.app-subtitle {
  color: #475569; /* Gris pizarra legible */
  font-size: 1.125rem;
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 2.5rem;
  font-weight: 300;
  line-height: 1.625;
}

/* Botones */
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 4rem;
}

@media (min-width: 640px) {
  .btn-group {
    flex-direction: row;
    justify-content: center;
  }
}

.btn {
  width: 100%;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: 1px solid transparent;
}

@media (min-width: 640px) {
  .btn {
    width: auto;
  }
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-primary {
  background-color: #B811EF; /* Indigo 600 plano */
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #9738CA; /* Indigo 700 */
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background-color: #1e293b; /* Slate 800 */
  border-color: #334155; /* Slate 750 */
  color: #e2e8f0;
}

.btn-secondary:hover {
  background-color: #334155;
  color: #ffffff;
}

.btn-secondary:active {
  transform: scale(0.98);
}

/* Grid de Características */
.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
  max-width: 48rem;
}

@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
/* Las tarjetas de características*/
.feature-card {
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: #FFFFFF; /* Slate 800 plano */
  border: 1px solid #334155;
  text-align: left;
}

.feature-card:hover {
  border-color: #cbd5e1;                 /* Un gris un poquito más oscuro al pasar el mouse */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.feature-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  background-color: #0f172a;
}

.text-violet { color: #818cf8; }
.text-pink { color: #f472b6; }
.text-cyan { color: #22d3ee; }

/* Títulos de las tarjetas */
.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.5rem;
}
/* Textos secundarios (descripciones de las tarjetas) */
.feature-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}
</style>
