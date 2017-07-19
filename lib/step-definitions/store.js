'use strict';

const hoek = require('hoek');
const util = require('../util');

module.exports = function () {
    this.Then('I set value "$keyOne" to reference "$keyTwo"', function (key1, key2) {
        const value = this.store.get(key2);

        this.store.set(key1, hoek.clone(value));
    });

    this.Then('I set value "$key" to json', function (key, string) {
        const json = this.store.convertStringToJson(string);

        this.store.set(key, json);
    });

    this.Then('I set value "$key" to value "$value"', function (key, value) {
        const valueToSet = util.convertValue(value);

        this.store.set(key, valueToSet);
    });

    this.Then('I set value "$key" to string "$value"', function (key, value) {
        this.store.set(key, value);
    });
}
