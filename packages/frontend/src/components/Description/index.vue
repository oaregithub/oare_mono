<template>
  <div>
    <div
      v-for="(description, index) in descriptions"
      :key="`description-${index}`"
    >
      <div>
        <span v-if="!isAdding && !isDeleting && !isEditing && allowCUD"
          ><v-btn
            @click="
              openEdit(
                description.uuid,
                description.field || '',
                description.primacy || 1,
                index
              )
            "
            class="test-edit-description"
            icon
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn></span
        >
        <span v-if="!(index === editingIndex && isEditing)">{{
          description.field
        }}</span>
        <span v-if="!isAdding && !isDeleting && !isEditing && allowCUD"
          ><v-btn
            @click="
              openDelete(
                description.uuid,
                description.field || '',
                description.primacy || 1
              )
            "
            class="test-delete-description"
            icon
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn></span
        >
      </div>
      <edit-description
        v-if="index === editingIndex && isEditing && allowCUD"
        :description="updateOrDeleteDescription"
        :primacy="updateOrDeletePrimacy"
        :uuid="updateOrDeleteUuid"
        @close="refreshPage"
      />
    </div>
    <div class="my-4" v-if="!isAdding && !isDeleting && !isEditing && allowCUD">
      <span>
        <v-btn class="test-add-description-button" @click="isAdding = true"
          >Add Description<v-icon>mdi-plus</v-icon></v-btn
        ></span
      >
    </div>
    <add-description
      v-if="isAdding && allowCUD"
      :nextPrimacy="descriptions.length + 1"
      :referenceUuid="referenceUuid"
      @close="refreshPage"
    />
    <oare-dialog
      v-model="isDeleting"
      title="Remove Description"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="deleteDescription"
      >Are you sure you want to remove
      <b
        ><em>{{ updateOrDeleteDescription }}</em></b
      >? This action cannot be undone.</oare-dialog
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { FieldRow } from '@oare/types';
import AddDescription from '@/components/Description/components/AddDescription.vue';
import EditDescription from '@/components/Description/components/EditDescription.vue';

export default defineComponent({
  props: {
    descriptions: {
      type: Array as PropType<FieldRow[]>,
      required: true,
    },
    referenceUuid: {
      type: String,
      required: true,
    },
    allowCUD: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    AddDescription,
    EditDescription,
  },
  setup({ referenceUuid }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const isAdding = ref(false);
    const isEditing = ref(false);
    const isDeleting = ref(false);
    const updateOrDeleteDescription = ref('');
    const updateOrDeleteUuid = ref('');
    const updateOrDeletePrimacy = ref(-1);
    const editingIndex = ref(-1);

    const openEdit = (
      uuid: string,
      description: string,
      primacy: number,
      index: number
    ) => {
      isEditing.value = true;
      updateOrDeleteDescription.value = description;
      updateOrDeleteUuid.value = uuid;
      updateOrDeletePrimacy.value = primacy;
      editingIndex.value = index;
    };

    const openDelete = (uuid: string, description: string, primacy: number) => {
      isDeleting.value = true;
      updateOrDeleteDescription.value = description;
      updateOrDeleteUuid.value = uuid;
      updateOrDeletePrimacy.value = primacy;
    };

    const deleteDescription = async () => {
      try {
        await server.deleteField(updateOrDeleteUuid.value);
      } catch (err) {
        actions.showErrorSnackbar(
          'unable to delete selected description',
          err as Error
        );
      } finally {
        refreshPage();
      }
    };

    const refreshPage = () => {
      updateOrDeleteUuid.value = '';
      updateOrDeleteDescription.value = '';
      updateOrDeletePrimacy.value = -1;
      editingIndex.value = -1;
      isDeleting.value = false;
      isEditing.value = false;
      isAdding.value = false;
      emit('refresh-page');
    };

    return {
      openEdit,
      openDelete,
      deleteDescription,
      refreshPage,
      isAdding,
      isEditing,
      isDeleting,
      updateOrDeleteDescription,
      updateOrDeletePrimacy,
      updateOrDeleteUuid,
      editingIndex,
    };
  },
});
</script>
