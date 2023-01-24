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
    :submitDisabled="formsLoading"
  >
    <span v-if="word && word.signs.length === 1">
      Are you sure you want to remove the sign
      <b v-html="sign.reading" /> from line {{ line }}? <b>WARNING: </b>If the
      sign you are removing is the only unit on its line, the line will also be
      removed.
    </span>
    <div v-else>
      <v-row class="ma-0">
        Removing
        <b v-html="sign.reading" class="mx-1" />
        from the word
        <b v-html="word.reading" class="mx-1" />
        will change the makeup of the word.
      </v-row>

      <v-row class="ma-0 mt-4">
        The word will be updated to become:
        <b class="ml-1" v-html="getUpdatedSignsWithSeparators()"
      /></v-row>

      <v-progress-linear class="mt-4" indeterminate v-if="formsLoading" />

      <v-row v-else-if="forms.length > 0" class="ma-0 mt-4">
        <span
          ><b class="mr-1" v-html="getUpdatedSignsWithSeparators()" />appears in
          the following lexical form(s). Select the appropriate form to link
          this occurrence to the dictionary. You may submit without selecting a
          lexical form, but please note that the word will not be properly
          connected.</span
        >
      </v-row>
      <v-row v-else class="ma-0 mt-4">
        <span
          ><b class="mr-1" v-html="getUpdatedSignsWithSeparators()" />does not
          appear in any forms. As such, it cannot be connected to the dictionary
          at this time.</span
        >
      </v-row>
      <div v-if="!formsLoading && forms.length > 0">
        <v-row class="ma-0 mt-4">
          <v-radio-group v-model="selectedOption">
            <v-radio
              v-for="option in forms"
              :key="option.spellingUuid"
              :value="option.spellingUuid"
            >
              <template #label>
                <b class="mr-1">{{ option.word }} - </b>
                <b class="mr-1">
                  <i>{{ option.form.form }}</i>
                </b>
                <grammar-display :form="option.form" :allowEditing="false" />
              </template>
            </v-radio>
          </v-radio-group>
        </v-row>
        <v-row class="ma-0">
          <v-btn
            v-if="forms.length > 0"
            @click="selectedOption = undefined"
            color="primary"
            :disabled="!selectedOption"
          >
            Disconnect
          </v-btn>
        </v-row>
      </div>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  PropType,
} from '@vue/composition-api';
import {
  EpigraphicSign,
  EpigraphicWord,
  RemoveSignPayload,
  EditTextAction,
  SearchSpellingResultRow,
} from '@oare/types';
import sl from '@/serviceLocator';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';

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
    GrammarDisplay,
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
      return newWordReading;
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
          spellingUuid: selectedOption.value || null,
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

    const forms = ref<SearchSpellingResultRow[]>([]);
    const selectedOption = ref<string>();
    const formsLoading = ref(false);

    onMounted(async () => {
      try {
        formsLoading.value = true;
        const searchString = getUpdatedSignsWithSeparators().replace(
          /<[^>]*>/g,
          ''
        );
        forms.value = await server.searchSpellings(searchString);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading spelling options. Please try again.',
          err as Error
        );
      } finally {
        formsLoading.value = false;
      }
    });

    return {
      getUpdatedSignsWithSeparators,
      removeSign,
      removeSignLoading,
      forms,
      selectedOption,
      formsLoading,
    };
  },
});
</script>
