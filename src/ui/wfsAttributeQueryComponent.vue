<template>
  <v-container class="px-1 py-1 main">
    <div>Hello World</div>
  </v-container>
</template>

<script>
  import {
    VContainer,
    // VDivider,
    //  VIcon
  } from 'vuetify/lib';
  // import {
  //   VcsLabel,
  //   VcsButton,
  //   VcsDatePicker,
  //   VcsTextField,
  //   VcsTooltip,
  //   VcsSlider,
  // } from '@vcmap/ui';
  import { inject, onMounted } from 'vue';

  import { name } from '../../package.json';

  export default {
    name: 'WFSAttributeQuery',
    components: {
      VContainer,
      // VcsLabel,
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
      const cesiumWidget = app.maps.activeMap.getCesiumWidget();
      const { clock } = cesiumWidget;
      const { state } = app.plugins.getByKey(name);

      onMounted(() => {
        if (state.removeListener) {
          state.removeListener();
        }
        state.removeListener = clock.onTick.addEventListener(() => {});
      });

      return {
        state,
      };
    },
  };
</script>

<style scoped></style>
