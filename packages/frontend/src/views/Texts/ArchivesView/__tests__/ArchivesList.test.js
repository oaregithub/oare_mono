import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ArchivesList from '../archives/ArchivesList.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ArchivesList test', () => {
  const createWrapper = () =>
    render(ArchivesList, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        archives: [
          {
            uuid: '1',
            name: 'Archive1',
            totalTexts: 6,
            totalDossiers: 2,
          },
          {
            uuid: '2',
            name: 'Archive2',
            totalTexts: 3,
            totalDossiers: 1,
          },
          {
            uuid: '3',
            name: 'Archive3',
            totalTexts: 30,
            totalDossiers: 7,
          },
          {
            uuid: '4',
            name: 'Archive4',
            totalTexts: 20,
            totalDossiers: 4,
          },
          {
            uuid: '5',
            name: 'Archive5',
            totalTexts: 15,
            totalDossiers: 8,
          },
          {
            uuid: '6',
            name: 'Archive6',
            totalTexts: 21,
            totalDossiers: 9,
          },
        ],
      },
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('displays archives', () => {
    const { getByText } = createWrapper();
    [
      'Archive1 (6 texts | 2 dossiers)',
      'Archive2 (3 texts | 1 dossiers)',
      'Archive3 (30 texts | 7 dossiers)',
      'Archive4 (20 texts | 4 dossiers)',
      'Archive5 (15 texts | 8 dossiers)',
      'Archive6 (21 texts | 9 dossiers)',
    ].forEach(name => {
      expect(getByText(name));
    });
  });
});
