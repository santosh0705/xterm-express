# Xterm Express - Share your terminal over the web

Xterm Express is a tool for sharing terminal over the web, inspired by [wetty][1] written by [Krishna Srinivas][2] and its [fork][3] by [Cian Butler][4]. Xterm Express started from scratch and written in JavaScript using [xterm.js][5], [socket.io][6] and [express][7].
This is designed to run any custom commands and not just restricting to use shell, ssh or login commands.

## Features

- Built on top of socket.io
- Fully featured terminal based on xterm.js
- Configuration file for services and terminal options
- Run any custom command with options
- Configure multiple commands to run on different urls (service paths)

## Installation

Preferred way to install Xterm Express is NPM. It also can be installed from source.

### Install from NPM

To install from npm run:
```bash
$ sudo npm install --production --global --unsafe-perm xterm-express
```

### Install from Source

To install from source run:
```bash
$ git clone git://github.com/santosh0705/xterm-express.git
$ cd xterm-express
$ npm install
$ npm run build:dist
$ sudo npm install --production --global --unsafe-perm xterm-express-<version>.tgz
```

### Running

To run in production you shoud set the `NODE_ENV` environment variable to `production`.
```bash
$ NODE_ENV=production xterm-express
```
To run on system startup you need to create startup script/unit file depending on your system envirnment.

### HTTPS
Xterm Express doesn't support https itself. It is assumed that it will be reverse proxied by Nginx, Apache, HAProxy or similar tool and the https connections will be taken care by it.

## Options

Xterm Express can be customized by options through enviroment variables and/or configuration file.

### Environment Variables

Available environment varialbles are:

`CONFIG_FILE` : Path of the configuration file.

`IP` : IP address on which server will listen.

`PORT` : Port number on which server will listen, or the file path of the unix domain socket. If unix domain socket path is given than IP address will be ignored.

`IP` and `PORT` environment variables are given preference than params in the configuration file.

### Configuration File Options
The configuration are stored in a json file. The default configuration file `config.json` you can find in the module's path. The configuration file `config.json` contains several options which may be specified to customize to your needs. You can have your own custom configuration file stored in any path and the path should be passed to application through environment variable as mentioned above.

Default configuration:
```json
{
  "listen": {
    "port": 3000,
    "ip": "127.0.0.1"
  },
  "cache": {
    "age": 3600000
  },
  "terminal": {
    "cursorBlink": true,
    "cursorStyle": "underline",
    "scrollback": 1000,
    "tabStopWidth": 8,
    "bellStyle": "sound"
  },
  "service": {
    "/": {
      "command": "/bin/login"
    },
    "/ssh/": {
      "cwd": "{HOME}",
      "env": {},
      "askusername": true,
      "command": "/usr/bin/ssh",
      "args": ["{USERNAME}@localhost"]
    }
  }
}
```

In the configuration there are four objects: `listen`, `cache`, `terminal` and `service`.

1. `listen` object set the parameters needed to run the server. `ip` and `port` sets the listening ip address and port number respectively. Server can also listen on unix domain socket and the socket file path should be define in the `port` parameter. If unix domain socket is defined than `ip` parameter will be ignored.

2. `cache` object controls the client's(browser) cache expiry time for static files like script file, stylesheet and images. The `age` parameter will set the maximum caching time of a resource so the browser will only request that resource after the time has passed.

3. `terminal` object configure the terminal behaviour. For more information about the parameters read xterm.js documentation.

4. `service` object configure the command(s) which are going to be served over the web. It contains one or more named object. The name key is the absolute url path where it will be served and the value object configure the command to be run. The `command` parameter is the path of the command binary and it is a required parameter. Other optional parameters are: `cwd`, `env`, `args`, and `askusername`. `env` parameter is an object of one or more name/value pairs which set the environment vaiables for the command to be run. `askusername` parameter is a boolean and if its value is true than the terminal will prompt and ask for username before the command has started and this username can be passed to the command. It sets a variable `USERNAME` which can be used in `cwd` and `args` parameters template. This option is helpful in running command like `ssh` without having any wrapper script. `cwd` set the current working directory of the command to be run and it can be templated. The `HOME` (home directory of the user running the xterm-express app) and the `USERNAME` variables are available in `cwd` template. `args` parameter holds the array of parameters to passed to the command to be run. Values in the `args` parameter array can be templated and addition to `HOME` and `USERNAME` variables `URL` variable is also available. The `URL` variable contains the complete get parameters passed to the service url. It is helpful if you need to pass additional parameters to the command to be run. In such case a wrapper script/binary decode the parameters from the `URL` and run the command with the decoded parameters.

## Development and Contribution

Xterm Express was started by [myself][8] as a replacement to [shellinabox][8] project and inspired by many other similar projects. I would love to receive contributions from everyone! to improve and harden it.

Welcoming all contribution either code, documentation or issues. The development of xterm-express does not require any special tool. All you need is an editor that supports JavaScript/TypeScript and a browser. You will need [Node.js][10] installed locally to get started.

  [1]: https://github.com/krishnasrinivas/wetty
  [2]: https://github.com/krishnasrinivas
  [3]: https://github.com/butlerx/wetty
  [4]: https://github.com/butlerx
  [5]: https://xtermjs.org
  [6]: https://socket.io
  [7]: http://expressjs.com
  [8]: https://github.com/santosh0705
  [9]: https://github.com/shellinabox/shellinabox
  [10]: https://nodejs.org
