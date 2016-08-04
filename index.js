/**
 * Some parts stolen from https://github.com/FWeinb/grunt-svgstore :)
 */
var escapeForRegexp = require('escape-string-regexp');

// Matching an url() reference. To correct references broken by making ids unique to the source svg
var URL_PATTERN = /url\(#([^ ]+?)\s*\)/g;

/**
 * @param {String} id
 * @param {String|Function} pattern
 */
function renameId(id, pattern) {
  var result = (typeof pattern == 'function' ? pattern(id) : pattern).toString();
  var re = new RegExp(escapeForRegexp('[id]'), 'g');
  return result.replace(re, id);
}

/**
 * @param {String|Function} [pattern='[id]']
 * @returns {Function}
 */
module.exports = function (pattern) {
  var pattern = pattern || '[id]';

  return function (tree) {
    var mappedIds = {};

    tree.match({attrs: {id: /.*/}}, function(node) {
      var currentId = node.attrs.id;
      var newId = renameId(currentId, pattern);
      node.attrs.id = newId;

      mappedIds[currentId] = {
        id: newId,
        referenced: false,
        node: node
      };

      return node;
    });

    tree.match({tag: /.*/}, function(node) {
      var isStyleTag = node.tag == 'style' && Array.isArray(node.content) && node.content.length == 1;

      if (isStyleTag) {
        var match;
        while ((match = URL_PATTERN.exec(node.content[0])) !== null) {
          var id = match[1];
          if (!!mappedIds[id]) {
            mappedIds[id].referenced = true;
            var re = new RegExp(escapeForRegexp(match[0]), 'g');
            node.content[0] = node.content[0].replace(re, 'url(#' + mappedIds[id].id + ')');
          }
        }
      }

      if ('attrs' in node == false) {
        return node;
      }

      Object.keys(node.attrs).forEach(function(attrName) {
        var value = node.attrs[attrName];
        var id;
        var match;

        while ((match = URL_PATTERN.exec(value)) !== null) {
          id = match[1];
          if (!!mappedIds[id]) {
            mappedIds[id].referenced = true;
            var re = new RegExp(escapeForRegexp(match[0]), 'g');
            node.attrs[attrName] = value.replace(re, 'url(#' + mappedIds[id].id + ')');
          }
        }

        switch (attrName) {
          case 'href':
          case 'xlink:href':
            if (value.substring(0, 1) != '#') {
              break;
            }

            id = value.substring(1);
            var idObj = mappedIds[id];
            if (!!idObj) {
              idObj.referenced = false;
              node.attrs[attrName] = '#' + idObj.id;
            }
            break;
        }
      });

      return node;
    });
  }
};