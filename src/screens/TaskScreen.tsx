import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import SyncBar from '../components/SyncBar';
import TaskItem from '../components/TaskItem';
import { initDB } from '../db/localDB';
import { useAutoSync } from '../hooks/useAutoSync';
import { Priority, useTaskStore } from '../store/taskStore';

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Thấp', value: 'low' },
  { label: 'Trung bình', value: 'med' },
  { label: 'Cao', value: 'high' },
]

const PRIO_ACTIVE: Record<Priority, object> = {
  low: { backgroundColor: '#EAF3DE', borderColor: '#3B6D11' },
  med: { backgroundColor: '#FAEEDA', borderColor: '#BA7517' },
  high: { backgroundColor: '#FCEBEB', borderColor: '#A32D2D' },
}
const PRIO_TEXT: Record<Priority, object> = {
  low: { color: '#3B6D11' },
  med: { color: '#BA7517' },
  high: { color: '#A32D2D' },
}

/** Format Date → "DD/MM/YYYY" để hiển thị */
function formatDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

/** Format Date → "YYYY-MM-DD" để lưu vào store */
function formatISO(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export default function TaskScreen() {
  const { tasks, createTask, toggleDone, deleteTask, init, syncStatus } = useTaskStore()
  const { sync } = useAutoSync()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('med')

  // date picker visibility
  const [showPicker, setShowPicker] = useState(false)
  // tempDate giữ giá trị tạm khi đang kéo picker (iOS)
  const [tempDate, setTempDate] = useState<Date>(new Date())

  useEffect(() => {
    initDB()
    init()
  }, [init])

  // ── Date picker handlers ──────────────────────────────────────────

  const openPicker = () => {
    setTempDate(dueDate ?? new Date())
    setShowPicker(true)
  }

  const clearDate = () => setDueDate(null)

  /** Android: onChange fires on confirm or dismiss */
  const onAndroidChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false)
    if (selected) setDueDate(selected)
  }

  /** iOS: onChange fires on every scroll — chỉ lưu tạm */
  const onIOSChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected)
  }

  const confirmIOS = () => {
    setDueDate(tempDate)
    setShowPicker(false)
  }

  const cancelIOS = () => setShowPicker(false)

  // ── Create task ───────────────────────────────────────────────────

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Thiếu tên task', 'Vui lòng nhập tên task.')
      return
    }
    createTask({
      title: title.trim(),
      description: desc.trim() || undefined,
      priority,
      dueDate: dueDate ? formatISO(dueDate) : undefined,
      assignee: assignee.trim() || undefined,
    })
    setTitle('')
    setDesc('')
    setDueDate(null)
    setAssignee('')
    setPriority('med')
  }

  const pendingCount = tasks.filter((t) => t.dirty).length
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
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

      <SyncBar />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* ── Form ── */}
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
              {/* ── Date picker field ── */}
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Hạn chót</Text>
                <TouchableOpacity style={s.dateBtn} onPress={openPicker} activeOpacity={0.7}>
                  <Text style={[s.dateBtnText, !dueDate && s.datePlaceholder]}>
                    {dueDate ? formatDisplay(dueDate) : 'Chọn ngày...'}
                  </Text>
                  <Text style={s.dateIcon}>
                    {dueDate ? '✕' : <Icon name="calendar" size="{20}" color="#999"/>}
                  </Text>
                </TouchableOpacity>
                {/* Clear button — chỉ hiện khi đã chọn ngày */}
                {dueDate && (
                  <TouchableOpacity onPress={clearDate} hitSlop={8} style={s.clearBtn}>
                    <Text style={s.clearBtnText}>Xoá ngày</Text>
                  </TouchableOpacity>
                )}
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
                    style={[s.prioChip, priority === opt.value && PRIO_ACTIVE[opt.value]]}
                    onPress={() => setPriority(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.prioChipText, priority === opt.value && PRIO_TEXT[opt.value]]}>
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

      {/* ── Date Picker ── */}

      {/* Android: picker hiện trực tiếp, không cần Modal */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onAndroidChange}
        />
      )}

      {/* iOS: bọc trong Modal với nút Xác nhận / Huỷ */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={cancelIOS} />
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={cancelIOS} hitSlop={8}>
                <Text style={s.modalCancel}>Huỷ</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Chọn ngày</Text>
              <TouchableOpacity onPress={confirmIOS} hitSlop={8}>
                <Text style={s.modalConfirm}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={onIOSChange}
              locale="vi-VN"
              style={{ height: 200 }}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  headerSub: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  syncBtnLoading: { opacity: 0.7 },
  syncBtnIcon: { fontSize: 14, color: '#555' },
  syncBtnLabel: { fontSize: 12, color: '#555' },

  formSection: { padding: 18, borderBottomWidth: 6, borderBottomColor: '#F5F5F0' },
  sectionLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  input: {
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  textarea: { height: 68, textAlignVertical: 'top', paddingTop: 8 },
  row2: { flexDirection: 'row', gap: 10 },

  // date picker trigger button — cùng style với input
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  dateBtnText: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  datePlaceholder: { color: '#AAAAAA' },
  dateIcon: { fontSize: 14 },
  clearBtn: { marginTop: 4, alignSelf: 'flex-end' },
  clearBtnText: { fontSize: 10, color: '#AAAAAA', textDecorationLine: 'underline' },

  prioRow: { flexDirection: 'row', gap: 8 },
  prioChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  prioChipText: { fontSize: 12, color: '#888' },
  createBtn: {
    marginTop: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },

  listSection: { padding: 18 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  countBadge: { backgroundColor: '#F1EFE8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 11, color: '#5F5E5A' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyIcon: { fontSize: 32, color: '#DDD' },
  emptyText: { fontSize: 13, color: '#CCCCCC' },

  // iOS bottom sheet modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
  },
  modalTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  modalCancel: { fontSize: 14, color: '#AAAAAA' },
  modalConfirm: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
})