<template>
  <div>
    <div>
      <v-btn
        v-for="(lett, lettGroup) in publicationLetterGroups"
        class="mr-2 mb-4"
        :key="lettGroup"
        fab
        small
        color="primary"
        :to="`/publications/${encodedLetter(lettGroup)}`"
        >{{ lettGroup }}</v-btn
      >
    </div>
    <v-container>
      <v-row style="flex-wrap: nowrap">
        <v-col cols="10" class="flex-grow-0 flex-shrink-0">
          <v-expansion-panels popout>
            <v-expansion-panel
              v-for="publication in publications"
              :key="publication.prefix"
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
                    v-for="publicationText in publication.textNumbers"
                    :key="publicationText.publicationNumber"
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
        <v-col cols="2" class="flex-grow-0 flex-shrink-0">
          <v-switch
            style="position: fixed"
            v-model="nonPubInfo"
            :label="`Remove Non-Publication Info`"
          ></v-switch>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { PublicationResponse } from '@oare/types';
import { publicationLetterGroups } from './utils';

export default defineComponent({
  name: 'CollectionsList',
  props: {
    publications: {
      type: Array as PropType<PublicationResponse[]>,
      required: true,
    },
    nonPubInfo: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  setup() {
    return {
      publicationLetterGroups,
      encodedLetter: (letter: string) => encodeURIComponent(letter),
    };
  },
});
</script>
