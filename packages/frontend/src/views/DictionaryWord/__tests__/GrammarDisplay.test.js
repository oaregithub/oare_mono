import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import GrammarDisplay from '../GrammarDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('GrammarDisplay test', () => {
  const mockForm = {
    form: 'Test-form',
    stems: [],
    tenses: [],
    persons: [],
    genders: [],
    grammaticalNumbers: [],
    cases: [],
    states: [],
    moods: [],
    clitics: [],
    morphologicalForms: [],
    suffix: null,
    spellings: [
      {
        uuid: 'spelling-uuid',
        spelling: 'spelling',
        texts: [
          {
            uuid: 'text-uuid',
            text: 'text',
          },
        ],
      },
    ],
  };
  const createWrapper = () =>
    mount(GrammarDisplay, {
      vuetify,
      localVue,
      propsData: {
        form: mockForm,
      },
      stubs: ['router-link'],
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('shows number of texts next to spelling', () => {
    const wrapper = createWrapper();
    expect(Number(wrapper.find('.test-num-texts').text())).toBe(
      mockForm.spellings[0].texts.length
    );
  });

  it('shows dialog when clicking on number of texts', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.test-num-texts').trigger('click');
    expect(wrapper.find('.test-dialog-title').text()).toBe(
      `Texts for ${mockForm.spellings[0].spelling}`
    );
  });

  it('shows texts associated with spelling', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.test-num-texts').trigger('click');
    expect(wrapper.find('.test-text').text()).toBe(
      mockForm.spellings[0].texts[0].text
    );
  });
});
