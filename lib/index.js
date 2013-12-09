var http = require('http');

exports.seed = function(req, res, next) {
  req.config.pagerduty.dateRange = true;
  return next();
}

exports.load = function(req, res, next) {

  //Setup our variables needed to call pagerduty API
  var records;
  var host = req.config.pagerduty.url;
  var path = req.config.pagerduty.path;
  
  if (req.config.pagerduty.dateRange) {
    path += '&date_range=all';
    req.config.pagerduty.dateRange = false;
  }

  console.log(path);
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

        req.db.Incident.find({}, "incident_number", function(err, incidents){
          var incident_numbers = [];
          for ( var i = 0; i< incidents.length; i++) {
            //Pull just the incident numbers into an array
            incident_numbers.push(incidents[i].incident_number);
          }

          for ( var i = 0; i < jsonData.incidents.length; i++) {
            if (incident_numbers.indexOf(jsonData.incidents[i].incident_number) == -1) {
              new req.db.Incident(jsonData.incidents[i]).save(function(err) {
                if(err) console.log(err);
                recordCounter();
              });
            } else {
              recordCounter();
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

  function recordCounter() {
    //If we've gone through all records call next to continue processing the request
    if (--records == 0) {
      return next();
    }
  }
  getIncidents();
}