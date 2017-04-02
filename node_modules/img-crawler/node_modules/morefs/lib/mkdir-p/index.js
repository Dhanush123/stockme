var fs = require('fs');

var splitPath = function(path) {
	return path.split("/").filter(function(el) {
		return el.trim();
	});
};

module.exports = function(path) {
	if(!path) {
		throw new Error('Path is required');
	}
	var dirs = splitPath(path);
	var fullPath = path[0] === '.' || path[0] !== '/' ? '' : '/';
	
	for(var i = 0; i<dirs.length; i++) {
		fullPath += dirs[i] + "/";
		if(!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath);
		}
	}
};