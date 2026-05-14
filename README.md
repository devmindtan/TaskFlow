# TaskFlow

Ứng dụng quản lý task theo hướng offline-first cho mobile.

- Mobile (Android/iOS): đầy đủ tính năng local SQLite + sync Supabase.
- Web: chỉ dùng để hiển thị giao diện preview (không lưu dữ liệu, không sync).

## Kiến trúc hiện tại

```
Mobile App                     Supabase
────────────────────────────   ─────────────────
SQLite local (dirty=1)    ──►  tasks table
SQLite local (dirty=0)    ◄──  pull theo updated_at
```

- Local-first: thao tác tạo/sửa/xóa thực hiện trên SQLite trước.
- Đồng bộ: chạy tự động mỗi 60 giây hoặc bấm Sync thủ công.
- Conflict: ưu tiên bản ghi có updated_at mới hơn.

## Chạy project

```bash
npm install
npx expo start
```

- Android: nhấn `a` hoặc chạy `npm run android`.
- iOS: nhấn `i` hoặc chạy `npm run ios`.
- Web preview UI: nhấn `w` hoặc chạy `npm run web`.

## Cấu hình Supabase (cho mobile sync)

1. Tạo project ở Supabase.
2. Chạy file `supabase/schema.sql` trong SQL Editor.
3. Cập nhật biến môi trường trong `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_or_publishable_key
```

## Cấu trúc quan trọng

```
app/
  _layout.tsx
  index.tsx

src/
  screens/
    TaskScreen.tsx       # mobile: logic đầy đủ
    TaskScreen.web.tsx   # web: UI preview only

  components/
    SyncBar.tsx
    TaskItem.tsx

  store/
    taskStore.ts
    kvStorage.ts
    kvStorage.web.ts

  db/
    localDB.ts
    localDB.web.ts

  services/
    supabase.ts
    syncService.ts

  hooks/
    useAutoSync.ts

supabase/
  schema.sql
```

## Flow mobile

1. Tạo task: ghi SQLite với `dirty=1`.
2. Sync thủ công hoặc auto 60s: push task dirty lên Supabase.
3. Pull dữ liệu mới từ Supabase theo `updated_at`.
4. Cập nhật local và đánh dấu `dirty=0` khi sync thành công.

## Flow web

- Web render bằng file `TaskScreen.web.tsx`.
- Chỉ hiển thị UI mẫu để demo giao diện.
- Không gọi local DB, không gọi sync service, không ghi dữ liệu.