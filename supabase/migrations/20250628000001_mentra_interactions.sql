-- Create table for storing Mentra OS interactions
create table mentra_interactions (
    id bigserial primary key,
    user_id uuid references auth.users(id) on delete cascade,
    image_url text not null,
    vapi_call_id text,
    mentra_package_name text,
    timestamp timestamp with time zone default now(),
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    ai_feedback text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table mentra_interactions enable row level security;

-- Users can only see their own interactions
create policy "Users can view own mentra interactions" on mentra_interactions
    for select using (auth.uid() = user_id);

-- Users can insert their own interactions
create policy "Users can insert own mentra interactions" on mentra_interactions
    for insert with check (auth.uid() = user_id);

-- Users can update their own interactions
create policy "Users can update own mentra interactions" on mentra_interactions
    for update using (auth.uid() = user_id);

-- Create index for faster queries
create index mentra_interactions_user_id_idx on mentra_interactions(user_id);
create index mentra_interactions_vapi_call_id_idx on mentra_interactions(vapi_call_id);
create index mentra_interactions_created_at_idx on mentra_interactions(created_at);

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_mentra_interactions_updated_at
    before update on mentra_interactions
    for each row
    execute function update_updated_at_column(); 