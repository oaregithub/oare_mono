SELECT 
	ip.uuid AS propertyUuid,
    ip.parent_uuid AS parentUuid,
    df.form,
    df.uuid AS formUuid,
    a1.name AS `variable`,
    a2.name AS valueName,
    a3.name AS valueAbbrev
FROM dictionary_form df
LEFT JOIN item_properties ip
        ON ip.reference_uuid = df.uuid
LEFT JOIN alias a1
        ON a1.reference_uuid = ip.variable_uuid
LEFT JOIN alias a2
        ON a2.reference_uuid = ip.value_uuid
LEFT JOIN alias a3
    ON a3.reference_uuid = ip.value_uuid
WHERE df.reference_uuid=?
AND a2.type!="abbreviation"
AND a3.type="abbreviation"