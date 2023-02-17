<template>
  <div>
    <div>
      <v-checkbox v-model="damage" hide-details>
        <template #label>Damage</template>
      </v-checkbox>
      <v-row v-if="damage" justify="center" class="ma-0">
        <v-col cols="6" class="px-0">
          <v-autocomplete
            outlined
            dense
            hide-details
            class="mt-n1 mb-n4 mr-2"
            v-model="damageStartChar"
            :items="damageStartCharOptions"
            label="Start Character"
            clearable
            :disabled="damageStartCharOptions.length === 0"
          />
        </v-col>
        <v-col cols="6" class="px-0">
          <v-autocomplete
            outlined
            dense
            hide-details
            class="mt-n1 mb-n4"
            v-model="damageEndChar"
            :items="damageEndCharOptions"
            label="End Character"
            clearable
            :disabled="damageEndCharOptions.length === 0"
          />
        </v-col>
      </v-row>
    </div>
    <div>
      <v-checkbox v-model="partialDamage" hide-details>
        <template #label>Partial Damage</template>
      </v-checkbox>
      <v-row v-if="partialDamage" justify="center" class="ma-0">
        <v-col cols="6" class="px-0">
          <v-autocomplete
            outlined
            dense
            hide-details
            class="mt-n1 mb-n4 mr-2"
            v-model="partialDamageStartChar"
            :items="partialDamageStartCharOptions"
            label="Start Character"
            clearable
            :disabled="partialDamageStartCharOptions.length === 0"
          />
        </v-col>
        <v-col cols="6" class="px-0">
          <v-autocomplete
            outlined
            dense
            hide-details
            class="mt-n1 mb-n4"
            v-model="partialDamageEndChar"
            :items="partialDamageEndCharOptions"
            label="End Character"
            clearable
            :disabled="partialDamageEndCharOptions.length === 0"
          />
        </v-col>
      </v-row>
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
import { MarkupUnit, EpigraphicSign, RowTypes } from '@oare/types';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';

export default defineComponent({
  props: {
    newSign: {
      type: Object as PropType<EpigraphicSign>,
      required: true,
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
    const damageStartChar = ref(
      props.existingMarkup.find(m => m.type === 'damage')?.startChar || null
    );
    const damageEndChar = ref(
      props.existingMarkup.find(m => m.type === 'damage')?.endChar || null
    );

    const partialDamage = ref(
      props.existingMarkup.map(m => m.type).includes('partialDamage')
    );
    const partialDamageStartChar = ref(
      props.existingMarkup.find(m => m.type === 'partialDamage')?.startChar ||
        null
    );
    const partialDamageEndChar = ref(
      props.existingMarkup.find(m => m.type === 'partialDamage')?.endChar ||
        null
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
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'damage',
          startChar: damageStartChar.value,
          endChar: damageEndChar.value,
          altReading: null,
          altReadingUuid: null,
          value: null,
        });
      }

      if (partialDamage.value) {
        markupUnits.push({
          referenceUuid: props.referenceUuid,
          type: 'partialDamage',
          startChar: partialDamageStartChar.value,
          endChar: partialDamageEndChar.value,
          altReading: null,
          altReadingUuid: null,
          value: null,
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
      const signLength =
        props.newSign.reading
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '').length || 0;

      const options: number[] = [];
      for (let i = 1; i < signLength; i++) {
        options.push(i);
      }
      if (damageEndChar.value) {
        return options.filter(option => option < damageEndChar.value!);
      }
      return options;
    });
    const partialDamageStartCharOptions = computed(() => {
      const signLength =
        props.newSign.reading
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '').length || 0;

      const options: number[] = [];
      for (let i = 1; i < signLength; i++) {
        options.push(i);
      }
      if (partialDamageEndChar.value) {
        return options.filter(option => option < partialDamageEndChar.value!);
      }
      return options;
    });
    const damageEndCharOptions = computed(() => {
      const signLength =
        props.newSign.reading
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '').length || 0;

      const options: number[] = [];
      for (let i = 1; i < signLength; i++) {
        options.push(i);
      }

      if (damageStartChar.value) {
        return options.filter(option => option > damageStartChar.value!);
      }
      return options;
    });
    const partialDamageEndCharOptions = computed(() => {
      const signLength =
        props.newSign.reading
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '').length || 0;

      const options: number[] = [];
      for (let i = 1; i < signLength; i++) {
        options.push(i);
      }

      if (partialDamageStartChar.value) {
        return options.filter(option => option > partialDamageStartChar.value!);
      }
      return options;
    });

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
      damageStartChar,
      damageEndChar,
      partialDamageStartChar,
      partialDamageEndChar,
      originalSignRow,
      alternateSignRow,
      damageStartCharOptions,
      partialDamageStartCharOptions,
      damageEndCharOptions,
      partialDamageEndCharOptions,
    };
  },
});
</script>