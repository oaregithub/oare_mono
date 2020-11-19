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

-- 2020-09-24 Create refresh token table

CREATE TABLE refresh_tokens (
	id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    token CHAR(36) UNIQUE NOT NULL,
    expiration DATETIME NOT NULL,
    ip_address CHAR(16) NOT NULL
);


-- 2020-09-29 Add notes column to text_drafts table
ALTER TABLE text_drafts ADD COLUMN notes TEXT;
UPDATE text_drafts SET notes="";

-- 2020-10-12 Create logging_edits table
CREATE TABLE `logging_edits` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(15) NOT NULL,
  `user_uuid` char(36) NOT NULL,
  `time` datetime NOT NULL,
  `reference_table` varchar(250) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `object_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58128 DEFAULT CHARSET=latin1


-- 2020-10-26 Add general permissions table
CREATE TABLE permissions (
	`id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `user_uuid` CHAR(36) NOT NULL,
    `type` VARCHAR(128) NOT NULL,
    `permission` VARCHAR(128) NOT NULL-- 
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `user` ADD UNIQUE (uuid);
ALTER TABLE permissions ADD FOREIGN KEY (user_uuid) REFERENCES user(uuid) ON DELETE CASCADE;

-- 2020-11-18
CREATE INDEX idx_text_discourse_explicit_spelling ON text_discourse (explicit_spelling);