"use strict";

const glob = require('glob')
const path = require('path');
const fs = require('fs');
const concat = require('concat');

let files = glob.sync(path.normalize(__dirname + '/../views/**/*.scss')).map((f) => { return path.resolve(f) });

concat(files).then((result) => {
    fs.writeFile('./public/sass/views.scss', result, 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
})

