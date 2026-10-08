-- ============================================================
-- DEV ONLY — DO NOT RUN IN PRODUCTION
-- Seed 12 fake reports vào content_reports để test Sprint 2.5.
-- Idempotent: dùng UUID cố định + ON CONFLICT DO NOTHING.
-- ============================================================

-- 4 status × 3 targetType = 12 reports
INSERT INTO content_reports (id, reporter_id, target_type, target_id, reason, description, status, created_at, updated_at)
VALUES
  -- PENDING
  ('11111111-1111-1111-1111-111111111101', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'POST',    'aaaa1111-1111-1111-1111-111111111101', 'spam',         'Spam content',              'PENDING',   NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111102', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'COMMENT', 'aaaa1111-1111-1111-1111-111111111102', 'harassment',   'Harassing comment',         'PENDING',   NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111103', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'USER',    'aaaa1111-1111-1111-1111-111111111103', 'fake_account', 'Suspected fake account',    'PENDING',   NOW(), NOW()),
  -- REVIEWED
  ('22222222-2222-2222-2222-222222222201', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'POST',    'aaaa2222-2222-2222-2222-222222222201', 'copyright',    'Copyright violation',       'REVIEWED',  NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222202', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'COMMENT', 'aaaa2222-2222-2222-2222-222222222202', 'hate_speech',  'Hate speech',               'REVIEWED',  NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222203', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'USER',    'aaaa2222-2222-2222-2222-222222222203', 'impersonation','Impersonating someone',     'REVIEWED',  NOW(), NOW()),
  -- RESOLVED
  ('33333333-3333-3333-3333-333333333301', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'POST',    'aaaa3333-3333-3333-3333-333333333301', 'spam',         'Handled: content deleted',  'RESOLVED',  NOW() - INTERVAL '1 day', NOW()),
  ('33333333-3333-3333-3333-333333333302', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'COMMENT', 'aaaa3333-3333-3333-3333-333333333302', 'harassment',   'Handled: comment removed',  'RESOLVED',  NOW() - INTERVAL '1 day', NOW()),
  ('33333333-3333-3333-3333-333333333303', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'USER',    'aaaa3333-3333-3333-3333-333333333303', 'fake_account', 'Handled: user warned',      'RESOLVED',  NOW() - INTERVAL '1 day', NOW()),
  -- DISMISSED
  ('44444444-4444-4444-4444-444444444401', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'POST',    'aaaa4444-4444-4444-4444-444444444401', 'spam',         'Dismissed: not spam',       'DISMISSED', NOW() - INTERVAL '2 days', NOW()),
  ('44444444-4444-4444-4444-444444444402', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'COMMENT', 'aaaa4444-4444-4444-4444-444444444402', 'off_topic',    'Dismissed: not violation',  'DISMISSED', NOW() - INTERVAL '2 days', NOW()),
  ('44444444-4444-4444-4444-444444444403', '56030fa2-b07b-4599-8c1f-e1e8b4da9622', 'USER',    'aaaa4444-4444-4444-4444-444444444403', 'spam',         'Dismissed: no evidence',    'DISMISSED', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;
