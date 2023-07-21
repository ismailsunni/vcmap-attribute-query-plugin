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
                :items="[
                  { value: 'Layer 1' },
                  { value: 'Layer 2' },
                  { value: 'Layer 3' },
                ]"
                :item-text="(item) => item.value"
                placeholder="Please select a layer"
              />
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
    VcsFormSection,
  } from '@vcmap/ui';
  import { inject, onMounted } from 'vue';

  import { name } from '../../package.json';

  export default {
    name: 'WFSAttributeQuery',
    components: {
      VContainer,
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VRow,
      VCol,
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

      onMounted(() => {});

      return {
        state,
      };
    },
  };
</script>

<style scoped></style>
