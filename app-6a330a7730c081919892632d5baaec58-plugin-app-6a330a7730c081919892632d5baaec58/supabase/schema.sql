-- Run this in the Supabase SQL editor before enabling production recording uploads.
create table if not exists recordings (
  id uuid primary key,
  title text not null,
  source_url text,
  status text not null default 'recording',
  demo_status text not null default 'draft',
  tour_json jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table recordings add column if not exists demo_status text not null default 'draft';
alter table recordings add column if not exists tour_json jsonb not null default '[]'::jsonb;

create table if not exists recording_event_batches (
  id bigint generated always as identity primary key,
  recording_id uuid not null references recordings(id) on delete cascade,
  events jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists recording_event_batches_recording_id_idx on recording_event_batches(recording_id);

-- Buyer conversion events captured from published Molded demos.
create table if not exists demo_leads (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references recordings(id) on delete cascade,
  name text not null,
  company text,
  email text not null,
  completed_steps integer not null default 0,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists demo_leads_recording_id_idx on demo_leads(recording_id, created_at desc);
