/* eslint-env node */

// Module dependencies.
var socketIo = require('socket.io')
var config = require(process.env.CONFIG_FILE || '../config')
var spawn = require('./spawn')

var socket = (server, options) => {
  var io = socketIo(server, options)

  io.on('connection', socket => {
    function renderData (str, options) {
      for (var k in options) {
        str = str.replace(new RegExp('{' + k + '}', 'g'), options[k])
      }
      return str
    }

    function removeListeners () {
      socket
        .removeAllListeners('disconnect')
        .removeAllListeners('resize')
        .removeAllListeners('input')
    }

    socket.emit('terminal options', config.terminal)

    var serviceParams = config.service[socket.handshake.query.service]
    var args = serviceParams.args || []
    var cwd = serviceParams.cwd || ''
    var env = serviceParams.env || process.env
    var askusername = serviceParams.askusername || false

    new Promise((resolve, reject) => {
      if (askusername) {
        var buf = ''
        var timer = setTimeout(() => reject(new Error('Timed out due to inactivity.')), 60000)

        socket.emit('data', 'Enter username: ')
        socket.on('input', data => {
          clearTimeout(timer)
          timer = setTimeout(() => reject(new Error('Timed out due to inactivity.')), 60000)

          switch (data) {
            case '\x03':
              socket.emit('data', '^C')
              clearTimeout(timer)
              reject(new Error('Terminated by user.'))
              break
            case '\x7f':
            case '\b':
              if (buf.length > 0) {
                socket.emit('data', '\b ')
                data = '\b'
                buf = buf.slice(0, -1)
              } else {
                data = '\x07' // send bell sound
              }
              break
            case '\r':
            case '\n':
              data = '\r\n'
              socket.removeAllListeners('input')
              clearTimeout(timer)
              resolve(buf)
              break
            default:
              /* eslint-disable-next-line */
              data = data.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
              buf += data
          }
          socket.emit('data', data)
        })
      } else {
        resolve('')
      }
    }).then(data => { // promise resolve
      var username = data
      var options = {
        HOME: process.env.HOME,
        USERNAME: username
      }

      cwd = renderData(cwd, options)

      // URL is only available for args
      options['URL'] = socket.handshake.query.url

      var cmdArgs = args.map(x => {
        return renderData(x, options)
      })

      var term = spawn(serviceParams.command, cmdArgs, cwd, env)
      socket.emit('title', 'Xterm Express')

      socket
        .on('disconnect', socket => {
          removeListeners()
          term.end()
          term.destroy()
        })
        .on('resize', size => term.resize(size.cols, size.rows))
        .on('input', input => term.write(input))
      term.on('data', data => socket.emit('data', data))
      term.on('exit', code => {
        socket.emit('exited', 'Service terminated.')
        removeListeners()
        socket.disconnect()
      })
    }, err => socket.emit('exited', err.message)) // promise reject
  })
  return io
}

module.exports = socket
