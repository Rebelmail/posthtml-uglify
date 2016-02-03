'use strict';

var fs = require('fs');
var Benchmark = require('benchmark');
var posthtml = require('posthtml');
var uglify = require('..');

var suite = new Benchmark.Suite();
var posthtmlUglify = posthtml().use(uglify());

var html = fs.readFileSync('./test/test.html');

console.log('Running benchmark');

suite
  .add('#process', {
    defer: true,
    fn: function(deferred) {
      posthtmlUglify.process(html).then(function() {
        deferred.resolve();
      });
    }
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .run({ async: true });
