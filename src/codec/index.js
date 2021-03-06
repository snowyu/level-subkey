
//define the key ordering for level-sublevel

var path = require('../path')
//this is for path.js:
var SEP = require('./separator')

//special key seperators
var SUBKEY_SEPS = SEP.SUBKEY_SEPS
var UNSAFE_CHARS =  SEP.UNSAFE_CHARS
var PATH_SEP = SUBKEY_SEPS[0][0], SUBKEY_SEP = SUBKEY_SEPS[1][0]


function isString(s) {
  return "string" === typeof s
}

exports.__defineGetter__("PATH_SEP", function() {
  return PATH_SEP
})
exports.__defineGetter__("SUBKEY_SEP", function() {
  return SUBKEY_SEP
})

exports.__defineGetter__("SUBKEY_SEPS", function() {
  return SUBKEY_SEPS
})
exports.__defineSetter__("SUBKEY_SEPS", function(value) {
  SEP.SUBKEY_SEPS = value
  SUBKEY_SEPS = SEP.SUBKEY_SEPS
  UNSAFE_CHARS =  SEP.UNSAFE_CHARS
  PATH_SEP = SUBKEY_SEPS[0][0]
  SUBKEY_SEP = SUBKEY_SEPS[1][0]
})

escapeString = exports.escapeString = function(aString, aUnSafeChars) {
  if (!isString(aString) || aString.length === 0) return aString
  var c, i, result, len;
  result = "";
  if (aUnSafeChars == null) {
    aUnSafeChars = UNSAFE_CHARS;
  }
  for (i = 0, len = aString.length; i < len; ++i) {
    c = aString[i];
    if (aUnSafeChars.indexOf(c) >= 0) {
      result += "%" + aString.charCodeAt(i).toString(16);
    } else {
      result += c;
    }
  }
  return result;
}

unescapeString = exports.unescapeString = decodeURIComponent

indexOfType = function(s) {
  var i = s.length-1
  while (i>0) {
    var c = s[i]
    if (SUBKEY_SEPS[1].indexOf(c) >=0) return i
    --i
  } //end while
  return -1
}

//the e is array[path, key, seperator, DontEscapeSep]
//the seperator, DontEscapeSep is optional
//DontEscapeSep: means do not escape the separator.
//NOTE: if the separator is PATH_SEP then it DO NOT BE CONVERT TO SUBKEY_SEP.
exports.encode = function (e) {
  var i
  var vSeperator = SUBKEY_SEP
  //e[2]: seperator
  var hasSep = e.length >= 3 && e[2]
  //e[3]: DontEscapeSep
  if (e.length >=4 && e[3] === true) {
      hasSep = false
      if (e[2]) vSeperator = e[2]
      if (vSeperator !== PATH_SEP) vSeperator = PATH_SEP + vSeperator
  }
  var key = e[1], isStrKey = isString(key) && key.length !== 0
  if (hasSep) {
      vSeperator = e[2]
      i = SUBKEY_SEPS[0].indexOf(vSeperator)
      if (i >= 0) {
        vSeperator = SUBKEY_SEPS[1][i]
        if (vSeperator !== PATH_SEP) vSeperator = PATH_SEP + SUBKEY_SEPS[1][i]
      }
      else
        vSeperator = PATH_SEP + vSeperator
  } else if (isStrKey){
      //try to find the separator on the key
      i = SUBKEY_SEPS[0].indexOf(key[0], 1)
      if (i > 0) {
          vSeperator = PATH_SEP + SUBKEY_SEPS[1][i]
          key = key.substring(1)
      }
  }
  if (isStrKey) {
      if (hasSep && key[0] === e[2]) key = key.substring(1)
      key = escapeString(key)
  }
  //console.log("codec.encode:",path.join(e[0]) + vSeperator + key)
  //TODO: I should encode with path.join(e[0], vSeperator + key)) simply in V8.
  //      all separators are same now.
  var vPath = PATH_SEP
  if (e[0].length) vPath = path.join(e[0])
  else if (vSeperator.length >=2 && vSeperator[0] == PATH_SEP) vPath = ""
  return vPath + vSeperator + key
}

//return [path, key, separator, realSeparator]
//the realSeparator is optional, only (aSeparator && aSeparator !== seperator
exports.decode = function (s, aSeparator) {
  var result
  var i = indexOfType(s)
  if (i>=0) {
      var vSep = s[i]
      if (vSep === SUBKEY_SEP) {
          vSep = PATH_SEP
      } else {
          var j = SUBKEY_SEPS[1].indexOf(vSep)
          vSep = PATH_SEP + SUBKEY_SEPS[0][j]
      }
      var vKey = unescapeString(s.substring(i+1))
      result = [s.substring(1, i).split(PATH_SEP).filter(Boolean).map(unescapeString), vKey, vSep]
      if (isString(aSeparator) && aSeparator !== s[i]) result.push(s[i])
  }
  return result
}

exports.buffer = false

exports.lowerBound = '\u0000'
exports.upperBound = '\udbff\udfff'


