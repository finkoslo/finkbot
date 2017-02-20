'use strict';
const app = require('express')();
const logger = require('morgan');
const bodyParser = require('body-parser');
const getFact = require('./facts');

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.get('/', (req, res, next) => res.json({ fact: getFact() }));
app.post('/slack', (req, res, next) => res.send(getFact()));

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
