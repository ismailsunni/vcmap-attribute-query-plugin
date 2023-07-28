<template>
  <v-container class="px-1 py-1 main">
    <VcsFormSection heading="Query Options">
      <template #default>
        <v-container class="py-0 px-1">
          <v-row>
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                3D Object
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                :items="object3Ds"
                :item-text="(item) => item"
                placeholder="Please select a layer"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                Layer
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                @change="selectedLayerChanged"
                :items="layers"
                :item-text="(item) => item"
                placeholder="Please select a layer"
              />
            </v-col>
          </v-row>
          <v-row v-if="attributes.length > 0">
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                Attribute
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                @change="selectedAttributeChanged"
                :items="attributes"
                :item-text="(item) => item"
                placeholder="Please select the attribute"
              />
            </v-col>
          </v-row>
          <v-row v-if="selectedAttribute">
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                Filter
              </VcsLabel>
            </v-col>
            <v-col cols="3">
              <VcsSelect
                :items="availableOperators"
                :item-text="(item) => item"
              />
            </v-col>
            <v-col>
              <VcsTextField> </VcsTextField>
            </v-col>
          </v-row>
          <v-row justify="end">
            <v-col cols="6">
              <VcsFormButton @click="start_query()">Start Query</VcsFormButton>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
  </v-container>
</template>

<script>
  import {
    VContainer,
    VRow,
    VCol,
    // VDivider,
    //  VIcon
  } from 'vuetify/lib';
  import {
    VcsLabel,
    VcsSelect,
    // VcsRadioGrid,
    // VcsButton,
    // VcsDatePicker,
    VcsTextField,
    // VcsTooltip,
    // VcsSlider,
    VcsFormButton,
    VcsFormSection,
  } from '@vcmap/ui';
  import { inject, onMounted, ref, computed } from 'vue';

  import { name } from '../../package.json';

  function getVectorLayers(app) {
    const layers = [];
    [...app.layers].forEach((l) => {
      if (
        l.className === 'VectorLayer' ||
        l.className === 'WFSLayer' ||
        l.className === 'GeoJSONLayer'
      ) {
        layers.push({ value: l.name });
      }
    });
    return layers;
  }

  async function getLayerByName(app, layerName) {
    const layer = app.layers.getByKey(layerName);
    await layer.fetchData();

    return layer;
  }

  const fakeAttributes = {
    irradiance: ['Attribute 1', 'Attribute 2', 'Attribute 3'],
    quartier: ['Attribute A', 'Attribute B', 'Attribute C'],
  };

  async function getLayerAttributes(app, layerName) {
    // const layer = await getLayerByName(app, layerName);
    // const feature = layer.getFeatures()[0];
    // const attributes = Object.keys(feature.getProperties());
    // return attributes
    return fakeAttributes[layerName.toLowerCase()];
  }

  export default {
    name: 'WFSAttributeQuery',
    components: {
      VContainer,
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VRow,
      VCol,
      VcsFormButton,
      // VcsRadioGrid,
      // VcsButton,
      // VcsDatePicker,
      // VDivider,
      VcsTextField,
      // VcsTooltip,
      // VIcon,
      // VcsSlider,
    },

    setup() {
      const app = inject('vcsApp');
      const { state } = app.plugins.getByKey(name);
      state.layers = getVectorLayers(app);
      const operator = {
        integer: ['=', '!=', '<', '<=', '>', '>='],
        boolean: ['=', '!='],
        string: ['LIKE', 'ILIKE'],
      };

      // Fake values until we got the WFS working
      const object3Ds = ref(['Buildings', 'Roof']);
      const layers = ref(['Irradiance', 'Quartier']);
      const attributes = ref([]);

      const selectedObject3D = ref('');
      const selectedLayer = ref('');
      const selectedAttribute = ref(''); // TODO: Make it work with multiple attributes

      onMounted(() => {});

      async function selectedLayerChanged(layerName) {
        selectedLayer.value = layerName;
        selectedAttribute.value = '';
        // attributes.value = await getLayerAttributes(app, layerName);
        attributes.value = await getLayerAttributes(app, layerName);
      }

      function selectedAttributeChanged(attributeName) {
        selectedAttribute.value = attributeName;
      }

      const availableOperators = computed(() => {
        if (typeof selectedAttribute.value === 'number') {
          return operator.integer;
        } else if (typeof selectedAttribute.value === 'string') {
          return operator.string;
        } else if (typeof selectedAttribute.value === 'boolean') {
          return operator.boolean;
        } else {
          return [];
        }
      });

      return {
        state,
        operator,
        start_query() {
          // no-eslint
          // console.log('test');
        },
        selectedLayerChanged,
        selectedAttributeChanged,
        object3Ds,
        layers,
        attributes,
        selectedObject3D,
        selectedLayer,
        selectedAttribute,
        availableOperators,
      };
    },
  };
</script>

<style scoped></style>
