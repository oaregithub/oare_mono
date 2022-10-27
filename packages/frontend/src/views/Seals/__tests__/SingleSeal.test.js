import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import SingleSeal from '../SingleSeal.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const mockSeal1 = {
  name: 'seal1',
  uuid: 'uuid1',
  count: 1,
  imageLinks: ['link-1'],
  sealProperties: [{ CS: '12' }],
  sealImpressions: [
    {
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
      side: 1,
      user: '',
    },
  ],
};

const mockSealNoInfo = {
  name: 'seal1',
  uuid: 'uuid1',
  count: 1,
  imageLinks: [],
  sealProperties: [],
  sealImpressions: [],
};

const mockSealNoImages = {
  name: 'seal1',
  uuid: 'uuid1',
  count: 1,
  imageLinks: [],
  sealProperties: [{ CS: '12' }],
  sealImpressions: [
    {
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
      side: 1,
      user: '',
    },
  ],
};

const mockSealNoProperties = {
  name: 'seal1',
  uuid: 'uuid1',
  count: 1,
  imageLinks: ['link-1'],
  sealProperties: [],
  sealImpressions: [
    {
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
      side: 1,
      user: '',
    },
  ],
};

const mockSealNoImpressions = {
  name: 'seal1',
  uuid: 'uuid1',
  count: 1,
  imageLinks: ['link-1'],
  sealProperties: [{ CS: '12' }],
  sealImpressions: [],
};

describe('Single Seal View', () => {
  const mockServer = {
    getSealByUuid: jest.fn().mockResolvedValue(mockSeal1),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: {
      uuid: 'uuid1',
    },
    stubs: ['router-link'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(SingleSeal, renderOptions);
  };

  it('displays error on seal load error', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getSealByUuid: jest.fn().mockRejectedValue(),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays seal properties, images, and impressions', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-seal-properties').exists()).toBe(true);
    expect(wrapper.find('.test-seal-images').exists()).toBe(true);
    expect(wrapper.find('.test-seal-impressions').exists()).toBe(true);
  });

  it('displays no info when seal has no info', async () => {
    const wrapper = createWrapper({
      server: {
        getSealByUuid: jest.fn().mockResolvedValue(mockSealNoInfo),
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-seal-properties').exists()).toBe(false);
    expect(wrapper.find('.test-seal-images').exists()).toBe(false);
    expect(wrapper.find('.test-seal-impressions').exists()).toBe(false);
    expect(wrapper.find('.test-seal-no-info').exists()).toBe(true);
  });

  it('displays seal with no images', async () => {
    const wrapper = createWrapper({
      server: {
        getSealByUuid: jest.fn().mockResolvedValue(mockSealNoImages),
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-seal-properties').exists()).toBe(true);
    expect(wrapper.find('.test-seal-images').exists()).toBe(false);
    expect(wrapper.find('.test-seal-impressions').exists()).toBe(true);
    expect(wrapper.find('.test-seal-no-images').exists()).toBe(true);
  });

  it('displays seal with no properties', async () => {
    const wrapper = createWrapper({
      server: {
        getSealByUuid: jest.fn().mockResolvedValue(mockSealNoProperties),
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-seal-properties').exists()).toBe(false);
    expect(wrapper.find('.test-seal-images').exists()).toBe(true);
    expect(wrapper.find('.test-seal-impressions').exists()).toBe(true);
    expect(wrapper.find('.test-seal-no-properties').exists()).toBe(true);
  });

  it('displays seal with no impressions', async () => {
    const wrapper = createWrapper({
      server: {
        getSealByUuid: jest.fn().mockResolvedValue(mockSealNoImpressions),
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-seal-properties').exists()).toBe(true);
    expect(wrapper.find('.test-seal-images').exists()).toBe(true);
    expect(wrapper.find('.test-seal-impressions').exists()).toBe(false);
    expect(wrapper.find('.test-seal-no-impressions').exists()).toBe(true);
  });
});
