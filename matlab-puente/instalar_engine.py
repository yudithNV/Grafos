#!/usr/bin/env python3
"""
Instala el MATLAB Engine para Python con la versión que corresponde al MATLAB
de esta computadora (se hace una sola vez).

    python instalar_engine.py

1. Busca MATLAB en el PATH (o usa la ruta que le pases: python instalar_engine.py "C:\\Program Files\\MATLAB\\R2024a").
2. Averigua su versión (R2023b, R2024a, ...).
3. Instala con pip el paquete matlabengine de esa misma versión.
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

# Versión de MATLAB -> (versión del paquete matlabengine, versiones de Python compatibles)
VERSIONES = {
    'R2021b': ('9.11', '3.7 – 3.9'),
    'R2022a': ('9.12', '3.8 – 3.9'),
    'R2022b': ('9.13', '3.8 – 3.10'),
    'R2023a': ('9.14', '3.8 – 3.10'),
    'R2023b': ('23.2', '3.9 – 3.11'),
    'R2024a': ('24.1', '3.9 – 3.11'),
    'R2024b': ('24.2', '3.9 – 3.12'),
    'R2025a': ('25.1', '3.9 – 3.12'),
    'R2025b': ('25.2', '3.9 – 3.12'),
}


def buscar_matlab_root():
    if len(sys.argv) > 1:
        return Path(sys.argv[1])
    exe = shutil.which('matlab')
    if exe:
        return Path(exe).resolve().parent.parent
    # Ubicaciones típicas
    for base in (Path('C:/Program Files/MATLAB'), Path('/Applications'), Path('/usr/local/MATLAB')):
        if base.exists():
            candidatos = sorted(p for p in base.iterdir() if re.search(r'R20\d\d[ab]', p.name))
            if candidatos:
                return candidatos[-1]
    return None


def main():
    print('Python', sys.version.split()[0])
    root = buscar_matlab_root()
    if not root or not root.exists():
        print('✖ No encontré MATLAB. Pasa la carpeta de MATLAB, por ejemplo:')
        print('   python instalar_engine.py "C:\\Program Files\\MATLAB\\R2024a"')
        sys.exit(1)

    m = re.search(r'R20\d\d[ab]', str(root))
    version = m.group(0) if m else None
    if not version:
        # Si la carpeta no dice la versión, se le pregunta a MATLAB
        print('… Preguntando la versión a MATLAB (tarda unos segundos)')
        exe = root / 'bin' / ('matlab.exe' if sys.platform.startswith('win') else 'matlab')
        out = subprocess.run([str(exe), '-batch', "disp(['R' version('-release')])"],
                             capture_output=True, text=True).stdout
        m = re.search(r'R20\d\d[ab]', out)
        version = m.group(0) if m else None

    print('MATLAB encontrado en:', root, '·', version or 'versión desconocida')
    if version not in VERSIONES:
        print('✖ No conozco esa versión. Instala el Engine desde la carpeta de MATLAB (como administrador):')
        print(f'   cd "{root / "extern" / "engines" / "python"}"')
        print('   python -m pip install .')
        sys.exit(1)

    paquete, pythons = VERSIONES[version]
    print(f'Para {version} se necesita matlabengine {paquete}.* con Python {pythons}.')
    cmd = [sys.executable, '-m', 'pip', 'install', f'matlabengine=={paquete}.*']
    print('… Ejecutando:', ' '.join(cmd))
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print('\n✖ No se pudo instalar. Revisa que tu Python esté entre', pythons)
        print('  (en Windows puedes tener varios: py -3.11 instalar_engine.py)')
        sys.exit(r.returncode)
    print('\n✔ Listo. Ahora abre iniciar_puente.bat (o python puente_matlab.py).')


if __name__ == '__main__':
    main()
