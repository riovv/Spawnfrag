var helpers = require('../helpers.js'),
    SERVER_METADATA = require('../servers.json');
/**
 * GET "/"
 * The home page.
 */
exports.index = function (req, res) {
  res.render('index', { title: helpers.pkg.name });
};

/**
 * GET "/server" and "/servers"
 * A server list of all servers from server config.
 */
exports.servers = function (req, res) {
  helpers.qw.statusesAll(function (data) {
    res.send(data);
  });
  
  //res.render('servers', { title: helpers.pkg.name });
};