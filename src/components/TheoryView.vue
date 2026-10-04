<template>
  <main class="theory-view">
    <CanvasBackground />
    <div class="theory-shell">
      <header class="page-header">
        <span class="eyebrow">RUTA ACADÉMICA</span>
        <h1 class="theory-title">Fundamentos de teoría de grafos</h1>
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
              <span class="section-kicker">01 · DEFINICIÓN</span>
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
                    src="https://www.youtube.com/embed/F5Xjpg0-NhM"
                    title="Introducción a grafos"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>URL de YouTube</small>
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

              <!-- ============ EJEMPLO PRÁCTICO: MISMO GRAFO, DOS ESTRUCTURAS ============ -->
              <div class="representation-example">
                <h3>Ejemplo práctico: el mismo grafo en dos estructuras</h3>
                <p>
                  Considera el siguiente grafo no dirigido y no ponderado de 4 nodos
                  (<strong>A, B, C, D</strong>) con las aristas:
                  <strong>A–B</strong>, <strong>A–C</strong>, <strong>B–D</strong> y <strong>C–D</strong>.
                </p>

                <!-- Diagrama del grafo -->
                <div class="example-graph">
                  <svg viewBox="0 0 300 200" class="example-graph-svg">
                    <!-- Aristas -->
                    <line x1="60" y1="50" x2="240" y2="50" class="edge-line" />
                    <line x1="60" y1="50" x2="60" y2="150" class="edge-line" />
                    <line x1="240" y1="50" x2="240" y2="150" class="edge-line" />
                    <line x1="60" y1="150" x2="240" y2="150" class="edge-line" />

                    <!-- Nodos -->
                    <circle cx="60" cy="50" r="18" class="node-hollow" />
                    <circle cx="240" cy="50" r="18" class="node-hollow" />
                    <circle cx="60" cy="150" r="18" class="node-hollow" />
                    <circle cx="240" cy="150" r="18" class="node-hollow" />

                    <!-- Etiquetas -->
                    <text x="60" y="55" class="node-label-sm">A</text>
                    <text x="240" y="55" class="node-label-sm">B</text>
                    <text x="60" y="155" class="node-label-sm">C</text>
                    <text x="240" y="155" class="node-label-sm">D</text>
                  </svg>
                </div>

                <div class="example-grid">
                  <!-- Matriz de adyacencia -->
                  <div class="example-card">
                    <h4>Matriz de adyacencia</h4>
                    <p class="example-desc">
                      Tabla de 4 × 4. Un <strong>1</strong> indica que existe una arista entre el nodo
                      de la fila y el de la columna; un <strong>0</strong> indica que no.
                    </p>
                    <div class="table-wrap">
                      <table class="adj-matrix">
                        <thead>
                          <tr>
                            <th></th>
                            <th>A</th>
                            <th>B</th>
                            <th>C</th>
                            <th>D</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th>A</th>
                            <td>0</td>
                            <td>1</td>
                            <td>1</td>
                            <td>0</td>
                          </tr>
                          <tr>
                            <th>B</th>
                            <td>1</td>
                            <td>0</td>
                            <td>0</td>
                            <td>1</td>
                          </tr>
                          <tr>
                            <th>C</th>
                            <td>1</td>
                            <td>0</td>
                            <td>0</td>
                            <td>1</td>
                          </tr>
                          <tr>
                            <th>D</th>
                            <td>0</td>
                            <td>1</td>
                            <td>1</td>
                            <td>0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <small class="example-note">
                      Útil para consultas rápidas: <code>matriz[A][B] = 1</code>.
                      Ocupa O(V²) de memoria.
                    </small>
                  </div>

                  <!-- Lista de adyacencia -->
                  <div class="example-card">
                    <h4>Lista de adyacencia</h4>
                    <p class="example-desc">
                      Cada nodo guarda una lista con sus vecinos directos. Es la representación
                      habitual en algoritmos de recorrido.
                    </p>
                    <div class="code-list">
                      <div class="code-line">
                        <span class="code-key">A</span>
                        <span class="code-arrow">→</span>
                        <span class="code-val">[B, C]</span>
                      </div>
                      <div class="code-line">
                        <span class="code-key">B</span>
                        <span class="code-arrow">→</span>
                        <span class="code-val">[A, D]</span>
                      </div>
                      <div class="code-line">
                        <span class="code-key">C</span>
                        <span class="code-arrow">→</span>
                        <span class="code-val">[A, D]</span>
                      </div>
                      <div class="code-line">
                        <span class="code-key">D</span>
                        <span class="code-arrow">→</span>
                        <span class="code-val">[B, C]</span>
                      </div>
                    </div>
                    <small class="example-note">
                      Útil para grafos dispersos: ocupa O(V + E) de memoria y recorrer
                      los vecinos es muy rápido.
                    </small>
                  </div>
                </div>

                <div class="callout example-callout">
                  <strong>Conclusión</strong>
                  <span>
                    La <strong>matriz</strong> es cómoda para consultar si dos nodos están conectados
                    en tiempo constante, pero desperdicia memoria en grafos grandes y dispersos.
                    La <strong>lista</strong> es más eficiente para recorrer vecinos y para la mayoría
                    de algoritmos sobre grafos.
                  </span>
                </div>
              </div>

              <!-- VIDEO 1.1 -->
              <div class="video-block">
                <span class="video-label">🎬 Video recomendado</span>
                <div class="video-wrapper">
                  <iframe
                    src="https://www.youtube.com/embed/D7Gk4NOlB4c"
                    title="Matriz y lista de Adj"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>URL de YouTube</small>
                  </div>
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
              <span class="section-kicker">01 · DEFINICIÓN</span>
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
                    src="https://www.youtube.com/embed/f10jKIslSUY"
                    title="¿Qué es un algoritmo?"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>URL de YouTube</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- 02 · TIPOS DE ALGORITMOS -->
            <section id="tipos-algoritmos">
              <span class="section-kicker">02 · CLASIFICACIÓN</span>
              <h2>Tipos de algoritmos sobre grafos</h2>
              <p>
                Se agrupan según el <strong>problema</strong> que resuelven. Los que tienen la
                insignia <strong>En Graphix</strong> ya puedes practicarlos en su pizarra.
              </p>

              <div class="algo-table">
                <div v-for="type in algorithmTypes" :key="type.id" class="algo-row">
                  <span class="icon-box"><component :is="type.icon" :size="20" /></span>
                  <div class="algo-row-info">
                    <h3>{{ type.name }}</h3>
                    <p>{{ type.desc }}</p>
                  </div>
                  <div class="algo-row-chips">
                    <template v-for="a in type.algos" :key="a.name">
                      <a v-if="a.url" :href="a.url" class="chip chip-live">
                        {{ a.name }} <span class="chip-badge">En Graphix</span>
                      </a>
                      <span v-else class="chip">{{ a.name }}</span>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 🎬 VIDEO SECCIÓN 02 — panorama de algoritmos de grafos -->
              <!-- 👉 PEGA AQUÍ tu link en src, con este formato: https://www.youtube.com/embed/ID_DEL_VIDEO -->
              <div class="video-block">
                <span class="video-label">🎬 Video: panorama de algoritmos de grafos</span>
                <div class="video-wrapper">
                  <iframe
                    src="https://www.youtube.com/embed/KHyzPoyaD3A"
                    title="Panorama de algoritmos de grafos"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>URL de YouTube</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- 03 · RECORRIDOS: BFS vs DFS -->
            <section id="recorridos">
              <span class="section-kicker">03 · EJEMPLO</span>
              <h2>Recorridos: BFS vs DFS</h2>
              <p>
                Son las dos formas básicas de recorrer un grafo, es decir, de visitar todos sus nodos.
                Los dos grafos de abajo son idénticos y ambos empiezan en <strong>A</strong>;
                el número en cada nodo indica en qué <strong>orden</strong> se visita.
              </p>

              <div class="traversal-grid">
                <div v-for="t in traversals" :key="t.id" class="traversal-card">
                  <h3>{{ t.name }}</h3>
                  <svg viewBox="0 0 190 190" class="traversal-svg">
                    <line
                      v-for="(e, i) in traversalEdges"
                      :key="i"
                      :x1="nodeMap[e[0]].x"
                      :y1="nodeMap[e[0]].y"
                      :x2="nodeMap[e[1]].x"
                      :y2="nodeMap[e[1]].y"
                      class="edge-line"
                    />
                    <g v-for="n in traversalNodes" :key="n.id">
                      <circle :cx="n.x" :cy="n.y" r="16" class="node-hollow" />
                      <text :x="n.x" :y="n.y + 4" class="node-label-sm">{{ n.id }}</text>
                      <circle :cx="n.x + 14" :cy="n.y - 14" r="8" class="order-badge" />
                      <text :x="n.x + 14" :y="n.y - 10.5" class="order-text">{{ t.order.indexOf(n.id) + 1 }}</text>
                    </g>
                  </svg>
                  <div class="traversal-order">{{ t.order.join(' → ') }}</div>
                  <p>{{ t.analogy }}</p>
                  <small>{{ t.structure }} · O(V + E)</small>
                </div>
              </div>

              <div class="comparison">
                <div>
                  <h3>Usa BFS cuando…</h3>
                  <p>Quieres el camino con menos aristas en un grafo sin pesos, o explorar por cercanía al nodo inicial.</p>
                </div>
                <div>
                  <h3>Usa DFS cuando…</h3>
                  <p>Necesitas detectar ciclos, ordenar tareas con dependencias (orden topológico) o explorar todos los caminos posibles.</p>
                </div>
              </div>
            </section>

            <!-- 04 · APLICACIONES -->
            <section id="aplicaciones">
              <span class="section-kicker">04 · MUNDO REAL</span>
              <h2>Aplicaciones de los algoritmos de grafos</h2>
              <p>Están detrás de muchas tecnologías que usamos a diario.</p>

              <div class="apps-list">
                <article v-for="app in applications" :key="app.id" class="app-item">
                  <span class="icon-box"><component :is="app.icon" :size="20" /></span>
                  <div>
                    <h3>{{ app.name }}</h3>
                    <p>{{ app.desc }}</p>
                    <small>{{ app.algos }}</small>
                  </div>
                </article>
              </div>

              <!-- 🎬 VIDEO SECCIÓN 04 — aplicaciones reales -->
              <!-- 👉 PEGA AQUÍ tu link en src, con este formato: https://www.youtube.com/embed/ID_DEL_VIDEO -->
              <div class="video-block">
                <span class="video-label">🎬 Video: grafos en la vida real</span>
                <div class="video-wrapper">
                  <iframe
                    src="https://www.youtube.com/embed/oMgfGkFSgI0"
                    title="Grafos en la vida real"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <div class="video-placeholder">
                    <span>📺 Espacio reservado para video</span>
                    <small>URL de YouTube</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- 05 · PRÁCTICA -->
            <section id="practica">
              <span class="section-kicker">05 · PRÁCTICA</span>
              <h2>Pruébalo en Graphix</h2>
              <p>Así se ven las pizarras donde puedes construir y ejecutar cada algoritmo paso a paso.</p>

              <!-- 🖼️ CAPTURAS DE TUS PIZARRAS -->
              <!-- 👉 Pon tus imágenes en la carpeta public/img/ y escribe la ruta en `img` dentro del array graphixShots (script) -->
              <div class="shots-grid">
                <figure v-for="s in graphixShots" :key="s.id" class="shot">
                  <div class="shot-frame" :class="{ 'has-img': s.img }">
                    <img v-if="s.img" :src="s.img" :alt="`Pizarra de ${s.name}`" loading="lazy" />
                    <div v-else class="shot-placeholder">
                      <ImageIcon :size="22" />
                      <span>Espacio para captura</span>
                    </div>
                  </div>
                  <figcaption>
                    <a :href="s.url" class="shot-link">
                      {{ s.name }} <ArrowRight :size="14" />
                    </a>
                  </figcaption>
                </figure>
              </div>

              <div class="callout">
                <strong>De la teoría a la pizarra</strong>
                <span>
                  Los algoritmos con insignia <strong>En Graphix</strong> tienen su propia pizarra
                  donde puedes construirlos y ejecutarlos paso a paso.
                </span>
                <a :href="VIEW_ROUTES.interactivos" class="practice-cta">
                  Ir a Algoritmos Interactivos <ArrowRight :size="16" />
                </a>
              </div>
            </section>
          </template>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import CanvasBackground from './CanvasBackground.vue'
import { requestedTheoryTab } from '../composables/theoryNavigation'
import {
  Compass, Route, Network, Link2, Grid3x3, ListOrdered, Boxes,
  Map as MapIcon, Users, Truck, Target, CalendarCheck, Server,
  ArrowRight, Image as ImageIcon
} from 'lucide-vue-next'
import { ALGORITHMS, VIEW_ROUTES, getAlgorithmRoute } from '../config/routes'

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
    { id: 'recorridos', label: 'BFS vs DFS' },
    { id: 'aplicaciones', label: 'Aplicaciones' },
    { id: 'practica', label: 'Pruébalo en Graphix' }
  ]
}

const currentSections = computed(() => sectionsByTab[activeTab.value])

/* ============ ENTRADA DESDE EL DROPDOWN DEL NAVBAR ============ */
const firstSectionByTab = {
  grafos: 'conceptos',
  algoritmos: 'definicion-algoritmo'
}

const applyRequestedTab = async () => {
  const req = requestedTheoryTab.value
  if (!req) return                       // entrada normal: se queda arriba, tab Grafos
  activeTab.value = req.tab
  requestedTheoryTab.value = null        // consumir la petición
  await nextTick()
  requestAnimationFrame(() => {
    document.getElementById(firstSectionByTab[req.tab])
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

onMounted(applyRequestedTab)             // viene de otra página
watch(requestedTheoryTab, applyRequestedTab) // ya estaba en Fundamentos

/* ============ TIPOS DE ALGORITMOS ============ */
// Para marcar uno como disponible en Graphix, solo añade su `url`
const algorithmTypes = [
  { id: 'recorrido', icon: Compass, name: 'Recorrido',
    desc: 'Exploran todos los vértices de forma sistemática.',
    algos: [{ name: 'BFS' }, { name: 'DFS' }] },
  { id: 'caminos', icon: Route, name: 'Caminos mínimos',
    desc: 'Encuentran la ruta más barata entre nodos.',
    algos: [{ name: 'Dijkstra' }, { name: 'Bellman-Ford' }, { name: 'Floyd-Warshall' }] },
  { id: 'expansion', icon: Network, name: 'Árboles de expansión',
    desc: 'Conectan todos los vértices con el mínimo costo.',
    algos: [{ name: 'Kruskal' }, { name: 'Prim' }] },
  { id: 'asignacion', icon: Link2, name: 'Asignación y matching',
    desc: 'Emparejan elementos minimizando o maximizando costos.',
    algos: [
      { name: 'Húngaro', url: getAlgorithmRoute('asignacion') },
      { name: 'Hopcroft-Karp' }
    ] },
  { id: 'transporte', icon: Boxes, name: 'Transporte',
    desc: 'Reparten mercancía de orígenes a destinos al menor costo.',
    algos: [
      { name: 'Northwest', url: getAlgorithmRoute('northwest') },
      { name: 'Costo mínimo' },
      { name: 'Vogel' }
    ] },
  { id: 'pares', icon: Grid3x3, name: 'Todos los pares',
    desc: 'Rutas óptimas entre cada par de vértices.',
    algos: [
      { name: 'Floyd-Warshall' },
      { name: 'Johnson', url: getAlgorithmRoute('johnson') }
    ] },
  { id: 'orden', icon: ListOrdered, name: 'Ordenamiento',
    desc: 'Ordenan vértices respetando dependencias (DAG).',
    algos: [{ name: 'Kahn' }, { name: 'DFS topológico' }] }
]

/* ============ BFS vs DFS (mismo grafo, distinto orden) ============ */
const traversalNodes = [
  { id: 'A', x: 105, y: 30 },
  { id: 'B', x: 55,  y: 90 },
  { id: 'C', x: 155, y: 90 },
  { id: 'D', x: 25,  y: 160 },
  { id: 'E', x: 85,  y: 160 },
  { id: 'F', x: 155, y: 160 }
]
const traversalEdges = [
  ['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F']
]
const nodeMap = Object.fromEntries(traversalNodes.map(n => [n.id, n]))

const traversals = [
  {
    id: 'bfs',
    name: 'BFS · Anchura',
    order: ['A', 'B', 'C', 'D', 'E', 'F'],
    analogy: 'Como las ondas de una piedra en un estanque: primero los vecinos, luego los vecinos de los vecinos, por capas.',
    structure: 'Usa una cola'
  },
  {
    id: 'dfs',
    name: 'DFS · Profundidad',
    order: ['A', 'B', 'D', 'E', 'C', 'F'],
    analogy: 'Como explorar un laberinto: sigues un camino hasta el fondo y, si no hay salida, regresas al último cruce.',
    structure: 'Usa una pila'
  }
]

/* ============ APLICACIONES ============ */
const applications = [
  { id: 'nav', icon: MapIcon, name: 'Navegación y mapas',
    desc: 'Los GPS calculan la ruta más rápida considerando distancia, tráfico y peajes.',
    algos: 'Dijkstra · A* · Bellman-Ford' },
  { id: 'redes-sociales', icon: Users, name: 'Redes sociales',
    desc: 'Modelan amistades, sugieren contactos y detectan comunidades.',
    algos: 'BFS · DFS · PageRank' },
  { id: 'logistica', icon: Truck, name: 'Logística y distribución',
    desc: 'Optimizan rutas de entrega para minimizar costos y tiempos.',
    algos: 'Kruskal · Prim · Ford-Fulkerson' },
  { id: 'recursos', icon: Target, name: 'Asignación de recursos',
    desc: 'Asignar tareas a empleados o máquinas a trabajos al menor costo.',
    algos: 'Húngaro · Hopcroft-Karp' },
  { id: 'planificacion', icon: CalendarCheck, name: 'Planificación de proyectos',
    desc: 'Ordenan tareas con dependencias: builds, cronogramas, prerrequisitos.',
    algos: 'Kahn · DFS topológico' },
  { id: 'redes-pc', icon: Server, name: 'Redes de computadoras',
    desc: 'El enrutamiento de paquetes busca el camino más corto entre routers.',
    algos: 'Dijkstra (OSPF) · Bellman-Ford (RIP)' }
]

/* ============ CAPTURAS DE LAS PIZARRAS ============ */
// Cuando tengas la captura, guarda la imagen en public/img/ y escribe la ruta en `img`
// Ejemplo: img: '/img/asignacion.png'
const graphixShots = ALGORITHMS
  .filter((algorithm) => algorithm.showInTheory)
  .map((algorithm) => ({
    id: algorithm.id,
    name: algorithm.name,
    img: algorithm.image,
    url: algorithm.route
  }))
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
.page-header {
  max-width: 100%;
  margin-bottom: 3rem;
}
.page-header > p {
  max-width: 720px;
  margin-inline: auto;
  text-align: center;
}
.eyebrow,
.section-kicker,
.theory-index span {
  color: var(--accent-solid);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .14em;
}

/* ============ TÍTULO CON GLOW ============ */
.theory-title {
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -.05em;
  line-height: 1.05;
  margin: .8rem 0 1rem;
  text-align: center;
  overflow-wrap: anywhere;
  transition: color 0.3s ease, filter 0.3s ease;
}

[data-theme='dark'] .theory-title {
  color: #ffffff;
  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

[data-theme='light'] .theory-title {
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

.page-header p,
.theory-content p,
.theory-content li {
  color: var(--text-secondary);
  line-height: 1.75;
}

/* ============ TABS ============ */
.tabs {
  display: flex;
  justify-content: center;
  gap: .3rem;
  margin-top: 1.8rem;
  margin-inline: auto;
  padding: .35rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-surface);
  width: fit-content;
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
  grid-template-columns: 15% minmax(0, 75%);
  gap: 2rem;
  justify-content: start;
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
  transition: color 0.3s ease, filter 0.3s ease;
}

/* Dark: blanco con brillo SUAVE */
[data-theme='dark'] .theory-content h2 {
  color: #ffffff;
  filter:
  drop-shadow(0 0 6px rgba(255, 255, 255, 0.45))
  drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
  drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

/* Light: violeta con brillo SUAVE */
[data-theme='light'] .theory-content h2 {
  color: #7c3aed;
  filter:
    drop-shadow(0 0 3px  rgba(168, 85, 247, 0.18))
    drop-shadow(0 0 8px  rgba(217, 70, 239, 0.10));
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

/* ============ EJEMPLO PRÁCTICO DE REPRESENTACIONES ============ */
.representation-example {
  margin-top: 2rem;
  padding: 1.6rem;
  border: 1px solid var(--border-color);
  border-radius: .9rem;
  background: var(--bg-surface);
}
.representation-example h3 {
  font-size: 1.15rem;
  margin: 0 0 .5rem;
}
.representation-example > p {
  margin: 0 0 1.2rem;
  font-size: .92rem;
}
.example-graph {
  display: flex;
  justify-content: center;
  margin: 0 0 1.4rem;
}
.example-graph-svg {
  width: 100%;
  max-width: 300px;
  height: auto;
}
.example-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.example-card {
  padding: 1.2rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-body);
  display: flex;
  flex-direction: column;
  gap: .7rem;
}
.example-card h4 {
  font-size: .95rem;
  margin: 0;
  letter-spacing: .03em;
  text-transform: uppercase;
  color: var(--accent-solid);
}
.example-desc {
  font-size: .85rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}
.example-note {
  font-size: .78rem;
  color: var(--text-secondary);
  opacity: .85;
  line-height: 1.5;
}
.example-note code {
  color: var(--accent-solid);
  font-size: .78rem;
}

/* Tabla de matriz */
.table-wrap { overflow-x: auto; }
.adj-matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: .85rem;
  text-align: center;
}
.adj-matrix th,
.adj-matrix td {
  border: 1px solid var(--border-color);
  padding: .55rem .4rem;
  color: var(--text-primary);
}
.adj-matrix thead th {
  background: color-mix(in srgb, var(--accent-solid) 12%, transparent);
  font-weight: 800;
  color: var(--accent-solid);
}
.adj-matrix tbody th {
  background: color-mix(in srgb, var(--accent-solid) 12%, transparent);
  font-weight: 800;
  color: var(--accent-solid);
}

/* Lista de adyacencia como código */
.code-list {
  display: grid;
  gap: .35rem;
  padding: .8rem;
  border-radius: .5rem;
  background: color-mix(in srgb, var(--accent-solid) 8%, var(--bg-body));
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: .85rem;
}
.code-line {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.code-key {
  color: var(--accent-solid);
  font-weight: 800;
  min-width: 1.2rem;
}
.code-arrow {
  color: var(--text-secondary);
  opacity: .7;
}
.code-val {
  color: var(--text-primary);
  font-weight: 600;
}
.example-callout {
  margin-top: 1.4rem;
  font-size: .88rem;
}

/* ============ ICONO EN CAJITA ============ */
.icon-box {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: .6rem;
  background: color-mix(in srgb, var(--accent-solid) 15%, transparent);
  color: var(--accent-solid);
}

/* ============ TIPOS DE ALGORITMOS (tabla) ============ */
.algo-table {
  margin-top: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
  overflow: hidden;
}
.algo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border-color);
}
.algo-row:last-child { border-bottom: none; }
.algo-row-info h3 { font-size: 1rem; margin: 0 0 .15rem; }
.algo-row-info p { font-size: .85rem; margin: 0; }
.algo-row-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  justify-content: flex-end;
}
.chip {
  padding: .25rem .65rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: .78rem;
  color: var(--text-secondary);
  text-decoration: none;
}
.chip-live {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  border-color: var(--accent-solid);
  color: var(--text-primary);
  transition: background .2s ease;
}
.chip-live:hover {
  background: color-mix(in srgb, var(--accent-solid) 15%, transparent);
}
.chip-badge {
  padding: .05rem .4rem;
  border-radius: 999px;
  background: var(--accent-solid);
  color: #fff;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

/* ============ BFS vs DFS ============ */
.traversal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}
.traversal-card {
  padding: 1.2rem;
  border: 1px solid var(--border-color);
  border-radius: .8rem;
  background: var(--bg-surface);
  text-align: center;
}
.traversal-card h3 {
  font-size: .95rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.traversal-card p { font-size: .85rem; margin: .5rem 0 0; }
.traversal-card small {
  display: block;
  margin-top: .6rem;
  color: var(--accent-solid);
  font-size: .75rem;
  font-weight: 700;
}
.traversal-svg {
  width: 100%;
  max-width: 260px;
  height: auto;
  margin: .4rem auto;
  display: block;
}
.order-badge { fill: var(--accent-solid); }
.order-text {
  fill: #fff;
  font-size: 10px;
  font-weight: 800;
  text-anchor: middle;
}
.traversal-order {
  margin-top: .3rem;
  color: var(--text-primary);
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: .85rem;
  font-weight: 700;
}

/* ============ APLICACIONES (lista ligera) ============ */
.apps-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.4rem 2rem;
  margin-top: 1.5rem;
}
.app-item { display: flex; gap: .9rem; align-items: flex-start; }
.app-item h3 { font-size: 1rem; margin: 0 0 .2rem; }
.app-item p { font-size: .88rem; margin: 0; }
.app-item small {
  display: block;
  margin-top: .3rem;
  color: var(--accent-solid);
  font-size: .75rem;
  font-weight: 700;
}

/* ============ CAPTURAS DE PIZARRAS ============ */
.shots-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}
.shot { margin: 0; display: grid; gap: .5rem; }
.shot-frame {
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px dashed var(--border-color);
  border-radius: .6rem;
  background: var(--bg-body);
}
.shot-frame.has-img { border-style: solid; }
.shot-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.shot-placeholder {
  display: grid;
  place-items: center;
  gap: .3rem;
  color: var(--text-secondary);
  font-size: .78rem;
}
.shot-link {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  color: var(--accent-solid);
  font-weight: 700;
  font-size: .85rem;
  text-decoration: none;
}

/* ============ CTA PRÁCTICA ============ */
.practice-cta {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  margin-top: .4rem;
  color: var(--accent-solid);
  font-weight: 700;
  text-decoration: none;
}

/* ============ VIDEO ============ */
.video-block {
  margin-top: 1.6rem;
  display: grid;
  gap: .5rem;
}
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
  .example-grid { grid-template-columns: 1fr; }
  .shots-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
  .traversal-grid,
  .shots-grid,
  .apps-list {
    grid-template-columns: 1fr;
  }
  .algo-row { grid-template-columns: auto minmax(0, 1fr); }
  .algo-row-chips { grid-column: 1 / -1; justify-content: flex-start; }
}
@media (max-width: 420px) {
  .theory-shell { width: min(100% - 1.25rem, 380px); }
  .theory-content section { padding-bottom: 2.5rem; margin-bottom: 2.5rem; }
  .theory-content p,
  .theory-content li { font-size: .9rem; }
  .tabs { width: 100%; justify-content: center; }
  .tab-btn { flex: 1; padding: .5rem .8rem; font-size: .85rem; }
  .representation-example { padding: 1rem; }
}
</style>
