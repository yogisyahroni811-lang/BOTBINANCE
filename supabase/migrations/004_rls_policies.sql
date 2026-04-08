-- Migration 004: Row Level Security Configurations

-- Apply standard zero-trust RLS policies
-- By default tables are secure and no one can read/write without bypass_rls (e.g. service_role)

ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE snd_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE elliott_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_log ENABLE ROW LEVEL SECURITY;

-- Grant service_role full access (this is the backend worker)
-- Technically service_role bypasses RLS by default, but it's good to be explicit
-- allow read to authenticated/anon for dashboard usage

-- READ policies for authenticated users
CREATE POLICY "Allow read access to authenticated" ON symbols FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON candles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON snd_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON elliott_waves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON trades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON mistakes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON daily_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated" ON heartbeat_log FOR SELECT TO authenticated USING (true);
