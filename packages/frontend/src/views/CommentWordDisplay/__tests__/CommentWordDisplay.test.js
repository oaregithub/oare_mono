import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import CommentWordDisplay from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const testThread = {
  uuid: 'uuid1',
  name: 'threadName1',
  referenceUuid: 'itemUuid',
  status: 'New',
  route: '/dictionaryWord/uuid',
};

const testComment = {
  uuid: 'commentUuid',
  threadUuid: 'threadUuid',
  userUuid: 'userUuid',
  createdAt: new Date(),
  deleted: false,
  text: 'this is the comment text',
  userFirstName: 'firstName',
  userLastName: 'lastName',
};

const mockThreadDisplays = [
  {
    thread: testThread,
    comments: [testComment],
  },
];

const threadUuidTest = 'threadUuidTest';
const commentUuidTest = 'commentUuidTest';

const commentResponse = {
  threadUuid: threadUuidTest,
  commentUuid: commentUuidTest,
};

const mockServer = {
  getThreadsWithCommentsByReferenceUuid: jest
    .fn()
    .mockResolvedValue(mockThreadDisplays),
  updateThread: jest.fn().mockResolvedValue({}),
  deleteComment: jest.fn().mockResolvedValue({}),
  insertComment: jest.fn().mockResolvedValue(commentResponse),
  updateThreadName: jest.fn().mockResolvedValue({}),
};

const mockActions = {
  showSnackbar: jest.fn(),
  showErrorSnackbar: jest.fn(),
};

const adminUser = {
  id: 1,
  uuid: 'uuid',
  firstName: 'John',
  lastName: 'Doe',
  email: 'fake@fake.com',
  isAdmin: true,
};

const nonAdminUser = {
  id: 1,
  uuid: 'uuid',
  firstName: 'John',
  lastName: 'Doe',
  email: 'fake@fake.com',
  isAdmin: false,
};

const mockStore = {
  getters: {
    user: adminUser,
  },
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('store', mockStore);
};

beforeEach(setup);

const propsWord = 'testWord';
const propsRoute = '/dictionaryWord/uuid';
const propsUuid = 'testUuid';
describe('CommentWordDisplay test', () => {
  const createWrapper = () =>
    mount(CommentWordDisplay, {
      vuetify,
      localVue,
      propsData: {
        word: propsWord,
        route: propsRoute,
        uuid: propsUuid,
      },
      stubs: ['router-link'],
    });

  it('loads threads with comments on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getThreadsWithCommentsByReferenceUuid).toHaveBeenCalled();
    expect(mockActions.showErrorSnackbar).not.toHaveBeenCalled();
  });

  it('fails to load threads with comments on mount', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getThreadsWithCommentsByReferenceUuid: jest
        .fn()
        .mockRejectedValue(
          'Error, The threads with comments were not able to be retreived.'
        ),
    });

    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('edit thread status if admin user', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const testDropdown = await wrapper.findAll('.test-status-dropdown').at(0); // First dropdown
    testDropdown.trigger('click');

    const threadMenu = await wrapper.findAll('.test-thread-menu').at(0);
    const testDropdownItemNew = await threadMenu
      .findAll('.test-status-dropdown-item')
      .at(0); // New in First dropdown
    testDropdownItemNew.trigger('click');
    await flushPromises();
    // Should not update when status is the same (New == New)
    expect(mockServer.updateThread).not.toHaveBeenCalled();

    const testDropdownItemPending = await threadMenu
      .findAll('.test-status-dropdown-item')
      .at(1); // Pending in First dropdown
    testDropdownItemPending.trigger('click');
    await flushPromises();

    // Should update when status is different (Pending !== New)
    expect(mockServer.updateThread).toHaveBeenCalledWith({
      uuid: testThread.uuid,
      name: testThread.name,
      referenceUuid: testThread.referenceUuid,
      status: 'Pending',
      route: testThread.route,
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    await flushPromises();
    expect(mockServer.getThreadsWithCommentsByReferenceUuid).toHaveBeenCalled();
  });

  it('unable to edit thread status if not admin user', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        user: nonAdminUser,
      },
    });

    const wrapper = createWrapper();
    await flushPromises();
    const testDropdown = await wrapper
      .findAll('.test-status-dropdown')
      .exists();
    expect(testDropdown).toBeFalsy();
  });

  it('inserts comment', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-comment textarea').setValue('New Comment');
    await wrapper.get('.test-insert-comment').trigger('click');
    await flushPromises();

    expect(mockServer.insertComment).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('fails to insert a comment', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      insertComment: jest
        .fn()
        .mockRejectedValue('Error, unable to insert comment.'),
    });

    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-comment textarea').setValue('New Comment');
    await wrapper.get('.test-insert-comment').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('fails to insert a comment because of invalid response', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      insertComment: jest.fn().mockResolvedValue(null),
    });

    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-comment textarea').setValue('New Comment');
    await wrapper.get('.test-insert-comment').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('edits a thread name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const firstThreadEditPencil = await wrapper
      .findAll('.test-edit-thread-name-dialog')
      .at(0);
    firstThreadEditPencil.trigger('click');

    const editDialog = await wrapper.get('.test-edit-dialog');
    await editDialog
      .get('.test-edit-thread-name input')
      .setValue('New Thread Name');

    await editDialog.get('.test-submit-btn').trigger('click');
    await flushPromises();

    const request = {
      threadUuid: testThread.uuid,
      newName: 'New Thread Name',
    };

    expect(mockServer.updateThreadName).toHaveBeenCalledWith(request);
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('fails to edit a thread name', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      updateThreadName: jest
        .fn()
        .mockRejectedValue('error, unable to edit name.'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    const firstThreadEditPencil = await wrapper
      .findAll('.test-edit-thread-name-dialog')
      .at(0);
    firstThreadEditPencil.trigger('click');

    const editDialog = await wrapper.get('.test-edit-dialog');
    await editDialog
      .get('.test-edit-thread-name input')
      .setValue('New Thread Name');

    await editDialog.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('deletes a comment', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-select-thread').trigger('click');
    await wrapper.findAll('.test-delete-comment').at(0).trigger('click');

    const deleteDialog = await wrapper.get('.test-delete-dialog');
    await deleteDialog.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockServer.deleteComment).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('unable to delete when not admin and not creator of comment', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        user: nonAdminUser,
      },
    });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-select-thread').trigger('click');
    const exists = await wrapper.findAll('.test-delete-comment').exists();

    expect(exists).toBeFalsy();
  });

  it('fails to delete a comment', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      deleteComment: jest
        .fn()
        .mockRejectedValue('error, unable to delete a comment.'),
    });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-select-thread').trigger('click');
    await wrapper.findAll('.test-delete-comment').at(0).trigger('click');

    const deleteDialog = await wrapper.get('.test-delete-dialog');
    await deleteDialog.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
