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

  				let voice_response = 'On sale today we have ';

  				if( response.length === 0 ) {
  					voice_response = 'We have no items on sale today. Please check back soon!';
  					agent.add(voice_response);
            resolve(response);
  				}
  				else {
  					voice_response = 'On sale today we have ';

            for (var i = 0, len = response.length; i < len; i++) {
              if( i === 0 ) {
                voice_response += response[i].name + '. ';
                voice_response += striptags(response[i].description);
              }
              else {
                voice_response += 'We also have ' + response[i].name + '. ';
                voice_response += striptags(response[i].description);
              }     
            }

            agent.add(voice_response);
            resolve(response);
  				}
  			});

  			res.on('error', (error) => {
		    	agent.add('API did not resolve!');
		    	reject(error);
		    });
  		});
  	});
  }

  function store_hours(agent) {
    let hours_date = request.body.queryResult.parameters.date;

    return new Promise((resolve, reject) => {
      var options = {
        host: 'acmewidget.alphaparticle.com',
        port: 443,
        path: '/wp-json/acmewidget/hours',
      };

      http.get(options, (res) => {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => { body += d; }); // store each response chunk

        res.on('end', () => {
          let response = JSON.parse(body);

          let split_response = response.split('\\r\\n');
          
          var day_of_week;
          
          if( hours_date === '' ) {
            day_of_week = new Date().getDay();
          }
          else {
            day_of_week = new Date( Date.parse( hours_date ) ).getDay();
          }

          var hours_for_day = split_response[day_of_week];
          var trimmed_hours = hours_for_day.split(':')[1].trim();
          trimmed_hours = trimmed_hours.replace('-', ' until ')

          var dates = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
          ];

          var voice_response = '<speak>On ' + dates[day_of_week] + ', we are open from ' + trimmed_hours + '</speak>';

          // Make sure Google pronounces two digit numbers correctly
          var re = /([0-9][0-9])/g;
          voice_response = voice_response.replace( re, "<say-as interpret-as=\"cardinal\">$1</say-as>")

          agent.add(voice_response);
          resolve(response);
        });

      });
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('sale_items', sale_items);
  intentMap.set('store_hours', store_hours);
  agent.handleRequest(intentMap);
});
