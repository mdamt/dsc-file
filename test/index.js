var assert = require("assert");
var nock = require("nock");
var data = __dirname + "/assets/";
var remote = "http://remote.site";
var DscGrabber = require(__dirname + "/..");

describe("Parsing DSC", function() {
  var dsc;
  
  it("parses a plain dsc", function(done) {
    dsc = new DscGrabber(data + "dsc-without-pgp.dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err, null);
      assert.strictEqual(parsed.format, "3.0 (native)");
      done();
    });
  });

  it("parses a dsc enclosed in PGP body", function(done) {
    dsc = new DscGrabber(data + "dsc-with-pgp.dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err, null);
      assert.strictEqual(parsed.format, "1.0");
      done();
    });
  });

  it("breaks because specified file doesn't exist", function(done) {
    dsc = new DscGrabber(data + "nonexistant-dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err.code, "ENOENT");
      assert.notStrictEqual(err, "undefined");
      done();
    });
  });

  it("parses a remote plain dsc", function(done) {
    var f = "dsc-without-pgp.dsc";
    nock(remote)
      .get("/" + f)
      .replyWithFile(200, data + f);

    dsc = new DscGrabber("http://remote.site/dsc-without-pgp.dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err, null);
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
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err, null);
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
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err.code, 404);
      assert.notStrictEqual(err, "undefined");
      done();
    });
  });

  it("parses a errorneous remote dsc", function(done) {
    dsc = new DscGrabber("http://0.0.0.1/nonexistant.dsc");
    dsc.parse(function(err, parsed) {
      assert.notStrictEqual(err, "undefined");
      done();
    });
  });

});

describe("Get file list", function() {
  it("gets list of files from a plain dsc", function(done) {
    var f = "dsc-without-pgp.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files(function(err, files) {
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0].name, "manokwari_0.2.1.37.tar.gz");
      assert.strictEqual(err, null);
      done();
    });
  });

  it("gets list of multiple files", function(done) {
    var f = "dsc-with-pgp.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files(function(err, files) {
      assert.strictEqual(err, null);
      assert.strictEqual(files.length, 2);
      assert.strictEqual(files[0].name, "abcmidi_20070318.orig.tar.gz");
      assert.strictEqual(files[1].name, "abcmidi_20070318-3.diff.gz");
      done();
    });
  });

  it("gets an error from a broken dsc", function(done) {
    var f = "broken.dsc";
    dsc = new DscGrabber(data + f);
    dsc.files(function(err, files) {
      assert.notStrictEqual(err, null);
      done();
    });
  });
});

