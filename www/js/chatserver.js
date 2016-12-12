'use strict';

// Vars
var socket = io();
var user = {};

// Functions
function handleError(err) {
  if (typeof err.status !== 'undefined') {
    switch (err.status) {
      case 400:
        alert('Server requires more information to process your request.');
        break;
      case 401:
        location.href = location.protocol + '//' + location.host + '/login';
        break;
      case 403:
        location.href = location.protocol + '//' + location.host + '/login';
        break;
      case 500:
        alert('Server error', err);
        break;
      default:
        console.error('unknown error ', err);
    }
  }
}

function hasAuth(cb) {
  $.get('/hasAuth', function() {
    cb();
  }).fail(function(err) {
    handleError(err);
  });
}

function loadUser(cb) {
  $.get('/api/fetchUser', function(data) {
    user = data;
    cb(data);
  }).fail(function(err) {
    handleError(err);
  });
}

function showUser(data) {
  var el = document.getElementsByClassName('chatapp-userHeader')[0];
  el.getElementsByClassName('chatapp-userHeader__image')[0].src = data.image.url;
  el.getElementsByClassName('chatapp-userHeader__displayName')[0].textContent = data.displayName;
  el.style.display = 'block';
}

function sendMessage() {
  socket.emit('chat message', {
    room: user.currentRoom || null,
    user: user.emails[0].value,
    content: document.getElementById('message').value
  });
  document.getElementById('message').value = '';
}

function logout() { // jshint ignore:line
  location.href = location.protocol + '//' + location.host + '/logout';
}

function addEvents() {
  document.getElementById('message').addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
        sendMessage();
    }
  });

  // Quick hack to get auto scroll in...
  var interval = setInterval(function () {
    if ($('.chatapp-chatbox').scrollTop() !== $('.chatapp-chatbox')[0].scrollHeight) {
      $('.chatapp-chatbox').scrollTop($('.chatapp-chatbox').scrollTop() + 20);
    } else {
      clearInterval(interval);
    }
  }, 500);
}

function boot() { // jshint ignore:line
  hasAuth(function() {
    loadUser(function(data) {
      showUser(data);
    });
  });
  addEvents();
}

socket.on('chat message', function(msg) {
  if (msg.hasOwnProperty('room')) {
    user.currentRoom = msg.room;
    document.getElementById('roomTitle').textContent = msg.room !== null ? msg.room : 'Lobby (hint: /join aroom)';
  }
  var list = document.createElement('li');
  list.textContent = msg.user + ': ' + msg.content;
  document.getElementById('messages').appendChild(list);
});

socket.on('announce', function(msg) {
  if (msg.room) {
    user.currentRoom = msg.room;
    document.getElementById('roomTitle').textContent = msg.room !== null ? msg.room : 'Lobby (hint: /join aroom)';
  }
  var list = document.createElement('li');
  list.innerHTML = '<i>' + msg.user + ' ' + msg.content + '</i>';
  document.getElementById('messages').appendChild(list);
});
