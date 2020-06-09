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
async function cleanUp(){
    status='';
    status +=await doQuery('truncate table images');
    console.log(status);
    status+=await doQuery('truncate table collections');
    console.log(status);
    status+=await doQuery('truncate table chunks');
    console.log(status);
    return status;
}

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
        console.log(`\nin doQuery SQL = ${sql}`);
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(`Error: ${error}, \n SQL=${sql}`);
                reject(error);
            }
            console.log(`in doQuery - result = ${JSON.stringify(result)}`);
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
async function createImage(image, chunk_id, collection_id) {
    console.log(`chunk_id, collection_id, image: ${chunk_id}, ${collection_id}, ${image}`);
    
    image = JSON.parse(JSON.stringify(image));
    console.log(`image ${image}`);
    path=image.path;
    transaction=image.transaction;
    gate=image.gate;
	img_date = image.date;
    img_time = image.time;
    motor_crop=image.motor_crop;
    plate_crop=image.plate_crop;
    /*
	`in_chunk_id` VARCHAR(50),
	`in_collection_id` VARCHAR(50),
	`in_transaction` INT,
	`gate` VARCHAR(50),
	`img_time` TIMESTAMP,
	`motor_crop` VARCHAR(50),
	`plate_crop` VARCHAR(50),
	`path` VARCHAR(250)
    */
    sql = `select newImage1("${chunk_id}", "${collection_id}", "${transaction}", "${gate}", 
        "${img_date}", "${img_time}", "${motor_crop}", "${plate_crop}", "${path}") as image`;
    try {
        image_id = await doQuery(sql);
        getTime(`image_id =  ${image}`);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createCollection(images, chunk_id) {
    collection = {
        "images": [],
        "approved": false,
        "plate": false,
        "status": false
    };
    try{
        sql = `select newCollection1('${chunk_id}') as collection`;
        collection_id = await doQuery(sql);
        collection_id = collection_id.collection;
        i=0;
        for (image of images) {
            image_id = await createImage(image, chunk_id, collection_id);
            if (i++ > 3) break;
        }
    } catch (err) {
        //        console.log(err);
        throw err;
    }
}
async function createChunk(key, value) {
    try { 
        console.log(`in createChunk key = ${key}, valueId=${value.id}`);
        chunk_id = value.id ;
        sql=`INSERT INTO bikes.chunks
        ( chunk_id, chkOnWork, chkStatus)
        VALUES ( '${value.id}', false, false)
        ON DUPLICATE KEY UPDATE chkOnWork=false, chkStatus=false`;
        const chunk = await doQuery(sql); 
        i=0;
        for (collection of value.collections) {
            collection_id = await createCollection(collection, value.id);
        }
        i=0;
        for (image of value.singles) { // Singles have only chunk_id and collection_id is null
            image_id = await createImage(image, value.id, '-');
        }

    } catch (err) {
            console.log(err);
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
/*
cleanUp().then ((status) =>{
    console.log(status);
})
*/
setTimeout( loadfinaljson, 3000);

getTime('About to exit');
