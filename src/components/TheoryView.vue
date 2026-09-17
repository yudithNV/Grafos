<template>
  <main class="theory-view">
    <CanvasBackground />
    <div class="theory-shell">
      <header class="page-header">
        <span class="eyebrow">RUTA ACADÉMICA</span>
        <h1>Fundamentos de teoría de grafos</h1>
        <p>Un recorrido progresivo desde el lenguaje básico hasta los algoritmos que puedes experimentar en Graphix.</p>

        <!-- ============ TABS ============ -->
        <nav class="tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ 'tab-active': activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </header>

      <div class="theory-layout">
        <!-- ============ ÍNDICE LATERAL ============ -->
        <aside class="theory-index">
          <span>EN ESTA PÁGINA</span>
          <a
            v-for="item in currentSections"
            :key="item.id"
            :href="`#${item.id}`"
          >{{ item.label }}</a>
        </aside>

        <!-- ============ CONTENIDO ============ -->
        <article class="theory-content">
          <!-- ================= TAB: GRAFOS ================= -->
          <template v-if="activeTab === 'grafos'">
            <!-- 01 · CONCEPTOS -->
            <section id="conceptos">
              <span class="section-kicker">01 · LENGUAJE BÁSICO</span>
              <h2>¿Qué es un grafo?</h2>
              <p>
                Un grafo es una estructura matemática que representa relaciones entre objetos.
                Se define como <strong>G = (V, E)</strong>, donde V es el conjunto de vértices
                y E el conjunto de aristas que los conectan. Esta abstracción permite modelar
                redes sociales, mapas, dependencias de tareas y sistemas de comunicación.
              </p>

              <!-- SVG NODO Y ARISTA -->
              <div class="concept-visual">
                <div class="concept-card">
                  <svg viewBox="0 0 200 160" class="concept-svg">
                    <circle cx="100" cy="70" r="42" class="node-fill" />
                    <text x="100" y="78" class="node-label">NODO</text>
                  </svg>
                  <h4>Nodo</h4>
                  <p>Unidad básica de información o entidad.</p>
                  <small>(También llamado Vértice)</small>
                </div>

                <div class="concept-card">
                  <svg viewBox="0 0 260 160" class="concept-svg">
                    <line x1="40" y1="120" x2="220" y2="50" class="edge-line" />
                    <circle cx="40" cy="120" r="14" class="node-hollow" />
                    <circle cx="220" cy="50" r="14" class="node-hollow" />
                    <text x="40" y="125" class="node-label-sm">A</text>
                    <text x="220" y="55" class="node-label-sm">B</text>
                  </svg>
                  <h4>Arista</h4>
                  <p>Conexión que representa una relación entre dos nodos.</p>
                  <small>(También llamado Lazo o Enlace)</small>
                </div>
              </div>

              <div class="definition-grid">
                <div><strong>Vértices (V)</strong><span>Entidades, estados o puntos de la red.</span></div>
                <div><strong>Aristas (E)</strong><span>Relaciones o conexiones entre vértices.</span></div>
                <div><strong>Grado</strong><span>Número de aristas incidentes en un vértice.</span></div>
              </div>

              <!-- VIDEO 1 -->
              <div class="video-block">
                <span class="video-label">🎬 Video recomendado</span>
                <div class="video-wrapper">
                  <iframe
                    src="https://www.youtube.com/embed/vnNFiNVy9KM"
                    title="Introducción a grafos"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>Pega aquí tu URL de YouTube</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- 02 · TIPOS DE GRAFOS -->
            <section id="tipos">
              <span class="section-kicker">02 · CLASIFICACIÓN</span>
              <h2>Tipos de grafos según sus conexiones</h2>
              <p>La forma en que se comportan las conexiones determina qué preguntas podemos hacer y qué algoritmo conviene utilizar.</p>

              <div class="graph-types-grid">
                <!-- DIRIGIDO -->
                <div class="graph-type-card">
                  <h3>Grafo Dirigido</h3>
                  <svg viewBox="0 0 220 180" class="graph-svg">
                    <defs>
                      <marker id="arrow" markerWidth="10" markerHeight="10" refX="18" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill="var(--accent-solid)" />
                      </marker>
                    </defs>
                    <line x1="60" y1="40" x2="150" y2="40" class="edge-line arrow" marker-end="url(#arrow)" />
                    <line x1="150" y1="40" x2="170" y2="120" class="edge-line arrow" marker-end="url(#arrow)" />
                    <line x1="170" y1="120" x2="80" y2="140" class="edge-line arrow" marker-end="url(#arrow)" />
                    <line x1="80" y1="140" x2="60" y2="40" class="edge-line arrow" marker-end="url(#arrow)" />
                    <circle cx="60" cy="40" r="16" class="node-hollow" />
                    <circle cx="150" cy="40" r="16" class="node-hollow" />
                    <circle cx="170" cy="120" r="16" class="node-hollow" />
                    <circle cx="80" cy="140" r="16" class="node-hollow" />
                  </svg>
                  <p>Flechas indican dirección. Solo nodos y aristas con flechas.</p>
                </div>

                <!-- NO DIRIGIDO -->
                <div class="graph-type-card">
                  <h3>Grafo No Dirigido</h3>
                  <svg viewBox="0 0 220 180" class="graph-svg">
                    <line x1="60" y1="40" x2="150" y2="40" class="edge-line" />
                    <line x1="150" y1="40" x2="170" y2="120" class="edge-line" />
                    <line x1="170" y1="120" x2="80" y2="140" class="edge-line" />
                    <line x1="80" y1="140" x2="60" y2="40" class="edge-line" />
                    <circle cx="60" cy="40" r="16" class="node-hollow" />
                    <circle cx="150" cy="40" r="16" class="node-hollow" />
                    <circle cx="170" cy="120" r="16" class="node-hollow" />
                    <circle cx="80" cy="140" r="16" class="node-hollow" />
                  </svg>
                  <p>Aristas sin dirección. Relaciones simétricas.</p>
                </div>

                <!-- PONDERADO -->
                <div class="graph-type-card">
                  <h3>Grafo Ponderado</h3>
                  <svg viewBox="0 0 220 180" class="graph-svg">
                    <line x1="60" y1="40" x2="150" y2="40" class="edge-line" />
                    <line x1="150" y1="40" x2="170" y2="120" class="edge-line" />
                    <line x1="170" y1="120" x2="80" y2="140" class="edge-line" />
                    <line x1="80" y1="140" x2="60" y2="40" class="edge-line" />
                    <line x1="150" y1="40" x2="80" y2="140" class="edge-line" />
                    <circle cx="60" cy="40" r="16" class="node-hollow" />
                    <circle cx="150" cy="40" r="16" class="node-hollow" />
                    <circle cx="170" cy="120" r="16" class="node-hollow" />
                    <circle cx="80" cy="140" r="16" class="node-hollow" />
                    <text x="100" y="32" class="weight-label">10</text>
                    <text x="168" y="85" class="weight-label">15</text>
                    <text x="120" y="135" class="weight-label">20</text>
                    <text x="40" y="95" class="weight-label">5</text>
                    <text x="130" y="100" class="weight-label">22</text>
                  </svg>
                  <p>Aristas con valores numéricos (costos, distancias).</p>
                </div>

                <!-- NO PONDERADO -->
                <div class="graph-type-card">
                  <h3>Grafo No Ponderado</h3>
                  <svg viewBox="0 0 220 180" class="graph-svg">
                    <line x1="60" y1="40" x2="150" y2="40" class="edge-line" />
                    <line x1="150" y1="40" x2="170" y2="120" class="edge-line" />
                    <line x1="170" y1="120" x2="80" y2="140" class="edge-line" />
                    <line x1="80" y1="140" x2="60" y2="40" class="edge-line" />
                    <circle cx="60" cy="40" r="16" class="node-hollow" />
                    <circle cx="150" cy="40" r="16" class="node-hollow" />
                    <circle cx="170" cy="120" r="16" class="node-hollow" />
                    <circle cx="80" cy="140" r="16" class="node-hollow" />
                  </svg>
                  <p>Todas las aristas tienen el mismo peso implícito.</p>
                </div>
              </div>

              <ul class="extra-props">
                <li><strong>Conexo:</strong> existe un camino entre cualquier par de vértices.</li>
                <li><strong>Cíclico / acíclico:</strong> contiene o no recorridos que regresan al punto de partida.</li>
                <li><strong>Denso / disperso:</strong> muchas o pocas aristas respecto al número de vértices.</li>
              </ul>
            </section>

            <!-- 03 · REPRESENTACIONES -->
            <section id="representaciones">
              <span class="section-kicker">03 · MODELADO</span>
              <h2>Representaciones</h2>
              <p>La elección de representación afecta el consumo de memoria y el tiempo de las operaciones.</p>
              <div class="comparison">
                <div>
                  <h3>Matriz de adyacencia</h3>
                  <p>Tabla V × V. Permite consultar una conexión rápidamente. Recomendada para grafos densos.</p>
                  <code>matriz[u][v] = peso</code>
                </div>
                <div>
                  <h3>Lista de adyacencia</h3>
                  <p>Cada vértice almacena sus vecinos. Es eficiente para grafos dispersos y recorridos.</p>
                  <code>lista[u] = [(v, peso)]</code>
                </div>
              </div>
            </section>

            <!-- 04 · COMPLEJIDAD -->
            <section id="complejidad">
              <span class="section-kicker">04 · ANÁLISIS</span>
              <h2>Complejidad y elección</h2>
              <p>
                Analizar un algoritmo significa estimar cómo crece su tiempo y memoria al aumentar la entrada.
                Considera siempre el número de vértices, aristas, densidad del grafo y si las conexiones tienen pesos negativos.
              </p>
              <div class="callout">
                <strong>Consejo de estudio</strong>
                <span>
                  Antes de abrir una pizarra, identifica el tipo de grafo, define el objetivo
                  y anota qué información debe conservar el algoritmo en cada paso.
                </span>
              </div>
            </section>
          </template>

          <!-- ================= TAB: ALGORITMOS ================= -->
          <template v-else>
            <!-- 01 · DEFINICIÓN DE ALGORITMO -->
            <section id="definicion-algoritmo">
              <span class="section-kicker">01 · FUNDAMENTO</span>
              <h2>¿Qué es un algoritmo?</h2>
              <p>
                Un <strong>algoritmo</strong> es una secuencia finita y ordenada de pasos que, partiendo de una
                entrada, produce una salida correcta en un tiempo finito. En teoría de grafos, un algoritmo
                recibe un grafo (o una consulta sobre él) y devuelve una respuesta: un camino, un árbol,
                una asignación, un orden, etc.
              </p>

              <div class="definition-grid">
                <div>
                  <strong>Entrada</strong>
                  <span>El grafo G = (V, E), sus pesos y el objetivo a resolver.</span>
                </div>
                <div>
                  <strong>Proceso</strong>
                  <span>Pasos finitos, deterministas y bien definidos.</span>
                </div>
                <div>
                  <strong>Salida</strong>
                  <span>Una solución: camino, árbol, matching, orden…</span>
                </div>
              </div>

              <p>
                Un buen algoritmo sobre grafos debe ser <strong>correcto</strong> (siempre da la respuesta correcta),
                <strong>eficiente</strong> (usa pocos recursos) y <strong>robusto</strong> (funciona con distintos
                tamaños y formas de grafo).
              </p>

              <div class="callout">
                <strong>Idea clave</strong>
                <span>
                  No existe un algoritmo "mejor" para todo. Cada problema (camino mínimo, matching, MST, flujo…)
                  tiene algoritmos especializados con supuestos y complejidades distintas.
                </span>
              </div>

              <!-- 🎬 VIDEO 1 — Definición de algoritmos -->
              <div class="video-block">
                <span class="video-label">🎬 Video: ¿Qué es un algoritmo?</span>
                <div class="video-wrapper">
                  <iframe
                    src=""
                    title="¿Qué es un algoritmo?"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>Pega aquí tu URL de YouTube</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- 02 · TIPOS DE ALGORITMOS -->
            <section id="tipos-algoritmos">
              <span class="section-kicker">02 · CLASIFICACIÓN</span>
              <h2>Tipos de algoritmos sobre grafos</h2>
              <p>
                Los algoritmos de grafos se agrupan según el <strong>problema</strong> que resuelven.
                Esta clasificación te ayuda a elegir el correcto antes de mirar código.
              </p>

              <div class="algo-types-grid">
                <article class="algo-type-card">
                  <h3>🔍 Recorrido</h3>
                  <p>Exploran todos los vértices del grafo de forma sistemática.</p>
                  <ul>
                    <li>BFS (anchura)</li>
                    <li>DFS (profundidad)</li>
                  </ul>
                </article>

                <article class="algo-type-card">
                  <h3>🛣️ Caminos mínimos</h3>
                  <p>Encuentran la ruta más barata entre dos o más nodos.</p>
                  <ul>
                    <li>Dijkstra</li>
                    <li>Bellman-Ford</li>
                    <li>Floyd-Warshall</li>
                  </ul>
                </article>

                <article class="algo-type-card">
                  <h3>🌳 Árboles de expansión</h3>
                  <p>Conectan todos los vértices con el mínimo costo total.</p>
                  <ul>
                    <li>Kruskal</li>
                    <li>Prim</li>
                  </ul>
                </article>

                <article class="algo-type-card">
                  <h3>🔗 Asignación y matching</h3>
                  <p>Emparejan elementos minimizando o maximizando costos.</p>
                  <ul>
                    <li>Húngaro (asignación)</li>
                    <li>Hopcroft-Karp</li>
                  </ul>
                </article>

                <article class="algo-type-card">
                  <h3>📐 Todos los pares</h3>
                  <p>Calculan rutas óptimas entre cada par de vértices.</p>
                  <ul>
                    <li>Floyd-Warshall</li>
                    <li>Johnson</li>
                  </ul>
                </article>

                <article class="algo-type-card">
                  <h3>📊 Ordenamiento</h3>
                  <p>Ordenan vértices respetando dependencias (DAG).</p>
                  <ul>
                    <li>Kahn (BFS)</li>
                    <li>DFS topológico</li>
                  </ul>
                </article>
              </div>
            </section>

            <!-- 03 · APLICACIONES -->
            <section id="aplicaciones">
              <span class="section-kicker">03 · MUNDO REAL</span>
              <h2>Aplicaciones de los algoritmos de grafos</h2>
              <p>
                Los algoritmos de grafos no son solo teoría: están detrás de muchísimas tecnologías
                que usamos a diario. Aquí algunas de las aplicaciones más comunes, agrupadas por área.
              </p>

              <div class="apps-grid">
                <article class="app-card">
                  <span class="app-icon">🗺️</span>
                  <h3>Navegación y mapas</h3>
                  <p>
                    Google Maps, Waze y cualquier GPS usan <strong>Dijkstra</strong> o <strong>A*</strong>
                    para calcular la ruta más rápida entre dos puntos considerando distancias, tráfico y peajes.
                  </p>
                  <small>Algoritmos: Dijkstra, A*, Bellman-Ford</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">🌐</span>
                  <h3>Redes sociales</h3>
                  <p>
                    Facebook, Instagram y LinkedIn usan grafos para modelar amistades, sugerir contactos
                    ("amigos en común") y detectar comunidades con <strong>BFS</strong> y clustering.
                  </p>
                  <small>Algoritmos: BFS, DFS, PageRank</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">📦</span>
                  <h3>Logística y distribución</h3>
                  <p>
                    Empresas como Amazon o FedEx optimizan rutas de entrega con <strong>MST</strong> y
                    <strong>problemas de flujo</strong> para minimizar costos y tiempos.
                  </p>
                  <small>Algoritmos: Kruskal, Prim, Ford-Fulkerson</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">🎯</span>
                  <h3>Asignación de recursos</h3>
                  <p>
                    Asignar tareas a empleados, estudiantes a proyectos o máquinas a trabajos se resuelve
                    con el <strong>algoritmo húngaro</strong> y variantes de matching.
                  </p>
                  <small>Algoritmos: Húngaro, Hopcroft-Karp</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">🏗️</span>
                  <h3>Planificación de proyectos</h3>
                  <p>
                    El <strong>ordenamiento topológico</strong> permite planificar tareas con dependencias:
                    builds de software, cronogramas, prerequisitos académicos.
                  </p>
                  <small>Algoritmos: Kahn, DFS topológico</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">🧬</span>
                  <h3>Bioinformática</h3>
                  <p>
                    El ADN, las proteínas y las redes metabólicas se modelan como grafos para encontrar
                    rutas biológicas y analizar enfermedades con <strong>Johnson</strong> y Floyd-Warshall.
                  </p>
                  <small>Algoritmos: Johnson, Floyd-Warshall</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">💻</span>
                  <h3>Redes de computadoras</h3>
                  <p>
                    El enrutamiento de paquetes en Internet usa <strong>Dijkstra</strong> (OSPF) y
                    <strong>Bellman-Ford</strong> (RIP) para encontrar el camino más corto entre routers.
                  </p>
                  <small>Algoritmos: Dijkstra, Bellman-Ford</small>
                </article>

                <article class="app-card">
                  <span class="app-icon">🎮</span>
                  <h3>Videojuegos</h3>
                  <p>
                    La IA de NPCs usa grafos para pathfinding (A*), sistemas de diálogo, árboles de
                    comportamiento y generación procedural de mapas.
                  </p>
                  <small>Algoritmos: A*, BFS, DFS</small>
                </article>
              </div>

              <!-- 🎬 VIDEO 2 — Aplicaciones 
              <div class="video-block">
                <span class="video-label">🎬 Video: Aplicaciones de los grafos en el mundo real</span>
                <div class="video-wrapper">
                  <iframe
                    src=""
                    title="Aplicaciones de los grafos"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>Pega aquí tu URL de YouTube</small>
                  </div>
                </div>
              </div>-->
            </section>

            <!-- 04 · ALGORITMOS DISPONIBLES EN GRAPHIX -->
            <section id="algoritmos-graphix">
              <span class="section-kicker">04 · EN GRAPHIX</span>
              <h2>Algoritmos disponibles en Graphix</h2>
              <p>
                Estos son los módulos interactivos que puedes experimentar ahora mismo.
                Cada uno tiene su propia pizarra donde puedes construir, ejecutar y visualizar el algoritmo paso a paso.
              </p>

              <div class="algo-grid">
                <article
                  v-for="algo in graphixAlgorithms"
                  :key="algo.id"
                  class="algo-card"
                >
                  <!-- Cabecera con icono grande -->
                  <div class="algo-hero" :style="{ background: algo.gradient }">
                    <span class="algo-icon">{{ algo.icon }}</span>
                  </div>

                  <div class="algo-body">
                    <header class="algo-head">
                      <span class="algo-tag">{{ algo.tag }}</span>
                      <h3>{{ algo.name }}</h3>
                    </header>

                    <p class="algo-desc">{{ algo.desc }}</p>

                    <ul class="algo-meta">
                      <li><strong>Complejidad:</strong> {{ algo.complexity }}</li>
                      <li><strong>Tipo de grafo:</strong> {{ algo.graphType }}</li>
                    </ul>

                    <!-- VIDEO opcional por algoritmo -->
                    <div v-if="algo.hasVideo" class="video-block">
                      <span class="video-label">🎬 Video explicativo</span>
                      <div class="video-wrapper">
                        <iframe
                          src=""
                          :title="algo.name"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                        <div class="video-placeholder">
                          <span>📺 Espacio reservado para video</span>
                          <small>Pega aquí tu URL de YouTube</small>
                        </div>
                      </div>
                    </div>

                    <!-- BOTÓN A ALGORITMOS INTERACTIVOS -->
                    <a :href="algo.interactiveUrl" class="algo-cta">
                      Abrir en Algoritmos Interactivos
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </div>
                </article>
              </div>
            </section>
          </template>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import CanvasBackground from './CanvasBackground.vue'

/* ============ TABS ============ */
const tabs = [
  { id: 'grafos', label: 'Grafos' },
  { id: 'algoritmos', label: 'Algoritmos' }
]
const activeTab = ref('grafos')

/* ============ ÍNDICE DINÁMICO POR TAB ============ */
const sectionsByTab = {
  grafos: [
    { id: 'conceptos', label: '¿Qué es un grafo?' },
    { id: 'tipos', label: 'Tipos de grafos' },
    { id: 'representaciones', label: 'Representaciones' },
    { id: 'complejidad', label: 'Complejidad' }
  ],
  algoritmos: [
    { id: 'definicion-algoritmo', label: '¿Qué es un algoritmo?' },
    { id: 'tipos-algoritmos', label: 'Tipos de algoritmos' },
    { id: 'aplicaciones', label: 'Aplicaciones' },
    { id: 'algoritmos-graphix', label: 'Algoritmos en Graphix' }
  ]
}

const currentSections = computed(() => sectionsByTab[activeTab.value])

/* ============ ALGORITMOS DISPONIBLES EN GRAPHIX ============ */
const graphixAlgorithms = [
  {
    id: 'pizarra',
    icon: '🕸️',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    tag: 'Diseño',
    name: 'Pizarra de grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    complexity: '—',
    graphType: 'Cualquiera (dirigido, no dirigido, ponderado)',
    hasVideo: true,
    interactiveUrl: '/algoritmos-interactivos#pizarra'
  },
  {
    id: 'asignacion',
    icon: '🔗',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    tag: 'Optimización',
    name: 'Algoritmo de asignación',
    desc: 'Empareja elementos de dos conjuntos minimizando (o maximizando) el costo total, usando el método húngaro.',
    complexity: 'O(n³)',
    graphType: 'Bipartito ponderado',
    hasVideo: true,
    interactiveUrl: '/algoritmos-interactivos#asignacion'
  },
  {
    id: 'johnson',
    icon: '📐',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
    tag: 'Caminos mínimos',
    name: 'Algoritmo de Johnson',
    desc: 'Calcula los caminos más cortos entre todos los pares en grafos dispersos, incluso con pesos negativos.',
    complexity: 'O(V² log V + V·E)',
    graphType: 'Dirigido, disperso, permite pesos negativos',
    hasVideo: true,
    interactiveUrl: '/algoritmos-interactivos#johnson'
  }
]
</script>

<style scoped>
/* ============ BASE ============ */
.theory-view {
  position: relative;
  min-height: calc(100vh - 64px);
  background: var(--bg-body);
  color: var(--text-primary);
  overflow: hidden;
}
.theory-shell {
  position: relative;
  z-index: 1;
  width: min(100% - 2rem, 1080px);
  margin: auto;
  padding: 8rem 0 5rem;
}
.page-header { max-width: 720px; margin-bottom: 3rem; }
.eyebrow,
.section-kicker,
.theory-index span {
  color: var(--accent-solid);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .14em;
}
.page-header h1 {
  font-size: clamp(2.4rem, 5vw, 4rem);
  letter-spacing: -.05em;
  line-height: 1.05;
  margin: .8rem 0 1rem;
  overflow-wrap: anywhere;
}
.page-header p,
.theory-content p,
.theory-content li {
  color: var(--text-secondary);
  line-height: 1.75;
}

/* ============ TABS ============ */
.tabs {
  display: inline-flex;
  gap: .3rem;
  margin-top: 1.8rem;
  padding: .35rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-surface);
}
.tab-btn {
  padding: .55rem 1.4rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: .9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.tab-btn:hover { color: var(--text-primary); }
.tab-active {
  background: var(--accent-solid);
  color: #fff;
}

/* ============ LAYOUT ============ */
.theory-layout {
  display: grid;
  grid-template-columns: minmax(150px, 190px) minmax(0, 1fr);
  gap: clamp(1.5rem, 5vw, 4rem);
  align-items: start;
}
.theory-index { position: sticky; top: 90px; display: grid; gap: .8rem; }
.theory-index a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: .85rem;
}
.theory-index a:hover { color: var(--accent-solid); }
.theory-content { min-width: 0; }
.theory-content section {
  scroll-margin-top: 90px;
  padding: 0 0 3.5rem;
  margin-bottom: 3.5rem;
  border-bottom: 1px solid var(--border-color);
}
.theory-content section:last-child { border-bottom: none; }
.theory-content h2 {
  font-size: clamp(1.55rem, 3vw, 2rem);
  margin: .6rem 0 .8rem;
  letter-spacing: -.04em;
}
.theory-content h3 { margin: 0 0 .5rem; }

/* ============ CONCEPTOS SVG ============ */
.concept-visual {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.concept-card {
  padding: 1.4rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
  text-align: center;
}
.concept-card h4 { margin: .6rem 0 .3rem; }
.concept-card p { font-size: .9rem; margin: 0 0 .3rem; }
.concept-card small { color: var(--text-secondary); font-size: .78rem; }
.concept-svg { width: 100%; max-width: 240px; height: auto; }
.node-fill { fill: var(--accent-solid); filter: drop-shadow(0 0 12px var(--accent-solid)); }
.node-hollow { fill: var(--bg-surface); stroke: var(--accent-solid); stroke-width: 2; }
.node-label,
.node-label-sm { fill: var(--text-primary); font-size: 13px; font-weight: 700; text-anchor: middle; }
.node-label-sm { font-size: 12px; }
.edge-line { stroke: var(--accent-solid); stroke-width: 2; opacity: .65; }

/* ============ TIPOS DE GRAFOS ============ */
.graph-types-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.graph-type-card {
  padding: 1.2rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
  text-align: center;
}
.graph-type-card h3 {
  font-size: .95rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.graph-type-card p { font-size: .85rem; margin: .5rem 0 0; }
.graph-svg { width: 100%; max-width: 240px; height: auto; margin: .6rem auto; display: block; }
.weight-label {
  fill: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
}
.extra-props { margin-top: 1.2rem; padding-left: 1.2rem; }
.extra-props li { margin: .35rem 0; }

/* ============ DEFINITION GRID / COMPARISON ============ */
.definition-grid,
.comparison {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .8rem;
  margin-top: 1.5rem;
}
.comparison { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.definition-grid div,
.comparison > div,
.algorithm-note,
.callout {
  min-width: 0;
  padding: 1.2rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
}
.definition-grid span {
  display: block;
  color: var(--text-secondary);
  font-size: .84rem;
  line-height: 1.5;
  margin-top: .35rem;
}
.comparison p { font-size: .9rem; margin: 0 0 .8rem; }
.comparison code { color: var(--accent-solid); font-size: .8rem; overflow-wrap: anywhere; }

/* ============ TIPOS DE ALGORITMOS ============ */
.algo-types-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}
.algo-type-card {
  padding: 1.2rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
}
.algo-type-card h3 { font-size: 1rem; margin: 0 0 .5rem; }
.algo-type-card p { font-size: .85rem; margin: 0 0 .6rem; }
.algo-type-card ul {
  margin: 0;
  padding-left: 1.1rem;
  font-size: .82rem;
  color: var(--text-secondary);
}
.algo-type-card li { margin: .15rem 0; }

/* ============ APLICACIONES ============ */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}
.app-card {
  padding: 1.3rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: .45rem;
  transition: border-color .2s ease, transform .2s ease;
}
.app-card:hover {
  border-color: var(--accent-solid);
  transform: translateY(-2px);
}
.app-icon {
  font-size: 1.8rem;
  line-height: 1;
}
.app-card h3 {
  font-size: 1rem;
  margin: 0;
}
.app-card p {
  font-size: .88rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}
.app-card small {
  color: var(--accent-solid);
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .04em;
  margin-top: auto;
  padding-top: .4rem;
}

/* ============ ALGORITMOS GRAPHIX (con hero) ============ */
.algo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-top: 1.8rem;
}
.algo-card {
  border: 1px solid var(--border-color);
  border-radius: .9rem;
  background: var(--bg-surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color .2s ease, transform .2s ease;
}
.algo-card:hover {
  border-color: var(--accent-solid);
  transform: translateY(-3px);
}
.algo-hero {
  height: 130px;
  display: grid;
  place-items: center;
  position: relative;
}
.algo-icon {
  font-size: 2.8rem;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,.35));
}
.algo-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: .7rem;
  flex: 1;
}
.algo-head { display: grid; gap: .3rem; }
.algo-tag {
  display: inline-block;
  align-self: flex-start;
  padding: .2rem .6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-solid) 18%, transparent);
  color: var(--accent-solid);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.algo-card h3 { font-size: 1.05rem; margin: 0; }
.algo-desc { font-size: .88rem; margin: 0; color: var(--text-secondary); }
.algo-meta {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: .25rem;
  font-size: .82rem;
}
.algo-meta strong { color: var(--text-primary); }

/* Botón CTA hacia Algoritmos Interactivos */
.algo-cta {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  margin-top: auto;
  padding-top: .9rem;
  color: var(--accent-solid);
  font-weight: 700;
  font-size: .9rem;
  text-decoration: none;
  transition: gap .2s ease, color .2s ease;
}
.algo-cta:hover { gap: .7rem; color: #fff; }

/* ============ VIDEO ============ */
.video-block {
  margin-top: 1.6rem;
  display: grid;
  gap: .5rem;
}
.algo-body .video-block { margin-top: .4rem; }
.video-label {
  color: var(--accent-solid);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: .6rem;
  overflow: hidden;
  border: 1px dashed var(--border-color);
  background: var(--bg-body);
}
.video-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  z-index: 2;
}
.video-wrapper iframe[src=""] { display: none; }
.video-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: .25rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: .85rem;
  z-index: 1;
}
.video-placeholder span { font-weight: 700; color: var(--text-primary); }
.video-placeholder small { font-size: .72rem; opacity: .7; }

/* ============ CALLOUT ============ */
.callout {
  display: grid;
  gap: .4rem;
  border-color: var(--accent-solid);
  margin-top: 1.5rem;
}
.callout span { color: var(--text-secondary); }

/* ============ RESPONSIVE ============ */
@media (max-width: 900px) {
  .algo-types-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .theory-shell { width: min(100% - 2rem, 680px); padding-top: 7rem; }
  .theory-layout { grid-template-columns: 1fr; gap: 2rem; }
  .theory-index {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: .6rem .9rem;
  }
  .theory-index span { flex-basis: 100%; }
  .theory-index a {
    padding: .45rem .65rem;
    border: 1px solid var(--border-color);
    border-radius: 999px;
  }
  .definition-grid,
  .comparison,
  .concept-visual,
  .graph-types-grid,
  .algo-types-grid,
  .apps-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 420px) {
  .theory-shell { width: min(100% - 1.25rem, 380px); }
  .theory-content section { padding-bottom: 2.5rem; margin-bottom: 2.5rem; }
  .theory-content p,
  .theory-content li { font-size: .9rem; }
  .tabs { width: 100%; justify-content: center; }
  .tab-btn { flex: 1; padding: .5rem .8rem; font-size: .85rem; }
}
</style>