import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import Stoplight from '../Stoplight.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Stoplight', () => {
  const createWrapper = color =>
    mount(Stoplight, {
      vuetify,
      localVue,
      propsData: {
        color,
        colorMeaning: 'Test stoplight meaning',
      },
    });

  const lightClasses = color => color.split('/').map(c => c.toLowerCase());
  const darkClasses = color =>
    ['red', 'yellow', 'green'].filter(c => !lightClasses(color).includes(c));

  it('correctly displays colors', () => {
    ['Red', 'Yellow', 'Green', 'Yellow/Green', 'Yellow/Red'].forEach(color => {
      const wrapper = createWrapper(color);
      const lights = lightClasses(color);
      const darks = darkClasses(color);

      lights.forEach(c => {
        expect(wrapper.get(`.sl-light-${c}`));
      });

      darks.forEach(c => {
        expect(wrapper.get(`.sl-dark-${c}`));
      });
    });
  });
});
