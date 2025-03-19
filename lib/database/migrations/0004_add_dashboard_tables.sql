-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  show_recently_viewed BOOLEAN NOT NULL DEFAULT true,
  show_favorites BOOLEAN NOT NULL DEFAULT true,
  show_downloads BOOLEAN NOT NULL DEFAULT true,
  show_ratings BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create server_views table
CREATE TABLE IF NOT EXISTS server_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  server_id TEXT NOT NULL REFERENCES servers(id),
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create server_favorites table
CREATE TABLE IF NOT EXISTS server_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  server_id TEXT NOT NULL REFERENCES servers(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create server_downloads table
CREATE TABLE IF NOT EXISTS server_downloads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  server_id TEXT NOT NULL REFERENCES servers(id),
  downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_server_views_user_id ON server_views(user_id);
CREATE INDEX IF NOT EXISTS idx_server_views_server_id ON server_views(server_id);
CREATE INDEX IF NOT EXISTS idx_server_views_viewed_at ON server_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_server_favorites_user_id ON server_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_server_favorites_server_id ON server_favorites(server_id);

CREATE INDEX IF NOT EXISTS idx_server_downloads_user_id ON server_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_server_downloads_server_id ON server_downloads(server_id);
CREATE INDEX IF NOT EXISTS idx_server_downloads_downloaded_at ON server_downloads(downloaded_at); 