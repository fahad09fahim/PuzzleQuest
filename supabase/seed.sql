INSERT INTO public.achievements (id, slug, title, description, icon_name, badge_color, points_reward)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'first_step', 'First Step', 'Complete your very first puzzle inside the Forgotten Gateway.', 'Footprints', 'cyan', 25),
  ('10000000-0000-0000-0000-000000000002', 'brain_starter', 'Brain Starter', 'Successfully solve five distinct puzzle chambers.', 'Brain', 'purple', 50),
  ('10000000-0000-0000-0000-000000000003', 'perfect_mind', 'Perfect Mind', 'Solve a puzzle with zero hints revealed.', 'Sparkles', 'emerald', 50),
  ('10000000-0000-0000-0000-000000000004', 'speed_solver', 'Speed Solver', 'Conquer a timed puzzle within its target par time.', 'Zap', 'amber', 75),
  ('10000000-0000-0000-0000-000000000005', 'chapter_master', 'Chapter Master', 'Complete every level within an entire chapter.', 'Crown', 'purple', 100),
  ('10000000-0000-0000-0000-000000000006', 'puzzle_legend', 'Puzzle Legend', 'Complete all 12 chambers and awaken the Astral Core.', 'Trophy', 'cyan', 250)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO public.chapters (id, chapter_number, title, subtitle, story_intro, description, theme, difficulty, reward_title, reward_description, is_published)
VALUES
  ('20000000-0000-0000-0000-000000000001', 1, 'The Forgotten Gateway', 'Echoes Beneath the Sunken Archway', 'Beneath a shattered observatory in the Whispering Wastes, you uncover a basalt archway sealed for three millennia.', 'Master foundational riddles, celestial arithmetic, and elemental sequences.', 'Ancient Sunken Ruins', 'easy', 'Keystone of Awakening', 'Grants passage into the Archive of Whispers.', TRUE),
  ('20000000-0000-0000-0000-000000000002', 2, 'The Hidden Code', 'Vaults of the Silent Archivists', 'Beyond the gateway lies an underground scriptorium filled with rotating brass cylinders and encrypted scrolls.', 'Decode shifted alphabets, unscramble ancient lexicon seals, and match spectral relics.', 'Arcane Scriptorium', 'medium', 'Cipher Lens of Aethel', 'Reveals hidden inscriptions inside the Inner Sanctum.', TRUE),
  ('20000000-0000-0000-0000-000000000003', 3, 'The Mind Trap', 'Labyrinth of Mirrors & Paradoxes', 'Three spectral wardens guard the Hall of Paradoxes, challenging your deductive reasoning and pattern synthesis.', 'Outsmart deductive paradoxes, decode visual matrix runes, and inspect hidden clues.', 'Astral Mirror Labyrinth', 'hard', 'Prism of Clarity', 'Dispels the illusions shielding the Astral Core.', TRUE),
  ('20000000-0000-0000-0000-000000000004', 4, 'The Final Mystery', 'Heart of the Astral Engine', 'You stand before the Astral Engine—a colossal crystalline machine built to preserve human wisdom across ages.', 'Conquer expert cryptography, a three-stage vault override, and the Singularity synthesis.', 'Crystalline Astral Core', 'expert', 'Sovereign of Aethelgard', 'Full mastery of the PuzzleQuest Chronicles.', TRUE)
ON CONFLICT (chapter_number) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.levels (id, chapter_id, level_number, order_in_chapter, title, story_context, location_name, is_published)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 1, 'The Sentinel''s Whisper', 'A stone guardian carved into the archway speaks in a voice like grinding tectonic plates.', 'Threshold of Mist', TRUE),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2, 2, 'The Astral Sundial', 'Three brass rings align beneath a shaft of starlight.', 'Chamber of Starlight', TRUE),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 3, 3, 'Pillars of Progression', 'Five obelisks rise from an obsidian pool, each engraved with a growing rune count.', 'Bridge of Echoes', TRUE),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 4, 1, 'The Shifted Scroll', 'A parchment sealed with imperial wax contains a Caesar-shifted command.', 'Scriptorium Alcove', TRUE),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 5, 2, 'The Shattered Lexicon', 'Magnetic rune tiles lie scattered across an altar table.', 'Hall of Glyphs', TRUE),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 6, 3, 'Memory of the Ancients', 'Twelve obsidian tablets flip in unison, concealing six paired astral sigils.', 'Vault of Reflection', TRUE),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 7, 1, 'The Three Wardens', 'Three spectral judges guard the obsidian doors.', 'Tribunal of Shadows', TRUE),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 8, 2, 'The Geometric Matrix', 'A 3x3 grid of shifting celestial symbols governs the magnetic lock.', 'Orrery of Symmetry', TRUE),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003', 9, 3, 'The Alchemist''s Study', 'The Grand Alchemist vanished mid-experiment. Inspect the objects in his study.', 'Sanctum of Clues', TRUE),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004', 10, 1, 'The Shadow Cryptogram', 'An intercepted transmission uses a scrambled alphabet cipher.', 'Conduit of Whispers', TRUE),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', 11, 2, 'The Tri-Seal Override', 'Three interconnected security mechanisms protect the Astral Core.', 'Core Antechamber', TRUE),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000004', 12, 3, 'The Astral Singularity', 'The final console hums with raw starlight.', 'Heart of the Astral Engine', TRUE)
ON CONFLICT (level_number) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.puzzles (id, level_id, puzzle_type, title, instructions, prompt, config, difficulty, base_points, first_attempt_bonus, no_hints_bonus, max_time_bonus, hint_penalty, max_lives, time_limit_seconds, target_time_seconds, is_published)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'riddle', 'Riddle of the Silent Voice', 'Enter the single English word that answers the riddle.', 'I speak without a mouth and hear without ears. I have no body, yet I come alive with the wind. What am I?', '{"placeholder": "Enter a single word..."}'::jsonb, 'easy', 100, 50, 25, 50, 20, 4, NULL, 60, TRUE),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'math', 'Harmonic Sundial Equation', 'Solve the equation and enter the exact integer value.', 'The Inner Ring holds 14 teeth, the Middle Ring multiplies that count by 3, and the Outer Ring adds the square of 5. Subtract the 7 wandering stars.', '{"formulaDisplay": "(14 × 3) + 5² - 7 = ?"}'::jsonb, 'easy', 100, 50, 25, 50, 20, 4, NULL, 90, TRUE),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'sequence', 'Obelisk Number Progression', 'Compute the missing sixth number in the sequence.', 'Each pillar increases by a growing prime step: 3, 5, 8, 13, 20, ?', '{"sequence": [3, 5, 8, 13, 20, null]}'::jsonb, 'easy', 100, 50, 25, 50, 20, 3, NULL, 90, TRUE),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'caesar_cipher', 'The Archivist''s Caesar Seal', 'Shift the encrypted text backward by 4 letters (Shift -4).', 'Encrypted Inscription: "WXYVCS MR XLI ZEYPX"', '{"ciphertext": "WXYVCS MR XLI ZEYPX"}'::jsonb, 'medium', 120, 50, 25, 50, 20, 3, 240, 120, TRUE),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'word', 'Anagram of the Observatory', 'Click the scrambled rune tiles in order to form the 9-letter astronomical instrument.', 'Rearrange all 9 letters: L A B E R S T O A', '{"scrambledLetters": ["L", "A", "B", "E", "R", "S", "T", "O", "A"]}'::jsonb, 'medium', 120, 50, 25, 50, 20, 3, NULL, 120, TRUE),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'memory', 'Tablets of Astral Symmetry', 'Flip two tablets at a time to match all 6 sacred relic pairs.', 'Synchronize all 6 paired celestial relics.', '{"pairs": [{"id": "sun", "label": "Solar Crest", "symbol": "☀️"}, {"id": "moon", "label": "Lunar Crescent", "symbol": "🌙"}, {"id": "star", "label": "North Star", "symbol": "✨"}, {"id": "compass", "label": "Aether Compass", "symbol": "🧭"}, {"id": "key", "label": "Vault Key", "symbol": "🗝️"}, {"id": "crystal", "label": "Astral Shard", "symbol": "💎"}], "completionToken": "MEM_SYNC_6_PAIRS_VERIFIED"}'::jsonb, 'medium', 130, 50, 25, 50, 20, 4, 180, 75, TRUE),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', 'multiple_choice', 'Trial of the Three Wardens', 'Exactly ONE sign is TRUE, and two are FALSE. Select the safe door.', 'Crimson: "The treasure is behind this door."
Azure: "The treasure is NOT behind the Crimson door."
Emerald: "The treasure is NOT behind this door."', '{"options": [{"id": "crimson", "label": "Crimson Door"}, {"id": "azure", "label": "Azure Door"}, {"id": "emerald", "label": "Emerald Door"}]}'::jsonb, 'hard', 150, 50, 25, 50, 20, 2, 180, 90, TRUE),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', 'pattern', 'The Celestial Matrix', 'Each row has ▲, ●, ◆ and dots summing to 6. Select the missing cell.', 'Determine cell [Row 3, Col 3].', '{"grid": [["▲ (1)", "● (2)", "◆ (3)"], ["● (3)", "◆ (1)", "▲ (2)"], ["◆ (2)", "▲ (3)", "?"]], "choices": [{"id": "circle-1", "label": "● (1) — Circle with 1 Dot"}, {"id": "circle-2", "label": "● (2) — Circle with 2 Dots"}, {"id": "diamond-1", "label": "◆ (1) — Diamond with 1 Dot"}, {"id": "triangle-1", "label": "▲ (1) — Triangle with 1 Dot"}]}'::jsonb, 'hard', 150, 50, 25, 50, 20, 2, 180, 90, TRUE),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', 'hidden_clues', 'The Alchemist''s Locked Study', 'Inspect all 4 hotspots and combine digits in order: Dawn → Noon → Dusk → Midnight.', 'Find the 4-digit vault code.', '{"hotspots": [{"id": "painting", "name": "Astrolabe Painting", "icon": "Compass", "x": 22, "y": 30, "clue": "At DAWN, twin moons rose over 7 spires."}, {"id": "bookshelf", "name": "Alchemy Ledger", "icon": "BookOpen", "x": 74, "y": 28, "clue": "At NOON, 3 vials remained."}, {"id": "desk", "name": "Brass Pendulum", "icon": "Clock", "x": 35, "y": 68, "clue": "At DUSK, the pendulum struck 9 times."}, {"id": "chest", "name": "Obsidian Reliquary", "icon": "KeyRound", "x": 76, "y": 72, "clue": "At MIDNIGHT, 4 guardians sealed the gate."}]}'::jsonb, 'hard', 160, 50, 25, 50, 20, 3, 240, 120, TRUE),
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', 'substitution_cipher', 'The Architect''s Substitution Scroll', 'Decode the 5-letter celestial word using the known cipher mappings.', 'Ciphertext: "K R Y V X" (means "of the stars")', '{"ciphertext": "K R Y V X", "knownMap": {"K": "A", "R": "S", "V": "R", "X": "A"}}'::jsonb, 'expert', 180, 50, 25, 50, 20, 3, 240, 120, TRUE),
  ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011', 'multi_step', 'The Tri-Seal Core Override', 'Solve all three security stages to disengage the core clamps.', 'Complete Stages I, II, and III.', '{"steps": [{"stepNumber": 1, "title": "Stage I — Prime Factor Lock", "prompt": "What is the largest prime factor of 91?", "placeholder": "Integer..."}, {"stepNumber": 2, "title": "Stage II — Binary Gate", "prompt": "Convert binary 10110 into decimal.", "placeholder": "Decimal..."}, {"stepNumber": 3, "title": "Stage III — Harmonic Word", "prompt": "Clockwise compass initials starting from North (4 letters).", "placeholder": "4 letters..."}]}'::jsonb, 'expert', 200, 50, 25, 50, 20, 3, 300, 150, TRUE),
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000012', 'logic', 'The Astral Singularity Paradox', 'Solve the system of equations for the 3-digit code ABC.', '1. A + B + C = 15
2. C = 2A
3. B = A + 3', '{"equations": ["A + B + C = 15", "C = 2A", "B = A + 3"], "placeholder": "Enter 3-digit code ABC..."}'::jsonb, 'expert', 250, 75, 50, 75, 25, 3, 300, 150, TRUE)
ON CONFLICT (level_id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.puzzle_answers (puzzle_id, canonical_answer, accepted_variations, validation_mode, explanation)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'echo', '["an echo", "echoes"]'::jsonb, 'exact_insensitive', 'An echo speaks back without a mouth and travels on waves through the air.'),
  ('40000000-0000-0000-0000-000000000002', '60', '[]'::jsonb, 'numeric', '(14 × 3) + 25 - 7 = 60.'),
  ('40000000-0000-0000-0000-000000000003', '31', '[]'::jsonb, 'numeric', 'Differences are consecutive primes (+2, +3, +5, +7, +11) -> 20 + 11 = 31.'),
  ('40000000-0000-0000-0000-000000000004', 'STARGATE IN THE VAULT', '["stargate in the vault"]'::jsonb, 'exact_insensitive', 'Caesar shift -4 decodes WXYVCS MR XLI ZEYPX to STARGATE IN THE VAULT.'),
  ('40000000-0000-0000-0000-000000000005', 'ASTROLABE', '["astrolabe"]'::jsonb, 'exact_insensitive', 'L-A-B-E-R-S-T-O-A rearranges to ASTROLABE.'),
  ('40000000-0000-0000-0000-000000000006', 'MEM_SYNC_6_PAIRS_VERIFIED', '[]'::jsonb, 'memory_token', 'All 6 pairs of celestial relics synchronized.'),
  ('40000000-0000-0000-0000-000000000007', 'emerald', '["emerald door"]'::jsonb, 'exact_insensitive', 'Only when the treasure is behind Emerald is exactly one sign (Azure) true.'),
  ('40000000-0000-0000-0000-000000000008', 'circle-1', '["● (1)"]'::jsonb, 'exact_insensitive', 'Missing shape in row 3 is ● and 6 - 2 - 3 = 1 dot.'),
  ('40000000-0000-0000-0000-000000000009', '7394', '["7-3-9-4"]'::jsonb, 'exact_insensitive', 'Dawn (7), Noon (3), Dusk (9), Midnight (4) = 7394.'),
  ('40000000-0000-0000-0000-000000000010', 'ASTRA', '["astra"]'::jsonb, 'exact_insensitive', 'KRYVX decodes to ASTRA.'),
  ('40000000-0000-0000-0000-000000000011', '["13","22","NESW"]', '[]'::jsonb, 'json_steps', '91 = 7×13; 10110₂ = 22; Compass clockwise = NESW.'),
  ('40000000-0000-0000-0000-000000000012', '366', '[]'::jsonb, 'numeric', 'A=3, B=6, C=6 -> 366.')
ON CONFLICT (puzzle_id) DO UPDATE SET canonical_answer = EXCLUDED.canonical_answer;

INSERT INTO public.puzzle_hints (puzzle_id, hint_order, hint_text)
VALUES
  ('40000000-0000-0000-0000-000000000001', 1, 'Shout into a canyon and this phenomenon answers back.'),
  ('40000000-0000-0000-0000-000000000001', 2, 'A 4-letter word starting with E.'),
  ('40000000-0000-0000-0000-000000000002', 1, '14 × 3 = 42, and 5² = 25.'),
  ('40000000-0000-0000-0000-000000000002', 2, '42 + 25 - 7 = 60.'),
  ('40000000-0000-0000-0000-000000000003', 1, 'Gaps are 2, 3, 5, 7 (prime numbers).'),
  ('40000000-0000-0000-0000-000000000003', 2, 'Add the next prime (11) to 20.'),
  ('40000000-0000-0000-0000-000000000004', 1, 'Slide the Caesar preview wheel to -4.'),
  ('40000000-0000-0000-0000-000000000005', 1, 'Starts with ASTRO- and ends with -LABE.'),
  ('40000000-0000-0000-0000-000000000006', 1, 'Reveal cards row by row to memorize positions.'),
  ('40000000-0000-0000-0000-000000000007', 1, 'Assume each door has the treasure and count true statements.'),
  ('40000000-0000-0000-0000-000000000008', 1, 'Row 3 has ◆ and ▲; it needs ● with 1 dot.'),
  ('40000000-0000-0000-0000-000000000009', 1, 'Click all 4 glowing hotspots and order Dawn -> Noon -> Dusk -> Midnight.'),
  ('40000000-0000-0000-0000-000000000010', 1, 'Fill known letters: A S _ R A.'),
  ('40000000-0000-0000-0000-000000000011', 1, '91 = 7 × 13; 10110 in binary = 16 + 4 + 2.'),
  ('40000000-0000-0000-0000-000000000012', 1, 'Substitute B = A + 3 and C = 2A into A + B + C = 15.')
ON CONFLICT (puzzle_id, hint_order) DO UPDATE SET hint_text = EXCLUDED.hint_text;
