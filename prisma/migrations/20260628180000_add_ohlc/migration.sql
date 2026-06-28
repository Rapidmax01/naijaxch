-- Add OHLC to raw_prices for the candlestick view.
-- Added NOT NULL with a transient default so existing rows are valid; the
-- default is then dropped to match the schema (the seed repopulates real OHLC).
ALTER TABLE "raw_prices" ADD COLUMN "open" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "raw_prices" ADD COLUMN "high" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "raw_prices" ADD COLUMN "low"  DECIMAL(18,4) NOT NULL DEFAULT 0;

ALTER TABLE "raw_prices" ALTER COLUMN "open" DROP DEFAULT;
ALTER TABLE "raw_prices" ALTER COLUMN "high" DROP DEFAULT;
ALTER TABLE "raw_prices" ALTER COLUMN "low"  DROP DEFAULT;
