import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PersonsTextOccurrences from '../components/PersonsTextOccurrences.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const mockActions = {
  showErrorSnackbar: jest.fn(),
  showSnackbar: jest.fn(),
};

const testOccurrence = 3;
const testPersonUuid = 'personUuidTest';

const mockServer = {
  getPeopleTextOccurrenceCount: jest.fn().mockResolvedValue(testOccurrence),
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
};

beforeEach(setup);

describe('PersonsTextOccurrences test', () => {
  const createWrapper = () =>
    mount(PersonsTextOccurrences, {
      vuetify,
      localVue,
      propsData: {
        personUuid: testPersonUuid,
      },
    });

  it('gets person text occurrence count on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getPeopleTextOccurrenceCount).toHaveBeenCalledWith(
      testPersonUuid
    );
    expect(wrapper.html()).not.toContain('Retry');
  });

  it('shows retry message when people text occurrence count retrieval fails', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getPeopleTextOccurrenceCount: jest
        .fn()
        .mockRejectedValue('Error, unable to person text occurrence count.'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.html()).toContain('Retry');
  });
});
