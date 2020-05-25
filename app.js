const wget = require('wget-improved');
const fs = require('fs');
const src = 'https://data.gov.il/api/action/datastore_search?resource_id=bf9df4e2-d90d-4c0a-a400-19e15af8e95f&limit=200000';
const intest = '/tmp/bikes1';
//========
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "bikes",
    password: "bikes01"
});
/*
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
*/
con.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        throw err;
    }
    console.log('1. connected as id ' + con.threadId);
});
setTimeout(() => {
    console.log('2. connected as id ' + con.threadId);
    con.end();
    process.exit(-1);
}, 3000);

