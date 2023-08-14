import Attribute from './attribute';

class AttributeFilter {
  /**
   *
   * @param {Attribute} attribute
   * @param {string} operator
   * @param {string | number} value
   */

  constructor(attribute, operator, value) {
    this.attribute = attribute; // Attribute Object
    this.operator = operator; // String
    this.value = value; // String or number
  }

  toCQL() {
    return `${this.attribute.name}${this.operator}${this.value}`;
  }
}

export default AttributeFilter;
