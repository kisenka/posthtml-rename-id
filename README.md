# posthtml-rename-id plugin [![Build Status](https://travis-ci.org/kisenka/posthtml-rename-id.svg?branch=master)](https://travis-ci.org/kisenka/posthtml-rename-id) [![Coverage Status](https://coveralls.io/repos/github/kisenka/posthtml-rename-id/badge.svg?branch=master)](https://coveralls.io/github/kisenka/posthtml-rename-id?branch=master)

[PostHTML](https://github.com/posthtml/posthtml) plugin to rename id attributes and it's references.

Handle following cases:

- `href="#id"` and `xlink:href="#id"`
- `style` attribute values like `style="fill: url(#id)"`
- `<style>` tag values like `.selector {fill: url(#id)"}`
- any other attribute value like `attr="url(#id)"`

## Installation

```sh
npm install posthtml-rename-id --save
```

## Usage

```js
var posthtml = require('posthtml');
var renameId = require('posthtml-rename-id');

posthtml()
  .use(renameId('prefix_[id]'))
  .process('<div id="qwe"></div> <a href="#qwe"></a>')
  .then(function(result) {
    console.log(result);
  });

// <div id="prefix_qwe"></div> <a href="#prefix_qwe"></a>
```

## Configuration

### `plugin(pattern: string|Function)` (optional, `[id]` by default)

Renaming pattern. `[id]` placeholder can be used as current id of an element.
If `pattern` provided as a function it will be called with current id as first argument.
Function should return the new id as string (`[id]` can be used as well).

Uppercase all ids:
```js
posthtml([
  renameId(function(id) { return id.toUpperCase() })
]);
```

Rename all ids to `elem_{counter}`:
```js
var c = 0;
posthtml([
  renameId(function(id) { c++; return 'elem_' + c; })
]);
```