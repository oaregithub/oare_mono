import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import SendResetPasswordEmailView from '../SendResetPasswordEmailView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('SendResetPasswordEmailView test', () => {
  const mockServer = {
    sendResetPasswordEmail: jest.fn().mockResolvedValue(null),
    logError: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);

    return mount(SendResetPasswordEmailView, {
      localVue,
      vuetify,
      stubs: ['router-link'],
    });
  };

  it('sends reset email', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.test-email-field input').setValue('test@email.com');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockServer.sendResetPasswordEmail).toHaveBeenCalledWith(
      'test@email.com'
    );
  });

  it('submit button is disabled with empty input field', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.test-submit-btn').element).toBeDisabled();
  });

  it('shows error snackbar if sending email fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        sendResetPasswordEmail: jest
          .fn()
          .mockRejectedValue('Failed to send email'),
      },
    });

    await wrapper.find('.test-email-field input').setValue('test@email.com');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
