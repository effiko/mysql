const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const api = require('./api');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/getCollection', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    isApproved = req.body.isApproved;
    isPlate = req.body.isPlate;
    //    console.log(`chunk_id = ${chunk_id}, isApproved = ${isApproved}, isPlate = ${isPlate} `);
    result = await api.getCollection(chunk_id, isApproved, isPlate)
    console.log(result);
    res.send(result + getTime('/getCollection'));
});
app.post('/freeCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    result = await api.freeCollection(collection_id);
    switch (result) {
        
        case 1: res.send(true + getTime('true freeCollection')); break;
        case 0: res.send(false + getTime('false freeCollection')); break;
        default: res.send(result + getTime(' default freeCollection')); break

    }

});
app.post('/removeImageFromCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    image_id = req.body.image_id;
    result = await api.removeImageFromCollection(collection_id, image_id)
    console.log(result);
    res.send(result + getTime('/removeImageFromCollection'));
});

// splitCollection(chunk_id:string, collection_id:string, index:number)
app.post('/splitCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    splitIndex = req.body.splitIndex;
    console.log(`splitCollection(${collection_id}, ${chunk_id}, ${splitIndex});`);
    result = await api.splitCollection(collection_id, chunk_id, splitIndex);
    console.log(result);
    res.send(result + getTime('/splitCollection'));
});
// approveCollection(chunk_id:string, collection_id:string)
app.post('/approveCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    index = req.body.index;
    result = await api.approveCollection(collection_id, chunk_id);
    console.log(result);
    res.send(result + getTime('/approveCollection'));
});
app.post('/spreadCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    result = await api.spreadCollection(chunk_id, collection_id);
    console.log(result);
    res.send(result + getTime('/spreadCollection'));
});
app.post('/disapproveCollection', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    result = await api.disapproveCollection(chunk_id, collection_id);
    console.log(result);
    res.send(result + getTime('/disapproveCollection'));
});

app.post('/rejectImages', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    reason = req.body.reason;
    result = await api.rejectImages(chunk_id, collection_id, reason);
    console.log(result);
    res.send(result + getTime('/rejectImages'));
});

app.post('/setCollectionPlate', async (req, res) => {
    beginTime = Date.now();
    collection_id = req.body.collection_id;
    chunk_id = req.body.chunk_id;
    plate = req.body.plate;
    isPlate = req.body.isPlate;
    result = await api.setCollectionPlate(chunk_id, collection_id, plate, isPlate);
    console.log(result);
    res.send(result + getTime('/setCollectionPlate'));
});

// ==============================================================

beginTime = Date.now();
startTime = Date.now();
function getTime(line) {
    nowTime = Date.now();
    elapTime = nowTime - beginTime;
    diffTime = nowTime - startTime;
    startTime = nowTime;
    return (`${line}: Elapsed : ${elapTime} milisec\n`);
}

app.listen(3000);
