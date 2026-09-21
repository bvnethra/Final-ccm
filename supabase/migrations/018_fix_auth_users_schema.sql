-- ============================================================================
-- Migration 018: Standardize auth.users tokens & confirmation fields
-- Fixes GoTrue "Database error querying schema" by ensuring token columns
-- are empty string '' rather than NULL for manually seeded accounts.
-- Note: confirmed_at is a GENERATED column in Supabase and cannot be updated directly.
-- ============================================================================

UPDATE auth.users
SET confirmation_token = COALESCE(NULLIF(confirmation_token, ''), ''),
    recovery_token = COALESCE(NULLIF(recovery_token, ''), ''),
    email_change_token_new = COALESCE(NULLIF(email_change_token_new, ''), ''),
    email_change = COALESCE(NULLIF(email_change, ''), ''),
    phone_change = COALESCE(NULLIF(phone_change, ''), ''),
    phone_change_token = COALESCE(NULLIF(phone_change_token, ''), ''),
    reauthentication_token = COALESCE(NULLIF(reauthentication_token, ''), ''),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    last_sign_in_at = COALESCE(last_sign_in_at, NOW())
WHERE email IN (
    'superadmin@nethra.com',
    'admin@nethra.com',
    'backoffice@nethra.com',
    'labapprover@nethra.com',
    'labentry@nethra.com',
    'collectionagent@nethra.com'
);

-- Also ensure auth.identities exist for all these users
INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    u.id::text,
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
    'email',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email IN (
    'superadmin@nethra.com',
    'admin@nethra.com',
    'backoffice@nethra.com',
    'labapprover@nethra.com',
    'labentry@nethra.com',
    'collectionagent@nethra.com'
)
AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
