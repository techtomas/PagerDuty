/*
 * GET home page.
 */

exports.index = function(req, res){
  // console.log(req.db.Incident);
  req.db.Incident.find({}, function(err, incident){
    res.render('index', { 
      title: 'Express',
      incident: incident
    }); 
  });
  
};