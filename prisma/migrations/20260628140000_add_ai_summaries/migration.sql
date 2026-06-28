-- CreateTable
CREATE TABLE "ai_summaries" (
    "ticker" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("ticker")
);

-- AddForeignKey
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "companies"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;
