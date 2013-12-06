var Mongoose = require('mongoose');

exports.Incident = new Mongoose.Schema({
  id: String,
  incident_number: Number,
  created_on: Date,
  status: String,
  html_url: String,
  incident_key: String,
  service: {
    id: String,
    name: String,
    html_url: String,
    deleted_at: String
  },
  escaltion_policy: {
    id: String,
    name: String
  },
  assigned_to_user: String,
  trigger_summary_data: {
    subject: String
  },
  trigger_details_html_url: String,
  trigger_type: String,
  last_status_change_on: Date,
  last_status_change_by: String,
  number_of_escalations: Number,
  resolved_by_user: String
});