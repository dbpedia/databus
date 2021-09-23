var fs = require('fs');
var glob = require("glob-promise");
var { minify } = require("terser");


var instance = {};

instance.minify = async function (rootFolder, format, targetFile, targetMap) {

  var globExpr = __dirname + '/' + rootFolder + "/**/*." + format;
  console.log('Minifying files with glob expression: ' + globExpr);
  var files = await glob(globExpr);

  var minifiables = {};

  for(var f in files) {
    var file = files[f];
    minifiables[file] = fs.readFileSync(file, "utf8");
  }
   
  var targetFilePath = __dirname + '/' + rootFolder + '/' + targetFile;
  var targetMapPath = __dirname + '/' + rootFolder + '/' + targetMap;

  var options =  { sourceMap: true };
  var minified = await minify(minifiables, options);

  fs.writeFileSync(targetFilePath, minified.code, "utf8");
  fs.writeFileSync(targetMapPath, minified.map, "utf8");
  console.log('Minifying files successfull. Result at ' + targetFilePath);
}

module.exports = instance;