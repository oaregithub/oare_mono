<template>
  <div>
    <v-row>
      <v-col cols="3" md="2" xl="1" class="font-weight-bold mr-1">{{
        label
      }}</v-col>
      <v-col cols="7" lg="4" xl="3">
        <div v-if="isEditing" class="mt-n5">
          <v-text-field
            v-model="editedValue"
            autofocus
            outlined
            class="test-edit-value"
          />
          <div class="d-flex flex-row">
            <OareLoaderButton
              color="primary"
              class="mr-2 test-submit-value"
              @click="updateValue"
              :loading="loading"
              >Save</OareLoaderButton
            >
            <v-btn @click="cancelEdit">Cancel</v-btn>
          </div>
        </div>
        <span v-else>{{ currentValue }}</span>
      </v-col>
      <v-col cols="1" v-if="!isEditing">
        <v-btn icon small @click="triggerEdit" class="test-edit-row">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <reathenticate
      v-model="verifyPasswordDialog"
      @reauthenticated="unlockVerification"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { UpdateProfilePayload } from '@oare/types';
import sl from '@/serviceLocator';
import Reathenticate from '@/views/Authentication/Verification/Reautheticate.vue';

export default defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    currentValue: {
      type: String,
      required: true,
    },
    property: {
      type: String as PropType<keyof UpdateProfilePayload>,
      required: true,
    },
  },
  components: {
    Reathenticate,
  },
  setup({ currentValue, property }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const isEditing = ref(false);
    const editedValue = ref(currentValue);
    const loading = ref(false);
    const verifyPasswordDialog = ref(false);

    const triggerEdit = () => {
      if (property === 'email') {
        verifyPasswordDialog.value = true;
      } else {
        isEditing.value = true;
      }
    };

    const unlockVerification = () => {
      isEditing.value = true;
    };

    const cancelEdit = () => {
      editedValue.value = currentValue;
      isEditing.value = false;
    };

    const updateValue = async () => {
      loading.value = true;
      try {
        await server.updateProfile({
          [property]: editedValue.value,
        });
        actions.showSnackbar('Profile successfully updated');
        isEditing.value = false;
        emit('updated', editedValue.value);
      } catch (err) {
        actions.showErrorSnackbar(
          'There was an error updating your profile.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    return {
      editedValue,
      isEditing,
      cancelEdit,
      updateValue,
      loading,
      verifyPasswordDialog,
      triggerEdit,
      unlockVerification,
    };
  },
});
</script>
