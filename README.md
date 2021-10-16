# posthtml-uglify

[![Build Status](https://travis-ci.org/Rebelmail/posthtml-uglify.svg?branch=master)](https://travis-ci.org/Rebelmail/posthtml-uglify)
[![Coverage Status](https://coveralls.io/repos/github/Rebelmail/posthtml-uglify/badge.svg?branch=master)](https://coveralls.io/github/Rebelmail/posthtml-uglify?branch=master)
[![npm version](https://badge.fury.io/js/posthtml-uglify.svg)](https://badge.fury.io/js/posthtml-uglify)
[![Dependency Status](https://david-dm.org/Rebelmail/posthtml-uglify.svg)](https://david-dm.org/Rebelmail/posthtml-uglify)
[![devDependency Status](https://david-dm.org/Rebelmail/posthtml-uglify/dev-status.svg)](https://david-dm.org/Rebelmail/posthtml-uglify?type=dev)

A [PostHTML][1] plugin to rewrite CSS identifiers in HTML for the purposes of
compression and obfuscation.

## Installation

```sh
npm install posthtml-uglify --save
```

## Usage

```js
const posthtml = require('posthtml');
const uglify = require('posthtml-uglify');

posthtml()
  .use(uglify({ whitelist: ['.bar'] }))
  .process('<style>#foo { color: red } .bar { color: blue }</style><div id="foo" class="bar">baz</div>')
  .then((result) => {
    console.log(result.html); //=> '<style>#xz { color: red } .bar { color: blue }</style><div id="xz" class="bar">baz</div>'
  });
```

### Options

- **whitelist** (Array): list of selectors that should not be rewritten by this plugin. For example, an id or class that is used by JavaScript code.

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

[1]: https://github.com/posthtml/posthtml
