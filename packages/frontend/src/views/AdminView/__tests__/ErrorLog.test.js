import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ErrorLog from '../ErrorLog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ErrorLog test', () => {
  const mockServer = {
    getErrorLog: jest.fn().mockResolvedValue({
      errors: [
        {
          uuid: 'testUuid',
          user_uuid: 'testUser',
          description: 'testDescription',
          stacktrace: 'testStacktrace',
          timestamp: new Date(),
          status: 'testStatus',
          userName: 'testName',
        },
      ],
      count: 1,
    }),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(ErrorLog, renderOptions);
  };

  it('successfully retrieves errors on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenCalled();
    expect(wrapper.html()).toContain('testStatus');
    expect(wrapper.html()).toContain('testDescription');
    expect(wrapper.html()).toContain('testName');
  });

  it('displays error on failed errors load', async () => {
    createWrapper({
      server: {
        getErrorLog: jest.fn().mockRejectedValue('failed error load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
