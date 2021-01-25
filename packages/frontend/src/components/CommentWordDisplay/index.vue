<template>
  <oare-dialog
    :value="value"
    @submit="insertComment"
    @input="$emit('input', $event)"
    :width="1000"
    :show-submit="true"
    :show-cancel="true"
    :closeButton="true"
    :persistent="false"
  >
    <v-row>
      <v-col cols="12">
        <h1><slot></slot></h1>
      </v-col>
      <v-col cols="12">
        <v-container fluid>
          <v-textarea
            name="comment"
            label="Comment"
            auto-grow
            prepend-icon="mdi-comment"
            v-model="userComment"
          ></v-textarea>
        </v-container>
      </v-col>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { Comment, CommentResponse, Thread, CommentRequest } from '@oare/types';

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
  setup(props, { emit }) {
    const loading = ref(false);
    const userComment = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const insertComment = async () => {
      if (store.getters.user === null) {
        actions.showErrorSnackbar('Please login before making a comment.');
        return;
      }

      if (!userComment.value) {
        actions.showErrorSnackbar('Please enter a comment.');
        return;
      }

      const userUuid = store.getters.user ? store.getters.user.uuid : null;
      loading.value = true;
      try {
        const comment: Comment = {
          uuid: null,
          threadUuid: null,
          userUuid: userUuid,
          createdAt: null,
          deleted: false,
          text: userComment.value,
        };
        const thread: Thread = {
          uuid: null,
          referenceUuid: props.uuid,
          status: 'New',
          route: props.route,
        };
        const request: CommentRequest = { comment, thread };

        const response: CommentResponse = await server.insertComment(request);
        if (response) {
          // Remove <em> tags if embedded html is used.
          actions.showSnackbar(
            `Successfully added the comment for ${props.word}`
          );
          emit('submit');
        } else {
          actions.showErrorSnackbar('Failed to insert the comment');
        }
      } catch {
        actions.showErrorSnackbar('Failed to insert the comment');
      } finally {
        loading.value = false;
      }
    };

    return {
      insertComment,
      userComment,
    };
  },
});
</script>

<style scoped></style>
