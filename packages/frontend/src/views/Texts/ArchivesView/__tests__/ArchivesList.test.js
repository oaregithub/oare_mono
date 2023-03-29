import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ArchivesList from '../archives/ArchivesList.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const bibliography = {
  title: 'title',
  uuid: 'uuid',
  authors: ['author'],
  date: 'date',
  bibliography: {
    bib: 'bib',
    url: 'url',
  },
  itemType: null,
};

const fieldInfo = {
  uuid: 'uuid',
  referenceUuid: 'referenceUuid',
  field: 'field',
  primacy: 1,
  language: 'default',
  type: 'description',
};

const mockStore = {
  hasPermission: () => true,
};

const mockServer = {
  getBibliography: jest.fn().mockResolvedValue(bibliography),
};

describe('ArchivesList test', () => {
  const createWrapper = ({ server, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('store', store || mockStore);
    return render(ArchivesList, {
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
            bibliographyUuid: 'bibUuid',
            descriptions: [fieldInfo],
          },
          {
            uuid: '2',
            name: 'Archive2',
            totalTexts: 3,
            totalDossiers: 1,
            bibliographyUuid: 'bibUuid',
            descriptions: [],
          },
          {
            uuid: '3',
            name: 'Archive3',
            totalTexts: 30,
            totalDossiers: 7,
            bibliographyUuid: null,
            descriptions: [],
          },
          {
            uuid: '4',
            name: 'Archive4',
            totalTexts: 20,
            totalDossiers: 4,
            bibliographyUuid: null,
            descriptions: [],
          },
          {
            uuid: '5',
            name: 'Archive5',
            totalTexts: 15,
            totalDossiers: 8,
            bibliographyUuid: null,
            descriptions: [],
          },
          {
            uuid: '6',
            name: 'Archive6',
            totalTexts: 21,
            totalDossiers: 9,
            bibliographyUuid: null,
            descriptions: [],
          },
        ],
      },
    });
  };
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

  it('displays descriptions', () => {
    const { getByText } = createWrapper();
    [fieldInfo.field].forEach((description, index) => {
      expect(getByText(`${index + 1}. ${description}`));
    });
  });

  it('does not display bibliography when user does not have permission', () => {
    createWrapper({ store: { hasPermission: () => false } });
    expect(mockServer.getBibliography).toBeCalledTimes(0);
  });
});
