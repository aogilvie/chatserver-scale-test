/*
 * JSHint wrapper
 *
 */
var jshint = require('jshint').JSHINT,
  fs = require('fs'),
  path = require('path'),
  CONFIG = require(process.argv[ 2 ]).config;

require('colors');

/**
 * Handle uncaught errors
 */
var fLogError = function (oError) {
  console.log( oError.message.red );
};

process.on('error', fLogError);

/**
 * Turn a relative path to an absolute one
 */
var fToAbsolute = function (sPath) {
  return path.resolve(path.dirname(module.filename), sPath);
};

var fRunOnce = function (path) {
  var pFilesPaths = fGetAllFiles(path);
  var sPath, sContent, isSuccess, errorPointer;
  var jshintrc = fs.readFileSync(fToAbsolute(CONFIG.jshintrc), 'utf8');
  var errorCounter = 0;
  jshintrc = JSON.parse(jshintrc);

  for (var i = 0; i < pFilesPaths.length; i++) {
    // Read the file in
    sPath = pFilesPaths[i];
    sContent = fs.readFileSync(sPath, 'utf8');

    // Run the linter
    isSuccess = jshint(sContent, jshintrc);

    // Report the test
    if (!isSuccess) {
      errorCounter += 1;
      jshint.errors.forEach(function (err) {
        if (err !== null && err.hasOwnProperty) {
          errorPointer = '';
          if (typeof err.character !== 'undefined') {
            for (var j = 0; j < err.character; j++) {
              errorPointer += '-';
            }
            errorPointer += '^';
          }
          if (typeof err.evidence !== 'undefined') {
            console.error(('\n' + err.evidence.trim()).red
            + ('\n' + errorPointer).green);
          }
          console.error(('File: ').blue + sPath);
          console.error(('Line: ').blue + err.line
            + (' \nReason: ').blue + err.reason);
        }
      });
    }
  }

  if (errorCounter > 0) {
    if (CONFIG.ignoreExitValue === false) {
      process.exit(1);
    }
  }
  process.exit(0);
};

/**
 * @param {string} sBasePath The root path.
 * @returns {Array} An array of all the files from the root path.
 */
var fGetAllFiles = function (sBasePath) {
  var pFilesPaths = [];
  var pPaths = fs.readdirSync(sBasePath);
  var sPath, oStats;

  for (var i = 0; i < pPaths.length; i++) {
    sPath = path.resolve(sBasePath, pPaths[i]);
    oStats = fs.statSync(sPath);

    // If this is a file add it to the array.
    if (fIsValidFile(oStats, sPath)) {
      pFilesPaths.push(sPath);
    }
    // Else if it is a folder recurse.
    else if (fIsValidFolder(oStats, sPath)) {
      pFilesPaths = pFilesPaths.concat(fGetAllFiles(sPath));
    }
  }
  return pFilesPaths;
};

/**
 * @returns {boolean} A file is valid if is a less file and is not in the ignore list.
 */
var fIsValidFile = function (oStats, sPath) {
  return oStats.isFile(sPath) && path.extname(sPath) === CONFIG.jsFileExtension && CONFIG.ignoreFiles.indexOf(path.basename(sPath)) < 0;
};

/**
 * @returns {boolean} A folder is valid if it not in the ignore list.
 */
var fIsValidFolder = function (oStats, sPath) {
  var ignore = false;
  var len = CONFIG.ignoreFolders.length;
  var dir;
  for (var i = 0; i < len; i += 1) {
    // Split by separator
    dir = sPath.split(path.sep);
    // Check valid dir against last dir in the path array
    dir = dir[dir.length - 1];
    // Check for matching ignore
    if (dir.indexOf(CONFIG.ignoreFolders[i]) > -1) {
      ignore = true;
      console.log('ignoring: ' + dir);
      break;
    }
  }
  return oStats.isDirectory() && !ignore;
};

// Start
fRunOnce(fToAbsolute(CONFIG.rootDir));
