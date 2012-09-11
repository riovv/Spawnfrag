/**
 * helpers.js
 * 
 * A collection of helper methods specific to Spawnfrag.
 */

var quakeworld = require('quakeworld'),
    PKG = require('./package.json'),
    SERVER_METADATA = require('./servers.json'),
    qw,
    // Private functions (non exported)
    extendQuakeworldData;

/**
 * pkg {}
 *
 * Expose package info.
 * Useful way to get description and version for example.
 */
exports.pkg = PKG;

/**
 * qw {}
 *
 * Helper methods to get server data using quakeworld 
 * (should in the future get data from cache if available)
 */
qw = {
  // Default status argument (bitmap), see quakeworld module for specification.
  statusArgs: [31]
};

/**
 * qw.address (host, [separator=':'])
 *
 * Get address from host 'pangela.se:28001' => 'pangela.se'
 */
qw.address = function (host, separator) {
  return host.split(separator || ':')[0];
};

/**
 * qw.port(host, [separator=':'])
 *
 * Get port from host 'pangela.se:28001' => 28001
 */
qw.port = function (host, separator) {
  return parseInt(host.split(separator || ':')[1], 10);
};

/**
 * extendQuakeworldData (data, [obj])
 *
 * A private function to parse data recieved from quakeworld server and extend the object
 * with some more information. 
 *
 * Metadata from server config.
 * A couple of calculated properties like: type, clients etc.
 */
 // TODO: Guess the gametype
extendQuakeworldData = function (data) {
  var key,
      metadata = SERVER_METADATA[data.id];

  // data.players = Players connected to the server
  // Filter out all spectators from the player list (frags = 'S')
  data.players = data.players.filter(function (p) {
    return (p.frags !== 'S');
  });

  // data.clients = Number of clients connected
  data.clients = data.players.length;

  // data.clients_status = empty|open|full depending on
  // Number of clients connected and maxclients allowed
  data.clients_status = (data.clients == 0) ? 'empty' : (data.clients < data.maxclients) ? 'open' : 'full';
  
  // Override/Append properties from metadata
  for (key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      data[key] = metadata[key];
    }
  }
};

/**
 * qw.status (host, callback)
 *
 * Get status from a single server.
 */
qw.status = function (host, callback) {
  quakeworld(qw.address(host), qw.port(host), 'status', qw.statusArgs, function (err, data) {
    if (err) return callback({id: host, err: err });

    // Set the id of this server, equals to host.
    data.id = host;
    // Extend data object with additional information.
    extendQuakeworldData(data);

    callback(null, data);
  });
};

/**
 * qw.statuses (hosts, callback)
 *
 * Get status from multiple servers and pass data
 * to the callback when status has been recieved for everyone.
 */
qw.statuses = function (hosts, callback) {
  var i,
      n = hosts.length,
      statuses = [];

  for (i = 0; i < n; i++) {
    qw.status(hosts[i], function (err, data) {
      statuses.push((err) ? err : data);

      // Recieved response for everyone.
      if (statuses.length === hosts.length) {
        callback(statuses);
      }
    });
  }
};

/**
 * qw.statusesAll (callback)
 *
 * Shorthand to get status from all servers in server config and pass data
 * to the callback when status has been recieved for everyone.
 */
qw.statusesAll = function (callback) {
  qw.statuses(Object.keys(SERVER_METADATA), callback);
};

exports.qw = qw;