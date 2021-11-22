import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import TextInfoSet from '../TextInfoSet.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextInfoSet test', () => {
  const createWrapper = () =>
    mount(TextInfoSet, {
      vuetify,
      localVue,
    });

  it('allows advancement if text name is input', async () => {
    const wrapper = createWrapper();
    const textNameField = wrapper.get('.test-text-name input');
    await textNameField.setValue('Test Name');
    expect(wrapper.emitted('step-complete')).toBeTruthy();
    expect(wrapper.emitted('step-complete')[0]).toEqual([true]);
  });

  it('does not allow advancement if text name is empty', async () => {
    const wrapper = createWrapper();
    const textNameField = wrapper.get('.test-text-name input');
    await textNameField.setValue('Test Name');
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
