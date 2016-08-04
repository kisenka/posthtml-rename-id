var assert = require('assert');
var posthtml = require('posthtml');
var parser = require('posthtml-parser');
var render = require('posthtml-render');
var plugin = require('..');

var xmlParser = parser(({
  xmlMode: true,
  lowerCaseTags: false,
  lowerCaseAttributeNames: false
}));

var renderOptions = {
  closingSingleTag: 'slash',
  /**
   * @see https://github.com/posthtml/posthtml-render#singletags
   */
  singleTags: [
    'circle',
    'ellipse',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect',
    'use',
    'stop'
  ]
};

function test(name, options, input, expected) {
  it(name, function (done) {
    posthtml()
      .use(plugin(options))
      .process(input, {parser: xmlParser})
      .then(function (result) {
        var html = render(result.tree, renderOptions);
        assert.equal(html, expected);
        done();
      })
      .catch(done);
  });
}

var defaultPattern = 'test_[id]';

describe('posthtml-rename-id', function () {

  describe('pattern', function () {
    test(
      'default (does nothing)',
      undefined,
      '<svg><path id="a" /></svg>',
      '<svg><path id="a" /></svg>'
    );

    test(
      'string',
      'b',
      '<svg><path id="a" /></svg>',
      '<svg><path id="b" /></svg>'
    );

    test(
      '[id] placeholder',
      'test_[id]',
      '<svg><path id="a" /></svg>',
      '<svg><path id="test_a" /></svg>'
    );

    test(
      'function',
      function (id) {
        return id.toUpperCase()
      },
      '<svg><path id="aaa" /></svg>',
      '<svg><path id="AAA" /></svg>'
    );

    test(
      'function with placeholder in returned value',
      function () {
        return 'qwe_[id]_[id]'
      },
      '<svg><path id="aaa" /></svg>',
      '<svg><path id="qwe_aaa_aaa" /></svg>'
    );
  });

  describe('processing', function () {
    test(
      'not modify nodes without id',
      defaultPattern,
      '<svg><path /></svg>',
      '<svg><path /></svg>'
    );

    test(
      'modify any attribute value which contains `url(#id)`',
      defaultPattern,
      '<svg><linearGradient id="gradient"><stop stop-color="red" /></linearGradient><path fill="url(#gradient)" /></svg>',
      '<svg><linearGradient id="test_gradient"><stop stop-color="red" /></linearGradient><path fill="url(#test_gradient)" /></svg>'
    );

    test(
      'not modify attribute value which contains `url(#id)` when correspondent id not found',
      defaultPattern,
      '<svg><linearGradient><stop stop-color="red" /></linearGradient><path fill="url(#gradient)" /></svg>',
      '<svg><linearGradient><stop stop-color="red" /></linearGradient><path fill="url(#gradient)" /></svg>'
    );

    test(
      'modify `link/xlink:href` attribute',
      defaultPattern,
      '<svg><path id="path" /><use xlink:href="#path" href="#path" /></svg>',
      '<svg><path id="test_path" /><use xlink:href="#test_path" href="#test_path" /></svg>'
    );

    test(
      'not modify `link/xlink:href` attribute when correspondent id not found',
      defaultPattern,
      '<svg><path /><use xlink:href="#path" href="#path" /></svg>',
      '<svg><path /><use xlink:href="#path" href="#path" /></svg>'
    );

    test(
      'modify style declarations',
      defaultPattern,
      '<svg><path id="ref" /><path style="fill: url(#ref); background-image: url(#ref) ; " /></svg>',
      '<svg><path id="test_ref" /><path style="fill: url(#test_ref); background-image: url(#test_ref) ; " /></svg>'
    );

    test(
      'not modify style declarations when correspondent id not found',
      defaultPattern,
      '<svg><path /><path style="fill: url(#ref); background-image: url(#ref) ; " /></svg>',
      '<svg><path /><path style="fill: url(#ref); background-image: url(#ref) ; " /></svg>'
    );

    test(
      'modify style declarations in `style` tag',
      defaultPattern,
      '<svg><defs><style>.a {fill: url(#ref);}</style></defs><path id="ref" /><path fill="url(#ref)" /></svg>',
      '<svg><defs><style>.a {fill: url(#test_ref);}</style></defs><path id="test_ref" /><path fill="url(#test_ref)" /></svg>'
    );

    test(
      'not modify style declarations in `style` tag when correspondent id not found',
      defaultPattern,
      '<svg><defs><style>.a {fill: url(#ref);}</style></defs><path /><path fill="url(#ref)" /></svg>',
      '<svg><defs><style>.a {fill: url(#ref);}</style></defs><path /><path fill="url(#ref)" /></svg>'
    );
  });
});