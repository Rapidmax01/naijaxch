/**
 * Pick the market-data source: the real NGX adapter when it's configured
 * (NGX_DATA_API_BASE + key — licensed delayed/EOD, G3), otherwise the fixture
 * source (placeholder data) so ingestion still runs in dev.
 */

import type { MarketDataSource } from './types';
import { FixtureMarketDataSource } from './fixture-source';
import { NgxMarketDataSource, ngxSourceConfigured } from './ngx-source';

export function selectMarketDataSource(): { source: MarketDataSource; name: string } {
  if (ngxSourceConfigured()) {
    return { source: new NgxMarketDataSource(), name: 'ngx' };
  }
  return { source: new FixtureMarketDataSource(), name: 'fixture' };
}
