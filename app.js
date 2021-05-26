'use strict';
const express = require('express');
const logger = require('morgan');
const _ = require('lodash');
const crypto = require('crypto');

const contentful = require('./contenful');
const getFact = require('./facts');
const profileFallback = '//fink.no/images/profileFallback.jpg';

function factObject(extra) {
  return Object.assign({
    text: 'Did you know?',
    attachments: [{ text: getFact(), color: 'db2316' }],
  }, extra);
}

const getEmplyees = role => contentful
  .fetchContent('finksEmployees')
  .then(res => res[0].fields.finkEmployee.map(empl => empl.fields))
  .then(employees => employees.filter(empl => !!role ? empl.position.includes(role) : true));

const getEmplyeesBlocks = role => getEmplyees(role)
  .then(employees => employees.map(empl => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${empl.name}* (${empl.email})\n${empl.keyWords}`
    },
    accessory: {
      type: "image",
      image_url: `https:${empl.largeProfilePicture 
        && empl.largeProfilePicture.fields.file.url
        || profileFallback}`,
      alt_text: `${empl.name}`
    }
  })));

const verifySignature = (req, res, next) => {
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
  const [version, hash] = signature.split('=');
  const sig_base = `${version}:${timestamp}:${req.rawBody}`;
  hmac.update(sig_base);
  const myHash = hmac.digest('hex');
  return myHash === hash
    ? next()
    : res.status(401).end()
}; 

const app = express();

app.use(express.urlencoded({ extended: true, verify: (req, res, buf) => { req.rawBody = buf } }));
app.use(logger('dev'));
app.use(verifySignature)

app.post('/slack', async (req, res, next) => {
  const [cmd, arg] = req.body.text.split(" ");
  
  switch (cmd) {
    case 'dev':
      return getEmplyeesBlocks("Utvikler")
        .then(employees => res.send({ blocks: employees }))
        .catch(error => res.send(`error: ${error}`));
    
    case 'design':
      return getEmplyeesBlocks("Designer")
        .then(employees => res.send({ blocks: employees }))
        .catch(error => res.send(`error: ${error}`));
    
    case 'group':
    case 'gruppe':
      return getEmplyees()
        .then(employees => employees.map(empl => empl.name))
        .then(names => _.shuffle(names))
        .then(randomNames => _.chunk(randomNames, arg || 4))
        .then(groups => groups.map((group, i) => ({
          type: "section", 
          text: {
            type: "mrkdwn",
            text: `*Gruppe ${i}:*\n${group.join("\n")}`
          }
        })))
        .then(result => res.send({ blocks: result }))
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
