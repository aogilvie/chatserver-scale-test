'use strict';

function MessageUtility() {
  this.commandList = MessageUtility.commandList;
}

MessageUtility.commandList = {
  HELP:           '/help',
  NICK:           '/nick ',
  MEMBERS:        '/members',
  JOIN:           '/join ',
  LEAVE:          '/leave',
  ROOMS:          '/rooms'
};

/**
 * Test for a command in string
 *
 * @return [] commands - A list of matching commands
 */
MessageUtility.prototype.filterCommand = function(msg) {
  var commands = [];
  Object.keys(this.commandList).forEach(function(command) {
    command = this.commandList[command];
    var reg = new RegExp('^' + command, 'i');
    var result = reg.exec(msg);

    if (result && commands.length === 0) {
      // Remove command from message
      msg = msg.slice(result[0].length, msg.length);

      // Remove slash from command, put both in the commands array
      commands.push(result[0], msg);
    }
  }.bind(this));
  return commands;
};

MessageUtility.prototype._nick = function(newNick) {
  // TODO: validation
  this._userStore.add(newNick);
};

module.exports = new MessageUtility();
