import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '@/views/DictionaryWord/index.vue';
import GrammarDisplay from '../GrammarDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('GrammarDisplay test', () => {
  const mockServer = {
    editPropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
    getTaxonomyPropertyTree: jest.fn().mockResolvedValue({
      tree: {
        name: 'root',
        fieldInfo: null,
        hierarchy: {
          uuid: 'b745f8d1-55f2-11eb-bf9e-024de1c1cc1d',
          parentUuid: 'hierarchy-parent-1',
          type: 'taxonomy',
          role: 'tree',
          objectUuid: 'object-1',
          objectParentUuid: 'object-parent-1',
          objectGrandparentUuid: null,
        },
        variables: [
          {
            uuid: 'variable-1',
            name: 'variable-1',
            abbreviation: '.',
            type: 'nominal',
            tableReference: null,
            hierarchy: {
              uuid: 'hierarchy-2',
              parentUuid: 'b745f8d1-55f2-11eb-bf9e-024de1c1cc1d',
              type: 'taxonomy',
              role: 'child',
              objectUuid: 'object-2',
              objectParentUuid: 'object-1',
              objectGrandparentUuid: 'object-parent-1',
            },
            level: null,
            fieldInfo: null,
            values: [],
          },
        ],
      },
    }),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: { isAdmin: true },
    hasPermission: name => ['EDIT_ITEM_PROPERTIES'].includes(name),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
    sl.set('lodash', mockLodash);
  };

  const mockProps = {
    word: {
      properties: [],
    },
    form: {
      uuid: 'test-form-uuid',
      properties: [],
    },
    allowEditing: true,
  };

  beforeEach(setup);

  const reload = jest.fn();

  const createWrapper = () =>
    mount(GrammarDisplay, {
      vuetify,
      localVue,
      provide: {
        [ReloadKey]: reload,
      },
      propsData: mockProps,
    });

  it('displays no parse info when does not exist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.html()).toContain('(No parse info yet)');
  });

  it('displays edit button when user has permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.find('.test-property-pencil');
    expect(editButton.exists()).toBe(true);
  });

  it('does not show edit button when user does not have permission', async () => {
    sl.set('store', {
      hasPermission: () => false,
    });
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.find('.test-property-pencil');
    expect(editButton.exists()).toBe(false);
  });

  it('shows parse tree on edit dialog open', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-property-pencil').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-tree').exists()).toBe(true);
  });

  it('enables submit button if form complete', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-property-pencil').trigger('click');
    await flushPromises();
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
  });

  it('disables submit button if form not complete', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-property-pencil').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('updates form parse info on submit', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-property-pencil').trigger('click');
    await flushPromises();
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.editPropertiesByReferenceUuid).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('displays error on failed parse info edit', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      editPropertiesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('failed to edit form parse info'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-property-pencil').trigger('click');
    await flushPromises();
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
