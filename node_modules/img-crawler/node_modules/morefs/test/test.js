var assert = require('assert'),
	fixture = require('./../main'),
	fs = require('fs'),
	rm = require('rimraf'),
	testOutPath = process.env.PWD + '/test-out';

var assertFileOnDisk = function(path) {
	assert.ok(fs.existsSync(path), path + ' wasn\'t found');
};

var cleanTestOutput = function(done) {
	fs.exists(testOutPath, function(exists) {
		if(exists) {
			rm(testOutPath, function(err){
				done();
			});							
		} else {
			done();
		}
	});
};

suite('createWriteStream', function() {
	
	teardown(function(done){
		cleanTestOutput(done);	
	});
	
	test('creates all subdirectories', function(done) {
		fixture.createWriteStream(testOutPath + '/dir1/dir2/file').write('contents');
		assertFileOnDisk(testOutPath + '/dir1/dir2/file');
		done();
	});
	
	test('no directories specified; only file', function(done) {
		fixture.createWriteStream('file').write('contents');
		assertFileOnDisk('file');
		rm('file', function(err) {
			done();
		});
	});
	
	test('undefined path', function(done) {
		try {
			fixture.createWriteStream(undefined);
		} catch(err) {
			assert.equal('path must be a string', err.message);
		}
		done();
	});
	
	//Revisit
//	test('empty path', function(done) {
//		try {
//			fixture.createWriteStream('');
//		} catch(err) {
//			console.log('error');
//			assert.equal('path must be a string', err.message);
//		}
//		done();
//	});
	
	test('blank path', function(done) {
		try {
			fixture.createWriteStream(' ');
		} catch(err) {
			assert.equal('path must be a string', err.message);
		}
		done();
	});	
	
});

	
