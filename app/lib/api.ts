// ============================================================
// TYT EBOOK APP — API NAMESPACE
// Tất cả Supabase calls tập trung tại đây.
// UI chỉ import từ file này, KHÔNG import supabase trực tiếp.
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  ApiResult,
  AuthCredentials,
  Book,
  Chapter,
  Collection,
  DbReadingProgress,
  Profile,
  SignUpCredentials,
  UserLibraryItem,
} from './types'

// ── HELPER ───────────────────────────────────────────────────

function ok<T>(data: T): ApiResult<T> {
  return { data, error: null }
}

function err<T>(msg: string): ApiResult<T> {
  return { data: null, error: msg }
}

function supaErr(error: { message: string } | null): string {
  return error?.message ?? 'Lỗi không xác định'
}

// ── AUTH NAMESPACE ───────────────────────────────────────────

export const auth = {
  /** Lấy session hiện tại */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) return err(supaErr(error))
    return ok(data.session)
  },

  /** Đăng nhập bằng email/password */
  async signIn(creds: AuthCredentials): Promise<ApiResult<true>> {
    const { error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    })
    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Đăng ký tài khoản mới */
  async signUp(creds: SignUpCredentials): Promise<ApiResult<true>> {
    const { error } = await supabase.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { data: { username: creds.username } },
    })
    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Đăng xuất */
  async signOut(): Promise<ApiResult<true>> {
    const { error } = await supabase.auth.signOut()
    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Đổi mật khẩu */
  async updatePassword(newPassword: string): Promise<ApiResult<true>> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Subscribe auth state — trả về unsubscribe fn */
  onAuthStateChange(
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
  ) {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return data.subscription.unsubscribe
  },
}


// ── PROFILES NAMESPACE ───────────────────────────────────────

export const profiles = {
  /** Lấy profile theo userId */
  async get(userId: string): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return err(supaErr(error))
    return ok({ ...data, display_name: data.username ?? 'Người dùng' })
  },

  /** Cập nhật profile */
  async update(
    userId: string,
    patch: { username?: string; bio?: string; avatar_url?: string },
  ): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },
}


// ── BOOKS NAMESPACE ──────────────────────────────────────────

export const books = {
  /** Lấy danh sách books (có phân trang) */
  async list(opts?: {
    tag?: 'novel' | 'book'
    limit?: number
    offset?: number
    orderBy?: 'views' | 'likes' | 'created_at'
  }): Promise<ApiResult<Book[]>> {
    let q = supabase
      .from('books')
      .select('*')
      .order(opts?.orderBy ?? 'created_at', { ascending: false })

    if (opts?.tag) q = q.eq('tag', opts.tag)
    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok((data ?? []).map(parseBook))
  },

  /** Lấy chi tiết 1 book */
  async get(bookId: string): Promise<ApiResult<Book>> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (error) return err(supaErr(error))
    return ok(parseBook(data))
  },

  /** Tìm kiếm books theo title/author */
  async search(query: string): Promise<ApiResult<Book[]>> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(30)

    if (error) return err(supaErr(error))
    return ok((data ?? []).map(parseBook))
  },

  /** Lấy books theo genre */
  async byGenre(genre: string): Promise<ApiResult<Book[]>> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('genres', `%${genre}%`)
      .order('views', { ascending: false })
      .limit(20)

    if (error) return err(supaErr(error))
    return ok((data ?? []).map(parseBook))
  },

  /** Tăng view count (cần Supabase RPC function) */
  async incrementViews(bookId: string): Promise<void> {
    await supabase.rpc('increment_book_views', { book_id: bookId })
  },
}

function parseBook(raw: any): Book {
  return {
    ...raw,
    genres_list: raw.genres
      ? raw.genres.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [],
  }
}


// ── CHAPTERS NAMESPACE ───────────────────────────────────────

export const chapters = {
  /** Lấy 1 chapter theo số chương */
  async get(bookId: string, chapterNumber: number): Promise<ApiResult<Chapter>> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .single()

    if (error) return err(supaErr(error))
    return ok(data)
  },

  /** Lấy danh sách chapter (TOC) */
  async list(
    bookId: string,
  ): Promise<ApiResult<Pick<Chapter, 'id' | 'chapter_number' | 'title' | 'word_count'>[]>> {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, word_count')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true })

    if (error) return err(supaErr(error))
    return ok(data ?? [])
  },
}


// ── FAVORITES NAMESPACE ──────────────────────────────────────

export const favorites = {
  /** Lấy danh sách books đã thích */
  async list(userId: string): Promise<ApiResult<Book[]>> {
    const { data, error } = await supabase
      .from('favorites')
      .select('book_id, books(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return err(supaErr(error))
    return ok(
      (data ?? []).map((f: any) => parseBook(f.books)).filter(Boolean),
    )
  },

  /** Kiểm tra đã thích chưa */
  async check(userId: string, bookId: string): Promise<ApiResult<boolean>> {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle()

    return ok(!!data)
  },

  /** Toggle thích/bỏ thích — trả về trạng thái mới */
  async toggle(userId: string, bookId: string): Promise<ApiResult<boolean>> {
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id)
      if (error) return err(supaErr(error))
      return ok(false)
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, book_id: bookId })
      if (error) return err(supaErr(error))
      return ok(true)
    }
  },
}


// ── READING PROGRESS NAMESPACE ───────────────────────────────

export const progress = {
  /** Lấy progress của 1 book */
  async get(
    userId: string,
    bookId: string,
  ): Promise<ApiResult<DbReadingProgress | null>> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle()

    if (error) return err(supaErr(error))
    return ok(data)
  },

  /** Lưu/cập nhật progress (upsert) */
  async save(
    userId: string,
    bookId: string,
    chapterNumber: number,
    scrollPercent: number,
  ): Promise<ApiResult<true>> {
    const { error } = await supabase.from('reading_progress').upsert(
      {
        user_id: userId,
        book_id: bookId,
        chapter_number: chapterNumber,
        scroll_percent: Math.round(scrollPercent * 100) / 100,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,book_id' },
    )

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Lịch sử đọc gần đây */
  async recentBooks(
    userId: string,
    limit = 20,
  ): Promise<ApiResult<(DbReadingProgress & { book: Book })[]>> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*, books(*)')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(limit)

    if (error) return err(supaErr(error))
    return ok(
      (data ?? []).map((r: any) => ({ ...r, book: parseBook(r.books) })),
    )
  },
}


// ── LIBRARY NAMESPACE ────────────────────────────────────────

export const library = {
  /** Lấy thư viện cá nhân */
  async list(
    userId: string,
    opts?: { source?: 'download' | 'upload' },
  ): Promise<ApiResult<UserLibraryItem[]>> {
    let q = supabase
      .from('user_library')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (opts?.source) q = q.eq('source', opts.source)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok(data ?? [])
  },

  /** Thêm vào thư viện */
  async add(
    userId: string,
    item: {
      book_id?: string
      title: string
      author: string
      tag: string
      cover_url?: string
      source: 'download' | 'upload'
      file_path?: string
    },
  ): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('user_library')
      .insert({ user_id: userId, ...item })

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Xoá khỏi thư viện */
  async remove(userId: string, itemId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },
}


// ── COLLECTIONS NAMESPACE ────────────────────────────────────

export const collections = {
  async list(userId: string): Promise<ApiResult<Collection[]>> {
    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_books(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return err(supaErr(error))
    return ok(
      (data ?? []).map((c: any) => ({
        ...c,
        book_count: c.collection_books?.[0]?.count ?? 0,
      })),
    )
  },

  async create(
    userId: string,
    name: string,
    isPublic = false,
  ): Promise<ApiResult<Collection>> {
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, name, is_public: isPublic })
      .select()
      .single()

    if (error) return err(supaErr(error))
    return ok(data)
  },

  async addBook(collectionId: string, bookId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('collection_books')
      .insert({ collection_id: collectionId, book_id: bookId })

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  async removeBook(collectionId: string, bookId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('collection_books')
      .delete()
      .eq('collection_id', collectionId)
      .eq('book_id', bookId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },
}


// ── DEFAULT EXPORT ────────────────────────────────────────────

const api = {
  auth,
  profiles,
  books,
  chapters,
  favorites,
  progress,
  library,
  collections,
}

export default api