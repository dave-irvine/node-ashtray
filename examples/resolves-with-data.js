//Usually 'ashtray'
var Ashtray = require('../');

var ashtray = new Ashtray({
    host: 'host',
    password: 'password'
});

ashtray.download()
.then(function (data) {
    console.log(data);
});
