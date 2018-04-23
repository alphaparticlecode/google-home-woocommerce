// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const rpn = require('request-promise-native');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function sale_items(agent) {

    // WooCommerce Consumer Key, Consumer Secret stored in Firebase environment variables
    // Base64 encoded and separated by :
    rpn.get('https://acmewidget.alphaparticle.com/wp-json/wc/v2/products?filter[tag]=sale&filter[limit]=3')
    .auth(functions.config().acmewidget.key, functions.config().acmewidget.secret, false)
    .then(jsonBody => {
    	console.log(jsonBody);
    	var body = JSON.parse(jsonBody);

    	console.log(body);
    	agent.add('API resolved!');
    	return Promise.resolve( agent ); 
    })
    .catch(jsonBody => {
    	console.log(jsonBody);
    	var body = JSON.parse(jsonBody);

    	console.log(body);
    	agent.add('API did not resolve!');
    	return Promise.reject( agent ); 
    });
  }

  function todays_hours(agent) {
    agent.add(`Sorry, there are no hours for today. Check back tomorrow!`);
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('sale_items', sale_items);
  intentMap.set('todays_hours', todays_hours);
  agent.handleRequest(intentMap);
});
