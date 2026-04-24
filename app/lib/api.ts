// ============================================================
// TYT EBOOK APP — API NAMESPACE
// Tất cả Supabase calls tập trung tại đây.
// UI chỉ import từ file này, KHÔNG import supabase trực tiếp.
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  ApiResult,
  AuthCredentials,
  Author,
  Book,
  Chapter,
  Collection,
  DbAuthor,
  DbReadingProgress,
  Profile,
  Rating,
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

type TrendingPeriod = 'day' | 'week' | 'month'

function getTrendingStart(period: TrendingPeriod): string {
  const now = new Date()

  if (period === 'day') {
    now.setDate(now.getDate() - 1)
  } else if (period === 'week') {
    now.setDate(now.getDate() - 7)
  } else {
    now.setDate(now.getDate() - 30)
  }

  return now.toISOString()
}

async function getBookViewCounts(
  bookIds: string[],
  opts?: { since?: string },
): Promise<ApiResult<Record<string, number>>> {
  if (bookIds.length === 0) return ok({})

  let q = supabase
    .from('book_views')
    .select('book_id')
    .in('book_id', bookIds)

  if (opts?.since) q = q.gte('viewed_at', opts.since)

  const { data, error } = await q
  if (error) return err(supaErr(error))

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.book_id] = (counts[row.book_id] ?? 0) + 1
  }

  return ok(counts)
}

function parseAuthor(raw: any): Author | null {
  if (!raw) return null
  return {
    ...raw,
    is_followed: raw.is_followed ?? false,
  }
}

function parseBook(raw: any, views = 0): Book {
  const rawAuthor = Array.isArray(raw?.authors) ? raw.authors[0] : raw?.authors
  const author_profile = parseAuthor(raw?.author_profile ?? rawAuthor)
  const author = raw?.author ?? raw?.author_name ?? author_profile?.name ?? ''

  return {
    ...raw,
    author,
    author_name: author,
    author_profile,
    views: typeof raw?.views === 'number' ? raw.views : views,
    genres_list: raw.genres
      ? raw.genres.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [],
  }
}

async function hydrateBooks(rawBooks: any[]): Promise<ApiResult<Book[]>> {
  const bookIds = (rawBooks ?? []).map((book) => book.id)
  const viewCounts = await getBookViewCounts(bookIds)
  if (viewCounts.error) return err(viewCounts.error)

  return ok(
    (rawBooks ?? []).map((raw) => parseBook(raw, viewCounts.data?.[raw.id] ?? 0)),
  )
}

async function listBooksByViews(opts?: {
  tag?: 'novel' | 'book'
  limit?: number
  offset?: number
}): Promise<ApiResult<Book[]>> {
  let q = supabase
    .from('books')
    .select('*, authors(*)')

  if (opts?.tag) q = q.eq('tag', opts.tag)

  const { data, error } = await q
  if (error) return err(supaErr(error))

  const hydrated = await hydrateBooks(data ?? [])
  if (hydrated.error) return err(hydrated.error)

  const sorted = [...(hydrated.data ?? [])].sort((a, b) => {
    const byViews = (b.views ?? 0) - (a.views ?? 0)
    if (byViews !== 0) return byViews

    const byLikes = b.likes - a.likes
    if (byLikes !== 0) return byLikes

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const offset = opts?.offset ?? 0
  const limited = opts?.limit != null
    ? sorted.slice(offset, offset + opts.limit)
    : sorted.slice(offset)

  return ok(limited)
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
    if (opts?.orderBy === 'views') {
      return listBooksByViews(opts)
    }

    let q = supabase
      .from('books')
      .select('*, authors(*)')
      .order(opts?.orderBy ?? 'created_at', { ascending: false })

    if (opts?.tag) q = q.eq('tag', opts.tag)
    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return hydrateBooks(data ?? [])
  },

  /** Lấy chi tiết 1 book */
  async get(bookId: string): Promise<ApiResult<Book>> {
    const { data, error } = await supabase
      .from('books')
      .select('*, authors(*)')
      .eq('id', bookId)
      .single()

    if (error) return err(supaErr(error))

    const viewCounts = await getBookViewCounts([bookId])
    if (viewCounts.error) return err(viewCounts.error)

    return ok(parseBook(data, viewCounts.data?.[bookId] ?? 0))
  },

  /** Tìm kiếm books theo title/author */
  async search(query: string): Promise<ApiResult<Book[]>> {
    const keyword = query.trim()
    if (!keyword) return ok([])

    const { data: authorMatches, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .ilike('name', `%${keyword}%`)
      .limit(20)

    if (authorError) return err(supaErr(authorError))

    const authorIds = (authorMatches ?? []).map((author) => author.id)
    const authorFilter = authorIds.length > 0
      ? `,author_id.in.(${authorIds.join(',')})`
      : ''

    const { data, error } = await supabase
      .from('books')
      .select('*, authors(*)')
      .or(`title.ilike.%${keyword}%${authorFilter}`)
      .limit(30)

    if (error) return err(supaErr(error))
    return hydrateBooks(data ?? [])
  },

  /** Lấy books theo genre */
  async byGenre(genre: string): Promise<ApiResult<Book[]>> {
    const { data, error } = await supabase
      .from('books')
      .select('*, authors(*)')
      .ilike('genres', `%${genre}%`)
      .limit(50)

    if (error) return err(supaErr(error))
    const hydrated = await hydrateBooks(data ?? [])
    if (hydrated.error) return err(hydrated.error)

    return ok(
      [...(hydrated.data ?? [])]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 20),
    )
  },

  /** Tăng view count (cần Supabase RPC function) */
  async trending(opts?: {
    period?: TrendingPeriod
    tag?: 'novel' | 'book'
    limit?: number
    offset?: number
  }): Promise<ApiResult<Book[]>> {
    let q = supabase
      .from('books')
      .select('*, authors(*)')

    if (opts?.tag) q = q.eq('tag', opts.tag)

    const { data, error } = await q
    if (error) return err(supaErr(error))

    const rawBooks = data ?? []
    const since = opts?.period ? getTrendingStart(opts.period) : undefined
    const viewCounts = await getBookViewCounts(
      rawBooks.map((book) => book.id),
      since ? { since } : undefined,
    )
    if (viewCounts.error) return err(viewCounts.error)

    const sorted = rawBooks
      .map((raw) => parseBook(raw, viewCounts.data?.[raw.id] ?? 0))
      .sort((a, b) => {
        const byViews = (b.views ?? 0) - (a.views ?? 0)
        if (byViews !== 0) return byViews

        const byLikes = b.likes - a.likes
        if (byLikes !== 0) return byLikes

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

    const offset = opts?.offset ?? 0
    const limited = opts?.limit != null
      ? sorted.slice(offset, offset + opts.limit)
      : sorted.slice(offset)

    return ok(limited)
  },

  async incrementViews(
    bookId: string,
    opts?: { userId?: string | null; guestId?: string | null },
  ): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('book_views')
      .insert({
        book_id: bookId,
        user_id: opts?.userId ?? null,
        is_guest: !opts?.userId,
        guest_id: opts?.userId ? null : (opts?.guestId ?? null),
        viewed_at: new Date().toISOString(),
      })

    if (error) return err(supaErr(error))
    return ok(true as const)
  },
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
      .select('book_id, books(*, authors(*))')
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
      .select('*, books(*, authors(*))')
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
      author_id?: string
      author?: string
      tag: string
      cover_url?: string
      source: 'download' | 'upload'
      file_path?: string
    },
  ): Promise<ApiResult<true>> {
    const { author: _author, ...payload } = item
    const { error } = await supabase
      .from('user_library')
      .insert({ user_id: userId, ...payload })

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


// ── AUTHORS NAMESPACE ────────────────────────────────────────

export const authors = {
  /** Lấy 1 author theo ID */
  async get(authorId: string, userId?: string): Promise<ApiResult<Author>> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('id', authorId)
      .single()

    if (error) return err(supaErr(error))

    // Kiểm tra nếu user đã follow author này
    let is_followed = false
    if (userId) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', userId)
        .eq('author_id', authorId)
        .maybeSingle()
      is_followed = !!follow
    }

    return ok({ ...data, is_followed })
  },

  /** Lấy danh sách authors (phân trang, sắp xếp theo follower_count) */
  async list(opts?: {
    limit?: number
    offset?: number
    orderBy?: 'follower_count' | 'created_at'
  }): Promise<ApiResult<Author[]>> {
    let q = supabase
      .from('authors')
      .select('*')
      .order(opts?.orderBy ?? 'follower_count', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok((data ?? []).map(a => ({ ...a, is_followed: false })))
  },

  /** Tìm kiếm authors theo tên */
  async search(query: string): Promise<ApiResult<Author[]>> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('follower_count', { ascending: false })
      .limit(20)

    if (error) return err(supaErr(error))
    return ok((data ?? []).map(a => ({ ...a, is_followed: false })))
  },

  /** Lấy danh sách books của 1 author */
  async getBooks(authorId: string, opts?: {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'likes' | 'rating_avg'
  }): Promise<ApiResult<Book[]>> {
    let q = supabase
      .from('books')
      .select('*, authors(*)')
      .eq('author_id', authorId)
      .order(opts?.orderBy ?? 'created_at', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return hydrateBooks(data ?? [])
  },

  /** Lấy danh sách followers của 1 author */
  async getFollowers(authorId: string, opts?: {
    limit?: number
    offset?: number
  }): Promise<ApiResult<Profile[]>> {
    let q = supabase
      .from('follows')
      .select('user_id, profiles(*)')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok(
      (data ?? [])
        .map((f: any) => ({
          ...f.profiles,
          display_name: f.profiles.username ?? 'Người dùng',
        }))
        .filter(Boolean),
    )
  },

  /** Tạo author profile (trả về ID) */
  async create(data: {
    name: string
    bio?: string
    avatar_url?: string
  }): Promise<ApiResult<DbAuthor>> {
    const { data: author, error } = await supabase
      .from('authors')
      .insert({
        name: data.name,
        bio: data.bio ?? null,
        avatar_url: data.avatar_url ?? null,
      })
      .select()
      .single()

    if (error) return err(supaErr(error))
    return ok(author)
  },

  /** Cập nhật author info */
  async update(
    authorId: string,
    patch: {
      name?: string
      bio?: string
      avatar_url?: string
    },
  ): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('authors')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', authorId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Xoá author (admin only — handle ở API gateway) */
  async delete(authorId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('id', authorId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Verify author badge (admin only) */
  async verify(authorId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('authors')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', authorId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },
}


// ── FOLLOWS NAMESPACE (follow authors) ──────────────────────

export const follows = {
  /** Kiểm tra user đã follow author chưa */
  async check(userId: string, authorId: string): Promise<ApiResult<boolean>> {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', userId)
      .eq('author_id', authorId)
      .maybeSingle()

    return ok(!!data)
  },

  /** Follow author */
  async follow(userId: string, authorId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('follows')
      .insert({ user_id: userId, author_id: authorId })

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Unfollow author */
  async unfollow(userId: string, authorId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', userId)
      .eq('author_id', authorId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Toggle follow — trả về trạng thái mới */
  async toggle(userId: string, authorId: string): Promise<ApiResult<boolean>> {
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', userId)
      .eq('author_id', authorId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', userId)
        .eq('author_id', authorId)
      if (error) return err(supaErr(error))
      return ok(false)
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ user_id: userId, author_id: authorId })
      if (error) return err(supaErr(error))
      return ok(true)
    }
  },

  /** Lấy danh sách authors mà user đang follow */
  async getFollowingList(userId: string, opts?: {
    limit?: number
    offset?: number
  }): Promise<ApiResult<Author[]>> {
    let q = supabase
      .from('follows')
      .select('author_id, authors(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok(
      (data ?? [])
        .map((f: any) => ({ ...f.authors, is_followed: true }))
        .filter(Boolean),
    )
  },
}


// ── RATINGS NAMESPACE ────────────────────────────────────────

export const ratings = {
  /** Lấy rating của user cho book */
  async get(userId: string, bookId: string): Promise<ApiResult<Rating | null>> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, profiles(id, username, avatar_url)')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('is_deleted', false)
      .maybeSingle()

    if (error) return err(supaErr(error))
    return ok(data ? { ...data, user: data.profiles } : null)
  },

  /** Kiểm tra user đã rate book chưa */
  async check(userId: string, bookId: string): Promise<ApiResult<boolean>> {
    const { data } = await supabase
      .from('ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('is_deleted', false)
      .maybeSingle()

    return ok(!!data)
  },

  /** Post/cập nhật rating (upsert) */
  async post(
    userId: string,
    bookId: string,
    rating: number,
  ): Promise<ApiResult<true>> {
    if (rating < 1 || rating > 5)
      return err('Rating phải từ 1 đến 5 sao')

    const { error } = await supabase.from('ratings').upsert(
      {
        user_id: userId,
        book_id: bookId,
        rating,
        is_deleted: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'book_id,user_id' },
    )

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Xoá rating (soft delete) */
  async delete(userId: string, bookId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('ratings')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('book_id', bookId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Lấy danh sách ratings của book (có pagination) */
  async list(bookId: string, opts?: {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'likes'
  }): Promise<ApiResult<Rating[]>> {
    let q = supabase
      .from('ratings')
      .select('*, profiles(id, username, avatar_url)')
      .eq('book_id', bookId)
      .eq('is_deleted', false)
      .order(opts?.orderBy ?? 'created_at', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))
    return ok(
      (data ?? []).map((r: any) => ({ ...r, user: r.profiles })),
    )
  },

  /** Lấy rating average + count của book (từ books table) */
  async getStats(bookId: string): Promise<ApiResult<{
    avg: number
    count: number
  }>> {
    const { data, error } = await supabase
      .from('books')
      .select('rating_avg, rating_count')
      .eq('id', bookId)
      .single()

    if (error) return err(supaErr(error))
    return ok({
      avg: data?.rating_avg ?? 0,
      count: data?.rating_count ?? 0,
    })
  },

  /** Lấy distribution của ratings (1-5 stars) */
  async getDistribution(bookId: string): Promise<ApiResult<{
    one: number
    two: number
    three: number
    four: number
    five: number
  }>> {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('book_id', bookId)
      .eq('is_deleted', false)

    if (error) return err(supaErr(error))

    const dist = { one: 0, two: 0, three: 0, four: 0, five: 0 }
    const key = ['', 'one', 'two', 'three', 'four', 'five'] as const

    (data ?? []).forEach((r: any) => {
      const k = key[r.rating]
      if (k) dist[k]++
    })

    return ok(dist)
  },
}


// ── COMMENTS NAMESPACE ──────────────────────────────────────

export const comments = {
  /** Lấy 1 comment với nested replies */
  async get(commentId: string): Promise<ApiResult<any>> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (error) return err(supaErr(error))

    // Lấy replies nested
    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('parent_id', commentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (repliesError) return err(supaErr(repliesError))

    return ok({
      ...data,
      user: data.profiles,
      replies: (replies ?? []).map((r: any) => ({
        ...r,
        user: r.profiles,
      })),
    })
  },

  /** Post comment hoặc reply */
  async post(
    userId: string,
    bookId: string,
    content: string,
    parentId?: string,
  ): Promise<ApiResult<any>> {
    if (!content || content.trim().length === 0)
      return err('Bình luận không được để trống')

    if (content.length > 2000)
      return err('Bình luận tối đa 2000 ký tự')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        book_id: bookId,
        content: content.trim(),
        parent_id: parentId ?? null,
      })
      .select('*, profiles(id, username, avatar_url)')
      .single()

    if (error) return err(supaErr(error))
    return ok({ ...data, user: data.profiles, replies: [] })
  },

  /** Cập nhật comment */
  async update(
    userId: string,
    commentId: string,
    content: string,
  ): Promise<ApiResult<true>> {
    if (!content || content.trim().length === 0)
      return err('Bình luận không được để trống')

    if (content.length > 2000)
      return err('Bình luận tối đa 2000 ký tự')

    const { error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Xoá comment (soft delete) */
  async delete(userId: string, commentId: string): Promise<ApiResult<true>> {
    const { error } = await supabase
      .from('comments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) return err(supaErr(error))
    return ok(true as const)
  },

  /** Lấy danh sách comments của book (top-level only) */
  async list(bookId: string, opts?: {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'likes'
  }): Promise<ApiResult<any[]>> {
    let q = supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('book_id', bookId)
      .is('parent_id', null)  // Top-level only
      .eq('is_deleted', false)
      .order(opts?.orderBy ?? 'created_at', { ascending: false })

    if (opts?.limit) q = q.limit(opts.limit)
    if (opts?.offset != null && opts?.limit != null)
      q = q.range(opts.offset, opts.offset + opts.limit - 1)

    const { data, error } = await q
    if (error) return err(supaErr(error))

    // Lấy replies cho mỗi comment
    const withReplies = await Promise.all(
      (data ?? []).map(async (comment: any) => {
        const { data: replies } = await supabase
          .from('comments')
          .select('*, profiles(id, username, avatar_url)')
          .eq('parent_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })

        return {
          ...comment,
          user: comment.profiles,
          replies: (replies ?? []).map((r: any) => ({
            ...r,
            user: r.profiles,
          })),
        }
      }),
    )

    return ok(withReplies)
  },

  /** Lấy nested replies của 1 comment */
  async getReplies(parentId: string): Promise<ApiResult<any[]>> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) return err(supaErr(error))
    return ok(
      (data ?? []).map((r: any) => ({
        ...r,
        user: r.profiles,
      })),
    )
  },
}


// ── DEFAULT EXPORT ────────────────────────────────────────────

const api = {
  auth,
  profiles,
  books,
  chapters,
  authors,
  follows,
  ratings,
  comments,
  favorites,
  progress,
  library,
  collections,
}

export default api
