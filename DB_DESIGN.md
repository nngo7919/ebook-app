# TYT Ebook App — Database Design Document

## 1. Data Type Constraints

### String Fields

| Field                     | Max Length | Min Length | Notes                      |
| ------------------------- | ---------- | ---------- | -------------------------- |
| `authors.name`            | 255        | 1          | Author name (NOT NULL)     |
| `authors.bio`             | 1000       | 0          | Author biography           |
| `books.title`             | 500        | 1          | Book title (NOT NULL)      |
| `books.description`       | 5000       | 0          | Book description           |
| `books.genres`            | 500        | 0          | Comma-separated genres     |
| `chapters.title`          | 255        | 0          | Chapter title              |
| `comments.content`        | 2000       | 1          | Comment/review text        |
| `collections.name`        | 255        | 1          | Collection name (NOT NULL) |
| `collections.description` | 1000       | 0          | Collection description     |
| `profiles.username`       | —          | —          | Unique, NOT NULL           |
| `user_library.title`      | 500        | 1          | Book title in library      |
| `user_library.file_path`  | 1000       | 0          | File upload path           |

### Numeric Fields

| Field                             | Range         | Default | Constraint                 |
| --------------------------------- | ------------- | ------- | -------------------------- |
| `books.rating_avg`                | 0.0 - 5.0     | 0       | NUMERIC(2,1)               |
| `ratings.rating`                  | 1 - 5         | —       | CHECK (1 ≤ rating ≤ 5)     |
| `reading_progress.scroll_percent` | 0.00 - 100.00 | 0       | NUMERIC(5,2)               |
| `chapters.chapter_number`         | > 0           | —       | CHECK (chapter_number > 0) |
| `books.total_chapters`            | ≥ 0           | 0       | CHECK (>= 0)               |
| `books.likes`                     | ≥ 0           | 0       | CHECK (>= 0)               |
| `books.rating_count`              | ≥ 0           | 0       | Auto-updated by trigger    |
| `books.comment_count`             | ≥ 0           | 0       | Auto-updated by trigger    |
| `authors.follower_count`          | ≥ 0           | 0       | Auto-updated by trigger    |
| `comments.likes`                  | ≥ 0           | 0       | Auto-updated manually      |

## 2. Unique Constraints (Prevent Duplicates)

| Table              | Constraint                  | Purpose                           |
| ------------------ | --------------------------- | --------------------------------- |
| `profiles`         | `username`                  | One user per username             |
| `favorites`        | `(user_id, book_id)`        | User rates each book once         |
| `ratings`          | `(book_id, user_id)`        | User rates each book once         |
| `reading_progress` | `(user_id, book_id)`        | One progress record per user/book |
| `follows`          | `(user_id, author_id)`      | User follows author once          |
| `chapters`         | `(book_id, chapter_number)` | One chapter per book per number   |
| `collection_books` | `(collection_id, book_id)`  | Book in collection once           |

## 3. Foreign Key Relationships

### Cascade Delete (DELETE from parent → DELETE children)

| Parent        | Child                | Relationship | Effect                                 |
| ------------- | -------------------- | ------------ | -------------------------------------- |
| `auth.users`  | `profiles`           | 1:1          | Delete user → delete profile           |
| `auth.users`  | `favorites`          | 1:N          | Delete user → delete all favorites     |
| `auth.users`  | `ratings`            | 1:N          | Delete user → delete all ratings       |
| `auth.users`  | `comments`           | 1:N          | Delete user → delete all comments      |
| `auth.users`  | `reading_progress`   | 1:N          | Delete user → delete all progress      |
| `auth.users`  | `follows`            | 1:N          | Delete user → delete all follows       |
| `auth.users`  | `user_library`       | 1:N          | Delete user → delete library           |
| `auth.users`  | `collections`        | 1:N          | Delete user → delete collections       |
| `books`       | `chapters`           | 1:N          | Delete book → delete chapters          |
| `books`       | `ratings`            | 1:N          | Delete book → delete ratings           |
| `books`       | `comments`           | 1:N          | Delete book → delete comments          |
| `books`       | `book_views`         | 1:N          | Delete book → delete views             |
| `books`       | `favorites`          | 1:N          | Delete book → delete favorites         |
| `books`       | `reading_progress`   | 1:N          | Delete book → delete progress          |
| `authors`     | `follows`            | 1:N          | Delete author → delete follows         |
| `collections` | `collection_books`   | 1:N          | Delete collection → delete entries     |
| `comments`    | `comments` (replies) | 1:N          | Delete parent comment → delete replies |

### Set NULL (DELETE from parent → SET NULL in children)

| Parent       | Child          | Effect                                            |
| ------------ | -------------- | ------------------------------------------------- |
| `authors`    | `books`        | Delete author → books.author_id = NULL            |
| `authors`    | `user_library` | Delete author → library.author_id = NULL          |
| `auth.users` | `book_views`   | Delete user → view.user_id = NULL (guest remains) |

## 4. Soft Delete Strategy

These tables use soft delete (`is_deleted` + `deleted_at`) for data retention:

| Table      | Why Soft Delete                   | Query Filter                |
| ---------- | --------------------------------- | --------------------------- |
| `books`    | Analytics, historical data        | WHERE is_deleted = false    |
| `chapters` | Analytics, historical data        | WHERE is_deleted = false    |
| `ratings`  | Analytics, recalculate averages   | Trigger handles calculation |
| `comments` | Preserve nested replies structure | WHERE is_deleted = false    |

**Queries must include:** `WHERE is_deleted = false` or `WHERE is_deleted = true` explicitly.

Hard delete tables (fully deleted immediately):

- `favorites`, `reading_progress`, `follows`, `collection_books`

## 5. Automatic Updates

### Triggers (Auto-Updated by Database)

1. **`profiles.updated_at`** — Updated on any profile change
2. **`authors.updated_at`** — Updated on any author change
3. **`books.updated_at`** — Updated on any book change
4. **`chapters.updated_at`** — Updated on any chapter change
5. **`ratings.updated_at`** — Updated on any rating change
6. **`comments.updated_at`** — Updated on any comment change
7. **`reading_progress.updated_at`** — Updated on progress change
8. **`collections.updated_at`** — Updated on collection change

**Function:** `moddatetime(updated_at)` — Sets timestamp to CURRENT_TIMESTAMP

### Computed Counts (Triggered Updates)

1. **`books.rating_avg`** — AVG(ratings.rating) WHERE is_deleted = false
   - **Trigger:** Fires on INSERT/UPDATE/DELETE in `ratings` table
2. **`books.rating_count`** — COUNT(\*) FROM ratings WHERE is_deleted = false
   - **Trigger:** Same as above
3. **`books.comment_count`** — COUNT(\*) FROM comments WHERE is_deleted = false
   - **Trigger:** Fires on INSERT/UPDATE/DELETE in `comments` table
4. **`authors.follower_count`** — COUNT(\*) FROM follows
   - **Trigger:** Fires on INSERT/DELETE in `follows` table

**Note:** Do NOT manually update these fields — triggers handle it automatically.

## 6. Indexes (Performance Optimization)

### Primary Lookup Indexes

```sql
idx_books_author_id              -- List books by author
idx_books_tag                    -- Filter by novel/book
idx_books_created_at             -- Latest books
idx_books_rating_avg             -- Top rated books
idx_books_likes                  -- Most liked books
idx_chapters_book_id             -- List chapters of book
idx_reading_progress_user_id     -- User's reading history
idx_reading_progress_last_read_at -- Recent books
idx_ratings_book_id              -- Book's ratings
idx_ratings_user_id              -- User's ratings
idx_comments_book_id             -- Book's comments
idx_comments_created_at          -- Recent comments
idx_follows_user_id              -- Authors user follows
idx_follows_author_id            -- Author's followers
idx_collections_user_id          -- User's collections
idx_favorites_user_id            -- User's favorites
```

### Filtered Indexes (Only non-deleted rows)

```sql
WHERE is_deleted = false         -- Only active books, chapters, comments
```

## 7. Row Level Security (RLS) Policies

### Public Access (Anyone)

- **`authors`** — Read-only
- **`books`** — Read (only non-deleted)
- **`chapters`** — Read (only non-deleted)
- **`ratings`** — Read (only non-deleted)
- **`comments`** — Read (only non-deleted)
- **`follows`** — Read-only
- **`collection_books`** — Read (if collection is public or user owns it)

### User-Specific Access

- **`profiles`** — Each user updates own profile
- **`favorites`** — Each user manages own
- **`ratings`** — Each user manages own (INSERT/UPDATE/DELETE)
- **`comments`** — Create/edit own, delete own
- **`reading_progress`** — Each user manages own
- **`user_library`** — Each user manages own
- **`collections`** — Each user creates/edits/deletes own

### Admin-Only Access

- **`authors`** — UPDATE/DELETE (admin role check)
- **`books`** — UPDATE/DELETE (admin role check)

**Auth Role:** Checked via `raw_user_meta_data->>'role' = 'admin'`

## 8. Guest Mode (Anonymous Users)

**Support for unauthenticated viewing:**

| Feature               | Implementation                                               |
| --------------------- | ------------------------------------------------------------ |
| View books            | No auth required                                             |
| View chapters         | No auth required                                             |
| View ratings/comments | No auth required                                             |
| Track views           | `book_views` with `is_guest = true` + `guest_id` (device ID) |
| Save favorites        | Requires auth (stored in AsyncStorage locally)               |
| Track progress        | Requires auth (stored in AsyncStorage locally)               |
| Post comments/ratings | Requires auth                                                |

**Guest ID:** Device-specific identifier (not user-identifying, privacy-safe)

## 9. Data Consistency Rules

### Business Logic Constraints

1. **No self-following:** User cannot follow themselves
   - Handled by: `follows(user_id, author_id) UNIQUE` + app logic

2. **No duplicate ratings:** User can rate book only once
   - Handled by: `ratings(book_id, user_id) UNIQUE`

3. **Chapter ordering:** Chapters must be sequential (1, 2, 3, ...)
   - Check at app level (schema doesn't enforce)

4. **Rating recalc on soft delete:** When rating is soft deleted, avg/count updates
   - Handled by: Trigger on `is_deleted` change

5. **Comments with soft delete:** Parent comment deletion doesn't delete replies
   - Handled by: `is_deleted = true` + `parent_id` persists

6. **Content limits:** Comments max 2000 chars
   - Database enforced + app UI feedback

## 10. Data Migration Path (Future)

If changing schema:

1. Add new column with default value
2. Backfill data via RPC function
3. Update triggers if needed
4. Drop old column (after confirmation)

Example: Renaming `author` → `author_id`

```sql
-- Phase 1: Add new column
ALTER TABLE books ADD COLUMN author_id UUID;
UPDATE books SET author_id = ... FROM authors WHERE ...;

-- Phase 2: Update app to use author_id
-- (update TypeScript types, API layer)

-- Phase 3: Drop old column (when all clients updated)
ALTER TABLE books DROP COLUMN author;
```

## 11. Query Performance Tips

1. **Always filter soft-deleted rows:**

   ```sql
   SELECT * FROM books WHERE is_deleted = false
   ```

2. **Use indices for sorting:**

   ```sql
   -- Fast: uses idx_books_created_at
   SELECT * FROM books ORDER BY created_at DESC LIMIT 20

   -- Slow: full table scan
   SELECT * FROM books WHERE author_id = $1 ORDER BY title
   ```

3. **Pagination with offset/limit:**

   ```sql
   SELECT * FROM books LIMIT 20 OFFSET 0
   SELECT * FROM books LIMIT 20 OFFSET 20  -- Next page
   ```

4. **Aggregate queries use triggers:**
   ```sql
   -- Don't: SELECT AVG(rating) FROM ratings -- slow!
   -- Do: SELECT rating_avg FROM books WHERE id = $1 -- instant!
   ```

---

**Schema Version:** 1.0  
**Last Updated:** 2026-04-23  
**Status:** ✅ Production-ready
