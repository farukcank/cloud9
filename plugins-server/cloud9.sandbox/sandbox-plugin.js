"use strict";

var assert = require("assert");
var netutil = require("netutil");
var url = require("url");
var http = require("http");
function getPortFromRemote(options, callback){
	var portAssignerURL = url.parse(options.portAssignerURL);
	if (!portAssignerURL.query)
		portAssignerURL.query = {};
	portAssignerURL.query.workspaceId = options.workspaceId;
	portAssignerURL = url.parse(url.format(portAssignerURL));
	var reqOptions = {};	
	reqOptions.hostname = portAssignerURL.host;
	reqOptions.port = portAssignerURL.port;
	reqOptions.path = portAssignerURL.path;	
	
	var cb = function(response) {
	  var str = ''
	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  response.on('end', function () {
		if (response.statusCode!=200){
			var error = new Error("Response code: " + res.statusCode + " for : "+path);
			callback(error, 0);
		} else {
			callback(null, parseInt(str));
		}
		console.log(str);
	  });
	};

	var req = http.request(options, cb);
	req.end();	
}
module.exports = function(options, imports, register) {

    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");
    // assert(options.userDir, "option 'userDir' is required");
    assert(options.host, "option 'host' is required");

    register(null, {
        sandbox: {
            getProjectDir: function(callback) {
                callback(null, options.projectDir);
            },
            getWorkspaceId: function(callback) {
                callback(null, options.workspaceId);
            },
            getUnixId: function(callback) {
                callback(null, options.unixId || null);
            },
            getPort: function(callback) {
				console.log("FOUND FREE PORT: "+port+" workspaceId:\""+options.workspaceId+"\" host:\"" +options.host+"\" projectDir:\""+options.projectDir+"\" portassignerurl:\""+options.portAssignerURL+"\"");
				if (options.portAssignerURL && options.portAssignerURL !== null){
					getPortFromRemote(options, function(err, port){
						if (err)
							console.log(err);
						console.log(port);
						callback(err, port);
					});
				}else{
					// grab a free port
					netutil.findFreePort(20000, 64000, options.host, function (err, port) {					
						callback(err, port);
					});
				}
            },
            getHost: function(callback) {
                callback(null, options.host);
            },
            getUserDir: function(callback) {
                callback(null, options.userDir);
            }
        }
    });
};