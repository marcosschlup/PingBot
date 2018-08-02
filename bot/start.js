var app = require('./app');

app.loadControllers([ 'sender.js', 'api.js' ]);

app.start();