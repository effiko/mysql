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
function doQuery(sql) {
    return new Promise((resolve, reject) => {
        if (debug) console.log(`\nin doQuery SQL = ${sql}`);
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
            if (debug) console.log(`in doQuery - result = ${JSON.stringify(result)}`);
            //            ans = JSON.parse(JSON.stringify(result[0]));
            if (result.affectedRows !== undefined) {
                resolve(result.affectedRows);
            } else {
                if (result[0] !== undefined) {
                    resolve(result);
                } else {
                    resolve(null);
                }
            }
        })
    })
}
//========================================================================
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
/*
Internal routine for the function removeImageFromCollection
*/
async function getCollectionByID(in_collection_id) {
    try {
        sql = `select * from collections where collection_id='${in_collection_id}'`;
        collection = await doQuery(sql);
        if (Array.isArray(collection)){
            collection_id = collection[0].collection_id;
        } else {
            collection_id = collection.collection_id;
        }
        sql = `select * from images where collection_id = '${collection_id}'`;
        images = await doQuery(sql);
        imageList = '';
        psik='';
        images.forEach(image =>{
            imageList += psik+image.image_id;
            psik=',';
        })
        sql=`update collections set colOnWork=true, imageList='${imageList}' where collection_id='${collection_id}'`;
        res = await doQuery(sql); 
        collection.imageList = imageList;
       console.log(`\n collection.imageList = ${collection.imageList}`);
        return (`{"collection":{${JSON.stringify(collection)},"images":${JSON.stringify(images)}}`);
        } catch (err) {
        console.log(err);
        throw err;
    }
}

/// getCollection(chunk_id:string, isApproved:boolean, isPlate:boolean)
// collection.plate = isPlate וגם collection.approve = isApproved וגם onWork = false וגם status=false .
async function getCollection(chunk_id, isApproved, isPlate) {
    sql = `select * from collections 
        where chunk_id='${chunk_id}' and approved = ${isApproved} and colOnWork=false and plate_type = ${isPlate} LIMIT 1`;
    collection = await doQuery(sql);
    if (Array.isArray(collection)){
        collection_id = collection[0].collection_id;
    } else {
        collection_id = collection.collection_id;
    }
    return getCollectionByID(collection_id);
}
/*
•	freeCollection(collection_id)
משנה במקבץ: onWork=true.
מחזיר: הצליח/לא הצליח. true/false))
*/
async function freeCollection(collection_id) {
    try {
        sql = `update collections set colOnWork=false where collection_id='${collection_id}'`;
        freeResult = await doQuery(sql);
        sql = `delete from unlockonwork  where tableName='collections' and collection_id='${collection_id}'`;
        result = await doQuery(sql);
        console.log(result);
        return freeResult;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/*
•	removeImageFromCollection(collection_id:string, image_id:string)
מסיר את ה-reference לתמונה במקבץ, ושם reference לתמונה ב-singles
מחזיר: את המקבץ המעודכן.
*/
async function removeImageFromCollection(in_collection_id, in_image_id) {
    try {
        sql = `update images set collection_id='-' where image_id='${in_image_id}')`;
        result = await doQuery(sql);
        return getCollectionByID(in_collection_id);
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/*
•	splitCollection(chunk_id:string, collection_id:string, index:number)
מחלק את התמונות במקבץ ל-2 קבוצות, משמאל ומימין לאינדקס.
יוצר 2 מקבצים חדשים, עם אותם נתונים של המקבץ המחולק, וכל קבוצת תמונות משוייכת למקבץ אחר.
מסיר את המקבץ מה-chunk המתאים ושם במקומו את 2 החדשים.
מוחק את המקבץ מרשימת המקבצים.
מחזיר: את המקבץ ה"ימני" (מהאינדקס לסוף הרשימה).

*/
async function splitCollection(collection_id, chunk_id, splitIndex) {
    try {
        sql = `select * from collections where collection_id = '${collection_id}'`;
        collection = await doQuery(sql);
        if (Array.isArray(collection)){
            imageList = collection[0].imageList.split(',');
        } else {
            imageList = collection.imageList.split(',');
        }
        console.log(`imageList = ${imageList}`);
        imgR = ''; psik='';
        images = imageList.slice(splitIndex);
        images.forEach(e=>{
            imgR += psik + `${e}`;
            psik = ', ';
        })
        imgL = ''; psik='';
        images = imageList.slice(0, splitIndex);
        images.forEach(e=>{
            imgL += psik + `${e}`;
            psik = ', ';
        })
        sql = `call splitCollection("${imgL}", "${imgR}", '${collection_id}', '${chunk_id}')`;
        collection = await doQuery(sql);
        console.log(`\ncollection = ${collection}`);
        console.log(`\ncollection[0] = ${collection[0]}`);
        console.log(`\ncollection[0][0] = ${collection[0][0]}`);
        if (Array.isArray(collection)){
            collection = collection[0];
            collection = collection[0]
        } 
        console.log(collection);
        sql = `select 
       
    image_id,
    chunk_id,
    collection_id,
    imgOnWork,
    path,
    transaction,
    gate,
    img_time,
    img_date,
    motor_crop,
    plate_crop,
    rejection,
    onWork


from images where collection_id = '${collection.collection_id}'`;
        images = await doQuery(sql);
        return (`{"collection":{${JSON.stringify(collection)},"images":${JSON.stringify(images)}}`);
    } catch (err) {
        console.log(err);
        throw err;
    }
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
async function disapproveCollection(chunk_id, collection_id) {
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
async function rejectImages(chunk_id, collection_id, reason) {
    try {
        sql = `select JSON_EXTRACT(col_json, '$.images') as images from collections where collection_id='${collection_id}'`;
        images = await doQuery(sql);
        images = JSON.parse(images.images);
        await images.forEach(element => {
            sql = `update images set img_json =  JSON_INSERT(img_json, '$.rejection', '${reason}') where image_id='${element}'`;
            res = doQuery(sql);
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

async function setCollectionPlate(chunk_id, collection_id, plate, isPlate) {
    plate = JSON.parse((plate));
    console.log(`plate number is ${plate.number}`);
    try {
        sql = `update collections set colOnWork=false, col_json=JSON_REPLACE(col_json, '$.plate', '${JSON.stringify(plate)}'`;
        if (plate.number.search(/\?/) === -1) {
            status = true;
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
async function closeCollections(chunk_id) {
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
    closeCollections
};