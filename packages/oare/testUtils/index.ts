import axios from 'axios'; // eslint-disable-line
import {
  EpigraphicUnit, MarkupUnit, createTabletRenderer, TabletRenderer,
} from '../src/index';

export async function getEpigraphies(textUuid: string): Promise<EpigraphicUnit[]> {
  const { data } = await axios.get(`http://localhost:8081/api/v2/text_epigraphies/${textUuid}`);
  return data.units;
}

export async function getMarkups(textUuid: string): Promise<MarkupUnit[]> {
  const { data } = await axios.get(`http://localhost:8081/api/v2/markups/${textUuid}`);
  return data;
}

export async function createRenderer(textUuid: string): Promise<TabletRenderer> {
  const units = await getEpigraphies(textUuid);
  const markups = await getMarkups(textUuid);

  return createTabletRenderer(units, markups);
}
