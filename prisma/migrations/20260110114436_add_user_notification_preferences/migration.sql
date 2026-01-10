-- Create user_notification_preferences table
CREATE TABLE user_notification_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_send_soundcloud BOOLEAN NOT NULL DEFAULT true,
  auto_send_spotify BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Add comments for documentation
COMMENT ON TABLE user_notification_preferences IS 'User preferences for automatic email notifications when new tracks are released';
COMMENT ON COLUMN user_notification_preferences.auto_send_soundcloud IS 'Whether to automatically email subscribers when new SoundCloud tracks are detected';
COMMENT ON COLUMN user_notification_preferences.auto_send_spotify IS 'Whether to automatically email subscribers when new Spotify tracks are detected';
