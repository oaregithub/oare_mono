<template>
  <span>
    <v-btn
      v-if="canEdit"
      icon
      class="test-pencil mt-n2"
      @click="isEditing = true"
    >
      <v-icon>mdi-pencil</v-icon>
    </v-btn>
    <span v-html="htmlSpelling"></span>
    <span v-if="spelling.texts.length > 0">
      (<a @click="dialogOpen = true" class="test-num-texts">{{
        spelling.texts.length
      }}</a
      >)</span
    >
    <OareDialog
      v-model="isEditing"
      :title="`Edit Form Spelling: ${spelling.spelling}`"
      :submitDisabled="!editedSpelling || editedSpelling === spelling.spelling"
      :submitLoading="editLoading"
      @submit="saveSpelling"
    >
      <v-text-field
        v-model="editedSpelling"
        autofocus
        class="test-edit-spelling"
      />
    </OareDialog>
    <OareDialog
      v-model="dialogOpen"
      :title="`Texts for ${spelling.spelling}`"
      :showSubmit="false"
      cancelText="Close"
      :persistent="false"
    >
      <v-row>
        <v-col cols="12" sm="6" class="py-0">
          <v-text-field v-model="search" clearable label="Filter" autofocus />
        </v-col>
      </v-row>
      <v-data-table :headers="headers" :items="spelling.texts" :search="search">
        <template #[`item.text`]="{ item }">
          <router-link :to="`/epigraphies/${item.uuid}`" class="test-text">{{
            item.text
          }}</router-link>
        </template>
      </v-data-table>
    </OareDialog>
  </span>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  computed,
  PropType,
  watch,
} from '@vue/composition-api';
import { FormSpelling } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import { AxiosError } from 'axios';
import { spellingHtmlReading } from '@oare/oare';

export default defineComponent({
  props: {
    updateSpelling: {
      type: Function as PropType<(newSpelling: FormSpelling) => void>,
      required: true,
    },
    spelling: {
      type: Object as PropType<FormSpelling>,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const search = ref('');
    const dialogOpen = ref(false);
    const isEditing = ref(false);
    const editedSpelling = ref(props.spelling.spelling);
    const editLoading = ref(false);
    const headers: DataTableHeader[] = reactive([
      {
        text: 'Text Name',
        value: 'text',
      },
    ]);

    const canEdit = computed(() =>
      store.getters.permissions.dictionary.includes('UPDATE_FORM')
    );

    const htmlSpelling = computed(() =>
      spellingHtmlReading(props.spelling.spelling)
    );

    const saveSpelling = async () => {
      try {
        editLoading.value = true;
        await server.updateSpelling(props.spelling.uuid, editedSpelling.value);
        actions.showSnackbar('Successfully updated spelling');
        isEditing.value = false;
        props.updateSpelling({
          ...props.spelling,
          spelling: editedSpelling.value,
        });
      } catch (err) {
        if (err.response && err.response.status === 400) {
          actions.showErrorSnackbar(err.response.data.message);
        } else {
          actions.showErrorSnackbar('Failed to update form spelling');
        }
      } finally {
        editLoading.value = false;
      }
    };

    watch(isEditing, open => {
      if (!open) {
        editedSpelling.value = props.spelling.spelling;
      }
    });

    return {
      dialogOpen,
      headers,
      search,
      canEdit,
      isEditing,
      editedSpelling,
      editLoading,
      saveSpelling,
      htmlSpelling,
    };
  },
});
</script>
