-- Add service role policies for Mentra OS interactions
-- This allows server-side operations from the Mentra webhook

-- Service role can insert Mentra interactions for any user
create policy "Service role can insert mentra interactions" on mentra_interactions
    for insert with check (
        current_setting('role') = 'service_role' OR
        auth.uid() = user_id
    );

-- Service role can select Mentra interactions for any user
create policy "Service role can select mentra interactions" on mentra_interactions
    for select using (
        current_setting('role') = 'service_role' OR
        auth.uid() = user_id
    );

-- Service role can update Mentra interactions for any user
create policy "Service role can update mentra interactions" on mentra_interactions
    for update using (
        current_setting('role') = 'service_role' OR
        auth.uid() = user_id
    );

-- Update the table to add missing columns from our camera integration
alter table mentra_interactions 
add column if not exists audio_url text,
add column if not exists ai_response text,
add column if not exists interaction_type text default 'mentra_glasses_capture';

-- Add index for interaction type
create index if not exists mentra_interactions_interaction_type_idx on mentra_interactions(interaction_type); 