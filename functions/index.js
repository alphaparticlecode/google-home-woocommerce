// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

const http = require('https');
const striptags = require('striptags');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function sale_items(agent) {
  	return new Promise((resolve, reject) => {
  		var options = {
			host: 'acmewidget.alphaparticle.com',
  			port: 443,
   			path: '/wp-json/wc/v2/products?tag=16&per_page=3',
   			headers: {
      			// WooCommerce Consumer Key, Consumer Secret stored in Firebase environment variables
      			'Authorization': 'Basic ' + new Buffer(functions.config().acmewidget.key + ':' + functions.config().acmewidget.secret).toString('base64')
   			}    
		};

  		http.get(options, (res) => {
  			let body = ''; // var to store the response chunks
  			res.on('data', (d) => { body += d; }); // store each response chunk

  			res.on('end', () => {
				let response = JSON.parse(body);

				console.log(response);

				let voice_response = 'On sale today we have ';

				if( response.length === 0 ) {
					voice_response = 'We have no items on sale today. Please check back soon!';
					agent.add(voice_response);
				}
				else {
					voice_response = 'On sale today we have ';
				}

				for (var i = 0, len = response.length; i < len; i++) {
					if( len === 1 ) {
						voice_response += response[i].name;
						voice_response += '. ';
						voice_response += striptags(response[i].description);

						agent.add(voice_response);
					}					
				}
				
		        resolve(response);
  			});

  			res.on('error', (error) => {
		    	agent.add('API did not resolve!');
		    	reject(error);
		    });
  		});
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
