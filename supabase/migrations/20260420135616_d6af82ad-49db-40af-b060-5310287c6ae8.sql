-- Replace the broad SELECT-all policy with one that disallows bucket listing
-- while still allowing direct URL access (URL access uses the public-bucket
-- code path and does not require this policy).
DROP POLICY IF EXISTS "Chat attachments are readable" ON storage.objects;

-- Note: the bucket itself remains public, so signed URLs/direct URLs still work.
-- We simply do not grant a permissive SELECT that would let clients enumerate files.
