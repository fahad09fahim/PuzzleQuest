-- ============================================================
-- 003 — Hidden Chapter 5: "The Critical Terminal"
-- A terminal-based command line puzzle adventure that stays
-- hidden until the player completes Chapter 4.
-- Run this in the Supabase SQL Editor after 001 and 002.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Schema support
-- ------------------------------------------------------------

-- Hidden chapters are filtered out of the UI for regular players.
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.chapters.is_hidden IS
  'Hidden chapters are invisible to players until the previous chapter is fully completed.';

-- The terminal chapter uses puzzle_type = 'terminal', so the enum
-- is widened to TEXT (the app already treats it as a string).
ALTER TABLE public.puzzles
  ALTER COLUMN puzzle_type TYPE TEXT USING puzzle_type::text;

-- New validation mode: 'keywords' (all keyword groups must match).
ALTER TABLE public.puzzle_answers DROP CONSTRAINT IF EXISTS puzzle_answers_validation_mode_check;
ALTER TABLE public.puzzle_answers ADD CONSTRAINT puzzle_answers_validation_mode_check
  CHECK (validation_mode IN ('exact_insensitive', 'numeric', 'json_steps', 'memory_token', 'keywords'));

-- ------------------------------------------------------------
-- 2. Achievement
-- ------------------------------------------------------------
INSERT INTO public.achievements (id, slug, title, description, icon_name, badge_color, points_reward)
VALUES
  ('10000000-0000-0000-0000-000000000007', 'master_thinker', 'Master Thinker',
   'Complete all five critical-thinking challenges inside The Critical Terminal.',
   'Terminal', 'emerald', 150)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- ------------------------------------------------------------
-- 3. Chapter 5 — hidden by default
-- ------------------------------------------------------------
INSERT INTO public.chapters (id, chapter_number, title, subtitle, story_intro, description, theme, difficulty, reward_title, reward_description, is_published, is_hidden)
VALUES
  ('20000000-0000-0000-0000-000000000005', 5,
   'The Critical Terminal', 'Think Before You Execute',
   'A ghost signal bleeds through a dead maintenance port on the Astral Engine: a restricted shell that should not exist. You patch in as a cybersecurity investigator and the prompt flickers to life — five incidents are waiting, and every command you execute is being logged.',
   'Investigate five escalating security incidents from a command line. Reason through a logic gate, a lying witness, a suspicious log, a false assumption, and a live phishing attempt — then walk away before the system walks you out.',
   'Restricted Cyberspace', 'hard', 'Master Thinker',
   'Awarded for surviving all five critical-thinking challenges inside the restricted shell.',
   TRUE, TRUE)
ON CONFLICT (chapter_number) DO UPDATE SET title = EXCLUDED.title, is_hidden = EXCLUDED.is_hidden;

-- ------------------------------------------------------------
-- 4. Levels 13–17
-- ------------------------------------------------------------
INSERT INTO public.levels (id, chapter_id, level_number, order_in_chapter, title, story_context, location_name, is_published)
VALUES
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', 13, 1,
   'Case 01 — The Sequence Protocol',
   'The shell boots into a locked gate. A single prompt blinks: prove you can think in patterns, investigator.',
   'Restricted Shell · Sector 01', TRUE),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', 14, 2,
   'Case 02 — The Liar Paradox',
   'A personnel dossier pings open. Three employees, one stolen secret key — and exactly one of them is telling the truth.',
   'Restricted Shell · Sector 02', TRUE),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000005', 15, 3,
   'Case 03 — The Ghost Export',
   'The audit daemon surfaces a slice of last night''s logs. One of these entries does not belong.',
   'Restricted Shell · Sector 03', TRUE),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000005', 16, 4,
   'Case 04 — The Trust Fall',
   'A vendor claims their padlock icon makes everything safe. The policy manual disagrees.',
   'Restricted Shell · Sector 04', TRUE),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000005', 17, 5,
   'Case 05 — The Phishing Protocol',
   'A message from "your bank" lands in the quarantine queue with ten minutes on the clock. Decide carefully — this one is live.',
   'Restricted Shell · Sector 05', TRUE)
ON CONFLICT (level_number) DO UPDATE SET title = EXCLUDED.title, chapter_id = EXCLUDED.chapter_id;

-- ------------------------------------------------------------
-- 5. Terminal puzzles
-- ------------------------------------------------------------
INSERT INTO public.puzzles (id, level_id, puzzle_type, title, instructions, prompt, config, difficulty, base_points, first_attempt_bonus, no_hints_bonus, max_time_bonus, hint_penalty, max_lives, time_limit_seconds, target_time_seconds, is_published)
VALUES
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000013', 'terminal',
   'The Sequence Protocol',
   'Type help to list commands, ls and cat <file> to inspect the system, and answer <solution> to submit. Hints are limited — spend them wisely.',
   'GATE 01 // LOGICAL REASONING

What number comes next in this sequence?

2, 6, 12, 20, 30, ?

Submit with: answer <number>',
   '{"hostname": "sector01", "cwd": "/home/investigator", "objective": "Open the pattern gate by continuing the numeric sequence.", "files": {"/boot.log": "CRITICAL TERMINAL v2.1 - RESTRICTED SHELL\nSECTOR 01 ONLINE // pattern gate engaged\nClearance: PROVISIONAL // 3 energy seals granted", "/sys/protocol.txt": "PROTOCOL 01: the gate accepts only the correct sequence continuation.\nField note: write down the DIFFERENCE between neighbouring numbers before you answer."}}'::jsonb,
   'easy', 100, 50, 25, 50, 20, 3, NULL, 120, TRUE),

  ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000014', 'terminal',
   'The Liar Paradox',
   'Type help to list commands, cat the witness statements with cat <file>, and answer <suspect> to submit your accusation.',
   'CASE 02 // DEDUCTIVE REASONING

A secret key was stolen. Three employees were questioned:

ALICE:   Bob stole the secret key.
BOB:     Charlie stole the secret key.
CHARLIE: I did not steal the key.

SYSTEM: Exactly ONE person is telling the truth.

Who stole the secret key?

Submit with: answer <name>',
   '{"hostname": "sector02", "cwd": "/home/investigator", "objective": "Identify the thief using the single-truth constraint.", "files": {"/case/brief.txt": "INCIDENT 0x2F - theft of the master secret key\nConstraint from the system audit: exactly ONE statement is TRUE.", "/case/alice.stmt": "ALICE: Bob stole the secret key.", "/case/bob.stmt": "BOB: Charlie stole the secret key.", "/case/charlie.stmt": "CHARLIE: I did not steal the key."}}'::jsonb,
   'medium', 120, 50, 25, 50, 20, 3, NULL, 180, TRUE),

  ('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000015', 'terminal',
   'The Ghost Export',
   'Type help to list commands, cat the log files with cat <file>, and answer <event> to submit. Name the event AND its time if you can.',
   'CASE 03 // EVIDENCE ANALYSIS

Review the intercepted system logs:

[INFO] Login successful: 10:00
[INFO] File accessed: 10:05
[WARNING] Unauthorized export: 10:07
[INFO] User logged out: 10:10

Which event indicates suspicious activity?

Submit with: answer <event>',
   '{"hostname": "sector03", "cwd": "/home/investigator", "objective": "Flag the one log entry that shows a security incident.", "files": {"/logs/auth.log": "[INFO] Login successful: 10:00\n[INFO] File accessed: 10:05\n[WARNING] Unauthorized export: 10:07\n[INFO] User logged out: 10:10", "/notes/analyst.txt": "Rule 1: entries tagged [WARNING] require analyst review.\nRule 2: legitimate user activity never exports data off-system."}}'::jsonb,
   'medium', 140, 50, 25, 50, 20, 3, NULL, 180, TRUE),

  ('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000016', 'terminal',
   'The Trust Fall',
   'Type help to list commands, read the policy notes with cat <file>, and answer <yes|no> to submit your judgement.',
   'CASE 04 // CRITICAL EVALUATION

A website uses HTTPS.

Does that guarantee that the website is safe and trustworthy?

Submit with: answer <yes|no>',
   '{"hostname": "sector04", "cwd": "/home/investigator", "objective": "Judge whether encryption equals legitimacy.", "files": {"/policy/tls.txt": "TRANSPORT POLICY: HTTPS = TLS in transit.\nNOTE: encryption protects the CHANNEL, not the DESTINATION.", "/notes/analyst.txt": "Phishing sites happily serve valid TLS certificates.\nA padlock is not a character reference."}}'::jsonb,
   'hard', 160, 50, 25, 50, 20, 3, NULL, 180, TRUE),

  ('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000017', 'terminal',
   'The Phishing Protocol',
   'Type help to list commands, inspect the evidence with cat <file>, and answer <what you would do> to submit your decision.',
   'CASE 05 // DECISION MAKING

You receive an email that appears to come from your bank.
It asks you to click a link and verify your password immediately,
otherwise your account will be suspended.

What should you do?

Submit with: answer <what you would do>',
   '{"hostname": "sector05", "cwd": "/home/investigator", "objective": "Handle the live phishing attempt without taking the bait.", "files": {"/inbox/bank_notice.eml": "FROM: security@bank-verify-alert.co\nRETURN-PATH: <bounce@mail-verify.top>\nSUBJECT: URGENT - verify your password or your account will be suspended\nBODY: Click the link below within 10 minutes to avoid suspension.\nhttp://bank-verify-alert.co/login", "/security/advisory.txt": "ADVISORY 09: a bank never asks for your password by email.\nADVISORY 10: never follow links from suspicious messages - open the official site yourself or call support."}}'::jsonb,
   'hard', 200, 50, 25, 50, 20, 3, NULL, 240, TRUE)
ON CONFLICT (level_id) DO UPDATE SET title = EXCLUDED.title, config = EXCLUDED.config;

-- ------------------------------------------------------------
-- 6. Answers (validated server-side; never sent to the client)
-- ------------------------------------------------------------
INSERT INTO public.puzzle_answers (puzzle_id, canonical_answer, accepted_variations, validation_mode, explanation)
VALUES
  ('40000000-0000-0000-0000-000000000013', '42', '["forty two"]'::jsonb, 'numeric',
   'The differences between terms are 4, 6, 8, 10, and 12. The next difference is 12, so 30 + 12 = 42.'),

  ('40000000-0000-0000-0000-000000000014', 'bob',
   '["bob stole it", "bob stole the key", "bob stole the secret key", "bob is the thief", "the thief is bob", "bob is guilty", "bob did it"]'::jsonb,
   'exact_insensitive',
   'Alice''s statement is true. Bob''s statement is false. Charlie''s statement is false. Only one person is telling the truth, so Bob is guilty.'),

  ('40000000-0000-0000-0000-000000000015', 'Unauthorized export at 10:07',
   '["unauthorized|illegal|suspicious|warning", "export|10:07"]'::jsonb, 'keywords',
   'Exporting data without authorization is suspicious and requires further investigation.'),

  ('40000000-0000-0000-0000-000000000016', 'no',
   '["false", "no it does not", "no it doesnt", "not necessarily", "no it does not guarantee", "nope", "no it only encrypts", "no not really"]'::jsonb,
   'exact_insensitive',
   'HTTPS encrypts communication between the browser and server, but it does not guarantee that the website itself is legitimate or trustworthy.'),

  ('40000000-0000-0000-0000-000000000017', 'Do not click the link. Visit the bank''s official website independently or contact official support.',
   '["do not|dont|never|no|ignore|avoid|phishing|suspicious|report|delete|yourself|independently|myself|refuse", "official|website|support|call|visit|trusted|site|contact|type|manually|independently"]'::jsonb,
   'keywords',
   'This could be a phishing attack. Always verify suspicious requests through trusted communication channels.')
ON CONFLICT (puzzle_id) DO UPDATE SET
  canonical_answer = EXCLUDED.canonical_answer,
  accepted_variations = EXCLUDED.accepted_variations,
  validation_mode = EXCLUDED.validation_mode,
  explanation = EXCLUDED.explanation;

-- ------------------------------------------------------------
-- 7. Progressive hints (limited: 2 per challenge)
-- ------------------------------------------------------------
INSERT INTO public.puzzle_hints (puzzle_id, hint_order, hint_text, penalty_override)
VALUES
  ('40000000-0000-0000-0000-000000000013', 1, 'Subtract each term from the next one and record the gaps.', 20),
  ('40000000-0000-0000-0000-000000000013', 2, 'The gaps grow by 2 each time: 4, 6, 8, 10 — so the next gap is 12.', 20),

  ('40000000-0000-0000-0000-000000000014', 1, 'Test each suspect in turn: assume they are the liar and count how many statements stay true.', 20),
  ('40000000-0000-0000-0000-000000000014', 2, 'Exactly ONE statement may be true. If two statements hold for a suspect, that suspect cannot be the answer.', 20),

  ('40000000-0000-0000-0000-000000000015', 1, 'One log entry does not carry the [INFO] tag — start there.', 20),
  ('40000000-0000-0000-0000-000000000015', 2, 'Data leaving the system without permission is the red flag: name that event and its time.', 20),

  ('40000000-0000-0000-0000-000000000016', 1, 'Ask what HTTPS actually protects — the connection, or the people running the site?', 20),
  ('40000000-0000-0000-0000-000000000016', 2, 'Encryption is about privacy in transit; legitimacy is a separate question.', 20),

  ('40000000-0000-0000-0000-000000000017', 1, 'Check the sender domain and the manufactured urgency — what kind of attack does this pattern match?', 20),
  ('40000000-0000-0000-0000-000000000017', 2, 'The safe move has two parts: refuse the link, then verify through a channel you already trust.', 20)
ON CONFLICT (puzzle_id, hint_order) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- ------------------------------------------------------------
-- 8. Backfill: players who already cleared Chapter 4
-- ------------------------------------------------------------
-- Before this migration existed, completing level 12 created no progress row
-- for level 13 (it didn't exist yet). Without this backfill those players
-- would see Chapter 5 appear but find its first level permanently locked.
INSERT INTO public.player_progress (user_id, level_id, status, lives_remaining)
SELECT done.user_id,
       lvl.id,
       'unlocked',
       pz.max_lives
FROM (
  -- Every player who has fully cleared Chapter 4 (levels 10-12).
  SELECT pp.user_id
  FROM public.player_progress pp
  JOIN public.levels l ON l.id = pp.level_id
  WHERE l.chapter_id = '20000000-0000-0000-0000-000000000004'
    AND pp.status = 'completed'
  GROUP BY pp.user_id
  HAVING COUNT(*) = (
    SELECT COUNT(*) FROM public.levels WHERE chapter_id = '20000000-0000-0000-0000-000000000004'
  )
) done
JOIN public.levels lvl
  ON lvl.id = '30000000-0000-0000-0000-000000000013'
JOIN public.puzzles pz
  ON pz.level_id = lvl.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.player_progress existing
  WHERE existing.user_id = done.user_id
    AND existing.level_id = lvl.id
)
ON CONFLICT (user_id, level_id) DO NOTHING;
