(function() {
    //var dummyData = require('dummy-data'); // https://www.npmjs.com/package/dummy-data
    var faker = require('faker'); // https://github.com/FotoVerite/Faker.js
    var swaggerParser = require('swagger-parser');
    var glob = require('glob');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var Promise = require('pinkie-promise');
    var _mocks;

    module.exports = {
        generateMocks: _generateMocks
    };

    function _generateMocks(swaggerContracts, writeToFiles) {
        _mocks = {};
        var promises = glob.sync(swaggerContracts).map(function(file) {
            return _generateMock(file, writeToFiles);
        });
        return Promise.all(promises)
            .then(function() {
                return _mocks;
            });
    }

    function _generateMock(swaggerContract, writeToFiles) {
        return new Promise(function(resolve, reject) {
            swaggerParser.validate(swaggerContract, function(validationError, swaggerObject) {
                if (validationError) {
                    reject(error);
                    return;
                }
                try {
                    var application = swaggerObject.info.title.toLowerCase().replace(/[^a-zA-Z\d]/g, '-');
                    _mocks[application] = {};
                    for (var pathName in swaggerObject.paths) {
                        var path = swaggerObject.paths[pathName];
                        pathName = pathName.toLowerCase().replace(/[^a-zA-Z\d]/g, '');
                        _mocks[application][pathName] = {};
                        for (var methodName in path) {
                            var method = path[methodName];
                            _mocks[application][pathName][methodName] = {};
                            for (var responseName in method.responses) {
                                var response = method.responses[responseName];
                                _mocks[application][pathName][methodName][responseName] = (response.schema) ? _getMockObject(response.schema) : {};
                            }
                        }
                    }
                    if (writeToFiles) {
                        _writeFiles();
                    }
                    resolve();
                } catch(e) {
                    reject(e);
                }
            });
        });
    }

    function _getMockProperty(property) {
        switch(property.type) {
            case 'integer':
                return _getMockInteger();
            case 'number':
                return _getMockNumber(property.format);
            case 'string':
                return _getMockString(property.format);
            case 'boolean':
                return _getMockBoolean();
            case 'object':
                return _getMockObject(property);
            case 'array':
                return _getMockArray(property.items);
            default:
                return 'Unrecognised property type: ' + property.type;
        }
    }

    function _getMockObject(objectDefinition) {
        var mock = {};
        for (var propertyName in objectDefinition.properties) {
            var property = objectDefinition.properties[propertyName];
            mock[propertyName] = _getMockProperty(property);
        }
        return mock;
    }

    function _getMockInteger() {
        return faker.random.number();
    }

    function _getMockNumber(format) {
        switch (format) {
            case 'float':
                return _randNum();
            case 'double':
                return Math.round(_randNum() * 100) / 100;
            default:
                return faker.random.number();
        }
        function _randNum() {
            return Math.random() * 1000;
        }
    }

    function _getMockString(format) {
        switch (format) {
            case 'byte':
                return btoa(faker.lorem.words(1)[0]);
            case 'binary':
                return (faker.random.number() >>> 0).toString(2);
            case 'date':
                return faker.date.future(1).toJSON().split('T')[0];
            case 'date-time':
                return faker.date.future(1).toJSON();
            case 'password':
                return faker.random.number(99999999);
            default:
                return faker.lorem.words(1)[0];
        }
    }

    function _getMockBoolean() {
        return Math.random()<.5;
    }

    function _getMockArray(itemDefinition) {
        var count = faker.random.number(10);
        var array = [];
        for (var i=0; i<=count; i++) {
            array.push(_getMockProperty(itemDefinition));
        }
        return array;
    }

    function _writeFiles() {
        var writePath;
        for (var application in _mocks) {
            for (var path in _mocks[application]) {
                for (var method in _mocks[application][path]) {
                    writePath = ['generated_mocks', application, path, method].join('/');
                    mkdirp(writePath);
                    for (var responseCode in _mocks[application][path][method]) {
                        fs.writeFile(
                            [writePath, responseCode + '.json'].join('/'),
                            JSON.stringify(_mocks[application][path][method][responseCode], null, '\t'),
                            function (error) {
                                if (error) {
                                    throw error;
                                }
                            }
                        );
                    }
                }
            }
        }
    }
})();
