var glob = require('glob')
var path = require('path');

module.exports = {
    load: (dir, args) => {
        glob.sync(dir + '/**/*.js').forEach((file) => {
            if(!file.includes('/index.js')) {
                require(path.resolve(file))(args);
            }
        });
    }
} 