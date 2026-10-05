// Plain-language explanations shown in help tips; keep them short and practical
export const HELP = {
  productionUnits:
    'Cuántas unidades fabricas este trimestre. Cada unidad usa 1 de materia prima y 1 de capacidad de planta. Lo que fabriques se puede vender en este mismo trimestre.',
  materialPurchases:
    'La materia prima que compras HOY llega el PRÓXIMO trimestre. Pide lo que necesitarás para producir la siguiente vez.',
  capacityModules:
    'Cada módulo agrega capacidad a tu planta, pero entra en operación el próximo trimestre. Cuesta caro y se deprecia: amplía solo si te quedas corto de producción.',
  price:
    'El precio comparado con el de tus competidores. Más barato atrae a quienes buscan precio; más caro te deja más margen por unidad. Tu costo variable es el piso.',
  advertising:
    'La publicidad aumenta tu atractivo. Su efecto se acumula, pero la mitad se olvida cada trimestre, y gastar el doble no rinde el doble.',
  marketResearch:
    'Un estudio de mercado te muestra los precios, la participación y el gasto estimado de tus competidores, y el pronóstico de la demanda.',
  quality:
    'Invertir en I+D mejora la calidad percibida. A los clientes que buscan calidad les importa mucho; la mejora se desgasta un 25% por trimestre si dejas de invertir.',
  shortTermLoan:
    'Dinero disponible ya, que devuelves completo (más intereses) al inicio del próximo trimestre. Úsalo para cubrir baches de caja.',
  longTermLoan:
    'Préstamo a 5 años con cuota fija (sistema francés). Ideal para financiar ampliaciones de planta.',
  prepayment:
    'Adelanta el pago de tu deuda de largo plazo. Puedes reducir la cuota (mismo plazo) o reducir el plazo (misma cuota).',
  sharesToIssue:
    'Vender acciones nuevas trae dinero sin deuda, pero se reparte la empresa entre más accionistas. Se emiten al precio de mercado con un descuento.',
  dividends:
    'Reparte utilidades a tus accionistas. Suben el retorno al accionista (TSR), pero sale caja de la empresa.',
  securities:
    'Invierte la caja que te sobra en valores de corto plazo: los recuperas con un rendimiento el próximo trimestre.',
  emergencyLoan:
    'Si terminas el trimestre con caja negativa, el banco te presta automáticamente a una tasa alta. Tres veces seguidas = quiebra.',
  tsr: 'Retorno total al accionista: cuánto subió el precio de tu acción más los dividendos pagados, desde el inicio.',
  sharePrice:
    'El precio de tu acción se basa en tu patrimonio por acción, ajustado por qué tan rentable eres (ROE) frente al 15% que esperan los inversionistas.',
  valuation:
    'Cómo se valora tu inventario. Promedio ponderado mezcla los costos; PEPS (FIFO) vende primero lo más antiguo. Es una decisión contable que no puedes cambiar después.',
} as const

export const TUTORIAL_SLIDES = [
  {
    emoji: '🏢',
    title: 'Diriges una empresa',
    text: 'Fabricas dos productos: A (económico) y B (premium). Compites contra las demás empresas de la sala por los mismos clientes.',
  },
  {
    emoji: '🔁',
    title: 'Cada trimestre decides',
    text: 'Cuánto producir, a qué precio vender, cuánto invertir en publicidad y calidad, y cómo financiarte. Cuando todos envían (o se acaba el tiempo), el mercado se resuelve.',
  },
  {
    emoji: '🛒',
    title: 'Los clientes eligen',
    text: 'Unos buscan precio y otros calidad. Tu atractivo depende de tu precio frente al resto, tu calidad y tu publicidad. Si te quedas sin stock, tus clientes se van con la competencia.',
  },
  {
    emoji: '💵',
    title: 'Cuida tu caja',
    text: 'Si terminas un trimestre sin dinero, el banco te presta caro. Si pasa tres veces seguidas, quiebras y sales del juego.',
  },
  {
    emoji: '🏆',
    title: 'Gana el mejor retorno',
    text: 'Gana quien entregue más valor a sus accionistas: el precio de la acción más los dividendos. Utilidades constantes y buen uso del capital suben tu acción.',
  },
] as const

export const CASH_CONCEPTS: Record<string, string> = {
  salesA: 'Ventas A',
  salesB: 'Ventas B',
  shortTermLoanRepayment: 'Pago préstamo corto plazo',
  shortTermInterestPaid: 'Intereses corto plazo',
  emergencyLoanRepayment: 'Pago préstamo de emergencia',
  emergencyInterestPaid: 'Intereses de emergencia',
  longTermInterestPaid: 'Intereses largo plazo',
  longTermLoanRepayment: 'Amortización largo plazo',
  securitiesRedemption: 'Rescate de valores',
  securitiesYieldCollected: 'Rendimiento de valores',
  longTermPrepayment: 'Prepago largo plazo',
  prepaymentPenaltyPaid: 'Penalidad por prepago',
  shortTermLoan: 'Préstamo corto plazo',
  longTermLoan: 'Préstamo largo plazo',
  shareIssue: 'Emisión de acciones',
  shareIssueCost: 'Costo de emisión',
  laborCostA: 'Mano de obra A',
  laborCostB: 'Mano de obra B',
  manufacturingOverheadA: 'Gastos de fabricación A',
  manufacturingOverheadB: 'Gastos de fabricación B',
  marketing: 'Publicidad',
  qualityImprovement: 'Mejora de calidad',
  marketResearch: 'Estudio de mercado',
  administrative: 'Gastos administrativos',
  holding: 'Almacenaje',
  materialPurchasesA: 'Compra materia prima A',
  materialPurchasesB: 'Compra materia prima B',
  capacityExpansion: 'Ampliación de planta',
  dividends: 'Dividendos',
  securitiesPurchase: 'Compra de valores',
  incomeTax: 'Impuesto a la renta',
  emergencyLoan: 'Préstamo de emergencia',
}
