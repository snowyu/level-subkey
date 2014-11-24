// Generated by CoffeeScript 1.8.0
(function() {
  var FILTER_EXCLUDED, FILTER_INCLUDED, FILTER_STOPPED, InterfacedObject, NotFoundError, PATH_SEP, ReadError, ReadStream, SUBKEY_SEP, WriteStream, addpre, assignDeprecatedPrefixOption, deprecate, dispatchError, errors, getPathArray, inherits, isFunction, isObject, isString, levelUtil, path, pathArrayToPath, precodec, resolveKeyPath, setImmediate, sublevel, through, util, version, _nut;

  precodec = require("./codec");

  util = require("./util");

  path = require("./path");

  through = require("through");

  addpre = require("./range").addPrefix;

  _nut = require("./nut");

  errors = require("./errors");

  levelUtil = require("levelup/lib/util");

  WriteStream = require("levelup/lib/write-stream");

  ReadStream = require('levelup/lib/read-stream');

  InterfacedObject = require("./InterfacedObject");

  ReadError = errors.ReadError;

  NotFoundError = errors.NotFoundError;

  dispatchError = levelUtil.dispatchError;

  setImmediate = global.setImmediate || process.nextTick;

  deprecate = require("depd")("level-subkey");

  deprecate.assignProperty = function(object, deprecatedProp, currentProp) {
    if (object[deprecatedProp]) {
      this(deprecatedProp + " property, use `" + currentProp + "` instead.");
      if (!object[currentProp]) {
        object[currentProp] = object[deprecatedProp];
      }
      return delete object[deprecatedProp];
    }
  };

  assignDeprecatedPrefixOption = function(options) {
    return deprecate.assignProperty(options, "prefix", "path");
  };

  FILTER_INCLUDED = _nut.FILTER_INCLUDED;

  FILTER_EXCLUDED = _nut.FILTER_EXCLUDED;

  FILTER_STOPPED = _nut.FILTER_STOPPED;

  PATH_SEP = precodec.PATH_SEP;

  SUBKEY_SEP = precodec.SUBKEY_SEP;

  getPathArray = _nut.getPathArray;

  resolveKeyPath = _nut.resolveKeyPath;

  pathArrayToPath = _nut.pathArrayToPath;

  isFunction = util.isFunction;

  isString = util.isString;

  isObject = util.isObject;

  inherits = util.inherits;

  version = require("./package.json").version;

  sublevel = module.exports = function(nut, aCreateReadStream, aCreateWriteStream) {
    var Subkey;
    if (aCreateReadStream == null) {
      aCreateReadStream = ReadStream;
    }
    if (aCreateWriteStream == null) {
      aCreateWriteStream = WriteStream;
    }
    Subkey = (function() {
      inherits(Subkey, InterfacedObject);

      Subkey.prototype.__defineGetter__("sublevels", function() {
        var k, r, result;
        deprecate("sublevels, all subkeys(sublevels) have cached on nut now.");
        r = nut.subkeys(path.join(this._pathArray, "*"));
        result = {};
        for (k in r) {
          result[path.basename(k)] = r[k];
        }
        return result;
      });

      Subkey.prototype.__defineGetter__("name", function() {
        var l;
        l = this._pathArray.length;
        if (l > 0) {
          return this._pathArray[l - 1];
        } else {
          return PATH_SEP;
        }
      });

      Subkey.prototype.__defineGetter__("fullName", function() {
        return PATH_SEP + this._pathArray.join(PATH_SEP);
      });

      Subkey.isAlias = nut.isAlias;

      Subkey.prototype.Class = Subkey;

      Subkey.prototype._NUT = nut;

      Subkey.prototype.version = version;

      Subkey.prototype.isLoading = function() {
        return this._loaded === false;
      };

      Subkey.prototype.isLoaded = function() {
        return this._loaded === true;
      };

      Subkey.prototype.isNotLoaded = function() {
        return this._loaded == null;
      };

      Subkey.prototype.loadValue = function(aCallback) {
        var that, vOptions;
        this._loaded = false;
        aCallback || (aCallback = function() {});
        that = this;
        vOptions = this.options;
        return nut.get(this.fullName, [], vOptions, function(err, value) {
          if (err == null) {
            that.value = value;
            if (vOptions.valueEncoding === "json" && Subkey.isAlias(value)) {
              return nut.get(value, [], that.mergeOpts({
                getRealKey: true
              }), function(err, value) {
                that._realKey = nut.createSubkey(value, Subkey.bind(null, value), vOptions);
                aCallback(err, that);
                return that._loaded = true;
              });
            } else {
              aCallback(null, that);
              return that._loaded = true;
            }
          } else {
            aCallback(err, that);
            return that._loaded = null;
          }
        });
      };

      Subkey.prototype.load = function(aReadyCallback) {
        var vOptions;
        if (this.isNotLoaded() && nut.isOpen() === true) {
          vOptions = this.options;
          if (vOptions && vOptions.loadValue !== false) {
            return this.loadValue(aReadyCallback);
          } else {
            if (aReadyCallback) {
              return aReadyCallback(null, this);
            }
          }
        }
      };

      Subkey.prototype.init = function(aReadyCallback) {
        var event, listener, that, vOptions, _ref;
        this.methods = {};
        this.unhooks = [];
        this.listeners = {
          ready: this.emit.bind(this, "ready"),
          closing: this.emit.bind(this, "closing"),
          closed: this.emit.bind(this, "closed"),
          error: this.emit.bind(this, "error")
        };
        _ref = this.listeners;
        for (event in _ref) {
          listener = _ref[event];
          nut.on(event, listener);
        }
        this._loaded = null;
        vOptions = this.options;
        that = this;
        this.load(aReadyCallback);
        this.on("ready", function() {
          return that.load(aReadyCallback);
        });
        return this.post(this.path(), function(op, add) {
          var vValue;
          switch (op.type) {
            case "del":
              that.value = void 0;
              if (that._realKey) {
                that._realKey.free();
                return that._realKey = void 0;
              }
              break;
            case "put":
              vValue = op.value;
              if (that.value !== vValue) {
                that.value = vValue;
                if (that._realKey) {
                  that._realKey.free();
                  that._realKey = void 0;
                }
                if (vOptions && vOptions.valueEncoding === "json" && Subkey.isAlias(vValue)) {
                  return nut.get(vValue, [], that.mergeOpts({
                    getRealKey: true
                  }), function(err, value) {
                    return that._realKey = nut.createSubkey(value, Subkey.bind(null, value), vOptions);
                  });
                }
              }
          }
        });
      };

      Subkey.prototype.final = function() {
        var event, i, listener, unhooks, _ref;
        unhooks = this.unhooks;
        i = 0;
        while (i < unhooks.length) {
          unhooks[i]();
          i++;
        }
        this.unhooks = [];
        _ref = this.listeners;
        for (event in _ref) {
          listener = _ref[event];
          nut.removeListener(event, listener);
        }
        return this.freeSubkeys();
      };

      function Subkey(aKeyPath, aOptions, aCallback) {
        var vKeyPath, vSubkey;
        if (isFunction(aOptions)) {
          aCallback = aOptions;
          aOptions = {};
        }
        if (!(this instanceof Subkey)) {
          vKeyPath = path.normalizeArray(getPathArray(aKeyPath));
          vSubkey = nut.createSubkey(vKeyPath, Subkey.bind(null, vKeyPath), aOptions, aCallback);
          return vSubkey;
        }
        Subkey.__super__.constructor.call(this);
        this.options = aOptions;
        aKeyPath = getPathArray(aKeyPath);
        aKeyPath = aKeyPath ? path.normalizeArray(aKeyPath) : [];
        this._pathArray = aKeyPath;
        this.self = this;
        this.init(aCallback);
      }

      Subkey.prototype.parent = function() {
        var p, result;
        p = path.dirname(this.path());
        result = nut.subkey(p);
        while ((result == null) && p !== PATH_SEP) {
          p = path.dirname(p);
          result = nut.subkey(p);
        }
        return result;
      };

      Subkey.prototype.setPath = function(aPath) {
        var vPath;
        aPath = getPathArray(aPath);
        if (aPath) {
          aPath = path.normalizeArray(aPath);
          if (this._pathArray != null) {
            vPath = this.path();
          }
          if ((vPath != null) && vPath !== path.resolve(aPath)) {
            nut.delSubkey(vPath);
            this.final();
            this._pathArray = aPath;
            this.init();
            return true;
          }
        }
        return false;
      };

      Subkey.prototype._addHook = function(key, callback, hooksAdd) {
        if (isFunction(key)) {
          return hooksAdd([this._pathArray], key);
        }
        if (isString(key)) {
          return hooksAdd(resolveKeyPath(this._pathArray, key), callback);
        }
        if (isObject(key)) {
          return hooksAdd(addpre(this._pathArray, key), callback);
        }
        throw new Error("not implemented yet");
      };

      Subkey.prototype._defaultCallback = function(err) {
        if (err) {
          return this.emit("error", err);
        }
      };

      Subkey.prototype.mergeOpts = function(opts) {
        var k, o;
        o = {};
        if (this.options) {
          for (k in this.options) {
            if (this.options[k] !== undefined) {
              o[k] = this.options[k];
            }
          }
        }
        if (opts) {
          for (k in opts) {
            if (opts[k] !== undefined) {
              o[k] = opts[k];
            }
          }
        }
        return o;
      };

      Subkey.prototype.isOpen = function() {
        return nut.isOpen();
      };

      Subkey.prototype.pathAsArray = function() {
        return this._pathArray.slice();
      };

      Subkey.prototype.prefix = deprecate["function"](function() {
        return this.pathAsArray();
      }, "prefix(), use `pathAsArray()` instead, or use path() to return string path..");

      Subkey.prototype.path = function(aPath, aOptions) {
        if (aPath === undefined) {
          return this.fullName;
        } else {
          return this.subkey(aPath, aOptions);
        }
      };

      Subkey.prototype.subkey = function(name, opts, cb) {
        var vKeyPath;
        vKeyPath = path.resolveArray(this._pathArray, name);
        vKeyPath.shift(0, 1);
        return Subkey(vKeyPath, this.mergeOpts(opts), cb);
      };

      Subkey.prototype.sublevel = deprecate["function"](function(name, opts, cb) {
        return this.subkey(name, opts, cb);
      }, "sublevel(), use `subkey(name)` or `path(name)` instead.");

      Subkey.prototype.freeSubkeys = function(aKeyPattern) {
        var k, vSubkeys;
        if (!aKeyPattern) {
          aKeyPattern = path.join(this._pathArray, "*");
        } else {
          aKeyPattern = path.resolve(this._pathArray, aKeyPattern);
        }
        vSubkeys = nut.subkeys(aKeyPattern);
        for (k in vSubkeys) {
          vSubkeys[k].free();
        }
      };

      Subkey.prototype.destroy = function() {
        Subkey.__super__.destroy.apply(this, arguments);
        return this.final();
      };

      Subkey.prototype._doOperation = function(aOperation, opts, cb) {
        var that, vInfo, vPath, vType;
        if (isFunction(opts)) {
          cb = opts;
          opts = {};
        } else {
          if (opts === undefined) {
            opts = {};
          }
        }
        if (!cb) {
          cb = this._defaultCallback;
        }
        assignDeprecatedPrefixOption(opts);
        vPath = isString(opts.path) && opts.path.length ? getPathArray(opts.path) : this._pathArray;
        that = this;
        if (util.isArray(aOperation)) {
          vType = "batch";
          aOperation = aOperation.map(function(op) {
            return {
              separator: op.separator,
              key: op.key,
              value: op.value,
              path: op.path || vPath,
              keyEncoding: op.keyEncoding,
              valueEncoding: op.valueEncoding,
              type: op.type
            };
          });
          vInfo = [vType, aOperation];
        } else {
          vType = aOperation.type;
          vInfo = [vType, aOperation.key, aOperation.value];
          aOperation = [
            {
              separator: opts.separator,
              path: vPath,
              key: aOperation.key,
              value: aOperation.value,
              type: aOperation.type
            }
          ];
        }
        return nut.apply(aOperation, this.mergeOpts(opts), function(err) {
          if (!err) {
            that.emit.apply(that, vInfo);
            cb.call(that, null);
          }
          if (err) {
            return cb.call(that, err);
          }
        });
      };


      /*
        put it self:
          put(cb)
          put(value, cb)
       */

      Subkey.prototype.put = function(key, value, opts, cb) {
        if (isFunction(key) || arguments.length === 0) {
          cb = key;
          key = ".";
          value = this.value;
        } else if (isFunction(value)) {
          cb = value;
          value = key;
          key = ".";
        }
        return this._doOperation({
          key: key,
          value: value,
          type: "put"
        }, opts, cb);
      };

      Subkey.prototype.del = function(key, opts, cb) {
        return this._doOperation({
          key: key,
          type: "del"
        }, opts, cb);
      };

      Subkey.prototype.batch = function(ops, opts, cb) {
        return this._doOperation(ops, opts, cb);
      };

      Subkey.prototype.get = function(key, opts, cb) {
        var that, vPath;
        if (isFunction(opts)) {
          cb = opts;
          opts = {};
        }
        if (isObject(key)) {
          opts = key;
          key = ".";
        } else if (isFunction(key)) {
          cb = key;
          opts = {};
          key = ".";
        }
        assignDeprecatedPrefixOption(opts);
        vPath = isString(opts.path) ? getPathArray(opts.path) : this._pathArray;
        if (opts.path) {
          opts.path = getPathArray(opts.path);
        }
        that = this;
        return nut.get(key, vPath, this.mergeOpts(opts), function(err, value) {
          if (err) {
            if (/notfound/i.test(err)) {
              err = new NotFoundError('Key not found in database [' + key + ']', err);
            } else {
              err = new ReadError(err);
            }
            return dispatchError(that, err, cb);
          }
          return cb.call(that, null, value);
        });
      };

      Subkey.prototype.alias = function(aKeyPath, aAlias, aCallback) {
        if (isFunction(aAlias)) {
          aCallback = aAlias;
          aAlias = aKeyPath;
          aKeyPath = this.path();
        }
        if (isFunction(aKeyPath.path)) {
          aKeyPath = aKeyPath.path();
        }
        if (isFunction(aAlias.path)) {
          aAlias = aAlias.path();
        }
        return this._alias(aKeyPath, aAlias, aCallback);
      };

      Subkey.prototype._alias = function(aKeyPath, aAlias, aCallback) {
        return this._doOperation({
          key: aAlias,
          value: aKeyPath,
          type: "put"
        }, {
          valueEncoding: 'utf8'
        }, aCallback);
      };

      Subkey.prototype.pre = function(key, hook) {
        var lst, unhook;
        unhook = this._addHook(key, hook, nut.pre);
        this.unhooks.push(unhook);
        lst = this.unhooks;
        return function() {
          var i;
          i = lst.indexOf(unhook);
          if (~i) {
            lst.splice(i, 1);
          }
          return unhook();
        };
      };

      Subkey.prototype.post = function(key, hook) {
        var lst, unhook;
        unhook = this._addHook(key, hook, nut.post);
        this.unhooks.push(unhook);
        lst = this.unhooks;
        return function() {
          var i;
          i = lst.indexOf(unhook);
          if (~i) {
            lst.splice(i, 1);
          }
          return unhook();
        };
      };

      Subkey.prototype.readStream = function(opts) {
        var filterStream, isFilterExists, it, stream;
        opts = this.mergeOpts(opts);
        assignDeprecatedPrefixOption(opts);
        opts.path = getPathArray(opts.path, this._pathArray) || this._pathArray;
        isFilterExists = isFunction(opts.filter);
        stream = aCreateReadStream(opts, nut.createDecoder(opts));
        it = nut.iterator(opts, function(err, it) {
          stream.setIterator(it);
          return it.stream = stream;
        });
        if (!stream.type && isFilterExists) {
          filterStream = through(function(item) {
            var vKey, vValue;
            vKey = vValue = null;
            if (isObject(item)) {
              vKey = item.key;
              vValue = item.value;
            } else if (opts.keys !== false) {
              vKey = item;
            } else {
              if (opts.values !== false) {
                vValue = item;
              }
            }
            switch (opts.filter(vKey, vValue)) {
              case FILTER_EXCLUDED:
                return;
              case FILTER_STOPPED:
                this.end();
                return;
            }
            return this.push(item);
          }, null);
          filterStream.writable = false;
          stream = stream.pipe(filterStream);
        }
        return stream;
      };

      Subkey.prototype.createReadStream = Subkey.prototype.readStream;

      Subkey.prototype.valueStream = function(opts) {
        opts = opts || {};
        opts.values = true;
        opts.keys = false;
        return this.readStream(opts);
      };

      Subkey.prototype.createValueStream = Subkey.prototype.valueStream;

      Subkey.prototype.keyStream = function(opts) {
        opts = opts || {};
        opts.values = false;
        opts.keys = true;
        return this.readStream(opts);
      };

      Subkey.prototype.createKeyStream = Subkey.prototype.keyStream;

      Subkey.prototype.writeStream = function(opts) {
        opts = this.mergeOpts(opts);
        return new aCreateWriteStream(opts, this);
      };

      Subkey.prototype.createWriteStream = Subkey.prototype.writeStream;

      Subkey.prototype.pathStream = function(opts) {
        opts = opts || {};
        opts.separator = PATH_SEP;
        opts.separatorRaw = true;
        opts.gte = "0";
        return this.readStream(opts);
      };

      Subkey.prototype.createPathStream = Subkey.prototype.pathStream;

      return Subkey;

    })();
    return Subkey;
  };

}).call(this);
