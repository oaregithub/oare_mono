<template>
  <div>
    <div>
      <v-checkbox v-model="damage" hide-details>
        <template #label>Damage</template>
      </v-checkbox>
      <div v-if="damage && signLength > 1">
        <v-row
          v-for="(char, index) in damageChars"
          :key="index"
          justify="center"
          class="ma-0"
        >
          <v-col cols="5" class="px-0">
            <v-autocomplete
              outlined
              dense
              hide-details
              class="mt-n1 mb-n4 mr-2"
              v-model="char.startChar"
              :items="damageStartCharOptions[index]"
              label="Start Character"
              clearable
              :disabled="damageStartCharOptions[index].length === 0"
            />
          </v-col>
          <v-col cols="5" class="px-0">
            <v-autocomplete
              outlined
              dense
              hide-details
              class="mt-n1 mb-n4"
              v-model="char.endChar"
              :items="damageEndCharOptions[index]"
              label="End Character"
              clearable
              :disabled="damageEndCharOptions[index].length === 0"
            />
          </v-col>
          <v-col cols="1">
            <v-btn
              @click="removeDamage(index)"
              icon
              small
              color="red"
              class="ma-1"
            >
              <v-icon small color="red">mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row justify="center" class="ma-0 mt-2">
          <v-btn color="info" text @click="addDamage">
            <v-icon small class="mr-1">mdi-plus</v-icon>Add More Damage</v-btn
          >
        </v-row>
      </div>
    </div>
    <div>
      <v-checkbox v-model="partialDamage" hide-details>
        <template #label>Partial Damage</template>
      </v-checkbox>
      <div v-if="partialDamage && signLength > 1">
        <v-row
          v-for="(char, index) in partialDamageChars"
          :key="index"
          justify="center"
          class="ma-0"
        >
          <v-col cols="5" class="px-0">
            <v-autocomplete
              outlined
              dense
              hide-details
              class="mt-n1 mb-n4 mr-2"
              v-model="char.startChar"
              :items="partialDamageStartCharOptions[index]"
              label="Start Character"
              clearable
              :disabled="partialDamageStartCharOptions[index].length === 0"
            />
          </v-col>
          <v-col cols="5" class="px-0">
            <v-autocomplete
              outlined
              dense
              hide-details
              class="mt-n1 mb-n4"
              v-model="char.endChar"
              :items="partialDamageEndCharOptions[index]"
              label="End Character"
              clearable
              :disabled="partialDamageEndCharOptions[index].length === 0"
            />
          </v-col>
          <v-col cols="1">
            <v-btn
              @click="removePartialDamage(index)"
              icon
              small
              color="red"
              class="ma-1"
            >
              <v-icon small color="red">mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row justify="center" class="ma-0 mt-2">
          <v-btn color="info" text @click="addPartialDamage">
            <v-icon small class="mr-1">mdi-plus</v-icon>Add More Partial
            Damage</v-btn
          >
        </v-row>
      </div>
    </div>
    <v-checkbox v-model="superfluous" hide-details>
      <template #label>Superfluous</template>
    </v-checkbox>
    <v-checkbox v-model="omitted" hide-details>
      <template #label>Omitted</template>
    </v-checkbox>
    <v-checkbox v-model="erasure" hide-details>
      <template #label>Erasure</template>
    </v-checkbox>
    <v-checkbox v-model="uninterpreted" hide-details>
      <template #label>Uninterpreted</template>
    </v-checkbox>
    <v-checkbox v-model="phoneticComplement" hide-details>
      <template #label>Phonetic Complement</template>
    </v-checkbox>
    <v-checkbox v-model="writtenOverErasure" hide-details>
      <template #label>Written Over Erasure</template>
    </v-checkbox>

    <div>
      <v-checkbox v-model="uncertain" hide-details>
        <template #label> Uncertain </template>
      </v-checkbox>
      <v-row v-if="uncertain" justify="center" class="ma-0 mt-2">
        Optional: Alternate Sign
      </v-row>
      <v-row v-if="uncertain" justify="center" class="ma-0">
        <row
          class="mt-2 mx-n10"
          :autofocus="true"
          :isCurrentRow="true"
          :row="alternateSignRow"
          :showDeleteButton="false"
          :outlined="true"
          @update-row-content="alternateSignRow = $event"
          :restrictToSign="true"
        />
      </v-row>
    </div>
    <v-checkbox
      v-model="writtenBelowTheLine"
      hide-details
      :disabled="writtenAboveTheLine"
    >
      <template #label>Written Below the Line</template>
    </v-checkbox>
    <v-checkbox
      v-model="writtenAboveTheLine"
      hide-details
      :disabled="writtenBelowTheLine"
    >
      <template #label>Written Above the Line</template>
    </v-checkbox>

    <div>
      <v-checkbox v-model="emended" hide-details :disabled="collated">
        <template #label> Emended Reading </template>
      </v-checkbox>
      <v-row v-if="emended" justify="center" class="ma-0 mt-2">
        Optional: Original Sign
      </v-row>
      <v-row v-if="emended" justify="center" class="ma-0">
        <row
          class="mt-2 mx-n10"
          :autofocus="true"
          :isCurrentRow="true"
          :row="originalSignRow"
          :showDeleteButton="false"
          :outlined="true"
          @update-row-content="originalSignRow = $event"
          :restrictToSign="true"
        />
      </v-row>
    </div>

    <div>
      <v-checkbox v-model="collated" hide-details :disabled="emended">
        <template #label> Collated Reading </template>
      </v-checkbox>
      <v-row v-if="collated" justify="center" class="ma-0 mt-2">
        Optional: Original Sign
      </v-row>
      <v-row v-if="collated" justify="center" class="ma-0">
        <row
          class="mt-2 mx-n10"
          :autofocus="true"
          :isCurrentRow="true"
          :row="originalSignRow"
          :showDeleteButton="false"
          :outlined="true"
          @update-row-content="originalSignRow = $event"
          :restrictToSign="true"
        />
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  ComputedRef,
  watch,
} from '@vue/composition-api';
import { MarkupUnit, RowTypes } from '@oare/types';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';

interface StartEndChar {
  startChar: number | null;
  endChar: number | null;
}

export default defineComponent({
  props: {
    newSign: {
      type: String,
      required: false,
    },
    existingMarkup: {
      type: Array as PropType<MarkupUnit[]>,
      required: true,
    },
    referenceUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    Row,
  },
  setup(props, { emit }) {
    const damage = ref(
      props.existingMarkup.map(m => m.type).includes('damage')
    );

    const damageChars = ref<StartEndChar[]>(
      props.existingMarkup
        .filter(m => m.type === 'damage')
        .map(m => ({ startChar: m.startChar, endChar: m.endChar }))
        .sort((a, b) => {
          if (a.startChar === null) {
            return -1;
          }
          if (b.startChar === null) {
            return 1;
          }
          return a.startChar - b.startChar;
        })
    );

    const partialDamage = ref(
      props.existingMarkup.map(m => m.type).includes('partialDamage')
    );

    const partialDamageChars = ref<StartEndChar[]>(
      props.existingMarkup
        .filter(m => m.type === 'partialDamage')
        .map(m => ({ startChar: m.startChar, endChar: m.endChar }))
        .sort((a, b) => {
          if (a.startChar === null) {
            return -1;
          }
          if (b.startChar === null) {
            return 1;
          }
          return a.startChar - b.startChar;
        })
    );

    const superfluous = ref(
      props.existingMarkup.map(m => m.type).includes('superfluous')
    );
    const omitted = ref(
      props.existingMarkup.map(m => m.type).includes('omitted')
    );
    const erasure = ref(
      props.existingMarkup.map(m => m.type).includes('erasure')
    );
    const uninterpreted = ref(
      props.existingMarkup.map(m => m.type).includes('isUninterpreted')
    );
    const phoneticComplement = ref(
      props.existingMarkup.map(m => m.type).includes('phoneticComplement')
    );
    const writtenOverErasure = ref(
      props.existingMarkup.map(m => m.type).includes('isWrittenOverErasure')
    );
    const uncertain = ref(
      props.existingMarkup.map(m => m.type).includes('uncertain')
    );
    const writtenBelowTheLine = ref(
      props.existingMarkup.map(m => m.type).includes('isWrittenBelowTheLine')
    );
    const writtenAboveTheLine = ref(
      props.existingMarkup.map(m => m.type).includes('isWrittenAboveTheLine')
    );
    const emended = ref(
      props.existingMarkup.map(m => m.type).includes('isEmendedReading')
    );
    const collated = ref(
      props.existingMarkup.map(m => m.type).includes('isCollatedReading')
    );

    const originalSignRow = ref<RowWithLine>({
      type: 'Line' as RowTypes,
      uuid: '',
      isEditing: false,
      hasErrors: false,
      text: props.existingMarkup.map(m => m.type).includes('originalSign')
        ? props.existingMarkup.find(m => m.type === 'originalSign')
            ?.altReading || undefined
        : undefined,
      line: 0,
    });
    const alternateSignRow = ref<RowWithLine>({
      type: 'Line' as RowTypes,
      uuid: '',
      isEditing: false,
      hasErrors: false,
      text: props.existingMarkup.map(m => m.type).includes('alternateSign')
        ? props.existingMarkup.find(m => m.type === 'alternateSign')
            ?.altReading || undefined
        : undefined,
      line: 0,
    });

    const markupUnits: ComputedRef<MarkupUnit[]> = computed(() => {
      const markupUnits: MarkupUnit[] = [];

      if (damage.value) {
        damageChars.value.forEach(damageChar => {
          markupUnits.push({
            referenceUuid: props.referenceUuid,
            type: 'damage',
            startChar: damageChar.startChar,
            endChar: damageChar.endChar,
            altReading: null,
            altReadingUuid: null,
            value: null,
          });
        });
      }

      if (partialDamage.value) {
        partialDamageChars.value.forEach(partialDamageChar => {
          markupUnits.push({
            referenceUuid: props.referenceUuid,
            type: 'partialDamage',
            startChar: partialDamageChar.startChar,
            endChar: partialDamageChar.endChar,
            altReading: null,
            altReadingUuid: null,
            value: null,
          });
        });
      }

      if (superfluous.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'superfluous',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (omitted.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'omitted',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (erasure.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'erasure',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (uninterpreted.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isUninterpreted',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (phoneticComplement.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'phoneticComplement',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (writtenOverErasure.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isWrittenOverErasure',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (uncertain.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'uncertain',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });

        if (
          alternateSignRow.value.signs &&
          alternateSignRow.value.signs.length === 1
        ) {
          markupUnits.push({
            referenceUuid: props.referenceUuid,
            type: 'alternateSign',
            startChar: null,
            endChar: null,
            altReading: alternateSignRow.value.signs[0].reading || null,
            altReadingUuid: alternateSignRow.value.signs[0].readingUuid,
            value: null,
          });
        }
      }

      if (writtenBelowTheLine.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isWrittenBelowTheLine',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (writtenAboveTheLine.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isWrittenAboveTheLine',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (emended.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isEmendedReading',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });

        if (
          originalSignRow.value.signs &&
          originalSignRow.value.signs.length === 1
        ) {
          markupUnits.push({
            referenceUuid: props.referenceUuid,
            type: 'originalSign',
            startChar: null,
            endChar: null,
            altReading: originalSignRow.value.signs[0].reading || null,
            altReadingUuid: originalSignRow.value.signs[0].readingUuid,
            value: null,
          });
        }
      }

      if (collated.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'isCollatedReading',
          startChar: null,
          endChar: null,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });

        if (
          originalSignRow.value.signs &&
          originalSignRow.value.signs.length === 1
        ) {
          markupUnits.push({
            referenceUuid: props.referenceUuid,
            type: 'originalSign',
            startChar: null,
            endChar: null,
            altReading: originalSignRow.value.signs[0].reading || null,
            altReadingUuid: originalSignRow.value.signs[0].readingUuid,
            value: null,
          });
        }
      }

      return markupUnits;
    });

    watch(markupUnits, () => emit('update-markup', markupUnits.value));

    const damageStartCharOptions = computed(() => {
      const optionArray: number[][] = [];

      damageChars.value.forEach(char => {
        let options: number[] = [];
        for (let i = 1; i < signLength.value; i++) {
          options.push(i);
        }
        if (char.endChar) {
          options = options.filter(option => option < char.endChar!);
        }
        optionArray.push(options);
      });

      return optionArray;
    });

    const partialDamageStartCharOptions = computed(() => {
      const optionArray: number[][] = [];

      partialDamageChars.value.forEach(char => {
        let options: number[] = [];
        for (let i = 1; i < signLength.value; i++) {
          options.push(i);
        }
        if (char.endChar) {
          options = options.filter(option => option < char.endChar!);
        }
        optionArray.push(options);
      });

      return optionArray;
    });

    const damageEndCharOptions = computed(() => {
      const optionArray: number[][] = [];

      damageChars.value.forEach(char => {
        let options: number[] = [];
        for (let i = 1; i < signLength.value; i++) {
          options.push(i);
        }
        if (char.startChar) {
          options = options.filter(option => option > char.startChar!);
        }
        optionArray.push(options);
      });

      return optionArray;
    });

    const partialDamageEndCharOptions = computed(() => {
      const optionArray: number[][] = [];

      partialDamageChars.value.forEach(char => {
        let options: number[] = [];
        for (let i = 1; i < signLength.value; i++) {
          options.push(i);
        }
        if (char.startChar) {
          options = options.filter(option => option > char.startChar!);
        }
        optionArray.push(options);
      });

      return optionArray;
    });

    watch(damage, () => {
      if (damage.value) {
        damageChars.value.push({
          startChar: null,
          endChar: null,
        });
      } else {
        damageChars.value = [];
      }
    });

    watch(partialDamage, () => {
      if (partialDamage.value) {
        partialDamageChars.value.push({
          startChar: null,
          endChar: null,
        });
      } else {
        partialDamageChars.value = [];
      }
    });

    const addDamage = () => {
      damageChars.value.push({
        startChar: null,
        endChar: null,
      });
    };

    const removeDamage = (index: number) => {
      damageChars.value.splice(index, 1);
    };

    const addPartialDamage = () => {
      partialDamageChars.value.push({
        startChar: null,
        endChar: null,
      });
    };

    const removePartialDamage = (index: number) => {
      partialDamageChars.value.splice(index, 1);
    };

    const signLength = computed(
      () =>
        props.newSign
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '').length || 0
    );

    return {
      damage,
      partialDamage,
      superfluous,
      omitted,
      erasure,
      uninterpreted,
      phoneticComplement,
      writtenOverErasure,
      uncertain,
      writtenBelowTheLine,
      writtenAboveTheLine,
      emended,
      collated,
      originalSignRow,
      alternateSignRow,
      damageStartCharOptions,
      partialDamageStartCharOptions,
      damageEndCharOptions,
      partialDamageEndCharOptions,
      damageChars,
      addDamage,
      removeDamage,
      partialDamageChars,
      addPartialDamage,
      removePartialDamage,
      signLength,
    };
  },
});
</script>