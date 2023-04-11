import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { ReloadKey } from '@/views/DictionaryWord/index.vue';
import AddFormDialog from '../AddFormDialog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddFormDialog test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: () => false,
  };

  const mockRouter = {
    currentRoute: {
      name: 'testName',
    },
  };

  const mockServer = {
    addForm: jest.fn().mockResolvedValue(),
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

  const reload = jest.fn();

  const createWrapper = ({ server } = {}) => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('store', mockStore);
    sl.set('router', mockRouter);

    return mount(AddFormDialog, {
      vuetify,
      localVue,
      provide: {
        [ReloadKey]: reload,
      },
      propsData: {
        value: true,
        word: {
          uuid: 'word-uuid',
          word: 'test-word',
          forms: [
            {
              form: 'test-form-1',
              properties: [],
            },
            {
              form: 'test-form-2',
              properties: [],
            },
          ],
          properties: [],
          translationsForDefinition: [],
          discussionLemmas: [],
        },
      },
    });
  };

  it('displays parse tree on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.get('.test-tree').exists()).toBe(true);
  });

  it('displays error on failed parse tree load', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getTaxonomyTree: jest
          .fn()
          .mockRejectedValue('failed to load parse tree'),
      },
    });
    await flushPromises();
    expect(wrapper.find('.test-tree').exists()).toBe(false);
  });

  it('disables submit button if no input', async () => {
    const wrapper = createWrapper();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('disables submit button if input but no selections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-form-spelling input').setValue('test input');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('shows error if form already exists', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-form-spelling input').setValue('test-form-1');
    await flushPromises();
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-error').exists()).toBe(true);
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('enables submit button if input exists and checks have been selected', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-form-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
  });

  it('adds form on submit', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-form-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.addForm).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error on failed form submission', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addForm: jest.fn().mockRejectedValue('failed to add form'),
      },
    });
    await flushPromises();
    await wrapper.get('.test-form-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
