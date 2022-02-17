<template>
  <div>
    <div v-if="isAdmin">
      <vue-editor v-if="isEditorActive" v-model="content" /><br />

      <v-btn class="mr-2" v-if="isEditorActive" color="primary" @click="edit"
        >Save</v-btn
      >
      <v-btn v-if="isEditorActive" text @click="cancel">Cancel</v-btn>
    </div>
    <div
      v-if="isEditorActive == false"
      v-html="content"
      class="title font-weight-regular"
    ></div>
    <v-row
      ><v-spacer />
      <v-btn v-if="isEditorActive == false" color="primary" @click="edit"
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
    const isEditorActive = ref(false);

    onMounted(async () => {
      try {
        content.value = await server.getPageContent(props.pageName);
      } catch {
        actions.showErrorSnackbar(
          'Error loading page content. Please try again.'
        );
      }
    });

    const edit = async () => {
      if (isEditorActive.value) {
        try {
          await server.updatePageContent(props.pageName, content.value);
          isEditorActive.value = !isEditorActive.value;
        } catch (err) {
          actions.showErrorSnackbar('Page content edit failed', err as Error);
        }
      } else {
        isEditorActive.value = !isEditorActive.value;
      }
    };

    const cancel = async () => {
      isEditorActive.value = false;
    };
    return {
      content,
      isAdmin,
      isEditorActive,
      edit,
      cancel,
    };
  },
});
</script>
