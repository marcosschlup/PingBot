var app = require('./app');

app.loadControllers([ 'data.js','api.js' ]);

app.start();