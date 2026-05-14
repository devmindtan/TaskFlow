import * as Crypto from 'expo-crypto'
import AsyncStorage from 'expo-sqlite/kv-store'
import { create } from 'zustand'
import {
  getAllTasks,
  LocalTask,
  softDeleteTask,
  upsertTask,
} from '../db/localDB'
import { SyncResult, syncTasks } from '../services/syncService'


export type Priority = 'low' | 'med' | 'high'

export type Task = {
  id: string
  deviceId: string
  title: string
  description: string | null
  priority: Priority
  dueDate: string | null
  assignee: string | null
  done: boolean
  deleted: boolean
  createdAt: string
  updatedAt: string
  dirty: boolean
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface TaskStore {
  tasks: Task[]
  deviceId: string
  syncStatus: SyncStatus
  lastSyncAt: string | null
  lastSyncResult: SyncResult | null
  syncCountdown: number          // seconds until next auto-sync

  // init
  init: () => Promise<void>

  // task actions
  createTask: (input: {
    title: string
    description?: string
    priority?: Priority
    dueDate?: string
    assignee?: string
  }) => void
  toggleDone: (id: string) => void
  deleteTask: (id: string) => void
  refreshTasks: () => void

  // sync
  sync: () => Promise<void>
  setSyncCountdown: (n: number) => void
}

// ── helpers ────────────────────────────────────────────────────────────
function toTask(r: LocalTask): Task {
  return {
    id:          r.id,
    deviceId:    r.device_id,
    title:       r.title,
    description: r.description,
    priority:    r.priority,
    dueDate:     r.due_date,
    assignee:    r.assignee,
    done:        r.done === 1,
    deleted:     r.deleted === 1,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
    dirty:       r.dirty === 1,
  }
}

// ── store ──────────────────────────────────────────────────────────────
export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks:          [],
  deviceId:       '',
  syncStatus:     'idle',
  lastSyncAt:     null,
  lastSyncResult: null,
  syncCountdown:  60,

  init: async () => {
    // Load or generate stable device ID
    let id = await AsyncStorage.getItem('device_id')
    if (!id) {
      id = await Crypto.randomUUID()
      await AsyncStorage.setItem('device_id', id)
    }
    const lastSync = await AsyncStorage.getItem('last_sync_at')
    set({ deviceId: id, lastSyncAt: lastSync })
    get().refreshTasks()
  },

  refreshTasks: () => {
    const rows = getAllTasks()
    set({ tasks: rows.map(toTask) })
  },

  createTask: ({ title, description, priority = 'med', dueDate, assignee }) => {
    const { deviceId } = get()
    const now = new Date().toISOString()
    const id  = Crypto.randomUUID()          // sync call, fine for IDs
    const row: Omit<LocalTask, 'dirty'> = {
      id,
      device_id:   deviceId,
      title,
      description: description ?? null,
      priority,
      due_date:    dueDate ?? null,
      assignee:    assignee ?? null,
      done:        0,
      deleted:     0,
      created_at:  now,
      updated_at:  now,
    }
    upsertTask(row, 1)
    get().refreshTasks()
  },

  toggleDone: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const now = new Date().toISOString()
    upsertTask(
      {
        id,
        device_id:   task.deviceId,
        title:       task.title,
        description: task.description,
        priority:    task.priority,
        due_date:    task.dueDate,
        assignee:    task.assignee,
        done:        task.done ? 0 : 1,
        deleted:     0,
        created_at:  task.createdAt,
        updated_at:  now,
      },
      1
    )
    get().refreshTasks()
  },

  deleteTask: (id) => {
    softDeleteTask(id)
    get().refreshTasks()
  },

  sync: async () => {
    if (get().syncStatus === 'syncing') return
    set({ syncStatus: 'syncing' })
    try {
      const { deviceId, lastSyncAt } = get()
      const result = await syncTasks(deviceId, lastSyncAt)
      const now = new Date().toISOString()
      await AsyncStorage.setItem('last_sync_at', now)
      set({
        syncStatus:     result.errors.length > 0 ? 'error' : 'success',
        lastSyncAt:     now,
        lastSyncResult: result,
        syncCountdown:  60,
      })
      get().refreshTasks()
    } catch (e: any) {
      set({
        syncStatus:     'error',
        lastSyncResult: { pushed: 0, pulled: 0, errors: [e?.message ?? 'Unknown error'] },
      })
    }
  },

  setSyncCountdown: (n) => set({ syncCountdown: n }),
}))
