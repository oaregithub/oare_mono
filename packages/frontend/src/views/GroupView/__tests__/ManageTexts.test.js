import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import { render } from '@testing-library/vue';
import ManageTexts from '../ManageTexts.vue';
import flushPromises from 'flush-promises';
import sl from '../../../serviceLocator';
import { forEach } from 'core-js/fn/array';

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
  const mockActions = {
    showErrorSnackbar: jest.fn(),
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

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(ManageTexts, renderOptions);
  };

  it('displays texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    textGroups
      .map(tg => tg.name)
      .forEach(name => {
        expect(wrapper.html(name));
      });
  });

  it('displays error on failed text groups load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getTextGroups: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('updates edit permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editToggle = wrapper.findAll('.test-toggle-edit input').at(0);
    await editToggle.trigger('click');
    expect(mockServer.updateText).toHaveBeenCalled();
  });

  it('displays error on failed edit permission update', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        updateText: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-toggle-edit input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('updates view permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const viewToggle = wrapper.findAll('.test-toggle-view input').at(0);
    await viewToggle.trigger('click');
    expect(mockServer.updateText).toHaveBeenCalled();
  });

  it('displays error on failed view permission update', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        updateText: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.test-toggle-view input').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('adds texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.addTextGroups).toHaveBeenCalled();
  });

  it('displays error on failed adds texts', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addTextGroups: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.find('.test-add').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes texts', async () => {
    const wrapper = createWrapper();
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

  it('displays error on failed remove text', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removeTextsFromGroup: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').trigger('click');
    await wrapper.find('.test-remove').trigger('click');
    await wrapper.find('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
