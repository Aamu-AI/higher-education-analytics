-- Retain the 2020 legacy vocational records in the source release.
CREATE OR REPLACE VIEW awards.degree_awards AS
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
WHERE payload->>'koulutusasteTaso2' IN ('Ammattikorkeakoulututkinto', 'Ylempi ammattikorkeakoulututkinto')
GROUP BY 1, 2, 3, 4, 5, 6;
