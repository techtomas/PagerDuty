var builder = require('xmlbuilder');
var moment = require('moment');

/*
 * GET home page.
 */

exports.index = function(req, res){
  // console.log(req.db.Incident);
  req.db.Incident.find({}, null, {
    sort: {
      'incident_number': 1
    }
  }, function processRecords(err, incident){
    var xml = builder.create('root', {version: '1.0', encoding: 'utf-8'});
    
    for (var i = 0; i < incident.length; i++) {
      var node = xml.ele('incident', {'id': incident[i].id})
        node.e('created', {}, moment(incident[i].created_on).format('YYYY-MM-DD HH:mm:ss'));
        node.e('incident_number', {}, incident[i].incident_number);
        node.e('status', {}, incident[i].status);
        node.e('trigger_type', {}, incident[i].trigger_type);
        node.e('number_of_escelations', {}, incident[i].number_of_escelations);
        node.e('html_url', {}, incident[i].html_url);
    };

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.render('index', { 
      incident: xml.end({ pretty: true, indent: '  ', newline: '\n' })
    }); 
  });
  
};

exports.records = function(req, res) {
  req.db.Incident.count({}, function(err, count){
    if (err) console.log(err);
    res.render('records', {
      count: count
    });
  });
}