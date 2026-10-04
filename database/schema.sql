-- =========================================================
-- Hebrew Learning
-- PostgreSQL schema
-- =========================================================

BEGIN;

-- =========================================================
-- SCHEMAS
-- =========================================================

CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS app;

-- =========================================================
-- VOCABULARY
-- =========================================================

CREATE TABLE IF NOT EXISTS content.verbs (
                                             id INTEGER PRIMARY KEY,
                                             hebrew TEXT NOT NULL,
                                             translation TEXT NOT NULL,
                                             level SMALLINT NOT NULL
                                             CHECK (level BETWEEN 1 AND 25)
    );

CREATE TABLE IF NOT EXISTS content.adjectives (
                                                  id INTEGER PRIMARY KEY,
                                                  hebrew TEXT NOT NULL,
                                                  translation TEXT NOT NULL,
                                                  level SMALLINT NOT NULL
                                                  CHECK (level BETWEEN 1 AND 25)
    );

CREATE TABLE IF NOT EXISTS content.adverbs (
                                               id INTEGER PRIMARY KEY,
                                               hebrew TEXT NOT NULL,
                                               translation TEXT NOT NULL,
                                               level SMALLINT NOT NULL
                                               CHECK (level BETWEEN 1 AND 15)
    );

-- =========================================================
-- VERB GRAMMAR
-- =========================================================

CREATE TABLE IF NOT EXISTS content.verb_grammar (
                                                    verb_id INTEGER PRIMARY KEY
                                                    REFERENCES content.verbs(id)
    ON DELETE CASCADE,

    government TEXT NOT NULL,
    binyan TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.verb_present (
                                                    verb_id INTEGER PRIMARY KEY
                                                    REFERENCES content.verbs(id)
    ON DELETE CASCADE,

    masculine_singular TEXT NOT NULL,
    feminine_singular TEXT NOT NULL,
    masculine_plural TEXT NOT NULL,
    feminine_plural TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.verb_past (
                                                 verb_id INTEGER PRIMARY KEY
                                                 REFERENCES content.verbs(id)
    ON DELETE CASCADE,

    first_person_singular TEXT NOT NULL,

    second_person_masculine_singular TEXT NOT NULL,
    second_person_feminine_singular TEXT NOT NULL,

    third_person_masculine_singular TEXT NOT NULL,
    third_person_feminine_singular TEXT NOT NULL,

    first_person_plural TEXT NOT NULL,

    second_person_masculine_plural TEXT NOT NULL,
    second_person_feminine_plural TEXT NOT NULL,

    third_person_plural TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.verb_future_imperative (
                                                              verb_id INTEGER PRIMARY KEY
                                                              REFERENCES content.verbs(id)
    ON DELETE CASCADE,

    first_person_singular TEXT NOT NULL,

    second_person_masculine_singular TEXT NOT NULL,
    second_person_feminine_singular TEXT NOT NULL,

    third_person_masculine_singular TEXT NOT NULL,
    third_person_feminine_singular TEXT NOT NULL,

    first_person_plural TEXT NOT NULL,

    second_person_masculine_plural TEXT NOT NULL,
    second_person_feminine_plural TEXT NOT NULL,

    third_person_plural TEXT NOT NULL,

    imperative_masculine TEXT NOT NULL,
    imperative_feminine TEXT NOT NULL,
    imperative_plural TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.verb_examples (
                                                     verb_id INTEGER PRIMARY KEY
                                                     REFERENCES content.verbs(id)
    ON DELETE CASCADE,

    present_example TEXT NOT NULL,
    present_translation TEXT NOT NULL,

    past_example TEXT NOT NULL,
    past_translation TEXT NOT NULL,

    future_example TEXT NOT NULL,
    future_translation TEXT NOT NULL
    );

-- =========================================================
-- ADJECTIVE GRAMMAR
-- =========================================================

CREATE TABLE IF NOT EXISTS content.adjective_forms (
                                                       adjective_id INTEGER PRIMARY KEY
                                                       REFERENCES content.adjectives(id)
    ON DELETE CASCADE,

    masculine_singular TEXT NOT NULL,
    feminine_singular TEXT NOT NULL,
    masculine_plural TEXT NOT NULL,
    feminine_plural TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.adjective_constructions (
                                                               adjective_id INTEGER PRIMARY KEY
                                                               REFERENCES content.adjectives(id)
    ON DELETE CASCADE,

    construction TEXT NOT NULL,
    meaning TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.adjective_examples (
                                                          adjective_id INTEGER PRIMARY KEY
                                                          REFERENCES content.adjectives(id)
    ON DELETE CASCADE,

    example1 TEXT NOT NULL,
    translation1 TEXT NOT NULL,

    example2 TEXT NOT NULL,
    translation2 TEXT NOT NULL,

    example3 TEXT NOT NULL,
    translation3 TEXT NOT NULL
    );

-- =========================================================
-- ADVERB GRAMMAR
-- =========================================================

CREATE TABLE IF NOT EXISTS content.adverb_usage (
                                                    adverb_id INTEGER PRIMARY KEY
                                                    REFERENCES content.adverbs(id)
    ON DELETE CASCADE,

    main_meaning TEXT NOT NULL,
    semantic_category TEXT NOT NULL,
    register TEXT NOT NULL,
    usage TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.adverb_relations (
                                                        adverb_id INTEGER PRIMARY KEY
                                                        REFERENCES content.adverbs(id)
    ON DELETE CASCADE,

    synonym TEXT NOT NULL,
    antonym TEXT NOT NULL,
    related_expression TEXT NOT NULL,
    comment TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS content.adverb_examples (
                                                       adverb_id INTEGER PRIMARY KEY
                                                       REFERENCES content.adverbs(id)
    ON DELETE CASCADE,

    example1 TEXT NOT NULL,
    translation1 TEXT NOT NULL,

    example2 TEXT NOT NULL,
    translation2 TEXT NOT NULL,

    example3 TEXT NOT NULL,
    translation3 TEXT NOT NULL
    );

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS app.users (
                                         id BIGSERIAL PRIMARY KEY,
                                         email TEXT NOT NULL UNIQUE,
                                         password_hash TEXT NOT NULL,
                                         first_name TEXT NOT NULL,
                                         last_name TEXT NOT NULL,
                                         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- =========================================================
-- USER PROGRESS
-- =========================================================

CREATE TABLE IF NOT EXISTS app.user_progress (
                                                 user_id BIGINT NOT NULL
                                                 REFERENCES app.users(id)
    ON DELETE CASCADE,

    category TEXT NOT NULL
    CHECK (category IN ('verbs', 'adjectives', 'adverbs')),

    unlocked_level SMALLINT NOT NULL DEFAULT 1
    CHECK (unlocked_level >= 1),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, category)
    );

INSERT INTO app.user_progress (
    user_id,
    category,
    unlocked_level
)
SELECT
    users.id,
    categories.category,
    1
FROM app.users AS users
         CROSS JOIN (
    VALUES
        ('verbs'),
        ('adjectives'),
        ('adverbs')
) AS categories(category)
    ON CONFLICT (user_id, category) DO NOTHING;

-- =========================================================
-- TEST STATISTICS
-- =========================================================

CREATE TABLE IF NOT EXISTS app.test_statistics (
                                                   id BIGSERIAL PRIMARY KEY,

                                                   user_id BIGINT NOT NULL
                                                   REFERENCES app.users(id)
    ON DELETE CASCADE,

    category TEXT NOT NULL
    CHECK (category IN ('verbs', 'adjectives', 'adverbs')),

    level SMALLINT NOT NULL,

    percent SMALLINT NOT NULL
    CHECK (percent BETWEEN 0 AND 100),

    correct SMALLINT NOT NULL
    CHECK (correct >= 0),

    total SMALLINT NOT NULL
    CHECK (total > 0),

    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (correct <= total),

    CHECK (
(category = 'verbs' AND level BETWEEN 1 AND 25)
    OR
(category = 'adjectives' AND level BETWEEN 1 AND 25)
    OR
(category = 'adverbs' AND level BETWEEN 1 AND 15)
    )
    );

CREATE INDEX IF NOT EXISTS idx_test_statistics_user_id
    ON app.test_statistics(user_id);

CREATE INDEX IF NOT EXISTS idx_test_statistics_user_category_level
    ON app.test_statistics(user_id, category, level);

COMMIT;