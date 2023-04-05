import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import ArchivesView from '../index.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ArchivesView', () => {
  const archiveInfo = {
    name: 'mockArchive',
    uuid: 'mockUuid',
    totalTexts: 1,
    totalDossiers: 1,
    bibliographyUuid: 'bibUuid',
    descriptions: [],
  };

  const mockServer = {
    getAllArchives: jest.fn().mockResolvedValue([archiveInfo]),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: () => true,
  };

  const createWrapper = ({ server, actions, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(ArchivesView, {
      vuetify,
      localVue,
      stubs: ['router-link'],
    });
  };

  it('retrieves archives on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllArchives).toHaveBeenCalled();
  });

  it('shows error snackbar when archives fail to load', async () => {
    createWrapper({
      server: {
        getAllArchives: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
