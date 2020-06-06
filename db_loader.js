const fs = require('fs');
var mysql = require('mysql');
const jsonPath = './final.json';

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
// +++++++++++++++++++++++++++++++++++++++++++++
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
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
            arr = Object.values(result[0])[0];
            //            console.log(arr);
            resolve(arr);
        })
    })
}
async function createImage(image) {
    sql = "select newImage('" + JSON.stringify(image) + "')";
    try {
        image_id = await doQuery(sql);
        getTime('image_id = ' + image_id);
        return (image_id);
    } catch (err) {
        //            console.log(err);
        throw err;
    }
}

async function createCollection(images) {
    collection = {
        "images": [],
        "approved": false,
        "plate": false,
        "status": false
    };
    collection_id = "";
    for (image of images) {
        image_id = await createImage(image)
        collection.images.push(image_id);
    }
    sql1 = "select newCollection('" + JSON.stringify(collection) + "')";
    try {
        collection_id = await doQuery(sql1);
        return collection_id;
    } catch (err) {
        //        console.log(err);
        throw err;
    }
}
async function createChunk(key, value) {
    chunk = {
        "chunk_id": "",
        "collections": [],
        "singles": [],
        "status": false
    };
    chunk.chunk_id = value.id;
//    console.log(`\n+++++++++++++++++\ncreating key: ${key}, chunk_id: ${chunk.chunk_id}`);
    for (collection of value.collections) {
        try {
            collection_id = await createCollection(collection);
            chunk.collections.push(collection_id);
//            console.log(`\nchunk.chunk_id: ${chunk.chunk_id}, collection_id : ${collection_id}`);
        } catch (err) {
            //                console.log(err);
            throw err;
        }

    }

    for (image of value.singles) {
        try {
            image_id = await createImage(image)
            chunk.singles.push(image_id)
//            console.log(`\nchunk.chunk_id: ${chunk.chunk_id}, image_id : ${image_id}`);
        } catch (err) {
            //                console.log(err);
            throw err;
        }
    }

    sql2 = "select newChunk('" + JSON.stringify(chunk) + "')";
    try {
        chunk_id = await doQuery(sql2);
        console.log(chunk_id);
    } catch (err) {
        console.log(`Line 112 ${err}`);
        throw err;
    }
}
async function parseObject(obj) {
    for (let [key, value] of Object.entries(obj)) {
        console.log(`key ${key}`);
        if (key.value < 1) exit();
        if (value.hasOwnProperty('id')) {
            await createChunk(key, value);
        } else {
            console.log('Invalid object in last chunk   ' + `${key}: ${value}`);
        }
    }
    exit();
}
function loadfinaljson() {
    data = JSON.parse(fs.readFileSync(jsonPath));
    parseObject(data);
    console.log('loadfinaljson - success');
};
function exit() {
    console.log('server is starting cleanup')

    return new Promise((resolve, reject) => {
        con.end((err) => {
            if (err) {
                console.error('error during disconnection', err.stack)
                return reject(err)
            }
            console.log('db has disconnected')
            return resolve()
        })
    })
}
loadfinaljson();
getTime('About to exit');
