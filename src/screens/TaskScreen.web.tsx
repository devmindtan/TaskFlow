import React from 'react'
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

type PreviewTask = {
  id: string
  title: string
  description: string
  priority: 'low' | 'med' | 'high'
  dueDate?: string
  assignee?: string
  done?: boolean
}

const PREVIEW_TASKS: PreviewTask[] = [
  {
    id: '1',
    title: 'Thiết kế landing section',
    description: 'Chỉnh màu và typography cho phần hero',
    priority: 'high',
    dueDate: '2026-05-20',
    assignee: 'thanh',
  },
  {
    id: '2',
    title: 'Review flow tạo task',
    description: 'Kiểm tra spacing và trạng thái button',
    priority: 'med',
    dueDate: '2026-05-22',
    assignee: 'an',
  },
  {
    id: '3',
    title: 'Chuẩn bị demo nội bộ',
    description: 'Tạo checklist cho buổi review tuần',
    priority: 'low',
    done: true,
  },
]

const PRIORITY_LABEL = {
  low: 'Thấp',
  med: 'Trung bình',
  high: 'Cao',
}

export default function TaskScreenWeb() {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Task Manager</Text>
          <Text style={s.subTitle}>Web Preview Mode</Text>
        </View>

        <View style={s.notice}>
          <Text style={s.noticeText}>
            Bản web hiện chỉ hiển thị giao diện. Tính năng lưu local và sync được tắt.
          </Text>
        </View>

        <View style={s.formSection}>
          <Text style={s.sectionLabel}>Tạo task mới (preview)</Text>
          <TextInput style={s.input} placeholder="Nhập tên task..." editable={false} />
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Mô tả chi tiết..."
            editable={false}
            multiline
          />
          <View style={s.row}>
            <TextInput style={[s.input, s.half]} placeholder="YYYY-MM-DD" editable={false} />
            <TextInput style={[s.input, s.half]} placeholder="@assignee" editable={false} />
          </View>
          <View style={s.priorityRow}>
            <View style={[s.chip, s.chipLow]}>
              <Text style={s.chipLowText}>Thấp</Text>
            </View>
            <View style={[s.chip, s.chipMed]}>
              <Text style={s.chipMedText}>Trung bình</Text>
            </View>
            <View style={[s.chip, s.chipHigh]}>
              <Text style={s.chipHighText}>Cao</Text>
            </View>
          </View>
          <TouchableOpacity style={[s.createBtn, s.createBtnDisabled]} activeOpacity={1}>
            <Text style={s.createBtnText}>+ Tạo task</Text>
          </TouchableOpacity>
        </View>

        <View style={s.listSection}>
          <Text style={s.sectionLabel}>Danh sách task (preview)</Text>
          {PREVIEW_TASKS.map((task) => (
            <View key={task.id} style={s.taskItem}>
              <View style={[s.checkbox, task.done && s.checkboxDone]}>
                {task.done ? <Text style={s.checkmark}>✓</Text> : null}
              </View>
              <View style={s.taskBody}>
                <Text style={[s.taskTitle, task.done && s.taskTitleDone]}>{task.title}</Text>
                <Text style={s.taskDescription}>{task.description}</Text>
                <View style={s.taskMeta}>
                  <View style={[s.badge, badgeByPriority(task.priority)]}>
                    <Text style={[s.badgeText, badgeTextByPriority(task.priority)]}>
                      {PRIORITY_LABEL[task.priority]}
                    </Text>
                  </View>
                  {task.dueDate ? <Text style={s.metaText}>⊙ {task.dueDate}</Text> : null}
                  {task.assignee ? <Text style={s.metaText}>@{task.assignee}</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function badgeByPriority(priority: PreviewTask['priority']) {
  if (priority === 'high') return s.badgeHigh
  if (priority === 'med') return s.badgeMed
  return s.badgeLow
}

function badgeTextByPriority(priority: PreviewTask['priority']) {
  if (priority === 'high') return s.badgeHighText
  if (priority === 'med') return s.badgeMedText
  return s.badgeLowText
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 18, paddingBottom: 30 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  subTitle: { marginTop: 2, fontSize: 12, color: '#8B8B8B' },

  notice: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F5D695',
    marginBottom: 16,
  },
  noticeText: { fontSize: 12, color: '#7D5A12', lineHeight: 18 },

  sectionLabel: {
    fontSize: 11,
    color: '#8B8B8B',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  formSection: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FCFCFC',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: '#F3F3F3',
  },
  textarea: { height: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },

  priorityRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  chipLow: { backgroundColor: '#EAF3DE', borderColor: '#C0DD97' },
  chipMed: { backgroundColor: '#FAEEDA', borderColor: '#FAC775' },
  chipHigh: { backgroundColor: '#FCEBEB', borderColor: '#F7C1C1' },
  chipLowText: { color: '#3B6D11', fontSize: 12 },
  chipMedText: { color: '#BA7517', fontSize: 12 },
  chipHighText: { color: '#A32D2D', fontSize: 12 },

  createBtn: {
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  createBtnDisabled: { backgroundColor: '#BFBFBF' },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  listSection: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  taskItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CDCDCD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  checkmark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  taskBody: { flex: 1 },
  taskTitle: { color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  taskTitleDone: { color: '#9D9D9D', textDecorationLine: 'line-through' },
  taskDescription: { color: '#7F7F7F', fontSize: 12, marginTop: 2 },
  taskMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' },
  metaText: { color: '#8D8D8D', fontSize: 11 },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10 },
  badgeLow: { backgroundColor: '#EAF3DE', borderColor: '#C0DD97' },
  badgeMed: { backgroundColor: '#FAEEDA', borderColor: '#FAC775' },
  badgeHigh: { backgroundColor: '#FCEBEB', borderColor: '#F7C1C1' },
  badgeLowText: { color: '#3B6D11' },
  badgeMedText: { color: '#BA7517' },
  badgeHighText: { color: '#A32D2D' },
})
