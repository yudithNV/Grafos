<template>
  <div class="about-view">
    <!-- 👇 Fondo de constelaciones -->
    <CanvasBackground />

    <div class="about-content">
      <h1 class="about-title">Quiénes somos</h1>
      <p class="about-text">
        Detrás de Graphix está pinguinos.exe, un equipo de desarrollo enfocado en crear herramientas prácticas para la materia de Análisis de Algoritmos. Esta plataforma nace como un entorno interactivo para visualizar, construir y comprender de forma dinámica el comportamiento de distintos algoritmos en redes de nodos.
      </p>

      <div class="about-team">
        <h2 class="about-subtitle">Integrantes</h2>
        <ul class="team-list">
          <li 
            class="team-member" 
            v-for="member in teamMembers" 
            :key="member.id"
            @click="openMemberModal(member)"
          >
            <img 
              :src="member.image" 
              :alt="member.name"
              class="member-image"
            />
            <span class="member-name">{{ member.name }}</span>
            <span class="member-email">{{ member.email }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal Integrante -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeMemberModal">
      <div class="modal-content">
        <button @click="closeMemberModal" class="modal-close">✕</button>
        
        <div class="modal-header">
          <img 
            :src="selectedMember.image" 
            :alt="selectedMember.name"
            class="modal-image"
          />
        </div>

        <div class="modal-body">
          <h3 class="modal-name">{{ selectedMember.name }}</h3>
          
          <div class="modal-email-section">
            <span class="modal-email-label">📧 Correo:</span>
            <a :href="`mailto:${selectedMember.email}`" class="modal-email-link">
              {{ selectedMember.email }}
            </a>
          </div>

          <p v-if="selectedMember.bio" class="modal-bio">
            {{ selectedMember.bio }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CanvasBackground from './CanvasBackground.vue'

const showModal = ref(false)
const selectedMember = ref(null)

const teamMembers = ref([
  {
    id: 1,
    name: 'Cano Poma, Yerko',
    email: 'yerko.cano@ucb.edu.bo',
    image: '/src/assets/team/yerko.jpg',
    bio: 'Sobreviviendo a los grafos y a los bugs de última hora.'
  },
  {
    id: 2,
    name: 'Flores Gutierrez, Jorge',
    email: 'jorge.flores@ucb.edu.bo',
    image: '/src/assets/team/jorge.jpg',
    bio: 'Amante del café, las desveladas y los algoritmos que tardan más de lo esperado en correr.'
  },
  {
    id: 3,
    name: 'Noa Vargas, Yudith',
    email: 'yudith.noa@ucb.edu.bo',
    image: '/src/assets/team/yudith.jpg',
    bio: 'Intentando que la interfaz se vea bonita y no explote cuando alguien dibuje un grafo mal.'
  },
  {
    id: 4,
    name: 'Carlier Fernandez, Jesus',
    email: 'jesus.carlier@ucb.edu.bo',
    image: '/src/assets/team/jesus.jpg',
    bio: 'Otro miembro más del grupo intentando sobrevivir al semestre.'
  }
])

const openMemberModal = (member) => {
  selectedMember.value = member
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeMemberModal = () => {
  showModal.value = false
  selectedMember.value = null
  document.body.style.overflow = 'auto'
}
</script>

<style scoped>
.about-view {
  position: relative;              /* 👈 NUEVO: ancla el canvas */
  overflow: hidden;                /* 👈 NUEVO: evita que el canvas se salga */
  min-height: calc(100vh - 65px);
  display: flex;
  justify-content: center;
  padding: 6rem 1.5rem 4rem;
  background-color: var(--bg-body);
}

.about-content {
  position: relative;
  z-index: 2;                      /* 👈 NUEVO: por encima del canvas */
  width: 100%;
  max-width: 40rem;
  text-align: left;
}

/* ===== TÍTULO con glow tipo constelación ===== */
.about-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1.25rem;
  text-align: center;
  letter-spacing: -0.03em;
  transition: color 0.3s ease, filter 0.3s ease;
}

@media (min-width: 768px) {
  .about-title {
    font-size: 3.5rem;
  }
}

/* Dark: blanco con glow */
[data-theme='dark'] .about-title {
  color: #ffffff;
  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

/* Light: gradiente violeta con glow */
[data-theme='light'] .about-title {
  background: linear-gradient(135deg, #7c3aed, #a855f7, #d946ef);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;

  filter:
    drop-shadow(0 0 8px  rgba(168, 85, 247, 0.30))
    drop-shadow(0 0 20px rgba(168, 85, 247, 0.18))
    drop-shadow(0 0 38px rgba(217, 70, 239, 0.12));
}

.about-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
}

.about-team {
  margin-top: 2rem;
}

/* ===== SUBTÍTULO con glow sutil (combina con el título) ===== */
.about-subtitle {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

[data-theme='dark'] .about-subtitle {
  color: #f5f3ff;
  text-shadow:
    0 0 6px  rgba(255, 255, 255, 0.35),
    0 0 14px rgba(255, 255, 255, 0.18);
}

[data-theme='light'] .about-subtitle {
  color: #4c4373;
  text-shadow:
    0 0 8px  rgba(168, 85, 247, 0.12),
    0 0 18px rgba(168, 85, 247, 0.06);
}

.team-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
  padding: 0.7rem 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.team-member:hover {
  border-color: var(--accent-solid);
  background-color: var(--accent-soft-bg);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
}

.team-member:hover .member-image {
  border-color: var(--accent-solid);
  transform: scale(1.1);
}

.member-name {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
}

.member-email {
  color: var(--text-secondary);
  font-size: 0.75rem;
  display: none;
}

@media (min-width: 640px) {
  .member-email {
    display: block;
  }
}

/* ========== MODAL ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
  overflow: visible;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.modal-header {
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent-start) 0%, var(--accent-end) 100%);
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-body {
  padding: 2rem 1.5rem;
}

.modal-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
  text-align: center;
}

.modal-email-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-email-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-email-link {
  font-size: 0.95rem;
  color: var(--accent-solid);
  text-decoration: none;
  word-break: break-all;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 0.4rem;
}

.modal-email-link:hover {
  background-color: var(--accent-soft-bg);
  text-decoration: underline;
}

.modal-bio {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 1rem 0;
  font-style: italic;
}

/* ========== DARK MODE ========== */
[data-theme='dark'] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

[data-theme='dark'] .modal-close {
  background-color: rgba(255, 255, 255, 0.2);
}

[data-theme='dark'] .modal-close:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .about-view {
    padding: 5.5rem 1.25rem 3.5rem;
  }
}

@media (max-width: 640px) {
  .about-view {
    padding: 5rem 1rem 3rem;
  }

  .modal-header {
    height: 220px;
  }

  .modal-body {
    padding: 1.5rem 1.25rem;
  }

  .modal-name {
    font-size: 1.15rem;
  }
}

@media (max-width: 420px) {
  .about-title {
    font-size: 2rem;
  }

  .about-text {
    padding: 1.1rem;
    font-size: 0.9rem;
  }

  .about-subtitle {
    font-size: 1rem;
  }
}
</style>