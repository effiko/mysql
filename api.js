var debug = true;
var mysql = require('mysql');
const TTRDelay = 600000; // 10 minutes
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
// add a new collection to a chunk, return the collection including the collection_id
// @input : col_json : JSON string
// @process: create the collection, add it's ID to the chunk 
// @output: a JSON string with embeded collection_id
async function addNewCollection(col_json, chunk_id) {
    sql = `select newCollection('${col_json}') as col_id`;
    try {
        col_id = await doQuery(sql);
        collection_id = JSON.parse(JSON.stringify(col_id)).col_id;
        col_json = JSON.parse(col_json);
        col_json.collection_id = collection_id;
        console.log(`\n in addNewCollection collection_id: ${collection_id}, col_json=${JSON.stringify(col_json)}`);

    } catch (err) {
        console.log(err);
        throw err;
    }
    sql = `update chunks set chk_json = JSON_ARRAY_APPEND(chk_json, '$.collections', '${collection_id}') where chunk_id = '${chunk_id}'`;
    try {
        result = await doQuery(sql);
        console.log(result);
        return JSON.stringify(col_json);

    } catch (err) {
        console.log(err);
        throw err;
    }
}
async function getImages(chunk_id, isApproved, isPlate){
    console.log(`\n\nchunk_id, isApproved, isPlate, ${chunk_id}, ${isApproved}, ${isPlate}`);
    sql = `select * from collections 
        where chunk_id='${chunk_id}' and approved = ${isApproved} and plate_type = ${isPlate} LIMIT 1`;
    collection = await doQuery(sql);
    console.log(`\n\nin getImages images =  ${JSON.stringify(collection)}`); 
    collection_id = collection.collection_id;
    sql = `call test1('${collection_id}')`;
    images = await doQuery(sql);
    console.log(`\n\nin getImages images =  ${JSON.stringify(images)}`); 

    return (`{"collection":{${JSON.stringify(collection)},"images":${JSON.stringify(images)}}`) ;   
}
/// getCollection(chunk_id:string, isApproved:boolean, isPlate:boolean)
// collection.plate = isPlate וגם collection.approve = isApproved וגם onWork = false וגם status=false .
async function getCollection(chunk_id, isApproved, isPlate) {
    let collection = '';
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
        throw err;
    }
    try {
        TTR = Date.now() + TTRDelay;
        sql1 = `insert into unlockonwork set tableName='collections', id=${collection.id}, TTR=${TTR}`;
        await doQuery(sql1);

    } catch (err) {
        console.log(err);
        throw err;
    }
    try {
        sql2 = `update collections set colOnWork=true where id=${collection.id}`;
        await doQuery(sql2);

    } catch (err) {
        console.log(err);
        throw err;
    }
    ans = JSON.parse(collection.col_json);
    ans.collection_id = collection.collection_id;
    ans.onWork = true;
    return ans;
}
async function freeCollection(collection_id) {
    try {
        sql = `update collections set colOnWork=false where collection_id='${collection_id}'`;
        freeResult = await doQuery(sql);
        console.log(result);
        //        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
    try {
        sql = `delete from unlockonwork  where tableName='collections' and collection_id='${collection_id}'`;
        result = await doQuery(sql);
        console.log(result);
        return freeResult;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
async function removeImageFromCollection(in_collection_id, in_image_id) {
    sql = `call removeImageFromCollection('${in_collection_id}', '${in_image_id}')`;
    try {
        result = await doQuery(sql);
        console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
async function splitCollection(collection_id, chunk_id, index) {
    sql = `select col_json from collections where collection_id = '${collection_id}'`;
    try {
        col_json = await doQuery(sql);
    } catch (err) {
        console.log(err);
        throw err;
    }
    col_right = JSON.parse(col_json.col_json);
    col_left = JSON.parse(col_json.col_json);
    images = col_right.images;

    col_right.images = images.slice(index);
    col_left.images = images.slice(0, index);
    coll_r = JSON.stringify(col_right);
    coll_l = JSON.stringify(col_left);
    sql = `select splitCollection('${coll_l}', '${coll_r}', '${collection_id}', '${chunk_id}') as collection`;
    try {
        result = await doQuery(sql);
        console.log(result);
    } catch (err) {
        console.log(err);
        throw err;
    }
    return result;

}
/*
approveCollection(chunk_id:string, collection_id:string)
משנה במקבץ: approved=true .
משנה במקבץ: onWork=false .
מחזיר: etCollection(chunk_id, false, false)

*/
async function approveCollection(collection_id, chunk_id) {
    sql = `update collections set col_json = json_replace(col_json->>'$.approved', true)
where collection_id = ${collection_id};`
    try {
        result = await doQuery(sql);
        console.log(result);
    } catch (err) {
        console.log(err);
        throw err;
    }
    return getCollection(chunk_id, false, false);
}
/* spreadCollection(chunk_id:string, collection_id:string)
מעביר את כל התמונות במקבץ לבודדים.
מסיר את המקבץ מה-chunk.
מוחק את המקבץ מרשימת המקבצים.
מחזיר: getCollection(chunk_id, false, false)

*/
async function spreadCollection(chunk_id, collection_id) {
    try {
        sql = `select JSON_EXTRACT(col_json, '$.images') as images from collections where collection_id='${collection_id}'`;
        images = await doQuery(sql);
        images = JSON.parse(images.images);
        sql = `select JSON_EXTRACT(chk_json, '$.singles') as singles from chunks where chunk_id='${chunk_id}'`;
        singles = await doQuery(sql);
        singles = JSON.parse(singles.singles);
        singles.concat(images);
        singles = JSON.stringify(singles);
        console.log(`\n singles - ${singles}`);
        sql = `update chunks set chk_json = JSON_REPLACE(chk_json, '$.singles', JSON_ARRAY(${singles.substring(1, singles.length - 1)})) where chunk_id='${chunk_id}'`;
        chunk = await doQuery(sql);
        sql = `delete from collections where collection_id='${collection_id}'`;
        collection = await doQuery(sql);
    } catch (err) {
        console.log(`\n catch err in spreadCollection ${err}`);
        throw err;

    }
    return getCollection(chunk_id, false, false);
}
/*

disapproveCollection(chunk_id:string, collection_id:string)
משנה במקבץ: approved=false.
משנה במקבץ: onWork=false.
מחזיר: getCollection(chunk_id, true, false)

*/
async function disapproveCollection(chunk_id, collection_id){
    try {
        sql = `update collections set colOnWork=false, col_json=JSON_REPLACE(col_json, '$.approved', false) where collection_id='${collection_id}'`;
        status = await doQuery(sql);
    } catch (err) {
        console.log(`\n catch err in disapproveCollection ${err}`);
        throw err;
    }
    return getCollection(chunk_id, false, false);
}
/*
rejectImages(chunk_id:string, collection_id:string, reason:string)
לכל תמונה במקבץ: rejection=reason.
משנה במקבץ: status=true.
משנה במקבץ: onWork=false.
מחזיר: getCollection(chunk_id, true, true)
*/
async function rejectImages(chunk_id, collection_id, reason){
    try {
        sql = `select JSON_EXTRACT(col_json, '$.images') as images from collections where collection_id='${collection_id}'`;
        images = await doQuery(sql);
        images = JSON.parse(images.images);
        await images.forEach(element => {
            sql = `update images set img_json =  JSON_INSERT(img_json, '$.rejection', '${reason}') where image_id='${element}'`;
            res =  doQuery(sql);
        });
        sql = `update collections set colOnWork=false, col_json=JSON_REPLACE(col_json, '$.status', true) where collection_id='${collection_id}'`;
        status = await doQuery(sql);
        sql = `delete from collections where collection_id='${collection_id}'`;
        collection = await doQuery(sql);
    } catch (err) {
        console.log(`\n catch err in rejectImages ${err}`);
        throw err;
    }
    return getCollection(chunk_id, false, false);
}
/*
setCollectionPlate(chunk_id:string, collection_id:string, plate:{type:number,number:string}, isPlate:boolean)
שם במקבץ: plate = plate
-	אם plate.number לא מכיל '?'  לשנות במקבץ: status=true
משנה במקבץ: onWork=false.
מחזיר: את getCollection(chunk_id, true, isPlate)
*/

async function setCollectionPlate(chunk_id, collection_id, plate, isPlate){
    plate = JSON.parse((plate));
    console.log(`plate number is ${plate.number}`);
    try {
        sql = `update collections set colOnWork=false, col_json=JSON_REPLACE(col_json, '$.plate', '${JSON.stringify(plate)}'`;
        if (plate.number.search(/\?/) === -1) {
            status=true;
            sql = sql + `, '$.status', ${status}`;
        }
        sql = sql + `) where collection_id='${collection_id}'`;
        status = await doQuery(sql);
    } catch (err) {
        console.log(`\n catch err in setCollectionPlate ${err}`);
        throw err;
    }
    return getCollection(chunk_id, false, isPlate);
}
/*
closeCollections(chunk_id:string)
בתוך ה-chunk: לכל מקבץ עם status=true וגם plate!=null: 
-	לכל תמונה: 
o	לשים image.plate=collection.plate 
o	להעביר את התמונה מimages- לtransactions-
מחזיר: הצליח/לא הצליח true/false))
*/
async function closeCollections(chunk_id){
    try {
        sql = `select collection_id from collections ollections set colOnWork=false, col_json=JSON_REPLACE(col_json, '$.approved', false) where collection_id='${collection_id}'`;
        status = await doQuery(sql);
    } catch (err) {
        console.log(`\n catch err in disapproveCollection ${err}`);
        throw err;
    }
    return successStatus;
}
// ==============================================================
function doQuery(sql) {
    return new Promise((resolve, reject) => {
if (debug)  console.log(`\nin doQuery SQL = ${sql}`);
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
if (debug)            console.log(`in doQuery - result = ${JSON.stringify(result)}`);
            //            ans = JSON.parse(JSON.stringify(result[0]));
            if (result.affectedRows !== undefined) {
                resolve(result.affectedRows);
            } else {
                if (result[0] !== undefined) {
                    resolve(result[0]);
                } else {
                    resolve(null);
                }
            }
        })
    })
}

module.exports = {
    getCollection, 
    addNewCollection,
    freeCollection,
    removeImageFromCollection,
    splitCollection,   
    approveCollection,
    spreadCollection,
    disapproveCollection,  
    rejectImages,
    setCollectionPlate,
    closeCollections,
    getImages
} ;