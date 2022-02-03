import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue } from '@vue/test-utils';
import { render, fireEvent } from '@testing-library/vue';
import PublicationsList from '../PublicationsList.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PublicationsList test', () => {
  const createWrapper = () =>
    render(PublicationsList, {
      localVue,
      vuetify,
      stubs: ['router-link'],
      propsData: {
        publications: [
          {
            prefix: 'AAA 1',
            textNumbers: [
              {
                textUuid: '1',
                type: 'logosyllabic',
                name: '1',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: null,
                museumNumber: null,
                publicationPrefix: 'AAA 1',
                publicationNumber: '1',
              },
            ],
          },
          {
            prefix: 'AnOr 42',
            textNumbers: [
              {
                textUuid: '2',
                type: 'logosyllabic',
                name: '171',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: null,
                museumNumber: null,
                publicationPrefix: 'AnOr 42',
                publicationNumber: '171',
              },
            ],
          },
          {
            prefix: 'BIN 4',
            textNumbers: [
              {
                textUuid: '3',
                type: 'logosyllabic',
                name: '1 (NBC 1741)',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: 'NBC',
                museumNumber: 'NBC',
                publicationPrefix: 'BIN 4',
                publicationNumber: '1',
              },
            ],
          },
          {
            prefix: 'Chantre',
            textNumbers: [
              {
                textUuid: '4',
                type: 'logosyllabic',
                name: '1',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: null,
                museumNumber: null,
                publicationPrefix: 'Chantre',
                publicationNumber: '1',
              },
            ],
          },
          {
            prefix: 'JEOL 32',
            textNumbers: [
              {
                textUuid: '5',
                type: 'logosyllabic',
                name: '98f. (Kt k/k 35a)',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: null,
                museumNumber: null,
                publicationPrefix: 'JEOL 32',
                publicationNumber: '98f.',
              },
            ],
          },
          {
            prefix: 'RA 81',
            textNumbers: [
              {
                textUuid: '6',
                type: 'logosyllabic',
                name: '1',
                excavationPrefix: null,
                excavationNumber: null,
                museumPrefix: null,
                museumNumber: null,
                publicationPrefix: 'RA 81',
                publicationNumber: '1',
              },
            ],
          },
        ],
      },
    });

  it('displays A publications', () => {
    const { getByText } = createWrapper();
    ['AAA 1 (1 item)', 'AnOr 42 (1 item)'].forEach(prefix => {
      expect(getByText(prefix));
    });
  });

  it('displays B-I publications', async () => {
    const { getByText } = createWrapper();
    const biButton = getByText('B-I');

    await fireEvent.click(biButton);
    [('BIN 4 (1 item)', 'Chantre (1 item)')].forEach(prefix => {
      expect(getByText(prefix));
    });
  });

  it('displays J-Z texts', async () => {
    const { getByText } = createWrapper();
    const jzButton = getByText('J-Z');

    await fireEvent.click(jzButton);
    [('JEOL 32 (1 item)', 'RA 81 (1 item)')].forEach(prefix => {
      expect(getByText(prefix));
    });
  });
});
