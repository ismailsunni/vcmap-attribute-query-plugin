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
                :item-text="(item) => item.name"
                :item-value="
                  (item) => {
                    {
                      return { id: item.id, name: item.name, type: item.type };
                    }
                  }
                "
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
          <v-row justify="space-around">
            <v-col cols="6" md="4">
              <VcsFormButton @click="clearHightlight()">Clear</VcsFormButton>
            </v-col>
            <v-col cols="6">
              <VcsFormButton @click="startQuery()">Start Query</VcsFormButton>
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
  import { VectorStyleItem } from '@vcmap/core';
  import { inject, onMounted, ref, computed } from 'vue';

  import { name } from '../../package.json';

  function getLayerByClass(app, classNames) {
    const layers = [];
    [...app.layers].forEach((l) => {
      if (classNames.includes(l.className)) {
        layers.push(l.name);
      }
    });
    return layers;
  }

  async function getLayerByName(app, layerName) {
    const layer = app.layers.getByKey(layerName);
    await layer.fetchData();

    return layer;
  }

  async function getLayerAttributes(app, layerName) {
    // How to:
    // Guess the WFS layer from the WMS layer
    // Get the list of attributes and their type
    // https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/Canada/YourMapKey/?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=2.0.0&typeNames=ms:fires_snpp_7days&application/json

    return [
      { id: 1, name: `Attribute ${layerName} 1`, type: 'double' },
      { id: 2, name: `Attribute ${layerName} 2`, type: 'string' },
      { id: 3, name: `Attribute ${layerName} 3`, type: 'boolean' },
    ];
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
      const operator = {
        integer: ['=', '!=', '<', '<=', '>', '>='],
        boolean: ['=', '!='],
        string: ['LIKE', 'ILIKE'],
      };

      const object3Ds = ref([]);
      const wmsLayers = ref([]);
      const attributes = ref([]);

      const selectedObject3D = ref('');
      const selectedLayer = ref('');
      const selectedAttribute = ref(''); // TODO: Make it work with multiple attributes

      // Set the values from the app
      object3Ds.value = getLayerByClass(app, ['CesiumTilesetLayer']);
      wmsLayers.value = getLayerByClass(app, ['WMSLayer']);

      onMounted(() => {});

      async function selectedLayerChanged(layerName) {
        selectedLayer.value = layerName;
        selectedAttribute.value = '';
        attributes.value = await getLayerAttributes(app, layerName);
      }

      function selectedAttributeChanged(attribute) {
        selectedAttribute.value = attribute;
      }

      const highlightStyle = new VectorStyleItem({
        fill: { color: 'rgb(63,185,30)' },
      });

      function clearHightlight() {
        object3Ds.value.forEach((layerName) => {
          const object3DLayer = app.layers.getByKey(layerName);
          if (object3DLayer) {
            object3DLayer.featureVisibility.clearHighlighting();
          }
        });
      }

      function highlightObjects(layerName, objectIDs) {
        const object3DLayer = app.layers.getByKey(layerName);
        const hightlightParameters = {};
        objectIDs.forEach((x) => {
          hightlightParameters[x] = highlightStyle;
        });
        object3DLayer.featureVisibility.clearHighlighting();
        object3DLayer.featureVisibility.highlight(hightlightParameters);
      }

      function startQuery() {
        // Build query to the WFS server with attribute filtering based on the operator and the criteria

        const selectedObjectIDs = [22328, 26610];
        highlightObjects('roof3d', selectedObjectIDs);
      }

      const availableOperators = computed(() => {
        const selectedType = selectedAttribute.value.type;
        if (['number', 'double', 'integer'].includes(selectedType)) {
          return operator.integer;
        } else if (selectedType === 'string') {
          return operator.string;
        } else if (selectedType === 'boolean') {
          return operator.boolean;
        } else {
          return [];
        }
      });

      return {
        state,
        operator,
        startQuery,
        clearHightlight,
        selectedLayerChanged,
        selectedAttributeChanged,
        object3Ds,
        layers: wmsLayers,
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
