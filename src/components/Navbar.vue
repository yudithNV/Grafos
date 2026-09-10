<template>
  <nav class="navbar">
    <button class="navbar-brand" @click="$emit('navigate', 'home')">
      <svg viewBox="0 0 40 40" class="brand-logo">
        <line x1="20" y1="8" x2="9" y2="28" class="brand-edge brand-edge-a" />
        <line x1="20" y1="8" x2="31" y2="28" class="brand-edge brand-edge-b" />
        <line x1="9" y1="28" x2="31" y2="28" class="brand-edge brand-edge-c" />
        <circle cx="20" cy="8" r="4" class="brand-node brand-node-a" />
        <circle cx="9" cy="28" r="4" class="brand-node brand-node-b" />
        <circle cx="31" cy="28" r="4" class="brand-node brand-node-c" />
      </svg>
      <span class="brand-name">Graphix</span>
    </button>

    <div class="navbar-links">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-link"
        :class="{ 'nav-link-active': current === item.id }"
        @click="$emit('navigate', item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <button
      class="theme-toggle"
      @click="$emit('toggle-theme')"
      :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    >
      <Sun v-if="theme === 'dark'" class="theme-icon" />
      <Moon v-else class="theme-icon" />
    </button>
  </nav>
</template>

<script setup>
import { Sun, Moon } from '@lucide/vue'

defineProps({
  current: { type: String, default: 'home' },
  theme: { type: String, default: 'light' }
})

defineEmits(['navigate', 'toggle-theme'])

const navItems = [
  { id: 'home', label: 'Inicio' },
  { id: 'algoritmos', label: 'Algoritmos' },
  { id: 'about', label: 'Quiénes somos' }
]
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  
  /* ===== EFECTO GLASSMORPHISM ===== */
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  
  /* ===== NAVBAR FIJO ===== */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 1000;
}

/* Modo oscuro */
[data-theme='dark'] .navbar {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

/* Modo claro más visible */
[data-theme='light'] .navbar {
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.brand-logo {
  width: 1.75rem;
  height: 1.75rem;
}

.brand-edge {
  stroke-width: 3px;
  stroke-linecap: round;
}

.brand-edge-a { stroke: var(--accent-start); }
.brand-edge-b { stroke: var(--accent-end); }
.brand-edge-c { stroke: #ec4899; }

.brand-node {
  stroke: var(--bg-surface);
  stroke-width: 1.5px;
}

.brand-node-a { fill: var(--accent-start); }
.brand-node-b { fill: #ec4899; }
.brand-node-c { fill: var(--accent-end); }

/* ===== NOMBRE DEL SISTEMA CON BRILLO ===== */
/* ===== NOMBRE DEL SISTEMA CON BRILLO NEÓN BLANCO ===== */
.brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  transition: all 0.3s ease;
}

/* Brillo neón blanco (modo oscuro - MÁS intenso) */
[data-theme='dark'] .brand-name {
  color: #ffffff;
  text-shadow: 
    0 0 5px  #ffffff,
    0 0 10px #ffffff;
}

/* Brillo neón blanco (modo claro - MÁS suave) */
[data-theme='light'] .brand-name {
  color: #1a1a1a;              /* texto oscuro para que se lea en fondo claro */
  text-shadow: 
    0 0 5px  rgba(255, 255, 255, 0.9),
    0 0 10px rgba(255, 255, 255, 0.7),
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 255, 255, 0.3);
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  padding: 0.5rem 0.9rem;
  background: none;
  border: none;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* ===== BOTÓN ACTIVO - SOLO LAS LETRAS BRILLAN ===== */
.nav-link-active {
  font-weight: 600;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* ===== DARK: BLANCO con glow (un poco menos intenso que "Graphix") ===== */
[data-theme='dark'] .nav-link-active {
  color: #ffffff;
  text-shadow: 
    0 0 4px  rgba(255, 255, 255, 0.55),
    0 0 10px rgba(255, 255, 255, 0.30),
    0 0 20px rgba(168, 85, 247, 0.20);
}

/* ===== LIGHT: LILA (lo que ya tenías) ===== */
[data-theme='light'] .nav-link-active {
  color: var(--accent-solid);
  text-shadow: 
    0 0 10px rgba(168, 85, 247, 0.5),
    0 0 20px rgba(168, 85, 247, 0.25);
}

/* Línea indicadora debajo del texto activo (opcional, más elegante) */
.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  border-radius: 2px;
}

/* Dark: línea blanca */
[data-theme='dark'] .nav-link-active::after {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

/* Light: línea lila */
[data-theme='light'] .nav-link-active::after {
  background: linear-gradient(90deg, transparent, var(--accent-solid), transparent);
  box-shadow: 0 0 10px var(--accent-solid);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

[data-theme='dark'] .theme-toggle {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.theme-toggle:hover {
  border-color: var(--accent-solid);
  color: var(--accent-solid);
  background: rgba(255, 255, 255, 0.1);
}

.theme-icon {
  width: 1.1rem;
  height: 1.1rem;
}

@media (max-width: 640px) {
  .navbar {
    padding: 0.6rem 0.85rem;
  }
  .brand-name {
    font-size: 1rem;
  }
  .navbar-links {
    gap: 0.1rem;
  }
  .nav-link {
    padding: 0.45rem 0.55rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 420px) {
  .navbar {
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 0.5rem;
  }
  .navbar-brand {
    order: 1;
    flex: 1;
  }
  .theme-toggle {
    order: 2;
  }
  .navbar-links {
    order: 3;
    flex-basis: 100%;
    justify-content: center;
  }
}
</style>