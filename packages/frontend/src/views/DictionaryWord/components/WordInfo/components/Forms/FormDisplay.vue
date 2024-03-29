<template>
  <div class="d-flex">
    <div class="d-flex flex-shrink-0">
      <v-tooltip
        bottom
        open-delay="800"
        :key="`${editing}-${form.uuid}-edit-form`"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="canEdit && !editing && allowEditing"
            icon
            class="test-pencil mt-n1 mr-1"
            @click="editing = true"
            small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon size="20">mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit Form</span>
      </v-tooltip>

      <UtilList
        v-if="!editing"
        @comment-clicked="openComment(form.uuid, form.form)"
        :hasEdit="false"
        :hasDelete="false"
        :hideMenu="!allowEditing"
      >
        <template #activator="{ on, attrs }">
          <strong
            class="mr-1 test-form-util-list"
            :class="{ 'cursor-display': canComment && allowEditing }"
            v-on="on"
            v-bind="attrs"
          >
            <mark v-if="form.uuid === uuidToHighlight">{{ form.form }}</mark>
            <mark v-else-if="form.spellings.length <= 0" class="error">{{
              form.form
            }}</mark>
            <template v-else>{{ form.form }}</template>
          </strong>
        </template>
      </UtilList>

      <div v-else class="d-flex flex-row pa-0 ml-2">
        <v-text-field
          v-model="editForm.form"
          autofocus
          class="test-edit pa-0"
          :disabled="loading"
        />
        <v-progress-circular
          size="20"
          v-if="loading"
          indeterminate
          color="#757575"
          class="mt-3"
        />
        <v-btn v-if="!loading" icon @click="saveFormEdit" class="test-check">
          <v-icon>mdi-check</v-icon>
        </v-btn>
        <v-btn v-if="!loading" icon @click="editing = false" class="test-close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <span
        v-if="formTotalOccurrences === null || formTotalOccurrences > 0"
        :key="`${form.uuid}-form-occurences`"
        :class="editing ? 'mt-2' : ''"
        class="mr-1"
      >
        <a @click="textOccurrenceDialog = true">
          ({{
            formTotalOccurrences !== null ? formTotalOccurrences : 'Loading...'
          }})</a
        >
      </span>
      <span v-if="spellingUuids.length > 0">
        <text-occurrences
          v-if="textOccurrenceDialog"
          v-model="textOccurrenceDialog"
          class="test-text-occurrences-display"
          :title="form.form"
          :uuids="spellingUuids"
          :totalTextOccurrences="formTotalOccurrences || 0"
          :getTexts="server.getSpellingOccurrencesTexts"
          :getTextsCount="server.getSpellingOccurrencesCounts"
          @reload="reload && reload()"
          @disconnect="disconnectSpellings($event)"
        />
      </span>

      <grammar-display
        :class="editing ? 'mt-2' : ''"
        :word="word"
        :form="form"
        :allowEditing="allowEditing"
      />
    </div>
    <div class="d-inline-flex flex-row flex-shrink-1">
      <span :class="`d-inline-flex flex-wrap ${editing ? 'mt-2' : ''}`">
        <span
          class="d-flex flex-row"
          v-for="(s, index) in form.spellings"
          :key="index"
        >
          <spelling-display
            :key="`${s.uuid}-${index}`"
            :spelling="s"
            :form="form"
            :uuidToHighlight="uuidToHighlight"
            :allowEditing="allowEditing"
            :spellingOccurrencesCount="
              spellingOccurrencesCounts
                ? getSpellingOccurrencesByUuid(s.uuid)
                : null
            "
          />
          <span v-if="index !== form.spellings.length - 1" class="mr-1">,</span>
        </span>
      </span>
      <v-tooltip
        :key="`${editing}-${form.uuid}-add-spelling`"
        bottom
        open-delay="800"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="canAddSpelling && !editing && allowEditing"
            icon
            class="mt-n1 ml-1"
            @click="openEditDialog(form)"
            small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon size="20">mdi-plus</v-icon>
          </v-btn>
        </template>
        <span>Add Spelling</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  onMounted,
  inject,
} from '@vue/composition-api';
import {
  DictionaryForm,
  TextOccurrencesCountResponseItem,
  Word,
} from '@oare/types';
import sl from '@/serviceLocator';
import GrammarDisplay from './components/GrammarDisplay.vue';
import SpellingDisplay from './components/SpellingDisplay.vue';
import TextOccurrences from '@/components/TextOccurrences/index.vue';
import UtilList from '@/components/UtilList/index.vue';
import EventBus, { ACTIONS } from '@/EventBus';
import { ReloadKey } from '@/views/DictionaryWord/index.vue';

export default defineComponent({
  components: {
    GrammarDisplay,
    SpellingDisplay,
    UtilList,
    TextOccurrences,
  },
  props: {
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    updateForm: {
      type: Function as PropType<(newForm: DictionaryForm) => void>,
      required: true,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    spellingOccurrencesCounts: {
      type: Array as PropType<TextOccurrencesCountResponseItem[]>,
      default: null,
    },
  },
  setup(props) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const reload = inject(ReloadKey);

    const routeName = router.currentRoute.name;
    const spellingDialogOpen = ref(false);
    const editing = ref(false);
    const loading = ref(false);
    const isCommenting = ref(false);
    const editForm = ref({
      ...props.form,
    });

    const formTotalOccurrences = computed(() =>
      props.spellingOccurrencesCounts !== null
        ? props.spellingOccurrencesCounts.reduce(
            (sum, element) => sum + element.count,
            0
          )
        : null
    );

    const textOccurrenceDialog = ref(false);

    const canEdit = computed(() => store.hasPermission('UPDATE_FORM'));

    const canAddSpelling = computed(() => store.hasPermission('ADD_SPELLING'));

    const canComment = computed(() => store.hasPermission('ADD_COMMENTS'));

    const saveFormEdit = async (): Promise<void> => {
      loading.value = true;
      try {
        await server.updateForm(editForm.value.uuid, {
          newForm: editForm.value.form,
        });
        props.updateForm(editForm.value);
        actions.showSnackbar('Form successfully updated');
        editing.value = false;
      } catch (err) {
        actions.showErrorSnackbar('Error updating form', err as Error);
      } finally {
        loading.value = false;
      }
    };

    const openComment = (uuid: string, word: string) => {
      EventBus.$emit(ACTIONS.COMMENT_DIALOG, {
        uuid,
        word,
      });
    };

    const openEditDialog = (form: DictionaryForm) => {
      EventBus.$emit(ACTIONS.EDIT_WORD_DIALOG, {
        form,
        allowDiscourseMode: false,
      });
    };

    const spellingUuids = ref<string[]>([]);

    onMounted(() => {
      spellingUuids.value = props.form.spellings.map(({ uuid }) => uuid);
    });

    const getSpellingOccurrencesByUuid = (
      spellingUuid: string
    ): number | null => {
      if (props.spellingOccurrencesCounts === null) {
        return null;
      }
      const item = props.spellingOccurrencesCounts.find(
        item => item.uuid === spellingUuid
      );
      return item ? item.count : 0;
    };

    const disconnectSpellings = async (discourseUuids: string[]) => {
      try {
        await server.disconnectSpellings(discourseUuids);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error disconnecting spellings. Please try again.',
          err as Error
        );
      }
    };

    return {
      isCommenting,
      editing,
      canEdit,
      canAddSpelling,
      canComment,
      editForm,
      loading,
      saveFormEdit,
      spellingDialogOpen,
      routeName,
      openComment,
      openEditDialog,
      textOccurrenceDialog,
      server,
      spellingUuids,
      getSpellingOccurrencesByUuid,
      formTotalOccurrences,
      reload,
      disconnectSpellings,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
