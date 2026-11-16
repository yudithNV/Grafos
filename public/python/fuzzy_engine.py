"""
GRAPHIX · Motor de lógica difusa en Python (scikit-fuzzy)
=========================================================

Este archivo se ejecuta DENTRO DEL NAVEGADOR con Pyodide (Python compilado a
WebAssembly): quien abre la web no necesita instalar Python ni MATLAB.

Simula los sistemas de la pizarra de Lógica difusa como el Fuzzy Logic
Toolbox de MATLAB:
  · Mamdani: Y = mínimo, O = máximo, implicación mínimo, agregación máximo,
    centroide (101 puntos).
  · Sugeno: Y = producto, O = suma probabilística, salidas constantes o
    lineales, promedio ponderado.

Las funciones de pertenencia se calculan con scikit-fuzzy y las gráficas de
funciones y escenarios con matplotlib. El visor de reglas y la superficie 3D
son interactivos en la web: Python calcula los datos (punto_json y
superficie_json) y la web los dibuja.

También funciona en una computadora con Python:
    from fuzzy_engine import simular
"""

import base64
import io
import json
import math
import re
import sys
import time
import types

# scikit-fuzzy solo usa scipy en partes que este motor no llama (c-means y
# conversión continuo→discreto). En el navegador no se descarga scipy (47 MB):
# se deja un reemplazo que avisa si alguien intentara usar esas partes.
try:
    import scipy  # noqa: F401
except ImportError:
    def _sin_scipy(*args, **kwargs):
        raise ImportError('scipy no está disponible en el navegador')
    for _nombre in ('scipy', 'scipy.linalg', 'scipy.spatial', 'scipy.spatial.distance'):
        _m = types.ModuleType(_nombre)
        _m.__getattr__ = lambda _n: _sin_scipy
        sys.modules[_nombre] = _m
    sys.modules['scipy.spatial.distance'].cdist = _sin_scipy

import numpy as np
import skfuzzy as fuzz
import matplotlib
matplotlib.use('Agg')  # las gráficas se devuelven a la web como imágenes PNG
import matplotlib.pyplot as plt

PUNTOS = 101                       # muestras de la salida (igual que evalfis)
LIMITES = {'entradas': 6, 'funciones': 7, 'reglas': 100, 'escenarios': 10}

MF_COLORES = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#ef4444']
ESC_COLORES = ['#4f46e5', '#0f9d6e', '#db2777', '#f97316', '#0ea5e9', '#84cc16', '#a855f7', '#64748b', '#e11d48', '#14b8a6']
NOMBRE = re.compile(r'^[A-Za-z][A-Za-z0-9_]*$')


# =====================================================================
#  Validación del sistema que llega de la web
# =====================================================================
class ErrorSistema(ValueError):
    pass


def _numero(v, donde):
    try:
        n = float(v)
    except (TypeError, ValueError):
        raise ErrorSistema(f'{donde}: se esperaba un número')
    if not math.isfinite(n):
        raise ErrorSistema(f'{donde}: número no válido')
    return n


def validar(sistema, escenarios):
    if not isinstance(sistema, dict):
        raise ErrorSistema('Falta el sistema')
    sugeno = sistema.get('type') == 'sugeno'
    entradas = sistema.get('inputs') or []
    salida = sistema.get('output') or {}
    reglas = sistema.get('rules') or []
    if not 1 <= len(entradas) <= LIMITES['entradas']:
        raise ErrorSistema('El sistema debe tener entre 1 y 6 entradas')
    if len(reglas) > LIMITES['reglas']:
        raise ErrorSistema('Demasiadas reglas')

    def variable(v, es_salida):
        nombre = str(v.get('name', ''))
        if not NOMBRE.match(nombre):
            raise ErrorSistema(f'Nombre de variable no válido: "{nombre}"')
        lo, hi = (_numero(x, f'{nombre} · rango') for x in (v.get('range') or [None, None])[:2])
        if not lo < hi:
            raise ErrorSistema(f'{nombre}: el mínimo debe ser menor que el máximo')
        mfs = v.get('mfs') or []
        if not 1 <= len(mfs) <= LIMITES['funciones']:
            raise ErrorSistema(f'{nombre}: debe tener entre 1 y 7 funciones')
        limpias = []
        for mf in mfs:
            tipo = mf.get('type')
            p = [_numero(x, f'{nombre} · {mf.get("name")}') for x in (mf.get('params') or [])]
            if es_salida and sugeno:
                necesarios = len(entradas) + 1 if tipo == 'linear' else 1
                if tipo not in ('constant', 'linear') or len(p) != necesarios:
                    raise ErrorSistema(f'{nombre} · {mf.get("name")}: salida de Sugeno no válida')
            elif tipo == 'trimf':
                if len(p) != 3 or not p[0] <= p[1] <= p[2]:
                    raise ErrorSistema(f'{nombre} · {mf.get("name")}: triangular necesita a ≤ b ≤ c')
            elif tipo == 'trapmf':
                if len(p) != 4 or not p[0] <= p[1] <= p[2] <= p[3]:
                    raise ErrorSistema(f'{nombre} · {mf.get("name")}: trapezoidal necesita a ≤ b ≤ c ≤ d')
            elif tipo == 'gaussmf':
                if len(p) != 2 or not p[0] > 0:
                    raise ErrorSistema(f'{nombre} · {mf.get("name")}: gaussiana necesita σ > 0')
            else:
                raise ErrorSistema(f'{nombre} · {mf.get("name")}: tipo de función no válido')
            limpias.append({'name': str(mf.get('name', ''))[:30], 'type': tipo, 'params': p})
        return {'name': nombre, 'range': [lo, hi], 'mfs': limpias}

    ent = [variable(v, False) for v in entradas]
    sal = variable(salida, True)
    reg = []
    for r in reglas:
        ant = [int(a) for a in (r.get('antecedents') or [])]
        out = int(r.get('output') or 0)
        if len(ant) != len(ent):
            raise ErrorSistema('Una regla no tiene una casilla por cada entrada')
        if not (out > 0 and any(a > 0 for a in ant)):
            continue  # regla incompleta: se ignora, como en la web
        if out > len(sal['mfs']) or any(a < 0 or a > len(ent[i]['mfs']) for i, a in enumerate(ant)):
            raise ErrorSistema('Una regla usa una función que no existe')
        peso = _numero(r.get('weight', 1), 'peso de una regla')
        reg.append({'antecedents': ant, 'output': out, 'weight': min(max(peso, 0), 1),
                    'connector': 'or' if r.get('connector') == 'or' else 'and'})
    if not reg:
        raise ErrorSistema('Agrega al menos una regla completa')

    esc = []
    for k, sc in enumerate((escenarios or [])[:LIMITES['escenarios']]):
        valores = [_numero(x, f'Escenario {k + 1}') for x in (sc.get('values') or [])]
        if len(valores) != len(ent):
            raise ErrorSistema(f'Escenario {k + 1}: se esperaban {len(ent)} valores')
        esc.append({'name': str(sc.get('name') or f'Escenario {k + 1}')[:30], 'values': valores})
    if not esc:
        raise ErrorSistema('Falta al menos un escenario')
    return {'name': str(sistema.get('name') or 'sistema')[:40], 'type': 'sugeno' if sugeno else 'mamdani',
            'inputs': ent, 'output': sal, 'rules': reg}, esc


# =====================================================================
#  Motor difuso con scikit-fuzzy
# =====================================================================
def pertenencia(mf, x):
    """Grado de pertenencia (scikit-fuzzy) de x, que puede ser número o arreglo."""
    x = np.atleast_1d(np.asarray(x, dtype=float))
    plano = x.ravel()
    p = mf['params']
    if mf['type'] == 'trimf':
        y = fuzz.trimf(plano, p)
    elif mf['type'] == 'trapmf':
        y = fuzz.trapmf(plano, p)
    else:  # gaussmf: en MATLAB [σ c], en scikit-fuzzy (x, centro, σ)
        y = fuzz.gaussmf(plano, p[1], p[0])
    return np.asarray(y, dtype=float).reshape(x.shape)


def valor_sugeno(mf, x):
    p = mf['params']
    if mf['type'] == 'constant':
        return p[0]
    return float(np.dot(p[:-1], x) + p[-1])


def evaluar(sistema, valores):
    entradas, salida, reglas = sistema['inputs'], sistema['output'], sistema['rules']
    lo, hi = salida['range']
    # Los valores fuera de rango se ajustan al límite más cercano (como evalfis)
    x = [min(max(v, e['range'][0]), e['range'][1]) for v, e in zip(valores, entradas)]
    grados = [[float(pertenencia(mf, xi)[0]) for mf in e['mfs']] for e, xi in zip(entradas, x)]

    fuerzas, salidas_z, recortes = [], [], []
    for r in reglas:
        g = [grados[i][a - 1] for i, a in enumerate(r['antecedents']) if a > 0]
        if sistema['type'] == 'sugeno':
            if r['connector'] == 'or':
                f = g[0]
                for gi in g[1:]:
                    f = f + gi - f * gi          # suma probabilística
            else:
                f = float(np.prod(g))            # producto
        else:
            f = max(g) if r['connector'] == 'or' else min(g)
        fuerzas.append(f * r['weight'])

    if sistema['type'] == 'sugeno':
        salidas_z = [valor_sugeno(salida['mfs'][r['output'] - 1], x) for r in reglas]
        total = sum(fuerzas)
        sin_reglas = total <= 0
        valor = (lo + hi) / 2 if sin_reglas else sum(w * z for w, z in zip(fuerzas, salidas_z)) / total
        cercanos = [abs(valor_sugeno(mf, x) - valor) for mf in salida['mfs']]
        etiqueta = salida['mfs'][int(np.argmin(cercanos))]['name']
        return {'valor': valor, 'etiqueta': etiqueta, 'grados': grados, 'fuerzas': fuerzas,
                'z': salidas_z, 'sin_reglas': sin_reglas, 'x': x}

    ys = np.linspace(lo, hi, PUNTOS)
    agregada = np.zeros_like(ys)
    for r, f in zip(reglas, fuerzas):
        recorte = np.fmin(f, pertenencia(salida['mfs'][r['output'] - 1], ys))   # implicación: mínimo
        recortes.append(recorte)
        agregada = np.fmax(agregada, recorte)                                     # agregación: máximo
    sin_reglas = not agregada.sum() > 0
    if sin_reglas:
        valor = (lo + hi) / 2
    else:
        valor = float(np.sum(agregada * ys) / np.sum(agregada))   # centroide discreto (igual que MATLAB)
    etiqueta = salida['mfs'][int(np.argmax([pertenencia(mf, valor)[0] for mf in salida['mfs']]))]['name']
    return {'valor': valor, 'etiqueta': etiqueta, 'grados': grados, 'fuerzas': fuerzas,
            'ys': ys, 'agregada': agregada, 'recortes': recortes, 'sin_reglas': sin_reglas, 'x': x}


def evaluar_lote(sistema, X):
    """Evalúa muchos puntos a la vez (filas de X). Se usa para la superficie 3D."""
    entradas, salida, reglas = sistema['inputs'], sistema['output'], sistema['rules']
    lo, hi = salida['range']
    X = np.asarray(X, dtype=float).copy()
    for i, e in enumerate(entradas):
        X[:, i] = np.clip(X[:, i], e['range'][0], e['range'][1])
    grados = [[pertenencia(mf, X[:, i]) for mf in e['mfs']] for i, e in enumerate(entradas)]
    fuerzas = []
    for r in reglas:
        g = [grados[i][a - 1] for i, a in enumerate(r['antecedents']) if a > 0]
        if sistema['type'] == 'sugeno':
            if r['connector'] == 'or':
                f = g[0]
                for gi in g[1:]:
                    f = f + gi - f * gi
            else:
                f = np.prod(g, axis=0)
        else:
            f = np.max(g, axis=0) if r['connector'] == 'or' else np.min(g, axis=0)
        fuerzas.append(f * r['weight'])
    F = np.array(fuerzas)                                   # reglas × puntos
    if sistema['type'] == 'sugeno':
        Z = []
        for r in reglas:
            mf = salida['mfs'][r['output'] - 1]
            p = mf['params']
            Z.append(np.full(len(X), p[0]) if mf['type'] == 'constant' else X @ np.array(p[:-1]) + p[-1])
        Z = np.array(Z)
        total = F.sum(axis=0)
        with np.errstate(invalid='ignore', divide='ignore'):
            v = (F * Z).sum(axis=0) / total
        return np.where(total > 0, v, (lo + hi) / 2)
    ys = np.linspace(lo, hi, PUNTOS)
    agregada = np.zeros((len(X), PUNTOS))
    for r, f in zip(reglas, F):
        mu = pertenencia(salida['mfs'][r['output'] - 1], ys)
        agregada = np.fmax(agregada, np.fmin(f[:, None], mu[None, :]))
    area = agregada.sum(axis=1)
    with np.errstate(invalid='ignore', divide='ignore'):
        v = (agregada * ys).sum(axis=1) / area
    return np.where(area > 0, v, (lo + hi) / 2)


def centroide_skfuzzy(sistema, valores):
    """Comprobación con scikit-fuzzy: defuzz('centroid') sobre el conjunto agregado."""
    if sistema['type'] == 'sugeno':
        return None
    r = evaluar(sistema, valores)
    if r['sin_reglas']:
        return r['valor']
    return float(fuzz.defuzz(r['ys'], r['agregada'], 'centroid'))


# =====================================================================
#  Gráficas
# =====================================================================
def _png(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=110, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def _estilo(ax):
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(labelsize=8)
    ax.grid(alpha=0.25)


def _rango_salida(sistema, res):
    lo, hi = sistema['output']['range']
    if sistema['type'] != 'sugeno':
        return lo, hi
    vals = [lo, hi] + [r['valor'] for r in res] + [z for r in res for z, w in zip(r['z'], r['fuerzas']) if w > 0]
    a, b = min(vals), max(vals)
    pad = (b - a) * 0.05 or 1
    return a - pad, b + pad


def grafica_funciones(sistema, esc, res):
    entradas, salida = sistema['inputs'], sistema['output']
    n = len(entradas) + 1
    cols = 2 if n > 1 else 1
    filas = math.ceil(n / cols)
    fig, axes = plt.subplots(filas, cols, figsize=(10, 2.6 * filas), squeeze=False)
    for idx, ax in enumerate(axes.ravel()):
        if idx >= n:
            ax.axis('off')
            continue
        _estilo(ax)
        es_salida = idx == len(entradas)
        var = salida if es_salida else entradas[idx]
        if es_salida and sistema['type'] == 'sugeno':
            z1 = [valor_sugeno(mf, res[0]['x']) for mf in salida['mfs']]
            for m, (mf, z) in enumerate(zip(salida['mfs'], z1)):
                ax.vlines(z, 0, 1, color=MF_COLORES[m % 7], lw=2.2)
                ax.plot([z], [1], 'o', color=MF_COLORES[m % 7])
                ax.text(z, 1.06, mf['name'], ha='center', fontsize=8, color=MF_COLORES[m % 7], fontweight='bold')
            ax.set_xlim(*_rango_salida(sistema, res))
        else:
            xs = np.linspace(var['range'][0], var['range'][1], 401)
            for m, mf in enumerate(var['mfs']):
                mu = pertenencia(mf, xs)
                ax.plot(xs, mu, lw=1.8, color=MF_COLORES[m % 7])
                ax.text(xs[int(np.argmax(mu))], 1.06, mf['name'], ha='center', fontsize=8,
                        color=MF_COLORES[m % 7], fontweight='bold')
            ax.set_xlim(*var['range'])
        for k, r in enumerate(res):
            xk = r['valor'] if es_salida else r['x'][idx]
            ax.axvline(xk, ls='--', lw=1.6, color=ESC_COLORES[k % 10], label=esc[k]['name'])
        ax.set_ylim(0, 1.18)
        ax.set_title(('Salida: ' if es_salida else 'Entrada: ') + var['name'] +
                     (' (líneas = resultado)' if es_salida else ''), fontsize=10)
        if es_salida:
            ax.legend(fontsize=8, loc='upper center', bbox_to_anchor=(0.5, -0.18), ncol=len(res), frameon=False)
    fig.suptitle('Funciones de pertenencia y escenarios', fontsize=12, fontweight='bold')
    fig.tight_layout()
    return _png(fig)


def grafica_escenarios(sistema, esc, res):
    n = len(res)
    fig = plt.figure(figsize=(10, 6.2))
    gs = fig.add_gridspec(2, n, height_ratios=[1.15, 1])
    salida = sistema['output']
    for k, r in enumerate(res):
        ax = fig.add_subplot(gs[0, k])
        _estilo(ax)
        color = ESC_COLORES[k % 10]
        if sistema['type'] == 'sugeno':
            activas = [(z, w) for z, w in zip(r['z'], r['fuerzas']) if w > 0]
            if activas:
                zs, ws = zip(*activas)
                ax.vlines(zs, 0, ws, color=color, lw=3)
                ax.plot(zs, ws, 'o', color=color)
            ax.set_xlim(*_rango_salida(sistema, res))
            ax.set_ylabel('Fuerza', fontsize=8)
        else:
            for m, mf in enumerate(salida['mfs']):
                ax.plot(r['ys'], pertenencia(mf, r['ys']), ':', color='#94a3b8', lw=1)
            ax.fill_between(r['ys'], r['agregada'], color=color, alpha=0.35)
            ax.plot(r['ys'], r['agregada'], color=color, lw=1.5)
            ax.set_xlim(*salida['range'])
        ax.axvline(r['valor'], color='#111827', lw=2)
        ax.set_ylim(0, 1.05)
        ax.set_title(f"{esc[k]['name']}: {r['valor']:.2f} ({r['etiqueta']})", fontsize=9.5)
        ax.set_xlabel(salida['name'], fontsize=8)
    ax = fig.add_subplot(gs[1, :])
    _estilo(ax)
    nombres = [e['name'] for e in esc]
    valores = [r['valor'] for r in res]
    barras = ax.bar(nombres, valores, width=0.55, color=[ESC_COLORES[k % 10] for k in range(n)])
    for b, v in zip(barras, valores):
        ax.text(b.get_x() + b.get_width() / 2, v, f'{v:.2f}', ha='center', va='bottom', fontweight='bold', fontsize=9)
    ax.set_ylabel(salida['name'], fontsize=9)
    ax.set_title('Comparación de los escenarios (' +
                 ('promedio ponderado' if sistema['type'] == 'sugeno' else 'centroide') + ')', fontsize=10)
    fig.suptitle('Simulación de los escenarios (' + ('Sugeno' if sistema['type'] == 'sugeno' else 'Mamdani') + ')',
                 fontsize=12, fontweight='bold')
    fig.tight_layout()
    return _png(fig)


def _ejes(opciones, n):
    sup = opciones.get('surface') or [0, 1]
    ix = min(max(int(sup[0]), 0), n - 1)
    iy = min(max(int(sup[1]), 0), n - 1) if n > 1 else ix
    if iy == ix and n > 1:
        iy = (ix + 1) % n
    return ix, iy


def superficie_datos(sistema, esc, res, ix, iy, k, n=31):
    """Malla de la superficie: salida para todas las combinaciones de dos entradas."""
    entradas = sistema['inputs']
    base = list(res[k]['x'])
    xs = np.linspace(*entradas[ix]['range'], n)
    ys = np.linspace(*entradas[iy]['range'], n)
    X, Y = np.meshgrid(xs, ys)
    puntos = np.tile(np.array(base, dtype=float), (n * n, 1))
    puntos[:, ix] = X.ravel()
    puntos[:, iy] = Y.ravel()
    Z = evaluar_lote(sistema, puntos).reshape(n, n)
    return {
        'x': xs.round(6).tolist(), 'y': ys.round(6).tolist(), 'z': Z.round(6).tolist(),
        'ejes': [ix, iy], 'escenario': k,
        'nombres': [entradas[ix]['name'], entradas[iy]['name'], sistema['output']['name']],
        'fijas': [{'nombre': entradas[i]['name'], 'valor': base[i]} for i in range(len(entradas)) if i not in (ix, iy)],
        'puntos': [{'nombre': e['name'], 'x': r['x'][ix], 'y': r['x'][iy], 'z': r['valor']} for e, r in zip(esc, res)],
    }


def simular(datos):
    inicio = time.time()
    sistema, esc = validar(datos.get('system'), datos.get('scenarios'))
    res = [evaluar(sistema, e['values']) for e in esc]
    opciones = datos.get('options') or {}
    k = min(max(int(opciones.get('scenario', 0)), 0), len(esc) - 1)
    n = len(sistema['inputs'])
    ix, iy = _ejes(opciones, n)

    graficas = {
        'funciones': grafica_funciones(sistema, esc, res),
        'escenarios': grafica_escenarios(sistema, esc, res),
    }
    superficie = superficie_datos(sistema, esc, res, ix, iy, k) if n >= 2 else None

    centroides = [centroide_skfuzzy(sistema, e['values']) for e in esc]
    lineas = [f"=== {sistema['name']} ({'Sugeno' if sistema['type'] == 'sugeno' else 'Mamdani'}) ==="]
    for e, r in zip(esc, res):
        lineas.append(f"{e['name']:<12} entradas = [{' '.join(f'{v:g}' for v in r['x'])}]  ->  "
                      f"{sistema['output']['name']} = {r['valor']:.4f} ({r['etiqueta']})"
                      + ('   (ninguna regla se activó)' if r['sin_reglas'] else ''))
    if sistema['type'] != 'sugeno':
        lineas.append('')
        lineas.append('Referencia: centroide de skfuzzy.defuzz (método por áreas): ' +
                      ', '.join(f'{c:.4f}' for c in centroides))
    return {
        'ok': True,
        'tipo': sistema['type'],
        'resultados': [r['valor'] for r in res],
        'etiquetas': [r['etiqueta'] for r in res],
        'fuerzas': [r['fuerzas'] for r in res],
        'skfuzzy_centroide': centroides,
        'salida': '\n'.join(lineas),
        'graficas': graficas,
        'superficie': superficie,
        'opciones': {'scenario': k, 'surface': [ix, iy]},
        'motor': f'Python {sys.version.split()[0]} · scikit-fuzzy {getattr(fuzz, "__version__", "?")}',
        'segundos': round(time.time() - inicio, 2),
    }


def superficie(datos):
    """Solo la superficie (al cambiar los ejes o el escenario): rápido, sin imágenes."""
    sistema, esc = validar(datos.get('system'), datos.get('scenarios'))
    n = len(sistema['inputs'])
    if n < 2:
        raise ErrorSistema('La superficie necesita al menos dos entradas')
    opciones = datos.get('options') or {}
    k = min(max(int(opciones.get('scenario', 0)), 0), len(esc) - 1)
    res = [evaluar(sistema, e['values']) for e in esc]
    ix, iy = _ejes(opciones, n)
    return {'ok': True, 'superficie': superficie_datos(sistema, esc, res, ix, iy, k)}


def punto(datos):
    """Evalúa un solo punto con todo el detalle (visor de reglas interactivo)."""
    valores = datos.get('values')
    sistema, _ = validar(datos.get('system'), [{'name': 'punto', 'values': valores}])
    r = evaluar(sistema, [float(v) for v in valores])
    salida = {'ok': True, 'valor': r['valor'], 'etiqueta': r['etiqueta'], 'x': r['x'],
              'fuerzas': r['fuerzas'], 'sin_reglas': r['sin_reglas'], 'tipo': sistema['type']}
    if sistema['type'] == 'sugeno':
        salida['z'] = r['z']
    else:
        salida['ys'] = r['ys'].round(6).tolist()
        salida['agregada'] = r['agregada'].round(6).tolist()
    return salida


def _json(funcion, texto):
    try:
        return json.dumps(funcion(json.loads(texto)), ensure_ascii=False)
    except ErrorSistema as e:
        return json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False)
    except Exception as e:  # error inesperado: se informa a la web
        return json.dumps({'ok': False, 'error': f'Error en Python: {e}'}, ensure_ascii=False)


# Puntos de entrada para la web: reciben y devuelven JSON
def simular_json(texto):
    return _json(simular, texto)


def superficie_json(texto):
    return _json(superficie, texto)


def punto_json(texto):
    return _json(punto, texto)


def version():
    return {'python': sys.version.split()[0], 'skfuzzy': getattr(fuzz, '__version__', '?'),
            'numpy': np.__version__, 'matplotlib': matplotlib.__version__}
