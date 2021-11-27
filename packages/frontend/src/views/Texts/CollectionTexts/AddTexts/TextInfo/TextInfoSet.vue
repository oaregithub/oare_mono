<template>
  <OareContentView title="Add Text Info">
    <v-col cols="8" class="pa-0">
      <h3 class="mb-2 d-inline">Text</h3>
      <v-menu offset-y open-on-hover top>
        <template #activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
            mdi-information-outline
          </v-icon>
        </template>
        <v-card class="pa-3">
          <span
            >Normally the name is a combination of publication and excavation
            information. If either or both of these is entered below, then
            leaving the field empty will result in the excavation info followed
            by the publication info in parens (i.e., 94/k 1001 (AKT 6a 26) if it
            is from the principal excavations at Kültepe. In other cases, it
            will be publication info first. If only publication or excavation is
            entered, then the entered information is used solely. If neither is
            available or appropriate, such as an unpublished tablet from a
            private collection, then the museum/collection info will be used.
            Only enter something here is none of these is currently
            available.</span
          >
        </v-card>
      </v-menu>
      <v-text-field
        v-model="textName"
        outlined
        label="Text Name"
        placeholder="e.g. Kt 94/k 584b (AKT 6a 267), etc."
        :rules="textNameRules"
        autofocus
        class="test-text-name"
      />
      <v-row class="pl-3">
        <h3 class="mt-1 mb-2 d-inline">Excavation</h3>
        <v-menu offset-y open-on-hover top>
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3">
            <span>
              <ul>
                <li>
                  <b>Excavation Prefix:</b> Use accepted abbreviated
                  designation. Leave blank if tablet excavated illicitly or in
                  uncontrolled excavation.
                </li>
                <li>
                  <b>Excavation Number:</b> Include dashes if a standard part of
                  the numbering system. Trailing letters should generally be
                  input as lowercase.
                </li>
              </ul>
            </span>
          </v-card>
        </v-menu>
      </v-row>
      <v-row class="px-3">
        <v-col cols="6" class="pa-0 pr-1">
          <v-text-field
            v-model="excavationPrefix"
            outlined
            label="Excavation Prefix"
            placeholder="e.g. Kt 91/k, Ac.i., etc."
          />
        </v-col>
        <v-col cols="6" class="pa-0 pl-1">
          <v-text-field
            v-model="excavationNumber"
            outlined
            label="Excavation Number"
            placeholder="e.g. 435, 1023, 22b, etc."
          />
        </v-col>
      </v-row>
      <v-row class="pl-3">
        <h3 class="mt-1 mb-2 d-inline">Museum</h3>
        <v-menu offset-y open-on-hover top>
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3">
            <span>
              <ul>
                <li>
                  <b>Museum Prefix:</b> Use accepted abbreviated designation. If
                  part of a private collection, enter last name or other
                  accepted designation in publications.
                </li>
                <li>
                  <b>Museum Number:</b> Include dashes if a standard part of the
                  numbering system. Trailing letters should generally be input
                  as lowercase.
                </li>
              </ul>
            </span>
          </v-card>
        </v-menu>
      </v-row>
      <v-row class="px-3">
        <v-col cols="6" class="pa-0 pr-1">
          <v-text-field
            v-model="museumPrefix"
            outlined
            label="Museum Prefix"
            placeholder="e.g. AMM. A. BM. Hahn, etc."
          />
        </v-col>
        <v-col cols="6" class="pa-0 pl-1">
          <v-text-field
            v-model="museumNumber"
            outlined
            label="Museum Number"
            placeholder="e.g. 113275, 113-890-71, etc."
          />
        </v-col>
      </v-row>
      <v-row class="pl-3">
        <h3 class="mt-1 mb-2 d-inline">Publication</h3>
        <v-menu offset-y open-on-hover top>
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3">
            <span>
              <ul>
                <li>
                  <b>Publication Prefix:</b> Use accepted abbreviated
                  designation. (Full bibliographic information added in the
                  properties below.)
                </li>
                <li>
                  <b>Publication Number:</b> Include dashes if a standard part
                  of the numbering system. Trailing letters should generally be
                  input as lowercase.
                </li>
              </ul>
            </span>
          </v-card>
        </v-menu>
      </v-row>
      <v-row class="px-3">
        <v-col cols="6" class="pa-0 pr-1">
          <v-text-field
            v-model="publicationPrefix"
            outlined
            label="Publication Prefix"
            placeholder="e.g. AKT 7a, JCS 14, etc."
          />
        </v-col>
        <v-col cols="6" class="pa-0 pl-1">
          <v-text-field
            v-model="publicationNumber"
            outlined
            label="Publication Number"
            placeholder="e.g. 1a, p. 45, etc."
          />
        </v-col>
      </v-row>
      <v-row class="pl-3">
        <h3 class="mt-2 mb-2 d-inline">CDLI Number</h3>
        <v-menu offset-y open-on-hover top>
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3">
            <span>
              <ul>
                <li><b>CDLI Number:</b> Include P at beginning of number</li>
              </ul>
            </span>
          </v-card>
        </v-menu>
      </v-row>
      <v-row class="px-3">
        <v-col cols="6" class="pa-0 pr-1">
          <v-text-field
            v-model="cdliNum"
            outlined
            label="CDLI Number"
            placeholder="e.g. P361444"
          />
        </v-col>
      </v-row>
      <v-row class="pl-3">
        <h3 class="mt-1 mb-2 d-inline">Additional Properties</h3>
      </v-row>
      <v-row class="px-3 pb-4">
        <span v-if="properties.length === 0"
          >No additional properties selected</span
        >
        <v-chip
          v-else
          v-for="(property, idx) in properties"
          :key="idx"
          class="my-1 mr-2"
          color="info"
          outlined
          :title="propertyText(property)"
          >{{ propertyText(property) }}
        </v-chip>
      </v-row>
      <v-row class="px-3 mb-6">
        <v-btn @click="selectPropertiesDialog = true" color="primary">
          Select Additional Properties
        </v-btn>
      </v-row>
      <oare-dialog
        v-model="selectPropertiesDialog"
        title="Additional Text Properties"
        :width="1000"
        :submitDisabled="!formComplete"
        submitText="OK"
        closeOnSubmit
        :showCancel="false"
        eager
      >
        <add-properties
          valueUuid="1e2e001d-73bd-b883-de04-9b33cd1dbcd2"
          @export-properties="setProperties($event)"
          @form-complete="formComplete = $event"
        />
      </oare-dialog>
    </v-col>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  ComputedRef,
} from '@vue/composition-api';
import AddProperties from '@/components/Properties/AddProperties.vue';
import { ParseTreeProperty, AddTextInfo } from '@oare/types';

export default defineComponent({
  components: {
    AddProperties,
  },
  setup(_, { emit }) {
    const textName = ref('');
    const cdliNum = ref('');
    const excavationPrefix = ref('');
    const excavationNumber = ref('');
    const museumPrefix = ref('');
    const museumNumber = ref('');
    const publicationPrefix = ref('');
    const publicationNumber = ref('');

    const selectPropertiesDialog = ref(false);
    const formComplete = ref(false);

    const properties = ref<ParseTreeProperty[]>([]);

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const clearProperties = () => {
      properties.value = [];
    };

    const propertyText = (property: ParseTreeProperty) => {
      return `${property.variable.variableName} - ${property.value.valueName}`;
    };

    const textInfo: ComputedRef<AddTextInfo> = computed(() => ({
      name: textName.value,
      type: '',
      uuid: '',
      cdliNum: cdliNum.value,
      excavationPrefix: excavationPrefix.value,
      excavationNumber: excavationNumber.value,
      museumPrefix: museumPrefix.value,
      museumNumber: museumNumber.value,
      publicationPrefix: publicationPrefix.value,
      publicationNumber: publicationNumber.value,
      properties: properties.value,
    }));

    watch(textInfo, () => emit('update-text-info', textInfo.value), {
      deep: true,
    });

    const stepComplete = computed(() => {
      return textName.value !== '';
    });

    watch(stepComplete, () => emit('step-complete', stepComplete.value));

    const textNameRules = [
      (input: string) => {
        if (input === '') {
          return 'Required';
        }
        return true;
      },
    ];

    return {
      textName,
      cdliNum,
      excavationPrefix,
      excavationNumber,
      museumPrefix,
      museumNumber,
      publicationPrefix,
      publicationNumber,
      selectPropertiesDialog,
      formComplete,
      properties,
      setProperties,
      clearProperties,
      propertyText,
      textInfo,
      textNameRules,
    };
  },
});
</script>
