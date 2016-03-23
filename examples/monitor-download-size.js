//Usually 'ashtray'
var Ashtray = require('../');

var ashtray = new Ashtray({
    host: 'host',
    password: 'password'
});

ashtray.on('dataRead', function (size) {
    console.log(size);
});

ashtray.download()
.then(function (data) {
    console.log(data);
});
