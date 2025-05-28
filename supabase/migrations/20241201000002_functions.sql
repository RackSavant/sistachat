-- Function to increment a user's upload count for a given month
CREATE OR REPLACE FUNCTION increment_uploads(p_user_id UUID, p_month_year_key TEXT)
RETURNS void AS $$
BEGIN
    -- First check if record exists
    IF EXISTS (
        SELECT 1 FROM user_usage_quotas 
        WHERE user_id = p_user_id AND month_year_key = p_month_year_key
    ) THEN
        -- Update existing record
        UPDATE user_usage_quotas
        SET images_uploaded_this_period = images_uploaded_this_period + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id AND month_year_key = p_month_year_key;
    ELSE
        -- Create new record - this should already be handled elsewhere, but as a fallback
        INSERT INTO user_usage_quotas (
            user_id, 
            month_year_key, 
            images_uploaded_this_period,
            feedback_flows_initiated_this_period,
            period_start_date,
            period_end_date
        )
        VALUES (
            p_user_id,
            p_month_year_key,
            1, -- Start with 1 for the current upload
            0,
            DATE_TRUNC('month', NOW())::DATE, -- First day of current month
            (DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day')::DATE -- Last day of current month
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment a user's feedback request count for a given month
CREATE OR REPLACE FUNCTION increment_feedback_requests(p_user_id UUID, p_month_year_key TEXT)
RETURNS void AS $$
BEGIN
    -- First check if record exists
    IF EXISTS (
        SELECT 1 FROM user_usage_quotas 
        WHERE user_id = p_user_id AND month_year_key = p_month_year_key
    ) THEN
        -- Update existing record
        UPDATE user_usage_quotas
        SET feedback_flows_initiated_this_period = feedback_flows_initiated_this_period + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id AND month_year_key = p_month_year_key;
    ELSE
        -- Create new record - this should already be handled elsewhere, but as a fallback
        INSERT INTO user_usage_quotas (
            user_id, 
            month_year_key, 
            images_uploaded_this_period,
            feedback_flows_initiated_this_period,
            period_start_date,
            period_end_date
        )
        VALUES (
            p_user_id,
            p_month_year_key,
            0,
            1, -- Start with 1 for the current feedback request
            DATE_TRUNC('month', NOW())::DATE, -- First day of current month
            (DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day')::DATE -- Last day of current month
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create or get the current chat for a user
CREATE OR REPLACE FUNCTION get_or_create_current_chat(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Try to get the most recent chat for the user
    SELECT id INTO chat_id
    FROM chats
    WHERE user_id = p_user_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no chat exists, create one
    IF chat_id IS NULL THEN
        INSERT INTO chats (user_id, title)
        VALUES (p_user_id, 'New Chat')
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, display_name)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 