<template>
  <span>
    <UtilList
      v-if="canEdit"
      @clicked-commenting="isCommenting = true"
      @clicked-editing="isEditing = true"
      @clicked-deleting="deleteSpellingDialog = true"
      :word="htmlSpelling"
      :has-html="true"
    >
    </UtilList>
    <span v-else v-html="htmlSpelling" class="test-spelling"></span>
    <span v-if="spelling.totalOccurrences > 0">
      (<a @click="addSpellingDialog = true" class="test-num-texts">{{
        spelling.totalOccurrences
      }}</a
      >)</span
    >
    <spelling-dialog :form="form" :spelling="spelling" v-model="isEditing" />
    <CommentWordDisplay
      v-if="isCommenting"
      :route="`/dictionaryWord/${wordUuid}`"
      :uuid="spelling.uuid"
      :word="spelling.spelling"
      @submit="isCommenting = false"
      @input="isCommenting = false"
    />
    <OareDialog
      v-model="addSpellingDialog"
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
      <v-data-table
        :headers="headers"
        :items="spellingOccurrences"
        :search="search"
        :loading="referencesLoading"
        :server-items-length="totalOccurrences"
        :options.sync="tableOptions"
      >
        <template #[`item.text`]="{ item }">
          <router-link
            :to="`/epigraphies/${item.textUuid}`"
            class="test-text"
            >{{ item.textName }}</router-link
          >
        </template>
        <template #[`item.context`]="{ item }">
          <div
            v-for="(reading, index) in item.readings"
            :key="index"
            v-html="reading"
          />
        </template>
      </v-data-table>
    </OareDialog>
    <OareDialog
      v-model="deleteSpellingDialog"
      title="Delete spelling"
      submitText="Yes, delete"
      cancelText="No, don't delete"
      :persistent="false"
      @submit="deleteSpelling"
      :submitLoading="deleteLoading"
    >
      Are you sure you want to delete the spelling {{ spelling.spelling }} from
      this form? This action cannot be undone.
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
  inject,
} from '@vue/composition-api';
import {
  FormSpelling,
  DictionaryForm,
  SearchDiscourseSpellingRow,
} from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import { AxiosError } from 'axios';
import { spellingHtmlReading } from '@oare/oare';
import { ReloadKey } from './index.vue';
import SpellingDialog from './SpellingDialog.vue';
import CommentWordDisplay from '../../components/CommentWordDisplay/index.vue';
import UtilList from '../../components/UtilList/index.vue';

export default defineComponent({
  components: {
    SpellingDialog,
    CommentWordDisplay,
    UtilList,
  },
  props: {
    spelling: {
      type: Object as PropType<FormSpelling>,
      required: true,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    wordUuid: {
      type: String as PropType<string>,
      required: false,
    },
  },
  setup(props) {
    const _ = sl.get('lodash');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const reload = inject(ReloadKey);

    const search = ref('');
    const addSpellingDialog = ref(false);
    const deleteSpellingDialog = ref(false);
    const deleteLoading = ref(false);
    const isEditing = ref(false);
    const isCommenting = ref(false);
    const editLoading = ref(false);
    const headers: DataTableHeader[] = reactive([
      {
        text: 'Text Name',
        value: 'text',
      },
      {
        text: 'Context',
        value: 'context',
      },
    ]);
    const referencesLoading = ref(false);
    const tableOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });
    const spellingOccurrences = ref<
      Pick<SearchDiscourseSpellingRow, 'textName' | 'textUuid'>[]
    >([]);
    const totalOccurrences = ref(0);

    const canEdit = computed(() =>
      store.getters.permissions.dictionary.includes('UPDATE_FORM')
    );

    const htmlSpelling = computed(() =>
      spellingHtmlReading(props.spelling.spelling)
    );

    const getReferences = async () => {
      try {
        referencesLoading.value = true;
        const { totalResults, rows } = await server.getSpellingTextOccurrences(
          props.spelling.uuid,
          {
            page: tableOptions.value.page - 1,
            limit: tableOptions.value.itemsPerPage,
            ...(search.value ? { filter: search.value } : null),
          }
        );
        spellingOccurrences.value = rows;
        totalOccurrences.value = totalResults;
      } catch {
        actions.showErrorSnackbar('Failed to load spelling occurrences');
      } finally {
        referencesLoading.value = false;
      }
    };

    const deleteSpelling = async () => {
      try {
        deleteLoading.value = true;
        await server.removeSpelling(props.spelling.uuid);
        actions.showSnackbar('Successfully removed spelling');
        reload && reload();
      } catch {
        actions.showErrorSnackbar('Failed to delete spelling');
      } finally {
        deleteLoading.value = false;
      }
    };

    watch(tableOptions, getReferences);

    watch(search, _.debounce(getReferences, 500));

    return {
      addSpellingDialog,
      deleteSpellingDialog,
      deleteLoading,
      headers,
      search,
      canEdit,
      isEditing,
      isCommenting,
      editLoading,
      htmlSpelling,
      deleteSpelling,
      referencesLoading,
      spellingOccurrences,
      tableOptions,
      totalOccurrences,
    };
  },
});
</script>
