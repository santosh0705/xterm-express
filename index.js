/* eslint-env node */

'use strict'

var debug = require('debug')('xterm-express:server')
var fs = require('fs')
var net = require('net')

var server = require('./lib/server-io').server
var io = require('./lib/server-io').io
var config = require('./lib/config')

// Listen on provided port and network interfaces.
var port = config.listen.port
var ip = config.listen.ip
server.listen(port, ip)

// Callbacks for HTTP server events.
server.on('error', onError)
server.on('listening', onListening)

// Signal handlers.
process.on('SIGTERM', () => cleanup())
process.on('SIGINT', () => cleanup())

// Event listener for HTTP server "error" event.
function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      if (typeof port === 'string') {
        console.log(bind + ' exists, cheking if it in use...')
        var client = new net.Socket()
        client.on('error', e => {
          // handle error trying to talk to server
          if (e.code === 'ECONNREFUSED') {
            // No other server listening
            console.log(bind + ' is not in use, removing it...')
            fs.unlinkSync(port)
            server.listen(port)
          }
        })
        client.connect({ path: port }, () => {
          console.error(bind + ' is in use, giving up')
          process.exit(1)
        })
      } else {
        console.error(bind + ' is already in use')
        process.exit(1)
      }
      break
    default:
      throw error
  }
}

// Event listener for HTTP server "listening" event.
function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'ip ' + addr.address + ', port ' + addr.port
  debug('Listening on ' + bind)
}

// Cleaning up on termination.
function cleanup () {
  io.close()
  server.close()
}

module.exports = server
