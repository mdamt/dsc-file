var assert = require("assert");
var Promise = require("promise");
var DscGrabber = function(file) {
  this.file = file;
  this.fileList = [];
}

DscGrabber.prototype.parseDsc = function(data) {
  var InternetMessage = require("internet-message");
  return new Promise(function(fulfill, reject) {
    if (data.indexOf("BEGIN PGP SIGNED MESSAGE") > 0) {
      data = data.slice(data.indexOf("\n\n") + 2, -1);
    }
    var parsed = InternetMessage.parse(data);
    fulfill(parsed);
  });
}

DscGrabber.prototype.parseRemote = function() {
  var hyperquest = require("hyperquest");
  var data = "";
  var self = this;
  var success = false;
  return new Promise(function(fulfill, reject) {
    var r = hyperquest(self.file);
    r.on("data", function(incomingData) {
      if (!success) return;
      data += incomingData;
    });
    r.on("end", function() {
      if (!success) return;
      self.parseDsc(data).then(function(result) {
        fulfill(result);
      });
    });
    r.on("response", function(res) {
      if (res.statusCode != 200) {
        reject({code: res.statusCode});
      } else {
        success = true;
      }
    });
    r.on("error", function(err) {
      reject(err);
    });
  });
}

// Parses a DSC file, either remotely or locally
// It calls the callback `cb` with an object of the dsc contents 
DscGrabber.prototype.parse = function(cb) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    if (self.file.indexOf("/") != 0) {
      self.parseRemote().then(function(result) {
        fulfill(result);
      }).catch(function(e) {
        reject(e);
      });
    } else {
      var fs = require("fs");
      var f = fs.readFile(self.file, { encoding: "ascii" }, function(err, data) {
        if (err) {
          reject(err);
        } else {
          self.parseDsc(data).then(function(result) {
            fulfill(result);
          });
        }
      });
    }
  });
}

// Get list of files defined in the dsc
DscGrabber.prototype.files = function(cb) {
  var self = this;
  return new Promise(function(fulfill, reject) {
    if (self.fileList.length > 0) return fulfill(self.fileList);
    self.parse().then(function(parsed) {
      var files = [];
      if (!parsed.files) return reject({code: "ENOENT"});
      var list = parsed.files.split(" ");
      for (var i = 0; i < list.length; i += 3) {
        var entry = {
          hash: list[i + 0],
          size: list[i + 1],
          name: list[i + 2],
        }
        files.push(entry);
      }
      self.fileList = files;
      fulfill(files);
    }).catch(function(err) {
      reject(err);
    });
  });
}

module.exports = DscGrabber;
