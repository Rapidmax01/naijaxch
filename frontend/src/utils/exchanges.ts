const EXCHANGE_DISPLAY_NAMES: Record<string, string> = {
  binance_p2p: 'Binance P2P',
  bybit_p2p: 'Bybit P2P',
  quidax: 'Quidax',
  luno: 'Luno',
  remitano: 'Remitano',
  patricia: 'Patricia',
  paxful: 'Paxful',
}

export function getExchangeDisplayName(exchange: string): string {
  return EXCHANGE_DISPLAY_NAMES[exchange] ?? exchange.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
