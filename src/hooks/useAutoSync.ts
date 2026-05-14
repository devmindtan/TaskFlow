import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useTaskStore } from '../store/taskStore'

const AUTO_SYNC_INTERVAL = 60  // seconds

export function useAutoSync() {
  const { sync, syncCountdown, setSyncCountdown, syncStatus } = useTaskStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const store = useTaskStore.getState()
      if (store.syncStatus === 'syncing') return

      const next = store.syncCountdown - 1
      if (next <= 0) {
        store.sync()
        store.setSyncCountdown(AUTO_SYNC_INTERVAL)
      } else {
        store.setSyncCountdown(next)
      }
    }, 1000)
  }

  useEffect(() => {
    startTimer()

    // Sync immediately when app comes to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        useTaskStore.getState().sync()
        setSyncCountdown(AUTO_SYNC_INTERVAL)
      }
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      sub.remove()
    }
  }, [])

  return { syncCountdown, syncStatus, sync }
}
