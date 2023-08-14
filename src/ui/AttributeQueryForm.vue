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
                placeholder="Please select a 3D layer"
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
                placeholder="Please select a WMS layer"
              />
            </v-col>
          </v-row>

          <v-row v-if="attributes.length > 0">
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                GML ID
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                v-model="selectedGMLIDAttribute"
                :items="attributes"
                :item-text="(item) => item.name"
                :item-value="
                  (item) => {
                    {
                      return { name: item.name, type: item.type };
                    }
                  }
                "
                placeholder="Attribute for GML ID"
              />
            </v-col>
          </v-row>
          <AttributeFilterItem
            v-if="attributes.length > 0"
            :attributes="attributes"
            @selectedAttribute="selectedAttributeChanged"
            @selectedOperator="selectedOperatorChanged"
            @selectedCriteria="selectedCriteriaChanged"
          ></AttributeFilterItem>

          <v-row justify="space-around">
            <v-col cols="6">
              <VcsFormButton @click="clearHightlight()">Clear</VcsFormButton>
            </v-col>
            <v-col cols="6">
              <VcsFormButton @click="highlightResult()"
                >Highlight</VcsFormButton
              >
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
  import { inject, onMounted, ref, computed } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import {
    VcsLabel,
    VcsSelect,
    // VcsTextField,
    VcsFormButton,
    VcsFormSection,
    NotificationType,
  } from '@vcmap/ui';
  import { VectorStyleItem } from '@vcmap/core';
  import AttributeFilterItem from './AttributeFilterItem.vue';
  import AttributeFilter from './attributeFilter.js';
  import Attribute from './attribute.js';

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

  function buildQueryURL(
    wmsLayer,
    gmlIDAttribute,
    featureCount,
    attribute,
    operator,
    criteria,
  ) {
    // https://public.sig.rennesmetropole.fr/geoserver/ows?SERVICE=WFS&REQUEST=getFeature&typeName=cli_climat:photovoltaïque_potentiel_classif_2021&outputFormat=application/json&cql_filter=all_area>15000&PropertyName=surface_id
    const params = {
      SERVICE: 'WFS',
      REQUEST: 'getFeature',
      typeName: wmsLayer.layers,
      outputFormat: 'application/json',
      PropertyName: gmlIDAttribute,
      cql_filter: `${attribute.name}${operator}${criteria}`,
      StartIndex: 0,
    };
    if (featureCount >= 0) {
      // Use both now for max features to avoid different WFS version
      params.maxFeatures = featureCount;
      params.count = featureCount;
    }
    const url = buildURL(wmsLayer.url, params);

    return url;
  }

  function parseQueryData(queryData, gmlIDAttribute) {
    const selectedGmlIds = [];
    queryData.features.forEach((f) => {
      selectedGmlIds.push(f.properties[gmlIDAttribute]);
    });
    return {
      selectedGmlIds,
      totalFeatures: queryData.totalFeatures,
      numberMatched: queryData.numberMatched,
      numberReturned: queryData.numberReturned,
    };
  }

  function parseQueryDataForDownload(queryData, gmlIDAttribute) {
    const features = [];
    queryData.features.forEach((f) => {
      const feature = f.properties;
      feature.gmlID = f.properties[gmlIDAttribute];
      features.push(feature);
    });
    return features;
  }

  export default {
    name: 'AttributeQueryForm',
    components: {
      VContainer,
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VRow,
      VCol,
      VcsFormButton,
      // VcsTextField,
      AttributeFilterItem,
    },
    methods: {
      selectedAttributeChanged(value) {
        console.log(`selected attribute from parent ${value.name}`);
        this.selectedAttribute = value;
        this.attributeFilter.attribute = value;
      },
      selectedOperatorChanged(value) {
        console.log(`selected operator from parent ${value}`);
        this.selectedOperator = value;
        this.attributeFilter.operator = value;
      },
      selectedCriteriaChanged(value) {
        console.log(`selected criteria from parent ${value}`);
        this.selectedCriteria = value;
        this.attributeFilter.value = value;
      },
      highlight3DObjects(app, layerName, objectIDs) {
        const highlightStyle = new VectorStyleItem({
          fill: { color: 'rgb(63,185,30)' },
        });

        const object3DLayer = app.layers.getByKey(layerName);
        const hightlightParameters = {};
        objectIDs.forEach((x) => {
          hightlightParameters[x] = highlightStyle;
        });
        console.log(this.attributeFilter.toCQL());
        object3DLayer.featureVisibility.clearHighlighting();
        object3DLayer.featureVisibility.highlight(hightlightParameters);
      },
    },
    data() {
      return {
        /**
         * @type {AttributeFilter|null}
         */
        attributeFilter: new AttributeFilter(new Attribute('', ''), '', ''),
      };
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
      const selectedGMLIDAttribute = ref({});

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

      function clearHightlight() {
        object3Ds.value.forEach((layer) => {
          const object3DLayer = app.layers.getByKey(layer.name);
          if (object3DLayer) {
            object3DLayer.featureVisibility.clearHighlighting();
          }
        });
      }

      async function highlightResult() {
        if (selectedObject3D.value.name === undefined) {
          app.notifier.add({
            type: NotificationType.ERROR,
            message: 'Please select 3D object first',
          });
        } else {
          // Build Query URL
          const queryURL = buildQueryURL(
            selectedWMSLayer.value,
            selectedGMLIDAttribute.value.name,
            200, // Max features to highlight
            selectedAttribute.value,
            selectedOperator.value,
            selectedCriteria.value,
          );
          // Fetch Data
          const queryData = await fetchData(queryURL);
          // Parse Data
          const queryResult = parseQueryData(
            queryData,
            selectedGMLIDAttribute.value.name,
          );
          app.notifier.add({
            type: NotificationType.SUCCESS,
            message: `Highlight ${queryResult.numberReturned} of ${queryResult.numberMatched} matched features`,
          });
          // Highlight
          this.highlight3DObjects(
            app,
            selectedObject3D.value.name,
            queryResult.selectedGmlIds,
          );
        }
      }

      async function downloadJSON() {
        // TODO: unify check input
        if (selectedObject3D.value.name === undefined) {
          app.notifier.add({
            type: NotificationType.ERROR,
            message: 'Please select 3D object first',
          });
          return;
        }

        // Build Query URL
        const queryURL = buildQueryURL(
          selectedWMSLayer.value,
          '', // All attributes
          -1, // All features
          selectedAttribute.value,
          selectedOperator.value,
          selectedCriteria.value,
        );

        // Fetch Data
        const queryData = await fetchData(queryURL);
        // Parse Data
        const queryResult = parseQueryDataForDownload(
          queryData,
          selectedGMLIDAttribute.value.name,
        );

        // Create a JSON object
        const blob = new Blob([JSON.stringify(queryResult)], {
          type: 'application/json',
        });

        // Prepare filename
        const cdt = new Date();
        const suffix = cdt.toISOString().slice(0, -5).replace(/\D/g, '');

        const virtualLink = document.createElement('a');
        virtualLink.href = URL.createObjectURL(blob);
        virtualLink.download = `filtered-GML-IDs-${suffix}.json`;
        virtualLink.style.display = 'none';
        document.body.appendChild(virtualLink);
        virtualLink.click();
        URL.revokeObjectURL(virtualLink.href);
        document.body.removeChild(virtualLink);

        app.notifier.add({
          type: NotificationType.SUCCESS,
          message: `${queryResult.numberReturned} selected GML ID are downloaded.`,
        });
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
        highlightResult,
        downloadJSON,
        clearHightlight,
        selectedLayerChanged,
        object3Ds,
        layers: wmsLayers,
        attributes,
        selectedObject3D,
        selectedWMSLayer,
        selectedGMLIDAttribute,
        selectedAttribute,
        selectedOperator,
        selectedCriteria,
        availableOperators,
      };
    },
  };
</script>

<style scoped></style>