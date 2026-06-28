-- TimescaleDB setup for the daily price series.
-- Run AFTER `prisma migrate` has created the relational tables, then run the
-- seed. Converting raw_prices to a hypertable partitions it by `date` for fast
-- windowed reads as history grows.
--
-- The raw_prices primary key is (ticker, date) and includes the partitioning
-- column `date`, satisfying TimescaleDB's hypertable constraint.

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable(
  'raw_prices',
  'date',
  if_not_exists => TRUE,
  migrate_data  => TRUE
);
