# posthtml-uglify

[![Build Status](https://travis-ci.org/Rebelmail/html-uglify.svg?branch=master)](https://travis-ci.org/Rebelmail/html-uglify)
[![NPM version](https://badge.fury.io/js/html-uglify.png)](http://badge.fury.io/js/html-uglify)

Uglify CSS identifiers in HTML for the purposes of compression and obfuscation.

## Installation

```sh
npm install posthtml-uglify --save
```

## Usage

```js
var posthtml = require('posthtml');
var uglify = require('posthtml-uglify');

posthtml()
  .use(uglify({ whitelist: '.bar' }))
  .process('<style>#foo { color: red } .bar { color: blue }</style><div id="foo" class="bar">baz</div>')
  .then(function(result) {
    console.log(result.html); //=> '<style>#xz { color: red } .bar { color: blue }</style><div id="xz" class="bar">baz</div>'
  });
```

## Contributing

1. Fork it
2. Create your feature branch
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## Running tests

```sh
npm install
npm test
```
