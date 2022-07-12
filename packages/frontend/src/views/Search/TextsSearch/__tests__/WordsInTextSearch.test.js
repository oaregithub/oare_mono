import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import WordsInTextSearch from '../WordsInTextSearch.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('WordsInTextSearch', () => {
  const mockServer = {
    getWordsInTextSearchResults: jest
      .fn()
      .mockResolvedValue({ total: 0, results: [] }),
    getWordsAndForms: jest.fn().mockResolvedValue([
      {
        info: { uuid: 'uuid', wordUuid: 'wordUuid', name: 'name' },
        wordDisplay: 'qibima',
      },
      {
        info: { uuid: 'uuid2', wordUuid: 'wordUuid2', name: 'name2' },
        wordDisplay: 'umma',
      },
    ]),
    getTaxonomyTree: jest.fn().mockResolvedValue({
      uuid: 'aa1e6d68-55f2-11eb-bf9e-024de1c1cc1d',
      parentUuid: '07e0267a-55ee-11eb-bf9e-024de1c1cc1d',
      type: 'taxonomy',
      objectUuid: 'bb1245db-c638-888c-3ce1-93b6db77a6a7',
      objParentUuid: '000000000000000000000000000000000008',
      custom: null,
      variableName: null,
      valueName: null,
      varAbbreviation: null,
      valAbbreviation: null,
      variableUuid: null,
      valueUuid: null,
      role: 'tree',
      aliasName: 'OARE Project Taxonomies',
      children: [
        {
          uuid: 'aa257e87-55f2-11eb-bf9e-024de1c1cc1d',
          parentUuid: 'aa1e6d68-55f2-11eb-bf9e-024de1c1cc1d',
          type: 'taxonomy',
          objectUuid: '859939fd-bdf6-fa7b-fa93-3f42207e1005',
          objParentUuid: 'bb1245db-c638-888c-3ce1-93b6db77a6a7',
          custom: null,
          variableName: 'Primary Classification',
          valueName: null,
          varAbbreviation: '.',
          valAbbreviation: null,
          variableUuid: '859939fd-bdf6-fa7b-fa93-3f42207e1005',
          valueUuid: null,
          role: 'child',
          aliasName: 'Primary Classification',
          level: null,
          children: [
            {
              aliasName: 'Parse',
              children: [
                {
                  aliasName: 'Morphological Form',
                  children: [
                    {
                      uuid: 'aa257e87-55f2-11eb-bf9e-024de1c1cc1d',
                      parentUuid: 'b74c7814-55f2-11eb-bf9e-024de1c1cc1d',
                      type: 'taxonomy',
                      objectUuid: '859939fd-bdf6-fa7b-fa93-3f42207e1005',
                      objParentUuid: '5a27fd3a-7c58-7d0f-3acb-78a6ecd8b286',
                    },
                  ],
                  custom: 1,
                  level: 1,
                  objParentUuid: '7ef55f42-4cfc-446f-6d47-f83b725b34d5',
                  objectUuid: '5a27fd3a-7c58-7d0f-3acb-78a6ecd8b286',
                  parentUuid: 'b745f8d1-55f2-11eb-bf9e-024de1c1cc1d',
                  role: 'child',
                  type: 'taxonomy',
                  uuid: 'b74c7814-55f2-11eb-bf9e-024de1c1cc1d',
                  valAbbreviation: null,
                  valueName: null,
                  valueUuid: null,
                  varAbbreviation: null,
                  variableName: 'Morphological Form',
                  variableUuid: '5a27fd3a-7c58-7d0f-3acb-78a6ecd8b286',
                },
              ],
              custom: null,
              level: 0,
              objParentUuid: '859939fd-bdf6-fa7b-fa93-3f42207e1005',
              objectUuid: '7ef55f42-4cfc-446f-6d47-f83b725b34d5',
              parentUuid: 'aa257e87-55f2-11eb-bf9e-024de1c1cc1d',
              role: 'child',
              type: 'taxonomy',
              uuid: 'b745f8d1-55f2-11eb-bf9e-024de1c1cc1d',
              valAbbreviation: null,
              valueName: 'Parse',
              valueUuid: '7ef55f42-4cfc-446f-6d47-f83b725b34d5',
              varAbbreviation: null,
              variableName: null,
              variableUuid: null,
            },
          ],
        },
      ],
    }),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const $t = () => {};

  const renderOptions = {
    localVue,
    vuetify,
    mocks: { $t },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(WordsInTextSearch, renderOptions);
  };

  it('gets words and forms on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getWordsAndForms).toHaveBeenCalled();
    expect(mockServer.getTaxonomyTree).toHaveBeenCalled();
  });

  it('changes to parse properties and back', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-autocomplete-btn-word-forms').isVisible()).toBe(
      true
    );
    await wrapper.find('.test-autocomplete-btn-word-forms').trigger('click');
    expect(wrapper.find('.test-autocomplete-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(true);
    await wrapper.find('.test-autocomplete-btn-parse-props').trigger('click');
    expect(wrapper.find('.test-autocomplete-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
  });

  it('increases and decreases autocomplete options', async () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(true);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-autocomplete-1').isVisible()).toBe(true);
    expect(wrapper.find('.test-parse-tree-1').isVisible()).toBe(false);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-numWordsBefore-1').isVisible()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-2').isVisible()).toBe(true);
    expect(wrapper.find('.test-autocomplete-2').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-3').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-3').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-4').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-4').isVisible()).toBe(true);
    await wrapper.find('.test-increase-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-5').isVisible()).toBe(true);
    expect(wrapper.find('.test-numWordsBefore-5').isVisible()).toBe(true);
    expect(wrapper.find('.test-increase-button').isVisible()).toBe(false);
    expect(wrapper.find('.test-decrease-button').isVisible()).toBe(true);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-5').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-5').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-4').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-4').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-3').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-3').exists()).toBe(false);
    await wrapper.find('.test-decrease-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.test-autocomplete-2').exists()).toBe(false);
    expect(wrapper.find('.test-numWordsBefore-2').exists()).toBe(false);
  });
});
