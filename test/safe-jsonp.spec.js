const {expect}= chai;

describe('JSONP: local server API request', function() {

    const JSONP_API_VALID= 'http://localhost:8000/jsonp/valid';

    const params = {
        x: "2",
        y: "3"
    },
    expected = Object.assign({result: true}, params);

    it('should return Promise if called without callback function', function() {
        const result= JSONP(JSONP_API_VALID);

        expect(result).to.be.an.instanceof(Promise);
    });

    it('should return JSONP instance if called with callback function', function () {
        const result= JSONP(JSONP_API_VALID, (err, data)=>{});

        expect(result).to.be.an.instanceof(JSONP);
    });

    it('should pass stress test', function(done) {

        const queries=[];

        for(let i=0; i<100; i++){
            queries.push(JSONP(JSONP_API_VALID))
        }

        Promise.all(queries).then(()=>done()).catch(done);

        //setTimeout(()=>done(new Error('Timeout')), 2000);

    });

    describe('validate arguments', function() {
        it('should throw if first argument is not a string', function() {
            expect(JSONP).to.throw();
            expect(()=>JSONP(JSONP_API_VALID)).to.not.throw();
        });

        it('should throw if options argument is not an Object|Undefined', function() {
            expect(()=>JSONP(JSONP_API_VALID, 123)).to.throw();
            expect(()=>JSONP(JSONP_API_VALID, {})).to.not.throw();
        });

        it('should throw if callback argument is not a Function|Undefined', function() {
            expect(()=>JSONP(JSONP_API_VALID, {}, 123)).to.throw();
            expect(()=>JSONP(JSONP_API_VALID, {}, ()=>{})).to.not.throw();
        });

        it('should allow to skip options param', function() {
            expect(JSONP(JSONP_API_VALID)).to.be.an.instanceof(Promise);
            expect(JSONP(JSONP_API_VALID, (err, data)=>{})).to.be.an.instanceof(Function);
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







    it('should get valid data', function(done) {
        JSONP('http://localhost:8000/jsonp/valid', {params, sandbox: false}, (err, data)=>{
            if(err) {
                done(err);
            }else{
                expect(data).to.include(expected);
                done();
            }
        })
    });

    it('should support custom callback param name', function(done) {
        JSONP('http://localhost:8000/jsonp/valid', {params, sandbox: false, cbParam: 'cb'}, (err, data)=>{
            if(err) {
                done(err);
            }else{
                expect(data).to.include(expected);
                done();
            }
        })
    });
});