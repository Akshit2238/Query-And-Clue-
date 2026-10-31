-- Migration: Add/normalise difficulty column on cases table
-- Safe to run multiple times (uses IF NOT EXISTS / IGNORE logic)
-- Run this against your MySQL/TiDB production database.

-- Step 1: Add difficulty column if it doesn't already exist
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'EASY';

-- Step 2: Normalise any legacy free-text values to EASY/MEDIUM/HARD
UPDATE cases SET difficulty = 'EASY'   WHERE UPPER(TRIM(difficulty)) IN ('EASY', 'NORMAL', 'BEGINNER', '');
UPDATE cases SET difficulty = 'MEDIUM' WHERE UPPER(TRIM(difficulty)) IN ('MEDIUM', 'INTERMEDIATE', 'MODERATE');
UPDATE cases SET difficulty = 'HARD'   WHERE UPPER(TRIM(difficulty)) IN ('HARD', 'DIFFICULT', 'EXPERT', 'ADVANCED');

-- Step 3: Safety net — any remaining non-standard value defaults to EASY
UPDATE cases SET difficulty = 'EASY'
WHERE difficulty NOT IN ('EASY', 'MEDIUM', 'HARD');

