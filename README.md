# Reckle

Request + Pickle = Reckle. A cucumber integration.

## Motivation

Reckle is an easy and straightforward way to do test HTTP Request and Responses with Cucumber.js. Reckle provides an HTTP client, in-memory JSON store, and declaritive Gherkin to connect it all

## Usage
### Install
`npm install --save-dev reckle`

### Setting up the client and store in the cucumber world
``` 
// features/support/world.js
'use strict';

const reckle = require('reckle');

function World() {
    this.apiClient = reckle.client.createInstance({
        hostname: 'http://localhost:8080'
    });

    this.store = reckle.store.createInstance();
}

module.exports = function () {
    this.World = World;
}

```

### Setting up the gherkin
```
// features/support/reckle.js
'use strict';

module.exports = require('reckle').gherkin;
```

Now your project is set up correctly to use the Gherkin provided by Reckle

## Using the Gherkin
All gherkin can be prepended with `Given`, `When`, `Then`

Substitution Index:
- $REQUEST_METHOD is one of following:
    - "GET"
    - "POST"
    - "PUT"
    - "OPTIONS"
    - "PATCH"
    - "DELETE"
- $ROUTE_PATH is appended onto the configured `hostname`
    - /users
    - /users/messages
    - /pickles
- $KEY_PATH is a `.` separated identifier to lookup in the key/value store. It will use the value in the store at that location
    - "users.testUser.username"
    - "response.body"
- $JSON_STRING is a string that can be parsed as JSON
- $VALUE_STRING is a string value that will be attempted to be converted into the correct value
    - "undefined" will be converted to `undefined`
    - "null" will be converted to `null`
    - "true" will be converted to `true`
    - "false" will be converted to `false`
    - A number will be parsed as an int and converted
    - If all else fails the string is returned
- $COMPARISON_FUNCTION is one of the following:
    - "equal to" -> checks strict equality
    - "deep equal to" -> checks deep equality
    - "not equal to" -> checks strictly not equal
    - "contains" -> checks that key exists
    - "contains all" -> checks that all keys exist with the value
    - "greater than" OR ">" -> checks greater than
    - "greater than or equal to" OR ">=" -> checks greater than or equal to
    - "less than" OR "<" -> checks less than
- $JSON_FILE_PATH is a path to a `.json` file in the path `./features/support/data`
```
// Request Gherkin
I "$REQUEST_METHOD" to route "$ROUTE_PATH" with object "$KEY_PATH"
I "$REQUEST_METHOD" to route "$ROUTE_PATH" with json """$JSON_STRING"""
I "$REQUEST_METHOD" to route "$ROUTE_PATH"
I "$REQUEST_METHOD" route "$ROUTE_PATH"
I set headers to json """$JSON_STRING"""
I set the authorization header to username "$KEY_PATH" and password "$KEY_PATH"
I set the authorization header to token "$KEY_PATH"

// Store Gherkin
I set value "$KEY_PATH" to reference "$KEY_PATH"
I set value "$KEY_PATH" to json """$JSON_STRING"""
I set value "$KEY_PATH" to value "$VALUE_STRING"
I set value "$KEY_PATH" to string "$STRING"

// Comparison Gherkin
"$KEY_PATH" is "$COMPARISON_FUNCTION" value "$VALUE_STRING"
"$KEY_PATH" is truthy
"$KEY_PATH" is "$COMPARISON_FUNCTION" reference "$KEY_PATH"
"$KEY_PATH" "$COMPARISON_FUNCTION" reference "$KEY_PATH"
"$KEY_PATH" is "$COMPARISON_FUNCTION" json """$JSON_STRING"""
"$KEY_PATH" "$COMPARISON_FUNCTION" json """$JSON_STRING"""
"$KEY_PATH" is printed out
"$KEY_PATH" has size "$VALUE_STRING"
"$KEY_PATH" has an array item "$COMPARISON_STRING" reference "$KEY_PATH"
"$KEY_PATH" has an array item "$COMPARISON_STRING" value "$VALUE_STRING"
"$KEY_PATH" has an array item "$COMPARISON_STRING" json """$JSON_STRING"""
"$KEY_PATH" does not have an array item "$COMPARISON_STRING" json """$JSON_STRING"""

// Data loading Gherkin
// This gherkin is used to populate the store
data is loaded from files into these variables
|  name         |       filename          |
| $KEY_PATH     |      $JSON_FILE_PATH    |
```

## Simple Example
```
@users
@functional
Feature: Users feature

    Background:
        Given data is loaded from files into these variables:
            |  name          |   filename                   |
            | users.1        |   users/user1.json           |

    Scenario: Can signup a user
        Given I set the basic authorization header to username "users.1.username" and password "users.1.password"
        When I "GET" to route "/v1/users/signup"
            And I set value "users.1.id" to reference "response.body.id"
            And I set value "users.1.token" to reference "response.body.token"
            And "response.statusCode" is "equal to" value "201"
            And "response.body.token" is truthy
            And "response.body.id" is truthy
            And "response.body.username" is truthy
            And "response.body.password" is "equal to" value "undefined"
            And "response.body.type" is "equal to" value "regular"
        Then I set the authorization header to token "users.1.token"
        Then I "GET" route "/v1/me"
            And "response.statusCode" is "equal to" value "200"
            And "response.body.token" is truthy
            And "response.body.id" is truthy
            And "response.body.username" is truthy
            And "response.body.password" is "equal to" value "undefined"
            And "response.body.type" is "equal to" value "regular"

    Scenario: Signing up with same username is a 409
        Given I set the basic authorization header to username "users.1.username" and password "users.1.password"
        When I "GET" to route "/v1/users/signup"
            And I set value "users.1.id" to reference "response.body.id"
            And I set value "users.1.token" to reference "response.body.token"
            And "response.statusCode" is "equal to" value "201"
        When I "GET" to route "/v1/users/signup"
            And "response.statusCode" is "equal to" value "409"

    Scenario: Login with a wrong password is a 401
        Given I set the basic authorization header to username "users.1.username" and password "users.1.password"
        When I "GET" route "/v1/users/signup"
            And "response.statusCode" is "equal to" value "201"
            And I set value "users.1.id" to reference "response.body.id"
            And I set value "users.1.token" to reference "response.body.token"
        Then I set value "users.1.password" to value "wrongPassword"
            And I set the basic authorization header to username "users.1.username" and password "users.1.password"
        Then I "GET" route "/v1/users/login"
            And "response.statusCode" is "equal to" value "401"
            And "response.headers.www-authenticate" is truthy

    Scenario: Can login a user
        Given I set the basic authorization header to username "users.1.username" and password "users.1.password"
        When I "GET" route "/v1/users/signup"
            And "response.statusCode" is "equal to" value "201"
        Then I "GET" route "/v1/users/login"
            And "response.statusCode" is "equal to" value "200"
            And I set value "users.1.id" to reference "response.body.id"
            And I set value "users.1.token" to reference "response.body.token"
            And "response.body.token" is truthy
            And "response.body.id" is truthy
            And "response.body.username" is truthy
            And "response.body.password" is "equal to" value "undefined"
```

Things to know about the platform:
1. Whenever a request is made, the response object is placed into the store path "response"
2. The store is reset after every test that runs
3. The api client is reset after every test that runs (includes headers, cookies)

## Contributing
I am open to adding more gherkin to continue to make the syntax easier to understand syntax. As they say, the hardest thing in computer science is naming things