-- Schema-only migration: no credentials, seed players, scores or backfills.
-- This schema is deliberately absent from Supabase's exposed Data API schemas.
create schema race_private;
revoke all on schema race_private from public, anon, authenticated;
grant usage on schema race_private to service_role;

create table race_private.race_users (
  name text primary key check (name ~ '^[a-z0-9_]{3,24}$'),
  salt text not null check (salt ~ '^[a-f0-9]{64}$'),
  password_hash text not null check (password_hash ~ '^[a-f0-9]{64}$'),
  created_at bigint not null check (created_at >= 0)
);

create table race_private.race_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  user_name text not null references race_private.race_users(name),
  expires_at bigint not null check (expires_at >= 0)
);
create index race_sessions_expiry on race_private.race_sessions(expires_at);

create table race_private.race_limits (
  key text primary key,
  window_start bigint not null check (window_start >= 0),
  count integer not null check (count > 0)
);

create table race_private.race_runs (
  id text primary key,
  user_name text not null references race_private.race_users(name),
  from_station smallint not null check (from_station between 0 and 2),
  to_station smallint not null check (to_station between 0 and 2 and to_station <> from_station),
  route_distance integer not null check (route_distance > 0),
  started_at bigint not null check (started_at >= 0),
  finished_at bigint,
  elapsed_ms integer check (elapsed_ms between 0 and 86400000),
  distance integer check (distance between 0 and 100000),
  hits integer check (hits between 0 and 10000),
  status text not null default 'running' check (status in ('running','finished','failed','abandoned')),
  constraint race_finished_fields check (
    (status='running' and finished_at is null and elapsed_ms is null and distance is null and hits is null)
    or (status<>'running' and finished_at is not null and finished_at >= started_at and elapsed_ms is not null and distance is not null and hits is not null)
  )
);
create index race_runs_history on race_private.race_runs(user_name,finished_at desc);
create index race_runs_leaderboard on race_private.race_runs(from_station,to_station,status,elapsed_ms);

-- Defense in depth: even if this schema were exposed later, client roles have
-- neither schema/table grants nor any RLS policies permitting account access.
alter table race_private.race_users enable row level security;
alter table race_private.race_sessions enable row level security;
alter table race_private.race_limits enable row level security;
alter table race_private.race_runs enable row level security;
revoke all on all tables in schema race_private from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema race_private to service_role;
alter default privileges in schema race_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema race_private revoke execute on functions from public, anon, authenticated;
