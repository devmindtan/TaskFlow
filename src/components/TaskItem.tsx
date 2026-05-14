import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { Task } from '../store/taskStore'

const PRIO_LABEL = { low: 'Thấp', med: 'Trung bình', high: 'Cao' }
const PRIO_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  low:  { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  med:  { bg: '#FAEEDA', text: '#BA7517', border: '#FAC775' },
  high: { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' },
}

type Props = {
  task: Task
  onToggle: () => void
  onDelete: () => void
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const prio = PRIO_COLOR[task.priority]

  const confirmDelete = () => {
    Alert.alert('Xoá task', `Xoá "${task.title}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: onDelete },
    ])
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <View style={styles.wrap}>
      {/* Checkbox */}
      <TouchableOpacity style={[styles.checkbox, task.done && styles.checkboxDone]} onPress={onToggle}>
        {task.done && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.body}>
        <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.desc} numberOfLines={1}>{task.description}</Text>
        ) : null}

        <View style={styles.meta}>
          {/* Priority badge */}
          <View style={[styles.badge, { backgroundColor: prio.bg, borderColor: prio.border }]}>
            <Text style={[styles.badgeText, { color: prio.text }]}>
              {PRIO_LABEL[task.priority]}
            </Text>
          </View>

          {/* Sync state */}
          <View style={[styles.badge, task.dirty ? styles.badgePending : styles.badgeSynced]}>
            <Text style={[styles.badgeText, task.dirty ? styles.badgeTextPending : styles.badgeTextSynced]}>
              {task.dirty ? '↑ Pending' : '✓ Synced'}
            </Text>
          </View>

          {/* Due date */}
          {task.dueDate ? (
            <Text style={styles.date}>⊙ {formatDate(task.dueDate)}</Text>
          ) : null}

          {/* Assignee */}
          {task.assignee ? (
            <Text style={styles.assignee}>@{task.assignee}</Text>
          ) : null}
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn} hitSlop={8}>
        <Text style={styles.deleteIcon}>⊗</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
    gap: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, marginTop: 2,
    borderWidth: 1.5, borderColor: '#CCCCCC',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxDone: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  checkmark: { fontSize: 11, color: '#FFF', fontWeight: '600' },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  titleDone: { textDecorationLine: 'line-through', color: '#AAAAAA' },
  desc: { fontSize: 12, color: '#888', marginTop: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5, alignItems: 'center' },
  badge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 10, borderWidth: 0.5,
  },
  badgeText: { fontSize: 10 },
  badgePending: { backgroundColor: '#F1EFE8', borderColor: '#D3D1C7' },
  badgeSynced:  { backgroundColor: '#E1F5EE', borderColor: '#9FE1CB' },
  badgeTextPending: { color: '#5F5E5A' },
  badgeTextSynced:  { color: '#0F6E56' },
  date:     { fontSize: 10, color: '#999' },
  assignee: { fontSize: 10, color: '#5F5E5A' },
  deleteBtn: { paddingTop: 2, flexShrink: 0 },
  deleteIcon: { fontSize: 18, color: '#D0D0D0' },
})
