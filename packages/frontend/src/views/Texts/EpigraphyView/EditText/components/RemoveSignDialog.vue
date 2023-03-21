<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :title="`Remove ${
      currentEditAction === 'removeSign' ? 'Sign' : 'Broken Signs'
    }?`"
    :persistent="false"
    @submit="removeSign"
    :submitLoading="removeSignLoading"
    :submitDisabled="!formsLoaded"
  >
    <span v-if="word && word.signs.length === 1">
      Are you sure you want to remove the sign
      <b v-html="sign.reading" /> from line {{ line }}? <b>WARNING: </b>If the
      sign you are removing is the only unit on its line, the line will also be
      removed.
    </span>
    <div v-else>
      <v-row class="ma-0" justify="center">
        Removing
        <b v-html="sign.reading" class="mx-1" />
        from the word
        <b v-html="word.reading" class="mx-1" />
        will change the makeup of the word.
      </v-row>

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
  ref,
  PropType,
  computed,
  ComputedRef,
  onMounted,
} from '@vue/composition-api';
import {
  EpigraphicSign,
  EpigraphicWord,
  RemoveSignPayload,
  EditTextAction,
  EditorDiscourseWord,
} from '@oare/types';
import sl from '@/serviceLocator';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

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
    sign: {
      type: Object as PropType<EpigraphicSign>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    line: {
      type: Number,
      required: true,
    },
    currentEditAction: {
      type: String as PropType<EditTextAction>,
      required: false,
    },
  },
  components: {
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const getUpdatedSignsWithSeparators = () => {
      const newSigns = props.word.signs.filter(
        sign => sign.uuid !== props.sign.uuid
      );
      const newWord = newSigns.map((sign, index) => {
        const nextSign =
          index !== newSigns.length - 1 ? newSigns[index + 1] : null;

        let newSeparator = '';
        if (nextSign) {
          if (
            !sign.markups
              .map(unit => unit.type)
              .includes('phoneticComplement') &&
            nextSign.markups
              .map(unit => unit.type)
              .includes('phoneticComplement')
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

    const removeSignLoading = ref(false);
    const removeSign = async () => {
      try {
        removeSignLoading.value = true;

        const newSpelling = getUpdatedSignsWithSeparators().replace(
          /<[^>]*>/g,
          ''
        );

        const payload: RemoveSignPayload = {
          type:
            props.currentEditAction === 'removeSign'
              ? 'removeSign'
              : 'removeUndeterminedSigns',
          textUuid: props.textUuid,
          uuid: props.sign.uuid,
          line: props.line,
          spellingUuid: spellingUuid.value || null,
          spelling: newSpelling,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing sign. Please try again.',
          err as Error
        );
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        removeSignLoading.value = false;
      }
    };

    const spellingUuid = ref<string>();

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

    const formsLoaded = ref(false);
    onMounted(() => {
      if (props.word.signs.length === 1) {
        formsLoaded.value = true;
      }
    });

    return {
      getUpdatedSignsWithSeparators,
      removeSign,
      removeSignLoading,
      spellingUuid,
      editorDiscourseWord,
      formsLoaded,
    };
  },
});
</script>
