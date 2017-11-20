/* eslint-disable */

const fs = require('fs');
const path = require('path');
const Benchmark = require('benchmark');
const posthtml = require('posthtml');
const uglify = require('..');

const suite = new Benchmark.Suite();
const posthtmlUglify = posthtml().use(uglify());

const html = fs.readFileSync(path.join(__dirname, '..', 'test', 'test.html'));

console.log('Running benchmark');

suite
  .add('#process', {
    defer: true,
    fn: (deferred) => {
      posthtmlUglify.process(html).then(() => deferred.resolve());
    },
  })
  .on('cycle', event => console.log(String(event.target)))
  .run({ async: true });
