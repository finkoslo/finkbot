'use strict';
const fs = require('fs');

const facts = fs.readFileSync('finch-facts.txt')
  .toString()
  .split("\n")
  .filter(String);

function getFact() {
  const i = Math.floor(Math.random() * facts.length);
  const fact = facts[i];
  return fact;
}

module.exports = getFact;
