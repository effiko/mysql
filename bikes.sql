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
  `chunk_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `chk_json` json NOT NULL,
  `chkOnWork` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chunk_id` (`chunk_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.
-- Dumping structure for table bikes.collections
CREATE TABLE IF NOT EXISTS `collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colOnWork` tinyint(1) DEFAULT '0',
  `collection_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `col_json` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collection_id` (`collection_id`)
) ENGINE=InnoDB AUTO_INCREMENT=348 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.
-- Dumping structure for table bikes.images
CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `imgOnWork` tinyint(1) DEFAULT NULL,
  `img_json` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `image_id` (`image_id`)
) ENGINE=InnoDB AUTO_INCREMENT=938 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.
-- Dumping structure for procedure bikes.kk_stored_procedure
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `kk_stored_procedure`(
	IN `Param1` INT
)
proc_label: 
BEGIN

DECLARE count1 INT DEFAULT 0;
DECLARE row_count1 BIGINT DEFAULT 0;
DECLARE v_assigned_kk_custid TEXT(11) DEFAULT '';
DECLARE v_ol_custid INT DEFAULT 0;
DECLARE v_newPgId INT DEFAULT 0;
#DECLARE v_ol_custid_dest INT DEFAULT 0;
DECLARE v_classes TEXT(15000);
DECLARE v_programs TEXT(15000);
DECLARE v_PgName TEXT(500) CHARSET utf8;
DECLARE v_class_admin INT DEFAULT 0;

DECLARE v_parent_id_program INT DEFAULT 0;
DECLARE v_err_msg TEXT(15000);
DECLARE warn INT DEFAULT 0;
DECLARE ChildPrgMark TEXT(10) CHARSET utf8;
DECLARE v_ol_orig_prog INT DEFAULT 0;

DECLARE EXIT HANDLER FOR SQLEXCEPTION 
BEGIN
	#GET DIAGNOSTICS CONDITION 1 
	#	@p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
	SELECT v_err_msg, v_programs, "KO SQLEXCEPTION", @p1, @p2;
	ROLLBACK;
END;
DECLARE EXIT HANDLER FOR sqlwarning 
BEGIN
	SELECT v_err_msg, v_programs, "KO sqlwarning";
	ROLLBACK;
END;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET warn = 1;

SET ChildPrgMark = '◊';

SELECT pol.ol_custid INTO v_ol_custid FROM classes cs 
	JOIN permit_ol pol ON cs.CustID = pol.kk_custid 
WHERE cs.CustID = kk_custid AND pol.user_name = concat('c',kk_custid);
IF v_ol_custid is null OR warn = 1 THEN 
	SET v_err_msg = "class or class user not found";
	SELECT v_err_msg;
    LEAVE proc_label;
END IF;

SELECT cp.program_name, pol.class_admin, cp.ol_originator INTO v_PgName, v_class_admin, v_ol_orig_prog FROM class_programs cp 
	JOIN permit_ol pol ON cp.ol_originator = pol.ol_custid 
WHERE cp.id_program = pg_id;
IF v_PgName is null OR v_class_admin < 2 OR warn = 1 THEN 
	SET v_err_msg = "no program found or old owner class_admin < 3";
	SELECT v_err_msg;
	LEAVE proc_label;
END IF;
SET v_PgName = TRIM(v_PgName);
IF CHAR_LENGTH(v_PgName) < 1 THEN
	SET v_err_msg = "original program name too short!";
	SELECT v_err_msg;
	LEAVE proc_label;
END IF;
SET v_PgName = SUBSTRING(v_PgName FROM 1 FOR 43);
SET v_PgName = concat(v_PgName,ChildPrgMark);

SELECT cpr.parent_id_program INTO v_parent_id_program FROM class_prog_relation cpr
where cpr.id_program=pg_id;
IF v_parent_id_program is not null OR warn = 1 THEN 
	SET v_err_msg = "child program detected";
	SELECT v_err_msg;
	LEAVE proc_label;
END IF;

#SET v_PgName = 'pm4mysql01';
#SET v_ol_custid = 106949;

SELECT cp.id_program INTO v_newPgId FROM class_programs cp WHERE cp.ol_originator=v_ol_custid AND cp.program_name=v_PgName LIMIT 1;
IF v_newPgId > 0 THEN 
	SET v_err_msg = CONCAT("child program already exists: ", v_newPgId);
	SELECT v_err_msg;
	#LEAVE proc_label;
END IF;

START TRANSACTION;

	IF v_newPgId <= 0 THEN #class program was already created, so use the existing one

    insert into class_programs(program_name,shabat,ol_originator,published) values(v_PgName,"1",v_ol_custid,"1");
    
    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_classes, v_programs, "no prg inserted";
		LEAVE proc_label;
    END IF;
    
    SET v_newPgId = (SELECT LAST_INSERT_ID());

    insert into class_prog_relation(id_program, parent_id_program) values(v_newPgId,pg_id);
    
    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_PgName, v_ol_custid, v_newPgId, "no prg relation inserted";
        ROLLBACK;
		LEAVE proc_label;
    END IF;
    
	INSERT INTO u2p (id_unit, id_program) 
	SELECT  DISTINCT u2p_1.id_unit AS id_unit, 
			v_newPgId AS id_program
	FROM        u2p u2p_1
	WHERE	u2p_1.id_program = pg_id;
    
    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_PgName, v_ol_custid, v_newPgId, "no u2p relation inserted";
        ROLLBACK;
		LEAVE proc_label;
    END IF;

	SET v_err_msg = "mark01";

	INSERT INTO i2p (id_program_item, id_program) 
	SELECT  DISTINCT i2p_1.id_program_item AS id_program_item, 
			v_newPgId AS id_program
	FROM        i2p i2p_1
	WHERE	i2p_1.id_program = pg_id;

    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_PgName, v_ol_custid, v_newPgId, "no i2p relation inserted";
        #ROLLBACK;
		#LEAVE proc_label;
    END IF;
    
	SET v_err_msg = "mark02";    
    
	INSERT INTO q2p (id_quiz, id_program) 
	SELECT  DISTINCT q2p_1.id_quiz AS id_quiz, 
			v_newPgId AS id_program
	FROM        q2p q2p_1
	WHERE	q2p_1.id_program = pg_id;  
    
    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_PgName, v_ol_custid, v_newPgId, "no q2p relation inserted";
        #ROLLBACK;
		#LEAVE proc_label;
    END IF;
    
	SET v_err_msg = "mark03";   
	
	END IF; # End of creating new program
    
	SELECT cpc.kk_custid INTO v_assigned_kk_custid FROM class_programs_classes cpc WHERE cpc.kk_custid=kk_custid LIMIT 1;
    SET v_err_msg = "mark03b";    
	IF v_assigned_kk_custid = '' THEN 
		SET v_err_msg = "mark03c";    
		insert into class_programs_classes(id_program,ignore_periods_program,kk_custid,enabled,ol_originator) values(v_newPgId,0, kk_custid, 1, v_ol_custid);
    ELSE
		SET v_err_msg = "mark03d";    
		update class_programs_classes cpc set cpc.id_program=v_newPgId, cpc.ol_originator=v_ol_orig_prog where cpc.kk_custid=kk_custid and cpc.id > 0;
    END IF;
    SET v_err_msg = "mark03e";    
    SET row_count1 = (SELECT ROW_COUNT());
    IF row_count1 <= 0 THEN 
		SELECT v_PgName, v_ol_custid, v_newPgId, "no class_programs_classes updated/inserted";
        ROLLBACK;
		LEAVE proc_label;
    END IF;

	SET v_err_msg = "mark04";

	DELETE qc FROM quizes_classes AS qc WHERE qc.kk_custid=kk_custid;

	SET v_err_msg = "mark05";

	insert into quizes_classes(id_quiz, kk_custid,enabled,ol_originator) select q.id_quiz, kk_custid, 1,v_ol_orig_prog
            from quizes q, q2p q2p_1
            where q.id_quiz=q2p_1.id_quiz and q.published=1 and q2p_1.id_program=v_newPgId;
    
	SET v_err_msg = "mark06";    
    
SELECT "OK", v_PgName, v_ol_custid, v_newPgId;

COMMIT;

END//
DELIMITER ;

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
	`colJson` TEXT
) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    COMMENT 'insert into the Collection table, create an Collection_id string as md5'
BEGIN
	insert into bikes.collections set `col_json`=colJson, `colOnWork`=false ;
	set @id = LAST_INSERT_ID();
    set @collection_id = md5(@id);
    update collections set `collection_id` = @collection_id where `id`=@id;
	RETURN @collection_id;
END//
DELIMITER ;

-- Dumping structure for function bikes.newImage
DELIMITER //
CREATE DEFINER=`root`@`localhost` FUNCTION `newImage`(`imgJson` VARCHAR(255)) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    COMMENT 'insert into the images table, create an image_id string as md5 o'
BEGIN
	insert into bikes.images set `img_json`=imgJson, `imgOnWork`=false ;
	set @id = LAST_INSERT_ID();
    set @image_id = md5(@id);
    update images set `image_id` = @image_id where `id`=@id;
	RETURN @image_id;
END//
DELIMITER ;

-- Dumping structure for procedure bikes.removeImageFromCollection
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `removeImageFromCollection`(
	IN `in_collection_id` VARCHAR(50),
	IN `in_image_id` VARCHAR(50)




)
    COMMENT 'מסיר את ה- reference לתמונה במקבץ, ושם reference לתמונה ב- singles'
BEGIN
DECLARE v_chunk_id VARCHAR(50);
DECLARE v_path_to_remove VARCHAR(50);
SET collation_connection = 'utf8_general_ci';
select chunk_id into v_chunk_id from chunks where json_search(chk_json->>'$.collections', 'one', in_collection_id) limit 1;
select json_unquote(json_search(col_json, 'all', in_image_id)) into v_path_to_remove from collections where collection_id = in_collection_id limit 1;
update collections set col_json = json_remove(col_json, v_path_to_remove) where collection_id =in_collection_id;
update chunks set chk_json = JSON_MERGE_PRESERVE(chk_json->>'$.singles', JSON_OBJECT("singles", in_image_id)) where chunk_id = v_chunk_id;
select col_json from collections where collection_id = in_collection_id limit 1;

END//
DELIMITER ;

-- Dumping structure for procedure bikes.splitCollection
DELIMITER //
//
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
