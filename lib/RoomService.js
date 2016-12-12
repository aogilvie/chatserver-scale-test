'use strict';

function RoomService() {
  this._rooms = {};
}

/**
 * Leave a room, if room is empty, room is deleted
 *
 */
RoomService.prototype.leave = function(name, nick) {
  if (!this._rooms.hasOwnProperty(name))
    return;
  var idx = this._rooms[name].members.indexOf(nick);
  if (idx > -1) {
    this._rooms[name].members.splice(idx, 1);
    if (this._rooms[name].members.length === 0) {
      delete this._rooms[name];
    }
  }
};

/**
 * Join a room, if not existing, room is created
 *
 */
RoomService.prototype.join = function(name, user) {
  if (!this._rooms.hasOwnProperty(name)) {
    this._create(name);
  }
  this._addMember(name, user);
};

/**
 * List members of a room. A non existing room will return no members
 *
 */
RoomService.prototype.listMembers = function(name) {
  if (!this._rooms.hasOwnProperty(name)) {
    return [];
  }
  return this._rooms[name].members;
};

/**
 * List current open and active rooms
 *
 */
RoomService.prototype.listRooms = function() {
  var rooms = [];
  Object.keys(this._rooms).forEach(function(key) {
    rooms.push(key + ' (' + this._rooms[key].members.length + ')');
  }.bind(this));
  return rooms;
};

RoomService.prototype._create = function(name) {
  this._rooms[name] = {
    members: []
  };
};

RoomService.prototype._addMember = function(room, nick) {
  this._rooms[room].members.push(nick);
};

module.exports = new RoomService();
