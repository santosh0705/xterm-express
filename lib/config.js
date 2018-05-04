/* eslint-env node */

// Read app configuration.
var configFile = process.env.CONFIG_FILE || '../config.json'
var config = require(configFile)

// Get ip and port from environment or configuration.
var ip = process.env.IP || config.listen.ip || '127.0.0.1'
var port = normalizePort(process.env.PORT || config.listen.port || '3000')
config.listen.ip = ip
config.listen.port = port

// Check if services are configured
config.service = config.service || {}
if (Object.keys(config.service).length === 0) {
  console.error('No service configuration found!')
  process.exit(1)
}

// Normalize a port into a number, string, or false.
function normalizePort (val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

module.exports = config
