import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import IndivPersonView from '../IndivPerson.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('IndivPersonView test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockServer = {
    getPersonInfo: jest.fn().mockResolvedValue({
      person: {
        uuid: 'string',
        nameUuid: null,
        relation: null,
        relationNameUuid: null,
        label: 'string',
        descriptor: null,
      },
      display: 'string',
      father: null,
      mother: null,
      asshatumWives: [],
      amtumWives: [],
      husbands: [],
      siblings: [],
      children: [],
      durableRoles: [],
      discussion: [],
      temporaryRoles: [],
    }),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(IndivPersonView, {
      vuetify,
      localVue,
    });
  };

  it('gets periods on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPersonInfo).toHaveBeenCalled();
  });

  it('shows snackbar when periods retrieval fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getIndivPerson: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
