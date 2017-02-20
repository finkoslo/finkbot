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

function postFact(channel) {
  slackbot.postMessage(channel, '', {
    as_user: true,
    text: 'Did you know?',
    attachments: [{ text: getFact(), color: 'db2316' }],
  });
}

slackbot.on('message', (msg) => {
  if (msg.type !== 'message') return;
  if (msg.text.match(/(fact|fakta)/)) {
    postFact(msg.channel);
  }
});

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.post('/slack', (req, res, next) => {
  switch (req.body.text) {
    case 'fact':
      postFact(req.body.channel_id);
      return res.sendStatus(204);
    default:
      return res.send('Try `/fink fact`');
  }
});

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
