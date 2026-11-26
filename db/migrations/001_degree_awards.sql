CREATE SCHEMA awards;

CREATE TABLE awards.release (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resource text NOT NULL,
    year integer NOT NULL,
    release_type text NOT NULL CHECK (release_type IN ('Ennakko', 'Lopullinen')),
    previous_id bigint REFERENCES awards.release,
    content_sha256 text NOT NULL,
    source_stamp date NOT NULL,
    retrieved_at timestamptz NOT NULL DEFAULT now(),
    source_filter text NOT NULL,
    source_rows integer NOT NULL CHECK (source_rows BETWEEN 1 AND 10000),
    institutions text[] NOT NULL,
    institution_labels jsonb NOT NULL,
    definition_version integer NOT NULL DEFAULT 1,
    UNIQUE (resource, year, id)
);

CREATE TABLE awards.current_release (
    resource text NOT NULL,
    year integer NOT NULL,
    release_id bigint NOT NULL,
    PRIMARY KEY (resource, year),
    FOREIGN KEY (resource, year, release_id) REFERENCES awards.release (resource, year, id)
);

CREATE TABLE awards.source_row (
    release_id bigint NOT NULL REFERENCES awards.release,
    source_key jsonb NOT NULL,
    payload jsonb NOT NULL,
    PRIMARY KEY (release_id, source_key)
);

CREATE TABLE awards.change (
    release_id bigint NOT NULL REFERENCES awards.release,
    source_key jsonb NOT NULL,
    field_name text NOT NULL,
    action text NOT NULL CHECK (action IN ('add', 'change', 'remove')),
    old_value jsonb,
    new_value jsonb,
    PRIMARY KEY (release_id, source_key, field_name)
);

CREATE TABLE awards.reconciliation (
    release_id bigint NOT NULL REFERENCES awards.release,
    institution text NOT NULL,
    definition text NOT NULL,
    level text NOT NULL,
    left_source text NOT NULL,
    right_source text NOT NULL,
    left_value integer NOT NULL,
    right_value integer NOT NULL,
    expected_difference integer NOT NULL,
    status text NOT NULL CHECK (status IN ('matched', 'unexplained')),
    CHECK (left_value - right_value = expected_difference),
    PRIMARY KEY (release_id, institution, definition, level, left_source, right_source)
);

CREATE VIEW awards.degree_awards AS
SELECT release_id,
       payload->>'koodiKorkeakoulu' AS institution,
       payload->>'koodiKoulutus' AS qualification,
       payload->>'rahoituslahde' AS funding,
       CASE payload->>'koulutusasteTaso2'
           WHEN 'Ammattikorkeakoulututkinto' THEN 'bachelor'
           WHEN 'Ylempi ammattikorkeakoulututkinto' THEN 'master'
       END AS level,
       payload->>'okmOhjauksenAla' AS field,
       sum((payload->>'tutkinnot')::integer)::integer AS degrees,
       'observed'::text AS disclosure
FROM awards.source_row
GROUP BY 1, 2, 3, 4, 5, 6;

-- A release-specific result remains reproducible after a source correction.
CREATE VIEW awards.release_degrees AS
SELECT r.id AS release_id, r.year, d.institution, d.qualification, d.level, d.field,
       sum(d.degrees)::integer AS all_degrees,
       sum(CASE WHEN d.funding = 'Maksullinen tilauskoulutus' THEN 0 ELSE d.degrees END)::integer
           AS included_degrees
FROM awards.release r
JOIN awards.degree_awards d ON d.release_id = r.id
WHERE r.release_type = 'Lopullinen'
GROUP BY 1, 2, 3, 4, 5, 6;

CREATE VIEW awards.current_final_degrees AS
SELECT d.*
FROM awards.current_release c
JOIN awards.release_degrees d ON d.release_id = c.release_id;

CREATE VIEW awards.degrees_all_funding AS
SELECT release_id, year, institution, qualification, level, field, all_degrees AS degrees
FROM awards.current_final_degrees;

CREATE VIEW awards.degrees_excluding_commissioned AS
SELECT release_id, year, institution, qualification, level, field, included_degrees AS degrees
FROM awards.current_final_degrees;
