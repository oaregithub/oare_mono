import { knexConfig } from "@/connection";
import { TabletHtmlRenderer } from "@oare/oare/build";
import * as Knex from "knex";
import { each } from "lodash";



export async function up(knex: Knex): Promise<void> {
    /* utterly unstarted  */
    // let newPsbleWrd = signSeries.map(this);
           
            
}

export async function down(knex: Knex): Promise<void> {
}


/*   This is just the (hacky) SQL version of what I was trying to do...
DELIMITER $$
CREATE DEFINER=`oare`@`%` PROCEDURE `create_new_disc_rows_numbers_w_LA2`()
BEGIN
		DECLARE txtUuid, discUuid, treeUuid, parentUuid, prevWordDiscUuid, spellUuid, spellingUuid CHAR(36) CHARSET utf8mb4 DEFAULT NULL;
        DECLARE signType, wordType, thisTranscr VARCHAR(15) CHARSET utf8mb4 DEFAULT NULL;
        DECLARE thisPsblWord, explSpell VARCHAR(50) CHARSET utf8mb4 DEFAULT NULL;
        DECLARE maxid, basementId VARCHAR(10) DEFAULT NULL;
		DECLARE thisLine DECIMAL(5,2) DEFAULT NULL;
        DECLARE childNum, prevWordOnTablet, spellCt, prevCharOnTablet, nextCharOnTablet, n, n2 INT(4) DEFAULT NULL;
        DECLARE thisCharId, nextCharId INT (10) DEFAULT NULL;
		DECLARE test1, test2, test3, test4 BOOLEAN DEFAULT FALSE;
    
        -- set basement to start from (used to ensure the SP won't stall on same single sign that doesn't match)

    SET basementId := (SELECT MIN(id) FROM text_epigraphy WHERE discourse_uuid IS NULL 
         AND type = 'number' 
         AND text_uuid = 'a751e389-e616-4c95-8fb6-b32b6ab78387'
         AND id IN (SELECT id-1 FROM text_epigraphy WHERE type = 'number' AND reading = 'LÁ')
         LIMIT 1)-1;
    WHILE test1 = FALSE DO
         DROP TEMPORARY TABLE this_word;
         SET txtUuid := NULL;
         SET discUuid := NULL;
         SET treeUuid := NULL;
         SET parentUuid := NULL;
         SET prevWordDiscUuid := NULL;
         SET spellUuid := NULL;
         SET spellingUuid := NULL;
         SET signType := NULL;
         SET wordType := NULL;
         SET thisTranscr := NULL;
         SET thisPsblWord := NULL;
         SET explSpell := NULL;
         SET maxid := NULL;
         SET thisLine := NULL;
         SET childNum := NULL;
         SET prevWordOnTablet := NULL;
         SET spellCt := NULL;
         SET prevCharOnTablet := NULL;
         SET nextCharOnTablet := NULL;
         SET n := NULL;
         SET n2 := NULL;
         SET thisCharId := NULL;
         SET nextCharId := NULL;
         SET test1 := FALSE;
         SET test2 := FALSE;
         SET test3 := FALSE;
         SET test4 := FALSE;
         -- this creates a table to gather info to evaluate continuity and then later assign discUuid to discourse_uuid 
        CREATE TEMPORARY TABLE this_word(
			temp_id INT NOT NULL AUTO_INCREMENT,
            this_id INT(10),
            this_type VARCHAR(15),
            this_line DECIMAL(5,2),
            this_rdg VARCHAR(10),
            char_on_tablet INT(4),
             PRIMARY KEY (temp_id)
            );
            -- this inserts the first line of the table
        INSERT INTO this_word(this_id, this_type, this_line, this_rdg, char_on_tablet)
        SELECT MIN(id), type, line, reading, char_on_tablet FROM text_epigraphy 
         WHERE discourse_uuid IS NULL 
         AND type = 'number' 
         AND text_uuid = 'a751e389-e616-4c95-8fb6-b32b6ab78387'
         AND id IN (SELECT id-1 FROM text_epigraphy WHERE type = 'number' AND reading = 'LÁ')
         AND id > basementId  -- to ensure procedure doesn't stall on same sign
        LIMIT 1;
            -- sets while condition variable so that as soon as there are no more examples, the WHILE loop terminates
        IF ((SELECT this_id FROM this_word WHERE temp_id = '1') IS NULL) THEN
            SET test1 := TRUE;
        END IF;
            -- gathers some more information so can execute while loop while continuty of text, line, type, and non-discourse_uuid status exists
            -- this statement gets text, type, line about the first sign(row) in this_word
		SELECT text_uuid, `type`, line INTO txtUuid, signType, thisLine
          FROM text_epigraphy 
		  WHERE id = (SELECT this_id FROM this_word WHERE temp_id = '1');
			-- these 2 statements get the end of the previous word marked (for creation of text_discourse row and its obj_in_text/word_on_tablet later)
		SELECT MAX(char_on_tablet) INTO prevCharOnTablet FROM text_epigraphy
			WHERE char_on_tablet < (SELECT char_on_tablet FROM this_word WHERE temp_id = '1')
            AND text_uuid = txtUuid
            AND discourse_uuid IS NOT NULL;
        SELECT uuid INTO prevWordDiscUuid FROM text_discourse
            WHERE uuid = (SELECT discourse_uuid FROM text_epigraphy 
				WHERE char_on_tablet = prevCharOnTablet
				AND text_uuid = txtUuid);
            -- builds table with more rows as long as text, line, type, and and non-discourse_uuid status continues
		WHILE test2 = FALSE DO
                -- evaluates for continuation of text, line, type, non-discourse-uuid status to exit while loop before adding another row
			SET n := (SELECT MAX(temp_id) FROM this_word);
            SELECT this_id INTO thisCharId FROM this_word WHERE temp_id = n;
            SELECT id INTO nextCharId FROM text_epigraphy WHERE char_on_tablet = ((SELECT char_on_tablet FROM this_word WHERE temp_id = n)+1);
            IF (
            ((SELECT type FROM text_epigraphy WHERE id = nextCharId) = 'number') 
			AND ((SELECT discourse_uuid FROM text_epigraphy WHERE id = nextCharId) IS NULL)
			AND ((SELECT line FROM text_epigraphy WHERE id = nextCharId) = thisLine) 
            )
			THEN
				SET test2 := FALSE;
            ELSE 
                SET test2 := TRUE;
            END IF;
                -- builds next row
			INSERT INTO this_word(this_id, this_type, this_line, this_rdg, char_on_tablet)
                SELECT id, type, line, reading, char_on_tablet FROM text_epigraphy 
                WHERE text_uuid = txtUuid AND line = thisLine AND char_on_tablet = nextCharOnTablet;
	    END WHILE;

         -- checks the table concatenated (simplified) spelling against (simplified) list of spellings from temp_spell_table, dropping last row until match is made (or not)
        
	-- this loop inserts the text_discourse row
        IF (test4 = FALSE) THEN
                -- gathers information in preparation for creating new text_discourse row
            Need to prep an array that will write in the new discourse row.
            
                IF signType = 'number' THEN 
                SET wordType := 'number'; 
            ELSE 
                SET wordType := 'word'; 
            END IF;
            SELECT tree_uuid, uuid INTO treeUuid, parentUuid FROM text_discourse WHERE text_uuid = txtUuid AND type = 'discourseUnit';
            SELECT MAX(child_num) + 1 INTO childNum FROM text_discourse WHERE parent_uuid = parentUuid;
            SELECT word_on_tablet INTO prevWordOnTablet FROM text_discourse WHERE uuid = prevWordDiscUuid;
            IF prevWordOnTablet IS NULL THEN SET prevWordOnTablet := 0; END IF;
                 -- get rest of text ready for insertion by creating whole in sequences
            CALL iterate_text_disc_with_insert(txtUuid, prevWordOnTablet);
                -- if spelling is unique gets that prepared
            IF spellCt = 1 THEN
                SET spellingUuid := spellUuid;
                SELECT form INTO thisTranscr FROM dictionary_form WHERE uuid = (SELECT reference_uuid FROM dictionary_spelling WHERE uuid = spellUuid);
                SELECT explicit_spelling INTO explSpell from dictionary_spelling WHERE uuid = spellUuid;
            END IF;
                -- creates new row
			SET FOREIGN_KEY_CHECKS=0;
            INSERT INTO `oarebyue_0.3`.`text_discourse` 
             (`uuid`, `type`, `child_num`, `word_on_tablet`,`text_uuid`, `tree_uuid`, `parent_uuid`, `spelling_uuid`,`explicit_spelling`,`transcription`) 
             VALUES (UUID(), wordType, childNum, prevWordOnTablet+1, txtUuid, treeUuid, parentUuid, spellUuid, explSpell, thisTranscr);
			SET FOREIGN_KEY_CHECKS=1;
             -- finds uuid of newly created row (at the bottom of the table)
            SELECT MAX(id) INTO maxid FROM text_discourse;
            SELECT uuid INTO discUuid FROM text_discourse WHERE id = maxid;
                -- goes back to text_epigraphy table and updates the rows from the table to get the newly created discourse_uuid
            SET SQL_SAFE_UPDATES=0;
            UPDATE text_epigraphy SET discourse_uuid = discUuid
                WHERE id IN (SELECT this_id FROM this_word);
			SET SQL_SAFE_UPDATES=1;
                -- creates the explicit spelling in the new row
            IF spellUuid IS NULL THEN
                CALL update_discourse_spellings(discUuid);
            END IF;
                -- cleanup
        END IF;
    END WHILE;
        -- more cleanup
    DROP TEMPORARY TABLE this_word;
    END$$
DELIMITER ;

*/




