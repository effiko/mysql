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
        sql = `call getCollectionByID('${in_collection_id}')`;
        collection = await doQuery(sql);
       collection = collection[0];
       collection = JSON.stringify(collection[0]);
       collection = collection.replace(/\\/gi, '');
       collection = collection.substring(8, (collection.length-4));
        return collection;
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
    if (Array.isArray(collection)) {
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
        if (Array.isArray(collection)) {
            imageList = collection[0].imageList.split(',');
        } else {
            imageList = collection.imageList.split(',');
        }
        console.log(`imageList = ${imageList}`);
        imgR = ''; psik = '';
        images = imageList.slice(splitIndex);
        images.forEach(e => {
            imgR += psik + `${e}`;
            psik = ', ';
        })
        imgL = ''; psik = '';
        images = imageList.slice(0, splitIndex);
        images.forEach(e => {
            imgL += psik + `${e}`;
            psik = ', ';
        })
        sql = `call splitCollection("${imgL}", "${imgR}", '${collection_id}', '${chunk_id}')`;
        collection = await doQuery(sql);
        if (Array.isArray(collection)) {
            collection = collection[0];
            collection = collection[0]
        }
        console.log(collection);
        sql = `select image_id, chunk_id, collection_id, imgOnWork, path, transaction, gate, img_time,
                img_date, motor_crop, plate_crop, rejection, onWork
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
מחזיר: getCollection(chunk_id, false, false)

*/
async function approveCollection(collection_id, chunk_id) {

    try {
        sql = `update collections set colOnWork=false, approved=true 
        where collection_id = ${collection_id};`
        result = await doQuery(sql);
        return getCollection(chunk_id, false, false);
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/* spreadCollection(chunk_id:string, collection_id:string)
מעביר את כל התמונות במקבץ לבודדים.
מסיר את המקבץ מה-chunk.
מוחק את המקבץ מרשימת המקבצים.
מחזיר: getCollection(chunk_id, false, false)

*/
async function spreadCollection(chunk_id, collection_id) {
    try {
        sql = `update images set collection_id = '-' where collection_id='${collection_id}'`;
        images = await doQuery(sql);
        sql = `delete from collections where collection_id='${collection_id}'`;
        res = await doQuery(sql);
        return getCollection(chunk_id, false, false);
    } catch (err) {
        console.log(`\n catch err in spreadCollection ${err}`);
        throw err;

    }
}
/*

disapproveCollection(chunk_id:string, collection_id:string)
משנה במקבץ: approved=false.
משנה במקבץ: onWork=false.
מחזיר: getCollection(chunk_id, true, false)

*/
async function disapproveCollection(chunk_id, collection_id) {
    try {
        sql = `update collections set colOnWork=false, approved=false where collection_id='${collection_id}'`;
        status = await doQuery(sql);
        return getCollection(chunk_id, false, false);
    } catch (err) {
        console.log(`\n catch err in disapproveCollection ${err}`);
        throw err;
    }
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
        sql = `update images set rejection='${reason}') where collection_id='${collection_id}'`;
        res = await doQuery(sql);
        sql = `update collections set colOnWork=false, status=true where collection_id='${collection_id}'`;
        status = await doQuery(sql);
        return getCollection(chunk_id, false, false);
    } catch (err) {
        console.log(`\n catch err in rejectImages ${err}`);
        throw err;
    }
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
        sql = `update collections set colOnWork=false, plate_type=${plate.type}, plate_number=${plate.number} `;
        if (plate.number.search(/\?/) === -1) {
            sql = sql + `, status=true`;
        }
        sql = sql + ` where collection_id='${collection_id}'`;
        status = await doQuery(sql);
        return getCollection(chunk_id, false, isPlate);
    } catch (err) {
        console.log(`\n catch err in setCollectionPlate ${err}`);
        throw err;
    }
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
        sql = `call closeCollections('${chunk_id}')`;
        successStatus = await doQuery(sql);
        console.log(successStatus);
    } catch (err) {
        console.log(`\n catch err in disapproveCollection ${err}`);
        throw err;
    }
    return successStatus;
}
/*•	setPlatePosition(image_id:string, position:number[])
שם בתמונה: plate_crop=position
מחזיר: הצליח/לא הצליח true/false))

*/
async function setPlatePosition(image_id, position) {
    try {
        sql = `update images set plate_crop='${position}' where image_id='${image_id}')`;
        successStatus = await doQuery(sql);
        console.log(successStatus);
        return successStatus;
    } catch (err) {
        console.log(`\n catch err in setPlatePosition ${err}`);
        throw err;
    }
}
// •	getChunk()
// מחזיר: id  של ה-chunk הראשון כך ש: status=false 
async function getChunk(image_id, position) {
    try {
        sql = `select chunk_id from chunks where status=false`;
        successStatus = await doQuery(sql);
        console.log(successStatus);
        return successStatus;
    } catch (err) {
        console.log(`\n catch err in getChunk ${err}`);
        throw err;
    }
}
/*
•	closeChunk(chunk_id:string)
משנה ב-chunk: status=true
מחזיר: הצליח/לא הצליח true/false))
*/
async function closeChunk(image_id) {
    try {
        sql = `update chunks set status=true  where chunk_id='${chunk_id}'`;
        successStatus = await doQuery(sql);
        console.log(successStatus);
        return successStatus;
    } catch (err) {
        console.log(`\n catch err in closeChunk ${err}`);
        throw err;
    }
}
/*
•	getCollections(chunk_id:string)
שם ב-chunk: onWork = true
מחזיר: את כל המקבצים ב-chunk
*/
async function getCollections(image_id) {
    try {
        sql = `update chunks set onWork = true where chunk_id='${chunk_id}'`;
        collections = await doQuery(sql);
        sql = `select collection_id from collections where chunk_id='${chunk_id}'`;
        collections = await doQuery(sql);
        console.log(collections);
        return successStatus;
    } catch (err) {
        console.log(`\n catch err in closeChunk ${err}`);
        throw err;
    }
}
/*
•	getSingles(chunk_id:string)
מחזיר: את כל התמונות ב-singles
*/
async function getSingles(image_id) {
    try {
        sql = `call getSingles('${image_id}')`;
        images = await doQuery(sql);
        console.log(images);
        return images;
    } catch (err) {
        console.log(`\n catch err in closeChunk ${err}`);
        throw err;
    }
}
/*
•	freeChunk(chunk_id:string)
שם ב-chunk: onWork = false
מחזיר: הצליח/לא הצליח true/false))

*/
async function freeChunk(chunk_id) {
    try {
        sql = `update chunks set onWork = false where chunk_id='${chunk_id}'`;
        status = await doQuery(sql);
        console.log(status);
        return status;
    } catch (err) {
        console.log(`\n catch err in closeChunk ${err}`);
        throw err;
    }
}
/*
•	getSingleImage(chunk_id:string)
מוצא את התמונה הראשונה בבודדים כך ש: plate=null, rejection=null, onWork=false
שם בתמונה: onWork=true
מחזיר: את התמונה (או null)
*/
async function getSingleImage(chunk_id) {
    try {
        sql = `select * from images where chunk_id='${chunk_id}' and collection_id='-' 
        and plate_type=0 and rejection=null and onWork=false LIMIT 1`;
        image = await doQuery(sql);
        sql= `update images set onWork=true where image_id='${image.image_id}'`
        console.log(image);
        return image;
    } catch (err) {
        console.log(`\n catch err in closeChunk ${err}`);
        throw err;
    }
}
/*
•	setSingleImagePlate(chunk_id:string , image_id:string, plate:{type:number,number:string})
שם בתמונה: plate = plate
משנה בתמונה: onWork=false
מסיר את התמונה מבודדים
מסיר את התמונה מתמונות ומעביר לtransactions-
מחזיר: getSingleImage(chunk_id)

*/
async function setSingleImagePlate(chunk_id, image_id, plate) {

}
/*
*/
async function rejectSingleImage(image_id, position) {

}
/*
*/
async function deleteSingleImage(image_id, position) {

}
/*
*/
async function getEvidence(image_id, position) {

}
/*
*/
async function getEvidences(image_id, position) {

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
    closeCollections,
    setPlatePosition,
    getChunk,
    closeChunk,
    getCollections,
    getSingles,
    freeChunk,
    getSingleImage,
    setSingleImagePlate,
    rejectSingleImage,
    deleteSingleImage,
    getEvidence,
    getEvidences
};