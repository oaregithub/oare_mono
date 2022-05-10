import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '@/components/DictionaryDisplay/DictionaryWord/index.vue';
import GrammarDisplay from '../GrammarDisplay.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('GrammarDisplay test', () => {
  const mockServer = {
    editPropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
    getTaxonomyTree: jest.fn().mockResolvedValue({
      variableName: 'test-var-name',
      varAbbreviation: 'test-var-abb',
      variableUuid: 'test-variable-uuid',
      children: [
        {
          valueName: 'Parse',
          valAbbreviation: 'test-var-abb',
          valueUuid: 'test-value-uuid',
          children: [
            {
              variableName: 'test-var-name-2',
              varAbbreviation: 'test-var-abb-2',
              variableUuid: 'test-variable-uuid-2',
              children: [
                {
                  valueName: 'test-val-name-2',
                  valAbbreviation: 'test-var-abb-2',
                  valueUuid: 'test-value-uuid',
                  children: [
                    {
                      variableName: 'test-var-name-3',
                      varAbbreviation: 'test-var-abb-3',
                      variableUuid: 'test-variable-uuid-3',
                      children: [
                        {
                          valueName: 'test-val-name-3',
                          valAbbreviation: 'test-var-abb-3',
                          valueUuid: 'test-value-uuid-3',
                          children: null,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: name => ['EDIT_ITEM_PROPERTIES'].includes(name),
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
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

  it('does not show edit buttonw hen user does not have permission', async () => {
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
