// Require dependencies
var fs = require('fs');
var mkdirp = require('mkdirp');
var util = require('util');
var async = require('async');
var svg2png = require('svg2png');
var config = require('./config');
var colors = require('material-colors');
var getDirName = require("path").dirname;


// Material Design color variables
var colorKeys = Object.keys(colors), currentColorIndex = 0;

// Randomize color keys
colorKeys.sort(function () {
    return .5 - Math.random();
});

// Load base icon SVG file as UTF-8 string
var baseSVG = fs.readFileSync(__dirname + '/' + config.src.svg.basePath, {encoding: 'utf8'});

async.forEach = function (o, cb) {
    var counter = 0,
        keys = Object.keys(o),
        len = keys.length;
    var next = function () {
        if (counter < len) cb(o[keys[counter++]], next);
    };
    next();
};

// Main generator function
exports.generateIcons = function (callback) {
    // Convert letters to char array
    var letters = config.generator.characters.split('');
    return async.forEach(Object.keys(colors), function (color, callback) {
        console.log("Color: " + color);
        return async.eachSeries(letters, function (letter, callback) {
            console.log('Generating icons for letter: ' + letter + ' and color ' + color);
            return exports.generateLetterIcon(letter, color, function (err) {
                return callback(err);
            });
        }, function done(err) {
            if (err) {
                console.error(util.inspect(err));
            }
            callback(err);
        });
    }, function (err) {
        if (err) {
            console.error(util.inspect(err));
        }
        return callback(err)
    });
};

// Generates icons for a single letter
exports.generateLetterIcon = function (letter, color, callback) {
    // Derive SVG from base letter SVG
    var letterSVG = baseSVG;

    // Get a random Material Design color
    var colorCode = this.getColorCode(color);

    // Substitude placeholders for color and letter
    letterSVG = letterSVG.replace('{c}', colorCode);
    letterSVG = letterSVG.replace('{x}', letter);

    // Get filesystem-friendly file name for letter
    var fileName = this.getIconFilename(letter);

    // Define SVG/PNG output path
    var outputSVGPath = __dirname + '/' + config.dist.svg.outputPath + color + '/' + fileName + '.svg';
    var outputPNGPath = __dirname + '/' + config.dist.png.outputPath + color + '/' + fileName + '.png';

    console.log(outputSVGPath);
    console.log(outputPNGPath);

    return mkdirp(getDirName(outputSVGPath), function (err) {
        if (err) {
            return callback(err)
        }
        // Export the letter as an SVG file
        fs.writeFileSync(outputSVGPath, letterSVG);

        // Convert the SVG file into a PNG file using svg2png
        svg2png(outputSVGPath, outputPNGPath, config.dist.png.dimensions, function (err) {
            // Report error
            if (err) {
                return callback(err);
            }

            // Success!
            callback();
        });
    });
};

// Returns a filesystem-friendly filename (without extension)
this.getIconFilename = function (letter) {
    // Not alphanumeric?
    if (!letter.match(/^[0-9a-zA-Z]$/)) {
        // Return charcode instead
        return 'ASCII-' + letter.charCodeAt(0);
    }

    // We're good
    return letter;
};

// Returns the next Material Design color for the icon background
this.getColorCode = function (color) {
    // Return most satured color hex (500)
    return colors[color]['500'];
};