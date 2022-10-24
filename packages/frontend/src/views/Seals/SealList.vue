<template>
  <OareContentView title="Seals" :loading="loading">
    <v-row>
      <v-col cols="3">
        <div>
          <v-text-field
            v-model="search"
            placeholder="Filter Seals"
            clearable
            single-line
          >
          </v-text-field>
        </div>
      </v-col>
    </v-row>
    <div
      class="d-flex d-flex-row"
      v-for="(seal, idx) in filteredSeals"
      :key="idx"
    >
      <span class="align-self-center flex-shrink-0"
        ><router-link :to="`/seals/${seal.uuid}`">{{ seal.name }}</router-link>
        ({{ seal.count }})</span
      ><v-img
        class="flex-shrink-1"
        v-if="seal.imageLinks.length > 0"
        height="80px"
        max-width="300px"
        :src="seal.imageLinks[0]"
        contain
      ></v-img>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { SealInfo } from '@oare/types';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'SealsView',
  components: {},
  setup() {
    const loading = ref(false);
    const seals: Ref<SealInfo[]> = ref([]);
    const sortedSeals: Ref<SealInfo[]> = ref([]);
    const search = useQueryParam('filter', '', true);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const sortSeals = () => {
      sortedSeals.value = seals.value.sort((a, b) => {
        const aHasCS = a.name.includes('CS');
        const bHasCS = b.name.includes('CS');

        if (aHasCS && bHasCS) {
          const regex = /\d+$/;
          const aNum = Number(regex.exec(a.name));
          const bNum = Number(regex.exec(b.name));
          if (aNum && bNum) {
            return aNum - bNum;
          }
        }
        if (aHasCS && !bHasCS) {
          return -1;
        }
        if (!aHasCS && bHasCS) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const filteredSeals = computed(() =>
      sortedSeals.value.filter(seal =>
        seal.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())
      )
    );

    onMounted(async () => {
      loading.value = true;
      try {
        seals.value = await server.getAllSeals();
        sortSeals();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading seals. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      filteredSeals,
      search,
    };
  },
});
</script>
