-- AlterTable
ALTER TABLE "public"."DatePlan" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."DatePlan" ADD CONSTRAINT "DatePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
