const chai = require('chai');
const {expect}= chai;
const JSONP = require('../dist/safe-jsonp.umd');

const JSONP_URL_VALID = 'http://www.mocky.io/v2/5c069fbf3300006c00ef2b3e';
const JSONP_URL_VALID2 = 'http://www.mocky.io/v2/5c06a4bb3300006300ef2b61';
const JSONP_URL_LONG_QUERY = 'http://www.mocky.io/v2/5c069fbf3300006c00ef2b3e?mocky-delay=5s';
const JSONP_URL_INVALID_CB_SYNTAX = 'http://www.mocky.io/v2/5c06a0143300007600ef2b40';
const JSONP_URL_INVALID_CB_DATA_TYPE = 'http://www.mocky.io/v2/5c06a0c23300005400ef2b42';
const JSONP_URL_HTTP_ERROR = 'http://www.mocky.io/v2/5c06a1183300003500ef2b43';
const JSONP_URL_CB_DATA_MISSING = 'http://www.mocky.io/v2/5c06a1663300007600ef2b48';
const JSONP_URL_CB_TOO_MANY_ARGS = 'http://www.mocky.io/v2/5c06a20e3300006c00ef2b4b';

const silentErrorHandler = () => {
};

describe('JSONP: remote endpoint test', function () {

    //const JSONP_ENDPOINT_VALID= 'http://localhost:8000/jsonp/valid';


    const params = {
            y: 2
        },
        expected = {x: 1};

    describe('constructor', function () {

        it('should throw if first argument is not a string', function() {
            expect(JSONP).to.throw();
            expect(() => JSONP(JSONP_URL_VALID)).to.not.throw();
        });

        it('should throw if options argument is not an Object|Undefined', function() {
            expect(() => JSONP(JSONP_URL_VALID, 123)).to.throw();
            expect(() => JSONP(JSONP_URL_VALID, {})).to.not.throw();
        });

        it('should throw if callback argument is not a Function|Undefined', function() {
            expect(() => JSONP(JSONP_URL_VALID, {}, 123)).to.throw();
            expect(() => JSONP(JSONP_URL_VALID, {}, () => {
            })).to.not.throw();
        });

        it('should allow to omit options param', function () {
            expect(JSONP(JSONP_URL_VALID)).to.be.an.instanceof(Promise);
            expect(JSONP(JSONP_URL_VALID, (err, data) => {
            })).to.be.an.instanceof(JSONP);
        });

        it('should return Promise if called without a callback function', function () {
            const result = JSONP(JSONP_URL_VALID, {sandbox: false}).catch(silentErrorHandler);

            expect(result).to.be.an.instanceof(Promise);
        });

        it('should return JSONP instance if called with a callback function', function () {
            const result = JSONP(JSONP_URL_VALID, {sandbox: false}, (err, data) => {
            });

            expect(result).to.be.an.instanceof(JSONP);
        });

        it('should return JSONP instance if called as a constructor with a callback function', function () {
            const result = new JSONP(JSONP_URL_VALID, {sandbox: false}, (err, data) => {
            });

            expect(result).to.be.an.instanceof(JSONP);
        });
    });

    /*    describe('Abort request', function() {
            it('should invoke callback with abort error on abort', function (done) {
                JSONP(JSONP_API_VALID, (err, data) => {
                    if(err){
                        err.message=== "aborted"? done() : done(new Error(`Failed with error ${err.message}`));
                    }else{
                        done(new Error('was not aborted'));
                    }
                });
                setTimeout(done, 1000);
            });
        });*/
    const makeTests = ({sandbox = false}) => {
        describe(`${sandbox ? 'sandbox' : 'non-sandbox'} mode`, function () {
            it('should get valid data', function (done) {
                JSONP(JSONP_URL_VALID, {sandbox}, (err, data) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(data).to.include({x: 1});
                        done();
                    }
                })
            });

            it('should return relevant responses', function (done) {

                Promise.all([JSONP(JSONP_URL_VALID, {sandbox}), JSONP(JSONP_URL_VALID2, {sandbox})]).then((responses) => {
                    expect(responses[0]).to.deep.equal({x: 1});
                    expect(responses[1]).to.deep.equal({y: 2});
                    done()
                }).catch(done);

            });

            it('should handle a timeout error in Promise mode', function (done) {
                JSONP(JSONP_URL_LONG_QUERY, {sandbox, timeout: 1000})
                    .then(() => done(new Error('No timeout, got some response')))
                    .catch(err => {
                        expect(err.message).to.equal("timeout");
                        done();
                    })
            });

            it('should handle a timeout error in callback mode', function (done) {
                JSONP(JSONP_URL_LONG_QUERY, {sandbox, timeout: 1000}, (err) => {
                    expect(err.message).to.equal("timeout");
                    done();
                })
            });

            it('should handle an aborted error', function (done) {
                const jsonp = JSONP(JSONP_URL_LONG_QUERY, {sandbox, timeout: 1000}, (err) => {
                    expect(err.message).to.equal("aborted");
                    done();
                });

                jsonp.abort();
            });

            it('should handle a network error', function (done) {
                JSONP(JSONP_URL_HTTP_ERROR, {sandbox, timeout: 1000}, (err) => {
                    expect(err.message).to.equal("network");
                    done();
                });
            });
        });
    };

    makeTests({sandbox: true});
    makeTests({sandbox: false});


});