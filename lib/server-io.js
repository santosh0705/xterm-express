/* eslint-env node */

'use strict'

// Module dependencies.
var express = require('express')
var compression = require('compression')
var createError = require('http-errors')
var http = require('http')
var logger = require('morgan')
var path = require('path')

var packageConfig = require('../package.json')
var config = require('./config')
var socket = require('./socket')

var app = express()

// View engine setup
app.set('views', path.join(path.dirname(__dirname), 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(compression({ level: 9 }))

// Router setup
var servicePaths = Object.keys(config.service)
app.use(servicePaths, (req, res, next) => {
  if (servicePaths.filter(t => t === req.path).length !== 0) {
    // Execute only if service path matches.
    var webRoot = req.path.replace(/[^/]+$/g, '')
    webRoot = path.relative(webRoot, '/')
    if (webRoot.length > 0) { webRoot += '/' }
    switch (req.method) {
      case 'GET':
        res.render('index', { webRoot: webRoot })
        break
      case 'POST':
        var socketPath = webRoot + 'io'
        res.json({
          socketPath: socketPath,
          service: req.path
        })
        break
      default:
        next()
    }
  } else {
    next()
  }
})
// Static assets setup
app.use('/', express.static(path.join(path.dirname(__dirname), 'client'), { maxAge: config.cache.age }))

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// Error handler
app.use((err, req, res, next) => {
  var status = err.status || 500
  // Set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.locals.message = status + ' ' + err.message
  res.locals.application = { name: packageConfig.name, version: packageConfig.version }

  // Render the error page
  res.status(status)
  res.render('error')
})

// Create HTTP server.
var server = http.createServer(app)

// Start socket.io server.
var io = socket(server, { path: '/io', serveClient: false })

module.exports = {
  server: server,
  io: io
}
