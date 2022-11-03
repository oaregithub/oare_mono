import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import BibliographyView from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const bibliographyResponse = [
  {
    title: 'title1',
    authors: 'first author',
    date: 'Jan 2000',
    bibliography: {
      bib: 'bib1',
      url: 'url1',
    },
    itemType: 'journal',
  },
  {
    title: 'title2',
    authors: 'author2',
    date: 'Jan 2001',
    bibliography: {
      bib: 'bib2',
      url: 'url2',
    },
    itemType: 'book',
  },
];

describe('Bibliography test', () => {
  const mockServer = {
    getBibliographies: jest.fn().mockResolvedValue(bibliographyResponse),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockStore = {
    getters: { isAdmin: false },
  };
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', mockStore);

    return mount(BibliographyView, {
      vuetify,
      localVue,
    });
  };

  it('gets bibliographies', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getBibliographies).toHaveBeenCalled();
  });

  it('displays error when fails to retrieve bibliographies', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getBibliographies: jest
          .fn()
          .mockRejectedValue('unable to get bibliographies'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('get bibliographies when bib type is changed', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const bibType = wrapper.find('.test-radio-btn-bibType-1');
    await bibType.trigger('click');
    await flushPromises();
    expect(mockServer.getBibliographies).toBeCalledTimes(3);
  });
});
