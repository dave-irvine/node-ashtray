//Usually 'ashtray'
var Ashtray = require('../');
var fs = require('fs');

var ashtray = new Ashtray({
    host: 'host',
    password: 'password'
});

var writeable = fs.createWriteStream('output.xml');

ashtray.download(writeable)
.then(function () {
});
