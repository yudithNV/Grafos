#!/usr/bin/env python3
"""
GRAPHIX · Puente web ↔ MATLAB
================================

Programa pequeño que conecta la pizarra de Lógica difusa con MATLAB.

  · Abre (o se conecta a) MATLAB con el MATLAB Engine para Python.
  · Levanta un servidor local en http://127.0.0.1:8765 que solo acepta
    pedidos de la web de Graphix abierta en esta misma computadora.
  · Cuando en la web se presiona "Simular en MATLAB", recibe el script .m y
    el .fis, los guarda en la carpeta "trabajo", los ejecuta en MATLAB
    (simula los escenarios, muestra las gráficas y abre fuzzy) y devuelve
    los resultados a la web.

Uso:
    python puente_matlab.py            # se conecta a MATLAB o lo abre
    python puente_matlab.py --nuevo    # abre siempre una ventana nueva de MATLAB
    python puente_matlab.py --origen https://mi-sitio.com   # permitir otra web

Requisitos: MATLAB y el MATLAB Engine para Python (ver LEEME.md).
"""

import argparse
import io
import json
import os
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PUERTO = 8765
CARPETA_TRABAJO = Path(__file__).resolve().parent / 'trabajo'
TAMANO_MAXIMO = 2 * 1024 * 1024  # 2 MB por pedido

# Solo la web abierta en esta computadora (npm run dev / vite preview) puede usar el puente.
ORIGEN_LOCAL = re.compile(r'^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$')
ORIGENES_EXTRA = set()
HOSTS_VALIDOS = set()


def origen_permitido(origen):
    return bool(origen) and (ORIGEN_LOCAL.match(origen) is not None or origen in ORIGENES_EXTRA)


def aplanar(valor):
    """Convierte un valor de MATLAB (matlab.double, lista o número) en una lista de floats."""
    if valor is None:
        return []
    if isinstance(valor, (int, float)):
        return [float(valor)]
    salida = []
    for fila in valor:
        if isinstance(fila, (int, float)):
            salida.append(float(fila))
        else:
            salida.extend(float(x) for x in fila)
    return salida


def texto_matlab(texto):
    """Escapa un texto para ponerlo entre comillas simples en MATLAB."""
    return str(texto).replace("'", "''")


class SesionMatlab:
    """Una sola sesión de MATLAB compartida; los pedidos se atienden de uno en uno."""

    def __init__(self, nueva=False):
        self.nueva = nueva
        self.eng = None
        self.version = ''
        self.toolbox = False
        self.error = ''
        self.iniciando = False
        self.bloqueo = threading.Lock()

    # ---------- conexión ----------
    def iniciar(self):
        self.iniciando = True
        self.error = ''
        try:
            try:
                import matlab.engine
            except ImportError:
                self.error = ('No está instalado el MATLAB Engine para Python. '
                              'Ejecuta instalar_engine.bat (o mira LEEME.md).')
                print('✖', self.error)
                return
            compartidas = [] if self.nueva else list(matlab.engine.find_matlab())
            if compartidas:
                print(f'… Conectando a la sesión de MATLAB abierta ({compartidas[0]})')
                self.eng = matlab.engine.connect_matlab(compartidas[0])
            else:
                print('… Abriendo MATLAB (la primera vez puede tardar uno o dos minutos)')
                self.eng = matlab.engine.start_matlab('-desktop')
            self.version = str(self.eng.version(nargout=1))
            self.toolbox = bool(self.eng.eval(
                "license('test', 'Fuzzy_Toolbox') && ~isempty(which('readfis'))", nargout=1))
            print(f'✔ MATLAB conectado: {self.version}')
            print('  Fuzzy Logic Toolbox:', 'sí' if self.toolbox else 'no (se usará la simulación propia del script)')
        except Exception as e:  # MATLAB no se pudo abrir
            self.eng = None
            self.error = f'No se pudo abrir MATLAB: {e}'
            print('✖', self.error)
        finally:
            self.iniciando = False

    def iniciar_en_segundo_plano(self):
        threading.Thread(target=self.iniciar, daemon=True).start()

    def estado(self):
        ocupado = self.bloqueo.locked()
        return {
            'conectado': self.eng is not None,
            'iniciando': self.iniciando,
            'ocupado': ocupado,
            'matlab': self.version,
            'toolbox': self.toolbox,
            'error': self.error,
        }

    # ---------- simulación ----------
    def simular(self, nombre, script, fis):
        nombre = re.sub(r'[^A-Za-z0-9_]', '_', str(nombre or 'sistema'))[:40] or 'sistema'
        if not nombre[0].isalpha():
            nombre = 's_' + nombre
        CARPETA_TRABAJO.mkdir(exist_ok=True)
        ruta_m = CARPETA_TRABAJO / f'simular_{nombre}.m'
        ruta_fis = CARPETA_TRABAJO / f'{nombre}.fis'
        ruta_m.write_text(script, encoding='utf-8')
        if fis:
            ruta_fis.write_text(fis, encoding='utf-8')

        # Si MATLAB todavía se está abriendo, espera a que termine
        while self.iniciando:
            time.sleep(0.5)
        with self.bloqueo:
            if self.eng is None:
                self.iniciar()
                if self.eng is None:
                    return {'ok': False, 'error': self.error}

            salida, errores = io.StringIO(), io.StringIO()
            inicio = time.time()
            try:
                # Cierra las ventanas de la simulación anterior y ejecuta el script
                self.eng.eval('try, close all force; catch, end', nargout=0)
                self.eng.eval(
                    f"cd('{texto_matlab(CARPETA_TRABAJO)}'); run('{texto_matlab(ruta_m)}');",
                    nargout=0, stdout=salida, stderr=errores)
            except Exception as e:
                texto = str(e)
                if 'engine' in texto.lower() and ('terminated' in texto.lower() or 'closed' in texto.lower()):
                    # MATLAB se cerró: se volverá a abrir en el próximo pedido
                    self.eng = None
                    self.version = ''
                    texto = 'MATLAB se cerró. Vuelve a presionar "Simular en MATLAB" para abrirlo otra vez.'
                return {'ok': False, 'error': texto, 'salida': salida.getvalue() + errores.getvalue()}

            def leer(expresion, nargout=1):
                try:
                    return self.eng.eval(expresion, nargout=nargout)
                except Exception:
                    return None

            resultados = aplanar(leer("resultados(:)'"))
            etiquetas = leer("etiquetas(:)'") or []
            if isinstance(etiquetas, str):
                etiquetas = [etiquetas]
            con_toolbox = []
            if leer("exist('conToolbox', 'var')"):
                con_toolbox = aplanar(leer("conToolbox(:)'"))

            print(f'✔ Simulado "{nombre}" en {time.time() - inicio:.1f} s →',
                  ', '.join(f'{v:.4f}' for v in resultados))
            return {
                'ok': True,
                'resultados': resultados,
                'etiquetas': [str(e) for e in etiquetas],
                'evalfis': con_toolbox,
                'salida': salida.getvalue(),
                'advertencias': errores.getvalue(),
                'toolbox': self.toolbox,
                'matlab': self.version,
                'archivos': {'script': str(ruta_m), 'fis': str(ruta_fis) if fis else ''},
            }


SESION = None


class Manejador(BaseHTTPRequestHandler):
    server_version = 'GraphixPuente/1.0'

    # ---------- utilidades ----------
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
            # Chrome pide este permiso para que una web llame a localhost
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
        pass  # sin registro de cada pedido (el estado se consulta cada pocos segundos)

    # ---------- métodos ----------
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
            return self._json(200, {'ok': True, 'puente': 'graphix', **SESION.estado()})
        self._json(404, {'ok': False, 'error': 'No encontrado'})

    def do_POST(self):
        if not self._host_valido():
            return self._json(403, {'ok': False, 'error': 'Host no permitido'})
        origen = self._origen()
        # Un navegador siempre envía Origin: solo se aceptan pedidos de la web de Graphix
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
            script = datos['script']
            if not isinstance(script, str) or 'GRAPHIX' not in script[:400]:
                raise ValueError('script no generado por Graphix')
        except Exception as e:
            return self._json(400, {'ok': False, 'error': f'Pedido inválido: {e}'})
        print(f'→ Simulando "{datos.get("nombre", "sistema")}" en MATLAB…')
        respuesta = SESION.simular(datos.get('nombre'), script, datos.get('fis') or '')
        self._json(200 if respuesta.get('ok') else 500, respuesta)


def main():
    global SESION
    parser = argparse.ArgumentParser(description='Puente entre la web de Graphix y MATLAB')
    parser.add_argument('--puerto', type=int, default=PUERTO, help='puerto local (por defecto 8765)')
    parser.add_argument('--nuevo', action='store_true', help='abrir una ventana nueva de MATLAB en vez de usar una abierta')
    parser.add_argument('--origen', action='append', default=[],
                        help='otra dirección web permitida, por ejemplo https://graphix.ejemplo.com')
    args = parser.parse_args()

    ORIGENES_EXTRA.update(o.rstrip('/') for o in args.origen)
    ORIGENES_EXTRA.update(o.strip().rstrip('/') for o in os.environ.get('GRAPHIX_ORIGENES', '').split(',') if o.strip())
    HOSTS_VALIDOS.update({f'127.0.0.1:{args.puerto}', f'localhost:{args.puerto}'})

    print('=' * 60)
    print(' GRAPHIX · Puente web ↔ MATLAB')
    print('=' * 60)
    print(f' Python {sys.version.split()[0]}')
    print(f' Servidor: http://127.0.0.1:{args.puerto}  (deja esta ventana abierta)')
    print(f' Archivos: {CARPETA_TRABAJO}')
    print('-' * 60)

    SESION = SesionMatlab(nueva=args.nuevo)
    SESION.iniciar_en_segundo_plano()

    try:
        servidor = ThreadingHTTPServer(('127.0.0.1', args.puerto), Manejador)
    except OSError:
        print(f'✖ El puerto {args.puerto} ya está en uso: ¿el puente ya está abierto en otra ventana?')
        sys.exit(1)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print('\nPuente cerrado.')


if __name__ == '__main__':
    main()
