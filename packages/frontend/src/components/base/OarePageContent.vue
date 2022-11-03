<template>
  <div>
    <div v-if="isAdmin && isEditorActive">
      <vue-editor v-model="editedContent" /><br />
      <v-btn class="mr-2 test-save-button" color="primary" @click="edit"
        >Save</v-btn
      >
      <v-btn text @click="cancel">Cancel</v-btn>
    </div>
    <div
      v-if="!isEditorActive"
      v-html="content"
      class="title font-weight-regular"
    ></div>
    <v-row v-if="isAdmin && !isEditorActive"
      ><v-spacer />
      <v-btn class="test-edit-button" color="primary" @click="edit"
        >Edit</v-btn
      ></v-row
    >
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { VueEditor } from 'vue2-editor';

export default defineComponent({
  props: {
    pageName: {
      type: String,
      required: true,
    },
  },
  components: {
    VueEditor,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const store = sl.get('store');
    const actions = sl.get('globalActions');
    const isAdmin = computed(() => store.getters.isAdmin);

    const content = ref('');
    const editedContent = ref('');
    const isEditorActive = ref(false);

    onMounted(async () => {
      try {
        content.value = await server.getPageContent(props.pageName);
        editedContent.value = content.value;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading page content. Please try again.',
          err as Error
        );
      }
    });

    const edit = async () => {
      if (isEditorActive.value) {
        try {
          await server.updatePageContent(props.pageName, editedContent.value);
          content.value = editedContent.value;
          isEditorActive.value = !isEditorActive.value;
        } catch (err) {
          actions.showErrorSnackbar('Page content edit failed', err as Error);
        }
      } else {
        isEditorActive.value = !isEditorActive.value;
      }
    };

    const cancel = () => {
      isEditorActive.value = false;
      editedContent.value = content.value;
    };
    return {
      content,
      editedContent,
      isAdmin,
      isEditorActive,
      edit,
      cancel,
    };
  },
});
</script>
