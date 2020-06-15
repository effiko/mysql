CREATE PROCEDURE `getCollection` ()
BEGIN
	select JSON_OBJECT ('collection_id',collection_id,
    'chunk_id',chunk_id,
    'approved',approved,
    'plate_type',plate_type,
    'plate_number',plate_number,
    'colOnWork',colOnWork,
    'imageList',imageList) into @coll from collections where collection_id = in_collection_id for update;
    DEClARE curImg CURSOR FOR select  JSON_OBJECT (
	'image_id',image_id,
    'chunk_id',chunk_id,
    'collection_id',collection_id,
    'imgOnWork',imgOnWork,
    'path',path,
    'transaction',`transaction`,
    'gate',gate,
    'img_time',img_time,
    'img_date',img_date,
    'motor_crop',motor_crop,
    'plate_crop',plate_crop,
    'rejection',rejection,
    'onWork',onWork ) as img
     from images where collection_id = in_collection_id;
     OPEN curImg;
     set @images = '';
     imgLoop: LOOP
		fetch curImg into @img;
        set @images = concat(@images, ',', @img);
		END LOOP imgLoop;
        
    select  JSON_OBJECT('collection', @coll, 'images', @images);
END