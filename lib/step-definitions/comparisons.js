'use strict';
const chai = require('chai');
const util = require('../util');
const assert = chai.assert;

function getComparisonFunction(comparison) {
    const choices = [
        'equal to',
        'deep equal to',
        'not equal to',
        'contains',
        'contains all',
        'greater than',
        '>',
        'greater than or equal to',
        '>=',
        'less than',
        '<'
    ];

    let returnFunc = () => assert(false, `Invalid comparison function. Options are: ${JSON.stringify(choices)}`);

    switch (comparison) {
    case 'equal to':
        return (a, b) => assert.strictEqual(a, b);
    case 'deep equal to':
        return (a, b) => assert.deepEqual(a, b);
    case 'not equal to':
        return (a, b) => assert.notStrictEqual(a, b);
    case 'contains':
        return (a, b) => assert.isOk(a[b]);
    case 'contains all':
        return (a, b) => Object.keys(b).forEach(id => assert.deepEqual(a[id], b[id]));
    case 'greater than':
    case '>':
        return (a, b) => assert.isAbove(a, b);
    case 'greater than or equal to':
    case '>=':
        return (a, b) => assert.isAtLeast(a, b);
    case 'less than':
    case '<':
        return (a, b) => assert.isBelow(a, b);
    default:
        return returnFunc;
    }
}

function resolveRoute(world, route) {
    const paths = route.split('/');
    const resolvedRoute = [];

    paths.forEach((path) => {
        const value = world.store.substituteValueIfMatch(path);

        if (Array.isArray(value) || typeof value === 'object') {
            throw new Error(`${capturedValue} has value: ${value}. Cannot be array or object`);
        }

        resolvedRoute.push(value);
    });

    return resolvedRoute.join('/');
}

module.exports = function () {
    this.Then('"$key" is "$comparison" value "$value"', function (key, comparison, value) {
        const func = getComparisonFunction(comparison);

        return func(this.store.get(key), util.convertValue(value));
    });

    this.Then('"$key" is truthy', function (key) {
        assert.isOk(this.store.get(key), `${key}=${this.store.get(key)} is not truthy`);
    });

    this.Then('"$key" is "$comparison" reference "$valueRef"', function(key, comparison, valueRef) {
        const func = getComparisonFunction(comparison);

        return func(this.store.get(key), this.store.get(valueRef));
    });

    this.Then('"$key" "$comparison" reference "$valueRef"', function(key, comparison, valueRef) {
        const func = getComparisonFunction(comparison);

        return func(this.store.get(key), this.store.get(valueRef));
    });

    this.Then('"$key" is "$comparison" json', function (key, comparison, jsonString) {
        const func = getComparisonFunction(comparison);
        const json = this.store.convertStringToJson(jsonString);

        return func(this.store.get(key), json);
    });

    this.Then('"$key" "$comparison" json', function (key, comparison, jsonString) {
        const func = getComparisonFunction(comparison);
        const json = this.store.convertStringToJson(jsonString);

        return func(this.store.get(key), json);
    });

    this.Then('"$key" is printed out', function(key) {
        console.log(JSON.stringify(this.store.get(key), null, 4));
    });

    this.Then('"$key" has size "$size"', function (key, size) {
        const json = this.store.get(key);
        const value = util.convertValue(size);

        if (Array.isArray(json)) {
            return assert.strictEqual(json.length, value);
        } else if (typeof json === 'object'){
            return assert.strictEqual(Object.keys(json).length, value);
        } else {
            return assert(false, `${json} does not have the correct type`);
        }
    });

    this.Then('"$key" has an array item "$comparison" reference "$ref"', function (key, comparison, ref) {
        const func = getComparisonFunction(comparison);
        const array = this.store.get(key);
        const json = this.store.get(ref);

        if (!Array.isArray(array)) {
            return assert(false, `${key} must be an array: ${JSON.stringify(array)}`);
        }

        assert(array.some((item) => {
            try {
                func(item, json);
                return true;
            } catch(e) {
                return false
            }
        }), 'Item not in array');
    });

    this.Then('"$key" has an array item "$comparison" value "$value"', function (key, comparison, value) {
        const func = getComparisonFunction(comparison);
        const v = util.convertValue(value);
        const array = this.store.get(key);

        if (!Array.isArray(array)) {
            return assert(false, `${key} must be an array: ${JSON.stringify(array)}`);
        }

        assert(array.some((item) => {
            try {
                func(item, v);
                return true;
            } catch(e) {
                return false;
            }
        }), 'Item not in array');
    });

    this.Then('"$key" has an array item "$comparison" json', function (key, comparison, jsonString) {
        const func = getComparisonFunction(comparison);
        const json = this.store.convertStringToJson(jsonString);
        const array = this.store.get(key);

        if (!Array.isArray(array)) {
            return assert(false, `${key} must be an array: ${JSON.stringify(array)}`);
        }

        assert(array.some((item) => {
            try {
                func(item, json);
                return true;
            } catch(e) {
                return false;
            }
        }), 'Item not in array');
    });

    this.Then('"$key" does not have an array item "$comparison" json', function (key, comparison, jsonString) {
        const func = getComparisonFunction(comparison);
        const json = this.store.convertStringToJson(jsonString);
        const array = this.store.get(key);

        if (!Array.isArray(array)) {
            return assert(false, `${key} must be an array: ${JSON.stringify(array)}`);
        }

        assert(array.some((item) => {
            try {
                func(item, json);
                return false;
            } catch(e) {
                return true;
            }
        }), 'Item is in array');
    });
}
