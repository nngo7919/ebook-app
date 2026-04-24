-- ============================================================
-- TYT EBOOK APP — DATABASE SCHEMA
-- Supabase (PostgreSQL)
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (mở rộng từ auth.users — quan hệ 1:1)
-- ============================================================
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text unique,
    avatar_url text,
    bio text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. BOOKS
-- ============================================================
create table public.books (
    id uuid primary key default uuid_generate_v4 (),
    title text not null,
    author text not null,
    cover_url text,
    description text,
    tag text not null default 'novel', -- 'novel' | 'book'
    genres text, -- "Ngôn Tình, Cổ Đại, HE"
    total_chapters int not null default 0,
    is_full boolean not null default false,
    views int not null default 0,
    likes int not null default 0,
    editor text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index books_tag_idx on public.books (tag);

create index books_created_at_idx on public.books (created_at desc);

create index books_is_full_idx on public.books (is_full);

create index books_title_search on public.books using gin (to_tsvector ('simple', title));

-- ============================================================
-- 3. CHAPTERS
-- ============================================================
create table public.chapters (
    id uuid primary key default uuid_generate_v4 (),
    book_id uuid not null references public.books (id) on delete cascade,
    chapter_number int not null,
    title text not null,
    content text not null default '',
    word_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (book_id, chapter_number)
);

create index chapters_book_id_idx on public.chapters (book_id);

create index chapters_order_idx on public.chapters (book_id, chapter_number asc);

-- ============================================================
-- 4. FAVORITES
-- ============================================================
create table public.favorites (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    book_id uuid not null references public.books (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, book_id)
);

create index favorites_user_idx on public.favorites (user_id);

create index favorites_book_idx on public.favorites (book_id);

-- ============================================================
-- 5. READING PROGRESS
-- lưu chương đang đọc + % scroll trong chương
-- ============================================================
create table public.reading_progress (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    book_id uuid not null references public.books (id) on delete cascade,
    chapter_number int not null default 1,
    scroll_percent numeric(5, 2) not null default 0, -- 0.00 → 100.00
    last_read_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (user_id, book_id)
);

create index reading_progress_user_idx on public.reading_progress (user_id);

create index reading_progress_last_read_idx on public.reading_progress (user_id, last_read_at desc);

-- ============================================================
-- 6. USER LIBRARY
-- sách user tải về offline hoặc tự upload
-- ============================================================
create table public.user_library (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    book_id uuid references public.books (id) on delete set null, -- null nếu là upload
    title text not null,
    author text not null default 'Không rõ',
    tag text not null default 'book',
    cover_url text,
    source text not null check (
        source in ('download', 'upload')
    ),
    file_path text,
    created_at timestamptz not null default now()
);

create index user_library_user_idx on public.user_library (user_id);

create index user_library_source_idx on public.user_library (user_id, source);

-- ============================================================
-- 7. FOLLOWS (theo dõi sách — nhận thông báo chương mới)
-- ============================================================
create table public.follows (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    book_id uuid not null references public.books (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, book_id)
);

create index follows_user_idx on public.follows (user_id);

-- ============================================================
-- 8. COLLECTIONS (bộ sưu tập)
-- ============================================================
create table public.collections (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    is_public boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.collection_books (
    collection_id uuid not null references public.collections (id) on delete cascade,
    book_id uuid not null references public.books (id) on delete cascade,
    added_at timestamptz not null default now(),
    primary key (collection_id, book_id)
);

create index collections_user_idx on public.collections (user_id);

-- ============================================================
-- TRIGGERS (SAFE VERSION)
-- ============================================================

-- auto update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists books_updated_at on public.books;

create trigger books_updated_at
before update on public.books
for each row execute function public.update_updated_at();

drop trigger if exists chapters_updated_at on public.chapters;

create trigger chapters_updated_at
before update on public.chapters
for each row execute function public.update_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

-- auto create profile khi user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- sync total chapters
create or replace function public.sync_total_chapters()
returns trigger as $$
begin
  update public.books
  set total_chapters = (
    select count(*) from public.chapters
    where book_id = coalesce(new.book_id, old.book_id)
  )
  where id = coalesce(new.book_id, old.book_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists chapters_sync_total on public.chapters;

create trigger chapters_sync_total
after insert or delete on public.chapters
for each row execute function public.sync_total_chapters();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;

alter table public.books enable row level security;

alter table public.chapters enable row level security;

alter table public.favorites enable row level security;

alter table public.reading_progress enable row level security;

alter table public.user_library enable row level security;

alter table public.follows enable row level security;

alter table public.collections enable row level security;

alter table public.collection_books enable row level security;

-- ── PROFILES ─────────────────────────
create policy "profiles_read" on public.profiles for
select using (true);

create policy "profiles_update_own" on public.profiles for
update using (auth.uid () = id)
with
    check (auth.uid () = id);

-- ── BOOKS ───────────────────────────
create policy "books_read" on public.books for select using (true);

-- ⚠️ TẠM cho phép user login là ghi được (để bạn test)
create policy "books_write" on public.books for all using (auth.uid () is not null)
with
    check (auth.uid () is not null);

-- ── CHAPTERS ────────────────────────
create policy "chapters_read" on public.chapters for
select using (true);

create policy "chapters_write" on public.chapters for all using (auth.uid () is not null)
with
    check (auth.uid () is not null);

-- ── FAVORITES ───────────────────────
create policy "favorites_all" on public.favorites for all using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

-- ── READING PROGRESS ────────────────
create policy "reading_progress_all" on public.reading_progress for all using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

-- ── USER LIBRARY ────────────────────
create policy "user_library_all" on public.user_library for all using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

-- ── FOLLOWS ─────────────────────────
create policy "follows_all" on public.follows for all using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

-- ── COLLECTIONS ─────────────────────
create policy "collections_read" on public.collections for
select using (
        is_public = true
        or auth.uid () = user_id
    );

create policy "collections_write" on public.collections for all using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

-- ── COLLECTION_BOOKS ────────────────
create policy "collection_books_read" on public.collection_books for
select using (
        exists (
            select 1
            from public.collections c
            where
                c.id = collection_id
                and (
                    c.is_public = true
                    or c.user_id = auth.uid ()
                )
        )
    );

create policy "collection_books_write" on public.collection_books for all using (
    exists (
        select 1
        from public.collections c
        where
            c.id = collection_id
            and c.user_id = auth.uid ()
    )
)
with
    check (
        exists (
            select 1
            from public.collections c
            where
                c.id = collection_id
                and c.user_id = auth.uid ()
        )
    );