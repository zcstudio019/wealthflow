-- Read-only audit. Run manually with a read-only account first.
SELECT id, email, display_name, status, created_at
FROM users
ORDER BY created_at;

SELECT user_id, month, created_at, updated_at
FROM financial_snapshots
ORDER BY created_at;

-- Candidate list only. Review every row manually before any deletion.
SELECT id, email, display_name, status, created_at
FROM users
WHERE LOWER(email) LIKE 'local@%'
   OR LOWER(email) LIKE 'test@%'
   OR LOWER(email) LIKE 'demo@%'
   OR LOWER(email) LIKE '%@example.com'
   OR LOWER(email) LIKE '%@example.test'
ORDER BY created_at;
