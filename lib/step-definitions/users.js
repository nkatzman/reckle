'use strict';

function runFunctionForallUsers(world, fn) {
    const users = world.store.get('users');
    const promises = [];

    Object.keys(users).forEach((id) => {
        promises.push(fn(`users.${id}`, users[id]));
    });

    return Promise.all(promises);
}

module.exports = function () {
    this.When('I create all users', function () {
        return runFunctionForallUsers(this, this.user.create);
    });

    this.When('I login all users', function () {
        return runFunctionForallUsers(this, this.user.login);
    });

    this.When('I login user "$user"', function(user) {
        const u = this.store.get(user);

        return this.user.login(user, u);
    })
}
