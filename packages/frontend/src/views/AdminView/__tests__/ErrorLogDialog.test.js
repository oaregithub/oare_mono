import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ErrorLogDialog from '../ErrorLogDialog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ErrorLogDialog Test', () => {
  const mockServer = {
    updateErrorStatus: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      value: true,
      error: {
        uuid: 'testUuid',
        user_uuid: 'testUser',
        description: 'testDescription',
        stacktrace: 'testStacktrace',
        timestamp: new Date(),
        status: 'testStatus',
        userName: 'testName',
      },
    },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(ErrorLogDialog, renderOptions);
  };

  it('correctly displays dialog', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const testStatus = await wrapper.get('.test-status');
    expect(testStatus.text()).toBe('testStatus');
    const testName = await wrapper.get('.test-user-name');
    expect(testName.text()).toBe('testName');
    const testDescription = await wrapper.get('.test-description');
    expect(testDescription.text()).toBe('testDescription');
    const testStacktrace = await wrapper.get('.test-stacktrace');
    expect(testStacktrace.text()).toBe('testStacktrace');
  });

  it('updates status on dropdown select', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const testDropdown = await wrapper.get('.v-select__selections');
    await testDropdown.trigger('click');
    const testOption = await wrapper.findAll('.v-list-item__title').at(1);
    await testOption.trigger('click');
    await flushPromises();
    expect(mockServer.updateErrorStatus).toHaveBeenCalled();
  });

  it('displays error snackbar on failed status update', async () => {
    const wrapper = createWrapper({
      server: {
        updateErrorStatus: jest.fn().mockRejectedValue('failed status update'),
      },
    });
    await flushPromises();
    const testDropdown = await wrapper.get('.v-select__selections');
    await testDropdown.trigger('click');
    const testOption = await wrapper.findAll('.v-list-item__title').at(1);
    await testOption.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
