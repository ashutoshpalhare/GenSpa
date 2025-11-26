-- Custom SQL migration file, put your code below! --
-- btree_gist enables EXCLUDE constraints on (staff_id, tstzrange) so overlapping
-- staff appointments are rejected by PostgreSQL itself (booking engine, Phase 5).
CREATE EXTENSION IF NOT EXISTS btree_gist;