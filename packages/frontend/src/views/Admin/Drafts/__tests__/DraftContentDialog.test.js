import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import DraftContentPopup from '../DraftContentPopup.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DraftContentDialog test', () => {
  const draft = {
    notes: 'hello',
    content: [
      {
        side: 'obv.',
        text: 'my draft',
      },
    ],
  };
  const createWrapper = () =>
    mount(DraftContentPopup, {
      vuetify,
      localVue,
      propsData: {
        value: true,
        draft,
      },
    });

  it('shows notes', () => {
    const wrapper = createWrapper();
    expect(wrapper.html()).toContain(draft.notes);
  });

  it('shows draft content', () => {
    const wrapper = createWrapper();
    draft.content.forEach(sideData => {
      expect(wrapper.html()).toContain(sideData.side);
      expect(wrapper.html()).toContain(sideData.text);
    });
  });
});
