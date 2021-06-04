import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import CommentItem from '../CommentItem.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('CommentItem test', () => {
  const comment = {
    uuid: 'commentUuid',
    threadUuid: 'threadUuid',
    userUuid: 'userUuid',
    createdAt: new Date(),
    deleted: false,
    text: 'this is the comment text',
    userFirstName: 'firstName',
    userLastName: 'lastName',
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const adminUser = {
    uuid: 'uuid',
    isAdmin: true,
  };

  const nonAdminUser = {
    uuid: 'uuid',
    isAdmin: false,
  };

  const mockStore = {
    getters: {
      user: adminUser,
      permissions: [],
    },
  };

  const mockServer = {
    deleteComment: jest.fn().mockResolvedValue(),
  };

  beforeEach(() => {
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
    sl.set('serverProxy', mockServer);
  });

  const createWrapper = ({ commentProp } = {}) =>
    mount(CommentItem, {
      vuetify,
      localVue,
      propsData: {
        comment: commentProp || comment,
      },
    });

  it('displays comment text', () => {
    expect(createWrapper().get('.test-comment-text').text()).toBe(comment.text);
  });

  it('explains when a comment has been deleted', () => {
    const wrapper = createWrapper({
      commentProp: {
        ...comment,
        deleted: true,
      },
    });

    expect(wrapper.get('.test-comment-text').text()).toBe(
      'This comment has been deleted.'
    );
  });

  it('displays comment author', () => {
    expect(createWrapper().get('.test-comment-author').text()).toBe(
      `${comment.userFirstName} ${comment.userLastName}`
    );
  });

  it('deletes a comment when user is an admin', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-delete-comment').trigger('click');

    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.deleteComment).toHaveBeenCalledWith(comment.uuid);
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('deletes a comment when the user is the creator of the comment', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        user: {
          ...nonAdminUser,
          uuid: comment.userUuid,
        },
        permissions: [],
      },
    });

    const wrapper = createWrapper();
    await wrapper.get('.test-delete-comment').trigger('click');

    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.deleteComment).toHaveBeenCalledWith(comment.uuid);
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('does not allow deletion when the user is not an admin or the creator of the comment', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        user: nonAdminUser,
        permissions: [],
      },
    });

    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.test-delete-comment').exists()).toBe(false);
  });

  it('show error snackbar when unable to delete a comment', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      deleteComment: jest
        .fn()
        .mockRejectedValue('unable to delete the comment.'),
    });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-delete-comment').trigger('click');

    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
