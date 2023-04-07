<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', false)"
    :persistent="false"
    :submitLoading="reorderSignsLoading"
    :submitDisabled="step === 1 ? !stepOneComplete : !formsLoaded"
    @submit="step === 1 ? step++ : reorderSigns()"
    :submitText="step === 1 ? 'Next' : 'Submit'"
    :width="600"
    :showActionButton="step === 2"
    actionButtonText="Back"
    @action="goBack"
  >
    <template #title>
      Reorder Signs in <span class="ml-1" v-html="word.reading" />
    </template>

    <div v-if="step === 1">
      <v-row justify="center" class="ma-0 mt-2">
        <span>Select the two adjacent signs that you would like to swap.</span>
      </v-row>

      <v-row justify="center" align="center" class="mt-6 mb-6 oare-title">
        <span v-for="(sign, signIdx) in word.signs" :key="signIdx">
          <div class="d-inline-block">
            <v-row class="ma-0" justify="center">
              <span class="mx-2" v-html="sign.reading" />
              <span>{{ sign.separator }}</span>
            </v-row>
            <v-row class="ma-0" justify="center">
              <v-checkbox
                v-model="selectedSigns"
                dense
                hide-details
                class="mt-n1 test-reorder-sign-check"
                :value="sign"
                :disabled="!signCanBeSelected(sign)"
              ></v-checkbox>
            </v-row>
          </div>
        </span>
      </v-row>
    </div>

    <div v-if="step === 2">
      <v-row class="ma-0 my-4" justify="center">
        The word will be updated to become:
        <b class="ml-1" v-html="getUpdatedSignsWithSeparators()"
      /></v-row>

      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Use the interface below to connect the updated word to the correct
        dictionary spelling.
      </v-row>
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        Click on the word to view the available options for selection. In some
        cases, a selection will have been made automatically based on a
        spelling's prevalence. The selection bubble appears red when there are
        no matching options, yellow when there are available options but none
        have been automatically selected, and green if an option has been
        selected, whether automatically or manually. Automatic selections can
        also be disconnected or changed by clicking on the word.
      </v-row>
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        <connect-discourse-item
          :word="editorDiscourseWord"
          @update-spelling-uuid="spellingUuid = $event"
          @loaded-forms="formsLoaded = true"
        />
      </v-row>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import {
  EpigraphicWord,
  EpigraphicSign,
  EpigraphicUnitType,
  MarkupType,
  EditorDiscourseWord,
  ReorderSignPayload,
} from '@oare/types';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    word: {
      type: Object as PropType<EpigraphicWord>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const reorderSignsLoading = ref(false);

    const stepOneComplete = computed(() => {
      return selectedSigns.value.length === 2;
    });

    const formsLoaded = ref(false);

    const reorderSigns = async () => {
      try {
        reorderSignsLoading.value = true;

        if (selectedSigns.value.length !== 2) {
          throw new Error('Must select two signs to reorder');
        }

        const newSpelling = getUpdatedSignsWithSeparators();

        const payload: ReorderSignPayload = {
          type: 'reorderSign',
          textUuid: props.textUuid,
          spelling: newSpelling,
          spellingUuid: spellingUuid.value || null,
          signUuids: selectedSigns.value.map(s => s.uuid),
          discourseUuid: props.word.discourseUuid,
        };

        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar('Error reordering signs', err as Error);
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        reorderSignsLoading.value = false;
      }
    };

    const spellingUuid = ref<string>();
    const step = ref(1);

    const goBack = () => {
      step.value = 1;
      spellingUuid.value = undefined;
    };

    const selectedSigns = ref<EpigraphicSign[]>([]);

    const signCanBeSelected = (sign: EpigraphicSign) => {
      if (selectedSigns.value.map(s => s.uuid).includes(sign.uuid)) {
        return true;
      }

      if (selectedSigns.value.length === 0) {
        return true;
      }

      if (selectedSigns.value.length >= 2) {
        return false;
      }

      if (selectedSigns.value.length === 1) {
        const firstObjOnTablet = selectedSigns.value[0].objOnTablet;
        if (
          sign.objOnTablet === firstObjOnTablet - 1 ||
          sign.objOnTablet === firstObjOnTablet + 1
        ) {
          return true;
        }
      }

      return false;
    };

    const getUpdatedSignsWithSeparators = () => {
      const pieces: {
        uuid: string;
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = props.word.signs.map(sign => ({
        uuid: sign.uuid,
        reading: sign.reading || '',
        type: sign.type,
        markup: sign.markups.map(unit => unit.type),
      }));

      const indexOfFirst = pieces
        .map(p => p.uuid)
        .indexOf(selectedSigns.value[0].uuid);
      const indexOfSecond = pieces
        .map(p => p.uuid)
        .indexOf(selectedSigns.value[1].uuid);

      const newPieces = [
        ...pieces.slice(0, indexOfFirst),
        pieces[indexOfSecond],
        pieces[indexOfFirst],
        ...pieces.slice(indexOfSecond + 1),
      ];

      const newWord = newPieces.map((sign, index) => {
        const nextSign =
          index !== newPieces.length - 1 ? newPieces[index + 1] : null;

        let newSeparator = '';
        if (nextSign) {
          if (
            !sign.markup.includes('phoneticComplement') &&
            nextSign.markup.includes('phoneticComplement')
          ) {
            newSeparator = '';
          }
          if (
            sign.type === 'determinative' ||
            nextSign.type === 'determinative'
          ) {
            newSeparator = '';
          }
          if (sign.type === 'phonogram' || nextSign.type === 'phonogram') {
            newSeparator = '-';
          }
          if (sign.type === 'number' && nextSign.type === 'number') {
            newSeparator = '+';
          }
          if (sign.type === 'logogram' || nextSign.type === 'logogram') {
            newSeparator = '.';
          }
        }

        return {
          ...sign,
          separator: newSeparator,
        };
      });

      let newWordReading = '';
      newWord.forEach(sign => {
        newWordReading += sign.reading;
        if (sign.separator) {
          newWordReading += sign.separator;
        }
      });
      return newWordReading
        .replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\([^()]*\)/g, '');
    };

    const editorDiscourseWord: ComputedRef<EditorDiscourseWord> = computed(
      () => {
        const newWord = getUpdatedSignsWithSeparators();
        return {
          discourseUuid: props.word.discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      }
    );

    return {
      reorderSignsLoading,
      stepOneComplete,
      formsLoaded,
      reorderSigns,
      step,
      spellingUuid,
      goBack,
      selectedSigns,
      signCanBeSelected,
      getUpdatedSignsWithSeparators,
      editorDiscourseWord,
    };
  },
});
</script>