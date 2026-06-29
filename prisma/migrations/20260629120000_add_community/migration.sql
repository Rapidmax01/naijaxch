-- Community layer (proposal 0008): per-company discussion + reports + admin flag.

-- Admin flag for moderation.
ALTER TABLE "users" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- Posts.
CREATE TABLE "community_post" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    CONSTRAINT "community_post_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "community_post_ticker_created_at_idx" ON "community_post"("ticker", "created_at");

ALTER TABLE "community_post"
    ADD CONSTRAINT "community_post_ticker_fkey" FOREIGN KEY ("ticker")
    REFERENCES "companies"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_post"
    ADD CONSTRAINT "community_post_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reports (one per user per post).
CREATE TABLE "post_report" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_report_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "post_report_post_id_reporter_id_key" ON "post_report"("post_id", "reporter_id");
CREATE INDEX "post_report_status_idx" ON "post_report"("status");

ALTER TABLE "post_report"
    ADD CONSTRAINT "post_report_post_id_fkey" FOREIGN KEY ("post_id")
    REFERENCES "community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_report"
    ADD CONSTRAINT "post_report_reporter_id_fkey" FOREIGN KEY ("reporter_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
