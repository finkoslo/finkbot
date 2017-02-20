'use strict';
const app = require('express')();
const logger = require('morgan');

app.use(logger('dev'));

app.use('/', (req, res, next) => {
  res.json({ ok: 'ok' });
});

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
