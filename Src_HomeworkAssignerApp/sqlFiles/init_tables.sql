-- createdb homework_assigner;

CREATE TABLE Subjects (
  id SERIAL PRIMARY KEY,
  subject_name TEXT,
  grade TEXT
);

CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  user_name TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  password TEXT UNIQUE,
  contact_number TEXT UNIQUE,
  address TEXT,
  role SMALLINT CHECK ( role >= 0 AND role < 4), -- teacher = 1 / student = 2 / non-teaching = 3
  admin BOOLEAN,
  institution_id TEXT UNIQUE,
  joining_date DATE DEFAULT NOW()
);

CREATE TABLE User_Subjects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  subject_id INTEGER
);

CREATE TABLE Homeworks (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER,
  teacher_id INTEGER,
  title TEXT,
  homework_desc TEXT,
  filepath TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_status TEXT,
  edited_at TIMESTAMPTZ
);

CREATE TABLE Comments (
  id SERIAL PRIMARY KEY,
  commenter_id INTEGER,
  homework_id INTEGER,
  previous_comment_id INTEGER, -- in case if the current comment is a reply to another comment
  posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comments TEXT,
  edited_at TIMESTAMPTZ, 
  like_count INTEGER
);

CREATE TABLE Submissions (
  id SERIAL PRIMARY KEY,
  homework_id INTEGER,
  student_id INTEGER,
  description TEXT,
  filepath TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ 

