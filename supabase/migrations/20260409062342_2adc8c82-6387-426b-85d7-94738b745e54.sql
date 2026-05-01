-- Drop the dangerous "Allow all access" policy
DROP POLICY IF EXISTS "Allow all access" ON user_roles;

-- Allow anyone to read roles (needed for AuthContext to fetch role)
CREATE POLICY "Anyone can read roles"
  ON user_roles FOR SELECT
  USING (true);

-- No direct INSERT/UPDATE/DELETE from client — must go through edge function