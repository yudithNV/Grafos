// =============================================================
// LÓGICA DIFUSA (Mamdani y Sugeno) — compatible con MATLAB
//
// Usa las mismas definiciones que el Fuzzy Logic Toolbox:
//   · Funciones de pertenencia: trimf, trapmf, gaussmf
//   · Mamdani: Y = mínimo, O = máximo, implicación mínimo,
//     agregación máximo, centroide con 101 puntos (igual que evalfis)
//   · Sugeno (valores por defecto de MATLAB): Y = producto,
//     O = suma probabilística, salidas constantes o lineales,
//     promedio ponderado (wtaver)
//
// Además genera:
//   · El archivo .fis (se abre en el Fuzzy Logic Designer de MATLAB)
//   · Un script .m que pide los 3 escenarios en MATLAB, los simula
//     y muestra las gráficas (funciona con o sin el toolbox)
// =============================================================

export const SAMPLE_POINTS = 101

export const MF_TYPES = {
  trimf: { label: 'Triangular', params: ['a', 'b', 'c'] },
  trapmf: { label: 'Trapezoidal', params: ['a', 'b', 'c', 'd'] },
  gaussmf: { label: 'Gaussiana', params: ['σ', 'c'] }
}

// Funciones de salida de Sugeno: constante [c] o lineal [p1 ... pn c] (z = p1·x1 + … + pn·xn + c)
export const SUGENO_MF_TYPES = {
  constant: { label: 'Constante' },
  linear: { label: 'Lineal' }
}

export const isSugeno = (system) => system?.type === 'sugeno'

export const FIS_METHODS = {
  mamdani: { and: 'min', or: 'max', imp: 'min', agg: 'max', defuzz: 'centroid' },
  sugeno: { and: 'prod', or: 'probor', imp: 'prod', agg: 'sum', defuzz: 'wtaver' }
}

// Valor z de una función de salida de Sugeno para las entradas x
export function sugenoValue(mf, x) {
  const p = mf.params.map(Number)
  if (mf.type === 'constant') return p[0]
  return x.reduce((s, xi, i) => s + (p[i] ?? 0) * xi, 0) + (p[x.length] ?? 0)
}

/* ---------------- Funciones de pertenencia (como en MATLAB) ---------------- */
export function trimf(x, [a, b, c]) {
  if (x === b) return 1
  let y = 0
  if (a !== b && a < x && x < b) y = (x - a) / (b - a)
  if (b !== c && b < x && x < c) y = (c - x) / (c - b)
  return y
}

export function trapmf(x, [a, b, c, d]) {
  let y1 = 0
  if (x >= b) y1 = 1
  else if (x < a) y1 = 0
  else if (a !== b) y1 = (x - a) / (b - a)
  let y2 = 0
  if (x <= c) y2 = 1
  else if (x > d) y2 = 0
  else if (c !== d) y2 = (d - x) / (d - c)
  return Math.min(y1, y2)
}

export function gaussmf(x, [sigma, c]) {
  if (!sigma) return x === c ? 1 : 0
  return Math.exp(-((x - c) ** 2) / (2 * sigma ** 2))
}

export function evalMF(mf, x) {
  const p = mf.params.map(Number)
  if (mf.type === 'trapmf') return trapmf(x, p)
  if (mf.type === 'gaussmf') return gaussmf(x, p)
  return trimf(x, p)
}

export const linspace = (a, b, n) =>
  Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)))

/* ---------------- Validación ---------------- */
// Devuelve una lista de problemas en lenguaje sencillo (vacía si todo está bien)
export function validateSystem(system) {
  const problems = []
  const vars = [...system.inputs.map((v, i) => ({ v, label: `Entrada ${i + 1}` })), { v: system.output, label: 'Salida' }]
  const names = new Set()

  const sugeno = isSugeno(system)
  for (const { v, label } of vars) {
    const name = (v.name || '').trim()
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      problems.push(`${label}: el nombre "${name || '(vacío)'}" debe empezar con una letra y usar solo letras, números o _ (sin espacios ni tildes), para que MATLAB lo acepte.`)
    }
    if (names.has(name)) problems.push(`${label}: el nombre "${name}" está repetido.`)
    names.add(name)
    const [lo, hi] = v.range.map(Number)
    if (!(Number.isFinite(lo) && Number.isFinite(hi) && lo < hi)) problems.push(`${name || label}: el rango debe tener mínimo menor que máximo.`)
    if (!v.mfs.length) problems.push(`${name || label}: necesita al menos una función de pertenencia.`)
    const mfNames = new Set()
    v.mfs.forEach((mf) => {
      const mfName = (mf.name || '').trim()
      if (!mfName) problems.push(`${name}: hay una función de pertenencia sin nombre.`)
      if (/['":]/.test(mfName)) problems.push(`${name}: el nombre "${mfName}" no puede tener comillas ni dos puntos.`)
      if (mfNames.has(mfName)) problems.push(`${name}: la función "${mfName}" está repetida.`)
      mfNames.add(mfName)
      const p = mf.params.map(Number)
      if (sugeno && v === system.output) {
        const need = mf.type === 'linear' ? system.inputs.length + 1 : 1
        if (!(mf.type in SUGENO_MF_TYPES)) problems.push(`${name} · ${mfName}: en Sugeno la salida debe ser constante o lineal.`)
        else if (p.length !== need || p.some((n) => !Number.isFinite(n))) problems.push(`${name} · ${mfName}: todos los coeficientes deben ser números.`)
        return
      }
      if (!(mf.type in MF_TYPES)) problems.push(`${name} · ${mfName}: tipo de función no válido.`)
      else if (p.some((n) => !Number.isFinite(n))) problems.push(`${name} · ${mfName}: todos los parámetros deben ser números.`)
      else if (mf.type === 'trimf' && !(p[0] <= p[1] && p[1] <= p[2])) problems.push(`${name} · ${mfName}: en la triangular debe cumplirse a ≤ b ≤ c.`)
      else if (mf.type === 'trapmf' && !(p[0] <= p[1] && p[1] <= p[2] && p[2] <= p[3])) problems.push(`${name} · ${mfName}: en la trapezoidal debe cumplirse a ≤ b ≤ c ≤ d.`)
      else if (mf.type === 'gaussmf' && !(p[0] > 0)) problems.push(`${name} · ${mfName}: en la gaussiana σ debe ser mayor que 0.`)
    })
  }

  const usable = system.rules.filter((r) => r.output > 0 && r.antecedents.some((a) => a > 0))
  if (!usable.length) problems.push('Agrega al menos una regla completa (con alguna condición y una salida).')
  return problems
}

/* ---------------- Inferencia Mamdani ---------------- */
export function evaluate(system, inputValues) {
  const { inputs, output, rules } = system
  const [lo, hi] = output.range.map(Number)
  const ys = linspace(lo, hi, SAMPLE_POINTS)

  // 1. Fuzzificación (los valores fuera de rango se ajustan al límite, como evalfis)
  const clamped = inputs.map((v, i) => {
    const [a, b] = v.range.map(Number)
    return Math.min(Math.max(Number(inputValues[i]), a), b)
  })
  const fuzzified = inputs.map((v, i) => v.mfs.map((mf) => evalMF(mf, clamped[i])))
  if (isSugeno(system)) return evaluateSugeno(system, clamped, fuzzified)

  // 2. Fuerza de disparo de cada regla
  const ruleResults = rules.map((rule) => {
    const degrees = rule.antecedents
      .map((mfIndex, i) => (mfIndex > 0 ? fuzzified[i][mfIndex - 1] : null))
      .filter((d) => d !== null)
    if (!degrees.length || !(rule.output > 0)) return { strength: 0, clipped: ys.map(() => 0) }
    const combined = rule.connector === 'or' ? Math.max(...degrees) : Math.min(...degrees)
    const strength = combined * (rule.weight ?? 1)
    const mf = output.mfs[rule.output - 1]
    // 3. Implicación (mínimo)
    const clipped = ys.map((y) => Math.min(strength, mf ? evalMF(mf, y) : 0))
    return { strength, clipped }
  })

  // 4. Agregación (máximo)
  const aggregated = ys.map((_, k) => Math.max(0, ...ruleResults.map((r) => r.clipped[k])))

  // 5. Defuzzificación por centroide
  const area = aggregated.reduce((s, m) => s + m, 0)
  const noRuleFired = area === 0
  const value = noRuleFired ? (lo + hi) / 2 : aggregated.reduce((s, m, k) => s + m * ys[k], 0) / area

  // Etiqueta lingüística del resultado: la función de salida con mayor pertenencia
  let label = ''
  let best = -1
  output.mfs.forEach((mf) => {
    const m = evalMF(mf, value)
    if (m > best) { best = m; label = mf.name }
  })

  return { value, label, aggregated, ys, fuzzified, strengths: ruleResults.map((r) => r.strength), noRuleFired }
}

/* ---------------- Inferencia Sugeno ---------------- */
function evaluateSugeno(system, x, fuzzified) {
  const { output, rules } = system
  const [lo, hi] = output.range.map(Number)
  const ruleResults = rules.map((rule) => {
    const degrees = rule.antecedents
      .map((mfIndex, i) => (mfIndex > 0 ? fuzzified[i][mfIndex - 1] : null))
      .filter((d) => d !== null)
    const mf = output.mfs[rule.output - 1]
    if (!degrees.length || !mf) return { strength: 0, z: null }
    // Y = producto, O = suma probabilística (a + b − a·b), como sugfis
    const combined = rule.connector === 'or'
      ? degrees.reduce((a, b) => a + b - a * b)
      : degrees.reduce((a, b) => a * b, 1)
    return { strength: combined * (rule.weight ?? 1), z: sugenoValue(mf, x) }
  })
  const total = ruleResults.reduce((s, r) => s + r.strength, 0)
  const noRuleFired = !(total > 0)
  // Promedio ponderado (wtaver)
  const value = noRuleFired ? (lo + hi) / 2 : ruleResults.reduce((s, r) => s + r.strength * (r.z ?? 0), 0) / total

  // Etiqueta: la función de salida cuyo valor z queda más cerca del resultado
  let label = ''
  let best = Infinity
  output.mfs.forEach((mf) => {
    const d = Math.abs(sugenoValue(mf, x) - value)
    if (d < best) { best = d; label = mf.name }
  })

  return {
    value,
    label,
    fuzzified,
    strengths: ruleResults.map((r) => r.strength),
    ruleOutputs: ruleResults.map((r) => r.z),
    noRuleFired,
    sugeno: true
  }
}

/* ---------------- Convertir la salida al cambiar de tipo ---------------- */
function mfPeak(mf) {
  const p = mf.params.map(Number)
  if (mf.type === 'gaussmf') return p[1]
  if (mf.type === 'trapmf') return (p[1] + p[2]) / 2
  if (mf.type === 'constant') return p[0]
  return p[1]
}
const r3 = (n) => Number(Number(n).toFixed(3))

// Mamdani → Sugeno: cada función pasa a una constante en su centro
export function toSugenoOutput(output) {
  return {
    ...output,
    mfs: output.mfs.map((mf) => ({ name: mf.name, type: 'constant', params: [r3(mfPeak(mf))] }))
  }
}

// Sugeno → Mamdani: cada salida pasa a un triángulo centrado en su valor
export function toMamdaniOutput(output, inputs) {
  const [lo, hi] = output.range.map(Number)
  const n = output.mfs.length
  const w = (hi - lo) / Math.max(2, n - 1 + 1)
  const mid = inputs.map((v) => (Number(v.range[0]) + Number(v.range[1])) / 2)
  return {
    ...output,
    mfs: output.mfs.map((mf) => {
      const c = Math.min(Math.max(sugenoValue(mf, mid), lo), hi)
      return { name: mf.name, type: 'trimf', params: [r3(c - w), r3(c), r3(c + w)] }
    })
  }
}

// Ajusta los coeficientes de las salidas lineales cuando se agrega o quita una entrada
export function resizeLinearOutputs(output, nInputs, { insert = null, remove = null } = {}) {
  output.mfs.forEach((mf) => {
    if (mf.type !== 'linear') return
    const coef = mf.params.slice(0, -1)
    const c = mf.params[mf.params.length - 1] ?? 0
    if (insert !== null) coef.splice(insert, 0, 0)
    if (remove !== null) coef.splice(remove, 1)
    while (coef.length < nInputs) coef.push(0)
    coef.length = nInputs
    mf.params = [...coef, c]
  })
}

/* ---------------- Texto de las reglas ---------------- */
export function ruleToText(system, rule) {
  const parts = rule.antecedents
    .map((mfIndex, i) => (mfIndex > 0 ? `${system.inputs[i].name} es ${system.inputs[i].mfs[mfIndex - 1]?.name ?? '?'}` : null))
    .filter(Boolean)
  const joiner = rule.connector === 'or' ? ' O ' : ' Y '
  const out = rule.output > 0 ? `${system.output.name} es ${system.output.mfs[rule.output - 1]?.name ?? '?'}` : '…'
  return `SI ${parts.join(joiner) || '…'} ENTONCES ${out}`
}

/* ---------------- Exportar a .fis (Fuzzy Logic Designer) ---------------- */
const num = (n) => {
  const v = Number(n)
  return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(10)))
}
const vec = (arr) => `[${arr.map(num).join(' ')}]`
const safeName = (s) => String(s).trim().replace(/'/g, '')

export function toFis(system) {
  const lines = []
  const rules = usableRules(system)
  lines.push('[System]')
  lines.push(`Name='${safeName(system.name || 'sistema_difuso').replace(/\s+/g, '_')}'`)
  const methods = FIS_METHODS[isSugeno(system) ? 'sugeno' : 'mamdani']
  lines.push(`Type='${isSugeno(system) ? 'sugeno' : 'mamdani'}'`)
  lines.push('Version=2.0')
  lines.push(`NumInputs=${system.inputs.length}`)
  lines.push('NumOutputs=1')
  lines.push(`NumRules=${rules.length}`)
  lines.push(`AndMethod='${methods.and}'`)
  lines.push(`OrMethod='${methods.or}'`)
  lines.push(`ImpMethod='${methods.imp}'`)
  lines.push(`AggMethod='${methods.agg}'`)
  lines.push(`DefuzzMethod='${methods.defuzz}'`)
  const variable = (header, v) => {
    lines.push('')
    lines.push(header)
    lines.push(`Name='${safeName(v.name)}'`)
    lines.push(`Range=${vec(v.range)}`)
    lines.push(`NumMFs=${v.mfs.length}`)
    v.mfs.forEach((mf, i) => lines.push(`MF${i + 1}='${safeName(mf.name)}':'${mf.type}',${vec(mf.params)}`))
  }
  system.inputs.forEach((v, i) => variable(`[Input${i + 1}]`, v))
  variable('[Output1]', system.output)
  lines.push('')
  lines.push('[Rules]')
  rules.forEach((r) => {
    lines.push(`${r.antecedents.join(' ')}, ${r.output} (${num(r.weight ?? 1)}) : ${r.connector === 'or' ? 2 : 1}`)
  })
  return lines.join('\n') + '\n'
}

export const usableRules = (system) =>
  system.rules.filter((r) => r.output > 0 && r.antecedents.some((a) => a > 0))

/* ---------------- Exportar a script de MATLAB ---------------- */
const mstr = (s) => `'${String(s).replace(/'/g, "''")}'`

export function toMatlabScript(system, scenarios) {
  const fisName = safeName(system.name || 'sistema_difuso').replace(/\s+/g, '_')
  const fisLines = toFis(system).trimEnd().split('\n')
  const rules = usableRules(system)
  const sugeno = isSugeno(system)
  const date = new Date().toLocaleString('es-BO')
  const varBlock = (v, target) => [
    `${target}.nombre = ${mstr(v.name)};`,
    `${target}.rango  = ${vec(v.range)};`,
    `${target}.mfs    = { ...`,
    ...v.mfs.map((mf) => `    ${mstr(mf.name)}, ${mstr(mf.type)}, ${vec(mf.params)}; ...`),
    '};'
  ]
  const L = []
  L.push('%% =====================================================================')
  L.push(`%  GRAPHIX · Simulación de un sistema difuso (${sugeno ? 'Sugeno' : 'Mamdani'}) en MATLAB`)
  L.push(`%  Sistema: ${system.name || fisName}`)
  L.push(`%  Generado desde la web: ${date}`)
  L.push('%')
  L.push('%  CÓMO USAR: abre este archivo en MATLAB y presiona Run (F5).')
  L.push('%   1. Se simulan los 3 escenarios con los valores de la web (sección 2;')
  L.push('%      puedes cambiarlos ahí mismo) y se muestran las gráficas.')
  L.push('%   2. Los resultados aparecen en la ventana de comandos.')
  L.push('%   3. Si tienes el Fuzzy Logic Toolbox, también se abre "fuzzy" con este')
  L.push('%      sistema (variables, funciones y reglas). Para abrirlo a mano después:')
  L.push(`%      fuzzy('${fisName}.fis')`)
  L.push('%  Funciona con o sin el toolbox (MATLAB R2016b o superior).')
  L.push('%% =====================================================================')
  L.push('clc; close all;')
  L.push('')
  L.push('%% 1. Sistema difuso diseñado en la web ---------------------------------')
  L.push(`nombreSistema = ${mstr(system.name || fisName)};`)
  L.push(`tipoSistema   = ${mstr(sugeno ? 'sugeno' : 'mamdani')};`)
  system.inputs.forEach((v, i) => L.push(...varBlock(v, `entradas(${i + 1})`)))
  L.push(...varBlock(system.output, 'salida'))
  L.push('')
  if (sugeno) {
    L.push('% Salidas de Sugeno: constant [c] o linear [p1 ... pn c]  ->  z = p1*x1 + ... + pn*xn + c')
  }
  L.push('% Reglas: [entrada1 entrada2 ... salida peso conector]')
  L.push('%   número = función de pertenencia (1, 2, 3...), 0 = "no importa"')
  L.push(sugeno ? '%   conector: 1 = Y (producto), 2 = O (suma probabilística)' : '%   conector: 1 = Y (mínimo), 2 = O (máximo)')
  L.push('reglas = [ ...')
  rules.forEach((r) => L.push(`    ${r.antecedents.join(' ')} ${r.output} ${num(r.weight ?? 1)} ${r.connector === 'or' ? 2 : 1}; ... % ${ruleToText(system, r)}`))
  L.push('];')
  L.push('')
  L.push('%% 2. Escenarios (valores de la web; se pueden cambiar aquí) ---------------')
  L.push(`nombresEscenarios = {${scenarios.map((s) => mstr(s.name)).join(', ')}};`)
  L.push('escenarios = [ ...')
  scenarios.forEach((s) => L.push(`    ${s.values.map(num).join(' ')}; ...`))
  L.push('];')
  L.push('')
  L.push('nEnt = numel(entradas);')
  L.push('nEsc = size(escenarios, 1);')
  L.push('% Cambia a true si quieres que MATLAB pida los valores en una ventana antes de simular')
  L.push('pedirValores = false;')
  L.push('if pedirValores && usejava(\'desktop\')')
  L.push('    nombresVar = strjoin(arrayfun(@(e) e.nombre, entradas, \'UniformOutput\', false), \', \');')
  L.push('    preguntas = cell(1, nEsc); valores = cell(1, nEsc);')
  L.push('    for k = 1:nEsc')
  L.push('        preguntas{k} = sprintf(\'%s  [%s]:\', nombresEscenarios{k}, nombresVar);')
  L.push('        valores{k} = num2str(escenarios(k, :));')
  L.push('    end')
  L.push('    resp = inputdlg(preguntas, \'Graphix · Valores de los escenarios\', [1 70], valores);')
  L.push('    if ~isempty(resp)')
  L.push('        for k = 1:nEsc')
  L.push('            fila = str2num(resp{k}); %#ok<ST2NM>')
  L.push('            if numel(fila) == nEnt && all(isfinite(fila))')
  L.push('                escenarios(k, :) = fila(:)\';')
  L.push('            else')
  L.push('                warning(\'%s: se esperaban %d números; se usan los valores de la web.\', nombresEscenarios{k}, nEnt);')
  L.push('            end')
  L.push('        end')
  L.push('    end')
  L.push('end')
  L.push('% Los valores fuera de rango se ajustan al límite más cercano (como evalfis)')
  L.push('for i = 1:nEnt')
  L.push('    escenarios(:, i) = min(max(escenarios(:, i), entradas(i).rango(1)), entradas(i).rango(2));')
  L.push('end')
  L.push('')
  if (!sugeno) {
    L.push('%% 3. Simulación (Mamdani: min, max, centroide con 101 puntos) -----------')
    L.push('ys = linspace(salida.rango(1), salida.rango(2), 101);')
    L.push('resultados = zeros(nEsc, 1);')
    L.push('etiquetas = cell(nEsc, 1);')
    L.push('agregadas = zeros(nEsc, numel(ys));')
    L.push('for k = 1:nEsc')
    L.push('    agregada = zeros(size(ys));')
    L.push('    for r = 1:size(reglas, 1)')
    L.push('        grados = [];')
    L.push('        for i = 1:nEnt')
    L.push('            m = reglas(r, i);')
    L.push('            if m > 0')
    L.push('                grados(end + 1) = gx_mf(entradas(i).mfs(m, :), escenarios(k, i)); %#ok<AGROW>')
    L.push('            end')
    L.push('        end')
    L.push('        if isempty(grados), continue; end')
    L.push('        if reglas(r, nEnt + 3) == 2, fuerza = max(grados); else, fuerza = min(grados); end')
    L.push('        fuerza = fuerza * reglas(r, nEnt + 2);')
    L.push('        recortada = min(fuerza, gx_mf(salida.mfs(reglas(r, nEnt + 1), :), ys));')
    L.push('        agregada = max(agregada, recortada);')
    L.push('    end')
    L.push('    agregadas(k, :) = agregada;')
    L.push('    if sum(agregada) > 0')
    L.push('        resultados(k) = sum(agregada .* ys) / sum(agregada);')
    L.push('    else')
    L.push('        resultados(k) = mean(salida.rango);')
    L.push('        warning(\'%s: ninguna regla se activó; se usa el centro del rango.\', nombresEscenarios{k});')
    L.push('    end')
    L.push('    grados = cellfun(@(t, p) gx_mf({\'\', t, p}, resultados(k)), salida.mfs(:, 2), salida.mfs(:, 3));')
    L.push('    [~, mejor] = max(grados);')
    L.push('    etiquetas{k} = salida.mfs{mejor, 1};')
    L.push('end')
    L.push('')
    L.push('fprintf(\'\\n=== %s ===\\n\', nombreSistema);')
    L.push('for k = 1:nEsc')
    L.push('    fprintf(\'%-12s entradas = [%s]  ->  %s = %.4f (%s)\\n\', nombresEscenarios{k}, num2str(escenarios(k, :)), salida.nombre, resultados(k), etiquetas{k});')
    L.push('end')
    L.push('')
    L.push('%% 4. Gráficas ------------------------------------------------------------')
    L.push('colores = [0.31 0.27 0.90; 0.06 0.62 0.43; 0.86 0.15 0.47];')
    L.push('figure(\'Name\', \'Funciones de pertenencia y escenarios\', \'Color\', \'w\');')
    L.push('variables = [num2cell(entradas), {salida}];')
    L.push('filas = ceil(numel(variables) / 2);')
    L.push('for v = 1:numel(variables)')
    L.push('    var = variables{v};')
    L.push('    subplot(filas, 2, v); hold on; box on;')
    L.push('    xs = linspace(var.rango(1), var.rango(2), 401);')
    L.push('    for m = 1:size(var.mfs, 1)')
    L.push('        mu = gx_mf(var.mfs(m, :), xs);')
    L.push('        plot(xs, mu, \'LineWidth\', 1.6, \'Color\', [0.35 0.35 0.45]);')
    L.push('        [~, pico] = max(mu);')
    L.push('        text(xs(pico), 1.06, var.mfs{m, 1}, \'HorizontalAlignment\', \'center\', \'FontSize\', 8);')
    L.push('    end')
    L.push('    lineas = zeros(1, nEsc);')
    L.push('    for k = 1:nEsc')
    L.push('        if v <= nEnt, xk = escenarios(k, v); else, xk = resultados(k); end')
    L.push('        lineas(k) = plot([xk xk], [0 1], \'--\', \'Color\', colores(k, :), \'LineWidth\', 1.8);')
    L.push('    end')
    L.push('    if v == numel(variables)')
    L.push('        legend(lineas, nombresEscenarios, \'Location\', \'southoutside\', \'Orientation\', \'horizontal\');')
    L.push('    end')
    L.push('    ylim([0 1.15]); xlim(var.rango);')
    L.push('    if v <= nEnt, title([\'Entrada: \' var.nombre], \'Interpreter\', \'none\'); else, title([\'Salida: \' var.nombre \' (líneas = resultado)\'], \'Interpreter\', \'none\'); end')
    L.push('    ylabel(\'Pertenencia\');')
    L.push('end')
    L.push('')
    L.push('figure(\'Name\', \'Simulación de los escenarios\', \'Color\', \'w\');')
    L.push('for k = 1:nEsc')
    L.push('    subplot(2, nEsc, k); hold on; box on;')
    L.push('    for m = 1:size(salida.mfs, 1)')
    L.push('        plot(ys, gx_mf(salida.mfs(m, :), ys), \':\', \'Color\', [0.6 0.6 0.65]);')
    L.push('    end')
    L.push('    fill([ys fliplr(ys)], [agregadas(k, :) zeros(size(ys))], colores(k, :), \'FaceAlpha\', 0.35, \'EdgeColor\', colores(k, :), \'LineWidth\', 1.4);')
    L.push('    plot([resultados(k) resultados(k)], [0 1], \'-\', \'Color\', [0.1 0.1 0.1], \'LineWidth\', 2);')
    L.push('    ylim([0 1.05]); xlim(salida.rango);')
    L.push('    title(sprintf(\'%s: %.2f (%s)\', nombresEscenarios{k}, resultados(k), etiquetas{k}), \'Interpreter\', \'none\');')
    L.push('    xlabel(salida.nombre, \'Interpreter\', \'none\');')
    L.push('end')
    L.push('subplot(2, nEsc, nEsc + 1:2 * nEsc); hold on; box on;')
    L.push('for k = 1:nEsc')
    L.push('    bar(k, resultados(k), 0.55, \'FaceColor\', colores(k, :));')
    L.push('    text(k, resultados(k), sprintf(\'%.2f\', resultados(k)), \'HorizontalAlignment\', \'center\', \'VerticalAlignment\', \'bottom\', \'FontWeight\', \'bold\');')
    L.push('end')
    L.push('set(gca, \'XTick\', 1:nEsc, \'XTickLabel\', nombresEscenarios);')
    L.push('ylim([salida.rango(1) salida.rango(2)]);')
    L.push('ylabel(salida.nombre, \'Interpreter\', \'none\');')
    L.push('title(\'Comparación de los escenarios (centroide)\');')
    L.push('')
  } else {
    L.push('%% 3. Simulación (Sugeno: Y = producto, O = suma probabilística, promedio ponderado)')
    L.push('nReg = size(reglas, 1);')
    L.push('resultados = zeros(nEsc, 1);')
    L.push('etiquetas = cell(nEsc, 1);')
    L.push('fuerzas = zeros(nEsc, nReg);   % fuerza de disparo de cada regla')
    L.push('zReglas = zeros(nEsc, nReg);   % salida z de cada regla')
    L.push('for k = 1:nEsc')
    L.push('    x = escenarios(k, :);')
    L.push('    for r = 1:nReg')
    L.push('        grados = [];')
    L.push('        for i = 1:nEnt')
    L.push('            m = reglas(r, i);')
    L.push('            if m > 0')
    L.push('                grados(end + 1) = gx_mf(entradas(i).mfs(m, :), x(i)); %#ok<AGROW>')
    L.push('            end')
    L.push('        end')
    L.push('        if isempty(grados), continue; end')
    L.push('        if reglas(r, nEnt + 3) == 2')
    L.push('            f = grados(1);')
    L.push('            for g = grados(2:end), f = f + g - f * g; end   % O: suma probabilística')
    L.push('        else')
    L.push('            f = prod(grados);                               % Y: producto')
    L.push('        end')
    L.push('        fuerzas(k, r) = f * reglas(r, nEnt + 2);')
    L.push('        zReglas(k, r) = gx_sug(salida.mfs(reglas(r, nEnt + 1), :), x);')
    L.push('    end')
    L.push('    if sum(fuerzas(k, :)) > 0')
    L.push('        resultados(k) = sum(fuerzas(k, :) .* zReglas(k, :)) / sum(fuerzas(k, :));')
    L.push('    else')
    L.push('        resultados(k) = mean(salida.rango);')
    L.push('        warning(\'%s: ninguna regla se activó; se usa el centro del rango.\', nombresEscenarios{k});')
    L.push('    end')
    L.push('    zMF = cellfun(@(t, p) gx_sug({\'\', t, p}, x), salida.mfs(:, 2), salida.mfs(:, 3));')
    L.push('    [~, mejor] = min(abs(zMF - resultados(k)));')
    L.push('    etiquetas{k} = salida.mfs{mejor, 1};')
    L.push('end')
    L.push('')
    L.push('fprintf(\'\\n=== %s (Sugeno) ===\\n\', nombreSistema);')
    L.push('for k = 1:nEsc')
    L.push('    fprintf(\'%-12s entradas = [%s]  ->  %s = %.4f (%s)\\n\', nombresEscenarios{k}, num2str(escenarios(k, :)), salida.nombre, resultados(k), etiquetas{k});')
    L.push('end')
    L.push('')
    L.push('%% 4. Gráficas ------------------------------------------------------------')
    L.push('colores = [0.31 0.27 0.90; 0.06 0.62 0.43; 0.86 0.15 0.47];')
    L.push('figure(\'Name\', \'Funciones de pertenencia y escenarios\', \'Color\', \'w\');')
    L.push('filas = ceil((nEnt + 1) / 2);')
    L.push('for v = 1:nEnt')
    L.push('    var = entradas(v);')
    L.push('    subplot(filas, 2, v); hold on; box on;')
    L.push('    xs = linspace(var.rango(1), var.rango(2), 401);')
    L.push('    for m = 1:size(var.mfs, 1)')
    L.push('        mu = gx_mf(var.mfs(m, :), xs);')
    L.push('        plot(xs, mu, \'LineWidth\', 1.6, \'Color\', [0.35 0.35 0.45]);')
    L.push('        [~, pico] = max(mu);')
    L.push('        text(xs(pico), 1.06, var.mfs{m, 1}, \'HorizontalAlignment\', \'center\', \'FontSize\', 8);')
    L.push('    end')
    L.push('    for k = 1:nEsc')
    L.push('        plot([escenarios(k, v) escenarios(k, v)], [0 1], \'--\', \'Color\', colores(k, :), \'LineWidth\', 1.8);')
    L.push('    end')
    L.push('    ylim([0 1.15]); xlim(var.rango);')
    L.push('    title([\'Entrada: \' var.nombre], \'Interpreter\', \'none\'); ylabel(\'Pertenencia\');')
    L.push('end')
    L.push('% Salida de Sugeno: valores z de cada función (con el escenario 1) y resultados')
    L.push('subplot(filas, 2, nEnt + 1); hold on; box on;')
    L.push('zEsc1 = cellfun(@(t, p) gx_sug({\'\', t, p}, escenarios(1, :)), salida.mfs(:, 2), salida.mfs(:, 3));')
    L.push('for m = 1:size(salida.mfs, 1)')
    L.push('    plot([zEsc1(m) zEsc1(m)], [0 1], \'-\', \'Color\', [0.35 0.35 0.45], \'LineWidth\', 2);')
    L.push('    text(zEsc1(m), 1.06, salida.mfs{m, 1}, \'HorizontalAlignment\', \'center\', \'FontSize\', 8);')
    L.push('end')
    L.push('lineas = zeros(1, nEsc);')
    L.push('for k = 1:nEsc')
    L.push('    lineas(k) = plot([resultados(k) resultados(k)], [0 1], \'--\', \'Color\', colores(k, :), \'LineWidth\', 1.8);')
    L.push('end')
    L.push('legend(lineas, nombresEscenarios, \'Location\', \'southoutside\', \'Orientation\', \'horizontal\');')
    L.push('lim = [min([salida.rango zEsc1(:)\' resultados\']) max([salida.rango zEsc1(:)\' resultados\'])];')
    L.push('ylim([0 1.15]); xlim(lim);')
    L.push('title([\'Salida: \' salida.nombre \' (líneas = resultado)\'], \'Interpreter\', \'none\');')
    L.push('')
    L.push('figure(\'Name\', \'Simulación de los escenarios (Sugeno)\', \'Color\', \'w\');')
    L.push('for k = 1:nEsc')
    L.push('    subplot(2, nEsc, k); hold on; box on;')
    L.push('    activas = fuerzas(k, :) > 0;')
    L.push('    if any(activas)')
    L.push('        stem(zReglas(k, activas), fuerzas(k, activas), \'filled\', \'Color\', colores(k, :), \'LineWidth\', 1.6);')
    L.push('    end')
    L.push('    plot([resultados(k) resultados(k)], [0 1], \'-\', \'Color\', [0.1 0.1 0.1], \'LineWidth\', 2);')
    L.push('    lim = [min([salida.rango zReglas(k, activas) resultados(k)]) max([salida.rango zReglas(k, activas) resultados(k)])];')
    L.push('    ylim([0 1.05]); xlim(lim);')
    L.push('    title(sprintf(\'%s: %.2f (%s)\', nombresEscenarios{k}, resultados(k), etiquetas{k}), \'Interpreter\', \'none\');')
    L.push('    xlabel(salida.nombre, \'Interpreter\', \'none\'); ylabel(\'Fuerza\');')
    L.push('end')
    L.push('subplot(2, nEsc, nEsc + 1:2 * nEsc); hold on; box on;')
    L.push('for k = 1:nEsc')
    L.push('    bar(k, resultados(k), 0.55, \'FaceColor\', colores(k, :));')
    L.push('    text(k, resultados(k), sprintf(\'%.2f\', resultados(k)), \'HorizontalAlignment\', \'center\', \'VerticalAlignment\', \'bottom\', \'FontWeight\', \'bold\');')
    L.push('end')
    L.push('set(gca, \'XTick\', 1:nEsc, \'XTickLabel\', nombresEscenarios);')
    L.push('ylabel(salida.nombre, \'Interpreter\', \'none\');')
    L.push('title(\'Comparación de los escenarios (promedio ponderado)\');')
    L.push('')
  }
  L.push('%% 5. Con el Fuzzy Logic Toolbox: abrir fuzzy con el sistema de la web ------')
  L.push('tieneToolbox = ~isempty(which(\'readfis\')) && license(\'test\', \'Fuzzy_Toolbox\');')
  L.push('if tieneToolbox')
  L.push('    % El .fis se guarda junto a este script (o en la carpeta temporal si no se puede)')
  L.push('    carpeta = fileparts(mfilename(\'fullpath\'));')
  L.push('    if isempty(carpeta), carpeta = pwd; end')
  L.push(`    archivoFis = fullfile(carpeta, ${mstr(fisName + '.fis')});`)
  L.push('    fid = fopen(archivoFis, \'w\');')
  L.push('    if fid < 0')
  L.push(`        archivoFis = fullfile(tempdir, ${mstr(fisName + '.fis')});`)
  L.push('        fid = fopen(archivoFis, \'w\');')
  L.push('    end')
  L.push('    fprintf(fid, \'%s\\n\', strjoin(fis_texto, newline));')
  L.push('    fclose(fid);')
  L.push('    fis = readfis(archivoFis);')
  L.push('    try')
  L.push('        conToolbox = evalfis(fis, escenarios);')
  L.push('    catch')
  L.push('        conToolbox = evalfis(escenarios, fis);  % versiones anteriores a R2018b')
  L.push('    end')
  L.push('    fprintf(\'\\nComprobación con evalfis del toolbox:\\n\');')
  L.push('    for k = 1:nEsc')
  L.push('        fprintf(\'%-12s evalfis = %.4f   (diferencia %.2e)\\n\', nombresEscenarios{k}, conToolbox(k), abs(conToolbox(k) - resultados(k)));')
  L.push('    end')
  L.push('    % Abre "fuzzy" (Fuzzy Logic Designer clásico) con el sistema de la web.')
  L.push('    % Desde su menú View están las reglas (Rules), el Rule Viewer y el Surface Viewer.')
  L.push('    abierto = false;')
  L.push('    try, fuzzy(fis); abierto = true; catch, end')
  L.push('    if ~abierto, try, fuzzy(archivoFis); abierto = true; catch, end, end')
  L.push('    if ~abierto, try, fuzzyLogicDesigner(fis); abierto = true; catch, end, end')
  L.push('    if abierto')
  L.push(`        fprintf('\\nSe abrió fuzzy con el sistema "%s". En el menú View: Rules, Rule Viewer y Surface Viewer.\\n', ${mstr(fisName)});`)
  L.push('    else')
  L.push('        fprintf(\'\\nNo se pudo abrir fuzzy automáticamente. Escribe en la terminal:  fuzzy(\'\'%s\'\')\\n\', archivoFis);')
  L.push('    end')
  L.push('    fprintf(\'Archivo .fis guardado en: %s\\n\', archivoFis);')
  L.push('else')
  L.push('    fprintf(\'\\n(No se detectó el Fuzzy Logic Toolbox: se usó la simulación propia del script.)\\n\');')
  L.push('end')
  L.push('')
  L.push('%% ======================================================================')
  L.push('%  Funciones auxiliares (no modificar)')
  L.push('%% ======================================================================')
  L.push('function y = gx_mf(mf, x)')
  L.push('% Evalúa una función de pertenencia {nombre, tipo, parámetros} en x (igual que MATLAB)')
  L.push('tipo = mf{2}; p = mf{3};')
  L.push('switch tipo')
  L.push('    case \'trimf\'')
  L.push('        y = gx_trap(x, [p(1) p(2) p(2) p(3)]);')
  L.push('    case \'trapmf\'')
  L.push('        y = gx_trap(x, p);')
  L.push('    case \'gaussmf\'')
  L.push('        y = exp(-((x - p(2)) .^ 2) / (2 * p(1) ^ 2));')
  L.push('    otherwise')
  L.push('        error(\'Tipo de función no soportado: %s\', tipo);')
  L.push('end')
  L.push('end')
  L.push('')
  L.push('function z = gx_sug(mf, x)')
  L.push('% Salida de Sugeno: constante [c] o lineal [p1 ... pn c] -> z = p1*x1 + ... + pn*xn + c')
  L.push('p = mf{3};')
  L.push('if strcmp(mf{2}, \'constant\')')
  L.push('    z = p(1);')
  L.push('else')
  L.push('    z = sum(p(1:end - 1) .* x(:)\') + p(end);')
  L.push('end')
  L.push('end')
  L.push('')
  L.push('function y = gx_trap(x, p)')
  L.push('a = p(1); b = p(2); c = p(3); d = p(4);')
  L.push('y1 = double(x >= b);')
  L.push('if a ~= b')
  L.push('    idx = a <= x & x < b;')
  L.push('    y1(idx) = (x(idx) - a) / (b - a);')
  L.push('end')
  L.push('y2 = double(x <= c);')
  L.push('if c ~= d')
  L.push('    idx = c < x & x <= d;')
  L.push('    y2(idx) = (d - x(idx)) / (d - c);')
  L.push('end')
  L.push('y = min(y1, y2);')
  L.push('end')
  // El texto del .fis va como variable para poder escribir el archivo temporal
  const fisBlock = [
    '',
    '% Contenido del archivo .fis (se escribe en una carpeta temporal para el toolbox)',
    'fis_texto = { ...',
    ...fisLines.map((l) => `    ${mstr(l)}, ...`),
    '};'
  ]
  // Insertar el bloque del .fis justo antes de la sección 5 (antes de las funciones)
  const idx = L.findIndex((l) => l.startsWith('%% 5.'))
  L.splice(idx, 0, ...fisBlock, '')
  return L.join('\n') + '\n'
}

/* ---------------- Sistema de ejemplo ---------------- */
const mf = (name, type, params) => ({ name, type, params })

export function exampleSystem() {
  return {
    name: 'propina',
    inputs: [
      {
        name: 'servicio',
        range: [0, 10],
        mfs: [mf('malo', 'gaussmf', [1.5, 0]), mf('bueno', 'gaussmf', [1.5, 5]), mf('excelente', 'gaussmf', [1.5, 10])]
      },
      {
        name: 'comida',
        range: [0, 10],
        mfs: [mf('rancia', 'trapmf', [0, 0, 2, 4]), mf('aceptable', 'gaussmf', [1.5, 5]), mf('deliciosa', 'trapmf', [6, 8, 10, 10])]
      },
      {
        name: 'espera',
        range: [0, 60],
        mfs: [mf('corta', 'trapmf', [0, 0, 10, 20]), mf('normal', 'trimf', [10, 25, 40]), mf('larga', 'trapmf', [30, 45, 60, 60])]
      }
    ],
    output: {
      name: 'propina',
      range: [0, 30],
      mfs: [mf('baja', 'trimf', [0, 5, 10]), mf('media', 'trimf', [5, 12.5, 20]), mf('alta', 'trimf', [15, 20, 25]), mf('generosa', 'trimf', [20, 25, 30])]
    },
    rules: [
      { antecedents: [1, 1, 0], output: 1, weight: 1, connector: 'or' },
      { antecedents: [2, 0, 0], output: 2, weight: 1, connector: 'and' },
      { antecedents: [3, 3, 0], output: 3, weight: 1, connector: 'or' },
      { antecedents: [3, 3, 1], output: 4, weight: 1, connector: 'and' },
      { antecedents: [0, 0, 3], output: 1, weight: 1, connector: 'and' }
    ]
  }
}

export function exampleScenarios() {
  return [
    { name: 'Escenario 1', values: [3, 4, 40] },
    { name: 'Escenario 2', values: [6, 6, 20] },
    { name: 'Escenario 3', values: [9, 9, 8] }
  ]
}

export function emptySystem() {
  const variable = (name, range) => ({
    name,
    range,
    mfs: [mf('bajo', 'trimf', [range[0], range[0], (range[0] + range[1]) / 2]), mf('medio', 'trimf', [range[0], (range[0] + range[1]) / 2, range[1]]), mf('alto', 'trimf', [(range[0] + range[1]) / 2, range[1], range[1]])]
  })
  return {
    name: 'sistema_difuso',
    inputs: [variable('entrada1', [0, 10]), variable('entrada2', [0, 10]), variable('entrada3', [0, 10])],
    output: variable('salida', [0, 100]),
    rules: [{ antecedents: [1, 0, 0], output: 1, weight: 1, connector: 'and' }]
  }
}
