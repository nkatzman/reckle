'use strict';
const winston = require('winston');
const storeRef = Symbol('store');
const clone = require('clone');
let store;

class Store {
    /**
     * The store constructor
     * @method constructor
     * @param {String} key          The key to get
     * @return {Store} store
     */
    constructor() {
        this.reset();
    }

    /**
     * Method to reset the store
     * @method reset
     */
    reset() {
        this[storeRef] = {};
    }

    /**
     * Method to set a value in the store
     * @method set
     * @param {String} key          The key to store
     * @param {String} value        The value to stores
     */
    set(id, value) {
        const keys = id.trim().split('.');
        let key;
        let ref = this[storeRef];

        while (keys.length > 1) {
            key = keys.shift();
            if (!ref[key]) {
                ref[key] = {}
            }
            ref = ref[key];
        }

        key = keys.shift();

        if (key === 'response') {
            ref[key] = value;
        } else {
            ref[key] = clone(value);
        }
    }

    /**
     * Method to get the key
     * @method get
     * @param {String} key          The key to get
     * @return {Any} value          The value stored as a specific key reference
     */
    get(key) {
        const keys = this.substituteStringWithStore(key).split('.');
        let index = this[storeRef];

        while (keys.length && (index = index[keys.shift()])) { }

        if (process.env.DEBUG) {
            winston.info('Store value:', index);
        }

        if (key === 'response') {
            return index;
        } else {
            return clone(index);
        }
    }

    /**
     * Method to check if a string matches a subsitute string. If so, take value
     * from the store
     * @method substituteValueIfMatch
     * @param {String} value                  The string value to check
     * @param {Any} value                     The value at a desired reference, or the string passed in
     */
    substituteValueIfMatch(value) {
        const match = /^\$\{(.*)\}$/.exec(value)

        if (!match) {
            return value;
        }

        return this.get(match[1]);
    }

    substituteStringWithIds(string) {
        if (!string) {
            return string;
        }

        let idCount = 1;

        // Look for any pattern matching ${characters.something}
        // And replace with the id1, id2, .etc
        return string.replace(/\$\{([\w.]+)\}/g, (match, p1) => {
            const value = `:id${idCount}`
            idCount += 1;

            return value;
        });
    }

    /**
     * Method to replace all store references in a string with their value
     * @method substituteStringWithStore
     * @param {String} value                  The string value to check
     * @param {String} string                 The value at a desired reference, or the string passed in
     */
    substituteStringWithStore(string) {
        if (!string) {
            return string;
        }

        // Look for any pattern matching ${characters.something}
        // And replace with the store value for the key
        return string.replace(/\$\{([\w.]+)\}/g, (match, p1) => {
            const value = this.get(p1);

            if (Array.isArray(value) || typeof value === 'object') {
                throw new Error(`${p1} has value: ${value}. Cannot be array or object`);
            }

            return value;
        });
    }

    /**
     * Method to replace all store references in an object with their value
     * @method subsituteStoreInData
     * @param {Object} data                  The data to replace
     * @return {Object} data
     */
    subsituteStoreInData(data) {
        const returnData = {};

        if (data === undefined || data === null) {
            return;
        }

        if (typeof data === 'string') {
            return this.substituteStringWithStore(data);
        }

        if (Array.isArray(data)) {
            return data.map(val => this.subsituteStoreInData(val));
        }

        if (typeof data !== 'object') {
            return data;
        }

        Object.keys(data).forEach((key) => {
            const newVal = this.substituteValueIfMatch(key);

            returnData[newVal] = this.subsituteStoreInData(data[key]);
        });

        return returnData;
    }

    /**
     * Method to convert a string to JSON and check each value for a substite
     * @method convertStringToJson
     * @param {String} string          The string to convert to JSON
     * @return {JSON} Object           A JSON representation of a string
     */
    convertStringToJson(string) {
        return this.subsituteStoreInData(JSON.parse(string));
    }
}

module.exports = {
    createInstance() {
        return new Store();
    },
    getStore() {
        if (!store) {
            store = new Store();
        }

        return store;
    }
};
