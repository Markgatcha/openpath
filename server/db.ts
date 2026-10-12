import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { env } from './env'

const dbPath = resolve(env.DATABASE_PATH)
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

interface Migration {
  version: number
  sql: string
}

const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student','teacher','parent')),
        password_hash TEXT NOT NULL,
        avatar_color TEXT NOT NULL DEFAULT '#8b5cf6',
        xp INTEGER NOT NULL DEFAULT 0,
        streak_days INTEGER NOT NULL DEFAULT 0,
        streak_last_active TEXT,
        daily_goal_minutes INTEGER NOT NULL DEFAULT 20,
        minutes_today INTEGER NOT NULL DEFAULT 0,
        minutes_today_date TEXT,
        link_code TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT 'General',
        teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        join_code TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS classroom_members (
        classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (classroom_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS parent_links (
        parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (parent_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT 'General',
        difficulty TEXT NOT NULL DEFAULT 'medium'
          CHECK (difficulty IN ('easy','medium','hard')),
        teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
        time_limit_sec INTEGER,
        published INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('mcq','truefalse','fill','order')),
        prompt TEXT NOT NULL,
        options_json TEXT,
        correct_json TEXT NOT NULL,
        alternatives_json TEXT,
        points INTEGER NOT NULL DEFAULT 10,
        position INTEGER NOT NULL DEFAULT 0,
        explanation TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        max_score INTEGER NOT NULL DEFAULT 0,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        correct_count INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        combo_best INTEGER NOT NULL DEFAULT 0,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        finished_at TEXT
      );

      CREATE TABLE IF NOT EXISTS attempt_answers (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        response_json TEXT NOT NULL,
        correct INTEGER NOT NULL DEFAULT 0,
        ms_taken INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'award',
        condition TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, badge_id)
      );

      CREATE TABLE IF NOT EXISTS ai_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        provider TEXT NOT NULL DEFAULT 'local',
        base_url TEXT NOT NULL,
        model TEXT NOT NULL,
        api_key TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id, position);
      CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);
      CREATE INDEX IF NOT EXISTS idx_answers_attempt ON attempt_answers(attempt_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_answers_unique
        ON attempt_answers(attempt_id, question_id);

      INSERT OR IGNORE INTO badges (id, name, description, icon, condition, sort_order) VALUES
        ('first_quiz',   'First Steps',     'Complete your first quiz',                    'footprints',      'first_quiz',   1),
        ('perfect',      'Perfectionist',   'Score 100% on any quiz',                       'target',         'perfect',      2),
        ('combo_master', 'Combo Master',    'Reach a streak of 10 correct answers',         'flame',          'combo_10',     3),
        ('streak_3',     'Getting Warm',    'Keep a 3-day learning streak',                 'calendar-check', 'streak_3',     4),
        ('streak_7',     'Week Warrior',    'Keep a 7-day learning streak',                 'calendar-heart', 'streak_7',     5),
        ('speedster',    'Speedster',       'Answer in under 5s on average with 80%+ right', 'zap',           'speedster',    6),
        ('explorer',     'Explorer',        'Complete quizzes in 3 different subjects',      'compass',        'explorer',     7),
        ('marathon',     'Marathon Runner', 'Complete 10 quizzes',                          'medal',          'marathon_10',  8);
    `,
  },
]

export function migrate(): void {
  const row = db.prepare('PRAGMA user_version').get() as {
    user_version: number
  }
  let current = row.user_version
  for (const migration of migrations) {
    if (migration.version > current) {
      db.exec(migration.sql)
      db.pragma(`user_version = ${migration.version}`)
      current = migration.version
    }
  }
}
