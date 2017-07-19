'use strict';
const path = require('path');
const readline = require('readline');
const fs = require('fs');
const base = process.env.PWD;

module.exports = function () {
    this.Given('data is loaded from files into these variables:', function (table, callback) {
        table.rows().forEach(row => {
            const filename = path.resolve(base, './features/support/data', row[1])
            const data = require(filename);

            Object.keys(data).forEach((key) => {
                data[key] = this.store.substituteValueIfMatch(data[key]);
            });

            this.store.set(row[0], data);
        });

        callback();
    });
}
