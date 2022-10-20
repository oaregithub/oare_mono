import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import flushPromises from 'flush-promises';
import SealsView from '../SealList.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const sealList = [
  { name: 'seal1', uuid: 'uuid1', count: 3, imageLinks: [] },
  { name: 'seal2', uuid: 'uuid2', count: 0, imageLinks: ['link1'] },
];

const mockServer = {
  getAllSeals: jest.fn().mockResolvedValue(sealList),
};

const mockActions = {
  showErrorSnackbar: jest.fn(),
};

describe('Seal List test', () => {
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);

    return render(SealsView, {
      localVue,
      vuetify,
      stubs: ['router-link'],
    });
  };

  it('retrieves seals on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllSeals).toHaveBeenCalled();
  });

  it('retrieves seals on load', async () => {
    createWrapper({
      server: { getAllSeals: jest.fn().mockRejectedValue() },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
