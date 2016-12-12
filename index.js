'use strict';

require('require-yaml');

var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var session = require('express-session');
var GoogleStrategy = require('passport-google-auth').Strategy;
var io = require('socket.io')();

var CONFIG;
if (process.env._ENV === '' || typeof process.env._ENV === 'undefined') {
  CONFIG = require('./conf/config-dev.yaml');
} else {
  CONFIG = require('./conf/config-' + process.env._ENV + '.yaml');
}

var userService = require('./lib/UserService');
var roomService = require('./lib/RoomService');
var messageUtility = require('./lib/MessageUtility');

function startServer(app) {
  var server = app.listen(CONFIG.port, function() {
    console.log('Server ready');
  });
  return server;
}

// Prepare passport
passport.use(
  new GoogleStrategy({
    clientId: CONFIG.auth.clientId,
    clientSecret: CONFIG.auth.clientSecret,
    callbackURL: CONFIG.auth.redirectUri + ':' + CONFIG.port + '/auth/callback',
    scope: [
      // If modifying these scopes, delete your previously saved credentials
      // at ~/.credentials/admin-directory_v1.json
      'profile', 'email'
    ]
  },
  function(accessToken, refreshToken, user, done) {
    user.accToken = accessToken;
    user.refToken = refreshToken;
    user.nick = user.displayName;
    userService.add(user.emails[0].value, user);
    done(null, user);
  })
);
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Prepare server
var app = express();
app.use(session({
  secret: '1234567890QWERTY',
  saveUninitialized: false,
  resave: false
}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

function loggedIn(req, res, next) {
  // console.log('authed?', req.isAuthenticated());
  if (req.isAuthenticated() === false) {
    return res.sendStatus(401);
  }
  next();
}

// Routing
app.use('/', express.static(__dirname + '/www')); // redirect root
app.use('/js', express.static(__dirname + '/www/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/css', express.static(__dirname + '/www/css')); // redirect local CSS

// Authentication endpoints
app.get('/hasAuth', loggedIn, function(req, res) {
  res.sendStatus(200);
});
app.get('/login', passport.authenticate('google'));
app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    req.logout();
    res.redirect('https://accounts.google.com/logout');
  });
});
app.get('/auth/callback', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/failed' // TODO
  })
);
app.get('/api/fetchUser', loggedIn, function(req, res) {
  return res.status(200).json(req.user);
});

// Socket Events
io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('chat message', function(msg) {
    // TODO: validatation should take place in the message utility
    var commands = messageUtility.filterCommand(msg.content);
    if (commands.length > 0) {
      // commands[
      //    0 - is the formatted command like 'join'
      //    1 - is the message minus command like 'aroom'
      // ]
      switch (commands[0]) {
        case messageUtility.commandList.HELP:
          var allCommands = [];
          Object.keys(messageUtility.commandList).forEach(function(key) {
            allCommands.push(messageUtility.commandList[key]);
          });
          socket.emit('chat message', { user: '', content: JSON.stringify(allCommands) });
        break;
        case messageUtility.commandList.NICK:
          var oldNick = userService.getNick(msg.user);
          if (typeof msg.room !== 'undefined' && msg.room) {
            // check if anyone has that nick in the room
            var result = roomService.listMembers(msg.room).some(function(memberName) {
              if (memberName === commands[1]) {
                // nick already existing in this room
                return true;
              }
            });
            if (result === true) {
              return socket.emit('chat message', { user: '', content: 'Error: nickname already exists in room' });
            }
          }
          // TODO: error handling
          userService.setNick(msg.user, commands[1], function() {
            socket.emit('chat message', { user: '', content: 'Nickname has been set' });
          });

          if (typeof msg.room !== 'undefined' && msg.room) {
            // leave and rejoin room with new nick
            roomService.leave(msg.room, userService.getNick(msg.user));
            roomService.join(msg.room, userService.getNick(msg.user));
            io.sockets.in(msg.room).emit('announce', {
              user: oldNick,
              content: 'is now known as "' + userService.getNick(msg.user) + '".'
            });
          }
        break;
        case messageUtility.commandList.JOIN:
          if (typeof msg.room !== 'undefined' && msg.room) {
            roomService.leave(msg.room, userService.getNick(msg.user));
            io.sockets.in(msg.room).emit('announce', {
              user: userService.getNick(msg.user),
              content: 'left.'
            });
            socket.leave(msg.room);
          }
          roomService.join(commands[1], userService.getNick(msg.user));
          socket.join(commands[1]);
          io.sockets.in(commands[1]).emit('announce', {
            room: commands[1],
            user: userService.getNick(msg.user),
            content: 'joined.'
          });
        break;
        case messageUtility.commandList.LEAVE:
          if (typeof msg.room !== 'undefined' && msg.room != null) {
            roomService.leave(msg.room, userService.getNick(msg.user));
            socket.leave(msg.room);
            io.sockets.in(msg.room).emit('announce', {
              user: userService.getNick(msg.user),
              content: 'left.'
            });
            socket.emit('chat message', { room: null, user: '', content: 'You left ' + msg.room });
          } else {
            socket.emit('chat message', { user: '', content: 'You are not currently in a room' });
          }
        break;
        case messageUtility.commandList.MEMBERS:
          socket.emit('chat message', { user: '', content: JSON.stringify(roomService.listMembers(msg.room || '')) });
        break;
        case messageUtility.commandList.ROOMS:
          socket.emit('chat message', { user: '', content: JSON.stringify(roomService.listRooms()) });
        break;
        default:
          socket.emit('chat message', { user: '', content: 'Command is not yet implemented' });
      }
    } else {
      msg.user = userService.getNick(msg.user);
      // There are no global rooms in this application otherwise this would be io.emit
      if (typeof msg.room !== 'undefined' && msg.room) {
        io.sockets.in(msg.room).emit('chat message', msg);
      } else {
        socket.emit('chat message', msg);
      }
    }
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

});

io.listen(startServer(app));
