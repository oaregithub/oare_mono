import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ArchiveInfo from '../archives/components/ArchiveInfo.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ArchiveInfo', () => {
  const archiveInfo = {
    name: 'mockArchive',
    uuid: 'mockUuid',
    totalTexts: 1,
    totalDossiers: 1,
    bibliographyUuid: 'bibUuid',
    descriptions: [
      {
        uuid: 'uuid',
        referenceUuid: 'referenceUuid',
        field: 'field',
        primacy: 1,
        language: 'default',
        type: 'description',
      },
    ],
  };

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

  const mockServer = {
    getBibliography: jest.fn().mockResolvedValue(bibliography),
    deletePropertyDescriptionField: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: () => true,
  };

  const mockProps = {
    archive: { ...archiveInfo },
    showRouterLink: true,
    allowCUD: false,
  };

  const createWrapper = ({ server, actions, store, propsData } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(ArchiveInfo, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      propsData: propsData ? { ...propsData } : { ...mockProps },
    });
  };

  it('retrieves bibliography on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getBibliography).toHaveBeenCalled();
  });

  it('does not show bibliography when user does not have permission', async () => {
    createWrapper({ store: { hasPermission: () => false } });
    await flushPromises();
    expect(mockServer.getBibliography).toBeCalledTimes(0);
  });

  it('shows error snackbar when bibliography fail to load', async () => {
    createWrapper({
      server: {
        getBibliography: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
