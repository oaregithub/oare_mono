import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ProfileRow from '../ProfileRow.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ProfileRow test', () => {
  const server = {
    reauthenticateUser: jest.fn().mockResolvedValue(),
    updateProfile: jest.fn().mockResolvedValue(),
  };

  const actions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  beforeEach(() => {
    sl.set('serverProxy', server);
    sl.set('globalActions', actions);
  });

  const createWrapper = props =>
    mount(ProfileRow, {
      vuetify,
      localVue,
      propsData: props || {
        label: 'First name',
        currentValue: 'User',
        property: 'firstName',
      },
    });

  it('displays label', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('First name');
  });

  it('edits value', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-edit-row').trigger('click');
    await wrapper.get('.test-edit-value input').setValue('New name');
    await wrapper.get('.test-submit-value').trigger('click');
    await flushPromises();
    expect(server.updateProfile).toHaveBeenCalledWith({
      firstName: 'New name',
    });
    expect(actions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar when there is an error updating the profile', async () => {
    sl.set('serverProxy', {
      ...server,
      updateProfile: jest.fn().mockRejectedValue('error updating profile'),
    });
    const wrapper = createWrapper();
    await wrapper.get('.test-edit-row').trigger('click');
    await wrapper.get('.test-edit-value input').setValue('New name');
    await wrapper.get('.test-submit-value').trigger('click');
    await flushPromises();
    expect(actions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('confirms password when updating email', async () => {
    const wrapper = createWrapper({
      label: 'Email',
      currentValue: 'test@email.com',
      property: 'email',
    });
    await wrapper.get('.test-edit-row').trigger('click');
    await wrapper.get('.test-confirm-password input').setValue('password');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(server.reauthenticateUser).toHaveBeenCalledWith('password');
    expect(wrapper.find('.test-edit-value').exists()).toBe(true);
  });
});
