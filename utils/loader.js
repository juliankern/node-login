var glob = require('glob')
var path = require('path');
var module, moduleFunc;

module.exports = {
    load: (dir, args) => {
        glob.sync(dir + '/**/*.js').forEach((file) => {
            if(!file.includes('/index.js')) {
                module = require(path.resolve(file));
                moduleFunc = [];

                if (typeof module === 'object' && !!module.length) {
                    moduleFunc = module.pop();
                } else {
                    moduleFunc = module;
                    module = [];
                }

                if (typeof args === 'function') {
                    args(module, moduleFunc, path.basename(file));
                } else {
                    module(args);
                }
            }
        });
    }
} 