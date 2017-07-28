const glob = require('glob')
const path = require('path');

module.exports = {
    /**
     * loader to load specific JS files
     *
     * @author Julian Kern <julian.kern@dmc.de>
     *
     * @param  {string} dir  Directory to be checked
     * @param  {object} args Arguments to be send to the module
     */
    load: (dir, args) => {
        let module, moduleFunc;
        glob.sync(dir + '/**/*.js').forEach((file) => {
            if(!file.includes('/index.js')) {
                // require every found file first
                module = require(path.resolve(file));
                moduleFunc = {};

                if (typeof module === 'object' && !!module.length) {
                    // if module is an array, remove last value (actual module/route) and save it in moduleFunc
                    moduleFunc = module.pop();
                } else {
                    // the module has no options
                    moduleFunc = module;
                    module = [];
                }

                // if the caller wants to exec a callback
                if (typeof args === 'function') {
                    // execute the callback with the options, the module itself and the original path
                    args(module, moduleFunc, file);
                } else {
                    // call the module directly
                    module(args);
                }
            }
        });
    }
} 