<template>
  <v-container class="px-1 py-1 main">
    <VcsFormSection heading="Query Options">
      <template #default>
        <v-container class="py-0 px-1">
          <v-row>
            <v-col cols="4">
              <VcsLabel html-for="textInput" class="text-caption">
                WFS Layer
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                :items="state.layers"
                :item-text="(item) => item.value"
                placeholder="Please select a layer"
              />
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
    // VcsTextField,
    // VcsTooltip,
    // VcsSlider,
    VcsFormButton,
    VcsFormSection,
  } from '@vcmap/ui';
  import { inject, onMounted } from 'vue';

  import { name } from '../../package.json';

  function populateWFSLayers(app) {
    const layers = [];
    [...app.layers].forEach((l) => {
      if (l.className === 'VectorLayer' || l.className === 'WFSLayer') {
        layers.push({ value: l.name });
      }
    });
    return layers;
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
      // VcsTextField,
      // VcsTooltip,
      // VIcon,
      // VcsSlider,
    },
    setup() {
      const app = inject('vcsApp');
      const { state } = app.plugins.getByKey(name);
      state.layers = populateWFSLayers(app);

      onMounted(() => {});

      return {
        state,
        start_query() {
          // no-eslint
          // console.log('test');
        },
      };
    },
  };
</script>

<style scoped></style>
