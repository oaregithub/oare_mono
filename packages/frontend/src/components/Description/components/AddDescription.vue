<template>
  <v-row class="pa-0 ml-2">
    <v-col cols="4" class="pa-0">
      <v-text-field
        v-model="description"
        autofocus
        class="test-text-input pa-0"
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
    <v-btn
      v-if="!isSaving"
      :disabled="!description"
      icon
      @click="save"
      class="test-check"
    >
      <v-icon>mdi-check</v-icon>
    </v-btn>
    <v-btn v-if="!isSaving" icon @click="close" class="test-close">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    referenceUuid: {
      type: String,
      required: true,
    },
    nextPrimacy: {
      type: Number,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const description = ref('');

    const isSaving = ref(false);

    const close = () => {
      emit('close');
    };

    const save = async () => {
      isSaving.value = true;
      try {
        await server.createNewPropertyDescriptionField({
          referenceUuid: props.referenceUuid,
          description: description.value,
          primacy: props.nextPrimacy,
        });
        actions.showSnackbar('Successfully updated description');
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to update description spelling',
          err as Error
        );
      } finally {
        isSaving.value = false;
        close();
      }
    };

    return {
      isSaving,
      save,
      close,
      description,
    };
  },
});
</script>
