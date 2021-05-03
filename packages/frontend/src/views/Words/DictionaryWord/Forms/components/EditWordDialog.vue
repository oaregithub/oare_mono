<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="2000"
    :persistent="false"
    :closeButton="true"
    :showSubmit="false"
    :showCancel="false"
  >
    <template #action-options v-if="allowDiscourseMode">
      <v-switch v-model="inDiscourseMode" label="Discourse Mode" class="mr-6" />
    </template>

    <insert-discourse-rows
      v-if="inDiscourseMode"
      v-model="value"
      :form="form"
      :spelling="spelling"
    />
    <spelling-dialog
      v-if="!inDiscourseMode"
      v-model="value"
      :form="form"
      :spelling="spelling"
    />
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from '@vue/composition-api';
import { DictionaryForm, FormSpelling } from '@oare/types';
import SpellingDialog from './SpellingDialog.vue';
import InsertDiscourseRows from './InsertDiscourseRows.vue';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'EditWordDialog',
  components: {
    SpellingDialog,
    InsertDiscourseRows,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    spelling: {
      type: Object as PropType<FormSpelling | null>,
      default: null,
    },
    allowDiscourseMode: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const inDiscourseMode = ref(false);
    const [discourseQueryParam, setDiscourse] = useQueryParam(
      'discourse',
      'false'
    );

    watch(inDiscourseMode, () => {
      setDiscourse(inDiscourseMode.value ? 'true' : 'false');
    });

    onMounted(async () => {
      inDiscourseMode.value = discourseQueryParam.value === 'true';
    });

    return {
      inDiscourseMode,
      SpellingDialog,
    };
  },
});
</script>
