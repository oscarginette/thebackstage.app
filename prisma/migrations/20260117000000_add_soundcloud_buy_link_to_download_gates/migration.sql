-- Add enable_soundcloud_buy_link field to download_gates table
-- Enables automatic shopping cart buy link addition to SoundCloud tracks after OAuth
-- When enabled, after user authorizes SoundCloud OAuth, we programmatically update track's purchase_url
-- Shopping cart icon appears on SoundCloud track, redirecting to Download Gate URL

ALTER TABLE "download_gates"
ADD COLUMN "enable_soundcloud_buy_link" BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN "download_gates"."enable_soundcloud_buy_link" IS 'Enables automatic shopping cart buy link addition to SoundCloud tracks after OAuth. When enabled, after user authorizes SoundCloud OAuth, we programmatically update track''s purchase_url. Shopping cart icon appears on SoundCloud track, redirecting to Download Gate URL.';
