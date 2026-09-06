<template>
  <div class="about-view">
    <div class="about-content">
      <h1 class="about-title">Quiénes somos</h1>
      <p class="about-text">
        <!-- TODO: reemplaza este texto con la descripción real del proyecto -->
        GraphFlow es un proyecto académico desarrollado para la materia de Analisis de Algoritmos. Nace como una herramienta interactiva para
        visualizar, construir y comprender el comportamiento de distintos algoritmos
        aplicados a redes de nodos y conexiones.
      </p>

      <div class="about-team">
        <h2 class="about-subtitle">Integrantes</h2>
        <ul class="team-list">
          <!-- TODO: agrega aquí a los integrantes del equipo -->
          <li>Cano Poma, Yerko</li>
          <li>Flores Gutierrez, Jorge</li>
          <li>Noa Vargas, Yudith</li>
          <li>Apellido, Nombre</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.about-view {
  min-height: calc(100vh - 65px);
  display: flex;
  justify-content: center;
  padding: 3rem 1.5rem 4rem;
  background-color: var(--bg-body);
}

.about-content {
  width: 100%;
  max-width: 40rem;
  text-align: left;
}

.about-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  text-align: center;
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

.about-subtitle {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.team-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-list li {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 0.6rem;
  padding: 0.7rem 1rem;
  color: var(--text-primary);
  font-size: 0.9rem;
}
</style>