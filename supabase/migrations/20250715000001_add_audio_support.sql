-- Add audio support to mentra_interactions table for glasses audio playback
-- This extends the existing table with fields for audio URLs and AI responses

-- Add new columns for audio support
alter table mentra_interactions 
add column if not exists audio_url text,
add column if not exists ai_response text,
add column if not exists interaction_type text default 'phone_call';

-- Add indexes for better query performance
create index if not exists mentra_interactions_audio_url_idx on mentra_interactions(audio_url);
create index if not exists mentra_interactions_interaction_type_idx on mentra_interactions(interaction_type);

-- RLS policies already exist and work with UUID fields
-- No need to update them for audio support

-- Create a view for analytics
create or replace view mentra_interaction_analytics as
select 
  interaction_type,
  count(*) as total_interactions,
  count(distinct user_id) as unique_users,
  avg(extract(epoch from (created_at - timestamp::timestamptz))) as avg_processing_time_seconds
from mentra_interactions
where created_at is not null
group by interaction_type; 