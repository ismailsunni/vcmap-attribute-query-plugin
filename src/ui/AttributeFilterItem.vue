<template>
  <div>
    <v-row no-gutters>
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
      <v-col cols="1">
        <VcsToolButton
          :icon="'mdi-delete'"
          :tooltip="'Delete the attribute filter'"
          @click="deleteAttributeFilter"
        ></VcsToolButton>
      </v-col>
    </v-row>
    <v-row no-gutters v-if="selectedAttribute">
      <v-col cols="4">
        <VcsLabel html-for="textInput" class="text-caption">Filter</VcsLabel>
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

  import { VcsLabel, VcsTextField, VcsSelect, VcsToolButton } from '@vcmap/ui';
  import AttributeFilter from './attributeFilter.js';
  import Attribute from './attribute.js';

  export default {
    name: 'AtributeFilter',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsTextField,
      VcsSelect,
      VcsToolButton,
    },
    props: {
      attributes: {
        type: Array,
        required: true,
      },
      uuid: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        /**
         * @type {AttributeFilter|null}
         */
        attributeFilter: new AttributeFilter(
          new Attribute('', ''),
          '',
          '',
          this.uuid,
        ),
        selectedAttribute: '',
        selectedOperator: '',
        selectedCriteria: '',
      };
    },

    methods: {
      deleteAttributeFilter() {
        this.$emit('deleteAttributeFilter', this.attributeFilter);
      },
    },

    watch: {
      selectedAttribute(newValue) {
        this.attributeFilter.attribute = newValue;
        this.$emit('selectedAttributeFilter', this.attributeFilter);
      },
      selectedOperator(newValue) {
        this.attributeFilter.operator = newValue;
        this.$emit('selectedAttributeFilter', this.attributeFilter);
      },
      selectedCriteria(newValue) {
        this.attributeFilter.value = newValue;
        this.$emit('selectedAttributeFilter', this.attributeFilter);
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
        const selectedType = this.attributeFilter.attribute.type;
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
