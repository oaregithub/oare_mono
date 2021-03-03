import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import RegisterView from '../RegisterView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('RegisterView test', () => {
  const mockProps = {
    router: {
      push: jest.fn(),
    },
  };

  const mockServer = {
    register: jest.fn().mockResolvedValue({
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      isAdmin: false,
    }),
  };

  const mockStore = {
    setUser: jest.fn(),
  };
  const createWrapper = ({ server, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('store', store || mockStore);
    return mount(RegisterView, {
      localVue,
      vuetify,
      propsData: mockProps,
      mocks: {
        $t: jest.fn().mockReturnValue('string'),
      },
      stubs: ['router-link'],
    });
  };

  const fillInForm = async wrapper => {
    const firstNameInput = wrapper.find('.test-firstname input');
    await firstNameInput.setValue('First');

    const lastNameInput = wrapper.find('.test-lastname input');
    await lastNameInput.setValue('Last');

    const emailInput = wrapper.find('.test-email input');
    await emailInput.setValue('email@test.com');

    const passwordInput = wrapper.find('.test-password input');
    await passwordInput.setValue('password');

    const confPasswordInput = wrapper.find('.test-confirm-password input');
    await confPasswordInput.setValue('password');
  };

  const submitForm = async wrapper => {
    const registerBtn = wrapper.find('.test-register-btn');
    await registerBtn.trigger('click');
    await flushPromises();
  };

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('confirm button is disabled unless all fields are filled in', async () => {
    const wrapper = createWrapper();
    const registerBtn = wrapper.find('.test-register-btn');
    expect(registerBtn.element).toBeDisabled();

    const firstNameInput = wrapper.find('.test-firstname input');
    await firstNameInput.setValue('First');
    expect(registerBtn.element).toBeDisabled();

    const lastNameInput = wrapper.find('.test-lastname input');
    await lastNameInput.setValue('Last');
    expect(registerBtn.element).toBeDisabled();

    const emailInput = wrapper.find('.test-email input');
    await emailInput.setValue('email@test.com');
    expect(registerBtn.element).toBeDisabled();

    const passwordInput = wrapper.find('.test-password input');
    await passwordInput.setValue('password');
    expect(registerBtn.element).toBeDisabled();

    const confPasswordInput = wrapper.find('.test-confirm-password input');
    await confPasswordInput.setValue('password');
    expect(registerBtn.element).not.toBeDisabled();
  });

  it('successfully submits form', async () => {
    const wrapper = createWrapper();
    await fillInForm(wrapper);
    await submitForm(wrapper);

    expect(mockServer.register).toHaveBeenCalledWith({
      firstName: 'First',
      lastName: 'Last',
      password: 'password',
      email: 'email@test.com',
    });
    expect(mockStore.setUser).toHaveBeenCalled();
    expect(mockProps.router.push).toHaveBeenCalledWith('/');
  });

  it("doesn't submit form if passwords don't match", async () => {
    const wrapper = createWrapper();
    await fillInForm(wrapper);

    const confPasswordInput = wrapper.find('.test-confirm-password input');
    await confPasswordInput.setValue('not-matching');

    await submitForm(wrapper);

    expect(mockStore.setUser).not.toHaveBeenCalled();
    expect(mockProps.router.push).not.toHaveBeenCalled();
  });

  it("doesn't submit if password is less than 8 characters", async () => {
    const wrapper = createWrapper();
    await fillInForm(wrapper);

    const passwordInput = wrapper.find('.test-password input');
    await passwordInput.setValue('short');

    await submitForm(wrapper);

    expect(mockStore.setUser).not.toHaveBeenCalled();
    expect(mockProps.router.push).not.toHaveBeenCalled();
  });

  it("doesn't submit if email is formatted incorrectly", async () => {
    const wrapper = createWrapper();
    await fillInForm(wrapper);

    const emailInput = wrapper.find('.test-email input');
    await emailInput.setValue('bademail');

    await submitForm(wrapper);

    expect(mockStore.setUser).not.toHaveBeenCalled();
    expect(mockProps.router.push).not.toHaveBeenCalled();
  });

  it('shows error message if network calls fail', async () => {
    const wrapper = createWrapper({
      server: {
        register: jest.fn().mockRejectedValue({
          response: {
            data: {
              message: 'Email already taken',
            },
          },
        }),
      },
    });

    await fillInForm(wrapper);
    await submitForm(wrapper);

    const errorMsg = wrapper.find('.test-error-msg');
    expect(errorMsg.text()).toBe('Email already taken');
    expect(mockStore.setUser).not.toHaveBeenCalled();
    expect(mockProps.router.push).not.toHaveBeenCalled();
  });
});
