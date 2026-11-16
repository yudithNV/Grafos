#!/usr/bin/env python3
"""
GRAPHIX · Simulador de lógica difusa en Python (sin MATLAB)
===========================================================

Simula los sistemas difusos de la pizarra de Lógica difusa con la librería
scikit-fuzzy, del mismo modo que el Fuzzy Logic Toolbox de MATLAB:

  · Mamdani: Y = mínimo, O = máximo, implicación mínimo, agregación máximo,
    centroide (101 puntos).
  · Sugeno: Y = producto, O = suma probabilística, salidas constantes o
    lineales, promedio ponderado.

Levanta un servidor local en http://127.0.0.1:8765. La web le envía el sistema
y los escenarios; el simulador calcula los resultados y dibuja las gráficas
(funciones de pertenencia, escenarios, visor de reglas y superficie 3D), que
la web muestra.

Uso:
    python simulador_fuzzy.py
    python simulador_fuzzy.py --origen https://mi-sitio.com   # permitir otra web

Requisitos: Python 3.9+ y  pip install -r requirements.txt
"""

import argparse
import base64
import io
import json
import math
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    import numpy as np
    import skfuzzy as fuzz
    import matplotlib
    matplotlib.use('Agg')  # sin ventanas: las gráficas se envían a la web como imágenes
    import matplotlib.pyplot as plt
except ImportError as e:
    print('✖ Falta una librería:', e)
    print('  Ejecuta instalar.bat (o: python -m pip install -r requirements.txt)')
    input('Presiona Enter para salir…') if sys.stdin and sys.stdin.isatty() else None
    sys.exit(1)

PUERTO = 8765
TAMANO_MAXIMO = 512 * 1024
PUNTOS = 101                       # muestras de la salida (igual que evalfis)
LIMITES = {'entradas': 6, 'funciones': 7, 'reglas': 100, 'escenarios': 10}

MF_COLORES = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#ef4444']
ESC_COLORES = ['#4f46e5', '#0f9d6e', '#db2777', '#f97316', '#0ea5e9', '#84cc16', '#a855f7', '#64748b', '#e11d48', '#14b8a6']

ORIGEN_LOCAL = re.compile(r'^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$')
ORIGENES_EXTRA = set()
HOSTS_VALIDOS = set()
NOMBRE = re.compile(r'^[A-Za-z][A-Za-z0-9_]*$')

# matplotlib no es seguro con varios hilos a la vez
BLOQUEO_GRAFICAS = threading.Lock()


def origen_permitido(origen):
    return bool(origen) and (ORIGEN_LOCAL.match(origen) is not None or origen in ORIGENES_EXTRA)


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


def grafica_reglas(sistema, esc, res, k):
    """Visor de reglas al estilo de ruleview de MATLAB para un escenario."""
    entradas, salida, reglas = sistema['inputs'], sistema['output'], sistema['rules']
    r = res[k]
    filas, cols = len(reglas) + 1, len(entradas) + 1
    fig, axes = plt.subplots(filas, cols, figsize=(2.1 * cols + 0.6, 0.62 * filas + 1.1), squeeze=False)
    sugeno = sistema['type'] == 'sugeno'
    lims = _rango_salida(sistema, res)
    for i in range(filas):
        for j in range(cols):
            ax = axes[i][j]
            ax.set_yticks([])
            ax.set_ylim(0, 1.08)
            ax.tick_params(labelsize=6.5)
            for s in ax.spines.values():
                s.set_color('#cbd5e1')
            if i < filas - 1:
                ax.set_xticks([])
            if i == 0:
                ax.set_title((entradas[j]['name'] + f" = {r['x'][j]:.3g}") if j < len(entradas)
                             else f"{salida['name']} = {r['valor']:.3g}", fontsize=8.5, fontweight='bold')
            if j == 0 and i < filas - 1:
                ax.set_ylabel(str(i + 1), rotation=0, labelpad=10, fontsize=8, va='center')
            if j < len(entradas):
                e = entradas[j]
                xs = np.linspace(e['range'][0], e['range'][1], 201)
                ax.set_xlim(*e['range'])
                if i < filas - 1:
                    a = reglas[i]['antecedents'][j]
                    if a > 0:
                        mu = pertenencia(e['mfs'][a - 1], xs)
                        ax.fill_between(xs, mu, color='#facc15', alpha=0.55)
                        ax.plot(xs, mu, color='#a16207', lw=0.8)
                    ax.axvline(r['x'][j], color='#dc2626', lw=1)
                else:
                    ax.axis('off')
            else:
                ax.set_xlim(*lims)
                if i < filas - 1:
                    regla = reglas[i]
                    w = r['fuerzas'][i]
                    if sugeno:
                        ax.vlines(r['z'][i], 0, w, color='#2563eb', lw=3)
                    else:
                        mf = salida['mfs'][regla['output'] - 1]
                        mu = pertenencia(mf, r['ys'])
                        ax.plot(r['ys'], mu, color='#1e3a8a', lw=0.8)
                        ax.fill_between(r['ys'], np.fmin(w, mu), color='#3b82f6', alpha=0.6)
                else:
                    if sugeno:
                        activas = [(z, w) for z, w in zip(r['z'], r['fuerzas']) if w > 0]
                        if activas:
                            zs, ws = zip(*activas)
                            ax.vlines(zs, 0, ws, color='#2563eb', lw=2.5)
                    else:
                        ax.fill_between(r['ys'], r['agregada'], color='#3b82f6', alpha=0.6)
                    ax.axvline(r['valor'], color='#dc2626', lw=1.6)
    fig.suptitle(f"Visor de reglas · {esc[k]['name']}", fontsize=11, fontweight='bold')
    fig.tight_layout(h_pad=0.15, w_pad=0.4)
    return _png(fig)


def grafica_superficie(sistema, esc, res, ix, iy, k):
    entradas, salida = sistema['inputs'], sistema['output']
    base = list(res[k]['x'])
    n = 31
    xs = np.linspace(*entradas[ix]['range'], n)
    ys = np.linspace(*entradas[iy]['range'], n)
    Z = np.zeros((n, n))
    for a, yv in enumerate(ys):
        for b, xv in enumerate(xs):
            v = list(base)
            v[ix], v[iy] = xv, yv
            Z[a, b] = evaluar(sistema, v)['valor']
    X, Y = np.meshgrid(xs, ys)
    fig = plt.figure(figsize=(8.5, 6.4))
    ax = fig.add_subplot(111, projection='3d')
    ax.plot_surface(X, Y, Z, cmap='viridis', edgecolor='none', alpha=0.95)
    ax.set_xlabel(entradas[ix]['name'], fontsize=9)
    ax.set_ylabel(entradas[iy]['name'], fontsize=9)
    ax.set_zlabel(salida['name'], fontsize=9)
    ax.tick_params(labelsize=7)
    for kk, (e, r) in enumerate(zip(esc, res)):
        ax.scatter([r['x'][ix]], [r['x'][iy]], [r['valor']], color=ESC_COLORES[kk % 10], s=40, depthshade=False,
                   edgecolor='white', label=e['name'])
    ax.view_init(elev=28, azim=-130)
    otras = [f"{entradas[i]['name']} = {base[i]:.3g}" for i in range(len(entradas)) if i not in (ix, iy)]
    titulo = f"Superficie: {salida['name']} según {entradas[ix]['name']} y {entradas[iy]['name']}"
    if otras:
        titulo += '\n(' + ', '.join(otras) + f" · de {esc[k]['name']})"
    ax.set_title(titulo, fontsize=10)
    ax.legend(fontsize=8, loc='upper left')
    return _png(fig)


def simular(datos):
    inicio = time.time()
    sistema, esc = validar(datos.get('system'), datos.get('scenarios'))
    res = [evaluar(sistema, e['values']) for e in esc]
    opciones = datos.get('options') or {}
    k = min(max(int(opciones.get('scenario', 0)), 0), len(esc) - 1)
    n = len(sistema['inputs'])
    sup = opciones.get('surface') or [0, 1]
    ix = min(max(int(sup[0]), 0), n - 1)
    iy = min(max(int(sup[1]), 0), n - 1) if n > 1 else ix
    if iy == ix and n > 1:
        iy = (ix + 1) % n

    with BLOQUEO_GRAFICAS:
        graficas = {
            'funciones': grafica_funciones(sistema, esc, res),
            'escenarios': grafica_escenarios(sistema, esc, res),
            'reglas': grafica_reglas(sistema, esc, res, k),
        }
        if n >= 2:
            graficas['superficie'] = grafica_superficie(sistema, esc, res, ix, iy, k)

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
    print(f"✔ Simulado \"{sistema['name']}\" en {time.time() - inicio:.2f} s →",
          ', '.join(f"{r['valor']:.4f}" for r in res))
    return {
        'ok': True,
        'tipo': sistema['type'],
        'resultados': [r['valor'] for r in res],
        'etiquetas': [r['etiqueta'] for r in res],
        'fuerzas': [r['fuerzas'] for r in res],
        'skfuzzy_centroide': centroides,
        'salida': '\n'.join(lineas),
        'graficas': graficas,
        'opciones': {'scenario': k, 'surface': [ix, iy]},
        'motor': f'Python {sys.version.split()[0]} · scikit-fuzzy {getattr(fuzz, "__version__", "?")}',
    }


# =====================================================================
#  Servidor local
# =====================================================================
class Manejador(BaseHTTPRequestHandler):
    server_version = 'GraphixFuzzyPython/1.0'

    def _origen(self):
        return self.headers.get('Origin', '')

    def _host_valido(self):
        return self.headers.get('Host', '') in HOSTS_VALIDOS

    def _cabeceras_cors(self):
        origen = self._origen()
        if origen_permitido(origen):
            self.send_header('Access-Control-Allow-Origin', origen)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.send_header('Access-Control-Max-Age', '600')

    def _json(self, codigo, datos):
        cuerpo = json.dumps(datos, ensure_ascii=False).encode('utf-8')
        self.send_response(codigo)
        self._cabeceras_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(cuerpo)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, formato, *args):
        pass

    def do_OPTIONS(self):
        if not self._host_valido() or not origen_permitido(self._origen()):
            self.send_response(403)
            self.end_headers()
            return
        self.send_response(204)
        self._cabeceras_cors()
        self.end_headers()

    def do_GET(self):
        if not self._host_valido():
            return self._json(403, {'ok': False, 'error': 'Host no permitido'})
        origen = self._origen()
        if origen and not origen_permitido(origen):
            return self._json(403, {'ok': False, 'error': 'Origen no permitido'})
        if self.path.split('?')[0] in ('/', '/estado'):
            return self._json(200, {
                'ok': True, 'simulador': 'graphix-python',
                'python': sys.version.split()[0],
                'skfuzzy': getattr(fuzz, '__version__', '?'),
            })
        self._json(404, {'ok': False, 'error': 'No encontrado'})

    def do_POST(self):
        if not self._host_valido():
            return self._json(403, {'ok': False, 'error': 'Host no permitido'})
        origen = self._origen()
        if origen and not origen_permitido(origen):
            print(f'⚠ Pedido rechazado desde {origen}')
            return self._json(403, {'ok': False, 'error': 'Origen no permitido'})
        if self.path.split('?')[0] != '/simular':
            return self._json(404, {'ok': False, 'error': 'No encontrado'})
        if not self.headers.get('Content-Type', '').lower().startswith('application/json'):
            return self._json(415, {'ok': False, 'error': 'Se esperaba JSON'})
        try:
            largo = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            largo = 0
        if largo <= 0 or largo > TAMANO_MAXIMO:
            return self._json(413, {'ok': False, 'error': 'Pedido vacío o demasiado grande'})
        try:
            datos = json.loads(self.rfile.read(largo).decode('utf-8'))
            if not isinstance(datos, dict):
                raise ValueError('formato no válido')
        except Exception as e:
            return self._json(400, {'ok': False, 'error': f'Pedido inválido: {e}'})
        try:
            return self._json(200, simular(datos))
        except ErrorSistema as e:
            return self._json(422, {'ok': False, 'error': str(e)})
        except Exception as e:  # error inesperado: se informa sin cerrar el simulador
            print('✖ Error al simular:', repr(e))
            return self._json(500, {'ok': False, 'error': f'Error al simular: {e}'})


def main():
    parser = argparse.ArgumentParser(description='Simulador de lógica difusa (Python + scikit-fuzzy) para Graphix')
    parser.add_argument('--puerto', type=int, default=PUERTO, help='puerto local (por defecto 8765)')
    parser.add_argument('--origen', action='append', default=[],
                        help='otra dirección web permitida, por ejemplo https://graphix.ejemplo.com')
    args = parser.parse_args()
    ORIGENES_EXTRA.update(o.rstrip('/') for o in args.origen)
    ORIGENES_EXTRA.update(o.strip().rstrip('/') for o in os.environ.get('GRAPHIX_ORIGENES', '').split(',') if o.strip())
    HOSTS_VALIDOS.update({f'127.0.0.1:{args.puerto}', f'localhost:{args.puerto}'})

    print('=' * 60)
    print(' GRAPHIX · Simulador de lógica difusa en Python')
    print('=' * 60)
    print(f" Python {sys.version.split()[0]} · scikit-fuzzy {getattr(fuzz, '__version__', '?')}")
    print(f' Servidor: http://127.0.0.1:{args.puerto}  (deja esta ventana abierta)')
    print(' En la web: Lógica difusa → "Simular en Python"')
    print('-' * 60)
    try:
        servidor = ThreadingHTTPServer(('127.0.0.1', args.puerto), Manejador)
    except OSError:
        print(f'✖ El puerto {args.puerto} ya está en uso: ¿el simulador ya está abierto en otra ventana?')
        sys.exit(1)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print('\nSimulador cerrado.')


if __name__ == '__main__':
    main()
