// ============================================================
// TYT EBOOK APP — DATABASE TYPES
// Match 1:1 với Supabase schema (db/schema.sql)
// ============================================================


// ── RAW DATABASE ROWS (snake_case, match Supabase exactly) ──

export type DbProfile = {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type DbBook = {
  id: string
  title: string
  author: string
  cover_url: string | null
  description: string | null
  tag: 'novel' | 'book'
  genres: string | null          // "Ngôn Tình, Cổ Đại, HE"
  total_chapters: number
  is_full: boolean
  views: number
  likes: number
  editor: string | null
  created_at: string
  updated_at: string
}

export type DbChapter = {
  id: string
  book_id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  created_at: string
  updated_at: string
}

export type DbFavorite = {
  id: string
  user_id: string
  book_id: string
  created_at: string
}

export type DbReadingProgress = {
  id: string
  user_id: string
  book_id: string
  chapter_number: number
  scroll_percent: number         // 0.00 → 100.00
  last_read_at: string
  created_at: string
}

export type DbUserLibrary = {
  id: string
  user_id: string
  book_id: string | null         // null nếu là upload
  title: string
  author: string
  tag: string
  cover_url: string | null
  source: 'download' | 'upload'
  file_path: string | null
  created_at: string
}

export type DbFollow = {
  id: string
  user_id: string
  book_id: string
  created_at: string
}

export type DbCollection = {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at: string
}

export type DbCollectionBook = {
  collection_id: string
  book_id: string
  added_at: string
}


// ── APP-LEVEL TYPES (dùng trong UI, camelCase friendly) ──────
// Derived từ Db types, thêm các field join hoặc computed

export type Book = DbBook & {
  // computed/joined fields (optional, từ query join)
  is_favorited?: boolean
  reading_progress?: {
    chapter_number: number
    scroll_percent: number
  } | null
  genres_list?: string[]         // parsed từ genres string
}

export type Chapter = DbChapter & {
  // không cần thêm gì
}

export type Profile = DbProfile & {
  // computed
  display_name: string           // username ?? 'Người dùng'
}

export type UserLibraryItem = DbUserLibrary & {
  // joined từ books nếu source = 'download'
  book?: Pick<DbBook, 'title' | 'author' | 'cover_url' | 'tag'> | null
  // reading progress cho item này
  current_chapter?: number
}

export type Collection = DbCollection & {
  books?: Pick<DbBook, 'id' | 'title' | 'cover_url'>[]
  book_count?: number
}


// ── READER SETTINGS (local only, AsyncStorage) ───────────────

export type ReaderSettings = {
  bgColor: string
  textColor: string
  fontSize: number               // 12 → 32
  lineHeight: number             // 1.0 → 3.0
  readMode: 'scroll' | 'page' | 'combined'
  autoScroll: boolean
  scrollSpeed: number            // 1 → 100
  pageFlipTime: number           // 5 → 120
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  bgColor: '#0d0d0d',
  textColor: '#e0e0e0',
  fontSize: 19,
  lineHeight: 1.6,
  readMode: 'combined',
  autoScroll: false,
  scrollSpeed: 20,
  pageFlipTime: 25,
}


// ── API RESPONSE WRAPPER ─────────────────────────────────────

export type ApiResult<T> = {
  data: T | null
  error: string | null
}


// ── AUTH TYPES ───────────────────────────────────────────────

export type AuthCredentials = {
  email: string
  password: string
}

export type SignUpCredentials = AuthCredentials & {
  username: string
}