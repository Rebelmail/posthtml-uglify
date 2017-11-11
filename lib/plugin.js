const Hashids = require('hashids');
const posthtml = require('posthtml');
const postcssSafeParser = require('postcss-safe-parser');
const postcssSelectorParser = require('postcss-selector-parser');

const { version } = require('../package');

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

class HTMLUglify {
  constructor(config = {}) {
    const salt = config.salt || 'use the force harry';
    this.hashids = new Hashids(salt, 0, ALPHABET);
    this.whitelist = config.whitelist || [];
    this.version = version;
  }

  checkForStandardPointer(type, value, lookups) {
    return lookups[type] && lookups[type][value];
  }

  checkForAttributePointer(type, value, lookups) {
    const typeLookups = lookups[type] || {};
    const keys = Object.keys(typeLookups);
    let pointer;

    keys.some((key) => {
      if (value.indexOf(key) !== -1) {
        pointer = value.replace(key, typeLookups[key]);
        return true;
      }
      return false;
    });

    return pointer;
  }

  generatePointer(lookups) {
    const idCount = Object.keys(lookups['id'] || {}).length;
    const classCount = Object.keys(lookups['class'] || {}).length;
    const counter = idCount + classCount;

    return this.hashids.encode(counter);
  }

  pointer(type, value, lookups) {
    return this.checkForStandardPointer(type, value, lookups) ||
      this.checkForAttributePointer(type, value, lookups) ||
      this.generatePointer(lookups);
  }

  insertLookup(type, value, pointer, lookups) {
    if (!lookups[type]) {
      lookups[type] = {};
    }
    lookups[type][value] = pointer;
  }

  createLookup(type, value, lookups) {
    let pointer;
    if (value && !this.isWhitelisted(type, value)) {
      pointer = this.pointer(type, value, lookups);
      this.insertLookup(type, value, pointer, lookups);
    }
    return pointer;
  }

  isWhitelisted(type, value) {
    switch (type) {
      case 'class':
        value = '.' + value;
        break;
      case 'id':
        value = '#' + value;
        break;
      default:
        break;
    }

    return this.whitelist.indexOf(value) >= 0;
  }

  pointerizeClass(node, lookups) {
    const classes = node.attrs.class;

    if (classes) {
      node.attrs.class = classes.split(/\s+/).map((value) => {
        const pointer = this.createLookup('class', value, lookups);
        if (pointer) {
          return pointer;
        }

        return value;
      }).join(' ');
    }
  }

  pointerizeIdAndFor(type, node, lookups) {
    const pointer = this.createLookup('id', node.attrs[type], lookups);
    if (pointer) {
      node.attrs[type] = pointer;
    }
  }

  processRules(rules, lookups) {
    rules.forEach((rule) => {
      // go deeper inside media rule to find css rules
      if (rule.type === 'atrule' && (rule.name === 'media' || rule.name === 'supports')) {
        this.processRules(rule.nodes, lookups);
      } else if (rule.type === 'rule') {
        postcssSelectorParser((selectors) => {
          selectors.walk((selector) => {
            let pointer;

            if ((selector.type === 'class')
                || (selector.type === 'attribute' && selector.attribute === 'class')) {
              pointer = this.createLookup('class', selector.value, lookups);
            } else if ((selector.type === 'id')
                || (selector.type === 'attribute' && selector.attribute === 'id')
                || (selector.type === 'attribute' && selector.attribute === 'for')) {
              pointer = this.createLookup('id', selector.value, lookups);
            }

            if (pointer) {
              selector.value = pointer;
            }
          });

          rule.selector = String(selectors);
        }).process(rule.selector);
      }
    });
  }

  rewriteElements(tree, lookups = {}) {
    return tree.walk((node) => {
      if (node.attrs) {
        if (node.attrs.class) {
          this.pointerizeClass(node, lookups);
        }

        if (node.attrs.id) {
          this.pointerizeIdAndFor('id', node, lookups);
        }

        if (node.attrs.for) {
          this.pointerizeIdAndFor('for', node, lookups);
        }
      }
      return node;
    });
  }

  rewriteStyles(tree, lookups = {}) {
    return tree.walk((node) => {
      if (node.tag === 'style' && node.content) {
        const ast = postcssSafeParser([].concat(node.content).join(''));
        this.processRules(ast.nodes, lookups);
        node.content = ast.toString();
      }
      return node;
    });
  }

  process(tree) {
    const lookups = {};
    tree = this.rewriteStyles(tree, lookups);
    tree = this.rewriteElements(tree, lookups);
    return tree;
  }
}

module.exports = (options) => {
  return (tree) => {
    return new HTMLUglify(options).process(tree);
  }
};

module.exports.HTMLUglify = HTMLUglify;

module.exports.process = (html, options) => {
  return posthtml().use(module.exports(options)).process(html, { sync: true });
};
