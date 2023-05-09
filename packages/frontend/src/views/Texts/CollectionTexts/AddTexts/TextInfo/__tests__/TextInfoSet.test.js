import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import sl from '@/serviceLocator';
import TextInfoSet from '../TextInfoSet.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextInfoSet test', () => {
  const mockServer = {
    getTaxonomyPropertyTree: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: { isAdmin: true },
    hasPermission: name => ['EDIT_ITEM_PROPERTIES'].includes(name),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
    sl.set('lodash', mockLodash);
  };

  beforeEach(setup);

  const createWrapper = () =>
    mount(TextInfoSet, {
      vuetify,
      localVue,
    });

  it('allows advancement if text name is input and a pair is filled in', async () => {
    const wrapper = createWrapper();
    const textNameField = wrapper.get('.test-text-name input');
    await textNameField.setValue('Test Name');
    const excavationPrefixField = wrapper.get('.test-excavation-prefix input');
    await excavationPrefixField.setValue('Test Exc Pref');
    const excavationNumberField = wrapper.get('.test-excavation-number input');
    await excavationNumberField.setValue('Test Exc No');
    expect(wrapper.emitted('step-complete')).toBeTruthy();
    expect(wrapper.emitted('step-complete')[0]).toEqual([true]);
  });

  it('does not allow advancement if text name is empty', async () => {
    const wrapper = createWrapper();
    const textNameField = wrapper.get('.test-text-name input');
    await textNameField.setValue('Test Name');
    const excavationPrefixField = wrapper.get('.test-excavation-prefix input');
    await excavationPrefixField.setValue('Test Exc Pref');
    const excavationNumberField = wrapper.get('.test-excavation-number input');
    await excavationNumberField.setValue('Test Exc No');
    await textNameField.setValue('');
    expect(wrapper.emitted('step-complete')).toBeTruthy();
    expect(wrapper.emitted('step-complete')[1]).toEqual([false]);
  });

  it('updates text info when values are input', async () => {
    const wrapper = createWrapper();
    const textNameField = wrapper.get('.test-text-name input');
    await textNameField.setValue('Test Name');
    expect(wrapper.emitted('update-text-info')).toBeTruthy();
  });
});
