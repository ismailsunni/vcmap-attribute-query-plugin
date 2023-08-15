import Attribute from './attribute';

// Good enough uuid generator for our use case
function generateUUID() {
  const uuidTemplate = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

  return uuidTemplate.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class AttributeFilter {
  /**
   *
   * @param {Attribute} attribute
   * @param {string} operator
   * @param {string | number} value
   * @param {string} uuid
   */

  constructor(attribute, operator, value, uuid = '') {
    this.attribute = attribute; // Attribute Object
    this.operator = operator; // String
    this.value = value; // String or number
    if (uuid === '') {
      this.uuid = generateUUID();
    } else {
      this.uuid = uuid;
    }
  }

  toCQL() {
    return `${this.attribute.name}${this.operator}${this.value}`;
  }
}

export default AttributeFilter;
