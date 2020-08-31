SELECT 
	dw.uuid,
	dw.word, 
    GROUP_CONCAT(DISTINCT pos.partOfSpeech) AS partsOfSpeech,
    GROUP_CONCAT(DISTINCT sp.specialClassification) AS specialClassifications,
    GROUP_CONCAT(DISTINCT vtv.verbalThematicVowelType) AS verbalThematicVowelTypes,
    tr.translations
FROM dictionary_word dw
LEFT JOIN (
	SELECT 
		ip.reference_uuid, 
		a2.name AS partOfSpeech
	FROM item_properties ip
	INNER JOIN alias a1
		ON a1.reference_uuid = ip.variable_uuid
	INNER JOIN alias a2
		ON a2.reference_uuid = ip.value_uuid
	WHERE a1.name="Part of Speech"
	AND a2.`type`="abbreviation"
) pos ON dw.uuid = pos.reference_uuid

LEFT JOIN (
	SELECT 
		ip.reference_uuid,
        a2.name AS specialClassification
	FROM item_properties ip
    INNER JOIN alias a1
		ON a1.reference_uuid = ip.variable_uuid
	INNER JOIN alias a2
		ON a2.reference_uuid = ip.value_uuid
	WHERE a1.name="Special Classifications"
) sp ON dw.uuid = sp.reference_uuid

LEFT JOIN (
	SELECT 
		ip.reference_uuid,
        a2.name AS verbalThematicVowelType
	FROM item_properties ip
    INNER JOIN alias a1
		ON a1.reference_uuid = ip.variable_uuid
	INNER JOIN alias a2
		ON a2.reference_uuid = ip.value_uuid
	WHERE a1.name="Verbal Thematic Vowel Type"
) vtv ON dw.uuid = vtv.reference_uuid

LEFT JOIN(
	SELECT reference_uuid, GROUP_CONCAT(DISTINCT `field` ORDER BY primacy SEPARATOR '#!') AS translations
    FROM field
		GROUP BY reference_uuid
    ORDER BY primacy
) tr ON dw.uuid = tr.reference_uuid
WHERE dw.uuid = ?