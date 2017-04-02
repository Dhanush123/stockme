var fs = require('fs'),
	mkdirP = require('./lib/mkdir-p'),
	path = require('path');

module.exports.createWriteStream = function(streamToPath, options)  {
	if(streamToPath) {
		mkdirP(path.dirname(streamToPath));
	}
	return fs.createWriteStream(streamToPath, options);
};
