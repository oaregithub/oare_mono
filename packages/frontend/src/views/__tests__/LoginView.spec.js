import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import LoginView from '../LoginView.vue';
import flushPromises from 'flush-promises';
import sl from '../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('LoginView test', () => {
  const mockServer = {
    login: jest.fn().mockResolvedValue({
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@email.com',
      isAdmin: false,
    }),
    getPermissions: jest.fn().mockResolvedValue({
      dictionary: [],
    }),
  };

  const mockStore = {
    setUser: jest.fn(),
    setPermissions: jest.fn(),
  };
  const mockProps = {
    router: {
      push: jest.fn(),
    },
  };
  const createWrapper = ({ store, server } = {}) => {
    sl.set('store', store || mockStore);
    sl.set('serverProxy', server || mockServer);

    return mount(LoginView, {
      localVue,
      vuetify,
      mocks: {
        $t: jest.fn(),
      },
      propsData: mockProps,
      stubs: ['router-link'],
    });
  };

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('logs in and gets permissions', async () => {
    const wrapper = createWrapper();
    const emailInput = wrapper.find('.test-email input');
    const passwordInput = wrapper.find('.test-password input');

    await emailInput.setValue('myemail@test.com');
    await passwordInput.setValue('password');

    const signinBtn = wrapper.find('.test-signin-btn');
    await signinBtn.trigger('click');
    await flushPromises();

    expect(mockServer.login).toHaveBeenCalledWith({
      email: 'myemail@test.com',
      password: 'password',
    });
    expect(mockStore.setUser).toHaveBeenCalled();
    expect(mockServer.getPermissions).toHaveBeenCalled();
    expect(mockStore.setPermissions).toHaveBeenCalled();
  });

  it('sign in button is only active when fields are filled in', async () => {
    const wrapper = createWrapper();

    const signinButton = wrapper.find('.test-signin-btn');
    expect(signinButton.element).toBeDisabled();

    const emailInput = wrapper.find('.test-email input');
    await emailInput.setValue('email');
    expect(signinButton.element).toBeDisabled();

    const passwordInput = wrapper.find('.test-password input');
    await passwordInput.setValue('password');
    expect(signinButton.element).toBeEnabled();
  });

  it('displays error message on unsuccessful login', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        login: jest.fn().mockRejectedValue({
          response: { data: { message: 'Invalid login' } },
        }),
      },
    });

    const emailInput = wrapper.find('.test-email input');
    const passwordInput = wrapper.find('.test-password input');
    const signinButton = wrapper.find('.test-signin-btn');

    await emailInput.setValue('email');
    await passwordInput.setValue('password');
    await signinButton.trigger('click');
    await flushPromises();

    const errorText = wrapper.find('.test-error-text');
    expect(errorText.text()).toBe('Invalid login');
  });
});
