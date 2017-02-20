'use strict';
const app = require('express')();
const logger = require('morgan');
const getFact = require('./facts');

app.use(logger('dev'));

app.get('/', (req, res, next) => res.json({ fact: getFact() }));

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
