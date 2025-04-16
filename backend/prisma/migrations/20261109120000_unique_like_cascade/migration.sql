-- Keep one like per (profile, member) before adding the unique index.
DELETE FROM "Like" a
USING "Like" b
WHERE a."profileId" = b."profileId"
  AND a."likedById" = b."likedById"
  AND a."id" > b."id";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_likedById_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Like_profileId_likedById_key" ON "Like"("profileId", "likedById");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_likedById_fkey" FOREIGN KEY ("likedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
