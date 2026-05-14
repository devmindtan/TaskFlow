import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useTaskStore, Priority } from '../store/taskStore'
import { initDB } from '../db/localDB'
import TaskItem from '../components/TaskItem'
import SyncBar from '../components/SyncBar'
import { useAutoSync } from '../hooks/useAutoSync'

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Thấp',      value: 'low'  },
  { label: 'Trung bình', value: 'med' },
  { label: 'Cao',       value: 'high' },
]

const PRIO_ACTIVE: Record<Priority, object> = {
  low:  { backgroundColor: '#EAF3DE', borderColor: '#3B6D11' },
  med:  { backgroundColor: '#FAEEDA', borderColor: '#BA7517' },
  high: { backgroundColor: '#FCEBEB', borderColor: '#A32D2D' },
}
const PRIO_TEXT: Record<Priority, object> = {
  low:  { color: '#3B6D11' },
  med:  { color: '#BA7517' },
  high: { color: '#A32D2D' },
}

export default function TaskScreen() {
  const { tasks, createTask, toggleDone, deleteTask, init, syncStatus } = useTaskStore()
  const { sync } = useAutoSync()

  // Form state
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [dueDate,  setDueDate]  = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('med')

  useEffect(() => {
    initDB()
    init()
  }, [])

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Thiếu tên task', 'Vui lòng nhập tên task.')
      return
    }
    createTask({
      title:       title.trim(),
      description: desc.trim() || undefined,
      priority,
      dueDate:     dueDate || undefined,
      assignee:    assignee.trim() || undefined,
    })
    setTitle('')
    setDesc('')
    setDueDate('')
    setAssignee('')
    setPriority('med')
  }

  const pendingCount = tasks.filter((t) => t.dirty).length
  const doneCount    = tasks.filter((t) => t.done).length

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Task Manager</Text>
          <Text style={s.headerSub}>{doneCount}/{tasks.length} hoàn thành</Text>
        </View>
        <TouchableOpacity
          style={[s.syncBtn, syncStatus === 'syncing' && s.syncBtnLoading]}
          onPress={sync}
          activeOpacity={0.75}
        >
          {syncStatus === 'syncing' ? (
            <ActivityIndicator size="small" color="#555" />
          ) : (
            <Text style={s.syncBtnIcon}>↻</Text>
          )}
          <Text style={s.syncBtnLabel}>
            {syncStatus === 'syncing' ? 'Syncing' : `Sync${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Sync status strip ── */}
      <SyncBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* ── Create form ── */}
          <View style={s.formSection}>
            <Text style={s.sectionLabel}>Tạo task mới</Text>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Tên task *</Text>
              <TextInput
                style={s.input}
                placeholder="Nhập tên task..."
                placeholderTextColor="#AAAAAA"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Mô tả</Text>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="Mô tả chi tiết (tuỳ chọn)..."
                placeholderTextColor="#AAAAAA"
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Hạn chót</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAAAAA"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Người nhận</Text>
                <TextInput
                  style={s.input}
                  placeholder="@tên..."
                  placeholderTextColor="#AAAAAA"
                  value={assignee}
                  onChangeText={setAssignee}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Mức độ ưu tiên</Text>
              <View style={s.prioRow}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      s.prioChip,
                      priority === opt.value && PRIO_ACTIVE[opt.value],
                    ]}
                    onPress={() => setPriority(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.prioChipText,
                        priority === opt.value && PRIO_TEXT[opt.value],
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.createBtn} onPress={handleCreate} activeOpacity={0.85}>
              <Text style={s.createBtnText}>+ Tạo task</Text>
            </TouchableOpacity>
          </View>

          {/* ── Task list ── */}
          <View style={s.listSection}>
            <View style={s.listHeader}>
              <Text style={s.sectionLabel}>Danh sách task</Text>
              <View style={s.countBadge}>
                <Text style={s.countText}>{tasks.length} task</Text>
              </View>
            </View>

            {tasks.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>◫</Text>
                <Text style={s.emptyText}>Chưa có task nào</Text>
              </View>
            ) : (
              tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleDone(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#EBEBEB',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  headerSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 0.5, borderColor: '#DDDDDD',
    borderRadius: 8, backgroundColor: '#FAFAFA',
  },
  syncBtnLoading: { opacity: 0.7 },
  syncBtnIcon:  { fontSize: 14, color: '#555' },
  syncBtnLabel: { fontSize: 12, color: '#555' },

  formSection:  { padding: 18, borderBottomWidth: 6, borderBottomColor: '#F5F5F0' },
  sectionLabel: { fontSize: 11, color: '#AAAAAA', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  field:        { marginBottom: 10 },
  fieldLabel:   { fontSize: 11, color: '#888', marginBottom: 4 },
  input: {
    borderWidth: 0.5, borderColor: '#DDDDDD',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#1A1A1A', backgroundColor: '#FAFAFA',
  },
  textarea: { height: 68, textAlignVertical: 'top', paddingTop: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  prioRow: { flexDirection: 'row', gap: 8 },
  prioChip: {
    flex: 1, paddingVertical: 7, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#DDDDDD', borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  prioChipText: { fontSize: 12, color: '#888' },
  createBtn: {
    marginTop: 6, backgroundColor: '#1A1A1A',
    borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },

  listSection: { padding: 18 },
  listHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  countBadge:  { backgroundColor: '#F1EFE8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:   { fontSize: 11, color: '#5F5E5A' },
  empty:       { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyIcon:   { fontSize: 32, color: '#DDD' },
  emptyText:   { fontSize: 13, color: '#CCCCCC' },
})
