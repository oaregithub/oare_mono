import * as Knex from "knex";

export interface Text {
    name: string,
    excavation_prfx: string,
    excavation_no: string,
    publication_prfx: string,
    publication_no: string,
    museum_prfx: string,
    museum_no: string,
    uuid: string,
    id: Number
}

export async function up(knex: Knex): Promise<void> {
    const hasDisplayName = await knex.schema.hasColumn('text', 'display_name');
    const Texts: Text[] = await knex.from('text')
        .select('name', 'excavation_prfx', 'excavation_no', 'publication_prfx', 'publication_no', 'museum_prfx', 'museum_no', 'uuid', 'id')
    
    console.log(Texts[0])
    
    
    if (!hasDisplayName) {
        await knex.schema.table('text', table => {
        table.string('display_name');
        });
    }
    for (let i = 0; i < Texts.length; i++){
            let displayName = ''
            if (
            Texts[i].excavation_prfx &&
            Texts[i].excavation_prfx.slice(0, 2).toLowerCase() === 'kt'
            ) {
            displayName = `${Texts[i].excavation_prfx} ${Texts[i].excavation_no}`;
            if (Texts[i].publication_prfx && Texts[i].publication_no) {
                displayName += ` (${Texts[i].publication_prfx} ${Texts[i].publication_no})`;
            } else if (Texts[i].museum_prfx && Texts[i].museum_no) {
                displayName += ` (${Texts[i].museum_prfx} ${Texts[i].museum_no})`;
            }
            } else if (Texts[i].publication_prfx && Texts[i].publication_no) {
            displayName = `${Texts[i].publication_prfx} ${Texts[i].publication_no}`;
            if (Texts[i].excavation_prfx && Texts[i].excavation_no) {
                displayName += ` (${Texts[i].excavation_prfx} ${Texts[i].excavation_no})`;
            } else if (Texts[i].museum_prfx && Texts[i].museum_no) {
                displayName += ` (${Texts[i].museum_prfx} ${Texts[i].museum_no})`;
            }
            } else if (Texts[i].excavation_prfx && Texts[i].excavation_no) {
            displayName = `${Texts[i].excavation_prfx} ${Texts[i].excavation_no}`;
            if (Texts[i].museum_prfx && Texts[i].museum_no) {
                displayName += ` (${Texts[i].museum_prfx} ${Texts[i].museum_no})`;
            }
            } else if (Texts[i].museum_prfx && Texts[i].museum_no) {
            displayName = `${Texts[i].museum_prfx} ${Texts[i].museum_no}`;
            } else {
            displayName = Texts[i].name;
            }

            await knex('text').where('uuid', Texts[i].uuid)
            .update('display_name', displayName);

        }     
}


export async function down(knex: Knex): Promise<void> {
    const hasTable= await knex.schema.hasTable('text');

    if (hasTable) {
        const hasColumn = await knex.schema.hasColumn('text', 'display_name');
        if (hasColumn) {
        await knex.schema.table('text', table => {
            table.dropColumn('display_name');
        });
       }
    }
}


