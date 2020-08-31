-- Indices for search
CREATE INDEX reading ON text_epigraphy (reading);
CREATE INDEX char_on_tablet ON text_epigraphy (char_on_tablet);
CREATE INDEX text_epigraphy_reading_text_uuid_char_on_tablet_index ON text_epigraphy (reading, text_uuid, char_on_tablet);
CREATE INDEX `name` ON alias (`name`);

-- Text group foreign keys
ALTER TABLE text_group ADD FOREIGN KEY (text_uuid) REFERENCES `text`(uuid) ON DELETE CASCADE;
ALTER TABLE text_group ADD FOREIGN KEY (group_id) REFERENCES oare_group(id) ON DELETE CASCADE;

-- User group foreign keys
ALTER TABLE user_group ADD FOREIGN KEY (group_id) REFERENCES oare_group(id) ON DELETE CASCADE;
ALTER TABLE user_group ADD FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE;

-- Text drafts foreign keys
ALTER TABLE text_drafts ADD FOREIGN KEY (text_uuid) REFERENCES `text`(`uuid`) ON DELETE CASCADE;
ALTER TABLE text_drafts ADD FOREIGN KEY (creator) REFERENCES `user`(`id`) ON DELETE CASCADE;

-- 2020-05-18: Remove alias_1 and alias_2 columns from hierarchy
ALTER TABLE hierarchy DROP COLUMN alias_1;
ALTER TABLE hierarchy DROP COLUMN alias_2;

-- 2020-05-18: Change museum name types to "collection"
UPDATE hierarchy SET `type`='collection' WHERE parent_uuid="000000000000000000000000000000000009";

-- 2020-05-19 Change quote type
UPDATE field
SET field = REPLACE(field,'"','')
WHERE reference_uuid IN (
SELECT uuid FROM dictionary_word
WHERE type = "PN");

-- 2020-06-01 Update hierarchy publish statuses
UPDATE hierarchy SET published = true WHERE published IS NULL;
UPDATE hierarchy
  INNER JOIN alias ON alias.reference_uuid = hierarchy.uuid
  SET published = false
  WHERE alias.name LIKE "%unpublished%";

-- 2020-06-02 Hide unpublished texts
UPDATE hierarchy h1
INNER JOIN hierarchy h2 ON h2.uuid = h1.parent_uuid
SET h1.published = false
WHERE h2.published = false;