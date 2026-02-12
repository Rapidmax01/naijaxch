const EXCHANGE_DISPLAY_NAMES: Record<string, string> = {
  binance_p2p: 'Binance P2P',
  bybit_p2p: 'Bybit P2P',
  quidax: 'Quidax',
  luno: 'Luno',
  remitano: 'Remitano',
  patricia: 'Patricia',
  paxful: 'Paxful',
}

// Affiliate referral URLs — replace placeholder IDs with real ones
const EXCHANGE_REFERRAL_URLS: Record<string, string> = {
  binance_p2p: 'https://www.binance.com/en/register?ref=YOUR_BINANCE_ID',
  bybit_p2p: 'https://www.bybit.com/invite?ref=YOUR_BYBIT_ID',
  quidax: 'https://www.quidax.com/r/YOUR_QUIDAX_ID',
  luno: 'https://www.luno.com/invite/YOUR_LUNO_ID',
  remitano: 'https://remitano.com/btc/ng?ref=YOUR_REMITANO_ID',
  patricia: 'https://dashboard.patricia.com.ng/signup?ref=YOUR_PATRICIA_ID',
  paxful: 'https://paxful.com/register?ref=YOUR_PAXFUL_ID',
}

export function getExchangeDisplayName(exchange: string): string {
  return EXCHANGE_DISPLAY_NAMES[exchange] ?? exchange.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getExchangeReferralUrl(exchange: string): string | undefined {
  return EXCHANGE_REFERRAL_URLS[exchange]
}
