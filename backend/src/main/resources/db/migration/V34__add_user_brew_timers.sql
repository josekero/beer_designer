CREATE TABLE user_timer_settings (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_brew_timers (
  user_id UUID NOT NULL REFERENCES user_timer_settings(user_id) ON DELETE CASCADE,
  timer_id TEXT NOT NULL,
  position SMALLINT NOT NULL CHECK (position BETWEEN 0 AND 2),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  mode TEXT NOT NULL CHECK (mode IN ('countdown', 'stopwatch')),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 0 AND 359999),
  display_seconds INTEGER NOT NULL CHECK (display_seconds BETWEEN 0 AND 359999),
  anchor_seconds INTEGER NOT NULL CHECK (anchor_seconds BETWEEN 0 AND 359999),
  anchor_epoch_ms BIGINT,
  running BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, timer_id),
  UNIQUE (user_id, position)
);

CREATE INDEX idx_user_brew_timers_order ON user_brew_timers(user_id, position);
