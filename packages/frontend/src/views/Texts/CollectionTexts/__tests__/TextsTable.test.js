import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import TextsTable from '../TextsTable.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('TextsTable test', () => {
  const mockServer = {
    updateTextInfo: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      permissions: [{ name: 'EDIT_TEXT_INFO' }],
      isAdmin: true,
    },
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  };

  beforeEach(setup);

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
    mount(TextsTable, {
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
        expect(name);
      });
  });

  it('shows edit pencil button if user has EDIT_TEXT_INFO permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const addEditButton = wrapper.find('.test-pencil');
    expect(addEditButton.exists()).toBe(true);
  });

  it('does not show edit pencil button if user does not have EDIT_TEXT_INFO permission', async () => {
    sl.set('store', {
      getters: {
        ...mockStore.getters,
        permissions: [],
      },
    });
    const wrapper = createWrapper();
    await flushPromises();

    const addEditButton = wrapper.find('.test-pencil');
    expect(addEditButton.exists()).toBe(false);
  });

  it('successfully updates text info', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const editButton = wrapper.get('.test-pencil');
    await editButton.trigger('click');

    const excavationPrefixInput = wrapper.get('.excavationPrefix input');
    await excavationPrefixInput.setValue('excavationPrefixExample');

    const excavationNumberInput = wrapper.get('.excavationNumber input');
    await excavationNumberInput.setValue('excavationNumberExample');

    const museumPrefixInput = wrapper.get('.museumPrefix input');
    await museumPrefixInput.setValue('museumPrefixExample');

    const museumNumberInput = wrapper.get('.museumNumber input');
    await museumNumberInput.setValue('museumNumberExample');

    const publicationPrefixInput = wrapper.get('.publicationPrefix input');
    await publicationPrefixInput.setValue('publicationPrefixExample');

    const publicationNumberInput = wrapper.get('.publicationNumber input');
    await publicationNumberInput.setValue('publicationNumberExample');

    const saveButton = wrapper.get('.edit-text-save-btn');
    await saveButton.trigger('click');

    await flushPromises();

    expect(mockServer.updateTextInfo).toHaveBeenCalledWith(
      '1',
      'excavationPrefixExample',
      'excavationNumberExample',
      'museumPrefixExample',
      'museumNumberExample',
      'publicationPrefixExample',
      'publicationNumberExample'
    );
  });

  it('shows error snackbar on failed text info edit', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      updateTextInfo: jest.fn().mockRejectedValue(),
    });

    const wrapper = createWrapper();
    await flushPromises();

    const editButton = wrapper.get('.test-pencil');
    await editButton.trigger('click');

    const excavationPrefixInput = wrapper.get('.excavationPrefix input');
    await excavationPrefixInput.setValue('excavationPrefixExample');

    const excavationNumberInput = wrapper.get('.excavationNumber input');
    await excavationNumberInput.setValue('excavationNumberExample');

    const museumPrefixInput = wrapper.get('.museumPrefix input');
    await museumPrefixInput.setValue('museumPrefixExample');

    const museumNumberInput = wrapper.get('.museumNumber input');
    await museumNumberInput.setValue('museumNumberExample');

    const publicationPrefixInput = wrapper.get('.publicationPrefix input');
    await publicationPrefixInput.setValue('publicationPrefixExample');

    const publicationNumberInput = wrapper.get('.publicationNumber input');
    await publicationNumberInput.setValue('publicationNumberExample');

    const saveButton = wrapper.get('.edit-text-save-btn');
    await saveButton.trigger('click');

    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
