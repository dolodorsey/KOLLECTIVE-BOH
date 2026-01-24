-- ============================================================
-- PUSH NOTIFICATIONS DATABASE SCHEMA
-- ============================================================

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expo_push_token text NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one token per user per device
  UNIQUE(user_id, expo_push_token)
);

-- Create index for faster lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_enabled ON push_tokens(enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read their own tokens
CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all tokens
CREATE POLICY "Admins can view all push tokens"
  ON push_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- NOTIFICATION LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  status text CHECK (status IN ('sent', 'delivered', 'failed', 'read')) DEFAULT 'sent',
  error_message text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);

-- Indexes for notification logs
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);

-- RLS for notification logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can mark notifications as read"
  ON notification_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  
  -- Notification type preferences
  order_notifications boolean DEFAULT true,
  event_notifications boolean DEFAULT true,
  workflow_notifications boolean DEFAULT true,
  alert_notifications boolean DEFAULT true,
  task_notifications boolean DEFAULT true,
  broadcast_notifications boolean DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text DEFAULT 'America/New_York',
  
  updated_at timestamptz DEFAULT now()
);

-- RLS for preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id uuid)
RETURNS TABLE (expo_push_token text, platform text) AS $$
BEGIN
  RETURN QUERY
  SELECT pt.expo_push_token, pt.platform
  FROM push_tokens pt
  WHERE pt.user_id = p_user_id
    AND pt.enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id uuid,
  p_notification_type text
)
RETURNS boolean AS $$
DECLARE
  v_prefs notification_preferences;
  v_current_time time;
  v_in_quiet_hours boolean;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- If no preferences, default to true
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if push is enabled
  IF NOT v_prefs.push_enabled THEN
    RETURN false;
  END IF;
  
  -- Check notification type preference
  CASE p_notification_type
    WHEN 'order_received', 'order_ready' THEN
      IF NOT v_prefs.order_notifications THEN RETURN false; END IF;
    WHEN 'event_reminder', 'ticket_purchase' THEN
      IF NOT v_prefs.event_notifications THEN RETURN false; END IF;
    WHEN 'workflow_failed' THEN
      IF NOT v_prefs.workflow_notifications THEN RETURN false; END IF;
    WHEN 'alert_critical' THEN
      IF NOT v_prefs.alert_notifications THEN RETURN false; END IF;
    WHEN 'task_assigned' THEN
      IF NOT v_prefs.task_notifications THEN RETURN false; END IF;
    WHEN 'broadcast', 'announcement' THEN
      IF NOT v_prefs.broadcast_notifications THEN RETURN false; END IF;
  END CASE;
  
  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled THEN
    -- Get current time in user's timezone
    v_current_time := (now() AT TIME ZONE v_prefs.quiet_hours_timezone)::time;
    
    -- Check if current time is within quiet hours
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      v_in_quiet_hours := v_current_time >= v_prefs.quiet_hours_start 
                          AND v_current_time <= v_prefs.quiet_hours_end;
    ELSE
      -- Quiet hours span midnight
      v_in_quiet_hours := v_current_time >= v_prefs.quiet_hours_start 
                          OR v_current_time <= v_prefs.quiet_hours_end;
    END IF;
    
    -- Don't send if in quiet hours (except critical alerts)
    IF v_in_quiet_hours AND p_notification_type != 'alert_critical' THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================

-- View for notification statistics
CREATE OR REPLACE VIEW v_notification_stats AS
SELECT 
  user_id,
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read,
  MAX(sent_at) as last_sent
FROM notification_logs
WHERE sent_at > now() - interval '30 days'
GROUP BY user_id, notification_type;

-- ============================================================
-- SEED DEFAULT PREFERENCES
-- ============================================================

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check push token setup
SELECT 
  COUNT(*) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users,
  platform,
  enabled
FROM push_tokens
GROUP BY platform, enabled;

-- Recent notifications
SELECT 
  nl.notification_type,
  nl.title,
  nl.status,
  nl.sent_at,
  u.email as user_email
FROM notification_logs nl
JOIN auth.users u ON nl.user_id = u.id
ORDER BY nl.sent_at DESC
LIMIT 20;
