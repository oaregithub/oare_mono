<template>
  <div @click="$emit('selected')">
    <v-card height="77px" width="50px" outlined rounded color="info" hover>
      <v-container fluid>
        <div v-if="side !== 'legend'">
          <v-row>
            <v-spacer />
            <v-card
              height="7px"
              width="20px"
              rounded
              :color="side === 'u.e.' ? 'primary' : null"
              class="mt-1"
            />
            <v-spacer />
          </v-row>
          <v-row>
            <v-spacer />
            <v-card
              height="20px"
              width="7px"
              rounded
              :color="side === 'le.e.' ? 'primary' : null"
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="20px"
              width="20px"
              rounded
              :color="
                side === 'obv.' || side === 'mirror text'
                  ? getObverseColor()
                  : null
              "
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="20px"
              width="7px"
              rounded
              :color="side === 'r.e.' ? 'primary' : null"
              class="mt-1"
            />
            <v-spacer />
          </v-row>
          <v-row>
            <v-spacer />
            <v-card
              height="7px"
              width="20px"
              rounded
              :color="side === 'lo.e.' ? 'primary' : null"
              class="mt-1"
            />
            <v-spacer />
          </v-row>
          <v-row>
            <v-spacer />
            <v-card
              height="20px"
              width="7px"
              rounded
              flat
              color="transparent"
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="20px"
              width="20px"
              rounded
              :color="side === 'rev.' ? 'primary' : null"
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="20px"
              width="7px"
              rounded
              :color="side === 'suppl. tablet' ? 'primary' : 'transparent'"
              class="mt-1"
            />
            <v-spacer />
          </v-row>
        </div>
        <div v-else>
          <v-row>
            <v-spacer />
            <v-card
              height="66px"
              width="10px"
              rounded
              color="white"
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="66px"
              width="10px"
              rounded
              color="white"
              class="mt-1"
            />
            <v-spacer />
            <v-card
              height="66px"
              width="10px"
              rounded
              color="white"
              class="mt-1"
            />
            <v-spacer />
          </v-row>
        </div>
      </v-container>
    </v-card>
    <v-row justify="center" class="mt-1">
      {{ side }}
    </v-row>
  </div>
</template>

<script lang="ts">
import { EpigraphicUnitSide } from '@oare/types';
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
  props: {
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
  },
  setup(props) {
    const getObverseColor = () => {
      if (props.side === 'obv.') {
        return 'primary';
      } else if (props.side === 'mirror text') {
        return 'grey darken-1';
      }
    };
    return {
      getObverseColor,
    };
  },
});
</script>
