/* eslint-env browser */

'use strict'

import './favicon.ico'
import './style.scss'

import io from 'socket.io-client'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

function hideOverlay () {
  overlay.self.style.display = 'none'
}

function showOnlyMessage (msg) {
  overlay.modal.header.innerHTML = 'Message'
  overlay.modal.content.innerHTML = msg
  overlay.modal.content.classList.remove('error')
  overlay.modal.buttons.style.display = 'none'
  overlay.self.style.display = 'flex'
}

function showMessage (msg) {
  showOnlyMessage(msg)
  overlay.modal.buttons.style.display = 'block'
}

function showError (msg) {
  overlay.modal.header.innerHTML = 'Error!'
  overlay.modal.content.innerHTML = msg
  overlay.modal.content.classList.add('error')
  overlay.modal.buttons.style.display = 'block'
  overlay.self.style.display = 'flex'
}

var fullscreen = {
  request: () => {
    var docElm = document.documentElement
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen()
    } else if (docElm.msRequestFullscreen) {
      docElm = document.body /* overwrite the element (for IE) */
      docElm.msRequestFullscreen()
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen()
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen()
    }
  },

  exit: () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen()
    }
  },

  toggle: () => {
    if (fullscreen.isFullScreen()) {
      fullscreen.exit()
    } else {
      fullscreen.request()
    }
  },

  isEnabled: () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled || document.msFullscreenEnabled || document.documentElement.webkitRequestFullscreen),

  isFullScreen: () => Boolean(document.fullscreenElement || document.msFullscreenElement || document.mozFullScreen ||
    document.webkitIsFullScreen),

  on: (event, callback) => {
    if (event === 'change') {
      document.addEventListener('fullscreenchange', callback, false)
      document.addEventListener('msfullscreenchange', callback, false)
      document.addEventListener('mozfullscreenchange', callback, false)
      document.addEventListener('webkitfullscreenchange', callback, false)
    }
  }
}

Terminal.applyAddon(fit)
var term = new Terminal()
var socketPath = ''
var service = ''
var overlay = {}

// Attach 'Shift + Ctrl + C' key event handler
term.attachCustomKeyEventHandler(e => {
  if (e.shiftKey && e.ctrlKey && e.keyCode === 67) {
    e.preventDefault()
    document.execCommand('copy')
    return false
  }
  return true
})

function init () {
  overlay = {
    self: document.getElementById('overlay'),
    modal: {
      self: document.getElementById('modal'),
      header: document.getElementById('modal_header'),
      content: document.getElementById('modal_content'),
      buttons: document.getElementById('modal_btns')
    }
  }
  document.getElementById('reconnect_btn').addEventListener('click', () => reconnect(), false)
  if (fullscreen.isEnabled()) {
    fullscreen.on('change', () => {
      if (fullscreen.isFullScreen()) {
        document.getElementById('fs_btn').classList.add('flip')
      } else {
        document.getElementById('fs_btn').classList.remove('flip')
      }
    })
    document.getElementById('fs_btn').addEventListener('click', e => {
      fullscreen.toggle()
      e.preventDefault()
    }, false)
    document.getElementById('fs_btn').style.display = 'block'
  }
  term.open(document.getElementById('terminal'))
}

function reconnect () {
  term.writeln('')
  startTerminal()
}

function startTerminal () {
  var errorExist = false
  var servicePath = document.location.pathname.replace(/[^/]+$/g, '')
  var socket = io.connect(document.location.origin, {
    path: servicePath + socketPath,
    reconnectionAttempts: 5,
    query: {
      url: document.location.search,
      service: service
    }
  })

  showOnlyMessage('Connecting...')

  function resizeWindow () {
    term.fit()
    socket.emit('resize', { cols: term.cols, rows: term.rows })
  }

  function unloadHandler (e) {
    e.returnValue = 'Are you sure?'
    return e.returnValue
  }

  function disconnect (reason) {
    socket.off()
    term.off()
    reason = reason || 'Disconnected!'
    window.removeEventListener('resize', resizeWindow, false)
    window.removeEventListener('beforeunload', unloadHandler, false)
    if (errorExist) {
      showError(reason)
    } else {
      showMessage(reason)
    }
    socket.disconnect()
  }

  // socket.io events
  socket
    .once('connect', () => {
      hideOverlay()
      window.addEventListener('resize', resizeWindow, false)
      window.addEventListener('beforeunload', unloadHandler, false)
      resizeWindow()
      term.focus()
    })
    .on('disconnect', reason => {
      errorExist = true
      disconnect(reason)
    })
    .on('exited', data => disconnect(data))
    .on('reconnect_failed', () => {
      errorExist = true
      disconnect('Connection failed!')
    })
    .on('error', data => {
      errorExist = true
      if (data) disconnect(data)
    })
    .on('terminal options', data => {
      Object.keys(data).forEach(function (key) {
        term.setOption(key, data[key])
      })
    })
    .on('data', data => term.write(data))
    .on('title', data => { document.title = data })

  // xterm events
  term.on('data', data => socket.emit('input', data))
  term.on('resize', size => socket.emit('resize', size))
  term.on('title', data => { document.title = data })
}

document.addEventListener('DOMContentLoaded', () => {
  init()
  var xhr = new XMLHttpRequest()
  xhr.open('POST', document.location.pathname, true)
  xhr.onload = e => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText)
        socketPath = data.socketPath
        service = data.service
        startTerminal()
      } else {
        showError(xhr.statusText)
      }
    }
  }
  xhr.onerror = e => showError(xhr.statusText)
  xhr.send()
}, false)
