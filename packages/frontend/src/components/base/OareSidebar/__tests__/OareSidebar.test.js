import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OareSidebar from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareSidebar test', () => {
  const createWrapper = (isAdmin = true) =>
    mount(OareSidebar, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        store: {
          getters: {
            isAdmin,
          },
        },
      },
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('search button is disabled when inputs are all blank', () => {
    const searchBtn = createWrapper().find('.test-search-btn');
    expect(searchBtn.element).toHaveClass('v-btn--disabled');
  });

  it('Words search input is disabled when Text search field has value', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.find('.test-text-input').find('input');

    await textInput.setValue('CCT 1 1a');
    const wordsInput = wrapper.find('.test-words-input').find('input');
    expect(wordsInput.element).toBeDisabled();
  });

  it('Words search input is disabled when Transliteration search field has value', async () => {
    const wrapper = createWrapper();
    const transInput = wrapper
      .find('.test-transliteration-input')
      .find('input');

    await transInput.setValue('LUGAL');
    const wordsInput = wrapper.find('.test-words-input').find('input');
    expect(wordsInput.element).toBeDisabled();
  });

  it('Text and Transliteration fields are disabled when Words has value', async () => {
    const wrapper = createWrapper();
    const wordsInput = wrapper.find('.test-words-input').find('input');
    await wordsInput.setValue('ababum');

    const textInput = wrapper.find('.test-text-input').find('input');
    const transInput = wrapper
      .find('.test-transliteration-input')
      .find('input');
    expect(textInput.element).toBeDisabled();
    expect(transInput.element).toBeDisabled();
  });

  it('Clear button clears text and transliteration fields', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.find('.test-text-input').find('input');
    const transInput = wrapper
      .find('.test-transliteration-input')
      .find('input');

    await textInput.setValue('CCT');
    await transInput.setValue('LUGAL');

    const clearButton = wrapper.find('.test-clear-btn');
    await clearButton.trigger('click');

    expect(textInput.element).toHaveValue('');
    expect(transInput.element).toHaveValue('');
  });

  it('Clear button clears Words field', async () => {
    const wrapper = createWrapper();
    const wordsInput = wrapper.find('.test-words-input').find('input');
    await wordsInput.setValue('ababum');

    const clearButton = wrapper.find('.test-clear-btn');
    await clearButton.trigger('click');

    expect(wordsInput.element).toHaveValue('');
  });

  it('search button is disabled with no input', () => {
    const wrapper = createWrapper();
    const searchButton = wrapper.find('.test-search-btn');
    expect(searchButton.element).toHaveClass('v-btn--disabled');
  });

  it('search button is not disabled with Text input value', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.find('.test-text-input').find('input');
    await textInput.setValue('CCT');

    const searchButton = wrapper.find('.test-search-btn');
    expect(searchButton.element).not.toHaveClass('v-btn--disabled');
  });

  it('search button is not disabled with transliteration input value', async () => {
    const wrapper = createWrapper();
    const transInput = wrapper
      .find('.test-transliteration-input')
      .find('input');
    await transInput.setValue('LUGAL');

    const searchButton = wrapper.find('.test-search-btn');
    expect(searchButton.element).not.toHaveClass('v-btn--disabled');
  });

  it('search button is not disabled with words input value', async () => {
    const wrapper = createWrapper();
    const wordsInput = wrapper.find('.test-words-input input');
    await wordsInput.setValue('ababum');

    const searchButton = wrapper.find('.test-search-btn');
    expect(searchButton.element).not.toHaveClass('v-btn--disabled');
  });

  it('does not show words input if not an admin', () => {
    const wrapper = createWrapper(false);
    expect(wrapper.find('.test-words-input').exists()).toBe(false);
  });
});
