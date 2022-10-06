import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import QuarantinedTexts from '../QuarantinedTexts.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('QuarantinedTexts test', () => {
  const mockServer = {
    getQuarantinedTexts: jest.fn().mockResolvedValue([
      {
        text: {
          uuid: 'text-uuid',
          type: 'test-type',
          name: 'test-text-name',
        },
        hasEpigraphy: true,
        timestamp: 'test-timestamp',
      },
    ]),
    restoreText: jest.fn().mockResolvedValue(),
    permanentlyDeleteText: jest.fn().mockResolvedValue(),
    reauthenticateUser: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn().mockResolvedValue(),
    showSnackbar: jest.fn().mockResolvedValue(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
  };

  beforeEach(setup);

  const createWrapper = () => mount(QuarantinedTexts, renderOptions);

  it('displays quarantined texts on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getQuarantinedTexts).toHaveBeenCalled();
    expect(wrapper.text()).toContain('test-text-name');
  });

  it('displays error snackbar on failed text list load', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getQuarantinedTexts: jest
        .fn()
        .mockRejectedValue('failed to get quarantine texts'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('test-text-name');
  });

  it('restores texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-restore-button').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.restoreText).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('test-text-name');
  });

  it('displays error snackbar on failed text restoration', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      restoreText: jest.fn().mockRejectedValue('failed to restore texts'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-restore-button').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(wrapper.text()).toContain('test-text-name');
  });

  it('permanently deletes texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-delete-button').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await wrapper.get('.test-confirm-password input').setValue('password');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.reauthenticateUser).toHaveBeenCalled();
    expect(mockServer.permanentlyDeleteText).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('test-text-name');
  });

  it('displays error snackbar on failed permanent deletion', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      permanentlyDeleteText: jest
        .fn()
        .mockRejectedValue('failed to delete text'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(0).trigger('click');
    await wrapper.get('.test-delete-button').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await wrapper.get('.test-confirm-password input').setValue('password');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.reauthenticateUser).toHaveBeenCalled();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(wrapper.text()).toContain('test-text-name');
  });
});
