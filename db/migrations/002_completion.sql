CREATE TABLE awards.completion_release (
    release_id bigint PRIMARY KEY REFERENCES awards.release,
    awards_release_id bigint NOT NULL REFERENCES awards.release,
    observed_on date NOT NULL
);

CREATE TABLE awards.completion_time (
    release_id bigint NOT NULL REFERENCES awards.completion_release,
    institution text NOT NULL,
    qualification text NOT NULL,
    label text NOT NULL,
    on_time integer NOT NULL CHECK (on_time >= 0),
    within_year integer NOT NULL CHECK (within_year >= 0),
    later integer NOT NULL CHECK (later >= 0),
    PRIMARY KEY (release_id, institution, qualification)
);
