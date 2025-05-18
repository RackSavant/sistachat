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