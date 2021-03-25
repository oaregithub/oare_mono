<template>
  <div v-if="renderer" class="mr-10">
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="side-name oare-title mr-4">
        {{ sideName }}
      </div>
      <div>
        <div
          v-for="lineNum in renderer.linesOnSide(sideName)"
          :key="lineNum"
          class="oare-title d-flex"
        >
          <sup class="line-num pt-3">{{ lineNumber(lineNum) }}&nbsp;</sup>
          <span
            v-if="renderer.isRegion(lineNum)"
            v-html="renderer.lineReading(lineNum)"
          />
          <span v-else>
            <span
              v-for="(word, index) in renderer.getLineWords(lineNum)"
              :key="index"
              v-html="word.reading"
              class="mr-1 cursor-display test-rendered-word"
              @click="openDialog(word.discourseUuid)"
            />
          </span>
        </div>
      </div>
    </div>

    <oare-dialog
      v-if="viewingDialog"
      class="test-rendering-word-dialog"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      :submitLoading="loading"
      :value="viewingDialog"
      :width="400"
      @input="viewingDialog = false"
    >
      <dictionary-word
        v-if="discourseWordInfo"
        :uuid="discourseWordInfo.uuid"
        :selected-word-info="discourseWordInfo"
        :allow-commenting="false"
        :allow-editing="false"
        :allow-deleting="false"
        :allow-breadcrumbs="false"
      >
      </dictionary-word>
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { createTabletRenderer } from '@oare/oare';
import { DictionaryWordResponse, EpigraphicUnit } from '@oare/types';
import sl from '@/serviceLocator';
import DictionaryWord from '@/views/Words/DictionaryWord/index.vue';

export default defineComponent({
  name: 'EpigraphyReading',
  components: {
    DictionaryWord,
  },
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
  },
  setup(props) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const viewingDialog = ref(false);
    const discourseWordInfo = ref<DictionaryWordResponse | null>(null);

    const renderer = computed(() => {
      return createTabletRenderer(props.epigraphicUnits, {
        admin: store.getters.isAdmin,
        textFormat: 'html',
      });
    });

    const lineNumber = (line: number): string =>
      renderer.value.isRegion(line) ? '' : `${line}.`;

    const openDialog = async (discourseUuid: string) => {
      try {
        loading.value = true;
        discourseWordInfo.value = await server.getDictionaryInfoByDiscourseUuid(
          discourseUuid
        );
        if (discourseWordInfo.value) {
          viewingDialog.value = true;
        } else {
          actions.showSnackbar(
            'No information exists for this text discourse word'
          );
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve text discourse word info'
        );
      } finally {
        loading.value = false;
      }
    };

    return {
      renderer,
      lineNumber,
      openDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
    };
  },
});
</script>

<style scoped>
.line-num {
  width: 25px;
}

.side-name {
  width: 50px;
}

.cursor-display {
  cursor: pointer;
}
</style>
