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

slackbot.on('message', (msg) => {
  if (msg.type !== 'message') return;
  if (msg.text.match(/(fact|fakta)/)) {
    slackbot.postMessage(msg.channel, '', {
      as_user: true,
      text: 'Did you know?',
      attachments: [{ text: getFact(), color: 'db2316' }],
    });
  }
});

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.get('/', (req, res, next) => res.json({ fact: getFact() }));

app.post('/slack', (req, res, next) => res.json({
  response_type: "in_channel",
  attachments: [ { text: getFact() } ],
}));

const server = app.listen(process.env.PORT || 8888, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
