var helpers = require('../helpers.js'),
    SERVER_METADATA = require('../servers.json');
/**
 * GET "/"
 * The home page.
 */
exports.index = function (req, res) {
  res.redirect('/servers')
  //res.render('index', { title: helpers.pkg.name });
};

/**
 * GET "/server" and "/servers"
 * A server list of all servers from server config.
 */
exports.servers = function (req, res) {
  res.render('servers', { title: helpers.pkg.name });
};

/**
 * GET "/favourites"
 * A server list of user selected servers.
 */
exports.favourites = function (req, res) {
  res.render('favourites', { title: helpers.pkg.name });
};

/**
 * GET "/status"
 * Get server statuses for all servers in server config as JSON.
 */
exports.status = function (req, res) {
  helpers.qw.statusesAll(function (data) {
    res.json(data);
  });
};

/**
 * GET "/status/:host"
 * Get server status for a single server as JSON.
 */
exports.status_host = function (req, res) {
  var host = unescape(req.params.host);
  helpers.qw.status(host, function (err, data) {
    if (err) res.json({ id: host, err: err})
    res.json(data);
  });
};