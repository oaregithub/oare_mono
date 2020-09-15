import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue } from '@vue/test-utils';
import { render, fireEvent } from '@testing-library/vue';
import CollectionsList from '../CollectionsList.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('CollectionsList test', () => {
  const createWrapper = () =>
    render(CollectionsList, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        collections: [
          {
            uuid: '1',
            name: 'Adana Museum',
          },
          {
            uuid: '2',
            name: 'Istanbul Archaeological Museum',
          },
          {
            uuid: '3',
            name: 'Kayseri Museum',
          },
          {
            uuid: '4',
            name: 'Kt 08/k',
          },
          {
            uuid: '5',
            name: 'Metropolitan Museum of Art',
          },
          {
            uuid: '6',
            name: 'Schoyen Collection',
          },
        ],
      },
    });

  it('matches snapshot', () => {
    expect(createWrapper()).toMatchSnapshot();
  });

  it('displays A-J texts', () => {
    const { getByText } = createWrapper();
    ['Adana Museum', 'Istanbul Archaeological Museum'].forEach((name) => {
      expect(getByText(name));
    });
  });

  it('displays K texts', async () => {
    const { getByText } = createWrapper();
    const kButton = getByText('K');

    await fireEvent.click(kButton);
    [('Kayseri Museum', 'Kt 08/k')].forEach((name) => {
      expect(getByText(name));
    });
  });

  it('displays L-Z texts', async () => {
    const { getByText } = createWrapper();
    const lzButton = getByText('L-Z');

    await fireEvent.click(lzButton);
    [('Metropolitan Museum of Art', 'Schoyen Collection')].forEach((name) => {
      expect(getByText(name));
    });
  });
});
