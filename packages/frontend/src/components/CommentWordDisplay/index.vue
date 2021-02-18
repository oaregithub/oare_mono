<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="1000"
    :show-submit="false"
    :show-cancel="false"
    :closeButton="true"
    :persistent="false"
    :submitLoading="loading"
    :actionTitle="'Add Comment'"
  >
    <v-row>
      <v-col cols="10">
        <h1 class='text-capitalize'><slot></slot></h1>
      </v-col>
    </v-row>

    <v-row style='height: 500px'>
      <v-col cols="3" class='overflow-y-auto' style='max-height: 500px'>
        <h2 class='mb-3'>Threads</h2>
        <v-divider/>
        <v-card elevation='0' :color="(threadWithComment.thread.uuid === selectedThreadWithComments.thread.uuid) ? '#fafafa' : '#ffffff'"  v-for='(threadWithComment, idx) in threadsWithComments' :key='idx'>
          <div style='cursor: pointer' class='pl-2 pr-2' >
            <v-row @click='setSelectedThreadWithComment(threadWithComment)'>
              <v-col cols='9'>
                <h2>{{threadWithComment.thread.name ? threadWithComment.thread.name : `Untitled ${idx}`}}</h2>
              </v-col>
              <v-col cols='1'>
                <v-icon @click='openEditThreadDialog' color="primary" class='mb-n2'>mdi-pencil</v-icon>
              </v-col>
            </v-row>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <div class='mt-n3'>
                  <span class='text-subtitle-2'>{{threadWithComment.thread.status}}</span>
                  <v-icon
                          v-if='loggedInUser.isAdmin'
                          class='mt-n1'
                          v-bind="attrs"
                          v-on="on"
                          @click='setSelectedThreadWithComment(threadWithComment)'>mdi-chevron-down</v-icon>
                </div>
              </template>
              <v-list>
                <v-list-item
                        v-for="(status, index) in statuses"
                        :key="index"
                        @click='updateThreadStatus(status)'
                >
                  <v-list-item-title>{{ status }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <v-divider/>
        </v-card>

        <div class='flex justify-center align-content-center mt-5'>
          <v-btn @click='selectedThreadWithComments.thread.uuid = null' elevation='0' color='white'>
            <v-icon color='#215da3'>mdi-plus</v-icon>
            <h3 style='color: #215da3'>Add Thread</h3>
          </v-btn>

        </div>

      </v-col>
      <v-divider class='mr-5 ml-5' vertical/>
      <v-col cols="8" class='overflow-y-auto' style='max-height: 500px'>
        <h2 class='mb-3'>Comments</h2>
        <temtplate v-if='selectedThreadWithComments.thread && selectedThreadWithComments.thread.uuid !== null'>
          <v-row class='mb-3' v-for='(comment, idx) in selectedThreadWithComments.comments' :key='idx'>
            <v-col cols="3" align='center' justify='center' v-if='loggedInUser.uuid !== comment.userUuid'>
            <span style='color: #215da3' v-if="comment.userUuid"
            >{{ comment.userFirstName }} {{ comment.userLastName }}</span
            >
              <span style='color: #215da3' v-else>Administrator</span>
              <hr color='#215da3' />
              <span style='color: #215da3'>{{
              new Date(comment.createdAt)
                .toDateString()
                .substr(
                  new Date(comment.createdAt).toDateString().indexOf(' ')
                )
            }}</span>
            </v-col>
            <v-col cols="8">
              <v-card
                      outlined
                      elevation='1'
                      class="rounded-lg"
                      color='#fafafa'
              >
                <v-card-text v-if='!comment.deleted'>{{ comment.text }}</v-card-text>
                <v-card-text v-else class='font-weight-bold'> <v-icon>mdi-comment-remove</v-icon> This comment has been deleted.</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="3" align='center' justify='center' v-if='loggedInUser.uuid === comment.userUuid'>
            <span style='color: #215da3' v-if="comment.userUuid"
            >{{ comment.userFirstName }} {{ comment.userLastName }}</span
            >
              <span style='color: #215da3' v-else>Administrator</span>
              <hr color='#215da3' />
              <span style='color: #215da3'>{{
              new Date(comment.createdAt)
                .toDateString()
                .substr(
                  new Date(comment.createdAt).toDateString().indexOf(' ')
                )
            }}</span>
            </v-col>
            <v-col
                    cols="1"
                    class='pr-2'
                    v-if="
            (comment.userUuid === loggedInUser.uuid || loggedInUser.isAdmin) && !comment.deleted
          "
            >
              <v-btn icon @click="setDeleteValues(comment.uuid)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </temtplate>
        <div
                class="flex-column d-flex justify-center align-center"
                style='height: 80%; width: 100%'
                v-else
        >
          <h1>
            <v-icon large color="primary">mdi-forum-outline</v-icon> Please select a thread to view comments
          </h1>
          <h2 class='mb-10 mt-10'>OR</h2>
          <h1><v-icon class='mt-n2' large color="primary">mdi-plus-circle</v-icon>Add a comment to start a new thread</h1>
        </div>

        <v-row>
          <v-col cols='11'>
            <v-textarea
                    outlined
                    class='pa-0'
                    label="Add comment..."
                    rows="1"
                    auto-grow
                    v-model="userComment"
                    counter="1000"
            ></v-textarea>
          </v-col>
          <v-col cols='1'>
            <v-btn @click='insertComment' class='mb-n7' icon>
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <OareDialog
      v-model="confirmDeleteDialog"
      title="Confirm Delete"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      @submit="deleteComment()"
    >
      Are you sure you want to delete the comment?
    </OareDialog>
    <OareDialog
            v-model="confirmEditThreadNameDialog"
            title="Edit"
            cancelText="Cancel"
            submitText="Submit"
            @submit="editThreadName()"
            @input="editedThreadValue = ''"
    >
      <v-text-field
              label="New Thread Name"
              v-model='editedThreadValue'
      ></v-text-field>
      <span style='color: red' v-if="!validateThreadName()">{{editErrorMessage}}</span>
    </OareDialog>
  </oare-dialog>

</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  Ref,
  watch,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import {
  CommentResponse,
  Thread,
  CommentRequest,
  ThreadWithComments,
  CommentInsert,
  ThreadStatus,
} from '@oare/types';

export default defineComponent({
  name: 'DictionaryWordDisplay',
  props: {
    word: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    uuid: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const confirmDeleteDialog = ref(false);
    const confirmEditThreadNameDialog = ref(false);
    const editedThreadValue = ref('');
    const editErrorMessage = ref('');
    const threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedThreadWithComments: Ref<ThreadWithComments> = ref({thread: {
        uuid: null,
        name: null,
        referenceUuid: '',
        status: 'New',
        route: '',
      }, comments: []});
    const selectedItem = ref<number | undefined>(undefined);
    const selectedCommentUuidToDelete = ref<string>('');
    const userComment = ref('');
    const statuses = ref(['New', 'Pending', 'In Progress', 'Completed']);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const findAndSetSelectedThread = (newThreadsWithComments: ThreadWithComments[]) => {
      if (selectedThreadWithComments.value) {
        newThreadsWithComments.forEach((threadWithComments) => {
          if (threadWithComments.thread.uuid === selectedThreadWithComments.value.thread.uuid) {
            setSelectedThreadWithComment(threadWithComments);
          }
        })
      }
    }

    const openEditThreadDialog = () => {
      confirmEditThreadNameDialog.value = true;
      editedThreadValue.value = selectedThreadWithComments.value.thread.name || '';
    }

    const validateThreadName = () => {
      let valid = true;
      if (editedThreadValue.value === '') {
        editErrorMessage.value = 'Cannot be empty.'
        valid = false;
      }
      if (editedThreadValue.value === selectedThreadWithComments.value.thread.name) {
        editErrorMessage.value = 'Cannot have the same name.'
        valid = false;
      }

      return valid;
    }

    const getThreadsWithComments = async () => {
      try {
        if (props.uuid) {
          loading.value = true;
          threadsWithComments.value = await server.getThreadsWithCommentsByReferenceUuid(
            props.uuid
          );
          findAndSetSelectedThread(threadsWithComments.value);
        }
      } catch (e) {
        await actions.showErrorSnackbar('Failed to get threads');
      } finally {
        loading.value = false;
      }
    };

    const setDeleteValues = (commentUuid: string) => {
      selectedCommentUuidToDelete.value = commentUuid;
      confirmDeleteDialog.value = true;
    };

    const setSelectedThreadWithComment = (threadWithComment: ThreadWithComments) => {
      selectedThreadWithComments.value = threadWithComment;
    }

    const updateThreadStatus = async (status: ThreadStatus) => {
      // Only update if status changes from the original value.
      if (status !== selectedThreadWithComments.value.thread.status) {
        try {
          loading.value = true;
          selectedThreadWithComments.value.thread.status = status;
          await server.updateThread(selectedThreadWithComments.value.thread);

          actions.showSnackbar('Successfully updated the thread');
          await getThreadsWithComments();
        } catch {
          await actions.showErrorSnackbar('Failed to update the thread');
        } finally {
          loading.value = false;
        }
      }
    };

    const deleteComment = async () => {
      confirmDeleteDialog.value = false;
      try {
        loading.value = true;
        await server.deleteComment(selectedCommentUuidToDelete.value);

        actions.showSnackbar('Successfully deleted the comment');
        await getThreadsWithComments();
      } catch {
        await actions.showErrorSnackbar('Failed to delete the comment');
      } finally {
        loading.value = false;
      }
    };

    const insertComment = async () => {
      if (store.getters.user === null) {
        await actions.showErrorSnackbar('Please login before making a comment.');
        return;
      }

      if (!userComment.value) {
        await actions.showErrorSnackbar('Please enter a comment.');
        return;
      }

      if (userComment.value.length > 1000) {
        await actions.showErrorSnackbar(
          'Character count exceeded, please shorten the comment.'
        );
        return;
      }

      loading.value = true;
      try {
        const comment: CommentInsert = {
          uuid: null,
          threadUuid: selectedThreadWithComments.value.thread.uuid ? selectedThreadWithComments.value.thread.uuid : null,
          userUuid: loggedInUser.value ? loggedInUser.value.uuid : null,
          createdAt: null,
          deleted: false,
          text: userComment.value,
        };

        // If creating new thread
        if (selectedThreadWithComments.value.thread.uuid === null) {
          selectedThreadWithComments.value.thread = {
            uuid: null,
            name: null,
            referenceUuid: props.uuid,
            status: 'New',
            route: props.route,
          };
        }

        const request: CommentRequest = { comment, thread: selectedThreadWithComments.value.thread };

        const response: CommentResponse = await server.insertComment(request);
        if (response) {
          actions.showSnackbar(
            `Successfully added the comment for ${props.word}`
          );
          userComment.value = '';
          selectedThreadWithComments.value.thread.uuid = response.threadUuid;
          await getThreadsWithComments();
        } else {
          await actions.showErrorSnackbar('Failed to insert the comment');
        }
      } catch {
        await actions.showErrorSnackbar('Failed to insert the comment');
      } finally {
        loading.value = false;
        userComment.value = '';
      }
    };

    const editThreadName = async () => {
      if (!validateThreadName()) {
        await actions.showErrorSnackbar('Invalid Thread Name');
        return;
      }
      confirmEditThreadNameDialog.value = false;

      loading.value = true;
      try {
        console.log("Add edit call to backend here...");
        actions.showSnackbar(`Successfully edited the thread name.`);
      } catch {
        await actions.showErrorSnackbar('Failed to edit thread name');
      } finally {
        loading.value = false;
        editedThreadValue.value = '';
      }
    }

    onMounted(getThreadsWithComments);

    const loggedInUser = computed(() =>
      store.getters.user ? store.getters.user : null
    );

    return {
      updateThreadStatus,
      openEditThreadDialog,
      validateThreadName,
      editErrorMessage,
      editedThreadValue,
      editThreadName,
      confirmEditThreadNameDialog,
      setSelectedThreadWithComment,
      selectedThreadWithComments,
      loading,
      selectedCommentUuidToDelete,
      confirmDeleteDialog,
      statuses,
      loggedInUser,
      threadsWithComments,
      selectedItem,
      setDeleteValues,
      deleteComment,
      insertComment,
      userComment,
    };
  },
});
</script>
