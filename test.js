var mysql = require('mysql');
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bikes',
    port: 3308
});
beginTime = Date.now();
startTime = Date.now();
function getTime(line) {
    nowTime = Date.now();
    elapTime = nowTime - beginTime;
    diffTime = nowTime - startTime;
    startTime = nowTime;
    return (`${line}: Elapsed : ${elapTime}, Step: ${diffTime} milisec\n`);
}


function doQuery(sql, seq) {
    return new Promise((resolve, reject) => {
        console.log(getTime('start do ' + seq));
        con.query(sql, (error, result, fields) => {
            if (error) {
                console.log(error);
                reject(error);
            }
            console.log(getTime('end do ' + seq));
            arr = Object.values(result[0])[0];
            console.log(arr);
            resolve(arr);
        })
    })
}
image = '{"transaction":"3230572301","gate":"TG_1A","date":"22/01/2020"}';
sql = "select newImage('" + image + "')";
async function doQueries() {
    for (i = 0; i < 10; i++) {
        console.log(getTime('Start query '+i));
        await doQuery(sql, i)
        .then(
            (ans) => {
                console.log(getTime(i+ ' ans'));
                console.log(JSON.stringify(ans));
            },
            (err) => {
                console.log(err);
            }
        )
    }
    exit();
}
async function connect2db(){
    console.log(getTime('Starting Pogram'));
    await con.connect((err) => {
        if (err) {
            console.error('error connecting: ' + err.stack);
            throw err;
        }
        console.log(getTime('connected'));
        console.log('1. connected as id ' + con.threadId);
    });
}
connect2db();
doQueries();
function exit () {
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
console.log(getTime('End'));