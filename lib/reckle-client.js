'use strict';
const r = require('request');
const urlLib = require('url');
const base64 = require('base64-url');
const headerRef = Symbol('header');
const timedAveragesRef = Symbol('timedAverages');
const winston = require('winston');

function createBasicAuthHeader(username, password) {
    const authHeader = base64.encode(`${username}:${password}`);

    return `Basic ${authHeader}`;
}

class Client {

    constructor(options) {
        this.hostname = options.hostname;
        this[headerRef] = {};
        this[timedAveragesRef] = {};

        if (process.env.DEBUG) {
            winston.log('Hostname:', this.hostname);
        }

        this.reset();
    }

    reset() {
        this.client = r.defaults({ jar: r.jar() });
    }

    /**
     * Method to send a request
     * @method request
     * @param {Object} options          The options to send to the request
     * @param {String} options.method   The HTTP method to use
     */
    request(options) {
        const url = urlLib.resolve(this.hostname, options.path);
        const method = options.method;
        const headers = options.headers || this[headerRef];
        const body = options.body;
        const meow = Date.now();

        if (process.env.DEBUG) {
            winston.info('Request\n');
            winston.info('\toptions:', options);
            winston.info('\theaders:', options.headers || this[headerRef])
            winston.info('\tmethod:', method);
            winston.info('\turl:', url);
            winston.info('\tbody:', body);
        }

        return new Promise((resolve, reject) => {
            this.client({
                url,
                method,
                headers,
                body,
                json: true
            }, (err, resp, body) => {
                if (err) {
                    return reject(err);
                }

                if (!this[timedAveragesRef][method]) {
                    this[timedAveragesRef][method] = {};
                }

                const trackPath = options.trackPath || options.path;
                const requestTiming = Date.now() - meow;
                const currTiming = this[timedAveragesRef][method][trackPath];

                if (!currTiming) {
                    this[timedAveragesRef][method][trackPath] = requestTiming;
                } else {
                    this[timedAveragesRef][method][trackPath] = (currTiming + requestTiming) / 2;
                }

                if (process.env.DEBUG) {
                    winston.info('Response\n');
                    winston.info('\tstatus:', resp.statusCode);
                    winston.info('\tbody', resp.body);
                }

                return resolve(resp);
            });
        });
    }

    /**
     * Method to set header for client
     * @method setHeader
     * @param {String} key          The key to set
     * @param {String} value        The value to set the key to
     */
    setHeader(key, value) {
        this[headerRef][key] = value;
    }

    /**
     * Method to set headers for client
     * @method setHeaders
     * @param {Object} headers      Headers to set
     */
    setHeaders(obj) {
        Object.keys(obj).forEach(i => this.setHeader(i, obj[i]));
    }

    /**
     * Method to set authorization header
     * @method setAuthorizationHeader
     * @param {String} key          The key to set
     * @param {String} value        The value to set the key to
     */
    setTokenAuthorizationHeader(value) {
        this[headerRef].authorization = `Bearer ${value}`;
    }

    setBasicAuthorizationHeader(username, password) {
        this[headerRef].authorization = createBasicAuthHeader(username, password);
    }

    getBasicAuthorizationHeader(username, password) {
        return createBasicAuthHeader(username, password);
     }

    getTokenAuthorizationHeader(value) {
        return `Bearer ${value}`;
    }

    get timedAverages() {
        return this[timedAveragesRef];
    }

    /**
     * Method to reset the headers
     * @method resetHeader
     */
    resetHeaders() {
        this[headerRef] = {}
    }
}

module.exports = {
    createInstance(options) {
        return new Client(options);
    }
};
