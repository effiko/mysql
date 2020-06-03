const express = require('express');
const app = express();
const util = require('util')
const fs = require('fs');
var mysql = require('mysql2');
const morgan = require("morgan");
const bodyParser = require("body-parser");
startTime = Date.now();
function getTime() {
    nowTime = Date.now();
    diffTime = nowTime - startTime;
    startTime = nowTime;
    return (`\n ${diffTime} milisec\n`);
}
// app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bikes',
    port: 3308
});

con.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        throw err;
    }
    console.log('1. connected as id ' + con.threadId);
});

/// getCollection(chunk_id:string, isApproved:boolean, isPlate:boolean)
// collection.plate = isPlate וגם collection.approve = isApproved וגם onWork = false וגם status=false .
async function getCollection(chunk_id, isApproved, isPlate) {
    sql = "select c2.id, col_json from chunks c1 join collections c2 on \
            json_search(`chk_json`->>'$.collections', 'one', c2.collection_id)\
            where chunk_id='"+ chunk_id + "' \
            and colOnWork = false  and JSON_EXTRACT (`col_json`, '$.status') = false\
            and JSON_EXTRACT (`col_json`, '$.approved') = " + isApproved + " LIMIT 1 for update";
    try {
        const collection = await doQuery(sql);
        console.log(JSON.stringify(collection));
        return collection ;
    } catch (err) {
        console.log(err);
        throw err ;
    }
    
}
app.post('/getCollection', async (req, res) => {
    chunk_id = req.body.chunk_id ;
    isApproved = req.body.isApproved ;
    isPlate = req.body.isPlate ;
//    console.log(`chunk_id = ${chunk_id}, isApproved = ${isApproved}, isPlate = ${isPlate} `);
    result = await getCollection(chunk_id, isApproved, isPlate)
    console.log(result);
    res.send(result);
});
// to insert a new collection call putCollection(collection_id: string, collection: JSON)
function putCollection(collection_id, collection) {
    sql = `insert into collections set collection_id = ` + collection_id;
    sql += "', onWork = 0, `json` = '" + collection + "'";
    con.query(sql, (error, results, fields) => {
        if (error) {
            console.log(error);
            throw error;
        }
        console.log(results);
        return results;
    });
}

// ==============================================================

beginTime = Date.now();
startTime = Date.now();
function getTime(line) {
    nowTime = Date.now();
    elapTime = nowTime - beginTime;
    diffTime = nowTime - startTime;
    startTime = nowTime;
    return (`${line}: Elapsed : ${elapTime}, Step: ${diffTime} milisec\n`);
}
function doQuery(sql) {
    return new Promise((resolve, reject) => {
//        console.log(`\nin doQuery SQL = ${sql}`);
        
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
            console.log(`JSON.stringify : ${JSON.stringify(result[0])}`);
            ans = JSON.parse(JSON.stringify(result[0]));
            console.log(ans.id);
            console.log(ans.col_json);
            resolve(ans);
        })
    })
}
 app.listen(3000);
