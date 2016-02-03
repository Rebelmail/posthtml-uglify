'use strict';

var assert = require('chai').assert;

var parser = require('posthtml-parser');
var render = require('posthtml-render');
var walk = require('posthtml/lib/api').walk;

var plugin = require('..');
var HTMLUglify = plugin.HTMLUglify;
var htmlUglify = new HTMLUglify();

function parse(html) {
  var tree = parser(html);
  tree.walk = walk;
  return tree;
}

describe('HTMLUglify', function() {
  describe('#isWhitelisted', function() {
    var whitelist;

    beforeEach(function() {
      whitelist = ['#theid', '.theclass', '#★', '.★'];
      htmlUglify = new HTMLUglify({whitelist: whitelist});
    });
    it('returns true if id is in whitelist', function() {
      var whitelisted = htmlUglify.isWhitelisted('id', 'theid');
      assert.isTrue(whitelisted);
    });
    it('returns false if id is in the whitelist but only checking for classes', function() {
      var whitelisted = htmlUglify.isWhitelisted('class', 'theid');
      assert.isFalse(whitelisted);
    });
    it('returns true if class is in whitelist', function() {
      var whitelisted = htmlUglify.isWhitelisted('class', 'theclass');
      assert.isTrue(whitelisted);
    });
    it('returns true if id is in whitelist for a unicode character', function() {
      var whitelisted = htmlUglify.isWhitelisted('id', '★');
      assert.isTrue(whitelisted);
    });
    it('returns true if class is in whitelist for a unicode character', function() {
      var whitelisted = htmlUglify.isWhitelisted('class', '★');
      assert.isTrue(whitelisted);
    });
    it('returns false if an unsupported type is passed', function() {
      var whitelisted = htmlUglify.isWhitelisted('foo', 'bar');
      assert.isFalse(whitelisted);
    });
  });

  describe('#checkForStandardPointer', function() {
    it('returns undefined when name not found', function() {
      var lookups = {
        'class': { 'something': 'zzz' }
      };
      var value = 'other';
      var pointer = htmlUglify.checkForStandardPointer('class', value, lookups);

      assert.isUndefined(pointer);
    });
    it('returns pointer when found', function() {
      var lookups = {
        'class': { 'something': 'zzz' }
      };
      var value = 'something';
      var pointer = htmlUglify.checkForStandardPointer('class', value, lookups);

      assert.equal(pointer, 'zzz');
    });
  });

  describe('#checkForAttributePointer', function() {
    it('returns undefined when not found', function() {
      var lookups = {
        'class': { 'something': 'zzz' }
      };
      var value = 'other';
      var pointer = htmlUglify.checkForAttributePointer('class', value, lookups);

      assert.isUndefined(pointer);
    });
    it('returns the pointer when value contains same string as an existing lookup', function() {
      var lookups = {
        'class': { 'something': 'zzz' }
      };
      var value = 'somethingElse';
      var pointer = htmlUglify.checkForAttributePointer('class', value, lookups);

      assert.equal(pointer, 'zzzElse');
    });
  });

  describe('#insertLookup', function() {
    var lookups;

    beforeEach(function() {
      lookups = {};
    });

    it('updates lookups', function() {
      htmlUglify.insertLookup('class', 'testClass', 'xz', lookups);
      assert.equal(lookups['class'].testClass, 'xz');
    });
  });

  describe('#generatePointer', function() {
    it('returns xz for counter 0 lookups', function() {
      var lookups = {};
      var pointer = htmlUglify.generatePointer(lookups);
      assert.equal(pointer, 'xz');
    });
    it('returns wk for 1 lookups', function() {
      var lookups = { 'id': { 'a': 'xz' } };
      var pointer = htmlUglify.generatePointer(lookups);
      assert.equal(pointer, 'wk');
    });
    it('returns en for 2 lookups', function() {
      var lookups = { 'id': { 'a': 'xz' }, 'class': { 'b': 'wk' } };
      var pointer = htmlUglify.generatePointer(lookups);
      assert.equal(pointer, 'en');
    });
  });

  describe('#pointer', function() {
    it('generates a new pointer', function() {
      var lookups = {};
      var pointer = htmlUglify.pointer('class', 'newClass', {});
      assert.equal(pointer, 'xz', lookups);
    });
    it('generates a new pointer given a different one exists', function() {
      var lookups = {
        'class': { 'otherClass': 'wk' }
      };
      var pointer = htmlUglify.pointer('class', 'newClass', lookups);
      assert.equal(pointer, 'wk', lookups);
    });
    it('generates a new pointer given a different one exists in a different attribute', function() {
      var lookups = {
        'id': { 'someId': 'wk' }
      };
      var pointer = htmlUglify.pointer('class', 'newClass', lookups);
      assert.equal(pointer, 'wk', lookups);
    });
    it('finds an existing class pointer', function() {
      var lookups = {
        'class': { 'someClass': 'xz' }
      };
      var pointer = htmlUglify.pointer('class', 'someClass', lookups);
      assert.equal(pointer, 'xz', lookups);
    });
    it('finds an existing id pointer', function() {
      var lookups = {
        'id': { 'someId': 'en' }
      };
      var pointer = htmlUglify.pointer('id', 'someId', lookups);
      assert.equal(pointer, 'en');
    });
    it('finds a more complex existing pointer', function() {
      var lookups = {
        class: {
          test: 'xz',
          testOther: 'wk',
          otratest: 'en'
        }
      };
      var pointer = htmlUglify.pointer('class', 'test', lookups);
      assert.equal(pointer, 'xz');
    });
  });

  describe('#pointerizeIdAndFor', function() {
    var node;

    beforeEach(function() {
      var html = '<p id="one"></p>';
      node = parse(html)[0];
    });

    it('works with empty lookups', function() {
      var lookups = {};
      htmlUglify.pointerizeIdAndFor('id', node, lookups);
      assert.deepEqual(lookups, { id: { one: 'xz' } });
    });
    it('works with existing lookup', function() {
      var lookups = { class: { one: 'ab' } };
      htmlUglify.pointerizeClass(node, lookups);
      assert.deepEqual(lookups, { class: { one: 'ab' } });
    });
    it('works with whitelist', function() {
      var lookups = {};
      htmlUglify.whitelist = [ '#one' ];
      htmlUglify.pointerizeClass(node, lookups);
      assert.deepEqual(lookups, {});
    });
  });


    describe('#pointerizeClass', function() {
      var node;

      beforeEach(function() {
        var html = '<p class="one two"></p>';
        node = parse(html)[0];
      });

      it('works with empty lookups', function() {
        var lookups = {};
        htmlUglify.pointerizeClass(node, lookups);
        assert.deepEqual(lookups, { class: { one: 'xz', two: 'wk' } });
      });
      it('works with single lookup', function() {
        var lookups = { class: { one: 'ab' } };
        htmlUglify.pointerizeClass(node, lookups);
        assert.deepEqual(lookups, { class: { one: 'ab', two: 'wk' } });
      });
      it('works with whitelist', function() {
        var lookups = {};
        htmlUglify.whitelist = ['.two'];
        htmlUglify.pointerizeClass(node, lookups);
        assert.deepEqual(lookups, { class: { one: 'xz' } });
      });
    });

  describe('#rewriteStyles', function() {
    it('rewrites an id given lookups', function() {
      var lookups = { 'id': { 'foo': 'bar' } };
      var html = '<style>#foo{ color: red; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>#bar{ color: red; }</style>');
    });
    it('rewrites an id', function() {
      var lookups = { };
      var html = '<style>#xz{ color: red; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>#xz{ color: red; }</style>');
    });
    it('rewrites an id with the same name as the element', function() {
      var lookups = {'id': {'label': 'ab' }};
      var html = '<style>label#label{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label#ab{ color: blue; }</style>');
    });
    it('rewrites a for= given lookups', function() {
      var lookups = { 'id': {'email': 'ab'} };
      var html = '<style>label[for=email]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), "<style>label[for=ab]{ color: blue; }</style>");
    });
    it('rewrites a for=', function() {
      var lookups = {};
      var html = '<style>label[for=email]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), "<style>label[for=xz]{ color: blue; }</style>");
    });
    it('rewrites a for= with quotes given lookups', function() {
      var lookups = { 'id': {'email': 'ab'} };
      var html = '<style>label[for="email"]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label[for="ab"]{ color: blue; }</style>');
    });
    it('rewrites a for= with the same name as the element', function() {
      var lookups = { 'id': { 'label': 'ab' }};
      var html = '<style>label[for="label"]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label[for="ab"]{ color: blue; }</style>');
    });
    it('rewrites an id= given lookups', function() {
      var lookups = { 'id': {'email': 'ab'} };
      var html = '<style>label[id=email]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label[id=ab]{ color: blue; }</style>');
    });
    it('rewrites an id= with quotes given lookups', function() {
      var lookups = { 'id': { 'email': 'ab' } };
      var html = '<style>label[id="email"]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label[id="ab"]{ color: blue; }</style>');
    });
    it('rewrites an id= with quotes and with the same name as the element', function() {
      var lookups = { 'id': {'label': 'ab'} };
      var html = '<style>label[id="label"]{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label[id="ab"]{ color: blue; }</style>');
    });
    it('rewrites a class given lookups', function() {
      var lookups = { 'class': { 'email': 'ab' }};
      var html = '<style>label.email{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label.ab{ color: blue; }</style>');
    });
    it('rewrites a class with the same name as the element', function() {
      var lookups = { 'class': { 'label': 'ab' }};
      var html = '<style>label.label{ color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label.ab{ color: blue; }</style>');
    });
    it('rewrites a class= given lookups', function() {
      var lookups = { 'class': { 'email': 'ab' }};
      var html = '<style>form [class=email] { color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), "<style>form [class=ab] { color: blue; }</style>");
    });
    it('rewrites multi-selector rule', function() {
      var lookups = { 'class': { 'email': 'ab' }};
      var html = '<style>label.email, a.email { color: blue; }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>label.ab, a.ab { color: blue; }</style>');
    });
    it('rewrites css media queries', function() {
      var lookups = { 'id': { 'abe': 'wz' }};
      var html = '<style>@media screen and (max-width: 300px) { #abe{ color: red; } }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>@media screen and (max-width: 300px) { #wz{ color: red; } }</style>');
    });
    it('rewrites nested css media queries', function() {
      var lookups = { 'id': { 'abe': 'wz' }};
      var html = '<style>@media { @media screen and (max-width: 300px) { #abe{ color: red; } } }</style>';
      var result = htmlUglify.rewriteStyles(parse(html), lookups);
      assert.equal(render(result), '<style>@media { @media screen and (max-width: 300px) { #wz{ color: red; } } }</style>');
    });
    it('handles malformed syntax', function() {
      var html = '<style>@media{.media{background: red}</style>';
      var result = htmlUglify.rewriteStyles(parse(html));
      assert.equal(render(result), '<style>@media{.xz{background: red}}</style>');
    });
  });

  describe('#rewriteElements', function() {
    it('rewrites an id', function() {
      var html = '<h1 id="abe">Header</h1>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 id="xz">Header</h1>');
    });
    it('rewrites a class', function() {
      var html = '<h1 class="abe">Header</h1>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz">Header</h1>');
    });
    it('rewrites a multiple classes', function() {
      var html = '<h1 class="foo bar">Header</h1>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz wk">Header</h1>');
    });
    it('rewrites a multiple classes with more than one space between them', function() {
      var html = '<h1 class="foo   bar">Header</h1>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz wk">Header</h1>');
    });
    it('rewrites a for', function() {
      var html = '<label for="abe">Label</h1>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<label for="xz">Label</label>');
    });
    it('rewrites multiple nested ids, classes, and fors', function() {
      var html = '<h1 id="header">Header <strong id="strong"><span id="span">1</span></strong></h1><label for="something">Something</label><label for="null">null</label><div class="some classes">Some Classes</div>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 id="xz">Header <strong id="wk"><span id="en">1</span></strong></h1><label for="km">Something</label><label for="dj">null</label><div class="yw qr">Some Classes</div>');
    });
    it('rewrites ids and labels to match when matching', function() {
      var html = '<h1 id="header">Header</h1><label for="header">Something</label><label for="header">Other</label>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 id="xz">Header</h1><label for="xz">Something</label><label for="xz">Other</label>');
    });
    it('rewrites multiple uses of the same class to the correct value', function() {
      var html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="header">Other</div>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz">Header</h1><label class="xz">Something</label><div class="xz">Other</div>');
    });
    it('rewrites multiple uses of the same class to the correct value', function() {
      var html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
    it('rewrites other class combinations', function() {
      var html = '<h1 class="header other">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      var result = htmlUglify.rewriteElements(parse(html));
      assert.equal(render(result), '<h1 class="xz wk">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
  });

  describe('#process', function() {
    it('uglifies style and html', function() {
      var html = plugin.process("<style>.test#other{}</style><p class='test' id='other'></p>").html;
      assert.equal(html, '<style>.xz#wk{}</style><p class="xz" id="wk"></p>');
    });
    it('uglifies differently with a different salt', function() {
      var html = plugin.process("<style>.demo_class#andID{color: red}</style><div class='demo_class' id='andID'>Welcome to HTML Uglify</div>", {salt: 'other'}).html;
      assert.equal(html, '<style>.vy#nx{color: red}</style><div class="vy" id="nx">Welcome to HTML Uglify</div>');
    });
    it('uglifies media query with no name', function() {
      var html = plugin.process("<style>@media {.media{ color: red; }}</style><div class='media'>media</div>").html;
      assert.equal(html, '<style>@media {.xz{ color: red; }}</style><div class="xz">media</div>');
    });
    it('uglifies media queries inside of media queries', function() {
      var html = plugin.process("<style>@media screen{@media screen{.media-nested{background:red;}}}</style><div class='media-nested'>media-nested</div>").html;
      assert.equal(html, '<style>@media screen{@media screen{.xz{background:red;}}}</style><div class="xz">media-nested</div>');
    });
    it('uglifies media queries inside of media queries inside of media queries', function() {
      var html = plugin.process("<style>@media screen{@media screen{@media screen{.media-double-nested{background:red;}}}}</style><div class='media-double-nested'>media-double-nested</div>").html;
      assert.equal(html, '<style>@media screen{@media screen{@media screen{.xz{background:red;}}}}</style><div class="xz">media-double-nested</div>');
    });
    it('uglifies css inside @supports at-rule', function() {
      var html = plugin.process("<style>@supports (animation) { .someClass {} }</style><div class='someClass'></div>").html;
      assert.equal(html, '<style>@supports (animation) { .xz {} }</style><div class="xz"></div>');
    });
    it('uglifies with whitelisting for ids and classes', function() {
      var whitelist = ['#noform', '.withform'];
      var html = plugin.process("<style>#noform { color: red; } .withform{ color: red } #other{ color: red; }</style><div id='noform' class='noform'>noform</div><div class='withform'>withform</div><div id='other'>other</div>", {salt: 'use the force harry', whitelist: whitelist}).html;
      assert.equal(html, '<style>#noform { color: red; } .withform{ color: red } #xz{ color: red; }</style><div id="noform" class="wk">noform</div><div class="withform">withform</div><div id="xz">other</div>');
    });
    it('uglifies a class with a ::before', function() {
      var html = plugin.process("<style>.before::before{color: red}</style><div class='before'>before</div>").html;
      assert.equal(html, '<style>.xz::before{color: red}</style><div class="xz">before</div>');
    });
    it('uglifies class attribute selectors', function() {
      var html = plugin.process('<style>body[yahoo] *[class*=paddingreset] {}</style><div class="paddingreset1">paddingreset1</div>').html;
      assert.equal(html, '<style>body[yahoo] *[class*=xz] {}</style><div class="xz1">paddingreset1</div>');
    });
    it('uglifies id attribute selectors', function() {
      var html = plugin.process('<style>body[yahoo] *[id*=paddingreset] { padding:0 !important; }</style><div id="paddingreset1">paddingreset1</div>').html;
      assert.equal(html, '<style>body[yahoo] *[id*=xz] { padding:0 !important; }</style><div id="xz1">paddingreset1</div>');
    });
    it('uglifies for attribute selectors', function() {
      var html = plugin.process('<style>body[yahoo] *[id*=paddingreset] { padding:0 !important; }</style><div for="paddingreset1">paddingreset1</div>').html;
      assert.equal(html, '<style>body[yahoo] *[id*=xz] { padding:0 !important; }</style><div for="xz1">paddingreset1</div>');
    });
    it('uglifies attribute selectors correctly towards the end of a stylesheet', function() {
      var html = plugin.process("<style>.test{} .alphatest{} *[class*=test]{}</style><p class='alphatest'></p>").html;
      assert.equal(html, '<style>.xz{} .alphaxz{} *[class*=xz]{}</style><p class="alphaxz"></p>');
    });
    it('uglifies attribute selectors with spaced classes', function() {
      var html = plugin.process("<style>.test{} .alphatest{} *[class*=test]{}</style><p class='alphatest beta'></p>").html;
      assert.equal(html, '<style>.xz{} .alphaxz{} *[class*=xz]{}</style><p class="alphaxz en"></p>');
    });
  });

  describe('attribute selectors', function() {
    describe('equal selector', function() {
      it('uglifies', function() {
        var html = plugin.process('<style>*[class=test] {}</style><div class="test"></div>').html;
        assert.equal(html, '<style>*[class=xz] {}</style><div class="xz"></div>');

        html = plugin.process('<style>*[id=test] {}</style><div id="test"></div>').html;
        assert.equal(html, '<style>*[id=xz] {}</style><div id="xz"></div>');

        html = plugin.process('<style>*[id=test] {}</style><div for="test"></div>').html;
        assert.equal(html, '<style>*[id=xz] {}</style><div for="xz"></div>');
      });
    });
    describe('anywhere selector', function() {
      it('uglifies in the middle of a string', function() {
        var html = plugin.process('<style>*[class*=test] {}</style><div class="ZZtestZZ"></div>').html;
        assert.equal(html, '<style>*[class*=xz] {}</style><div class="ZZxzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="ZZtestZZ"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div id="ZZxzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="ZZtestZZ"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div for="ZZxzZZ"></div>');
      });

      it('uglifies at the start of a string', function() {
        var html = plugin.process('<style>*[class*=test] {}</style><div class="testZZ"></div>').html;
        assert.equal(html, '<style>*[class*=xz] {}</style><div class="xzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="testZZ"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div id="xzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="testZZ"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div for="xzZZ"></div>');
      });

      it('uglifies at the end of a string', function() {
        var html = plugin.process('<style>*[class*=test] {}</style><div class="ZZtest"></div>').html;
        assert.equal(html, '<style>*[class*=xz] {}</style><div class="ZZxz"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="ZZtest"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div id="ZZxz"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="ZZtest"></div>').html;
        assert.equal(html, '<style>*[id*=xz] {}</style><div for="ZZxz"></div>');
      });
    });
    describe('begins with selector', function() {
      it('uglifies at the start of a string', function() {
        var html = plugin.process('<style>*[class^=test] {}</style><div class="testZZ"></div>').html;
        assert.equal(html, '<style>*[class^=xz] {}</style><div class="xzZZ"></div>');

        html = plugin.process('<style>*[id^=test] {}</style><div id="testZZ"></div>').html;
        assert.equal(html, '<style>*[id^=xz] {}</style><div id="xzZZ"></div>');

        html = plugin.process('<style>*[id^=test] {}</style><div for="testZZ"></div>').html;
        assert.equal(html, '<style>*[id^=xz] {}</style><div for="xzZZ"></div>');
      });
    });
    describe('ends with selector', function() {
      it('uglifies at the end of a string', function() {
        var html = plugin.process('<style>*[class$=test] {}</style><div class="ZZtest"></div>').html;
        assert.equal(html, '<style>*[class$=xz] {}</style><div class="ZZxz"></div>');

        html = plugin.process('<style>*[id$=test] {}</style><div id="ZZtest"></div>').html;
        assert.equal(html, '<style>*[id$=xz] {}</style><div id="ZZxz"></div>');

        html = plugin.process('<style>*[id$=test] {}</style><div for="ZZtest"></div>').html;
        assert.equal(html, '<style>*[id$=xz] {}</style><div for="ZZxz"></div>');
      });
    });
  });
});
