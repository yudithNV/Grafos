# Puente web ↔ MATLAB (Graphix)

Conecta la pizarra de **Lógica difusa** con MATLAB. Con el puente abierto, el botón
**Simular en MATLAB** de la web envía el sistema a MATLAB, que simula los escenarios,
muestra las gráficas y abre `fuzzy` con el sistema. Los resultados vuelven a la web
(columna **MATLAB** de la tabla de escenarios).

Sin el puente, la web sigue funcionando como antes: el botón descarga el `.m`.

## Qué se necesita

- **MATLAB** instalado (R2021b o más nuevo). Para que se abra `fuzzy`, el **Fuzzy Logic Toolbox**.
- **Python** de una versión compatible con tu MATLAB:

| MATLAB | Python | Paquete |
|---|---|---|
| R2022b / R2023a | 3.8 – 3.10 | matlabengine 9.13 / 9.14 |
| R2023b / R2024a | 3.9 – 3.11 | matlabengine 23.2 / 24.1 |
| R2024b / R2025a / R2025b | 3.9 – 3.12 | matlabengine 24.2 / 25.1 / 25.2 |

Para saber tu versión de MATLAB escribe `version` en su terminal.

## Instalar (solo la primera vez)

1. Instala Python desde python.org si no lo tienes (marca **Add Python to PATH**).
2. Doble clic en **`instalar_engine.bat`**. Busca tu MATLAB e instala el MATLAB Engine
   de la versión correcta.

Si falla, instálalo a mano desde la carpeta de MATLAB, en una terminal **como administrador**:

```
cd "C:\Program Files\MATLAB\R2024a\extern\engines\python"
python -m pip install .
```

(cambia `R2024a` por tu versión).

## Usar

1. Doble clic en **`iniciar_puente.bat`** y deja esa ventana abierta.
   - Si MATLAB ya está abierto y en su terminal escribiste `matlab.engine.shareEngine`,
     el puente usa esa misma ventana.
   - Si no, el puente abre MATLAB (la primera vez tarda uno o dos minutos).
2. Abre la web (`npm run dev`) → Lógica difusa. Arriba debe decir **MATLAB conectado** (punto verde).
3. Presiona **Simular en MATLAB**.

Los archivos que se ejecutan quedan en la carpeta `trabajo/` (el `.m` y el `.fis`).

## Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| La web dice **Sin MATLAB** | El puente no está abierto: abre `iniciar_puente.bat`. |
| `No está instalado el MATLAB Engine para Python` | Ejecuta `instalar_engine.bat`. |
| Error al instalar `matlabengine` | Tu Python no es compatible con tu MATLAB (mira la tabla). En Windows puedes tener varios: `py -3.11 instalar_engine.py`. |
| `El puerto 8765 ya está en uso` | El puente ya está abierto en otra ventana. |
| `MATLAB se cerró` | Vuelve a presionar **Simular en MATLAB**: el puente lo abre otra vez. |

## Seguridad

El puente solo escucha en esta computadora (`127.0.0.1`) y solo acepta pedidos de la web
abierta en `localhost`. Si publican la web en internet, agréguenla con
`iniciar_puente.bat --origen https://su-sitio.com`.
