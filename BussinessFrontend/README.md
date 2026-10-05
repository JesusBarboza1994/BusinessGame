# BussinessFrontend

Interfaz del Business Simulator: React 19, Vite, Tailwind 4, Framer Motion, Recharts, TanStack Query y socket.io.

```bash
npm install
npm run dev        # http://localhost:5174 (redirige /v1 y /socket.io a la API en :4000)
npm run build
npm test
npm run typecheck
```

El puerto se cambia con `PORT=...` y la API destino con `API_TARGET=...`. En producción, `VITE_API_URL` apunta al backend si no se sirve desde el mismo dominio.

## Pantallas

**Jugador (móvil primero):**
- **Inicio** con el PIN gigante.
- **Ingreso** en 3 pasos: PIN, identidad (nombre, logo, color) y método contable.
- **Sala de espera** en vivo y **tutorial** de 5 tarjetas.
- **Cabina de decisiones** en 5 pasos: producción, mercado, I+D, finanzas y revisión.
  - Sliders con valores sugeridos y ayudas en lenguaje simple.
  - Asesor que guía los primeros trimestres (modo guiado).
  - Proyección de caja y demanda en vivo.
  - Validación del backend mientras el jugador mueve los controles, con borrador autoguardado.
- **Espera** con el progreso de las demás empresas y consejos.
- **Revelación de resultados** animada: puesto, utilidad, acción, participación y alertas que explican qué pasó.
- **Informes:** resumen con gráficos, estado de resultados (más la vista de costeo directo), balance, flujo de caja, indicadores y estudio de mercado.
- **Ranking** con logros y **pantalla final** con podio.

**Facilitador:**
- **Login** y **lista de partidas**.
- **Crear partida** con formatos predefinidos (Rápida, Estándar, Torneo) y reglas avanzadas.
- **Sala** con el PIN en grande, código QR y modo pantalla completa para proyectar.
- **Bots:** el facilitador agrega empresas automáticas eligiendo estrategia (mezcla, balanceado, bajo costo, premium o crecimiento), nivel (fácil, normal o difícil) y cantidad.
- **Control en vivo:** temporizador, quién ya envió, ranking, gráficos del mercado, detalle por trimestre y cierre forzado.
- **Podio final** con exportación del ranking a CSV.

## Despliegue en Railway (Docker)

La imagen compila con Vite y sirve los archivos estáticos con nginx (con fallback del SPA y health check en `/healthz`). nginx escucha en el `PORT` que inyecta Railway.

1. Crea el servicio **Frontend** en el mismo proyecto que el backend, desde el repo de GitHub:
   - **Root Directory: vacío.** El contexto del build es la raíz del monorepo.
   - **Railway Config File:** `/BussinessFrontend/railway.json`.
   - Si existe la variable `RAILWAY_DOCKERFILE_PATH`, bórrala.
2. Agrega la variable `VITE_API_URL` = `https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}`. Es la URL pública del backend, sin `/v1` y sin barra final.
   - Se usa **en el build**. Si la cambias, vuelve a desplegar.
3. En **Settings → Networking → Generate Domain**, crea el dominio público. Pon ese dominio en el `CORS_ORIGIN` del backend.

Para probar la imagen en local:

```bash
# desde la raíz del repo
docker build -f BussinessFrontend/Dockerfile --build-arg VITE_API_URL=http://localhost:4000 -t bsim-frontend .
docker run -p 8080:8080 bsim-frontend
```
