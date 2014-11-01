"use strict";

var assert = require("assert");
var netutil = require("netutil");
var net = require('net');

function PortAssignmentServer(port){
	var self = this;	
	self.currentClient = null;
	self.currentCallback = null;
	self.data = "";
	self.portReceived = function(port){
		if (self.currentCallback !== null){
			self.currentCallback(null, port);
			self.currentCallback = null;
		}
	};
	self.processData = function(){
		var index = self.data.indexOf('\n');
		if (index >= 0){
			var port = parseInt(self.data.substring(0, index));
			self.portReceived(port);
			data = data.substring(index+1);
			self.processData();
		}
	};
	self.server = net.createServer(function(c) {
	  c.on('end', function() {		
		if (self.currentClient === c){
			self.currentClient = null;
			console.log("Port assigner disconnected");
		}
	  });
	  c.on('data', function(data) {
		self.data = self.data + data;
		self.processData();
	  });
	  if (self.currentClient !== null){
		self.currentClient.end();
	  }	  
	  self.currentClient = c;
	  c.write("ready\n");
	  console.log("Port assigner connected");
	});
	self.requestPort = function(callback){
		if (self.currentCallback !== null){
			var error = new Error("There is a pending port request");
			setTimeout(function(){callback(error, 0);},0);
		}else if (self.currentClient !== null){
			self.currentClient.write("newportrequired\n");
			var fulfilled = false;
			self.currentCallback = function(err, port){
				fulfilled = true;
				callback(err, port);
			}
			setTimeout(function(){
				if (!fulfilled){
					var error = new Error("Timeout");
					callback(error, 0);
				}
			}, 5000);
		}else{
			var error = new Error("No port assigner available");
			setTimeout(function(){callback(error, 0);}, 0);
		}
	}
	self.server.listen(port);
	console.log("Port assignment server started at port "+port);
}

module.exports = function(options, imports, register) {
    assert(options.workspaceId, "option 'workspaceId' is required");
    assert(options.projectDir, "option 'projectDir' is required");
    // assert(options.userDir, "option 'userDir' is required");
    assert(options.host, "option 'host' is required");
	var portAssignmentServer = null;
	if (options.portAssignmentServerPort && options.portAssignmentServerPort !== null)
	{
		portAssignmentServer = new PortAssignmentServer(options.portAssignmentServerPort);
	}
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
				if (portAssignmentServer !== null){
					portAssignmentServer.requestPort(callback);
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