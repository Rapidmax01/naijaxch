-- Company disclosures / filings feed (proposal 0009).

CREATE TABLE "disclosure" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "disclosure_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "disclosure_ticker_source_url_key" ON "disclosure"("ticker", "source_url");
CREATE INDEX "disclosure_ticker_published_at_idx" ON "disclosure"("ticker", "published_at");

ALTER TABLE "disclosure"
    ADD CONSTRAINT "disclosure_ticker_fkey" FOREIGN KEY ("ticker")
    REFERENCES "companies"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;
