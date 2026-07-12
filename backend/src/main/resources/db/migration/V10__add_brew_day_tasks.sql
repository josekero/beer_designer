CREATE TABLE brew_day_tasks (
  id BIGSERIAL PRIMARY KEY,
  brew_day_id TEXT NOT NULL REFERENCES brew_days(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'tarea',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_brew_day_tasks_date ON brew_day_tasks(task_date);
