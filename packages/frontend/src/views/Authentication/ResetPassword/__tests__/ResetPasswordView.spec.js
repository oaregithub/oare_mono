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
    verifyPasswordResetCode: jest.fn().mockResolvedValue('test@email.com'),
  };
  const mockRouter = {
    currentRoute: {
      query: {
        oobCode: 'code',
      },
    },
  };

  const createWrapper = () =>
    mount(ResetPasswordView, {
      localVue,
      vuetify,
      propsData: {
        ...mockProps,
      },
      stubs: ['router-link'],
    });

  beforeEach(() => {
    sl.set('serverProxy', mockServer);
    sl.set('router', mockRouter);
  });

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
    expect(mockServer.resetPassword).toHaveBeenCalledWith('code', 'password');
  });

  it('shows try again button if there is an error', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      resetPassword: jest.fn().mockRejectedValue({
        code: 'auth/invalid-action-code',
        message: 'Code was invalid',
      }),
    });
    const wrapper = createWrapper();

    await wrapper.get('.test-new-password input').setValue('password');
    await wrapper.get('.test-confirm-new-password input').setValue('password');
    await wrapper.get('.test-submit').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-action').text()).toBe('Try again');
  });

  it('verifies code on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.verifyPasswordResetCode).toHaveBeenCalledWith('code');
  });

  it.each([
    ['auth/expired-action-code', 'The code you have provided is expired.'],
    ['auth/invalid-action-code', 'The code you have provided is invalid.'],
    ['auth/user-not-found', 'No user was found for the given code.'],
    ['other-error', 'There was an unknown error.'],
  ])('shows error with %s code ', async (code, message) => {
    sl.set('serverProxy', {
      ...mockServer,
      verifyPasswordResetCode: jest.fn().mockRejectedValue({
        code,
      }),
    });

    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.get('.test-error-msg').text()).toBe(message);
  });

  it("doesn't allow submitting a password less than 8 characters", async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-new-password input').setValue('123');
    await wrapper.get('.test-confirm-new-password input').setValue('123');
    expect(wrapper.get('.test-submit').element).toBeDisabled();
  });
});
