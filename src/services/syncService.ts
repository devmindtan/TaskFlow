import { supabase, TaskRow } from './supabase'
import {
  getDirtyTasks,
  upsertTask,
  markTaskClean,
  LocalTask,
} from '../db/localDB'

export type SyncResult = {
  pushed: number
  pulled: number
  errors: string[]
}

/**
 * Full bidirectional sync:
 * 1. Push all dirty local tasks → Supabase (upsert)
 * 2. Pull all tasks updated after lastSyncAt from Supabase → local SQLite
 */
export async function syncTasks(
  deviceId: string,
  lastSyncAt: string | null
): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] }

  // ── 1. PUSH dirty local tasks ──────────────────────────────────────
  const dirty = getDirtyTasks()

  if (dirty.length > 0) {
    const rows: TaskRow[] = dirty.map((t) => ({
      id:          t.id,
      device_id:   t.device_id,
      title:       t.title,
      description: t.description,
      priority:    t.priority,
      due_date:    t.due_date,
      assignee:    t.assignee,
      done:        t.done === 1,
      deleted:     t.deleted === 1,
      created_at:  t.created_at,
      updated_at:  t.updated_at,
    }))

    const { error } = await supabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id' })

    if (error) {
      result.errors.push(`Push error: ${error.message}`)
    } else {
      dirty.forEach((t) => markTaskClean(t.id))
      result.pushed = dirty.length
    }
  }

  // ── 2. PULL remote tasks updated since last sync ───────────────────
  let query = supabase
    .from('tasks')
    .select('*')
    .neq('device_id', deviceId)          // skip rows we own

  if (lastSyncAt) {
    query = query.gt('updated_at', lastSyncAt)
  }

  const { data, error: pullError } = await query

  if (pullError) {
    result.errors.push(`Pull error: ${pullError.message}`)
  } else if (data && data.length > 0) {
    for (const row of data as TaskRow[]) {
      const local: Omit<LocalTask, 'dirty'> = {
        id:          row.id,
        device_id:   row.device_id,
        title:       row.title,
        description: row.description,
        priority:    row.priority,
        due_date:    row.due_date,
        assignee:    row.assignee,
        done:        row.done ? 1 : 0,
        deleted:     row.deleted ? 1 : 0,
        created_at:  row.created_at,
        updated_at:  row.updated_at,
      }
      upsertTask(local, 0)   // dirty=0 because it came from server
    }
    result.pulled = data.length
  }

  return result
}
