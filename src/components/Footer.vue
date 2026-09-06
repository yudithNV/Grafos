<template>
  <footer class="app-footer">
    <span class="footer-text">GraphFlow — Grupo pingüinos.exe </span>
    <span class="footer-year">{{ year }}</span>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.5rem 1rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
}

@media (min-width: 640px) {
  .app-footer {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
  }
}

.footer-year {
  opacity: 0.7;
}
</style>