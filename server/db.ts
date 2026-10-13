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
        type TEXT NOT NULL CHECK (type IN ('mcq','truefalse','fill','order','figure')),
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
  {
    version: 2,
    sql: `
      -- Spaced-repetition flashcards (SM-2-lite scheduling, per student+question)
      CREATE TABLE IF NOT EXISTS flashcard_states (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        ease REAL NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0,
        due_date TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, question_id)
      );

      CREATE INDEX IF NOT EXISTS idx_srs_due ON flashcard_states(user_id, due_date);
    `,
  },
  {
    // Figure questions need a new value in the questions.type CHECK
    // constraint; SQLite cannot alter a CHECK in place, so rebuild.
    version: 3,
    sql: `
      CREATE TABLE questions_new (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('mcq','truefalse','fill','order','figure')),
        prompt TEXT NOT NULL,
        options_json TEXT,
        correct_json TEXT NOT NULL,
        alternatives_json TEXT,
        points INTEGER NOT NULL DEFAULT 10,
        position INTEGER NOT NULL DEFAULT 0,
        explanation TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO questions_new
        (id, quiz_id, type, prompt, options_json, correct_json, alternatives_json, points, position, explanation, created_at)
        SELECT id, quiz_id, type, prompt, options_json, correct_json, alternatives_json, points, position, explanation, created_at
        FROM questions;
      DROP TABLE questions;
      ALTER TABLE questions_new RENAME TO questions;
      CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id, position);
    `,
  },
  {
    // Homework: assign a quiz to a classroom or an individual student with a
    // due date, an availability window, and an attempt cap.
    version: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        classroom_id TEXT REFERENCES classrooms(id) ON DELETE CASCADE,
        student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '',
        due_date TEXT,
        available_from TEXT,
        max_attempts INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        CHECK (classroom_id IS NOT NULL OR student_id IS NOT NULL)
      );

      CREATE INDEX IF NOT EXISTS idx_assignments_quiz ON assignments(quiz_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON assignments(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
    `,
  },
  {
    // Classroom economy: coins earned from graded work, spent in the shop.
    version: 5,
    sql: `
      ALTER TABLE users ADD COLUMN coins INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN cosmetics_json TEXT;
      ALTER TABLE quizzes ADD COLUMN kind TEXT NOT NULL DEFAULT 'quiz'
        CHECK (kind IN ('homework','classwork','quiz','test'));

      CREATE TABLE IF NOT EXISTS teacher_economy (
        teacher_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        currency_name TEXT NOT NULL DEFAULT 'Coins',
        currency_icon TEXT NOT NULL DEFAULT '🪙',
        points_per_coin INTEGER NOT NULL DEFAULT 10
          CHECK (points_per_coin BETWEEN 1 AND 1000),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS shop_items (
        id TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL
          CHECK (category IN ('background','nameplate','name-style','font')),
        price INTEGER NOT NULL CHECK (price BETWEEN 0 AND 100000),
        item_data TEXT NOT NULL DEFAULT '{}',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_shop_items_teacher ON shop_items(teacher_id);

      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        price INTEGER NOT NULL,
        currency_name TEXT NOT NULL DEFAULT 'Coins',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

      CREATE TABLE IF NOT EXISTS level_rewards (
        id TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER NOT NULL CHECK (level BETWEEN 2 AND 100),
        reward_type TEXT NOT NULL CHECK (reward_type IN ('coins','item')),
        coins INTEGER NOT NULL DEFAULT 0,
        item_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (teacher_id, level)
      );

      CREATE TABLE IF NOT EXISTS level_rewards_granted (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER NOT NULL,
        granted_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, teacher_id, level)
      );

      CREATE TABLE IF NOT EXISTS coin_ledger (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delta INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        reason TEXT NOT NULL,
        source_type TEXT,
        source_id TEXT,
        currency_name TEXT NOT NULL DEFAULT 'Coins',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_ledger_user ON coin_ledger(user_id, created_at DESC);
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
