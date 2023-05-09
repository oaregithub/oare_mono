<template>
  <div>
    <v-row class="mt-2">
      <v-col>
        <v-row>
          <div class="d-flex">
            <div class="float-left d-flex flex-shrink-0">
              <v-tooltip
                bottom
                open-delay="800"
                :key="`${
                  isEditingLemmaTranslations | isEditingDefinitionTranslations
                }-lemma-properties`"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-if="
                      allowEditing &&
                      canEditLemmaProperties &&
                      !isEditingLemmaTranslations &&
                      !isEditingDefinitionTranslations
                    "
                    icon
                    class="test-property-pencil edit-button mt-n1 mr-1 ml-3"
                    @click="editLemmaPropertiesDialog = true"
                    small
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon size="20">mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Edit Lemma Properties</span>
              </v-tooltip>
              <div
                v-if="
                  partsOfSpeech.length > 0 &&
                  !isEditingLemmaTranslations &&
                  !isEditingDefinitionTranslations
                "
                :class="
                  !allowEditing
                    ? 'mr-1 ml-3'
                    : `${!canEditLemmaProperties ? 'ml-12 mr-1' : 'mr-1 ml-1'}`
                "
              >
                {{ partsOfSpeechString }}
              </div>
              <div
                v-if="
                  verbalThematicVowelTypes.length > 0 &&
                  !isEditingLemmaTranslations &&
                  !isEditingDefinitionTranslations
                "
                class="mr-1"
              >
                ({{ verbalThematicVowelTypesString }})
              </div>

              <v-tooltip
                bottom
                open-delay="800"
                :key="`${
                  isEditingDefinitionTranslations | isEditingLemmaTranslations
                }-translations`"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-if="
                      allowEditing &&
                      canEditTranslations &&
                      !isEditingDefinitionTranslations &&
                      !isEditingLemmaTranslations
                    "
                    icon
                    class="mt-n1 mr-1"
                    @click="isEditingDefinitionTranslations = true"
                    small
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon size="20">mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Edit Definition Translations</span>
              </v-tooltip>
            </div>
            <edit-translations
              v-if="isEditingDefinitionTranslations && allowEditing"
              @close-editor="isEditingDefinitionTranslations = false"
              :translations="word.translationsForDefinition"
              @update:translations="updateDefinitionTranslations"
              :wordUuid="word.uuid"
              fieldType="definition"
            />
            <div class="d-flex flex-row flex-wrap flex-shrink-1">
              <div class="flex-row">
                <p
                  v-if="
                    onlyShowFirstTranslation &&
                    !isEditingDefinitionTranslations &&
                    !isEditingLemmaTranslations
                  "
                  class="mb-0"
                >
                  <span v-if="word.translationsForDefinition.length >= 1">
                    <UtilList
                      @comment-clicked="
                        openComment(
                          word.translationsForDefinition[0].uuid,
                          word.translationsForDefinition[0].val
                            ? word.translationsForDefinition[0].val
                            : ''
                        )
                      "
                      :hasEdit="false"
                      :hasDelete="false"
                      :hideMenu="!canComment || !allowEditing"
                    >
                      <template #activator="{ on, attrs }">
                        <div
                          class="test-defintion-util-list"
                          :class="{
                            'cursor-display': canComment && allowEditing,
                          }"
                          v-on="on"
                          v-bind="attrs"
                        >
                          <b>{{ 1 }}</b>
                          . {{ word.translationsForDefinition[0].val }}
                        </div>
                      </template>
                    </UtilList>
                  </span>
                </p>
                <p
                  v-else-if="
                    !isEditingDefinitionTranslations &&
                    !isEditingLemmaTranslations
                  "
                >
                  <span
                    v-for="(tr, idx) in word.translationsForDefinition"
                    :key="tr.uuid"
                  >
                    <UtilList
                      @comment-clicked="
                        openComment(tr.uuid, tr.val ? tr.val : '')
                      "
                      :hasEdit="false"
                      :hasDelete="false"
                      :hideMenu="!canComment || !allowEditing"
                    >
                      <template #activator="{ on, attrs }">
                        <div
                          class="test-defintion-util-list"
                          :class="{
                            'cursor-display': canComment && allowEditing,
                          }"
                          v-on="on"
                          v-bind="attrs"
                        >
                          <b>{{ idx + 1 }}</b
                          >. {{ tr.val }}
                        </div>
                      </template>
                    </UtilList>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </v-row>
        <v-row>
          <p>
            <span
              :class="`ml-${allowEditing ? 12 : 3}`"
              v-if="
                specialClassifications.length > 0 &&
                !isEditingLemmaTranslations &&
                !isEditingDefinitionTranslations
              "
            >
              {{ specialClassificationsString }}
            </span>
          </p>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <v-tooltip
        bottom
        open-delay="800"
        :key="`${
          isEditingDefinitionTranslations | isEditingLemmaTranslations
        }-translations`"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            v-if="
              allowEditing &&
              canEditTranslations &&
              !isEditingLemmaTranslations &&
              !isEditingDefinitionTranslations
            "
            icon
            class="mt-n1 mr-2 ml-3"
            @click="isEditingLemmaTranslations = true"
            small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon size="20">mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit Discussion Lemma Translations</span>
      </v-tooltip>
      <edit-translations
        v-if="isEditingLemmaTranslations && allowEditing"
        @close-editor="isEditingLemmaTranslations = false"
        :translations="word.discussionLemmas"
        @update:translations="updateDiscussionLemma"
        :wordUuid="word.uuid"
        fieldType="discussionLemma"
      />
      <span
        :class="!allowEditing || !canEditTranslations ? 'mb-4 ml-3' : 'mb-4'"
        v-if="
          word.discussionLemmas.length === 0 &&
          !isEditingLemmaTranslations &&
          !isEditingDefinitionTranslations
        "
      >
        No discussion lemma
      </span>
      <p
        v-else-if="
          !isEditingLemmaTranslations && !isEditingDefinitionTranslations
        "
        :class="!allowEditing || !canEditTranslations ? 'my-4 ml-6' : 'my-4'"
      >
        <v-row v-for="lm in word.discussionLemmas" :key="lm.uuid">
          {{ lm.val }}
        </v-row>
      </p>
    </v-row>

    <oare-dialog
      v-if="allowEditing && canEditLemmaProperties"
      v-model="editLemmaPropertiesDialog"
      :title="`Edit Lemma Properties - ${word.word}`"
      :width="1400"
      :submitDisabled="!formComplete"
      submitText="Submit"
      closeOnSubmit
      @submit="updateLemmaProperties"
    >
      <properties-tree
        :readonly="false"
        startingValueHierarchyUuid="aa2bf3ac-55f2-11eb-bf9e-024de1c1cc1d"
        @set-properties="setProperties($event)"
        @set-complete="formComplete = $event"
        :existingProperties="word.properties"
        :key="addPropertiesKey"
      />
    </oare-dialog>
    <component
      v-if="canComment"
      :is="commentComponent"
      v-model="isCommenting"
      :item="`${word.word}: '${commentDialogItem}'`"
      :uuid="commentDialogUuid"
      :key="commentDialogUuid"
      :route="`/${routeName}/${word.uuid}`"
      >{{ word.word }}: "{{ commentDialogItem }}"</component
    >
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  watch,
  inject,
} from '@vue/composition-api';
import { Word, DictionaryWordTranslation, AppliedProperty } from '@oare/types';
import { ReloadKey } from '../../../../index.vue';
import EditTranslations from './components/EditTranslations.vue';
import UtilList from '@/components/UtilList/index.vue';
import sl from '@/serviceLocator';
import PropertiesTree from '@/components/Properties/PropertiesTree.vue';

export default defineComponent({
  name: 'WordGrammar',
  props: {
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
    onlyShowFirstTranslation: {
      type: Boolean,
      default: false,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    updateWordInfo: {
      type: Function as PropType<(newWord: Word) => void>,
      required: false,
    },
  },
  components: {
    EditTranslations,
    UtilList,
    PropertiesTree,
  },
  setup({ word, updateWordInfo }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const router = sl.get('router');
    const reload = inject(ReloadKey);

    const isEditingLemmaProperties = ref(false);
    const isEditingDefinitionTranslations = ref(false);
    const isEditingLemmaTranslations = ref(false);
    const isCommenting = ref(false);
    const commentDialogUuid = ref('');
    const commentDialogItem = ref('');
    const routeName = router.currentRoute.name;

    const partsOfSpeech = computed(() =>
      word.properties.filter(prop => prop.variableName === 'Part of Speech')
    );

    const partsOfSpeechString = computed(() =>
      partsOfSpeech.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const verbalThematicVowelTypes = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Verbal Thematic Vowel Type'
      )
    );

    const verbalThematicVowelTypesString = computed(() =>
      verbalThematicVowelTypes.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const specialClassifications = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Special Classifications'
      )
    );

    const specialClassificationsString = computed(() =>
      specialClassifications.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const editLemmaPropertiesDialog = ref(false);
    const formComplete = ref(false);

    const properties = ref<AppliedProperty[]>([]);
    const setProperties = (propertyList: AppliedProperty[]) => {
      properties.value = propertyList;
    };

    const addPropertiesKey = ref(false);
    watch(editLemmaPropertiesDialog, () => {
      if (editLemmaPropertiesDialog.value) {
        addPropertiesKey.value = !addPropertiesKey.value;
        properties.value = [];
      }
    });

    const updateLemmaProperties = async () => {
      try {
        await server.editPropertiesByReferenceUuid(
          word.uuid,
          properties.value,
          word.uuid
        );
        actions.showSnackbar(
          `Successfully updated lemma properties for ${word.word}`
        );
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating form parse information.',
          err as Error
        );
      } finally {
        properties.value = [];
      }
    };

    const canEditLemmaProperties = computed(() =>
      store.hasPermission('EDIT_ITEM_PROPERTIES')
    );

    const canEditTranslations = computed(() =>
      store.hasPermission('UPDATE_TRANSLATION')
    );

    const canComment = computed(() => store.hasPermission('ADD_COMMENTS'));

    const updateDefinitionTranslations = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      if (updateWordInfo) {
        updateWordInfo({
          ...word,
          translationsForDefinition: newTranslations,
        });
      }
    };

    const updateDiscussionLemma = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      if (updateWordInfo) {
        updateWordInfo({
          ...word,
          discussionLemmas: newTranslations,
        });
      }
    };

    const openComment = (uuid: string, item: string) => {
      commentDialogUuid.value = uuid;
      commentDialogItem.value = item;
      isCommenting.value = true;
    };

    // To avoid circular dependencies
    const commentComponent = computed(() =>
      canComment.value
        ? () => import('@/components/CommentItemDisplay/index.vue')
        : null
    );
    return {
      partsOfSpeech,
      partsOfSpeechString,
      verbalThematicVowelTypes,
      verbalThematicVowelTypesString,
      specialClassifications,
      specialClassificationsString,
      editLemmaPropertiesDialog,
      formComplete,
      properties,
      setProperties,
      addPropertiesKey,
      updateLemmaProperties,
      canEditLemmaProperties,
      canEditTranslations,
      isEditingLemmaProperties,
      isEditingDefinitionTranslations,
      isEditingLemmaTranslations,
      isCommenting,
      commentDialogItem,
      commentDialogUuid,
      commentComponent,
      canComment,
      openComment,
      updateDefinitionTranslations,
      updateDiscussionLemma,
      routeName,
    };
  },
});
</script>
<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
