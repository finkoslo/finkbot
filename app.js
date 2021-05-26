'use strict';
const app = require('express')();
const logger = require('morgan');
const bodyParser = require('body-parser');
const _ = require('lodash');

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

app.use(bodyParser.urlencoded());
app.use(logger('dev'));

app.post('/slack', async (req, res, next) => {
  let token = req.body.token;
  if (token != process.env.SLACK_TOKEN) {
    return res.status(401).end();
  }

  let args = req.body.text.split(" ");
  let cmd = args[0];
  let arg = args[1];
  
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
            text: `*Gruppe ${i}:* ${group.join(", ")}`
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
