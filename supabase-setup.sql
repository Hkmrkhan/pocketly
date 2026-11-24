-- =====================================================
-- 💰 Daily Kharcha - Complete Database Setup
-- =====================================================
-- Copy paste this entire file into Supabase SQL Editor
-- Project: https://ugpbrpipclztiwptqmua.supabase.co
-- =====================================================

-- ============================================
-- 1️⃣ DROP EXISTING TABLES (if re-running)
-- ============================================
-- Uncomment these lines if you need to reset
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;

-- ============================================
-- 2️⃣ CREATE EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL CHECK (char_length(description) > 0),
  category TEXT NOT NULL CHECK (category IN ('Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3️⃣ CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_at DESC);

-- ============================================
-- 4️⃣ ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5️⃣ DROP OLD POLICIES (if re-running)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- ============================================
-- 6️⃣ CREATE RLS POLICIES
-- ============================================

-- Policy: SELECT - Users can only view their own expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: INSERT - Users can only insert their own expenses
CREATE POLICY "Users can insert their own expenses"
  ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE - Users can only update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: DELETE - Users can only delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7️⃣ CREATE UPDATED_AT TRIGGER
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7.1️⃣ CREATE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL CHECK (char_length(event_name) > 0),
  description TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  event_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 7.2️⃣ CREATE INDEXES FOR EVENTS TABLE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date DESC);

-- ============================================
-- 7.3️⃣ ENABLE ROW LEVEL SECURITY FOR EVENTS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7.4️⃣ DROP OLD EVENT POLICIES (if re-running)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- ============================================
-- 7.5️⃣ CREATE RLS POLICIES FOR EVENTS
-- ============================================

-- Policy: SELECT - Users can only view their own events
CREATE POLICY "Users can view their own events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: INSERT - Users can only insert their own events
CREATE POLICY "Users can insert their own events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE - Users can only update their own events
CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: DELETE - Users can only delete their own events
CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7.6️⃣ CREATE UPDATED_AT TRIGGER FOR EVENTS
-- ============================================
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8️⃣ VERIFICATION QUERIES
-- ============================================

-- Check if tables were created successfully
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('expenses', 'events');

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('expenses', 'events');

-- View all policies on expenses table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('expenses', 'events');

-- ============================================
-- 9️⃣ HELPFUL QUERIES FOR TESTING
-- ============================================

-- View all your expenses (run after login)
-- SELECT * FROM expenses ORDER BY created_at DESC;

-- Get total spending
-- SELECT SUM(amount) as total_spent FROM expenses;

-- Get spending by category
-- SELECT 
--   category,
--   COUNT(*) as count,
--   SUM(amount) as total,
--   AVG(amount) as average,
--   MIN(amount) as minimum,
--   MAX(amount) as maximum
-- FROM expenses
-- GROUP BY category
-- ORDER BY total DESC;

-- Get today's expenses
-- SELECT * FROM expenses 
-- WHERE DATE(created_at) = CURRENT_DATE
-- ORDER BY created_at DESC;

-- Get this month's expenses
-- SELECT * FROM expenses 
-- WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
-- ORDER BY created_at DESC;

-- Get last 7 days expenses
-- SELECT 
--   DATE(created_at) as date,
--   COUNT(*) as count,
--   SUM(amount) as total
-- FROM expenses
-- WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- ============================================
-- 🔟 HELPFUL QUERIES FOR EVENTS
-- ============================================

-- View all your events (run after login)
-- SELECT * FROM events ORDER BY event_date DESC;

-- Get today's events
-- SELECT * FROM events 
-- WHERE event_date = CURRENT_DATE
-- ORDER BY created_at DESC;

-- Get this month's events
-- SELECT * FROM events 
-- WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)
-- ORDER BY event_date DESC;

-- Get total event spending
-- SELECT 
--   event_date,
--   COUNT(*) as event_count,
--   SUM(amount) as total_amount
-- FROM events
-- GROUP BY event_date
-- ORDER BY event_date DESC;

-- ============================================
-- 🎉 SETUP COMPLETE!
-- ============================================
-- Your database is ready for POCKETLY app!
-- 
-- Tables Created:
-- 1. expenses - Daily expense tracking
-- 2. events - Event tracking with date
-- 
-- Next Steps:
-- 1. Make sure Authentication is enabled in Supabase
-- 2. Disable "Confirm Email" for testing
-- 3. Run your app with: npx expo start
-- 4. Create an account and test!
-- ============================================
