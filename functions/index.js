'use strict';

const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('sale', (conv, {color, number}) => {
  conv.close(`There are no sales today. Check back again tomorrow!`);
});

exports.acmeWidgetCatalog = functions.https.onRequest(app);
