<template>
  <div>
    <v-row>
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
        <VcsLabel html-for="textInput" class="text-caption"> Filter </VcsLabel>
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
  </div>
</template>
<script>
  import { VCol, VRow } from 'vuetify/lib';

  import { VcsLabel, VcsTextField, VcsSelect } from '@vcmap/ui';

  export default {
    name: 'AtributeFilter',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsTextField,
      VcsSelect,
    },
    props: {
      attributes: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        selectedAttribute: '',
        selectedOperator: '',
        selectedCriteria: '',
      };
    },

    watch: {
      selectedAttribute(newValue) {
        this.$emit('selectedAttribute', newValue);
      },
      selectedOperator(newValue) {
        this.$emit('selectedOperator', newValue);
      },
      selectedCriteria(newValue) {
        this.$emit('selectedCriteria', newValue);
      },
    },

    computed: {
      availableOperators() {
        const operator = {
          number: ['=', '!=', '<', '<=', '>', '>='],
          boolean: ['=', '!='],
          string: ['LIKE', 'ILIKE'],
        };
        // TODO: Make sure the type and the operator are available in WFS
        const selectedType = this.selectedAttribute.type;
        if (['number', 'double', 'integer', 'int'].includes(selectedType)) {
          return operator.number;
        } else if (selectedType === 'string') {
          return operator.string;
        } else if (selectedType === 'boolean') {
          return operator.boolean;
        } else {
          return [];
        }
      },
    },
  };
</script>
<style></style>
