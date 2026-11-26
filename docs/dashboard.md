# First degree-awards dashboard

Managers can compare Arcada’s published degree totals, field mix and agreement targets with the same years and definitions at peer institutions. The owner selected degree awards in the reference dashboard’s layout. This first version uses a reviewed, read-only aggregate extract in Next.js. It can run and be reviewed independently of the planned PostgreSQL importer. Production database migrations and survey ingestion remain separate milestones.

Accept the dashboard when a user can select a UAS, year, level, field and funding definition, read values in tables, and export the selection with provenance. The default must show Arcada’s 561 degrees in 2025, one fewer than in 2024. Selecting all funding must give 573. Agreement targets apply only to supported bachelor populations. Distinguish an unavailable observation from a published zero. Verify desktop, narrow-screen and keyboard usage, the production build and the connected Vercel result.
