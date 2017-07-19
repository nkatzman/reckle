const definitions = require('./step-definitions');

module.exports = function () {
    [
        'comparisons',
        'dataLoader',
        'requests',
        'store',
        'users'
    ].forEach(f => definitions[f].apply(this));
}