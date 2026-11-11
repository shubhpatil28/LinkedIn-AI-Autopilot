const path = require('path');
const Module = require('module');
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.join(process.cwd(), request.slice(2));
  }
  return orig.call(this, request, parent, isMain, options);
};
require('sucrase/register');
require(path.resolve(process.argv[2]));

