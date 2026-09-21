-- Migration 017: Ensure auth.identities exist for all users so GoTrue password auth works flawlessly

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
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
