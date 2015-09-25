// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redisAdapter = require('socket.io-redis');
var socketport = process.env.PORT || 3000;
// var redisserver = process.env.REDIS;
// var redisport = process.env.REDISPORT || 6379;

if(process.env.REDIS_PORT_6379_TCP_ADDR){
  if (process.env.REDIS_PASSWORD) {
    var redis = require('redis').createClient;
    var pub = redis(process.env.REDIS_PORT || 6379, process.env.REDIS_PORT_6379_TCP_ADDR, { auth_pass: process.env.REDIS_PASSWORD });
    var sub = redis(process.env.REDIS_PORT || 6379, process.env.REDIS_PORT_6379_TCP_ADDR, { detect_buffers: true, auth_pass: process.env.REDIS_PASSWORD });
    io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));
  }else{
    io.adapter(redisAdapter({ host: process.env.REDIS_PORT_6379_TCP_ADDR, port: process.env.REDIS_PORT || 6379 }));
  }
  console.log('Redis enabled at ' +  process.env.REDIS_PORT_6379_TCP_ADDR + process.env.REDIS_PORT);
}

server.listen(socketport, function () {
  console.log('Server listening at port %d', socketport);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    console.log("add user " + numUsers + username);
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
