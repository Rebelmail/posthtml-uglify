

const parser = require('posthtml-parser');
const render = require('posthtml-render');
const { walk } = require('posthtml/lib/api');

const plugin = require('..');

const { HTMLUglify } = plugin;
let htmlUglify = new HTMLUglify();

const parse = (html) => {
  const tree = parser(html);
  tree.walk = walk;
  return tree;
};

describe('HTMLUglify', () => {
  describe('#isWhitelisted', () => {
    let whitelist;

    beforeEach(() => {
      whitelist = ['#theid', '.theclass', '#★', '.★'];
      htmlUglify = new HTMLUglify({ whitelist });
    });
    it('returns true if id is in whitelist', () => {
      const whitelisted = htmlUglify.isWhitelisted('id', 'theid');
      expect(whitelisted).toBeTruthy();
    });
    it('returns false if id is in the whitelist but only checking for classes', () => {
      const whitelisted = htmlUglify.isWhitelisted('class', 'theid');
      expect(whitelisted).toBeFalsy();
    });
    it('returns true if class is in whitelist', () => {
      const whitelisted = htmlUglify.isWhitelisted('class', 'theclass');
      expect(whitelisted).toBeTruthy();
    });
    it('returns true if id is in whitelist for a unicode character', () => {
      const whitelisted = htmlUglify.isWhitelisted('id', '★');
      expect(whitelisted).toBeTruthy();
    });
    it('returns true if class is in whitelist for a unicode character', () => {
      const whitelisted = htmlUglify.isWhitelisted('class', '★');
      expect(whitelisted).toBeTruthy();
    });
    it('returns false if an unsupported type is passed', () => {
      const whitelisted = htmlUglify.isWhitelisted('foo', 'bar');
      expect(whitelisted).toBeFalsy();
    });
  });

  describe('::checkForStandardPointer', () => {
    it('returns undefined when name not found', () => {
      const lookups = {
        class: { something: 'zzz' },
      };
      const value = 'other';
      const pointer = HTMLUglify.checkForStandardPointer('class', value, lookups);

      expect(pointer).toBeUndefined();
    });
    it('returns pointer when found', () => {
      const lookups = {
        class: { something: 'zzz' },
      };
      const value = 'something';
      const pointer = HTMLUglify.checkForStandardPointer('class', value, lookups);

      expect(pointer).toBe('zzz');
    });
  });

  describe('::checkForAttributePointer', () => {
    it('returns undefined when not found', () => {
      const lookups = {
        class: { something: 'zzz' },
      };
      const value = 'other';
      const pointer = HTMLUglify.checkForAttributePointer('class', value, lookups);

      expect(pointer).toBeUndefined();
    });
    it('returns the pointer when value contains same string as an existing lookup', () => {
      const lookups = {
        class: { something: 'zzz' },
      };
      const value = 'somethingElse';
      const pointer = HTMLUglify.checkForAttributePointer('class', value, lookups);

      expect(pointer).toBe('zzzElse');
    });
  });

  describe('::insertLookup', () => {
    let lookups;

    beforeEach(() => {
      lookups = {};
    });

    it('updates lookups', () => {
      HTMLUglify.insertLookup('class', 'testClass', 'xz', lookups);
      expect(lookups.class.testClass).toBe('xz');
    });
  });

  describe('#generatePointer', () => {
    it('returns xz for counter 0 lookups', () => {
      const lookups = {};
      const pointer = htmlUglify.generatePointer(lookups);
      expect(pointer).toBe('xz');
    });
    it('returns wk for 1 lookups', () => {
      const lookups = { id: { a: 'xz' } };
      const pointer = htmlUglify.generatePointer(lookups);
      expect(pointer).toBe('wk');
    });
    it('returns en for 2 lookups', () => {
      const lookups = { id: { a: 'xz' }, class: { b: 'wk' } };
      const pointer = htmlUglify.generatePointer(lookups);
      expect(pointer).toBe('en');
    });
  });

  describe('#pointer', () => {
    it('generates a new pointer', () => {
      const pointer = htmlUglify.pointer('class', 'newClass', {});
      expect(pointer).toBe('xz');
    });
    it('generates a new pointer given a different one exists', () => {
      const lookups = {
        class: { otherClass: 'wk' },
      };
      const pointer = htmlUglify.pointer('class', 'newClass', lookups);
      expect(pointer).toBe('wk');
    });
    it('generates a new pointer given a different one exists in a different attribute', () => {
      const lookups = {
        id: { someId: 'wk' },
      };
      const pointer = htmlUglify.pointer('class', 'newClass', lookups);
      expect(pointer).toBe('wk');
    });
    it('finds an existing class pointer', () => {
      const lookups = {
        class: { someClass: 'xz' },
      };
      const pointer = htmlUglify.pointer('class', 'someClass', lookups);
      expect(pointer).toBe('xz');
    });
    it('finds an existing id pointer', () => {
      const lookups = {
        id: { someId: 'en' },
      };
      const pointer = htmlUglify.pointer('id', 'someId', lookups);
      expect(pointer).toBe('en');
    });
    it('finds a more complex existing pointer', () => {
      const lookups = {
        class: {
          test: 'xz',
          testOther: 'wk',
          otratest: 'en',
        },
      };
      const pointer = htmlUglify.pointer('class', 'test', lookups);
      expect(pointer).toBe('xz');
    });
  });

  describe('#pointerizeIdAndFor', () => {
    let node;

    beforeEach(() => {
      const html = '<p id="one"></p>';
      [node] = parse(html);
    });

    it('works with empty lookups', () => {
      const lookups = {};
      htmlUglify.pointerizeIdAndFor('id', node, lookups);
      expect(lookups).toEqual({ id: { one: 'xz' } });
    });
    it('works with existing lookup', () => {
      const lookups = { class: { one: 'ab' } };
      htmlUglify.pointerizeClass(node, lookups);
      expect(lookups).toEqual({ class: { one: 'ab' } });
    });
    it('works with whitelist', () => {
      const lookups = {};
      htmlUglify.whitelist = ['#one'];
      htmlUglify.pointerizeClass(node, lookups);
      expect(lookups).toEqual({});
    });
  });


  describe('#pointerizeClass', () => {
    let node;

    beforeEach(() => {
      const html = '<p class="one two"></p>';
      [node] = parse(html);
    });

    it('works with empty lookups', () => {
      const lookups = {};
      htmlUglify.pointerizeClass(node, lookups);
      expect(lookups).toEqual({ class: { one: 'xz', two: 'wk' } });
    });
    it('works with single lookup', () => {
      const lookups = { class: { one: 'ab' } };
      htmlUglify.pointerizeClass(node, lookups);
      expect(lookups).toEqual({ class: { one: 'ab', two: 'wk' } });
    });
    it('works with whitelist', () => {
      const lookups = {};
      htmlUglify.whitelist = ['.two'];
      htmlUglify.pointerizeClass(node, lookups);
      expect(lookups).toEqual({ class: { one: 'xz' } });
    });
  });

  describe('#rewriteStyles', () => {
    it('rewrites an id given lookups', () => {
      const lookups = { id: { foo: 'bar' } };
      const html = '<style>#foo{ color: red; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>#bar{ color: red; }</style>');
    });
    it('rewrites an id', () => {
      const lookups = { };
      const html = '<style>#xz{ color: red; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>#xz{ color: red; }</style>');
    });
    it('rewrites an id with the same name as the element', () => {
      const lookups = { id: { label: 'ab' } };
      const html = '<style>label#label{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label#ab{ color: blue; }</style>');
    });
    it('rewrites a for= given lookups', () => {
      const lookups = { id: { email: 'ab' } };
      const html = '<style>label[for=email]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[for=ab]{ color: blue; }</style>');
    });
    it('rewrites a for=', () => {
      const lookups = {};
      const html = '<style>label[for=email]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[for=xz]{ color: blue; }</style>');
    });
    it('rewrites a for= with quotes given lookups', () => {
      const lookups = { id: { email: 'ab' } };
      const html = '<style>label[for="email"]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[for="ab"]{ color: blue; }</style>');
    });
    it('rewrites a for= with the same name as the element', () => {
      const lookups = { id: { label: 'ab' } };
      const html = '<style>label[for="label"]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[for="ab"]{ color: blue; }</style>');
    });
    it('rewrites an id= given lookups', () => {
      const lookups = { id: { email: 'ab' } };
      const html = '<style>label[id=email]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[id=ab]{ color: blue; }</style>');
    });
    it('rewrites an id= with quotes given lookups', () => {
      const lookups = { id: { email: 'ab' } };
      const html = '<style>label[id="email"]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[id="ab"]{ color: blue; }</style>');
    });
    it('rewrites an id= with quotes and with the same name as the element', () => {
      const lookups = { id: { label: 'ab' } };
      const html = '<style>label[id="label"]{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label[id="ab"]{ color: blue; }</style>');
    });
    it('rewrites a class given lookups', () => {
      const lookups = { class: { email: 'ab' } };
      const html = '<style>label.email{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label.ab{ color: blue; }</style>');
    });
    it('rewrites a class with the same name as the element', () => {
      const lookups = { class: { label: 'ab' } };
      const html = '<style>label.label{ color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label.ab{ color: blue; }</style>');
    });
    it('rewrites a class= given lookups', () => {
      const lookups = { class: { email: 'ab' } };
      const html = '<style>form [class=email] { color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>form [class=ab] { color: blue; }</style>');
    });
    it('rewrites multi-selector rule', () => {
      const lookups = { class: { email: 'ab' } };
      const html = '<style>label.email, a.email { color: blue; }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>label.ab, a.ab { color: blue; }</style>');
    });
    it('rewrites css media queries', () => {
      const lookups = { id: { abe: 'wz' } };
      const html = '<style>@media screen and (max-width: 300px) { #abe{ color: red; } }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>@media screen and (max-width: 300px) { #wz{ color: red; } }</style>');
    });
    it('rewrites nested css media queries', () => {
      const lookups = { id: { abe: 'wz' } };
      const html = '<style>@media { @media screen and (max-width: 300px) { #abe{ color: red; } } }</style>';
      const result = htmlUglify.rewriteStyles(parse(html), lookups);
      expect(render(result)).toBe('<style>@media { @media screen and (max-width: 300px) { #wz{ color: red; } } }</style>');
    });
    it('handles malformed syntax', () => {
      const html = '<style>@media{.media{background: red}</style>';
      const result = htmlUglify.rewriteStyles(parse(html));
      expect(render(result)).toBe('<style>@media{.xz{background: red}}</style>');
    });
  });

  describe('#rewriteElements', () => {
    it('rewrites an id', () => {
      const html = '<h1 id="abe">Header</h1>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 id="xz">Header</h1>');
    });
    it('rewrites a class', () => {
      const html = '<h1 class="abe">Header</h1>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz">Header</h1>');
    });
    it('rewrites a multiple classes', () => {
      const html = '<h1 class="foo bar">Header</h1>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz wk">Header</h1>');
    });
    it('rewrites a multiple classes with more than one space between them', () => {
      const html = '<h1 class="foo   bar">Header</h1>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz wk">Header</h1>');
    });
    it('rewrites a for', () => {
      const html = '<label for="abe">Label</h1>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<label for="xz">Label</label>');
    });
    it('rewrites multiple nested ids, classes, and fors', () => {
      const html = '<h1 id="header">Header <strong id="strong"><span id="span">1</span></strong></h1><label for="something">Something</label><label for="null">null</label><div class="some classes">Some Classes</div>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 id="xz">Header <strong id="wk"><span id="en">1</span></strong></h1><label for="km">Something</label><label for="dj">null</label><div class="yw qr">Some Classes</div>');
    });
    it('rewrites ids and labels to match when matching', () => {
      const html = '<h1 id="header">Header</h1><label for="header">Something</label><label for="header">Other</label>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 id="xz">Header</h1><label for="xz">Something</label><label for="xz">Other</label>');
    });
    it('rewrites multiple uses of the same class to the correct value', () => {
      const html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="header">Other</div>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz">Header</h1><label class="xz">Something</label><div class="xz">Other</div>');
    });
    it('rewrites multiple uses of the same class to the correct value', () => {
      const html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
    it('rewrites other class combinations', () => {
      const html = '<h1 class="header other">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      const result = htmlUglify.rewriteElements(parse(html));
      expect(render(result)).toBe('<h1 class="xz wk">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
  });

  describe('#process', () => {
    it('uglifies style and html', () => {
      const { html } = plugin.process("<style>.test#other{}</style><p class='test' id='other'></p>");
      expect(html).toBe('<style>.xz#wk{}</style><p class="xz" id="wk"></p>');
    });
    it('uglifies differently with a different salt', () => {
      const { html } = plugin.process("<style>.demo_class#andID{color: red}</style><div class='demo_class' id='andID'>Welcome to HTML Uglify</div>", { salt: 'other' });
      expect(html).toBe('<style>.vy#nx{color: red}</style><div class="vy" id="nx">Welcome to HTML Uglify</div>');
    });
    it('uglifies media query with no name', () => {
      const { html } = plugin.process("<style>@media {.media{ color: red; }}</style><div class='media'>media</div>");
      expect(html).toBe('<style>@media {.xz{ color: red; }}</style><div class="xz">media</div>');
    });
    it('uglifies media queries inside of media queries', () => {
      const { html } = plugin.process("<style>@media screen{@media screen{.media-nested{background:red;}}}</style><div class='media-nested'>media-nested</div>");
      expect(html).toBe('<style>@media screen{@media screen{.xz{background:red;}}}</style><div class="xz">media-nested</div>');
    });
    it('uglifies media queries inside of media queries inside of media queries', () => {
      const { html } = plugin.process("<style>@media screen{@media screen{@media screen{.media-double-nested{background:red;}}}}</style><div class='media-double-nested'>media-double-nested</div>");
      expect(html).toBe('<style>@media screen{@media screen{@media screen{.xz{background:red;}}}}</style><div class="xz">media-double-nested</div>');
    });
    it('uglifies css inside @supports at-rule', () => {
      const { html } = plugin.process("<style>@supports (animation) { .someClass {} }</style><div class='someClass'></div>");
      expect(html).toBe('<style>@supports (animation) { .xz {} }</style><div class="xz"></div>');
    });
    it('uglifies with whitelisting for ids and classes', () => {
      const whitelist = ['#noform', '.withform'];
      const { html } = plugin.process("<style>#noform { color: red; } .withform{ color: red } #other{ color: red; }</style><div id='noform' class='noform'>noform</div><div class='withform'>withform</div><div id='other'>other</div>", { salt: 'use the force harry', whitelist });
      expect(html).toBe('<style>#noform { color: red; } .withform{ color: red } #xz{ color: red; }</style><div id="noform" class="wk">noform</div><div class="withform">withform</div><div id="xz">other</div>');
    });
    it('uglifies a class with a ::before', () => {
      const { html } = plugin.process("<style>.before::before{color: red}</style><div class='before'>before</div>");
      expect(html).toBe('<style>.xz::before{color: red}</style><div class="xz">before</div>');
    });
    it('uglifies class attribute selectors', () => {
      const { html } = plugin.process('<style>body[yahoo] *[class*=paddingreset] {}</style><div class="paddingreset1">paddingreset1</div>');
      expect(html).toBe('<style>body[yahoo] *[class*=xz] {}</style><div class="xz1">paddingreset1</div>');
    });
    it('uglifies id attribute selectors', () => {
      const { html } = plugin.process('<style>body[yahoo] *[id*=paddingreset] { padding:0 !important; }</style><div id="paddingreset1">paddingreset1</div>');
      expect(html).toBe('<style>body[yahoo] *[id*=xz] { padding:0 !important; }</style><div id="xz1">paddingreset1</div>');
    });
    it('uglifies for attribute selectors', () => {
      const { html } = plugin.process('<style>body[yahoo] *[id*=paddingreset] { padding:0 !important; }</style><div for="paddingreset1">paddingreset1</div>');
      expect(html).toBe('<style>body[yahoo] *[id*=xz] { padding:0 !important; }</style><div for="xz1">paddingreset1</div>');
    });
    it('uglifies attribute selectors correctly towards the end of a stylesheet', () => {
      const { html } = plugin.process("<style>.test{} .alphatest{} *[class*=test]{}</style><p class='alphatest'></p>");
      expect(html).toBe('<style>.xz{} .alphaxz{} *[class*=xz]{}</style><p class="alphaxz"></p>');
    });
    it('uglifies attribute selectors with spaced classes', () => {
      const { html } = plugin.process("<style>.test{} .alphatest{} *[class*=test]{}</style><p class='alphatest beta'></p>");
      expect(html).toBe('<style>.xz{} .alphaxz{} *[class*=xz]{}</style><p class="alphaxz en"></p>');
    });
  });

  describe('attribute selectors', () => {
    describe('equal selector', () => {
      it('uglifies', () => {
        let { html } = plugin.process('<style>*[class=test] {}</style><div class="test"></div>');
        expect(html).toBe('<style>*[class=xz] {}</style><div class="xz"></div>');

        html = plugin.process('<style>*[id=test] {}</style><div id="test"></div>').html;
        expect(html).toBe('<style>*[id=xz] {}</style><div id="xz"></div>');

        html = plugin.process('<style>*[id=test] {}</style><div for="test"></div>').html;
        expect(html).toBe('<style>*[id=xz] {}</style><div for="xz"></div>');
      });
    });
    describe('anywhere selector', () => {
      it('uglifies in the middle of a string', () => {
        let { html } = plugin.process('<style>*[class*=test] {}</style><div class="ZZtestZZ"></div>');
        expect(html).toBe('<style>*[class*=xz] {}</style><div class="ZZxzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="ZZtestZZ"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div id="ZZxzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="ZZtestZZ"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div for="ZZxzZZ"></div>');
      });

      it('uglifies at the start of a string', () => {
        let { html } = plugin.process('<style>*[class*=test] {}</style><div class="testZZ"></div>');
        expect(html).toBe('<style>*[class*=xz] {}</style><div class="xzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="testZZ"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div id="xzZZ"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="testZZ"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div for="xzZZ"></div>');
      });

      it('uglifies at the end of a string', () => {
        let { html } = plugin.process('<style>*[class*=test] {}</style><div class="ZZtest"></div>');
        expect(html).toBe('<style>*[class*=xz] {}</style><div class="ZZxz"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div id="ZZtest"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div id="ZZxz"></div>');

        html = plugin.process('<style>*[id*=test] {}</style><div for="ZZtest"></div>').html;
        expect(html).toBe('<style>*[id*=xz] {}</style><div for="ZZxz"></div>');
      });
    });
    describe('begins with selector', () => {
      it('uglifies at the start of a string', () => {
        let { html } = plugin.process('<style>*[class^=test] {}</style><div class="testZZ"></div>');
        expect(html).toBe('<style>*[class^=xz] {}</style><div class="xzZZ"></div>');

        html = plugin.process('<style>*[id^=test] {}</style><div id="testZZ"></div>').html;
        expect(html).toBe('<style>*[id^=xz] {}</style><div id="xzZZ"></div>');

        html = plugin.process('<style>*[id^=test] {}</style><div for="testZZ"></div>').html;
        expect(html).toBe('<style>*[id^=xz] {}</style><div for="xzZZ"></div>');
      });
    });
    describe('ends with selector', () => {
      it('uglifies at the end of a string', () => {
        let { html } = plugin.process('<style>*[class$=test] {}</style><div class="ZZtest"></div>');
        expect(html).toBe('<style>*[class$=xz] {}</style><div class="ZZxz"></div>');

        html = plugin.process('<style>*[id$=test] {}</style><div id="ZZtest"></div>').html;
        expect(html).toBe('<style>*[id$=xz] {}</style><div id="ZZxz"></div>');

        html = plugin.process('<style>*[id$=test] {}</style><div for="ZZtest"></div>').html;
        expect(html).toBe('<style>*[id$=xz] {}</style><div for="ZZxz"></div>');
      });
    });
  });
});
