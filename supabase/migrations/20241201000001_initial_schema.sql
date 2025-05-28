-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'system'
    image_url TEXT,
    raw_image_url TEXT,
    processed_image_url TEXT,
    storage_object_path TEXT,
    ai_feedback TEXT,
    shopping_suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_usage_quotas table
CREATE TABLE IF NOT EXISTS user_usage_quotas (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year_key TEXT,
    images_uploaded_this_period INTEGER DEFAULT 0,
    feedback_flows_initiated_this_period INTEGER DEFAULT 0,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, month_year_key)
);

-- Create outfits table (keeping for backward compatibility)
CREATE TABLE IF NOT EXISTS outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_object_path TEXT NOT NULL,
    notes TEXT,
    initial_ai_analysis_text TEXT,
    aggregated_friend_feedback_summary_text TEXT,
    derived_score_signal_text TEXT,
    feedback_status TEXT DEFAULT 'pending_initial_ai',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feedback_solicitations table
CREATE TABLE IF NOT EXISTS feedback_solicitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    initiated_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_trusted_friends table
CREATE TABLE IF NOT EXISTS user_trusted_friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_nickname TEXT NOT NULL,
    friend_identifier_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create friend_feedback_threads table
CREATE TABLE IF NOT EXISTS friend_feedback_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitation_id UUID NOT NULL REFERENCES feedback_solicitations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trusted_friend_id UUID REFERENCES user_trusted_friends(id) ON DELETE SET NULL,
    contacted_friend_identifier_text TEXT NOT NULL,
    simulated_friend_reply_text TEXT,
    status TEXT DEFAULT 'pending_send',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_solicitations_outfit_id ON feedback_solicitations(outfit_id);
CREATE INDEX IF NOT EXISTS idx_feedback_solicitations_user_id ON feedback_solicitations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trusted_friends_user_id ON user_trusted_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_feedback_threads_solicitation_id ON friend_feedback_threads(solicitation_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_solicitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trusted_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_feedback_threads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view their own chats" 
ON chats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" 
ON chats FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
ON chats FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
ON chats FOR DELETE 
USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" 
ON messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages in their chats" 
ON messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON messages FOR DELETE 
USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- User usage quotas policies
CREATE POLICY "Users can view their own usage quotas" 
ON user_usage_quotas FOR SELECT 
USING (auth.uid() = user_id);

-- Outfits policies
CREATE POLICY "Users can view their own outfits" 
ON outfits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outfits" 
ON outfits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits" 
ON outfits FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits" 
ON outfits FOR DELETE 
USING (auth.uid() = user_id);

-- Feedback solicitations policies
CREATE POLICY "Users can view their own feedback solicitations" 
ON feedback_solicitations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback solicitations" 
ON feedback_solicitations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback solicitations" 
ON feedback_solicitations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback solicitations" 
ON feedback_solicitations FOR DELETE 
USING (auth.uid() = user_id);

-- User trusted friends policies
CREATE POLICY "Users can view their own trusted friends" 
ON user_trusted_friends FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trusted friends" 
ON user_trusted_friends FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted friends" 
ON user_trusted_friends FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted friends" 
ON user_trusted_friends FOR DELETE 
USING (auth.uid() = user_id);

-- Friend feedback threads policies
CREATE POLICY "Users can view their own feedback threads" 
ON friend_feedback_threads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback threads" 
ON friend_feedback_threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback threads" 
ON friend_feedback_threads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback threads" 
ON friend_feedback_threads FOR DELETE 
USING (auth.uid() = user_id);

-- Storage policies for outfit images
CREATE POLICY "authenticate_users_outfits_update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (substring(name from '^outfits/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_outfits_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (substring(name from '^outfits/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_outfits_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (substring(name from '^outfits/([^/]+)')::uuid = auth.uid());

-- Storage policies for raw images
CREATE POLICY "authenticate_users_raw_images_update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (substring(name from '^raw-images/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_raw_images_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (substring(name from '^raw-images/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_raw_images_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (substring(name from '^raw-images/([^/]+)')::uuid = auth.uid());

-- Storage policies for processed images
CREATE POLICY "authenticate_users_processed_images_update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (substring(name from '^processed-images/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_processed_images_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (substring(name from '^processed-images/([^/]+)')::uuid = auth.uid());

CREATE POLICY "authenticate_users_processed_images_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (substring(name from '^processed-images/([^/]+)')::uuid = auth.uid()); 