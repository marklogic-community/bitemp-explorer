var fs = require('fs');
var request = require('request');
var conn;
try {
  conn = require('./local-env.js').connection;
} catch (e) {
  conn = require('./env.js').connection;
}

var operators = fs.readFileSync('ext/operators.sjs', 'utf8');
var axisSetup = fs.readFileSync('ext/axisSetup.sjs', 'utf8');
var temporalRange = fs.readFileSync('ext/temporal-range.sjs', 'utf8');

function deploy(name, content) {
  request.put('http://' + conn.host + ':' + conn.port + '/v1/config/resources/' + name, {
    'auth': {
      'user':conn.user,
      'password':conn.password,
      'sendImmediately':false
    },
    body:content,
    headers: {
      'content-type': 'application/vnd.marklogic-javascript'
    }
  });
}

deploy('operators', operators);
console.log('operators.sjs deployed');
deploy('axisSetup', axisSetup);
console.log('axisSetup.sjs deployed');
deploy('temporal-range', temporalRange);
console.log('temporal-range.sjs deployed');
