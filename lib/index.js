var assert = require("assert");
var DscGrabber = function(file) {
  this.file = file;
}

DscGrabber.prototype.parseDsc = function(err, data, cb) {
  var InternetMessage = require("internet-message");
  if (err) {
    return cb(err);
  } else {
    var parsed = InternetMessage.parse(data);
    if (parsed["-----begin pgp signed message----"] && parsed.body) {
      parsed = InternetMessage.parse(parsed.body);
      cb(null, parsed);
    } else {
      cb(null, parsed);
    }
  }
}

DscGrabber.prototype.parseRemote = function(cb) {
  var hyperquest = require("hyperquest");
  var r = hyperquest(this.file);
  var data = "";
  var self = this;
  r.on("data", function(incomingData) {
    data += incomingData;
  });
  r.on("end", function() {
    self.parseDsc(null, data, cb);
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

module.exports = DscGrabber;
