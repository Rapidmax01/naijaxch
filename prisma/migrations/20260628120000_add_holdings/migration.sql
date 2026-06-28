-- CreateTable
CREATE TABLE "holdings" (
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("user_id","ticker")
);

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
