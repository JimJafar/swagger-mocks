var expect = require('chai').expect,
    swaggerMockGenerator = require('../index'),
    generateMocks = swaggerMockGenerator.generateMocks;

describe('#generateMocks', function() {
    it('generates JSON', function(done) {
        generateMocks('test/test.yaml', false)
            .then(function(result) {
                console.log(typeof result['the-test-service']);
                expect(result['the-test-service']).to.be.a('object');
                done();
            }, function(error) {
                done(error);
            });
    });
});