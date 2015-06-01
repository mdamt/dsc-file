var assert = require("assert");
var DscGrabber = function(file) {
  this.file = file;
}

DscGrabber.prototype.parseDsc = function(err, data, cb) {
  var InternetMessage = require("internet-message");
  if (err) {
    return cb(err);
  } else {
    if (data.indexOf("BEGIN PGP SIGNED MESSAGE") > 0) {
      data = data.slice(data.indexOf("\n\n") + 2, -1);
    }
    var parsed = InternetMessage.parse(data);
    cb(null, parsed);
  }
}

DscGrabber.prototype.parseRemote = function(cb) {
  var hyperquest = require("hyperquest");
  var r = hyperquest(this.file);
  var data = "";
  var self = this;
  var success = false;
  r.on("data", function(incomingData) {
    if (!success) return;
    data += incomingData;
  });
  r.on("end", function() {
    if (!success) return;
    self.parseDsc(null, data, cb);
  });
  r.on("response", function(res) {
    if (res.statusCode != 200) {
      return cb({code: res.statusCode});
    }
    success = true;
  });
  r.on("error", function(err) {
    cb(err);
  });
}

// Parses a DSC file, either remotely or locally
// It calls the callback `cb` with an object of the dsc contents 
DscGrabber.prototype.parse = function(cb) {
  assert.strictEqual(typeof(cb), "function", "Callback must be provided");
  if (this.file.indexOf("/") != 0) {
    return this.parseRemote(cb);
  }
  var fs = require("fs");
  var self = this;
  var f = fs.readFile(this.file, { encoding: "ascii" }, function(err, data) {
    self.parseDsc(err, data, cb);
  });
}

// Get list of files defined in the dsc
DscGrabber.prototype.files = function(cb) {
  this.parse(function(err, parsed) {
    if (err) return cb(err); 

    var files = [];
    if (!parsed.files) return cb({code: "ENOENT"});
    var list = parsed.files.split(" ");
    for (var i = 0; i < list.length; i += 3) {
      var entry = {
        hash: list[i + 0],
        size: list[i + 1],
        name: list[i + 2],
      }
      files.push(entry);
    }
    cb(null, files);
  });
}

module.exports = DscGrabber;
