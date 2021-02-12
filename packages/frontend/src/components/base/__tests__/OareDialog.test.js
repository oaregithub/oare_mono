import { mount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import OareDialog from '../OareDialog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareDialog', () => {
  const createWrapper = (props = {}) =>
    mount(OareDialog, {
      localVue,
      vuetify,
      propsData: {
        title: 'Test Dialog',
        value: true,
        ...props,
      },
    });

  test('matches snapshot', () => {
    const wrapper = createWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  test('shows title', () => {
    const wrapper = createWrapper();
    const title = wrapper.find('[data-testid="dialog-title"]');
    expect(title.text()).toBe('Test Dialog');
  });

  test('default submit text is "Submit"', () => {
    const wrapper = createWrapper();
    const submitBtn = wrapper.find('.test-submit-btn');
    expect(submitBtn.text()).toBe('Submit');
  });

  test('default cancel text is "Cancel"', () => {
    const wrapper = createWrapper();
    const cancelBtn = wrapper.find('[data-testid="cancel-btn"');
    expect(cancelBtn.text()).toBe('Cancel');
  });

  test('override default submit text', () => {
    const wrapper = createWrapper({
      submitText: 'Custom submit',
    });
    const submitBtn = wrapper.find('.test-submit-btn');
    expect(submitBtn.text()).toBe('Custom submit');
  });

  test('override default cancel text', () => {
    const wrapper = createWrapper({
      cancelText: 'Custom cancel',
    });
    const cancelBtn = wrapper.find('[data-testid="cancel-btn"]');
    expect(cancelBtn.text()).toBe('Custom cancel');
  });

  test('submitLoading disables submit button', () => {
    const wrapper = createWrapper({
      submitLoading: true,
    });
    const submitBtn = wrapper.find('.test-submit-btn').element;
    expect(submitBtn).toBeDisabled();
  });
});
