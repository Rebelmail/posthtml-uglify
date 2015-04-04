var assert = require('chai').assert;
var cheerio = require('cheerio');
var HtmlUglify = require('../lib/main.js');

var htmlUglify = new HtmlUglify();

describe('htmlUglify', function() {
  describe('#rewriteCss', function() {
    it('rewrites an id given lookups', function() {
      var lookups = { 'id=abe': 'xz' };
      var html = '<style>#abe{ color: red; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>#xz{color:red;}</style>');
    });
    it('does not rewrite an id given no lookups', function() {
      var lookups = { };
      var html = '<style>#abe{ color: red; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>#abe{color:red;}</style>');
    });
    it('rewrites a label given lookups', function() {
      var lookups = { 'id=email': 'ab' };
      var html = '<style>label[for=email]{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label[for=ab]{color:blue;}</style>');
    });
    it('does not rewrite a label given no lookups', function() {
      var lookups = {};
      var html = '<style>label[for=email]{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label[for=email]{color:blue;}</style>');
    });
    it('rewrites a label with parentheses given lookups', function() {
      var lookups = { 'id=email': 'ab' };
      var html = '<style>label[for="email"]{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label[for="ab"]{color:blue;}</style>');
    });
    it('rewrites an id= given lookups', function() {
      var lookups = { 'id=email': 'ab' };
      var html = '<style>label[id=email]{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label[id=ab]{color:blue;}</style>');
    });
    it('rewrites an id= without parentheses given lookups', function() {
      var lookups = { 'id=email': 'ab' };
      var html = '<style>label[id="email"]{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label[id="ab"]{color:blue;}</style>');
    });
    it('rewrites a class given lookups', function() {
      var lookups = { 'class=email': 'ab' };
      var html = '<style>label.email{ color: blue; }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>label.ab{color:blue;}</style>');
    });
    it('rewrites css media queries', function() {
      var lookups = { 'id=abe': 'wz' };

      var html = '<style>@media screen and (max-width: 300px) { #abe{ color: red; } }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>@media screen and (max-width: 300px){#wz{color:red;}}</style>');
    });
    it('rewrites nested css media queries', function() {
      var lookups = { 'id=abe': 'wz' };

      var html = '<style>@media { @media screen and (max-width: 300px) { #abe{ color: red; } } }</style>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteCss($, lookups).html();
      assert.equal(results, '<style>@media {@media screen and (max-width: 300px){#wz{color:red;}}}</style>');
    });
  });

  describe('#rewriteElements', function() {
    it('rewrites an id', function() {
      var html = '<h1 id="abe">Header</h1>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 id="xz">Header</h1>');
    });
    it('rewrites a class', function() {
      var html = '<h1 class="abe">Header</h1>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 class="xz">Header</h1>');
    });
    it('rewrites a class', function() {
      var html = '<h1 class="abe">Header</h1>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 class="xz">Header</h1>');
    });
    it('rewrites a for', function() {
      var html = '<label for="abe">Label</h1>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<label for="xz">Label</label>');
    });
    it('rewrites multiple nested ids, classes, and fors', function() {
      var html = '<h1 id="header">Header <strong id="strong"><span id="span">1</span></strong></h1><label for="something">Something</label><label for="null">null</label><div class="some classes">Some Classes</div>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 id="xz">Header <strong id="wk"><span id="en">1</span></strong></h1><label for="km">Something</label><label for="dj">null</label><div class="yw qr">Some Classes</div>');
    });
    it('rewrites ids and labels to match when matching', function() {
      var html = '<h1 id="header">Header</h1><label for="header">Something</label><label for="header">Other</label>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 id="xz">Header</h1><label for="xz">Something</label><label for="xz">Other</label>');
    });
    it('rewrites multiple uses of the same class to the correct value', function() {
      var html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="header">Other</div>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 class="xz">Header</h1><label class="xz">Something</label><div class="xz">Other</div>');
    });
    it('rewrites multiple uses of the same class to the correct value', function() {
      var html = '<h1 class="header">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 class="xz">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
    it('rewrites other class combinations', function() {
      var html = '<h1 class="header other">Header</h1><label class="header">Something</label><div class="other">Other</div><div class="again">Again</div>';
      var $ = cheerio.load(html);
      var results = htmlUglify.rewriteElements($).html();
      assert.equal(results, '<h1 class="xz wk">Header</h1><label class="xz">Something</label><div class="wk">Other</div><div class="en">Again</div>');
    });
  });

  describe('#uglify', function() {
    it('uglifies style and html', function() {
      var html = htmlUglify.process("<style>.demo_class#andID{color: red}</style><div class='demo_class' id='andID'>Welcome to HTML Uglify</div>");
      assert.equal(html, '<style>.wk#xz{color:red;}</style><div class="wk" id="xz">Welcome to HTML Uglify</div>');
    });
    it('uglifies differently with a different salt', function() {
      var htmlUglify = new HtmlUglify({salt: 'other'});
      var html = htmlUglify.process("<style>.demo_class#andID{color: red}</style><div class='demo_class' id='andID'>Welcome to HTML Uglify</div>");
      assert.equal(html, '<style>.nx#vy{color:red;}</style><div class="nx" id="vy">Welcome to HTML Uglify</div>');
    });
  });
});

