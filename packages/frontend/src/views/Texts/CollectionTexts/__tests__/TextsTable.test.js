import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { render } from '@testing-library/vue';
import { createLocalVue } from '@vue/test-utils';
import TextsTable from '../TextsTable.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextsTable test', () => {
  const texts = [
    {
      id: 1,
      uuid: '1',
      type: 'text',
      hasEpigraphy: true,
      name: 'CCT 3 31',
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: null,
      museumNumber: null,
      publicationPrefix: null,
      publicationNumber: null,
    },
    {
      id: 2,
      uuid: '2',
      type: 'text',
      hasEpigraphy: true,
      name: 'CCT 1 12b',
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: null,
      museumNumber: null,
      publicationPrefix: null,
      publicationNumber: null,
    },
  ];
  const mockProps = {
    loading: false,
    texts,
    totalTexts: 2,
  };

  const createWrapper = () =>
    render(TextsTable, {
      localVue,
      vuetify,
      propsData: mockProps,
      stubs: ['router-link'],
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('displays names of all texts', () => {
    const { getByText } = createWrapper();

    texts
      .map(t => t.name)
      .forEach(name => {
        expect(getByText(name));
      });
  });
});
