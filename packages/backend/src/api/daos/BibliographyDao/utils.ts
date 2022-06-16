import { dynamicImport } from 'tsimportlib';
import { ZoteroResponse } from '@oare/types';

export async function getZoteroResponse(
  zoteroKeys: string[],
  citationStyle: string,
  apiKey: string
): Promise<ZoteroResponse[]> {
  const fetch = (await dynamicImport(
    'node-fetch',
    module
  )) as typeof import('node-fetch');

  const response = await Promise.all(
    zoteroKeys.map(async zoteroKey => {
      const resp = await fetch.default(
        `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation&style=${citationStyle}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const json = (await resp.json()) as ZoteroResponse;
      return json;
    })
  );

  return response;
}
