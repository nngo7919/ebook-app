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
-- ============================================================
-- MIGRATION 001 — Thêm authors, ratings, comments, book_views
-- ============================================================

-- ============================================================
-- 9. AUTHORS
-- Tách author thành entity riêng để có trang tác giả, follow
-- ============================================================
create table public.authors (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  bio            text,
  avatar_url     text,
  verified       boolean not null default false,
  follower_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index authors_name_idx       on public.authors(name);
create index authors_follower_idx   on public.authors(follower_count desc);

-- Thêm author_id vào books (nullable để không vỡ data cũ)
alter table public.books add column if not exists author_id uuid references public.authors(id) on delete set null;
create index books_author_id_idx on public.books(author_id);

-- Trigger updated_at cho authors
drop trigger if exists authors_updated_at on public.authors;
create trigger authors_updated_at
  before update on public.authors
  for each row execute function public.update_updated_at();


-- ============================================================
-- 10. RATINGS
-- Mỗi user chỉ rate 1 lần / book (upsert), soft delete
-- ============================================================
create table public.ratings (
  id          uuid primary key default uuid_generate_v4(),
  book_id     uuid not null references public.books(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique(book_id, user_id)
);

create index ratings_book_idx   on public.ratings(book_id) where is_deleted = false;
create index ratings_user_idx   on public.ratings(user_id);

-- Thêm rating_avg + rating_count vào books để tránh query nặng
alter table public.books add column if not exists rating_avg  numeric(3,2) not null default 0;
alter table public.books add column if not exists rating_count int         not null default 0;

-- Trigger sync rating_avg khi insert/update/delete rating
create or replace function public.sync_book_rating()
returns trigger as $$
declare
  target_book_id uuid;
begin
  target_book_id := coalesce(new.book_id, old.book_id);
  update public.books
  set
    rating_avg   = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.ratings
      where book_id = target_book_id and is_deleted = false
    ), 0),
    rating_count = (
      select count(*)
      from public.ratings
      where book_id = target_book_id and is_deleted = false
    )
  where id = target_book_id;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists ratings_sync_book on public.ratings;
create trigger ratings_sync_book
  after insert or update or delete on public.ratings
  for each row execute function public.sync_book_rating();

drop trigger if exists ratings_updated_at on public.ratings;
create trigger ratings_updated_at
  before update on public.ratings
  for each row execute function public.update_updated_at();


-- ============================================================
-- 11. COMMENTS
-- Nested replies (parent_id), soft delete, likes
-- ============================================================
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  book_id     uuid not null references public.books(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  likes       int not null default 0,
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  is_edited   boolean not null default false,
  edited_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index comments_book_idx    on public.comments(book_id, created_at desc) where is_deleted = false;
create index comments_user_idx    on public.comments(user_id);
create index comments_parent_idx  on public.comments(parent_id) where parent_id is not null;

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at();


-- ============================================================
-- 12. BOOK_VIEWS
-- Log từng lượt xem để tính trending theo thời gian
-- user_id nullable → hỗ trợ guest mode
-- ============================================================
create table public.book_views (
  id         uuid primary key default uuid_generate_v4(),
  book_id    uuid not null references public.books(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  is_guest   boolean not null default false,
  guest_id   text,         -- device/session ID cho guest
  viewed_at  timestamptz not null default now()
);

-- Index cho trending query theo thời gian
create index book_views_book_idx       on public.book_views(book_id);
create index book_views_viewed_at_idx  on public.book_views(book_id, viewed_at desc);
create index book_views_period_idx     on public.book_views(viewed_at desc);

-- Trigger: sync books.views khi có view mới
create or replace function public.sync_book_views()
returns trigger as $$
begin
  update public.books
  set views = (select count(*) from public.book_views where book_id = new.book_id)
  where id = new.book_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists book_views_sync_count on public.book_views;
create trigger book_views_sync_count
  after insert on public.book_views
  for each row execute function public.sync_book_views();


-- ============================================================
-- FOLLOW CẬP NHẬT — thêm author_id column vào follows
-- follows giờ dùng được cho cả book và author
-- ============================================================
alter table public.follows
  add column if not exists author_id uuid references public.authors(id) on delete cascade;

-- Đảm bảo chỉ follow 1 trong 2 (book hoặc author), không phải cả hai
alter table public.follows
  drop constraint if exists follows_target_check;
alter table public.follows
  add constraint follows_target_check
  check (
    (book_id is not null and author_id is null) or
    (book_id is null and author_id is not null)
  );

-- Index follow author
create index if not exists follows_author_idx on public.follows(author_id) where author_id is not null;

-- Trigger sync follower_count trên authors
create or replace function public.sync_author_follower_count()
returns trigger as $$
declare
  target_author_id uuid;
begin
  target_author_id := coalesce(new.author_id, old.author_id);
  if target_author_id is null then return coalesce(new, old); end if;

  update public.authors
  set follower_count = (
    select count(*) from public.follows
    where author_id = target_author_id
  )
  where id = target_author_id;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists follows_sync_author_count on public.follows;
create trigger follows_sync_author_count
  after insert or delete on public.follows
  for each row execute function public.sync_author_follower_count();


-- ============================================================
-- RLS — Các bảng mới
-- ============================================================
alter table public.authors    enable row level security;
alter table public.ratings    enable row level security;
alter table public.comments   enable row level security;
alter table public.book_views enable row level security;

-- authors: ai cũng đọc, chỉ admin insert/update (qua service role)
create policy "authors_read"  on public.authors for select using (true);

-- ratings: ai cũng đọc, chỉ owner write
create policy "ratings_read"  on public.ratings for select using (true);
create policy "ratings_write" on public.ratings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- comments: ai cũng đọc, chỉ owner write
create policy "comments_read"  on public.comments for select using (true);
create policy "comments_write" on public.comments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- book_views: insert tự do (cả guest), không ai xoá
create policy "book_views_insert" on public.book_views for insert with check (true);
create policy "book_views_read"   on public.book_views for select using (true);