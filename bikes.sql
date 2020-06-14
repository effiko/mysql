-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.18 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             9.5.0.5196
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for bikes
CREATE DATABASE IF NOT EXISTS `bikes` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bikes`;

-- Dumping structure for table bikes.chunks
CREATE TABLE IF NOT EXISTS `chunks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chunk_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `chkOnWork` tinyint(4) DEFAULT NULL,
  `chkStatus` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `chunk_id` (`chunk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='convert auto increment id to md5';

-- Data exporting was unselected.
-- Dumping structure for table bikes.collections
CREATE TABLE IF NOT EXISTS `collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collection_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `chunk_id` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `approved` tinyint(4) DEFAULT '0',
  `plate_type` int(11) DEFAULT '0',
  `plate_number` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `colOnWork` tinyint(4) DEFAULT '0',
  `imageList` varchar(1024) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collection_id` (`collection_id`)
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.
-- Dumping structure for table bikes.evidences
CREATE TABLE IF NOT EXISTS `evidences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `image_id` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='list of images that already paid';

-- Data exporting was unselected.
-- Dumping structure for table bikes.images
CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `chunk_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `collection_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `imgOnWork` tinyint(4) DEFAULT NULL,
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transaction` int(11) DEFAULT NULL,
  `gate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `img_time` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `img_date` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `motor_crop` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `plate_crop` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rejection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `onWork` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `image_id` (`image_id`),
  KEY `collection_id` (`collection_id`) /*!80000 INVISIBLE */,
  KEY `chunk_id` (`chunk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=938 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.
-- Dumping structure for table bikes.mot_bikes
CREATE TABLE IF NOT EXISTS `mot_bikes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plate` varchar(32) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1186857 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for function bikes.newChunk
DELIMITER //
CREATE DEFINER=`root`@`localhost` FUNCTION `newChunk`(
	`chunk` TEXT
) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    COMMENT 'insert into the Chunks table, create an Chunk_id string as md5'
BEGIN
	insert into bikes.chunks set `chk_json`=chunk, `chkOnWork`=false ;
	set @id = LAST_INSERT_ID();
    set @chunk_id = md5(@id);
    update chunks set `chunk_id` = @chunk_id where `id`=@id;
	RETURN @chunk_id;
END//
DELIMITER ;

-- Dumping structure for function bikes.newCollection
DELIMITER //
CREATE DEFINER=`root`@`localhost` FUNCTION `newCollection`(
	`in_chunk_id` VARBINARY(50)



) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    COMMENT 'insert into the Collection table, create an Collection_id string as md5'
BEGIN
	insert into bikes.collections set chunk_id=in_chunk_id,approved=false, plate_type=0, plate_number=NULL, colOnWork=false;
	set @id = LAST_INSERT_ID();
    set @collection_id = md5(@id);
    update collections set `collection_id` = @collection_id where `id`=@id;
	RETURN @collection_id;
END//
DELIMITER ;

-- Dumping structure for function bikes.newImage
DELIMITER //
CREATE DEFINER=`root`@`localhost` FUNCTION `newImage`(
	`in_chunk_id` VARCHAR(50),
	`in_collection_id` VARCHAR(50),
	`in_transaction` VARCHAR(50),
	`gate` VARCHAR(50),
	`img_date` VARCHAR(50),
	`img_time` VARCHAR(50),
	`motor_crop` VARCHAR(50),
	`plate_crop` VARCHAR(50)
,
	`path` VARCHAR(250)





) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    COMMENT 'insert into the images table, create an image_id string as md5 o'
BEGIN
	INSERT INTO `bikes`.`images`
(`chunk_id`, `collection_id`, `imgOnWork`, `path`, `transaction`, `gate`, `img_date`, `img_time`, `motor_crop`, `plate_crop`, `rejection`, `onWork`)
VALUES
(in_chunk_id, in_collection_id, false, path, in_transaction, gate, img_date, img_time, motor_crop, plate_crop, NULL, false);

	set @id = LAST_INSERT_ID();
    set @image_id = md5(@id);
    update images set `image_id` = @image_id where `id`=@id;
	return  @image_id;
END//
DELIMITER ;

-- Dumping structure for procedure bikes.splitCollection
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `splitCollection`(
	IN `coll_l` text,
	IN `coll_r` text,
	IN `old_coll_id` VARCHAR(50),
	IN `in_chunk_id` VARCHAR(50)


)
BEGIN
	insert into collections set chunk_id=in_chunk_id, imageList=coll_r, `colOnWork`=true ;
	set @id = LAST_INSERT_ID();
    set @coll_r_id     = md5(@id);
    update collections set `collection_id` = @coll_r_id where `id`=@id;
    insert into unlockonwork set tableName = 'collections', id= @coll_r_id, TTR=UNIX_TIMESTAMP()+600;

	insert into collections set chunk_id=in_chunk_id, imageList=coll_l, `colOnWork`=false ;
	set @id = LAST_INSERT_ID();
  set @coll_l_id     = md5(@id);
    set @coll_l_id = md5(@id);
    update collections set `collection_id` = @coll_l_id where `id`=@id;

/*
   set @sql = concat("UPDATE `TABLE` SET `Column` = 'value'
                      WHERE `TABLE`.Id in (" , list_of_ids , ")");

    PREPARE stmt FROM @sql;
    EXECUTE stmt;

*/
set @sql = concat ("update images set collection_id=@coll_l_id where image_id in (" , coll_l, ")");
prepare stmt from @sql ;
execute stmt;

 set @sql = concat ("update images set collection_id=@coll_r_id where image_id in (" , coll_r, ")");
prepare stmt from @sql ;
execute stmt;

  delete from collections where collection_id = old_coll_id;
	select * from collections where collection_id=@coll_r_id;
END//
DELIMITER ;

-- Dumping structure for procedure bikes.test1
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `test1`(
	IN `in_collection_id` VARCHAR(50)
)
    DETERMINISTIC
BEGIN
 select * from images where collection_id = in_collection_id;
END//
DELIMITER ;

-- Dumping structure for procedure bikes.testp
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `testp`()
BEGIN
select * from chunks;
END//
DELIMITER ;

-- Dumping structure for table bikes.unlockonwork
CREATE TABLE IF NOT EXISTS `unlockonwork` (
  `tableName` varchar(32) NOT NULL,
  `id` int(11) NOT NULL,
  `TTR` int(11) NOT NULL,
  KEY `ttr` (`TTR`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
