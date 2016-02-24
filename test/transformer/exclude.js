'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var expect = require('code').expect
var sinon = require('sinon')

var Transformer = require('../../lib/transformer')

describe('Transformer', () => {
  describe('exclude', () => {
    var transformer

    beforeEach((done) => {
      transformer = new Transformer('/etc', [])
      sinon.spy(transformer, 'addWarning')
      done()
    })

    it('should generate a warning if not given an array of file names', (done) => {
      var rule = { action: 'exclude' }
      transformer.exclude(rule, (err) => {
        if (err) { return done(err) }
        expect(transformer.addWarning.calledOnce).to.be.true()
        expect(transformer.addWarning.calledWith(
          'Exclude files not specified as an array.'
        )).to.be.true()
        done()
      })
    })

    it('should generate a warning if a file name is not a string.', (done) => {
      var rule = {
        action: 'exclude',
        files: ['hello.txt', {}, 203]
      }
      transformer.exclude(rule, (err) => {
        if (err) { return done(err) }
        expect(transformer.addWarning.calledTwice).to.be.true()
        expect(transformer.addWarning.calledWith(
          'Non-string exclude filename encountered.'
        )).to.be.true()
        expect(transformer.addWarning.calledWith(
          'Exclude files not specified as an array.'
        )).to.be.false()
        done()
      })
    })

    it('should add file excludes', (done) => {
      var rule = {
        action: 'exclude',
        files: ['A.txt', 'B.txt', 'C.txt']
      }
      var expectedFiles = rule.files.map((file) => {
        return transformer.driver.absolutePath(file)
      })
      transformer.exclude(rule, (err) => {
        if (err) { return done(err) }
        expect(transformer._globalExcludes).to.only.include(expectedFiles)
        done()
      })
    })

    it('should only add files once to the set', (done) => {
      var rule = {
        action: 'exclude',
        files: ['A.txt', 'A.txt', 'C.txt', 'B.txt', 'C.txt']
      }
      transformer.exclude(rule, (err) => {
        if (err) { return done(err) }
        expect(transformer._globalExcludes.length).to.equal(3)
        expect(transformer._globalExcludes).to.only.include([
          '/etc/A.txt', '/etc/C.txt', '/etc/B.txt'
        ])
        done()
      })
    })
  }) // end 'exclude'
}) // end 'Transformer'
