<template>
  <OareContentView title="Seals" :loading="loading">
    <v-row>
      <v-col :cols="showRadioBtns ? 5 : 3">
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
    <div v-if="showRadioBtns">
      <v-row>
        <v-col cols="8">
          <v-card>
            <v-radio-group class="pa-3" v-model="selectedSeal" hide-details>
              <v-virtual-scroll
                bench="10"
                height="150"
                :items="filteredSeals"
                itemHeight="30"
              >
                <template v-slot:default="{ item }">
                  <v-radio
                    :key="item.uuid"
                    :value="item"
                    :class="`radio-${item.uuid} pl-3`"
                  >
                    <template #label>
                      <span
                        ><router-link :to="`/seals/${item.uuid}`">{{
                          item.name
                        }}</router-link>
                        ({{ item.count }})</span
                      >
                    </template></v-radio
                  >
                </template>
              </v-virtual-scroll>
            </v-radio-group>
          </v-card>
        </v-col>
        <v-col
          class="d-flex align-end flex-column"
          v-if="canConnectSealImpression && showConnectSeal"
          cols="4"
        >
          <v-btn
            color="primary"
            class="test-connect-seal mt-auto"
            :disabled="!selectedSeal"
            @click="confirmConnectDialog = true"
          >
            Connect Seal
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else>
      <div v-for="(seal, idx) in filteredSeals" :key="idx">
        <div>
          <span
            ><router-link :to="`/seals/${seal.uuid}`">{{
              seal.name
            }}</router-link>
            ({{ seal.count }})</span
          >
        </div>
        <div v-if="!hideImages" class="ml-5 test-image">
          <v-img
            position="center left"
            v-if="seal.imageLinks.length > 0"
            max-height="80px"
            max-width="300px"
            :src="seal.imageLinks[0]"
            contain
          ></v-img>
        </div>
      </div>
    </div>
    <oare-dialog
      v-if="selectedSeal"
      v-model="confirmConnectDialog"
      title="Confirm Seal Connection"
      submitText="Yes"
      cancelText="Cancel"
      @submit="connectSeal"
      closeOnSubmit
    >
      Are you sure you want to connect {{ selectedSeal.name }} to this seal
      impression?
    </oare-dialog>
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
  props: {
    showRadioBtns: {
      type: Boolean,
      default: false,
    },
    hideImages: {
      type: Boolean,
      default: false,
    },
    textEpigraphyUuid: {
      type: String,
    },
    showConnectSeal: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const loading = ref(false);
    const seals: Ref<SealInfo[]> = ref([]);
    const sortedSeals: Ref<SealInfo[]> = ref([]);
    const search = useQueryParam('filter', '', true);
    const selectedSeal: Ref<SealInfo | null> = ref(null);
    const confirmConnectDialog: Ref<Boolean> = ref(false);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const canConnectSealImpression = computed(() =>
      store.hasPermission('ADD_SEAL_LINK')
    );

    const connectSeal = async () => {
      try {
        if (
          selectedSeal.value &&
          selectedSeal.value.uuid &&
          props.textEpigraphyUuid
        ) {
          await server.addSealLink({
            sealUuid: selectedSeal.value.uuid,
            textEpigraphyUuid: props.textEpigraphyUuid,
          });
          actions.showSnackbar(
            'Successfully connected seal to seal impression'
          );
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Unable to connect seal to seal impression',
          err as Error
        );
      } finally {
        emit('finish');
      }
    };

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
      selectedSeal,
      canConnectSealImpression,
      confirmConnectDialog,
      connectSeal,
    };
  },
});
</script>
<style>
.sticky {
  position: sticky;
  bottom: 0px;
}
</style>
