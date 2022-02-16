<template>
  <div>
    <div v-if="isAdmin">
      <vue-editor v-if="isEditorActive" v-model="content" /><br />
      <v-btn depressed color="primary" @click="edit">Edit</v-btn>
      <v-btn v-if="isEditorActive" depressed color="normal" @click="cancel"
        >Cancel</v-btn
      >
    </div>
    <div
      v-if="isEditorActive == false"
      v-html="content"
      class="title font-weight-regular"
    ></div>
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
      console.log(props.pageName);
      console.log(content.value);
      if (isEditorActive.value) {
        await server.updatePageContent(props.pageName, content.value);
      }
      isEditorActive.value = !isEditorActive.value;
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
