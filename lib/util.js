'use strict';

module.exports = {
    /**
    * Helper method to conver user values to what they are intended to be
    * @method convertValue
    * @param {Any} value
    * @returns {Any} desiredValue
    */
    convertValue(value) {
        const num = parseInt(value);

        if (!isNaN(num)) {
            return num;
        } else if (value === "undefined") {
            return undefined;
        } else if (value === "null") {
            return null;
        } else if (value === "true") {
            return true;
        } else if (value === "false") {
            return false;
        }

        return value;
    }
}
