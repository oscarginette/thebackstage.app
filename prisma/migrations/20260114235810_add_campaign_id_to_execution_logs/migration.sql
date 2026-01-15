-- AlterTable
ALTER TABLE "execution_logs" ADD COLUMN "campaign_id" INTEGER;

-- CreateIndex
CREATE INDEX "idx_execution_logs_campaign_id" ON "execution_logs"("campaign_id");

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
