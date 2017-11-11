'use strict';

const fs = require('fs');
const Benchmark = require('benchmark');
const posthtml = require('posthtml');
const uglify = require('..');

const suite = new Benchmark.Suite();
const posthtmlUglify = posthtml().use(uglify());

const html = fs.readFileSync('./test/test.html');

console.log('Running benchmark');

suite
  .add('#process', {
    defer: true,
    fn: (deferred) => {
      posthtmlUglify.process(html).then(() => deferred.resolve());
    }
  })
  .on('cycle', event => console.log(String(event.target)))
  .run({ async: true });
