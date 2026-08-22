-- Task 0.2: scheduled cleanup jobs.
--
-- pg_cron is the in-database scheduler used for the nightly maintenance
-- jobs (see 20260822115735_schedule_cleanup_jobs.sql). It creates its own
-- "cron" schema for the job tables.
--
-- NOTE: this migration was applied directly to the live project via MCP
-- rather than through a file. This file records that change after the
-- fact; the extension is already installed remotely.
create extension if not exists pg_cron;
