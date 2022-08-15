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

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockServer = {
    addWord: jest.fn().mockResolvedValue(),
    checkNewWord: jest.fn().mockResolvedValue(true),
    getTaxonomyTree: jest.fn().mockResolvedValue({
      variableName: 'test-var-name',
      varAbbreviation: 'test-var-abb',
      variableUuid: '8a6062db-8a6b-f102-98aa-9fa5989bd0a5',
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

  const createWrapper = ({ server } = {}) => {
    sl.set('globalActions', mockActions);
    sl.set('serverProxy', server || mockServer);
    sl.set('lodash', mockLodash);

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
