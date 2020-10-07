import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ManageTexts from '../ManageTexts.vue';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ManageTexts test', () => {
  const textGroups = [
    {
      text_uuid: '1',
      can_read: true,
      can_write: false,
      name: 'Text 1',
    },
    {
      text_uuid: '2',
      can_read: true,
      can_write: false,
      name: 'Text 2',
    },
  ];
  const mockServer = {
    updateText: jest.fn().mockResolvedValue(null),
    addTextGroups: jest.fn().mockResolvedValue(null),
    removeTextsFromGroup: jest.fn().mockResolvedValue(null),
    getTextGroups: jest.fn().mockResolvedValue(textGroups),
    searchTextNames: jest.fn().mockResolvedValue([]),
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
    propsData: {
      groupId: '1',
      serverProxy: mockServer,
    },
  };
  const renderWrapper = () => render(ManageTexts, renderOptions);

  const mountWrapper = () => mount(ManageTexts, renderOptions);

  it('displays texts', async () => {
    const { getByText } = renderWrapper();
    await flushPromises();
    textGroups
      .map(tg => tg.name)
      .forEach(name => {
        expect(getByText(name));
      });
  });

  it('updates edit permission', async () => {
    const wrapper = mountWrapper();
    await flushPromises();
    const editToggle = wrapper.findAll('.test-toggle-edit input').at(0);
    await editToggle.trigger('click');
    expect(mockServer.updateText).toHaveBeenCalled();
  });

  it('updates view permission', async () => {
    const wrapper = mountWrapper();
    await flushPromises();
    const viewToggle = wrapper.findAll('.test-toggle-view input').at(0);
    await viewToggle.trigger('click');
    expect(mockServer.updateText).toHaveBeenCalled();
  });

  it('removes texts', async () => {
    const wrapper = mountWrapper();
    await flushPromises();
    await wrapper
      .findAll('.v-data-table__checkbox')
      .at(0)
      .trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.removeTextsFromGroup).toHaveBeenCalled();
  });
});
