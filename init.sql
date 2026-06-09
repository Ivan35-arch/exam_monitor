-- =============================================================
-- ExamMonitor — Database Schema
-- Run against: exammonitor (PostgreSQL)
-- Usage: psql -U postgres -d exammonitor -f init.sql
-- =============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. roles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    role_id     SERIAL PRIMARY KEY,
    role_name   VARCHAR(50) UNIQUE NOT NULL,   -- 'student' | 'faculty_admin' | 'super_admin'
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    role_id       INT                 NOT NULL REFERENCES roles(role_id),
    is_active     BOOLEAN             DEFAULT TRUE,
    created_at    TIMESTAMPTZ         DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         DEFAULT NOW()
);

-- ── 3. students ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    student_id   SERIAL PRIMARY KEY,
    user_id      INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_no   VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 123456/2023
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. faculty_admins ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_admins (
    admin_id     SERIAL PRIMARY KEY,
    user_id      INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name    VARCHAR(200) NOT NULL,
    department   VARCHAR(100),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. courses ───────────────────────────────────────────────
-- Represents degree programmes (BBIT, ICS, BCOM, etc.)
CREATE TABLE IF NOT EXISTS courses (
    course_id    SERIAL PRIMARY KEY,
    course_code  VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 'BBIT', 'ICS', 'BCOM'
    course_name  VARCHAR(200)       NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. groups ────────────────────────────────────────────────
-- Represents class sections (BBIT 3.2A, ICS 2.2C, SDS A, etc.)
CREATE TABLE IF NOT EXISTS groups (
    group_id     SERIAL PRIMARY KEY,
    course_id    INT          NOT NULL REFERENCES courses(course_id),
    group_name   VARCHAR(50) UNIQUE NOT NULL,   -- raw name as it appears in PDF
    year_of_study SMALLINT,                     -- 1–4, NULL for cross-year groups
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. student_registrations ─────────────────────────────────
-- A student can be registered in multiple course+group combinations
-- (e.g. retakes, cross-programme units)
CREATE TABLE IF NOT EXISTS student_registrations (
    registration_id SERIAL PRIMARY KEY,
    student_id      INT          NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id       INT          NOT NULL REFERENCES courses(course_id),
    group_id        INT          NOT NULL REFERENCES groups(group_id),
    academic_year   VARCHAR(20)  NOT NULL,   -- e.g. 'Aug-Nov 2025'
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (student_id, course_id, group_id, academic_year)
);

-- ── 8. official_timetables ───────────────────────────────────
CREATE TABLE IF NOT EXISTS official_timetables (
    timetable_id   SERIAL PRIMARY KEY,
    admin_id       INT          NOT NULL REFERENCES faculty_admins(admin_id),
    title          VARCHAR(200) NOT NULL,   -- e.g. 'November 2025 End of Semester'
    semester       VARCHAR(50),
    academic_year  VARCHAR(20),
    file_path      VARCHAR(500),            -- stored path of uploaded PDF
    status         VARCHAR(20)  NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','published','archived')),
    uploaded_at    TIMESTAMPTZ  DEFAULT NOW(),
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 9. exam_entries ──────────────────────────────────────────
-- One row per (timetable, unit, group) combination parsed from PDF
CREATE TABLE IF NOT EXISTS exam_entries (
    exam_id          SERIAL PRIMARY KEY,
    timetable_id     INT          NOT NULL REFERENCES official_timetables(timetable_id) ON DELETE CASCADE,
    course_id        INT          NOT NULL REFERENCES courses(course_id),
    group_id         INT          NOT NULL REFERENCES groups(group_id),
    unit_code        VARCHAR(20)  NOT NULL,   -- e.g. 'ICS 2201'
    unit_name        VARCHAR(300) NOT NULL,   -- e.g. 'Software Engineering'
    exam_date        DATE         NOT NULL,
    exam_time        TIME         NOT NULL,   -- start time
    duration_minutes SMALLINT     NOT NULL,   -- e.g. 120
    venue            VARCHAR(100) NOT NULL,
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (timetable_id, unit_code, group_id)   -- conflict guard for ON CONFLICT DO NOTHING
);

-- ── 10. personalized_timetables ──────────────────────────────
CREATE TABLE IF NOT EXISTS personalized_timetables (
    pt_id          SERIAL PRIMARY KEY,
    student_id     INT  NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    timetable_id   INT  NOT NULL REFERENCES official_timetables(timetable_id),
    generated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, timetable_id)
);

-- ── 11. personalized_timetable_exams ─────────────────────────
CREATE TABLE IF NOT EXISTS personalized_timetable_exams (
    pte_id   SERIAL PRIMARY KEY,
    pt_id    INT NOT NULL REFERENCES personalized_timetables(pt_id) ON DELETE CASCADE,
    exam_id  INT NOT NULL REFERENCES exam_entries(exam_id),
    UNIQUE (pt_id, exam_id)
);

-- ── 12. notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    student_id      INT          NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    exam_id         INT          NOT NULL REFERENCES exam_entries(exam_id),
    message         TEXT         NOT NULL,
    is_read         BOOLEAN      DEFAULT FALSE,
    sent_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 13. activity_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id      SERIAL PRIMARY KEY,
    user_id     INT         REFERENCES users(user_id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,   -- e.g. 'PDF_UPLOAD', 'TIMETABLE_PUBLISHED'
    description TEXT,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 14. system_configurations ────────────────────────────────
CREATE TABLE IF NOT EXISTS system_configurations (
    config_id    SERIAL PRIMARY KEY,
    config_key   VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description  TEXT,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exam_entries_date      ON exam_entries(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_entries_timetable ON exam_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_exam_entries_group     ON exam_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_student_reg_student    ON student_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reg_group      ON student_registrations(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student  ON notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user     ON activity_logs(user_id, created_at DESC);

-- ── Default system config ─────────────────────────────────────
INSERT INTO system_configurations (config_key, config_value, description)
VALUES
    ('reminder_hour',  '8',     'Hour (0-23) at which daily exam reminders are sent'),
    ('reminder_days',  '1,3',   'Days before exam to send reminders (comma-separated)'),
    ('app_name',       'ExamMonitor', 'Application display name')
ON CONFLICT (config_key) DO NOTHING;
