-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 500),
  category text not null default 'other'
    check (category in ('academics','facilities','safety','administration','other')),
  is_urgent boolean not null default false,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  post_id uuid not null references posts(id) on delete cascade,
  anon_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, anon_id)
);

-- Keep likes_count in sync automatically
create or replace function sync_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_likes_insert on likes;
create trigger trg_likes_insert after insert on likes
  for each row execute function sync_likes_count();

drop trigger if exists trg_likes_delete on likes;
create trigger trg_likes_delete after delete on likes
  for each row execute function sync_likes_count();

-- Row Level Security: fully anonymous, no auth required
alter table posts enable row level security;
alter table likes enable row level security;

create policy "anyone can read posts" on posts
  for select using (true);

create policy "anyone can create a post" on posts
  for insert with check (true);

create policy "anyone can read likes" on likes
  for select using (true);

create policy "anyone can like a post" on likes
  for insert with check (true);

create policy "anyone can unlike (their own anon_id)" on likes
  for delete using (true);
