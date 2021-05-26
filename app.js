'use strict';
const app = require('express')();
const logger = require('morgan');
const bodyParser = require('body-parser');

const contentful = require('./contenful');
const getFact = require('./facts');

function factObject(extra) {
  return Object.assign({
    text: 'Did you know?',
    attachments: [{ text: getFact(), color: 'db2316' }],
  }, extra);
}

const getEmplyees = role => contentful
  .fetchContent('finksEmployees')
  .then(res => res[0].fields.finkEmployee
    .map(empl => empl.fields)
    .filter(empl => empl.position.includes(role))
    .map(empl => empl.name)
  );

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.post('/slack', async (req, res, next) => {
  let cmd = req.body.text;
  switch (cmd) {
    case 'devs':
      return getEmplyees("Utvikler")
        .then(names => names.join('\n'))
        .then(names => res.send(names))
        .catch(error => res.send(`error: ${error}`));
    case 'designers':
      return getEmplyees("Designer")
        .then(names => names.join('\n'))
        .then(names => res.send(names))
        .catch(error => res.send(`error: ${error}`));
    case 'fact':
    case 'fakta':
      return res.json(factObject({ response_type: 'in_channel' }));
    default:
      console.warn(`Unrecognized command ${cmd}`);
      return res.send('Try `/fink fact`');
  }
});

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
