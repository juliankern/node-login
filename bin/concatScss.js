var glob = require('glob')
var path = require('path');
var fs = require('fs');
var concat = require('concat');

var files = glob.sync(path.normalize(__dirname + '/../views/**/*.scss')).map((f) => { return path.resolve(f) });

concat(files).then((result) => {
    fs.writeFile('./public/sass/views.scss', result, 'utf8', (err) => {
        if (err) throw err;
        global.success('The file has been saved!');
    });
})

