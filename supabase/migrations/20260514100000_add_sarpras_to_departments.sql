-- Add sarpras column to departments table
ALTER TABLE "public"."departments" 
ADD COLUMN IF NOT EXISTS "sarpras" text;

-- Add a comment to describe the column
COMMENT ON COLUMN "public"."departments"."sarpras" IS 'Stores structured JSON data for unit facilities (bangunan, alat, fasilitas) as text.';
