-- CreateEnum
CREATE TYPE "public"."PlaceCategory" AS ENUM ('ARTSY', 'FOODIE', 'ADVENTUROUS', 'RELAXING', 'ROMANTIC', 'SPORTY', 'ENTERTAINMENT');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('MAIN_ACTIVITY', 'DINNER', 'DESSERT', 'DRINKS', 'COFFEE');

-- CreateTable
CREATE TABLE "public"."DatePlan" (
    "id" SERIAL NOT NULL,
    "theme" "public"."PlaceCategory" NOT NULL,
    "budget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DatePlanStep" (
    "id" SERIAL NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "datePlanId" INTEGER NOT NULL,
    "placeId" INTEGER NOT NULL,

    CONSTRAINT "DatePlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CuratedPlace" (
    "id" SERIAL NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "category" "public"."PlaceCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuratedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CuratedPlaceExtension" (
    "id" SERIAL NOT NULL,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "boostedRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "placeId" INTEGER NOT NULL,

    CONSTRAINT "CuratedPlaceExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CuratedPlaceToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CuratedPlaceToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanStep_datePlanId_stepNumber_key" ON "public"."DatePlanStep"("datePlanId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CuratedPlace_googlePlaceId_key" ON "public"."CuratedPlace"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CuratedPlaceExtension_placeId_key" ON "public"."CuratedPlaceExtension"("placeId");

-- CreateIndex
CREATE INDEX "_CuratedPlaceToUser_B_index" ON "public"."_CuratedPlaceToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."DatePlanStep" ADD CONSTRAINT "DatePlanStep_datePlanId_fkey" FOREIGN KEY ("datePlanId") REFERENCES "public"."DatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatePlanStep" ADD CONSTRAINT "DatePlanStep_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."CuratedPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CuratedPlaceExtension" ADD CONSTRAINT "CuratedPlaceExtension_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."CuratedPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CuratedPlaceToUser" ADD CONSTRAINT "_CuratedPlaceToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CuratedPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CuratedPlaceToUser" ADD CONSTRAINT "_CuratedPlaceToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
