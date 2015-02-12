var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var multer = require('multer'); 
 
//weather stuff
var util = require('util'),
    exec = require('child_process').exec,
    request = require("request"),
	fs = require("fs"),
    child = require('child_process'),
    async = require('async');
//end weather stuff

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
 
// process.env is an object(hash) that heroku puts environment vars into...
var port = process.env.PORT || 3000


var Cylon = require('cylon');

function writeToScreen(screen, message) {
  screen.setCursor(0,0);
  screen.write(message);
}

function writeToScreenLineTwo(screen, message) {
  screen.setCursor(1,0);
  screen.write(message);
}

var weatherString = "";

	function getTheWeather(key, query, next){
		// Build the API string.
       
		var url = "http://api.wunderground.com/api/" + key + "/forecast/q/" + query + ".json";

        console.log("url built");
        
		request({
		    url: url,
		    json: true
		}, function (error, response, body) {
		    if (!error && response.statusCode === 200) {
		    	var result = body; //JSON.stringify(body,null, 4);
                console.log("got a result!");
                next(null, result);
		    } else {
		    	next("There was an error. Did you provide an API key? Is your Edison online? Try running edison status to check!");
		    }
		});
	}

Cylon
  .robot({ name: 'LCD'})
  .connection('edison', { adaptor: 'intel-iot' })
  .device('screen', { driver: 'upm-jhd1313m1', connection: 'edison' })
  .on('ready', function(my) {
    writeToScreen(my.screen, "Welcome                     ");
    
        app.post('/message', function (req, res) {
            console.log("DEBUG::::: " + req.body);
            var line = req.body.line || 0;
            if(line === 0){
                writeToScreen(my.screen, req.body.message, line);                
            }
            else{
                writeToScreenLineTwo(my.screen, req.body.message, line);
            }
      res.json(req.body)
    });
 
    app.post('/weather/:query', function (req, res) {
        console.log("DEBUG::::: " + req.body);
        console.log("DEBUG::::: " + req.params);
        console.log("DEBUG::::: " + req.params.query);
                
        getTheWeather("YOUR_API_KEY",req.params.query,function(error, result){
            if (error) {
                console.log(error);
                res.json({error: "thingy"})
                return;
            }
            
            var weather = result && result.forecast && result.forecast.simpleforecast && 
                result.forecast.simpleforecast.forecastday[0];
            if (!weather) {
                res.json({error: "no weather"})
                return ;
            }
            
            var weatherString = weather.conditions;
            var tempString = "High:" + weather.high.fahrenheit + ", Low:" + weather.low.fahrenheit;
            
            console.log(result.forecast.simpleforecast.forecastday);
            console.log("Weather: "+ result.forecast.simpleforecast.forecastday[0].conditions); 
            
            writeToScreen(my.screen, weatherString + "            ");
            writeToScreenLineTwo(my.screen, tempString + "            ");
            
            if(weather.high.fahrenheit > 60){
                var colorR = 255;
                var colorG = 0;
                var colorB = 0;   
                my.screen.setColor(colorR,colorG,colorB);
            }
            else{
                var colorR = 0;
                var colorG = 0;
                var colorB = 255;   
                my.screen.setColor(colorR,colorG,colorB);
            }
            
            res.json(req.body)
        });

           
    });
 
    var server = app.listen(port, function () {
      var host = server.address().address
      var port = server.address().port
      console.log('Example app listening at http://%s:%s', host, port)
    });
  })
  .start();