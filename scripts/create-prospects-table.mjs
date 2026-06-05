import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(root, filename), 'utf8').replace(/\r/g, '');

      for (const line of content.split('\n')) {
        const index = line.indexOf('=');

        if (index > 0 && !line.trimStart().startsWith('#')) {
          process.env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
        }
      }
    }
    catch {
      // Optional env file.
    }
  }
}

loadEnv();

const tableSql = `create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  full_name text not null default '',
  phone text not null default '',
  picture_url text not null default '',
  locale text not null default '',
  email_verified text not null default '',
  google_id text not null default '',
  created_at timestamptz not null default now()
);`;

const indexSql = 'create index if not exists prospects_email_idx on public.prospects (lower(email));';

const storageSql = `
insert into storage.buckets (id, name, public)
values ('prospect-photos', 'prospect-photos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read prospect photos'
  ) then
    create policy "Public read prospect photos"
    on storage.objects for select
    using (bucket_id = 'prospect-photos');
  end if;
end $$;
`;

async function runWithClient(client) {
  await client.query(tableSql);
  await client.query(indexSql);

  try {
    await client.query(storageSql);
  }
  catch (error) {
    console.warn('Storage setup skipped:', error.message);
  }
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

if (databaseUrl) {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await runWithClient(client);
    console.log('Created public.prospects table successfully.');
    process.exit(0);
  }
  catch (error) {
    console.error('Failed with DATABASE_URL:', error.message);
    process.exit(1);
  }
  finally {
    await client.end().catch(() => {});
  }
}

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const password = process.env.SUPABASE_DB_PASSWORD;
const regions = [
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-south-1',
  'sa-east-1',
];

if (!password) {
  console.error('Could not create table automatically.');
  console.error('Add one of these to .env.local, then run: npm run db:setup');
  console.error('');
  console.error('Option A - full connection string:');
  console.error('DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
  console.error('');
  console.error('Option B - database password only:');
  console.error('SUPABASE_DB_PASSWORD=your_database_password');
  console.error('');
  console.error('Find it in Supabase -> Project Settings -> Database -> Database password / Connection string');
  process.exit(1);
}

for (const region of regions) {
  const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await runWithClient(client);
    console.log(`Created public.prospects table successfully (region: ${region}).`);
    process.exit(0);
  }
  catch (error) {
    console.log(`Region ${region}: ${error.message.slice(0, 100)}`);
    await client.end().catch(() => {});
  }
}

console.error('Could not connect to Supabase Postgres. Check SUPABASE_DB_PASSWORD or DATABASE_URL.');
process.exit(1);
