/* eslint-env node */

// Module dependencies.
var pty = require('node-pty')

var spawn = (command, args, cwd, env) => {
  var forkOptions = {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: cwd,
    env: env
  }

  return pty.spawn(command, args, forkOptions)
}

module.exports = spawn
