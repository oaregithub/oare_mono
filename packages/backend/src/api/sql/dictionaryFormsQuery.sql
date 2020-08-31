SELECT 
	df.uuid AS formUuid, 
    df.form, 
    GROUP_CONCAT(DISTINCT ds.uuid ORDER BY ds.spelling) AS spellingUuids,
    GROUP_CONCAT(DISTINCT ds.spelling ORDER BY ds.spelling) AS spellings
FROM dictionary_word dw
INNER JOIN dictionary_form df
	ON df.reference_uuid = dw.uuid
LEFT JOIN dictionary_spelling ds
	ON ds.reference_uuid = df.uuid
WHERE dw.uuid=?
GROUP BY df.uuid