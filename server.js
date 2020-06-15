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

app.post('/closeCollections', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.closeCollections(chunk_id);
    console.log(result);
    res.send(result + getTime('/closeCollections'));
});
// setPlatePosition(image_id:string, position:number[])
app.post('/setPlatePosition', async (req, res) => {
    beginTime = Date.now();
    image_id = req.body.image_id;
    posNumbers = req.body.posNumbers;
    result = await api.setPlatePosition(image_id, posNumbers);
    console.log(result);
    res.send(result + getTime('/setPlatePosition'));
});
app.post('/getChunk', async (req, res) => {
    beginTime = Date.now();
    result = await api.getChunk();
    console.log(result);
    res.send(result + getTime('/getChunk'));
});
//•	closeChunk(chunk_id:string)
app.post('/closeChunk', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.closeChunk(chunk_id);
    console.log(result);
    res.send(result + getTime('/closeChunk'));
});
// •	getCollections(chunk_id:string)
app.post('/getCollections', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.getCollections(chunk_id);
    console.log(result);
    res.send(result + getTime('/getCollections'));
});
//•	getSingles(chunk_id:string)
app.post('/getSingles', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.getSingles(chunk_id);
    console.log(result);
    res.send(result + getTime('/getSingles'));
});
// •	freeChunk(chunk_id:string)
app.post('/freeChunk', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.freeChunk(chunk_id);
    console.log(result);
    res.send(result + getTime('/freeChunk'));
});
// •	getSingleImage(chunk_id:string)
app.post('/getSingleImage', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    result = await api.getSingleImage(chunk_id);
    console.log(result);
    res.send(result + getTime('/getSingleImage'));
});
// •	setSingleImagePlate(chunk_id:string , image_id:string, plate:{type:number,number:string})
app.post('/setSingleImagePlate', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    image_id = req.body.image_id;
    plate = req.body.plate;
    result = await api.setSingleImagePlate(chunk_id, image_id, plate);
    console.log(result);
    res.send(result + getTime('/setSingleImagePlate'));
});
// •	rejectSingleImage(chunk_id:string, image_id:string, reason:string)
app.post('/rejectSingleImage', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    image_id = req.body.image_id;
    reason = req.body.reason;
    result = await api.rejectSingleImage(chunk_id, image_id, reason);
    console.log(result);
    res.send(result + getTime('/rejectSingleImage'));
});
// •	deleteSingleImage(chunk_id:string, image_id:string, reason:string)
app.post('/deleteSingleImage', async (req, res) => {
    beginTime = Date.now();
    chunk_id = req.body.chunk_id;
    image_id = req.body.image_id;
    reason = req.body.reason;
    result = await api.deleteSingleImage(chunk_id, image_id, reason);
    console.log(result);
    res.send(result + getTime('/deleteSingleImage'));
});
// •	getEvidence(fullPlate:{type:number, number:string})
app.post('/getEvidence', async (req, res) => {
    beginTime = Date.now();
    fullPlate = req.body.fullPlate;
    result = await api.getEvidence(fullPlate);
    console.log(result);
    res.send(result + getTime('/getEvidence'));
});
// •	getEvidences(partialPlate:{type:number, number:string})
app.post('/getEvidences', async (req, res) => {
    beginTime = Date.now();
    partialPlate = req.body.partialPlate;
    result = await api.getEvidences(partialPlate);
    console.log(result);
    res.send(result + getTime('/getEvidences'));
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
