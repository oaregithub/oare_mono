import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AddWordDialog from '../AddWordDialog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddWordDialog test', () => {
  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: { isAdmin: true },
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    addWord: jest.fn().mockResolvedValue(),
    checkNewWord: jest.fn().mockResolvedValue(true),
    getTaxonomyPropertyTree: jest.fn().mockResolvedValue({
      tree: {
        name: 'root',
        fieldInfo: null,
        hierarchy: {
          uuid: 'aa2bf3ac-55f2-11eb-bf9e-024de1c1cc1d',
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
              parentUuid: 'aa2bf3ac-55f2-11eb-bf9e-024de1c1cc1d',
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

  const createWrapper = ({ server } = {}) => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', mockLodash);
    sl.set('store', mockStore);

    return mount(AddWordDialog, {
      vuetify,
      localVue,
      propsData: {
        value: true,
        route: 'word',
      },
    });
  };

  it('displays parse tree on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.get('.test-tree').exists()).toBe(true);
    expect(mockServer.getTaxonomyPropertyTree).toHaveBeenCalled();
  });

  it('displays error on failed parse tree load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getTaxonomyPropertyTree: jest
          .fn()
          .mockRejectedValue('failed to load parse tree'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('disables submit button if no input', async () => {
    const wrapper = createWrapper();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('disables submit button if input but no selections', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-word-spelling input').setValue('test input');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('shows error if word already exists', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-word-spelling input').setValue('test-word-1');
    await flushPromises();
    expect(mockServer.checkNewWord).toHaveBeenCalledWith('test-word-1', []);
    expect(wrapper.find('.test-error').exists()).toBe(true);
    expect(wrapper.get('.test-submit-btn').element).toBeDisabled();
  });

  it('enables submit button if input exists and checks have been selected', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        checkNewWord: jest.fn().mockResolvedValue(false),
      },
    });
    await flushPromises();
    await wrapper.get('.test-word-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    expect(wrapper.get('.test-submit-btn').element).toBeEnabled();
  });

  it('adds word on submit', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        checkNewWord: jest.fn().mockResolvedValue(false),
      },
    });
    await flushPromises();
    await wrapper.get('.test-word-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.addWord).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error on failed word submission', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        checkNewWord: jest.fn().mockResolvedValue(false),
        addWord: jest.fn().mockRejectedValue('failed to add word'),
      },
    });
    await flushPromises();
    await wrapper.get('.test-word-spelling input').setValue('test input');
    await wrapper.findAll('.test-ignore input').trigger('click');
    await flushPromises();
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
