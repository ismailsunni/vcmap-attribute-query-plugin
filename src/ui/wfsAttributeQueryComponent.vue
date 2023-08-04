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
            <v-col cols="6">
              <VcsFormButton @click="clearHightlight()">Clear</VcsFormButton>
            </v-col>
            <v-col cols="6">
              <VcsFormButton @click="startQuery()">Highlight</VcsFormButton>
            </v-col>
          </v-row>
          <v-row justify="space-around">
            <v-col cols="6">
              <VcsFormButton @click="downloadJSON()">Download</VcsFormButton>
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
    NotificationType,
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

  function buildURL(baseUrl, params) {
    const url = new URL(baseUrl);

    Object.keys(params).forEach((key) => {
      url.searchParams.append(key, params[key]);
    });

    return url;
  }

  async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  }

  async function getLayerAttributes(app, wmsLayer) {
    // How to:
    // Guess the WFS layer from the WMS layer
    // Get the list of attributes and their type
    // https://public.sig.rennesmetropole.fr/geoserver/ows?SERVICE=WFS&REQUEST=DescribeFeatureType&typeNames=cli_climat:photovoltaïque_potentiel_classif_2021&outputFormat=application/json

    const attributes = [];
    try {
      const url = buildURL(wmsLayer.url, {
        SERVICE: 'WFS',
        REQUEST: 'DescribeFeatureType',
        typeNames: wmsLayer.layers, // Assume only 1 layer
        outputFormat: 'application/json',
      });

      const jsonResponse = await fetchData(url);
      jsonResponse.featureTypes[0].properties.forEach((p) => {
        attributes.push({
          name: p.name,
          type: p.localType,
        });
      });

      return attributes;
    } catch (error) {
      app.notifier.add({
        type: NotificationType.ERROR,
        message: `Failed to get the attribute list from layer: ${wmsLayer.name}`,
      });
      return attributes;
    }
  }

  function buildQuery(wmsLayer, attribute, operator, criteria) {
    console.log(
      `query params: ${JSON.stringify(wmsLayer)}, ${JSON.stringify(
        attribute,
      )}, ${operator}, ${criteria}`,
    );
    // TODO: build query here based on the selected options
    // https://public.sig.rennesmetropole.fr/geoserver/ows?SERVICE=WFS&REQUEST=getFeature&typeName=cli_climat:photovoltaïque_potentiel_classif_2021&outputFormat=application/json&cql_filter=all_area>15000&PropertyName=surface_id
    const gmlIDAttribute = 'surface_id';
    const maxFeatures = 500;
    const url = `${wmsLayer.url}?SERVICE=WFS&REQUEST=getFeature&typeName=${wmsLayer.layers}&outputFormat=application/json&PropertyName=${gmlIDAttribute}&maxFeatures=${maxFeatures}&count=${maxFeatures}&cql_filter=${attribute.name}${operator}${criteria}&StartIndex=0`;
    return url;
  }

  async function runQuery(query) {
    // TODO: Implement on running the query to the WFS
    // It should return the list of gml id
    console.log(query);
    if (query === '') {
      // Fake result for now
      return {
        selectedGmlIds: [22328, 26610],
        totalFeatures: 100,
        numberMatched: 50,
        numberReturned: 2,
      };
    }

    // TODO: make it dynamic
    const gmlIDAttribute = 'surface_id';

    const response = await fetch(query);
    const jsonResponse = await response.json();
    const selectedGmlIds = [];
    jsonResponse.features.forEach((f) => {
      selectedGmlIds.push(f.properties[gmlIDAttribute]);
    });
    return {
      selectedGmlIds,
      totalFeatures: jsonResponse.totalFeatures,
      numberMatched: jsonResponse.numberMatched,
      numberReturned: jsonResponse.numberReturned,
    };
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
        console.log(objectIDs);
        const object3DLayer = app.layers.getByKey(layerName);
        const hightlightParameters = {};
        objectIDs.forEach((x) => {
          hightlightParameters[x] = highlightStyle;
        });
        object3DLayer.featureVisibility.clearHighlighting();
        object3DLayer.featureVisibility.highlight(hightlightParameters);
      }

      async function startQuery() {
        const query = buildQuery(
          selectedWMSLayer.value,
          selectedAttribute.value,
          selectedOperator.value,
          selectedCriteria.value,
        );
        const queryResult = await runQuery(query);
        if (selectedObject3D.value.name === undefined) {
          app.notifier.add({
            type: NotificationType.ERROR,
            message: 'Please select 3D object first',
          });
        } else {
          app.notifier.add({
            type: NotificationType.SUCCESS,
            message: `Highlight ${queryResult.numberReturned} of ${queryResult.numberMatched} matched features`,
          });
          highlightObjects(
            selectedObject3D.value.name,
            queryResult.selectedGmlIds,
          );
        }
      }

      function downloadJSON() {
        // Create a JSON object
        const data = { no: 1, name: 'Sunni', country: 'Indonesia' };
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });

        const virtualLink = document.createElement('a');
        virtualLink.href = URL.createObjectURL(blob);
        virtualLink.download = 'data.json';
        virtualLink.style.display = 'none';
        document.body.appendChild(virtualLink);
        virtualLink.click();
        URL.revokeObjectURL(virtualLink.href);
        document.body.removeChild(virtualLink);
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
        downloadJSON,
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
