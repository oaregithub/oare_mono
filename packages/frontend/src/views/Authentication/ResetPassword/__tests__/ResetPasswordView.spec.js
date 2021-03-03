import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ResetPasswordView from '../ResetPasswordView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ResetPasswordView test', () => {
  const mockProps = {
    uuid: 'reset-uuid',
  };
  const mockServer = {
    resetPassword: jest.fn().mockResolvedValue(null),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    return mount(ResetPasswordView, {
      localVue,
      vuetify,
      propsData: {
        ...mockProps,
      },
      stubs: ['router-link'],
    });
  };

  it('submit button is disabled when there is no input', () => {
    const wrapper = createWrapper();
    expect(wrapper.get('.test-submit').element).toBeDisabled();
  });

  it('submit button is disabled when passwords do not match', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-new-password input').setValue('password');
    await wrapper
      .get('.test-confirm-new-password input')
      .setValue('not matching password');
    expect(wrapper.get('.test-submit').element).toBeDisabled();
  });

  it('successfully resets password', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-new-password input').setValue('password');
    await wrapper.get('.test-confirm-new-password input').setValue('password');
    await wrapper.get('.test-submit').trigger('click');
    await flushPromises();
    expect(mockServer.resetPassword).toHaveBeenCalledWith({
      resetUuid: mockProps.uuid,
      newPassword: 'password',
    });
  });

  it('shows try again button if there is an error', async () => {
    const wrapper = createWrapper({
      server: {
        resetPassword: jest.fn().mockRejectedValue('Failed to reset password'),
      },
    });

    await wrapper.get('.test-new-password input').setValue('password');
    await wrapper.get('.test-confirm-new-password input').setValue('password');
    await wrapper.get('.test-submit').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-action').text()).toBe('Try again');
  });

  it('displays server error message on 400 error', async () => {
    const wrapper = createWrapper({
      server: {
        resetPassword: jest.fn().mockRejectedValue({
          response: {
            status: 400,
            data: {
              message: 'Test error',
            },
          },
        }),
      },
    });

    await wrapper.get('.test-new-password input').setValue('password');
    await wrapper.get('.test-confirm-new-password input').setValue('password');
    await wrapper.get('.test-submit').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-error-msg').text()).toBe('Test error');
  });

  it("doesn't allow submitting a password less than 8 characters", async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-new-password input').setValue('123');
    await wrapper.get('.test-confirm-new-password input').setValue('123');
    expect(wrapper.get('.test-submit').element).toBeDisabled();
  });
});
