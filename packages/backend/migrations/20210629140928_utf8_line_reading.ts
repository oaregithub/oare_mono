/* eslint-disable no-await-in-loop */

import * as Knex from 'knex';
import { createTabletRenderer } from '@oare/oare';
import cliProgress from 'cli-progress';
import TextEpigraphyDao from '../build/src/api/daos/TextEpigraphyDao';

export async function up(knex: Knex): Promise<void> {
  const textUuids = await knex('text').pluck('uuid').orderBy('name');
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(textUuids.length, 0);

  for (let i = 0; i < 10; i += 1) {
    const textUuid = textUuids[i];
    const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
    const renderer = createTabletRenderer(units, { textFormat: 'html' });

    for (let j = 0; j < renderer.lines.length; j += 1) {
      const line = renderer.lines[j];
      const lineReading = renderer.lineReading(line);
      await knex('search_index').update('line_reading', lineReading).where({
        text_uuid: textUuid,
        line,
      });
    }
    progressBar.increment();
  }

  progressBar.stop();
}

export async function down(knex: Knex): Promise<void> {
  await knex('search_index')
    .update('line_reading', null)
    .whereNot('line_reading', null);
}
