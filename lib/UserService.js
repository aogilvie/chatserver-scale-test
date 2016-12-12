'use strict';

function UserService() {
  this._storage = null;
  this.setStorage();
}

/**
 * Set storage type
 * (default) localstorage
 *
 */
UserService.prototype.setStorage = function(type) {
  // TODO: modular storage options
  switch (type) {
    case 'localstorage':
      /* falls through */
    default:
      var LocalStorage = require('node-localstorage').LocalStorage;
      this._storage = new LocalStorage('./temp');
  }
};

/**
 * Add a user.
 *
 */
UserService.prototype.add = function(email, data) {
  this._storage.setItem(email, JSON.stringify(data));
};

/**
 * Set a user nick.
 *
 */
UserService.prototype.setNick = function(email, nick, cb) {
  var userData = JSON.parse(this._storage.getItem(email));
  userData.nick = nick;
  this.add(email, userData);
  cb();
};

/**
 * Get a user's nick.
 *
 */
UserService.prototype.getNick = function(email) {
  return JSON.parse(this._storage.getItem(email)).nick;
};

module.exports = new UserService();
