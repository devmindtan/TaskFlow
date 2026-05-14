import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('tasks.db')

export type LocalTask = {
  id: string
  device_id: string
  title: string
  description: string | null
  priority: 'low' | 'med' | 'high'
  due_date: string | null
  assignee: string | null
  done: 0 | 1
  deleted: 0 | 1
  created_at: string
  updated_at: string
  dirty: 0 | 1   // 1 = needs sync to Supabase
}

export function initDB() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      device_id   TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      priority    TEXT DEFAULT 'med',
      due_date    TEXT,
      assignee    TEXT,
      done        INTEGER DEFAULT 0,
      deleted     INTEGER DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      dirty       INTEGER DEFAULT 1
    );
  `)
}

export function getAllTasks(): LocalTask[] {
  return db.getAllSync<LocalTask>(
    `SELECT * FROM tasks WHERE deleted = 0 ORDER BY created_at DESC`
  )
}

export function getDirtyTasks(): LocalTask[] {
  return db.getAllSync<LocalTask>(`SELECT * FROM tasks WHERE dirty = 1`)
}

export function upsertTask(task: Omit<LocalTask, 'dirty'>, dirty: 0 | 1 = 1) {
  db.runSync(
    `INSERT INTO tasks (id, device_id, title, description, priority, due_date, assignee,
       done, deleted, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title       = excluded.title,
       description = excluded.description,
       priority    = excluded.priority,
       due_date    = excluded.due_date,
       assignee    = excluded.assignee,
       done        = excluded.done,
       deleted     = excluded.deleted,
       updated_at  = excluded.updated_at,
       dirty       = excluded.dirty`,
    task.id, task.device_id, task.title, task.description ?? null,
    task.priority, task.due_date ?? null, task.assignee ?? null,
    task.done, task.deleted, task.created_at, task.updated_at, dirty
  )
}

export function markTaskClean(id: string) {
  db.runSync(`UPDATE tasks SET dirty = 0 WHERE id = ?`, id)
}

export function markTaskDirty(id: string) {
  const now = new Date().toISOString()
  db.runSync(`UPDATE tasks SET dirty = 1, updated_at = ? WHERE id = ?`, now, id)
}

export function softDeleteTask(id: string) {
  const now = new Date().toISOString()
  db.runSync(
    `UPDATE tasks SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?`,
    now, id
  )
}
