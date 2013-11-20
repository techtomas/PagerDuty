var http = require('http');
var Mongoose = require('mongoose');

var config = require('./config');
require('./util'); //Add some helper functions for the DB Connection

var IncidentSchema = require('./models/Incident').IncidentSchema
var Incident = Mongoose.model("Incident", IncidentSchema);
Mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.db, function (err) {
  if (err) throw err;
});

var record_count;
var host = config.pagerduty.url;
var path = '/api/v1/incidents?date_range=all&sort_by=incident_number:asc';
var headers = {
  'Content-type': 'application/json',
  'Authorization': 'Token token=' + config.pagerduty.token
};

function getIncidents(offset) {
  if (offset) {
    path += '&offset=' + offset
  }
  var options = { host : host, path : path, headers : headers };
  var req = http.request(options, function (res) {
    //another chunk of data has been recieved, so append it to `str`
    var str = '';
    res.on('data', function (chunk) {
      str += chunk;
    });

    res.on('end',function() {
      var jsonData = JSON.parse(str); //Turn the final response into JSON object
      
      if(! record_count) record_count = jsonData.total;

      for ( var i = 0; i < jsonData.incidents.length; i++) {
        processIncident(jsonData.incidents[i]); //Pass each incident to be added to the database;
      }

      if (jsonData.total > jsonData.limit + jsonData.offset) {
        getIncidents(jsonData.limit + jsonData.offset);
      }

    });
  });
  req.end();
}

function recordProcessed(){
  record_count--;
  if (record_count == 0) {
    Mongoose.disconnect();
  }
}

function processIncident(data) {
  Incident.findOne ({ 'incident_number': data.incident_number}, function (err, incident){
    if (err) {
      console.log('We had an error ' + err);
    } else {
      if (!incident) {
        new Incident(data).save(function(err) {
          if (err) console.log(err);
          recordProcessed();
        });  
      } else {
        recordProcessed();
      }
    }
  });
}

getIncidents();