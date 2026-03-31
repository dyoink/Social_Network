-- ===========================================
-- Social Network App - PostgreSQL Schema
-- ===========================================

-- Users Table
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,  -- BCrypt hash
    full_name     VARCHAR(100),
    date_of_birth DATE,
    avatar_url    TEXT,
    cover_url     TEXT,
    bio           TEXT,
    role          VARCHAR(50)  NOT NULL DEFAULT 'Member',  -- 'Member' | 'Admin'
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,        -- FALSE = bị ban bởi Admin
    is_seeded     BOOLEAN      NOT NULL DEFAULT FALSE,       -- TRUE = tạo bởi Admin Seed tool
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Posts Table
CREATE TABLE posts (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    image_url  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments Table (supports nested replies via parent_id)
CREATE TABLE comments (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER     NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
    user_id    INTEGER     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    parent_id  INTEGER              REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = top-level
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Likes Table (Many-to-Many: users <-> posts)
CREATE TABLE post_likes (
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    INTEGER     NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Follows Table (Self-referencing Many-to-Many)
CREATE TABLE follows (
    follower_id  INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Conversations Table
CREATE TABLE conversations (
    id         SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Participants Table (Many-to-Many: users <-> conversations)
CREATE TABLE conversation_participants (
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER     NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INTEGER     NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    content         TEXT        NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- recipient
    actor_id          INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- who triggered
    notification_type VARCHAR(20) NOT NULL,  -- 'like' | 'comment' | 'follow' | 'reply'
    entity_id         INTEGER,               -- PostId or CommentId (no FK for flexibility)
    is_read           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INDEXES (for common query patterns)
-- ===========================================

-- Posts: newsfeed queries (by user, ordered by time)
CREATE INDEX idx_posts_user_id    ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Comments: load comments for a post
CREATE INDEX idx_comments_post_id   ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Messages: load message history for a conversation
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at      ON messages(created_at DESC);

-- Notifications: load notifications for a user (unread first)
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read);

-- Follows: check if following, count followers/following
CREATE INDEX idx_follows_follower_id  ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Users: search by username/full_name
CREATE INDEX idx_users_username  ON users(username);
CREATE INDEX idx_users_full_name ON users(full_name);

-- ===========================================
-- Reports Table (thêm sau lần Initial migration)
-- ===========================================

CREATE TABLE reports (
    id              SERIAL      PRIMARY KEY,
    reporter_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id  INTEGER              REFERENCES users(id) ON DELETE SET NULL,
    target_post_id  INTEGER              REFERENCES posts(id) ON DELETE SET NULL,
    reason          VARCHAR(50) NOT NULL,  -- 'spam'|'hate'|'nude'|'violence'|'other'
    detail          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'Pending',  -- 'Pending' | 'Resolved'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_reports_status      ON reports(status);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);

-- ===========================================
-- Posts: VideoUrl for Reels
-- ===========================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ===========================================
-- Stories (24h)
-- ===========================================

CREATE TABLE stories (
    id          SERIAL      PRIMARY KEY,
    user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url   TEXT        NOT NULL,
    media_type  VARCHAR(10) NOT NULL DEFAULT 'Image',  -- 'Image' | 'Video'
    caption     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_stories_expires_at ON stories(expires_at);

-- Story Views (who viewed which story)
CREATE TABLE story_views (
    story_id   INTEGER     NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id    INTEGER     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);
