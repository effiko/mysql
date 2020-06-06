const express = require('express');
const app = express();
var mysql = require('mysql');
const bodyParser = require("body-parser");
const TTRDelay = 600000 ; // 10 minutes
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
    let collection='';
    sql = "select c2.id, col_json, collection_id from chunks c1 join collections c2 on \
            json_search(`chk_json`->>'$.collections', 'one', c2.collection_id)\
            where chunk_id='"+ chunk_id + "' \
            and colOnWork = false  and JSON_EXTRACT (`col_json`, '$.status') = false\
            and JSON_EXTRACT (`col_json`, '$.approved') = " + isApproved + " LIMIT 1 for update";
    try {
        collection = await doQuery(sql);
        console.log(`in getCollection collection = ${JSON.stringify(collection)}`);
        console.log(`in getCollection parsed collection = ${collection.id}, ${collection.collection_id}`);
//        return collection ;
    } catch (err) {
        console.log(err);
        throw err ;
    }
    try{
        TTR = Date.now()+TTRDelay ;
        sql1 = `insert into unlockonwork set tableName='collections', id=${collection.id}, TTR=${TTR}`;
        await doQuery(sql1);
   
    } catch (err) {
        console.log(err);
        throw err ;
    }
    try{
        sql2 = `update collections set colOnWork=true where id=${collection.id}`;
        await doQuery(sql2);
   
    } catch (err) {
        console.log(err);
        throw err ;
    }
    ans = JSON.parse(collection.col_json);
    ans.collection_id = collection.collection_id ;
    ans.onWork = true;
    return  ans ;
}
async function freeCollection(collection_id){
    try{
        sql = `update collections set colOnWork=false where collection_id='${collection_id}'`;
        result = await doQuery(sql);
        console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        throw err ;
    }
}
async function removeImageFromCollection(in_collection_id, in_image_id){
    sql = `call removeImageFromCollection('${in_collection_id}', '${in_image_id}')`;
    try {
        result = await doQuery(sql);
        console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        throw err ;
    }
}
async function splitCollection(collection_id, chunk_id, index){
    
}
//+++++++++++++++++++++++
app.post('/getCollection', async (req, res) => {
    chunk_id = req.body.chunk_id ;
    isApproved = req.body.isApproved ;
    isPlate = req.body.isPlate ;
//    console.log(`chunk_id = ${chunk_id}, isApproved = ${isApproved}, isPlate = ${isPlate} `);
    result = await getCollection(chunk_id, isApproved, isPlate)
    console.log(result);
    res.send(result);
});
app.post('/freeCollection', async (req, res) => {
    collection_id = req.body.collection_id;
    result = await freeCollection(collection_id);
    switch (result) {
        case 1: res.send(true); break ;
        case 0: res.send(false); break ;
        default: res.send(result);
    }
    
});
app.post('/removeImageFromCollection', async (req, res) => {
    collection_id = req.body.collection_id ;
    image_id = req.body.image_id ;
    result = await removeImageFromCollection(collection_id, image_id)
    console.log(result);
    res.send(result);
});

// splitCollection(chunk_id:string, collection_id:string, index:number)
app.post('/splitCollection', async (req, res) => {
    collection_id = req.body.collection_id ;
    chunk_id = req.body.chunk_id ;
    index = req.body.index ;
    result = await splitCollection(collection_id, chunk_id, index);
    console.log(result);
    res.send(result);
});

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
       console.log(`\nin doQuery SQL = ${sql}`);
        
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
            console.log(`in doQuery - result = ${JSON.stringify(result)}`);
            console.log(`in doQuery - fields = ${fields}`);
//            console.log(`in doQuery - JSON.stringify : ${JSON.stringify(result[0])}`);
//            ans = JSON.parse(JSON.stringify(result[0]));
            if (result.affectedRows !== undefined) {
                resolve (result.affectedRows);
            } else {
                resolve(result[0]);
            }
        })
    })
}
 app.listen(3000);
