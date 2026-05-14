import React from 'react'
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAutoSync } from '../hooks/useAutoSync'
import { useTaskStore } from '../store/taskStore'

export default function SyncBar() {
  const tasks = useTaskStore((s) => s.tasks)
  const lastSyncResult = useTaskStore((s) => s.lastSyncResult)
  const { syncStatus, syncCountdown, sync } = useAutoSync()

  const pendingCount = tasks.filter((t) => t.dirty).length
  const spinAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (syncStatus === 'syncing') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    } else {
      spinAnim.stopAnimation()
      spinAnim.setValue(0)
    }
  }, [syncStatus])

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const isOk = syncStatus === 'success' && pendingCount === 0
  const isErr = syncStatus === 'error'
  const isSyncing = syncStatus === 'syncing'

  const barStyle = isErr
    ? styles.barError
    : isOk
    ? styles.barOk
    : styles.barPending

  const dotStyle = isErr
    ? styles.dotError
    : isOk
    ? styles.dotOk
    : styles.dotPending

  const message = isSyncing
    ? 'Đang đồng bộ...'
    : isErr
    ? `Lỗi: ${lastSyncResult?.errors[0] ?? 'Không thể kết nối'}`
    : isOk
    ? 'Tất cả đã đồng bộ'
    : `${pendingCount} task chưa sync · tự sync sau ${syncCountdown}s`

  return (
    <TouchableOpacity style={[styles.bar, barStyle]} onPress={sync} activeOpacity={0.8}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={[styles.text, isErr && styles.textError, isOk && styles.textOk]}>
        {message}
      </Text>
      <Animated.Text style={[styles.icon, { transform: [{ rotate: spin }] }]}>
        ↻
      </Animated.Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    gap: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0D0',
  },
  barPending: { backgroundColor: '#FAEEDA' },
  barOk:      { backgroundColor: '#EAF3DE' },
  barError:   { backgroundColor: '#FCEBEB' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotPending: { backgroundColor: '#BA7517' },
  dotOk:      { backgroundColor: '#3B6D11' },
  dotError:   { backgroundColor: '#A32D2D' },
  text: { flex: 1, fontSize: 11, color: '#BA7517' },
  textOk:    { color: '#3B6D11' },
  textError: { color: '#A32D2D' },
  icon: { fontSize: 14, color: '#888' },
})
