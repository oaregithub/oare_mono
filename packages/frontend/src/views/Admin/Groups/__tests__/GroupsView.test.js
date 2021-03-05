import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import GroupView from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('GroupsView', () => {
  const mockServer = {
    getGroupInfo: jest.fn().mockResolvedValue({
      name: 'testName',
      description: 'testDescription',
    }),
    updateGroupDescription: jest.fn().mockResolvedValue(),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(GroupView, {
      localVue,
      vuetify,
      propsData: {
        groupId: '1',
      },
      stubs: ['router-link', 'router-view'],
    });
  };

  it('displays group information', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getGroupInfo).toHaveBeenCalled();
    expect(wrapper.html()).toContain('testName');
    expect(wrapper.html()).toContain('testDescription');
  });

  it('displays error upon failed retrieval of group info', async () => {
    createWrapper({
      server: {
        getGroupInfo: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('edits group description', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.get('.mdi-pencil');
    await editButton.trigger('click');
    const editDescriptionBox = wrapper.get('.test-description input');
    await editDescriptionBox.setValue('testDescription2');
    const submitButton = wrapper.get('.test-check');
    await submitButton.trigger('click');
    await flushPromises();
    expect(mockServer.updateGroupDescription).toHaveBeenCalled();
    await flushPromises();
    expect(wrapper.html()).toContain('testDescription2');
  });

  it('does not update description when close button clicked', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.get('.mdi-pencil');
    await editButton.trigger('click');
    const editDescriptionBox = wrapper.get('.test-description input');
    await editDescriptionBox.setValue('falseTest');
    const closeButton = wrapper.get('.test-close');
    await closeButton.trigger('click');
    await flushPromises();
    expect(mockServer.updateGroupDescription).not.toHaveBeenCalled();
    expect(wrapper.html()).not.toContain('falseTest');
  });

  it('shows error snackbar on failed description update', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        updateGroupDescription: jest
          .fn()
          .mockRejectedValue('failed description update'),
      },
    });
    await flushPromises();
    const editButton = wrapper.get('.mdi-pencil');
    await editButton.trigger('click');
    const editDescriptionBox = wrapper.get('.test-description input');
    await editDescriptionBox.setValue('test');
    const submitButton = wrapper.get('.test-check');
    await submitButton.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('disables submit button when group description is too long', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.get('.mdi-pencil');
    await editButton.trigger('click');
    const editDescriptionBox = wrapper.get('.test-description input');
    await editDescriptionBox.setValue(
      `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
    );
    const submitButton = wrapper.get('.test-check');
    expect(submitButton.element).toBeDisabled();
  });
});
