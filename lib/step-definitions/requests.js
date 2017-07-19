'use strict';

const url = require('url');

function sanitizeRoute(world, route) {
    return route;
    // return url.resolve(world.path, route);
}

function getTrackPath(world, route) {
    return world.store.substituteStringWithIds(route);
}

function resolveRoute(world, route) {
    return world.store.substituteStringWithStore(route);
}

function requestAndSave(world, options) {
    return world.apiClient.request(options).then((resp) => {
        world.store.set('response', resp);
        if (options.method === 'POST') {
        }
    });
}

module.exports = function () {
    this.When('I "$method" to route "$route" with object "$key"', function (method, route, key) {
        const path = sanitizeRoute(this, resolveRoute(this, route));
        const body = this.store.get(key);

        return requestAndSave(this, {
            path,
            trackPath: getTrackPath(this, route),
            method,
            body
        });
    });

    this.When('I "$method" to route "$route" with json', function(method, route, string) {
        const path = sanitizeRoute(this, resolveRoute(this, route));
        const body = this.store.convertStringToJson(string);

        Object.keys(body).forEach((k) => {
            if (body[k] === 'null') {
                body[k] = null;
            }
        });

        return requestAndSave(this, {
            path,
            trackPath: getTrackPath(this, route),
            method,
            body
        });
    });

    this.When('I "$method" to route "$route"', function (method, route) {
        const path = sanitizeRoute(this, resolveRoute(this, route));

        return requestAndSave(this, {
            path,
            trackPath: getTrackPath(this, route),
            method
        });
    });

    this.When('I "$method" route "$route"', function (method, route) {
        const path = sanitizeRoute(this, resolveRoute(this, route));

        return requestAndSave(this, {
            path,
            trackPath: getTrackPath(this, route),
            method
        });
    });

    this.When('I set headers to json', function (string) {
        const headers = this.store.convertStringToJson(string);

        this.apiClient.setHeaders(headers);
    });

    this.Then('I set the basic authorization header to username "$usernameRef" and password "$passwordRef"', function (usernameRef, passwordRef) {
        const username = this.store.get(usernameRef);
        const password = this.store.get(passwordRef);

        this.apiClient.setBasicAuthorizationHeader(username, password);
    });

    this.Then('I set the authorization header to username "$usernameRef" and password "$passwordRef"', function (usernameRef, passwordRef) {
        const username = this.store.get(usernameRef);
        const password = this.store.get(passwordRef);

        this.apiClient.setBasicAuthorizationHeader(username, password);
    });

    this.Then('I set the authorization header to token "$tokenRef"', function(tokenRef) {
        const token = this.store.get(tokenRef);

        this.apiClient.setTokenAuthorizationHeader(token);
    });
}
