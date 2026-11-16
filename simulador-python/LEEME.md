# Simulador de lógica difusa en Python (Graphix)

Simula los sistemas de la pizarra de **Lógica difusa** con Python y la librería
**scikit-fuzzy**, sin necesidad de MATLAB.

La web le envía el sistema (entradas, funciones, reglas, Mamdani o Sugeno) y los
escenarios. Python calcula los resultados y dibuja las gráficas, y la web las muestra:

- **Funciones de pertenencia** de cada variable, con los escenarios marcados.
- **Simulación de los escenarios**: el conjunto agregado y el centroide (Mamdani), o la
  salida de cada regla (Sugeno), más la comparación en barras.
- **Visor de reglas** (como el Rule Viewer de MATLAB) para el escenario que elijas.
- **Superficie 3D**: la salida para todas las combinaciones de dos entradas.

Los cálculos son los mismos que los de MATLAB: Mamdani con mínimo, máximo y centroide de
101 puntos; Sugeno con producto, suma probabilística y promedio ponderado.

## Instalar (solo la primera vez)

1. Instala **Python 3.9 o más nuevo** desde python.org. Marca **Add Python to PATH**.
2. Doble clic en **`instalar.bat`**: instala scikit-fuzzy, numpy, scipy, networkx y matplotlib.

O a mano: `python -m pip install -r requirements.txt`

## Usar

1. Doble clic en **`iniciar_simulador.bat`** y deja esa ventana abierta.
2. Abre la web (`npm run dev`) → **Lógica difusa**. Arriba debe decir **Python conectado** (punto verde).
3. Presiona **Simular en Python**. Debajo de los escenarios aparecen los resultados y las gráficas.

## Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| La web dice **Sin Python** | El simulador no está abierto: abre `iniciar_simulador.bat`. |
| `Falta una librería` | Ejecuta `instalar.bat`. |
| `'python' no se reconoce…` | Instala Python marcando *Add Python to PATH*, o reinicia la terminal. |
| `El puerto 8765 ya está en uso` | El simulador ya está abierto en otra ventana. |

## Seguridad

El simulador solo escucha en esta computadora (`127.0.0.1`) y solo acepta pedidos de la web
abierta en `localhost`. No ejecuta código: solo recibe los datos del sistema y hace cálculos.
Si publican la web en internet, agréguenla con `iniciar_simulador.bat --origen https://su-sitio.com`.
