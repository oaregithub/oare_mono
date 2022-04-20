<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="9">
          <v-expansion-panels popout>
            <v-expansion-panel
              v-for="(publication, idx) in publications"
              :key="idx"
            >
              <v-expansion-panel-header
                v-if="publication.textNumbers.length > 1"
                >{{ publication.prefix }} ({{ publication.textNumbers.length }}
                items)
              </v-expansion-panel-header>
              <v-expansion-panel-header v-else
                >{{ publication.prefix }} ({{ publication.textNumbers.length }}
                item)
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <div class="d-flex align-content-space-around flex-wrap">
                  <span
                    v-for="(publicationText, idx) in publication.textNumbers"
                    :key="idx"
                  >
                    <router-link
                      v-if="nonPubInfo"
                      class="pl-2 inline"
                      :to="`/epigraphies/${publicationText.textUuid}`"
                      >{{ publicationText.publicationNumber }}</router-link
                    >
                    <router-link
                      v-else
                      class="pl-2"
                      :to="`/epigraphies/${publicationText.textUuid}`"
                      >{{ publicationText.name }}</router-link
                    >
                  </span>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col cols="3">
          <v-switch
            style="position: fixed"
            class="ma-1"
            v-model="nonPubInfo"
            :label="`Remove Non-Publication Info`"
          ></v-switch>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { PublicationResponse } from '@oare/types';

export default defineComponent({
  name: 'CollectionsList',
  props: {
    publications: {
      type: Array as PropType<PublicationResponse[]>,
      required: true,
    },
  },
  setup() {
    const nonPubInfo = ref(false);
    return {
      nonPubInfo,
    };
  },
});
</script>
