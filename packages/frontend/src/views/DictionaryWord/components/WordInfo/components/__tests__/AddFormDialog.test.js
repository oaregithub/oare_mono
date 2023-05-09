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
    getters: { isAdmin: true },
    hasPermission: () => false,
  };

  const mockRouter = {
    currentRoute: {
      name: 'testName',
    },
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    addForm: jest.fn().mockResolvedValue(),
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

  const reload = jest.fn();

  const createWrapper = ({ server } = {}) => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('store', mockStore);
    sl.set('router', mockRouter);
    sl.set('lodash', mockLodash);

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
    expect(mockServer.getTaxonomyPropertyTree).toHaveBeenCalled();
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
    expect(mockActions.showErrorSnackbar);
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
