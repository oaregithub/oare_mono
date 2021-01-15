SELECT q1.uuid, q1.word, q1.form_uuid AS formUuid, q1.field AS translation, q1.form, q2.parse AS cases, q1.spelling AS spellings FROM 
        (SELECT t1.*, t4.field, t2.uuid AS form_uuid, t2.form, group_concat(DISTINCT t3.explicit_spelling separator ",") AS spelling 
          FROM dictionary_word AS t1
          LEFT JOIN dictionary_form AS t2
            ON t2.reference_uuid = t1.uuid
          LEFT JOIN dictionary_spelling AS t3
            ON t3.reference_uuid = t2.uuid
          LEFT JOIN field AS t4
            ON t4.reference_uuid = t1.uuid
          WHERE  t1.`type`="#{wordType}"
          GROUP BY t1.uuid, t2.uuid) AS q1
      LEFT JOIN 
        (SELECT sq1.reference_uuid, group_concat(sq2.name ORDER BY sq2.`name` DESC separator "/") AS parse FROM  
              (SELECT * FROM item_properties WHERE variable_uuid = 'e0092e36-fb94-a4dc-cd04-5883ab861fd6') AS sq1
          LEFT JOIN 
              (SELECT * FROM alias WHERE `type`="abbreviation") AS sq2
      ON sq1.value_uuid = sq2.reference_uuid
      GROUP BY sq1.reference_uuid) AS q2
      ON q1.form_uuid = q2.reference_uuid;
