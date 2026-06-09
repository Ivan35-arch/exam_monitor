-- =============================================================
-- ExamMonitor — Seed Data
-- Derived from: Strathmore November 2025 End of Semester Timetable
-- Run AFTER init.sql:
--   psql -U postgres -d exammonitor -f database/seed.sql
-- =============================================================

-- ── Roles ────────────────────────────────────────────────────
INSERT INTO roles (role_name) VALUES
    ('student'),
    ('faculty_admin'),
    ('super_admin')
ON CONFLICT (role_name) DO NOTHING;

-- ── Courses (degree programmes) ───────────────────────────────
INSERT INTO courses (course_code, course_name) VALUES
    ('BCOM',    'Bachelor of Commerce'),
    ('BBIT',    'Bachelor of Business Information Technology'),
    ('ICS',     'Bachelor of Science in Informatics and Computer Science'),
    ('CNS',     'Computer Networks and Cybersecurity'),
    ('SDS',     'Bachelor of Science in Statistics and Data Science'),
    ('ACT',     'Bachelor of Business Science: Actuarial Science'),
    ('FENG',    'Bachelor of Business Science: Financial Engineering'),
    ('FE',      'Bachelor of Business Science: Financial Economics'),
    ('BFS',     'Bachelor of Financial Services'),
    ('BSCM',    'Bachelor of Science in Supply Chain and Operations Management'),
    ('BHM',     'Bachelor of Science in Hospitality'),
    ('BTM',     'Bachelor of Tourism Management'),
    ('BTH',     'Bachelor of Tourism and Hospitality'),
    ('AFFE',    'Actuarial Science / Financial Engineering / Financial Economics Year 1'),
    ('CROSS',   'Cross-Programme / Shared Groups')
ON CONFLICT (course_code) DO NOTHING;

-- ── Groups ────────────────────────────────────────────────────
-- FIX: cast the first yr value in every VALUES block to ::SMALLINT
-- so Postgres types the column correctly. NULL values use NULL::SMALLINT.

-- ── BCOM ─────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BCOM 1A Aug - Nov 25',  1::SMALLINT),
    ('BCOM 1B Aug - Nov 25',  1),
    ('BCOM 1C Aug - Nov 25',  1),
    ('BCOM 2Aug-Nov 25 Gr A', 2),
    ('BCOM 2Aug-Nov 25 Gr B', 2),
    ('BCOM 2Aug-Nov 25 Gr C', 2),
    ('BCOM 2Aug-Nov 25 Gr D', 2),
    ('BCOM 2Aug-Nov 25 Gr E', 2),
    ('BCOM 2Aug-Nov 25 Gr F', 2),
    ('BCOM 3 Aug - Nov A 25', 3),
    ('BCOM 3 Aug - Nov B 25', 3),
    ('BCOM 3 Aug - Nov C 25', 3),
    ('BCOM 3 Aug - Nov D 25', 3),
    ('BCOM 3 Aug - Nov E 25', 3),
    ('BCOM 3 Aug - Nov F 25', 3),
    ('BCOM 3 Aug-Nov A 25',   3),
    ('BCOM 3 Aug-Nov B 25',   3),
    ('BCOM 3 Aug-Nov 25',     3),
    ('BCOM 4 Aug-Nov 25',     4),
    ('BCOM 4A Aug-Nov 25',    4),
    ('BCOM 4B Aug-Nov 25',    4),
    ('BCOM 4C Aug-Nov 25',    4),
    ('BCOM 4D Aug-Nov 25',    4),
    ('BCOM 4E Aug-Nov 25',    4),
    ('BCOM 4F Aug-Nov 25',    4),
    ('BCOM 4Aug-Nov 25 A',    4),
    ('BCOM 4Aug-Dec 25 B',    4),
    ('BCOM 4 Aug-Dec 25 FT',  4),
    ('BCOM 4 Aug - Nov 25FT', 4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BCOM'
ON CONFLICT (group_name) DO NOTHING;

-- ── BBIT ─────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BBIT 1.2A 25',           1::SMALLINT),
    ('BBIT 1.2B 25',           1),
    ('BBIT 2.2A Aug - Dec 25', 2),
    ('BBIT 2.2B Aug - Dec 25', 2),
    ('BBIT 2.2C Aug - Dec 25', 2),
    ('BBIT 2.2D Aug - Dec 25', 2),
    ('BBIT 2.2E Aug - Dec 25', 2),
    ('BBIT 3.2A Aug - Dec 25', 3),
    ('BBIT 3.2B Aug - Dec 25', 3),
    ('BBIT 3.2C Aug - Dec 25', 3),
    ('BBIT 3.2D Aug - Dec 25', 3),
    ('BBIT 4.2A Aug-Dec 25',   4),
    ('BBIT 4.2B Aug-Dec 25',   4),
    ('BBIT 4.2C Aug-Dec 25',   4),
    ('BBIT 4.2 Aug-Dec 25',    4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BBIT'
ON CONFLICT (group_name) DO NOTHING;

-- ── ICS ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('ICS 1.2A Aug 25',           1::SMALLINT),
    ('ICS 1.2B Aug 25',           1),
    ('ICS 2.2A Aug 2025',         2),
    ('ICS 2.2B Aug 2025',         2),
    ('ICS 2.2C Aug 2025',         2),
    ('ICS 2.2D Aug 2025',         2),
    ('ICS 2.2E Aug 2025',         2),
    ('ICS 2.2F Aug 2025',         2),
    ('ICS 3.2A Aug 2025',         3),
    ('ICS 3.2B Aug 2025',         3),
    ('ICS 3.2C Aug 2025',         3),
    ('ICS 3.2D Aug 2025',         3),
    ('ICS 3.2E Aug 2025',         3),
    ('ICS 4.2A Aug 2025',         4),
    ('ICS 4.2B Aug 2025',         4),
    ('ICS 4.2C Aug 2025',         4),
    ('ICS 4.2D Aug 2025',         4),
    ('ICS 4.2E Aug 2025',         4),
    ('ICS 4.2A Aug 2025+Old Syll',4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'ICS'
ON CONFLICT (group_name) DO NOTHING;

-- ── CNS ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('CNS 1 Aug 25',        1::SMALLINT),
    ('CNS 1 Aug 25+Rpt',    1),
    ('CNS 2A Aug 2025',     2),
    ('CNS 2B Aug 2025',     2),
    ('CNS 2.2A Aug 2025',   2),
    ('CNS 2.2B Aug 2025',   2),
    ('CNS 3 Aug 2025',      3),
    ('CNS 3+BTC Aug 2025',  3),
    ('CNS 3 Aug 2025+BTC',  3),
    ('CNS 4 Aug 2025',      4),
    ('CNS 4+BTC Aug 2025',  4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'CNS'
ON CONFLICT (group_name) DO NOTHING;

-- ── SDS ──────────────────────────────────────────────────────
-- All NULL years — cast required to avoid text inference
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('SDS A Aug Nov 2025',   NULL::SMALLINT),
    ('SDS B Aug Nov 2025',   NULL),
    ('Bsc.SDS Aug Nov 2025', NULL),
    ('BSc.SDS Aug-Nov 2025', NULL),
    ('Bsc.SDS Aug-Nov 2025', NULL),
    ('BSc.SDS Aug Nov 2025', NULL)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'SDS'
ON CONFLICT (group_name) DO NOTHING;

-- ── ACT ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('ACT 2 Aug - Nov 25',      2::SMALLINT),
    ('ACT 3 Aug-Nov 25',        3),
    ('ACT4 Aug-Nov 25',         4),
    ('ACT Aug-Nov 25',          NULL),
    ('ACT/FENG 2 Aug - Nov 25', 2),
    ('ACT/FENG3 Aug - Nov 25',  3),
    ('ACT/FENG4 Aug - Nov 25',  4),
    ('ACT/FENG 4 Aug - Nov 25', 4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'ACT'
ON CONFLICT (group_name) DO NOTHING;

-- ── FENG ─────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('FENG 2 Aug - Nov 25',  2::SMALLINT),
    ('FENG3 Aug - Nov 25',   3),
    ('FENG3 Aug-Nov 25',     3),
    ('FENG4 Aug - Nov 2025', 4),
    ('FENG4 Aug - Nov 25',   4),
    ('FENG Aug-Nov 25',      NULL)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'FENG'
ON CONFLICT (group_name) DO NOTHING;

-- ── FE ───────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('FE 2 Aug - Nov 25',   2::SMALLINT),
    ('FE 2 Aug - Nov25',    2),
    ('FE3 Aug - Nov 25',    3),
    ('FE3 Aug-Nov 25',      3),
    ('FE3 Aug - Nov 2025',  3),
    ('FE4 Aug - Nov 2025',  4),
    ('FE4 Aug - Nov 25',    4),
    ('FE 4 Aug - Nov 25',   4),
    ('FE Aug-Nov 25',       NULL)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'FE'
ON CONFLICT (group_name) DO NOTHING;

-- ── BFS ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BFS 1 Aug - Nov 25',  1::SMALLINT),
    ('BFS 1 Aug-Nov 2025',  1),
    ('BFS 2Aug-Nov 25',     2),
    ('BFS 2 Aug-Nov 25',    2),
    ('BFS 3 Aug - Nov 25',  3),
    ('BFS 4 Aug-Nov 25',    4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BFS'
ON CONFLICT (group_name) DO NOTHING;

-- ── BSCM ─────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BSCM 1 Aug - Nov25',   1::SMALLINT),
    ('BSCM 2 Aug-Nov 25',    2),
    ('BSCM 3 Aug-Nov 25',    3),
    ('BSCM 3 Aug-Nov 2025',  3),
    ('BSCM 4 Aug-Dec 25',    4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BSCM'
ON CONFLICT (group_name) DO NOTHING;

-- ── BHM ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BHM 2 Aug - Nov 25',  2::SMALLINT),
    ('BHM 2 Aug-Nov 2025',  2),
    ('BHM 3 Aug-Nov 2025',  3),
    ('BHM 3 Aug-Nov 25',    3)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BHM'
ON CONFLICT (group_name) DO NOTHING;

-- ── BTM ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BTM 2Aug - Nov 25',   2::SMALLINT),
    ('BTM 3 Aug-Nov 25',    3),
    ('BTM 2/3 Aug-Nov 25',  NULL)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BTM'
ON CONFLICT (group_name) DO NOTHING;

-- ── BTH ──────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('BTH 2 Aug - Nov 25',  2::SMALLINT),
    ('BTH 3 Aug-Nov 25',    3),
    ('BTH 3 Aug-Nov 2025',  3),
    ('BTH 3 Aug-Nov25',     3),
    ('BTH 4 Aug - Nov 25',  4),
    ('BTH 4 Aug-Nov25',     4)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'BTH'
ON CONFLICT (group_name) DO NOTHING;

-- ── AFFE ─────────────────────────────────────────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('AFFE 1 Aug Nov 2025', 1::SMALLINT),
    ('AFFE 1 Aug Dec 2025', 1)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'AFFE'
ON CONFLICT (group_name) DO NOTHING;

-- ── CROSS (shared / language / ethics groups) ─────────────────
INSERT INTO groups (course_id, group_name, year_of_study)
SELECT c.course_id, g.group_name, g.yr
FROM (VALUES
    ('Aug 25 BCOM A',          NULL::SMALLINT),
    ('Aug 25 BCOM B',          NULL),
    ('Aug 25 BCOM C',          NULL),
    ('Aug 25 BCOM D',          NULL),
    ('Aug 25 BCOM E',          NULL),
    ('Aug 25 BCOM F',          NULL),
    ('Aug 25 BFS/ BTH',        NULL),
    ('Aug 25 BBIT A',          NULL),
    ('Aug 25 BBIT B',          NULL),
    ('Aug 25 BBIT C',          NULL),
    ('Aug 25 BBIT D',          NULL),
    ('Aug 25 BBIT E',          NULL),
    ('Aug 25 ICS A',           NULL),
    ('Aug 25 ICS B',           NULL),
    ('Aug 25 CNS',             NULL),
    ('Aug 25 Bsc. SDS',        NULL),
    ('Aug 25 BFS/BSCM',        NULL),
    ('Aug 25 ACT/FEN/FE',      NULL),
    ('Aug 25 SUBS',            NULL),
    ('Aug 25 SIMS+SCES',       NULL),
    ('Aug 25 STH /All SCH',    NULL),
    ('Aug 25 SUBS A',          NULL),
    ('Aug 25 SUBS B',          NULL),
    ('Aug 25 SUBS C',          NULL),
    ('Aug 25 SUBS C/D',        NULL),
    ('Aug 25 SUBS A/SIMS',     NULL),
    ('Aug 25 SUBS/SIMS/SCES',  NULL),
    ('Aug 25 SCES A',          NULL),
    ('Aug 25 SCES B',          NULL),
    ('Aug 25 SCES C',          NULL),
    ('Aug 25 SCES D',          NULL),
    ('Aug 25 SCES C/SIMS',     NULL),
    ('Aug 25 SCES D/SIMS',     NULL),
    ('Aug 25 SCES New',        NULL),
    ('Aug 25 SIMS',            NULL),
    ('Aug 25 SIMS/STH',        NULL),
    ('Aug 25 SCH A',           NULL),
    ('Aug 25 SCH B',           NULL),
    ('Aug 25 BHM/BTM',         NULL),
    ('Aug 25 Group VI',        NULL)
) AS g(group_name, yr)
JOIN courses c ON c.course_code = 'CROSS'
ON CONFLICT (group_name) DO NOTHING;

-- =============================================================
-- Done. Approximate totals:
--   Roles:    3
--   Courses:  15
--   Groups:  ~125 (after dedup via ON CONFLICT)
-- =============================================================
