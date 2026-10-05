# Reglas de negocio — Business Simulator v2 (propuesta)

Estado: **aprobado** (2026-10-04). Fuentes: el Excel "Modelo de Negocio Base" y las respuestas del 2026-10-04.
Cada número de este documento es un **valor por defecto configurable por partida** (`GameSettings`, ver §16).

## 0. Convenciones

- `t` es el ciclo (un trimestre). El **ciclo 0 es el estado inicial y no se juega**; el primer ciclo jugable es el 1.
- `k ∈ {A, B}` es el producto. A es el producto económico (calidad base baja) y B el premium (calidad base alta). Ambos compiten en el mismo mercado.
- `i` es la empresa. Cada jugador tiene una sola empresa.
- Las unidades físicas son enteras (se redondea hacia abajo) y los montos se guardan con 2 decimales.
- Cada partida tiene una semilla aleatoria, así que el mismo ciclo recalculado da siempre el mismo resultado (reproducible y testeable).

## 1. Partida y ciclos

- **Facilitador**: es quien crea la partida. Configura los parámetros, inicia la partida y puede forzar el cierre de un ciclo. No tiene empresa.
- **Jugadores**: se unen con un código. Cada uno es una empresa.
- Estados de la partida: `LOBBY → IN_PROGRESS → FINISHED`. Estados del ciclo: `OPEN → PROCESSING → CLOSED`.
- **Disparadores de cierre del ciclo** (el primero que ocurra):
  1. Todas las empresas activas enviaron sus decisiones.
  2. Vence el tiempo del ciclo (`cycleDurationMinutes`).
  3. El facilitador fuerza el cierre.
- **Si una empresa no envía decisiones**:
  - Se repiten sus **decisiones operativas** del ciclo anterior: producción, compras, precios, marketing, I+D e investigación de mercado.
  - Las **decisiones financieras puntuales** se ponen en 0: préstamos, prepagos, emisión de acciones, dividendos, módulos de capacidad y compra de valores.
  - Si las decisiones repetidas ya no son factibles (por ejemplo, faltan materiales), se recortan de forma proporcional hasta el máximo factible.
- Las decisiones se pueden reenviar mientras el ciclo esté `OPEN`; vale el último envío.

## 2. Estado inicial (ciclo 0)

| Concepto | Valor |
|---|---|
| Caja | 100.000 |
| Capacidad | 1.000 u/ciclo |
| Activo fijo | 50.000 (1.000 u × 50) |
| Inventario de materia prima (MP) A / B | 500 u (4.000) / 500 u (5.000) |
| Inventario de producto terminado (PT) A / B | 0 / 0 |
| Deuda | 0 |
| Acciones | 15.900 con valor nominal 10, es decir capital social 159.000 (cuadra con el activo) |
| Acumulado de I+D y de marketing | 0 |
| Precio inicial de la acción | Valor en libros por acción = 10 |

## 3. Producción

**3.1 Capacidad**
- `Cap(t) = C0 + módulosActivos × 1.000`.
- Un módulo comprado en `t` entra en operación en `t+1`.
- Cuesta `1.000 × 50 = 50.000`, se paga en `t` y se registra como activo fijo.

**3.2 Asignación (la decide el jugador)**
- Debe cumplirse `prodA × uA + prodB × uB ≤ Cap(t)`, con `u = 1` unidad de capacidad por unidad producida.

**3.3 Materiales**
- Se usa 1 unidad de MP por cada unidad producida.
- Debe cumplirse `prod_k ≤ MP_inicial_k(t)`.
- La compra hecha en `t` **llega en `t+1`** y **se paga en `t`**.

**3.4 Validación al enviar decisiones**
- **Bloqueantes** (el envío se rechaza con el detalle):
  - Supera la capacidad.
  - Supera los materiales disponibles.
  - Hay valores negativos.
  - Los dividendos superan las utilidades retenidas.
  - Los préstamos superan el límite de crédito.
  - Se emiten acciones por debajo del valor nominal.
- **Advertencias** (el envío se acepta y se muestran):
  - La caja proyectada queda negativa, lo que provocará un préstamo de emergencia.
  - La utilización de la capacidad es menor al 50%.
  - El precio está por debajo del costo variable unitario.
  - El pedido de materiales no alcanza para la producción del siguiente ciclo con la misma asignación.

**3.5 Costo variable por unidad**
- Material (A = 8, B = 10) + mano de obra directa (MOD; A = 3, B = 5) + costos indirectos de fabricación (CIF) variables (A = 5, B = 7). Fabricar el producto premium cuesta más.
- El CIF fijo se trata en §6.

## 4. Mercado

### 4.1 Tamaño del mercado

```
D(t) = N × C0 × u0 × G(t) × E(t)/100 × (IP(t))^(-εm) + L(t-1)
```

| Símbolo | Significado | Valor por defecto |
|---|---|---|
| `N` | Empresas al inicio de la partida (no baja por quiebras: su demanda pasa a las demás) | — |
| `u0` | Utilización objetivo inicial | 0,85 |
| `G(t)` | Crecimiento acumulado: `G(t) = G(t-1) × (1 + g + ruido)` | `g` = 5%, `ruido ~ N(0; 0,02)` |
| `E(t)` | Índice económico (ver §14) | — |
| `IP(t)` | Índice de precios: promedio de `P_jk / P_ref_k` de todas las ofertas | `P_ref`: A = 30, B = 40 |
| `εm` | Elasticidad del mercado total | 1,2 (evita que todos suban precios coludidos) |
| `L(t-1)` | Demanda latente que no se atendió en el ciclo anterior | — |

El mercado se divide en dos **segmentos de consumidores**:
- **PRECIO**, con peso base 60%.
- **CALIDAD**, con peso base 40%.
- Cuando la economía empeora, el segmento PRECIO gana peso: `w_PRECIO(t) = 0,60 + 0,5 × (100 − E(t))/100`, acotado entre 0,4 y 0,8.
- `D_s = D × w_s`.

### 4.2 Atractivo de cada oferta

Cada oferta `j` es la combinación de una empresa y un producto. Su atractivo en el segmento `s` es:

```
Attr_js = QI_j^αs × MI_j^βs × (P_j / P̄)^(−γs) × η_j
```

**Índice de calidad (QI)**
- `QI_j = base_k × (1 + Kq_j / (Kq_j + hq))`, con `base` A = 1,0, B = 1,6 y `hq` = 4.000.
- El acumulado de I+D se deprecia: `Kq(t) = Kq(t−1) × (1 − δq) + I+D(t)`, con `δq` = 0,25 por ciclo.

**Índice de marketing (MI)**
- `MI_j = 1 + Km_j / (Km_j + hm)`.
- Es saturable: gastar el doble no rinde el doble.
- `Km(t) = Km(t−1) × (1 − δm) + MKT(t)`, con `δm` = 0,5 y `hm` = 2.000.

**Precio**
- `P̄` es el precio promedio de todas las ofertas.

**Factor variable del trimestre**
- `η_j ~ LogNormal(0; 0,08)`, distinto en cada ciclo y para cada oferta.

**Pesos por segmento**

| Segmento | α (calidad) | β (marketing) | γ (precio) |
|---|---|---|---|
| PRECIO | 0,5 | 1,0 | 3,0 |
| CALIDAD | 2,0 | 1,0 | 1,6 |

**Reparto de la demanda**
- `Share_js = Attr_js / Σ Attr_s`.
- `Demanda_j = Σ_s D_s × Share_js`.

### 4.3 Ventas y demanda insatisfecha

1. `Disponible_j = PT_inicial_j + prod_j`. Lo que se produce en el ciclo se puede vender en el mismo ciclo.
2. Primera ronda: `Ventas_j = min(Demanda_j, Disponible_j)`. La diferencia es `Insatisfecha_js`.
3. **Redistribución** (hasta 3 rondas):
   - Una fracción `σ` = 0,6 de la demanda insatisfecha de cada segmento busca un sustituto. El resto no espera.
   - Ese volumen se reparte **con la misma fórmula de atractivo**, pero solo entre las ofertas que aún tienen stock. El reparto se renormaliza.
   - Las ventas son siempre ≤ al disponible.
4. La demanda que sigue sin atenderse pasa en una fracción `λ` = 0,3 a la demanda latente `L(t)` del ciclo siguiente. El resto se pierde.
5. Las empresas que se quedaron sin stock pierden reputación: `Km_j ← Km_j × (1 − 0,2 × fracción_sin_atender_j)`.

**Por qué la misma fórmula:** quien se queda con los clientes de un competidor sin stock es, en la realidad, el siguiente más atractivo para ese mismo cliente. Una fórmula aparte necesitaría parámetros nuevos que el jugador no puede razonar.

### 4.4 Participación de mercado

- `Share_j = Ventas_j / Σ Ventas`, por producto y total.

## 5. Gastos operativos

| Gasto | Regla |
|---|---|
| Marketing | Lo decidido, se carga al gasto del ciclo |
| I+D (mejora de calidad) | Lo decidido, se carga al gasto del ciclo (la NIC 38 trata la investigación como gasto). Solo alimenta `Kq` |
| Investigación de mercado | 600 si se compra |
| Administrativos | `F_adm × √(Cap/C0) + 3% × Ventas × U(0,9; 1,1)`, con `F_adm` = 1.000. Tiene una parte fija que crece con el tamaño de la planta y una parte variable con algo de ruido |
| Almacenaje | 0,5 por unidad de PT y 0,2 por unidad de MP en inventario final |
| Capacidad ociosa | Ver §6 |

## 6. Costeo e inventarios

**Costeo por absorción**
- Es obligatorio para los estados financieros, como exigen la NIC 2 y las NIIF.
- `Costo unitario = MP + MOD + CIF variable + CIF fijo absorbido`.
- El CIF fijo es la depreciación de la planta del ciclo: 2,5% trimestral, lineal, sobre el activo fijo bruto.
- Tasa de absorción: `CIF fijo / Cap(t)` por unidad.
- **Capacidad ociosa**: el CIF fijo no absorbido, `Depreciación × (1 − prodTotal/Cap)`, va a gasto del período. Así se ve el costo de sobredimensionar la planta.

**Método de valuación**
- Lo elige cada empresa al unirse y no se puede cambiar, por el principio de uniformidad.
- `PROMEDIO_PONDERADO` (valor por defecto).
- `PEPS` (FIFO).
- UEPS (LIFO) no se permite bajo NIIF.

**Reporte gerencial adicional (solo informativo)**
- Estado de resultados con costeo directo: ventas − costos variables = margen de contribución − costos fijos.

## 7. Finanzas

Todas las decisiones financieras se ejecutan **al inicio del ciclo**: el dinero queda disponible para el ciclo.

**7.1 Préstamo de corto plazo**
- Tasa de 3% trimestral.
- El interés se reconoce en `t` como intereses por pagar.
- **El capital y el interés se pagan automáticamente al inicio de `t+1`.**

**7.2 Préstamo de largo plazo**
- Sistema francés, a 20 trimestres (5 años).
- `i = (1 + 12%)^(1/4) − 1 ≈ 2,87%` trimestral.
- `Cuota = P × i / (1 − (1+i)^−n)`. Con la tasa del Excel (50% anual), para 6.000 la cuota sería ≈ 737,17 y el primer interés 640,08, igual que en el Excel.
- La primera cuota se paga en `t+1`. Cada préstamo tiene su propio cronograma.
- **Prepago**: el jugador indica el monto y el modo, `REDUCIR_CUOTA` o `REDUCIR_PLAZO`. Penalidad configurable, 0% por defecto.
- La porción que vence en los próximos 4 ciclos se muestra como pasivo corriente.

**7.3 Límite de crédito**
- Deuda financiera total (sin contar emergencia) ≤ 1,5 × patrimonio al cierre del ciclo anterior.

**7.4 Préstamo de emergencia (automático)**
- Si la caja al cierre del ciclo queda por debajo de 0, el banco presta `déficit × 1,05`.
- Tasa de 6% trimestral. Se paga con su interés al inicio de `t+1`.
- **Deja de ser una decisión del jugador.**

**7.5 Valores negociables**
- Son un depósito a 1 trimestre: se compran en `t` y vencen al inicio de `t+1` con el capital más el rendimiento.
- El rendimiento se reconoce en `t` como ingreso financiero gravado.
- No hay rescate anticipado.
- **Rendimiento: 1,2% trimestral (≈5% anual).**

**7.6 Emisión de acciones**
- Se emiten al precio de la acción del ciclo anterior (§11), con un descuento de colocación de 10% y un costo de emisión de 3%.
- El capital social aumenta en `n × valor nominal`. La diferencia neta va a capital adicional (prima de emisión).
- No se permite emitir por debajo del valor nominal.

**7.7 Dividendos**
- El monto debe ser ≤ a las utilidades retenidas positivas al cierre del ciclo anterior. Se pagan en `t`.
- Opcionalmente, una reserva legal de 10% de la utilidad hasta llegar al 20% del capital (Ley General de Sociedades). Desactivada por defecto.

**7.8 Impuesto a la renta**
- 30% sobre la utilidad tributaria, después de compensar las pérdidas arrastradas.
- Se paga en el mismo ciclo.
- Las pérdidas se arrastran sin límite de ciclos y compensan hasta el 100%. Ambos valores son configurables.

## 8. Orden de cálculo del ciclo (motor)

1. **Eventos de apertura**:
   - Llegan los materiales comprados en `t−1` y se activan los módulos comprados en `t−1`.
   - Se pagan el corto plazo, la emergencia y las cuotas de largo plazo.
   - Vencen los valores negociables.
2. **Finanzas de apertura**: nuevos préstamos, prepagos y emisión de acciones.
3. **Producción**: se respetan la capacidad y los materiales y se calcula el costeo.
4. **Mercado**, que es el único paso que acopla a todas las empresas: demanda, ventas, redistribución y demanda latente.
5. **Egresos del ciclo**: marketing, I+D, investigación, administrativos, almacenaje, compras de MP, módulos, compra de valores y dividendos.
6. **Resultados**: intereses, depreciación, capacidad ociosa e impuesto con el arrastre de pérdidas.
7. **Caja**: si queda por debajo de 0, se otorga el préstamo de emergencia.
8. **Balance**: se verifica `Activo = Pasivo + Patrimonio`. Si no cuadra, es un error del motor.
9. **Indicadores**, valoración de la acción, chequeo de quiebra y ranking.

## 9. Estados financieros

**Estado de Resultados**
- Ventas (A, B, total).
- − Costo de ventas = **Utilidad bruta**.
- − Gastos operativos (marketing, I+D, investigación de mercado, administrativos, almacenaje, capacidad ociosa) = **Utilidad operativa (EBIT)**.
- \+ Ingresos financieros − gastos financieros (corto plazo, largo plazo, emergencia) = **Utilidad antes de impuestos**.
- − Impuesto = **Utilidad neta**.
- El EBITDA se informa aparte: EBIT + depreciación total.

**Balance**
- **Activo corriente**: caja, valores negociables, rendimiento por cobrar, PT A y B, MP A y B.
- **Activo no corriente**: activo fijo bruto − depreciación acumulada.
- **Pasivo corriente**: préstamo de corto plazo, emergencia, intereses por pagar y porción corriente del largo plazo.
- **Pasivo no corriente**: deuda de largo plazo.
- **Patrimonio**: capital social, capital adicional, reserva legal y utilidades retenidas (incluye el resultado del ciclo).

**Flujo de caja**
- Método directo, separado en operación, inversión y financiamiento.

## 10. Indicadores por ciclo

| Grupo | Indicadores |
|---|---|
| Liquidez | Liquidez corriente, prueba ácida, capital de trabajo |
| Endeudamiento | Deuda/patrimonio, deuda/activo, cobertura de intereses (EBIT/intereses) |
| Rentabilidad | Margen bruto, margen operativo y margen neto; ROA, ROE, ROI acumulado |
| Operación | Utilización de la capacidad, costo unitario por producto, rotación y días de inventario, punto de equilibrio en unidades, margen de contribución unitario |
| Mercado | Participación por producto y por segmento, ventas perdidas por falta de stock |
| Bursátiles | Utilidad por acción (UPA), valor en libros por acción (VLA), precio de la acción, P/VL, dividendo por acción |

## 11. Valoración y ganador

- `VLA = Patrimonio / Acciones`.
- `ROE_anual` = suma de la utilidad neta de los últimos 4 ciclos / patrimonio promedio. Si hay menos de 4 ciclos, se anualiza.
- `P/VL = clamp(1 + s × (ROE_anual − ke) / ke; 0,3; 4)`, con `ke` (costo del capital) = 15% anual y `s` (sensibilidad) = 0,5.
  - Es un modelo de ingreso residual amortiguado: si el ROE es igual a `ke`, la acción vale su valor en libros.
  - Con `s = 1` equivale a `P/VL = ROE/ke`. Se amortigua porque en partidas cortas el ROE trimestral es ruidoso.
- `Precio = VLA × P/VL`.
- **Criterio ganador por defecto: retorno total al accionista (TSR)**, `TSR = (P_final + Σ dividendos por acción) / P_0 − 1`.
  - Premia la rentabilidad, el crecimiento del patrimonio y el reparto de dividendos.
  - No se distorsiona cuando una empresa emite acciones.
- El facilitador puede elegir otro criterio: `ROI = (Patrimonio_final + Σ dividendos − aportes) / aportes` o ROE acumulado.
- El desempate se decide por participación de mercado total.

## 12. Información disponible para el jugador

**Pública, en cada ciclo**
- Sus propios estados financieros e indicadores.
- Los índices económicos: el actual, el pronóstico del siguiente trimestre (±1%) y el pronóstico a un año (±4%).
- El precio de la acción y el ranking de todas las empresas, como en una bolsa.
- Las unidades totales vendidas en la industria por producto.

**Estudio de mercado (600)**
- El precio A y B de cada competidor.
- La participación de cada competidor por producto y por segmento.
- El gasto de marketing estimado de cada competidor (±10% de ruido).
- El ranking de calidad percibida.
- La demanda por segmento, la demanda insatisfecha total y el pronóstico del tamaño del mercado.

## 13. Quiebra

- **Alerta de insolvencia**: las pérdidas acumuladas superan 1/3 del capital social. Es el criterio de la Ley General del Sistema Concursal del Perú, art. 24.
- **Quiebra**, cuando ocurre cualquiera de estas dos situaciones:
  - El patrimonio queda negativo al cierre de un ciclo (insolvencia de balance).
  - La empresa usa el préstamo de emergencia 3 ciclos seguidos (no puede pagar sus obligaciones con regularidad).
- **Consecuencia**: la empresa **sale del juego**.
  - Deja de participar en el mercado y su demanda pasa a los competidores.
  - En el ranking queda detrás de todas las empresas activas. Entre empresas quebradas, queda más abajo la que quebró antes.

## 14. Índices económicos

- Toda la serie se genera al crear la partida, a partir de la semilla. Así los pronósticos tienen sentido.
- `E(t) = E(t−1) × (1 + μ + N(0; σe))`, con `μ` = 0,5% y `σe` = 2%.
- `E` afecta el tamaño del mercado (§4.1) y el peso de los segmentos.

## 15. Diferencias con el Excel (errores corregidos)

1. Las ventas en unidades estaban escritas a mano. Ahora salen del modelo de demanda de §4.
2. El interés de largo plazo se calculaba sobre 6.000 en el Estado de Resultados y sobre 1.005 en la hoja "Interés". Ahora sigue el cronograma francés.
3. El costo de ventas de B en el ciclo 0 sumaba el inventario final (`D11+D10`).
4. El inventario se valoraba con costos escritos a mano (12 y 21,6), y en el Balance del ciclo 1 se valoraba en unidades.
5. Los gastos administrativos eran `1,03 × unidades`. Ahora son fijos + 3% de las ventas.
6. El flujo de caja pagaba los materiales consumidos y no los comprados.
7. Las ventas no tenían tope de stock, así que el inventario podía quedar negativo.
8. Las fórmulas de la hoja "Inventario" para MP B apuntaban a filas equivocadas.
9. Los ciclos 0 y 1 estaban mezclados (préstamos e intereses en ciclos distintos).
10. La fila "EBITDA" estaba mal ubicada.
11. La renta de valores se restaba de la utilidad tributaria; ahora es un ingreso gravado.
12. El Balance no tenía pasivo ni patrimonio.

## 16. Parámetros por partida (`GameSettings`)

Todos los valores anteriores se configuran por partida. Los principales:

- `players`, `cycles`, `cycleDurationMinutes`, `seed`.
- `initialCash`, `initialCapacity`, `moduleUnits`, `moduleCostPerUnit`, `depreciationRate`.
- `materialCost{A,B}`, `laborCost`, `variableOverhead`, `capacityUsage{A,B}`, `initialMaterials{A,B}`.
- `baseQuality{A,B}`, `refPrice{A,B}`, `segments{weight, α, β, γ}`, `qualityDecay`, `marketingDecay`, `hq`, `hm`, `noiseSigma`.
- `marketGrowth`, `targetUtilization`, `marketElasticity`, `substitutionRate`, `latentDemandRate`.
- `adminFixed`, `adminVariableRate`, `holdingCost{PT,MP}`, `marketResearchCost`.
- `shortTermRate`, `emergencyRate`, `longTermAnnualRate`, `longTermQuarters`, `prepaymentPenalty`, `creditLimitMultiple`.
- `securitiesRate`, `taxRate`, `lossCarryForward{maxCycles, maxOffsetPct}`.
- `shareParValue`, `initialShares`, `issueDiscount`, `issueCost`, `costOfEquity`, `legalReserveEnabled`.
- `rankingMetric` (`TSR` | `ROI` | `ROE`), `bankruptcyPolicy`.

## 17. Plataforma

- **Acceso tipo Kahoot:**
  - Solo el facilitador tiene cuenta (email y contraseña, con JWT).
  - Los jugadores entran con el **PIN** de la partida y el nombre de su empresa, sin registrarse. Reciben un token de jugador que viaja en el header `x-player-token`.
- **Persistencia y avisos:**
  - MongoDB para los datos.
  - Redis + BullMQ para el cierre del ciclo cuando vence el tiempo.
  - socket.io para avisar en tiempo real a jugadores y facilitador.
- **Motor de simulación:** está en `src/modules/simulation/engine/`. Son funciones puras, deterministas (con semilla) y sin dependencias de Nest ni de Mongo.

## 18. Calibración (2026-10-04)

`npm run calibrate -- <ciclos> <semillas>` juega 5 estrategias tipo entre sí: balanceada, bajo costo, premium, crecimiento y pasiva.

**Tasas.** Las del Excel (50% anual a largo plazo, 9% trimestral a corto plazo, 11% de emergencia, 7% de valores) hacían que endeudarse nunca conviniera:
- La empresa rinde ≈ 22% anual sobre sus activos.
- Con deuda al 50%, cualquier expansión destruía valor y la estrategia premium ganaba el 100% de las partidas.

**Valores adoptados (configurables por partida):**
- Tasas: largo plazo 12% anual, corto plazo 3% trimestral, emergencia 6% trimestral, valores 1,2% trimestral, `ke` 15%.
- El segmento CALIDAD es más sensible al precio (`γ` = 1,6, `α` = 2,0).
- El producto B cuesta más fabricarlo (MOD 5, CIF 7).

**Resultado con 20 semillas** (después de amortiguar la valoración, `s = 0,5`):
- En 8 ciclos ganan premium 13, crecimiento 5 y balanceada 2.
- En 12 ciclos ganan crecimiento 13 y balanceada 7.
- Pasiva y bajo costo quedan últimas y no hay quiebras con un juego razonable.
- En partidas largas, invertir en capacidad a tiempo es lo que más rinde.

## 19. Empresas controladas por bots

El facilitador puede agregar bots en la sala de espera (`POST /v1/games/:id/bots`, con `{ count, strategy?, level }`).

- **Qué es un bot:** una empresa normal con las mismas reglas, estados financieros y ranking. La única diferencia es que el motor decide por ella al cerrar cada trimestre (`decideForBot`, en `bot.engine.ts`).
- **Validación:** sus decisiones pasan por la misma validación que las de los humanos.
- **Determinismo:** las decisiones son deterministas. Dependen de la semilla de la partida, el trimestre y la empresa.
- **Disponibilidad:** un bot siempre está listo. El cierre anticipado ("todos enviaron") solo espera a los humanos activos. Si la partida tiene solo bots, los trimestres cierran por tiempo o cuando el facilitador los fuerza (sirve como modo demo).

**Estrategias.** Si no se indica una, se reparten en rotación.

| Estrategia | Precio vs mercado | Mezcla A/B | Publicidad | I+D | Amplía planta |
|---|---|---|---|---|---|
| `BALANCED` | 100% / 100% | 50/50 | media | media | si la demanda supera 105% de su capacidad |
| `LOW_COST` | 92% / 93% | 62/38 | baja | baja | si la demanda supera 95% de su capacidad |
| `PREMIUM` | 105% / 115% | 35/65 | alta en B | alta en B | no |
| `GROWTH` | 95% / 96% | 50/50 | alta | media-alta | si la demanda supera 95% de su capacidad |

**Niveles:**

| Nivel | Comportamiento |
|---|---|
| `EASY` | Ruido de ±25% en cantidades, precios y gastos. Ignora la historia y los precios del mercado. No amplía planta ni gestiona la caja |
| `NORMAL` | Ruido de ±8%. Pronostica con la demanda del trimestre anterior más la tendencia y fija precios sobre el promedio del mercado. Financia ampliaciones con largo plazo y cubre faltas de caja con corto plazo |
| `HARD` | Sin ruido. Además ajusta precios (+4% si se quedó sin stock, −4% si le sobró inventario) e invierte la caja ociosa en valores |

**Calibración** (`npm run calibrate`, 20 semillas):
- **En 8 trimestres:** premium gana 11 veces, crecimiento 6 y balanceada 3. Pasiva y bajo costo nunca ganan.
- **En 12 trimestres:** crecimiento gana 11 y balanceada 9.
- **Niveles:** en las 4 estrategias el retorno promedio queda ordenado DIFÍCIL > NORMAL > FÁCIL.
- **Quiebras:** ningún bot quiebra.
