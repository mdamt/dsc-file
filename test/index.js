var assert = require("assert");
var nock = require("nock");
var data = __dirname + "/assets/";
var remote = "http://remote.site";
var DscGrabber = require(__dirname + "/..");

describe("Parsing DSC", function() {
  var dsc;
  
  it("parses a plain dsc", function(done) {
    dsc = new DscGrabber(data + "dsc-without-pgp.dsc");
    dsc.parse().then(function(parsed) {
      assert.strictEqual(parsed.format, "3.0 (native)");
      done();
    });
  });

  it("parses a dsc enclosed in PGP body", function(done) {
    dsc = new DscGrabber(data + "dsc-with-pgp.dsc");
    dsc.parse().then(function(parsed) {
      assert.strictEqual(parsed.format, "1.0");
      done();
    });
  });

  it("breaks because specified file doesn't exist", function(done) {
    dsc = new DscGrabber(data + "nonexistant-dsc");
    dsc.parse().catch(function(err) {
      assert.strictEqual(err.code, "ENOENT");
      done();
    });
  });

  it("parses a remote plain dsc", function(done) {
    var f = "dsc-without-pgp.dsc";
    nock(remote)
      .get("/" + f)
      .replyWithFile(200, data + f);

    dsc = new DscGrabber("http://remote.site/dsc-without-pgp.dsc");
    dsc.parse().then(function(parsed) {
      assert.strictEqual(parsed.format, "3.0 (native)");
      done();
    });
  });

  it("parses a remote pgp wrapped dsc", function(done) {
    var f = "dsc-with-pgp.dsc";
    nock(remote)
      .get("/" + f)
      .replyWithFile(200, data + f);

    dsc = new DscGrabber("http://remote.site/dsc-with-pgp.dsc");
    dsc.parse().then(function(parsed) {
      assert.strictEqual(parsed.format, "1.0");
      done();
    });
  });

  it("parses a non-existant remote dsc", function(done) {
    var f = "nonexistant.dsc";
    nock(remote)
      .get("/" + f)
      .reply(404,{});

    dsc = new DscGrabber("http://remote.site/nonexistant.dsc");
    dsc.parse().catch(function(err) {
      assert.strictEqual(err.code, 404);
      done();
    });
  });

  it("parses a errorneous remote dsc", function(done) {
    dsc = new DscGrabber("http://0.0.0.1/nonexistant.dsc");
    dsc.parse().catch(function(err) {
      done();
    });
  });

});

describe("Get file list", function() {
  it("gets list of files from a plain dsc", function(done) {
    var f = "dsc-without-pgp.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files().then(function(files) {
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0].name, "manokwari_0.2.1.37.tar.gz");
      done();
    });
  });

  it("gets list of multiple files", function(done) {
    var f = "dsc-with-pgp.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files().then(function(files) {
      assert.strictEqual(files.length, 2);
      assert.strictEqual(files[0].name, "abcmidi_20070318.orig.tar.gz");
      assert.strictEqual(files[1].name, "abcmidi_20070318-3.diff.gz");
      done();
    });
  });

  it("catches errorneous local dsc", function(done) {
    dsc = new DscGrabber(data + "non-existant");
    dsc.files().catch(function(err) {
      done();
    });
  });


  it("catches errorneous remote dsc", function(done) {
    dsc = new DscGrabber("http://0.0.0.1/nonexistant.dsc");
    dsc.files().catch(function(err) {
      done();
    });
  });

  it("gets an error from a broken dsc", function(done) {
    var f = "broken.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files().catch(function(err) {
      assert.notStrictEqual(err, null);
      done();
    });
  });
});

describe("Getting actual files", function() {
  var mock = require("mock-fs");
  var crypto = require("crypto");
  var fs = require("fs");

  before(function(done) {
    var hash = crypto.createHash("md5");
    hash.setEncoding("hex");
    // Prepare a dummy file
    var c = [];
    for (var i = 0; i < 1000; i ++) {
      c.push(i);
    }
    var b = new Buffer(c);
    mock({
      "/tmp/file1.tar.gz": b
    });

    var createDsc = function(hash, cb) {
      // Save dsc file
      var text = "Files: " + hash.read() + " " + b.length + " " + "file1.tar.gz\n";
      var f = fs.createWriteStream("/tmp/file.dsc");
      f.write(text);
      f.close();
      cb();
    }

    var f = fs.createReadStream("/tmp/file1.tar.gz");
    f.on("end", function() {
      // Calculate md5 hash
      hash.end();
      createDsc(hash, function() {
        done();
      });
    });
    f.pipe(hash);
  });

  after(function(done) {
    mock.restore();
    done();
  });

  it("gets first file", function(done) {
    var f = "/tmp/file.dsc";
    dsc = new DscGrabber(f);
    dsc.getFile(0).then(function(result) {
      var hash = crypto.createHash("md5");
      hash.setEncoding("hex");
      result.stream.on("end", function() {
        hash.end();
        var h = hash.read();
        assert.strictEqual(result.meta.name, "file1.tar.gz");
        assert.strictEqual(result.meta.hash, h);
        done();
      });
      result.stream.pipe(hash);
    });
  });

});
