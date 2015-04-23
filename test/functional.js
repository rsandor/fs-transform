var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');
var fs = require('./fixtures/fs-helper');
var Transformer = require('../index.js');

describe('functional', function () {
  beforeEach(fs.createTestDir);
  afterEach(fs.removeTestDir);

  describe('copy', function() {
    it('should copy a file', function (done) {
      var dest = 'A-copy';
      var rules = [{ action: 'copy', source: 'A', dest: dest }];
      Transformer.transform(fs.path, rules, function (err) {
        if (err) { return done(err); }
        expect(fs.exists(dest)).to.be.true();
        done();
      });
    });

    it('should copy many files', function (done) {
      var rules = [
        { action: 'copy', source: 'A', dest: 'A-copy' },
        { action: 'copy', source: 'B', dest: 'B-copy' },
        { action: 'copy', source: 'sub/C', dest: 'sub/C-copy' }
      ];
      Transformer.transform(fs.path, rules, function (err) {
        if (err) { return done(err); }
        rules.forEach(function (rule) {
          expect(fs.exists(rule.dest)).to.be.true();
        });
        done();
      });
    });

    it('should overwrite destination files with warning', function (done) {
      var source = 'A';
      var dest = 'B';
      var rules = [{ action: 'copy', source: source, dest: dest }];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        expect(transformer.warnings).to.not.be.empty();
        fs.diff(source, dest, function (err, diff) {
          if (err) { return done(err); }
          expect(diff).to.be.empty();
          done();
        });
      });
    });
  }); // end 'copy'

  describe('rename', function() {
    it('should rename a file', function (done) {
      var source = 'A';
      var dest = 'A-rename';
      var rules = [
        { action: 'rename', source: source, dest: dest }
      ];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        expect(fs.exists(source)).to.be.false();
        expect(fs.exists(dest)).to.be.true();
        done();
      });
    });

    it('should rename many files', function (done) {
      var rules = [
        { action: 'rename', source: 'A', dest: 'A-rename' },
        { action: 'rename', source: 'B', dest: 'B-rename' },
        { action: 'rename', source: 'sub/C', dest: 'sub/C-rename' }
      ];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        rules.forEach(function (rule) {
          expect(fs.exists(rule.source)).to.be.false();
          expect(fs.exists(rule.dest)).to.be.true();
        });
        done();
      });
    });

    it('should overwrite files with a warning', function (done) {
      var source = 'A';
      var dest = 'B';
      var rules = [{ action: 'rename', source: source, dest: dest }];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        expect(transformer.warnings).to.not.be.empty();
        expect(fs.exists(source)).to.be.false();
        expect(fs.exists(dest)).to.be.true();
        fs.mockDiff(dest, source, function (err, diff) {
          if (err) { return done(err); }
          expect(diff).to.be.empty();
          done();
        });
      });
    });
  }); // end 'rename'

  describe('replace', function() {
    it('should replace text in a file', function(done) {
      var search = 'File B is good';
      var replace = 'File B is great'; // stay positive!
      var rules = [{ action: 'replace', search: search, replace: replace }];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        [fs.read('B'), fs.read('sub/subsub/D')].forEach(function (data) {
          expect(data.match(search)).to.be.null();
          expect(data.match(replace)).to.not.be.null();
        });
        done();
      });
    });

    it('should replace text with special characters', function(done) {
      var rules = [
        { action: 'replace', search: '\\sum', replace: '\\prod' },
        { action: 'replace', search: '"cool"', replace: '"neat"' }
      ];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        var dataC = fs.read('sub/C');
        expect(dataC.match(rules[0].search)).to.be.null();
        expect(dataC.match(rules[0].replace)).to.not.be.null();
        var dataD = fs.read('sub/subsub/D');
        expect(dataD.match(rules[1].search)).to.be.null();
        expect(dataD.match(rules[1].replace)).to.not.be.null();
        done();
      });
    });

    it('should allow exclusions', function(done) {
      var rules = [{
        action: 'replace',
        search: 'Mew',
        replace: 'Woof',
        exclude: [
          { name: 'B' },
          { name: 'sub/C', line: 8 }
        ]
      }];
      Transformer.transform(fs.path, rules, function (err, transformer) {
        if (err) { return done(err); }
        var dataB = fs.read('B');
        var linesC = fs.read('sub/C').split('\n');
        expect(linesC[3]).to.equal('Woof');
        expect(linesC[4]).to.equal('Woof');
        expect(linesC[5]).to.equal('Woof');
        expect(linesC[7]).to.equal('Mew');
        expect(dataB.match('Woof')).to.be.null();
        done();
      });
    });
  }); // end 'replace'

}); // end 'functional'
