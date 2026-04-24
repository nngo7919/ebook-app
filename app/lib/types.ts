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
  author_id: string | null       // FK to authors table
  cover_url: string | null
  description: string | null
  tag: 'novel' | 'book'
  genres: string | null          // "Ngôn Tình, Cổ Đại, HE"
  total_chapters: number
  is_full: boolean
  likes: number
  rating_avg: number             // 0.0 to 5.0
  rating_count: number
  comment_count: number
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type DbAuthor = {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  verified: boolean
  follower_count: number
  created_at: string
  updated_at: string
}

export type DbRating = {
  id: string
  book_id: string
  user_id: string
  rating: number                 // 1-5
  is_deleted: boolean            // soft delete for analytics
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type DbComment = {
  id: string
  book_id: string
  user_id: string
  content: string
  parent_id: string | null       // for nested replies
  likes: number
  is_deleted: boolean            // soft delete for nested replies
  deleted_at: string | null
  is_edited: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
}

export type DbBookView = {
  id: string
  book_id: string
  user_id: string | null         // null for guests
  is_guest: boolean
  guest_id: string | null        // device/session ID
  viewed_at: string
  created_at: string
}

export type DbChapter = {
  id: string
  book_id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  is_deleted: boolean
  deleted_at: string | null
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
  author_id: string | null       // FK to authors table if exists
  tag: string
  cover_url: string | null
  source: 'download' | 'upload'
  file_path: string | null
  created_at: string
}

export type DbFollow = {
  id: string
  user_id: string
  author_id: string              // FK to authors table
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
  // UI compatibility/computed fields
  author: string
  author_name?: string
  author_profile?: Author | null
  views: number
  editor?: string | null
  // computed/joined fields (optional, từ query join)
  is_favorited?: boolean
  reading_progress?: {
    chapter_number: number
    scroll_percent: number
  } | null
  genres_list?: string[]         // parsed từ genres string
}

export type Author = DbAuthor & {
  // computed
  is_followed?: boolean          // for current user
}

export type Rating = DbRating & {
  // joined user info
  user?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export type Comment = DbComment & {
  // joined user info
  user?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  // nested replies
  replies?: Comment[]
}

export type BookView = DbBookView

export type Chapter = DbChapter & {
  // không cần thêm gì
}

export type Profile = DbProfile & {
  // computed
  display_name: string           // username ?? 'Người dùng'
}

export type UserLibraryItem = DbUserLibrary & {
  author: string
  // joined từ books nếu source = 'download'
  book?: Pick<DbBook, 'id' | 'title' | 'author_id' | 'cover_url' | 'tag'> & {
    author: string
    author_profile?: Author | null
  } | null
  // reading progress cho item này
  current_chapter?: number
}

export type Collection = DbCollection & {
  books?: (Pick<DbBook, 'id' | 'title' | 'cover_url'> & {
    author: string
    author_profile?: Author | null
  })[]
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
