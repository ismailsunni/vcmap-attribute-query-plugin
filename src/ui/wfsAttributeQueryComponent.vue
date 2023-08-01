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
                v-model="selectedObject3D"
                :items="object3Ds"
                :item-text="(item) => item.name"
                :item-value="
                  (item) => {
                    return {
                      name: item.name,
                      url: item.url,
                    };
                  }
                "
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
                v-model="selectedWMSLayer"
                :items="layers"
                :item-text="(item) => item.name"
                :item-value="
                  (item) => {
                    return {
                      name: item.name,
                      url: item.url,
                      layers: item.layers,
                    };
                  }
                "
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
                v-model="selectedAttribute"
                :items="attributes"
                :item-text="(item) => item.name"
                :item-value="
                  (item) => {
                    {
                      return { name: item.name, type: item.type };
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
                v-model="selectedOperator"
                :items="availableOperators"
                :item-text="(item) => item"
              />
            </v-col>
            <v-col>
              <VcsTextField v-model="selectedCriteria"> </VcsTextField>
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
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import {
    VcsLabel,
    VcsSelect,
    VcsTextField,
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
        if (l.className === 'WMSLayer') {
          layers.push({
            name: l.name,
            url: l.url,
            layers: l.parameters.LAYERS,
          });
        } else if (l.className === 'CesiumTilesetLayer') {
          layers.push({
            name: l.name,
            url: l.url,
          });
        } else {
          layers.push({
            name: l.name,
          });
        }
      }
    });
    return layers;
  }

  // async function getLayerByName(app, layerName) {
  //   const layer = app.layers.getByKey(layerName);
  //   await layer.fetchData();

  //   return layer;
  // }

  async function getLayerAttributes(app, wmsLayer) {
    // How to:
    // Guess the WFS layer from the WMS layer
    // Get the list of attributes and their type
    // https://public.sig.rennesmetropole.fr/geoserver/ows?SERVICE=WFS&REQUEST=DescribeFeatureType&typeNames=cli_climat:photovoltaïque_potentiel_classif_2021&outputFormat=application/json

    const url = `${wmsLayer.url}?SERVICE=WFS&REQUEST=DescribeFeatureType&typeNames=${wmsLayer.layers}&outputFormat=application/json`;
    const response = await fetch(url);
    const jsonResponse = await response.json();
    const attributes = [];
    jsonResponse.featureTypes[0].properties.forEach((p) => {
      attributes.push({
        name: p.name,
        type: p.localType,
      });
    });

    return attributes;
  }

  function buildQuery(wmsLayer, attribute, operator, criteria) {
    console.log(
      `query params: ${JSON.stringify(wmsLayer)}, ${JSON.stringify(
        attribute,
      )}, ${operator}, ${criteria}`,
    );
    // TODO: build query here based on the selected options
    return '';
  }

  function runQuery(query) {
    // TODO: Implement on running the query to the WFS
    // It should return the list of gml id
    if (query === '') {
      // Fake result for now
      return [22328, 26610];
    }
    return [];
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
      VcsTextField,
    },

    setup() {
      const app = inject('vcsApp');
      const { state } = app.plugins.getByKey(name);
      const operator = {
        number: ['=', '!=', '<', '<=', '>', '>='],
        boolean: ['=', '!='],
        string: ['LIKE', 'ILIKE'],
      };

      const object3Ds = ref([]);
      const wmsLayers = ref([]);
      const attributes = ref([]);

      const selectedObject3D = ref({});
      const selectedWMSLayer = ref({});

      // TODO: Make it work with multiple attributes, operator, and criteria
      const selectedAttribute = ref('');
      const selectedOperator = ref('');
      const selectedCriteria = ref('');

      // Set the values from the app
      object3Ds.value = getLayerByClass(app, ['CesiumTilesetLayer']);
      wmsLayers.value = getLayerByClass(app, ['WMSLayer']);

      onMounted(() => {});

      async function selectedLayerChanged(wmsLayer) {
        selectedAttribute.value = '';
        attributes.value = await getLayerAttributes(app, wmsLayer);
      }

      const highlightStyle = new VectorStyleItem({
        fill: { color: 'rgb(63,185,30)' },
      });

      function clearHightlight() {
        object3Ds.value.forEach((layer) => {
          const object3DLayer = app.layers.getByKey(layer.name);
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
        const query = buildQuery(
          selectedWMSLayer.value,
          selectedAttribute.value,
          selectedOperator.value,
          selectedCriteria.value,
        );
        const selectedObjectIDs = runQuery(query);
        if (selectedObject3D.value.name === undefined) {
          console.log('Please select 3D Object first');
        } else {
          highlightObjects(selectedObject3D.value.name, selectedObjectIDs);
        }
      }

      const availableOperators = computed(() => {
        // TODO: Make sure the type and the operator are available in WFS
        const selectedType = selectedAttribute.value.type;
        if (['number', 'double', 'integer', 'int'].includes(selectedType)) {
          return operator.number;
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
        object3Ds,
        layers: wmsLayers,
        attributes,
        selectedObject3D,
        selectedWMSLayer,
        selectedAttribute,
        selectedOperator,
        selectedCriteria,
        availableOperators,
      };
    },
  };
</script>

<style scoped></style>
