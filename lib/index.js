var http = require('http');

exports.load = function(req, res, next) {

  //Setup our variables needed to call pagerduty API
  var records;
  var host = req.config.pagerduty.url;
  var path = '/api/v1/incidents?date_range=all&sort_by=incident_number:asc';
  var headers = {
    'Content-type': 'application/json',
    'Authorization': 'Token token=' + req.config.pagerduty.token
  };

  function getIncidents(offset) {
    if (offset) {
      path += '&offset=' + offset
    }  
    var options = { host : host, path : path, headers : headers };
    var apireq = http.request(options, function (apires) {
      //another chunk of data has been recieved, so append it to `str`
      var str = '';
      apires.on('data', function (chunk) {
        str += chunk;
      });

      apires.on('end',function() {
        var jsonData = JSON.parse(str); //Turn the final response into JSON object
        
        if (!records) records = jsonData.total;

        req.db.Incident.find({}, "incident_number", function(err, incident){
          var incident_numbers = [];
          for ( var i = 0; i< incident.length; i++) {
            //Pull just the incident numbers into an array
            incident_numbers.push(incident[i].incident_number);
          }

          for ( var i = 0; i < jsonData.incidents.length; i++) {
            if (incident_numbers.indexOf(jsonData.incidents[i].incident_number) == -1) {
              new req.db.Incident(jsonData.incidents[i]).save();
            }

            //If we've gone through all records call next to continue processing the request
            if (--records == 0) {
              return next();
            }
          }
        });

        // Recursive call to grab more incidents
        if (jsonData.total > jsonData.limit + jsonData.offset) {
          getIncidents(jsonData.limit + jsonData.offset);
        } 

      });
    });
    apireq.end();
  }
  getIncidents();
}