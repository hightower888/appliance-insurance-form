/**
 * Firebase Cloud Functions Entry Point
 */

const createUser = require('./createUser');

exports.createUser = createUser.createUser;
