import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EpigraphyView from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Epigraphy View', () => {
  const mockServer = {
    getEpigraphicInfo: jest.fn().mockResolvedValue({
      collection: {
        uuid: 'test',
        name: 'test',
      },
      units: null,
      canWrite: false,
      text: {
        uuid: 'testUuid',
        type: 'testType',
        name: 'testName',
        excavationPrefix: 'testExcavationPrefix',
        excavationNumber: 'testExcavationNumber',
        museumPrefix: 'testMuseumPrefix',
        museumNumber: 'testMuseumNumber',
        publicationPrefix: 'testPublicationPrefix',
        publicationNumber: 'testPublicationNumber',
      },
      cdliNum: 'test',
      color: 'red',
      colorMeaning: 'test meaning',
      discourseUnits: [],
      markups: [],
      hasEpigraphy: true,
    }),
    getSingleDraft: jest.fn().mockResolvedValue({}),
    getImageLinks: jest.fn().mockResolvedValue([
      { link: 'test-cdli-link', label: 'CDLI' },
      { link: 'test-s3-link', label: 'S3' },
    ]),
    quarantineText: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: jest.fn().mockResolvedValue(false),
    },
    hasPermission: name => ['VIEW_EPIGRAPHY_IMAGES'].includes(name),
  };

  const mockRouter = {
    currentRoute: {
      name: 'epigraphy',
    },
    push: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      textUuid: '123',
    },
    stubs: ['router-link', 'router-view'],
  };

  const createWrapper = ({ server, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', store || mockStore);
    sl.set('router', mockRouter);

    return mount(EpigraphyView, renderOptions);
  };

  it('displays error on text load error', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getEpigraphicInfo: jest.fn().mockRejectedValue({}),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('retreives image urls on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getImageLinks).toHaveBeenCalled();
  });

  it('displays error snackbar on failed image url retrieval', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getImageLinks: jest
          .fn()
          .mockRejectedValue('failed image url retrieval'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays image when user has permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-cdli-image').exists()).toBe(true);
  });

  it('does not display images when user does not have permission', async () => {
    const wrapper = createWrapper({
      store: {
        ...mockStore,
        hasPermission: () => false,
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-cdli-image').exists()).toBe(false);
  });

  it('quarantines text when quarantine button clicked', async () => {
    const wrapper = createWrapper({
      store: {
        ...mockStore,
        getters: {
          isAdmin: jest.fn().mockResolvedValue(true),
        },
      },
    });
    await flushPromises();
    await wrapper.get('.test-quarantine-button').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.quarantineText).toHaveBeenCalled();
  });

  it('displays error snackbar on failed quarantine', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        quarantineText: jest
          .fn()
          .mockRejectedValue('failed to quarantine text'),
      },
    });
    await flushPromises();
    await wrapper.get('.test-quarantine-button').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
