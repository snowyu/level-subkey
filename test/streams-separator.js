var level = require('level-test')()
var sublevel = require('../')
var _nut = require('../nut')
var FILTER_EXCLUDED = _nut.FILTER_EXCLUDED
var FILTER_STOPPED = _nut.FILTER_STOPPED
var tape = require('tape')


require('rimraf').sync('/tmp/test-sublevel-readstream-separator')

var db = level('test-sublevel-readstream-separator')
var base = sublevel(db)

var a    = base.sublevel('A')

  function all(db, opts, cb) {
    var o
    opts = opts || {}
    if (!opts.end) opts.end = '\xff\xff'
    db.createReadStream(opts).on('data', function (data) {
      if (data.key) {
          if(!o) o={}
          o[data.key.toString()] = data.value.toString()
      }
      else {
        if (!o) o = []
        o.push(data)
      }
    })
    .on('end', function () {
      cb(null, o)
    })
    .on('error', cb)
  }

  var _a='AAA_'+Math.random(), _b= 'BBB_'+Math.random(), _c= 'CCC_'+Math.random()
  var _d = "DDD_2333"

function filterEmpty(key, value)  {
    console.log("fe=", key)
}

tape('stream-separator-init', function (t) {

  var i = 0



  function filter(key, value) {
      console.log("f:", key, " v:", value)
      if (key.indexOf(".") < 0) return FILTER_EXCLUDED //return true to stop.
  }

  function filterEnd(key, value) {
      console.log("f:", key, " v:", value)
      if (key == "d5") return FILTER_STOPPED //return true to stop.
  }

  a.batch([
    {key: '1.a', value: _a , type: 'put', separator: '.'},
    {key: '2.b', value: _b , type: 'put', separator: '.'},
    {key: '3.c', value: _c , type: 'put', separator: '.'},
    {key: '3.d', value: _d , type: 'put', separator: '.'},
    {key: '3.cKey', value: _c , type: 'put'},
    {key: 'd4', value: _d+"4" , type: 'put'},
    {key: 'd5', value: _d+"5" , type: 'put'},
    {key: 'z6', value: _d+"6" , type: 'put'},
    {key: 'abc', value: _c , type: 'put', path: "A/.3%2ec"},
  ], function (err) {
    if(err) throw err
    all(db, {}, function (err, obj) {
      if(err) throw err
      t.deepEqual(obj, 
        {
          '/A#3%2ecKey': _c,
          '/A#d4': _d+"4",
          '/A#d5': _d+'5',
          '/A#z6': _d+'6',
          '/A/.1%2ea': _a,
          '/A/.2%2eb': _b,
          '/A/.3%2ec': _c,
          '/A/.3%2ec#abc': _c,
          '/A/.3%2ed': _d
        })
 
        all(a, {}, function (err, obj) {
          if(err) throw err
          t.deepEqual(obj, 
            {
              '3.cKey': _c,
              'd4': _d+"4",
              'd5': _d+"5",
              'z6': _d+"6"
            })

          t.end()
        })
    })
  })
})

tape('stream-separator', function (t) {
    all(db, {}, function (err, obj) {
      if(err) throw err
      t.deepEqual(obj, 
        {
          '/A#3%2ecKey': _c,
          '/A#d4': _d+"4",
          '/A#d5': _d+'5',
          '/A#z6': _d+'6',
          '/A/.1%2ea': _a,
          '/A/.2%2eb': _b,
          '/A/.3%2ec': _c,
          '/A/.3%2ec#abc': _c,
          '/A/.3%2ed': _d
        })
        all(a, {separator:'.', filter: filterEmpty}, function (err, obj) {
          if(err) throw err
            console.log(obj)
          t.deepEqual(obj, 
            {
              '.1.a': _a,
              '.2.b': _b,
              '.3.c': _c,
              '.3.d': _d
            })

          t.end()
        })
    })
})
