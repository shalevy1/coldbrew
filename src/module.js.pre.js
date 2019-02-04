(function() {

class JavaScriptError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, JavaScriptError);
  }
}

class PythonError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, PythonError);
    this.errorData = MODULE_NAME.getExceptionInfo();
  }
}

class HTTPResponseError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, HTTPResponseError);
  }
}

class HTTPAbortError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, HTTPAbortError);
  }
}

class HTTPTimeoutError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, HTTPTimeoutError);
  }
}

const parseUrl = (string, prop) =>  {
  const a = document.createElement('a'); 
  a.setAttribute('href', string);
  const {host, hostname, pathname, port, protocol, search, hash} = a;
  const origin = `${protocol}//${hostname}${port.length ? `:${port}`:''}`;
  return prop ? eval(prop) : {origin, host, hostname, pathname, port, protocol, search, hash}
}

function randid() {
  return 'rxxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function base64decode(string) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      // Regular expression to check formal correctness of base64 encoded strings
      b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
    // atob can work with strings with whitespaces, even inside the encoded part,
    // but only \t, \n, \f, \r and ' ', which can be stripped.
    string = String(string).replace(/[\t\n\f\r ]+/g, "");
    if (!b64re.test(string))
        throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");

    // Adding the padding if missing, for semplicity
    string += "==".slice(2 - (string.length & 3));
    var bitmap, result = "", r1, r2, i = 0;
    for (; i < string.length;) {
        bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
                | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));

        result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
                : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
    }
    return result;
}

function sendRequest(method, url, body, headers, timeout, binary = false) {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();
    if (timeout !== null) {
      request.timeout = timeout * 1000;
    }
    if (binary) {
      request.responseType = "arraybuffer";
    }
    request.open(method, url, true);
    Object.keys(headers).forEach(function(header) {
      if (!["host", "connection", "user-agent", "accept-encoding", "content-length"].includes(header.toLowerCase())) {
        request.setRequestHeader(header, headers[header]);
      }
    });
    request.onreadystatechange = function () {
      var headers = this.getAllResponseHeaders();
      if (this.readyState === 4) {
        var responseContent  = !binary ? this.responseText : this.response;
        var responseLength = !binary ? responseContent.length : responseContent.byteLength;
        headers += 'content-length: '+responseLength.toString()+'\r\n';
        if (this.status >= 200 && this.status < 400) {
          resolve({
            status: this.status,
            statusText: this.statusText,
            responseText: responseContent,
            responseType: this.responseType,
            responseURL: this.responseURL,
            headers: headers,
          });
        } else {
          var e = new HTTPResponseError("The request has failed.");
          e.errorData = {
            status: this.status,
            statusText: this.statusText,
            responseText: responseContent,
            responseType: this.responseType,
            responseURL: this.responseURL,
            headers: headers,
          }
          reject(e);
        }
      }
    };
    request.ontimeout = function () {
      var e = new HTTPTimeoutError("The request has timed out.");
      e.errorData = {
        status: 0,
        statusText: "",
        responseText: "",
        responseType: "",
        responseURL: url,
        headers: this.getAllResponseHeaders(),
      }
      reject(e);
    };
    request.onabort = function () {
      var e = new HTTPAbortError("The request has been aborted.");
      e.errorData = {
        status: 0,
        statusText: "",
        responseText: "",
        responseType: "",
        responseURL: url,
        headers: this.getAllResponseHeaders(),
      }
      reject(e);
    };
    request.send(body);
  });
}

var global = (typeof window === 'object') ? window : global;
global._coldbrew_internal_global = global;

global._MODULE_NAME_coldbrew_internal_instance = (function() {
  var executed = false;
  var singleton = null;
  return function() {
    if (!executed) {
      executed = true;
      singleton = _MODULE_NAME_coldbrew_internal_();
    }
    return singleton;
  };
})();

global._MODULE_NAME_coldbrew_internal_fs_configure = (function() {
  var executed = false;
  var singleton = {};
  var configured = false;
  var queuedCbs = [];
  return function(sharedHome, sharedTmp, persistHome, persistTmp, browserFSOptions, cb) {
    cb = cb || function() {};
    queuedCbs.push(cb);
    if (!executed) {
      executed = true;
      singleton['/.slots'] = 0;
      if (sharedHome || persistHome) {
        singleton['/home'] = 0;
      }
      if (sharedTmp || persistTmp) {
        singleton['/tmp'] = 0;
      }
      if (sharedHome) {
        singleton['/home'] |= 1;
      }
      if (sharedTmp) {
        singleton['/tmp'] |=  1;
      }
      if (persistHome) {
        singleton['/home'] |=  2;
      }
      if (persistTmp) {
        singleton['/tmp'] |= 2;
      }
      if (BROWSERFS) {
        // Handle BrowserFS here        
        Object.keys(finalizedOptions).forEach(function(mountPoint) {
          singleton[mountPoint] = 0;
        });
        configured = true;
        while (queuedCbs.length > 0) {
          queuedCbs.pop()(null, singleton);
        }
      } else {
        configured = true;
        while (queuedCbs.length > 0) {
          queuedCbs.pop()(null, singleton);
        }
      }
    } else {
      if (configured) {
        cb(null, singleton);
        queuedCbs = [];
      }
    }
  };
})();

var MODULE_NAME = {
  _convertError: function (e) {
    return {
      '_internal_coldbrew_error': true,
      'type': e.constructor.name,
      'name': e.name,
      'message': e.message,
      'stack': e.stack,
      'data': (typeof e.errorData !== 'undefined') ? e.errorData : null,
    };
  },
  _try: function(func) {
    try {
      return func();
    } catch (e) {
      return MODULE_NAME._convertError(e);
    }
  },
  _parseUrl: parseUrl,
  loaded: false,
  exited: false,
  forwardOut: true,
  forwardErr: true,
  _queuedOnReady: [],
  standardInBuffer: 'This is the first line of standard input.\nTo override this, either set `MODULE_NAME.standardInBuffer` to the full standard input OR set `MODULE_NAME.onStandardInRead(int size)` to respond interactively to standard input reads OR set `MODULE_NAME.onStandardInReadAsync(int size)` to respond interactively and asynchronously (by returning a Promise).',
  _standardInTell: 0,
  _resumeWarn: function(warn=true) { if (warn) { return MODULE_NAME.run('Coldbrew._warn("The Coldbrew Python interpreter is not currently sleeping. Resuming has no effect.")'); } else return 0; },
  resume: function(...args) { return MODULE_NAME._resumeWarn(...args); },
  _mountFS: function(Module) {},
  preInit: function(Module) {},
  preRun: function(Module) {},
  onStandardOut: function(text) { console.log(text); },
  onStandardErr: function(text) { console.warn(text); },
  onStandardInRead: function(size) { 
    var read = MODULE_NAME.standardInBuffer.substring(MODULE_NAME._standardInTell, MODULE_NAME._standardInTell+size);
    MODULE_NAME._standardInTell += size;
    return read;
  },
  onStandardInReadAsync: function(size) { 
    return Promise.resolve(MODULE_NAME.onStandardInRead(size));
  },
  _onRuntimeInitialized: function(Module) {
    Module.callMain();
    MODULE_NAME._ORIGINAL_ENV_ = Object.assign({}, Module.ENV);
    var oldLoaded = MODULE_NAME.loaded;
    MODULE_NAME.loaded = true;
    if (!oldLoaded) {
      MODULE_NAME._queuedOnReady.forEach(function(onReady) {
        onReady(null, MODULE_NAME);
      });
      MODULE_NAME._queuedOnReady = [];
    }
  },
  _fsReady: function(cb) {
    // If the user already called configure FS, these "false, false, {}" parameters
    // will get ignored, if the user hasn't, "false, false, {}" will be used, but will
    // have no effect.
    global._MODULE_NAME_coldbrew_internal_fs_configure(false, false, false, false, {}, function(err, mountPoints) {
      MODULE_NAME._mountFS = function(Module) {
        var prefix = '.filesystem';
        Module.FS.createFolder(Module.FS.root, prefix, true, true);
        Object.keys(mountPoints).forEach(function(mountPoint) {
          var fsNamespace = 'coldbrew_fs_';
          var isShared = mountPoints[mountPoint] & 1;
          var isPersist = mountPoints[mountPoint] & 2;
          var filesystem = Module.FS.filesystems.MEMFS;
          if (!isShared) {
            fsNamespace += 'MODULE_NAME_';
          }
          if (isPersist) {
            filesystem = Module.FS.filesystems.IDBFS;
          }
          try {
            Module.FS.rmdir(mountPoint+'/web_user');
          } catch (e) {};
          try {
            Module.FS.rmdir(mountPoint);
          } catch (e) {};
          Module.FS.createFolder(Module.FS.root, '/'+prefix+'/'+fsNamespace+mountPoint.trim().substring(1), true, true);
          var old = filesystem.mount;
          if (mountPoints[mountPoint]) {
            if (!global.ColdbrewMountPointNodes) {
              global.ColdbrewMountPointNodes = {};
            }
            if (isShared) {
              filesystem.mount = function(...args) { 
                var mountPoint = args[0].mountpoint;
                global.ColdbrewMountPointNodes[mountPoint] = global.ColdbrewMountPointNodes[mountPoint] || old(...args);
                return global.ColdbrewMountPointNodes[mountPoint]; 
              };
            }
            Module.FS.mount(filesystem, {}, '/'+prefix+'/'+fsNamespace+mountPoint.trim().substring(1));
          } else if (BROWSERFS) {
            // Handle BrowserFS here
          }
          Module.FS.symlink('/'+prefix+'/'+fsNamespace+mountPoint.trim().substring(1), mountPoint);
        });
      }
      cb(err, mountPoints);
    });
  },
  configureFS: function(options = {}, cb) {
    var defaultOptions = {
      sharedHome: false,
      sharedTmp: false,
      persistHome: false,
      persistTmp: false,
      browserFSOptions: {},
    };
    var finalizedOptions = Object.assign({}, defaultOptions, options);
    global._MODULE_NAME_coldbrew_internal_fs_configure(
      finalizedOptions.sharedHome,
      finalizedOptions.sharedTmp,
      finalizedOptions.persistHome,
      finalizedOptions.persistTmp,
      finalizedOptions.browserFSOptions,
      cb
    );
  },
  load: function(arg1, arg2) {
    if (window.location.protocol === 'file:') {
      throw new Error("You are trying to run this HTML file under a `file://` URL. This is not supported. You must run this file under a HTTP server under a `http://` or `https://` protocol. On most computers, you can do this by opening terminal, navigating to where this HTML file is, and running either `python -m SimpleHTTPServer` for Python 2 or `python3 -m http.server` for Python 3. Then, you can navigate to `http://localhost:8000` in a web browser to see this file. Alternatively, if you have downloaded the Coldbrew source code, you can just run `./serve.sh` from the project root and navigate to `http://localhost:8000` in a web browser to see this file after building.");
    } 
    var onReadyFunc = null;
    var options = {};
    if (!arg2 && typeof arg1 == 'function') {
      onReadyFunc = arg1;
    } else if (!arg2 && typeof arg1 == 'object') {
      options = arg1;
    } else {
      options = arg1;
      onReadyFunc = arg2;
    }
    var defaultOptions = {
      fsOptions: {},
      hideWarnings: false,
      monitorFileUsage: false,
      asyncYieldRate: null,
    };
    var finalizedOptions = Object.assign({}, defaultOptions, options);
    if (finalizedOptions.fsOptions) {
      MODULE_NAME.configureFS(finalizedOptions.fsOptions);
    }
    MODULE_NAME._emterpreterFile.then(function(emterpreterFileResponse) {
      MODULE_NAME._emterpreterFileResponse = emterpreterFileResponse;
      MODULE_NAME._fsReady(function(err, mountPoints) {
        MODULE_NAME._slots = {};
        MODULE_NAME.PythonError = PythonError;
        MODULE_NAME._textDecoder = new TextDecoder("utf-8");
        MODULE_NAME._usedFiles = new Set();
        MODULE_NAME.mountPoints = mountPoints;
        MODULE_NAME.Module = global._MODULE_NAME_coldbrew_internal_instance();
        MODULE_NAME.pyversion =  "PYVERSION";
        MODULE_NAME.version =  "COLDBREW_VERSION";
        MODULE_NAME.getAsyncYieldRate = MODULE_NAME.Module.cwrap('export_getAsyncYieldRate', 'number', []);
        MODULE_NAME.setAsyncYieldRate = MODULE_NAME.Module.cwrap('export_setAsyncYieldRate', null, ['number']);
        MODULE_NAME._run = MODULE_NAME.Module.cwrap('export_run', 'number', ['string']);
        MODULE_NAME.run = function(script) {
          var ret = MODULE_NAME._run(script);
          if (ret != 0) {
            throw new MODULE_NAME.PythonError(MODULE_NAME.getExceptionInfo().value);
          }
          return ret;
        };
        if (!SMALL_BUT_NO_ASYNC) {
          MODULE_NAME._runAsync = MODULE_NAME.Module.cwrap('export_runAsync', 'number', ['string'], {
            async: true,
          });
          MODULE_NAME.runAsync = function(script) {
            var retp = MODULE_NAME._runAsync(script);
            return retp.then(function(ret) {
              if (ret != 0) {
                return Promise.reject(new MODULE_NAME.PythonError(MODULE_NAME.getExceptionInfo().value));
              } else {
                return Promise.resolve(ret);
              }
            }); 
          };
        }
        MODULE_NAME._runFile = MODULE_NAME.Module.cwrap('export__runFile', 'number', ['string']);
        if (!SMALL_BUT_NO_ASYNC) {
          MODULE_NAME._runFileAsync = MODULE_NAME.Module.cwrap('export__runFileAsync', 'number', ['string'], {
            async: true,
          });
        }
        MODULE_NAME.getVariable = function(expression) {
          var uid = randid();
          MODULE_NAME.run('Coldbrew.run("_coldbrew_internal_global.MODULE_NAME._slots.'+uid+' = "+Coldbrew.json.dumps(Coldbrew.json.dumps('+expression+')))');
          var ret = (typeof MODULE_NAME._slots[uid] !== 'undefined') ? JSON.parse(MODULE_NAME._slots[uid]) : null;
          delete MODULE_NAME._slots[uid];
          return ret;
        };
        if (!SMALL_BUT_NO_ASYNC) {
          MODULE_NAME.getVariableAsync = function(expression) {
            var uid = randid();
            return MODULE_NAME.runAsync('Coldbrew.run("_coldbrew_internal_global.MODULE_NAME._slots.'+uid+' = "+Coldbrew.json.dumps(Coldbrew.json.dumps('+expression+')))').then(function() {
              var ret = (typeof MODULE_NAME._slots[uid] !== 'undefined') ? JSON.parse(MODULE_NAME._slots[uid]) : null;
              delete MODULE_NAME._slots[uid];
              return ret;
            });
          };
        }
        MODULE_NAME.getExceptionInfo = function() {
          return MODULE_NAME.getVariable('Coldbrew._exception');
        };
        MODULE_NAME.runFunction = function(functionExpression, ...args) {
          return MODULE_NAME.getVariable(functionExpression+'('+args.map(arg => JSON.stringify(arg)).join(',')+')');
        };
        if (!SMALL_BUT_NO_ASYNC) {
          MODULE_NAME.runFunctionAsync = function(functionExpression, ...args) {
            return MODULE_NAME.getVariableAsync(functionExpression+'('+args.map(arg => JSON.stringify(arg)).join(',')+')');
          };
        }
        MODULE_NAME.getenv = function() { return MODULE_NAME.Module.ENV };
        MODULE_NAME.setenv = MODULE_NAME.Module.cwrap('export_setenv', 'number', ['string', 'string']);
        MODULE_NAME.unsetenv = MODULE_NAME.Module.cwrap('export_unsetenv', 'number', ['string']);
        MODULE_NAME.getcwd = MODULE_NAME.runFunction.bind(MODULE_NAME, 'Coldbrew._getcwd');
        MODULE_NAME.chdir = MODULE_NAME.Module.cwrap('export_chdir', 'number', ['string']);
        MODULE_NAME.listFiles = function(path='/') {
          return MODULE_NAME.Module.FS.readdir(path)
            .filter(function(file) {
              return file !== '.' && file !== '..';
            })
            .map(function (file) {
              var analyzed = MODULE_NAME.Module.FS.analyzePath(path+'/'+file);
              return {
                name: file,
                isFolder: analyzed.object.isFolder,
                isFile: !analyzed.object.isFolder,
                mode: analyzed.object.mode,
                timestamp: analyzed.object.timestamp,
              }
            });
        };
        MODULE_NAME.createFolder = function(path) {
          return MODULE_NAME.Module.FS.mkdirTree(path);
        };
        MODULE_NAME.addFile = function(path, data) {
          if (path.indexOf('/') >= 0) {
            MODULE_NAME.Module.FS.mkdirTree(path.split('/').slice(0,-1).join("/"));
          }
          MODULE_NAME.Module.FS.writeFile(path, data);
        };
        if (JSZIP) {
          MODULE_NAME.addFilesFromZip = function(path, urlToZip) {
            return new JSZip.external.Promise(function (resolve, reject) {
              JSZipUtils.getBinaryContent(urlToZip, function(err, data) {
                  if (err) {
                      reject(err);
                  } else {
                      resolve(data);
                  }
              });
            })
            .then(JSZip.loadAsync)
            .then(function(zip) {
              return Promise.all(Object.keys(zip.files).map(function(file) {
                if (!zip.files[file].dir) {
                  return zip.files[file].async("string").then(function(textData) {
                    MODULE_NAME.addFile(path+'/'+file, textData);
                  });
                } else {
                  return Promise.resolve(undefined);
                }
              }));
            });
          };
        }
        MODULE_NAME.readFile = function(path) {
          return MODULE_NAME._textDecoder.decode(MODULE_NAME.Module.FS.readFile(path));
        };
        MODULE_NAME.readBinaryFile = function(path) {
          return MODULE_NAME.Module.FS.readFile(path);
        };
        MODULE_NAME.pathExists = function(path) {
          var analyzed = MODULE_NAME.Module.FS.analyzePath(path);
          var exists = analyzed.exists;
          if (!exists) {
            return null;
          } else {
            return {
                isFolder: analyzed.object.isFolder,
                isFile: !analyzed.object.isFolder,
                mode: analyzed.object.mode,
                timestamp: analyzed.object.timestamp,
            };
          }
        };
        MODULE_NAME.deletePath = function(path) {
          var deleteHelper = function(path) {
            if (MODULE_NAME.Module.FS.analyzePath(path).object 
              && MODULE_NAME.Module.FS.analyzePath(path).object.isFolder) {
              var fileList = MODULE_NAME.listFiles(path);
              if (fileList.length > 0) {
                fileList.forEach(function (file) {
                  deleteHelper(path+'/'+file.name);
                });
              }
              MODULE_NAME.Module.FS.rmdir(path);
            } else {
              MODULE_NAME.Module.FS.unlink(path);
            }
          };
          if (path.length > 0 && path.slice(-1) === '/') {
            path = path.slice(0, -1);
          }
          deleteHelper(path);
          return true;
        };
        MODULE_NAME.saveFiles = function() {
          var isPersistable = Object.keys(mountPoints).map(function(mountPoint) {
            var isPersist = mountPoints[mountPoint] & 2;
            return !!isPersist;
          }).includes(true);
          return new Promise(function (resolve, reject) {
            if (isPersistable) {
              return MODULE_NAME.Module.FS.syncfs(0, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
              });
            } else {
              reject(new Error("The file system was not configured to persist any paths."));
            }
          });
        };
        MODULE_NAME.loadFiles = function() {
          var isPersistable = Object.keys(mountPoints).map(function(mountPoint) {
            var isPersist = mountPoints[mountPoint] & 2;
            return !!isPersist;
          }).includes(true);
          return new Promise(function (resolve, reject) {
            if (isPersistable) {
              return MODULE_NAME.Module.FS.syncfs(1, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
              });
            } else {
              reject(new Error("The file system was not configured to persist any paths."));
            }
          });
        };
        MODULE_NAME.runFile = function(path, options={}) {
          var oldcwd = MODULE_NAME.getcwd();
          var defaultOptions = {
            cwd: null,
            args: [],
            env: {},
          };
          var finalizedOptions = Object.assign({}, defaultOptions, options);
          if (finalizedOptions.cwd) {
            MODULE_NAME.chdir(finalizedOptions.cwd);
          }
          MODULE_NAME.run('Coldbrew._clear_argv()');
          MODULE_NAME.runFunction('Coldbrew._append_argv', path);
          finalizedOptions.args.forEach(function(arg) {
            MODULE_NAME.runFunction('Coldbrew._append_argv', arg);
          });
          Object.keys(finalizedOptions.env).forEach(function(key) {
            MODULE_NAME.setenv(key, finalizedOptions.env[key]);
          });
          var ret = MODULE_NAME._runFile(path);
          MODULE_NAME.chdir(oldcwd);
          return ret;
        };
        if (!SMALL_BUT_NO_ASYNC) {
          MODULE_NAME.runFileAsync = function(path, options={}) {
            var oldcwd = MODULE_NAME.getcwd();
            var defaultOptions = {
              cwd: null,
              args: [],
              env: {},
            };
            var finalizedOptions = Object.assign({}, defaultOptions, options);
            if (finalizedOptions.cwd) {
              MODULE_NAME.chdir(finalizedOptions.cwd);
            }
            MODULE_NAME.run('Coldbrew._clear_argv()');
            MODULE_NAME.runFunction('Coldbrew._append_argv', path);
            finalizedOptions.args.forEach(function(arg) {
              MODULE_NAME.runFunction('Coldbrew._append_argv', arg);
            });
            Object.keys(finalizedOptions.env).forEach(function(key) {
              MODULE_NAME.setenv(key, finalizedOptions.env[key]);
            });
            var retp = MODULE_NAME._runFileAsync(path);
            return retp.then(function(ret) {
              MODULE_NAME.chdir(oldcwd);
              return ret;
            });
          };
        }
        MODULE_NAME.resetenv = function() {
          Object.keys(MODULE_NAME.getenv()).forEach(function(key) {
            if (typeof MODULE_NAME._ORIGINAL_ENV_[key] !== 'undefined') {
              MODULE_NAME.setenv(key, MODULE_NAME._ORIGINAL_ENV_[key]);
            } else {
              MODULE_NAME.unsetenv(key);
            }
          });
        };
        MODULE_NAME._initializer = function() {
          if (finalizedOptions.asyncYieldRate !== null && typeof finalizedOptions.asyncYieldRate !== 'undefined') {
            MODULE_NAME.setAsyncYieldRate(finalizedOptions.asyncYieldRate);
          }
          MODULE_NAME.run('Coldbrew._clear_argv()');
          MODULE_NAME.runFunction('Coldbrew._append_argv', 'MODULE_NAME_LOWER.py');
          if (finalizedOptions.hideWarnings) {
            MODULE_NAME.setenv("COLDBREW_WARNINGS", Number(!finalizedOptions.hideWarnings).toString());
          }
        };
        MODULE_NAME._reset = MODULE_NAME.Module.cwrap('export_reset', null, []);
        MODULE_NAME.reset = function() {
          MODULE_NAME._standardInTell = 0;
          var ret = MODULE_NAME._reset();
          MODULE_NAME._initializer();
          return ret;
        };
        if (finalizedOptions.monitorFileUsage) {
          console.warn('Coldbrew is monitoring file usage...use `MODULE_NAME.getUsedFiles()` after running through all relevant code paths in your Python program.');
          var _oldOpen = MODULE_NAME.Module.FS.open.bind(MODULE_NAME.Module.FS);
          MODULE_NAME.Module.FS.open = function(...args) {
            if (args[0].startsWith && args[0].startsWith('/usr/local/lib/python')) {
              MODULE_NAME._usedFiles.add(args[0]);
            }
            return _oldOpen(...args)
          };
        }
        MODULE_NAME.getUsedFiles = function() {
          return Array.from(MODULE_NAME._usedFiles).join('\n');
        };
        MODULE_NAME.onReady(function() {
          MODULE_NAME._initializer();
        });
        MODULE_NAME.onReady(onReadyFunc);
      });
    });
  },
  onReady: function(onReadyFunc) {
    if (onReadyFunc) {
      if (MODULE_NAME.loaded) {
        onReadyFunc(null, MODULE_NAME);
      } else {
        MODULE_NAME._queuedOnReady.push(onReadyFunc);
      }
    }
  },
  _sendRequest: sendRequest,
  _emterpreterFile: (!SMALL_BUT_NO_ASYNC) ? sendRequest('GET', parseUrl(document.currentScript.src, "origin")+parseUrl(document.currentScript.src, "pathname").split("/").slice(0, -1).join("/")+'/MODULE_NAME_LOWER.asm.embin', null, {}, true, true) : Promise.resolve(null),
};

if (typeof module !== 'undefined') module.exports = MODULE_NAME;
if (typeof define === 'function') define(MODULE_NAME);
if (typeof window === 'object') window.MODULE_NAME = MODULE_NAME;
global.MODULE_NAME = MODULE_NAME;

})();