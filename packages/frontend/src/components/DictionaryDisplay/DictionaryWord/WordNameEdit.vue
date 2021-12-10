<template>
  <v-row class="pa-0 ml-2">
    <v-col cols="4" class="pa-0">
      <v-text-field
        :value="word"
        @change="updateWord"
        autofocus
        class="test-edit pa-0"
        :disabled="isSaving"
      />
    </v-col>
    <v-progress-circular
      size="20"
      v-if="isSaving"
      indeterminate
      color="#757575"
      class="mt-3"
    />
    <v-btn v-if="!isSaving" icon @click="saveEdit" class="test-check">
      <v-icon>mdi-check</v-icon>
    </v-btn>
    <v-btn v-if="!isSaving" icon @click="closeEdit" class="test-close">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    wordUuid: {
      type: String,
      required: true,
    },
    word: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const updateWord = (newSpelling: string) => {
      emit('update:word', newSpelling);
    };

    const isSaving = ref(false);

    const closeEdit = () => {
      emit('close-edit');
    };

    const saveEdit = async () => {
      isSaving.value = true;
      try {
        await server.editWord(props.wordUuid, { word: props.word });
        actions.showSnackbar('Successfully updated word spelling');
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to update word spelling',
          err as Error
        );
      } finally {
        isSaving.value = false;
        closeEdit();
      }
    };

    return {
      updateWord,
      isSaving,
      saveEdit,
      closeEdit,
    };
  },
});
</script>

<style></style>
