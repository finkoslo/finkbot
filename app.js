'use strict';
const app = require('express')();
const logger = require('morgan');
const bodyParser = require('body-parser');
const Slackbot = require('slackbots');

const getFact = require('./facts');
const slackbot = new Slackbot({
  token: process.env.SLACK_BOT_TOKEN,
  name: 'Fink Bot',
});

function factObject(extra) {
  return Object.assign({
    text: 'Did you know?',
    attachments: [{ text: getFact(), color: 'db2316' }],
  }, extra);
}

function postFact(channel) {
  slackbot
    .postMessage(channel, '', factObject({ as_user: true }))
    .catch((error) => { console.warn(error); });
}

slackbot.on('message', (msg) => {
  if (msg.type !== 'message') return;
  if (msg.text.match(/(fact|fakta)/)) {
    postFact(msg.channel);
  } else {
    console.warn('Unrecognized command %o', msg);
  }
});

slackbot.on('error', (msg) => {
  console.warn(msg);
});

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.post('/slack', (req, res, next) => {
  let cmd = req.body.text;
  switch (cmd) {
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
