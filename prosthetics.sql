-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: prosthetics
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'John Doe','john@example.com','Hello from the prosthetics form!','2025-04-22 16:01:33');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `fk_orderitems_user` (`user_id`),
  KEY `fk_orderitems_order` (`order_id`),
  CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (54,10,3,1,250.00,7),(55,10,5,1,250.00,7),(56,10,7,1,450.00,7),(57,10,15,1,340.00,7),(58,10,4,1,50.00,7),(59,10,11,1,900.00,7),(60,10,10,1,80.00,7),(61,10,40,1,680.00,7),(62,10,39,1,300.00,7),(63,10,37,1,2100.00,7),(64,10,27,1,300.00,7),(65,10,9,1,320.00,7),(66,10,9,1,320.00,7),(67,11,3,1,250.00,7),(68,11,3,1,250.00,7),(69,11,4,1,50.00,7),(70,11,4,1,50.00,7),(71,11,38,1,800.00,7),(72,11,38,1,800.00,7),(73,11,39,1,300.00,7),(74,11,39,1,300.00,7),(75,12,5,1,250.00,7),(76,12,4,1,50.00,7),(77,12,3,1,250.00,7),(78,12,1,1,800.00,7),(79,12,2,1,75.00,7),(80,12,13,1,12000.00,7),(81,13,1,1,800.00,6),(82,14,31,1,300.00,7),(83,15,13,1,12000.00,7),(84,16,15,1,340.00,7),(85,16,22,1,2000.00,7),(86,17,4,1,50.00,7),(87,17,5,1,250.00,7),(88,17,10,1,80.00,7),(89,17,9,1,320.00,7),(90,17,3,1,250.00,7),(91,17,7,1,450.00,7),(92,18,13,1,12000.00,7),(93,19,10,1,80.00,7),(94,20,1,2,800.00,1),(95,20,2,1,75.00,1),(96,21,3,1,250.00,1),(97,21,4,1,50.00,1),(98,21,5,3,250.00,1),(99,22,6,1,280.00,1),(100,22,1,1,800.00,1),(101,23,7,1,450.00,1),(102,24,4,1,50.00,7),(103,24,4,1,50.00,7),(104,24,3,1,250.00,7),(105,24,3,1,250.00,7),(106,24,8,1,649.99,7),(107,24,8,1,649.99,7),(108,24,9,1,320.00,7),(109,24,9,1,320.00,7),(110,24,10,1,80.00,7),(111,24,10,1,80.00,7),(112,24,5,1,250.00,7),(113,24,5,1,250.00,7),(114,25,13,1,12000.00,7),(115,25,14,1,490.00,7),(116,25,15,1,340.00,7),(117,26,13,19,12000.00,7),(118,27,27,1,300.00,7),(119,27,32,1,1150.00,7),(120,27,33,1,100.00,7),(121,27,40,1,680.00,7),(122,27,38,1,800.00,7),(123,27,37,1,2100.00,7),(124,28,5,1,250.00,7),(125,28,4,1,50.00,7),(126,29,12,1,260.00,10),(127,29,11,1,900.00,10),(128,30,11,1,900.00,12),(129,30,10,1,80.00,12),(130,31,11,1,900.00,15),(131,31,10,1,80.00,15),(132,31,7,1,450.00,15),(133,31,1,1,800.00,15),(134,32,12,1,260.00,16),(135,32,3,1,250.00,16),(136,32,3,1,250.00,16),(137,32,2,1,75.00,16),(138,32,2,1,75.00,16),(139,32,1,1,800.00,16),(140,32,1,1,800.00,16),(141,32,10,1,80.00,16),(142,33,10,1,80.00,17),(143,33,14,1,490.00,17);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items_backup`
--

DROP TABLE IF EXISTS `order_items_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items_backup` (
  `id` int NOT NULL DEFAULT '0',
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `user_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items_backup`
--

LOCK TABLES `order_items_backup` WRITE;
/*!40000 ALTER TABLE `order_items_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','processing','shipped','delivered','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `registrations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (10,7,'2025-05-02 03:28:40','pending',6390.00),(11,7,'2025-05-02 03:37:28','pending',2850.00),(12,7,'2025-05-02 04:03:05','pending',13475.00),(13,6,'2025-05-02 04:06:16','shipped',800.00),(14,7,'2025-05-02 04:06:45','pending',350.00),(15,7,'2025-05-02 04:08:13','pending',12050.00),(16,7,'2025-05-02 04:23:39','pending',2390.00),(17,7,'2025-05-03 01:58:07','pending',1450.00),(18,7,'2025-05-03 02:02:16','pending',12050.00),(19,7,'2025-05-03 02:16:21','pending',130.00),(20,1,'2025-04-23 03:19:18','delivered',1675.00),(21,1,'2025-04-28 02:19:18','shipped',1050.00),(22,1,'2025-05-01 02:19:18','processing',1080.00),(23,1,'2025-05-03 02:19:18','pending',450.00),(24,7,'2025-05-03 02:28:33','pending',3249.98),(25,7,'2025-05-03 02:35:51','pending',12880.00),(26,7,'2025-05-03 02:42:05','pending',228050.00),(27,7,'2025-05-03 02:45:36','pending',5180.00),(28,7,'2025-05-03 02:52:16','pending',350.00),(29,10,'2025-05-03 04:49:38','pending',1210.00),(30,12,'2025-05-03 18:25:58','pending',1030.00),(31,15,'2025-05-03 21:01:07','pending',2280.00),(32,16,'2025-05-03 22:27:24','pending',2640.00),(33,17,'2025-05-03 23:40:36','pending',620.00);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders_old`
--

DROP TABLE IF EXISTS `orders_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_old` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','processing','shipped','delivered','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders_old`
--

LOCK TABLES `orders_old` WRITE;
/*!40000 ALTER TABLE `orders_old` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders_old` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `old_price` decimal(10,2) DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Category` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'System Electric Hand DMC (Aluminum)',NULL,800.00,'images/Image 1.jpg',1500.00,NULL,'Upper_Limb'),(2,'Modular Transtibial Kit (Aluminum)',NULL,75.00,'images/Image 2.jpg',NULL,NULL,'Accessories'),(3,'Polycentric Knee Joint for Knee Disarticulation (Titanium)',NULL,250.00,'images/Image 3.jpg',NULL,NULL,'Lower_Limb'),(4,'Shuttle Lock, Pyramid (Titanium)',NULL,50.00,'images/Image 4.jpg',NULL,'Used','Used Items'),(5,'Sach foot (fiberglass-reinforced plastic core and functional foam)',NULL,250.00,'images/Image 5.jpg',NULL,NULL,'Lower_Limb'),(6,'Ball shoulder joint (Aluminum)',NULL,280.00,'images/Image 6.jpg',NULL,NULL,'Upper_Limb'),(7,'Runway foot (carbon fiber)',NULL,450.00,'images/Image 7.jpg',700.00,NULL,'Lower_Limb'),(8,'Runner foot (carbon fiber)',NULL,649.99,'images/Image 8.jpg',NULL,NULL,'Lower_Limb'),(9,'Locking unit (stainless/ Aluminum)',NULL,320.00,'images/Image 9.jpg',NULL,NULL,'Accessories'),(10,'Foot cover (polyurethane)',NULL,80.00,'images/Image 10.jpg',100.00,NULL,'Accessories'),(11,'Covered System Electric Hand DMC',NULL,900.00,'images/Image 11.jpg',1250.00,NULL,'Upper_Limb'),(12,'Arm liner (Silicone)',NULL,260.00,'images/Image 12.jpg',300.00,NULL,'Accessories'),(13,'Bionic hand (Carbon fiber)',NULL,12000.00,'images/Image 13.jpg',17200.00,NULL,'Upper_Limb'),(14,'ALPS Medical liner (Silicone Gel Liner)',NULL,490.00,'images/Image 14.jpg',NULL,'Used','Used Items'),(15,'Single Axis Knee Joint (Stainless Steel)',NULL,340.00,'images/Image 15.jpg',NULL,'Used','Used Items'),(16,'Energy Storing and Hydraulic ROM foot (Carbon Fiber)',NULL,240.00,'images/Image 16.jpg',300.00,NULL,'Lower_Limb'),(17,'Mechanical Knee Joint (Aluminum)',NULL,600.00,'images/Image 17.jpg',700.00,NULL,'Lower_Limb'),(18,'Caleo 3D liner (Copolymer (TPE))',NULL,185.00,'images/Image 18.jpg',NULL,NULL,'Accessories'),(19,'Nylon Prosthetic sock (Nylon)',NULL,225.00,'images/Image 19.jpg',NULL,NULL,'Accessories'),(20,'Pre-shaped Above knee cover (Foam)',NULL,140.00,'images/Image 20.jpg',NULL,NULL,'Accessories'),(21,'Triton foot (70% Carbon Fiber)',NULL,280.00,'images/Image 21.jpg',330.00,NULL,'Lower_Limb'),(22,'3R80 hydraulic knee (Aluminum)',NULL,2000.00,'images/Image 22.jpg',NULL,'Used','Lower_Limb'),(23,'Elbow set-up (plastic and aluminum joint with 13 locking positions)',NULL,580.00,'images/Image 23.jpg',NULL,'Used','Used Items'),(24,'Myoskin hand (silicone and PVC)',NULL,200.00,'images/Image 24.jpg',NULL,NULL,'Upper_Limb'),(25,'MyolinoWrist 2000 (stainless/ Aluminum)',NULL,300.00,'images/Image 25.jpg',380.00,NULL,'Accessories'),(26,'Triton Vertical Shock (80% Carbon Fiber)',NULL,400.00,'images/Image 26.jpg',NULL,'Used','Used Items'),(27,'Ossur Rheo XC (Aluminum)',NULL,300.00,'images/Image 27.jpg',600.00,'Used','Used Items'),(28,'MovoShoulder Swing (Aluminum)',NULL,190.00,'images/Image 28.jpg',NULL,NULL,'Accessories'),(29,'Microprocessor C leg (Carbon)',NULL,620.00,'images/Image 29.jpg',NULL,'Used','Used Items'),(30,'Genium X3 knee (Carbon)',NULL,1300.00,'images/Image 30.jpg',NULL,'Used','Used Items'),(31,'O.B. Friction Wrist Unit (stainless/ Aluminum)',NULL,300.00,'images/Image 31.jpg',NULL,NULL,'Accessories'),(32,'Empower ankle (carbon fiber)',NULL,1150.00,'images/Image 32.jpg',NULL,NULL,'Lower_Limb'),(33,'Wrist Unit - Ratchet Type Rotation (stainless/ Aluminum)',NULL,100.00,'images/Image 33.jpg',NULL,NULL,'Accessories'),(34,'Suspension valve (Aluminum)',NULL,300.00,'images/Image 34.jpg',NULL,'Used','Used Items'),(35,'Suspension sleeve (TPE-Thermoplastic elastomers)',NULL,80.00,'images/Image 35.jpg',NULL,NULL,'Accessories'),(36,'Sport knee joint 3S80 (Aluminum)',NULL,3000.00,'images/Image 36.jpg',NULL,NULL,'Lower_Limb'),(37,'Dynion knee joint 3R85 (Aluminum)',NULL,2100.00,'images/Image 37.jpg',3800.00,'Used','Used Items'),(38,'System Electric Hand 8E33 (Aluminum)',NULL,800.00,'images/Image 38.jpg',NULL,NULL,'Upper_Limb'),(39,'Movido knee 3R68 (Aluminum)',NULL,300.00,'images/Image 39.jpg',980.00,'Used','Used Items'),(40,'System Electric Hand 8E38=7 (Aluminum)',NULL,680.00,'images/Image 40.jpg',980.00,NULL,'Upper_Limb');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `birthDate` date DEFAULT NULL,
  `newPassword` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `profilePicture` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `hearAboutUs` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `otherSource` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_general_ci,
  `termsAccepted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES (1,'Mina','M','mina@gmail.com','01227205334','x','1945-04-11','M)3NP#)6M8%q?+H','Other',NULL,'Google','','x',NULL,'2025-04-27 00:02:47'),(2,'minaMM','m','mina2@gmail.com','01150582327','x','1972-04-20','$,-^B8UC5a.pGkB','Female',NULL,'Google','','x',NULL,'2025-04-27 00:36:14'),(3,'Mina','M','mina0@gmail.com','01227205334','x','1980-04-09','$2b$10$Xiewim7B1UfMh8a61NwKKedAIHDCZP0LwD6twofI3BfIkG7tRqCWu','Female','/uploads/profiles/profile-1746156611418-829244518.jpg','Search Engine','','x',0,'2025-04-28 23:00:26'),(5,'min','mina','mina5@gmail.com','01227205334','x','1984-05-24','$2b$10$BmFTydTqXUOSn2A3T37q/uMJyR3ZKBNeAWDdVVU6Cltgs4AvnefYi','Other',NULL,'Friend','','x',0,'2025-05-01 23:55:32'),(6,'Mina','MIna','mina01@gmail.com','01227205334','CAIROOOOOOOOOO','1961-05-18','$2b$10$1LQn1ZPyMIli5PVR..3RlOHPfO83eq/xNNRUogjJrinhKn9tcdVp.','Male','/uploads/profiles/profile-1746157994790-650108693.jpg','Google','','z',0,'2025-05-02 03:34:48'),(7,'Mina','Magdy','minaa@gmail.com','01227205334','WOWWWW','1989-05-17','$2b$10$WFB7lDWpyMqMYSGJNrWauOE1sbi1guXQGZvjzoQWO1iUnfiyNrS9O','Male',NULL,'Google','','wowww',0,'2025-05-03 02:44:24'),(8,'MIANIANIAN','MAINSIOANDIU','mina001@gmail.com','01227205334','di9fojsdo','1961-05-11','$2b$10$nrnwZJwpSMM1c7sn/qr1nebImhkvwEtGFL2Nun2T7aNtLHOVVWnCK','Male','/uploads/profiles/profile-1746241201835-601880071.jpg','Search Engine','','x',0,'2025-05-03 02:57:09'),(9,'minamian','minamina','mina002@gmail.com','01227205334','x','1968-05-08','$2b$10$PoiJvJYjiYl5ACmCM9UIBOi8Ocyoc6ye77ALUOn920hhtFnpAr2Em','Male',NULL,'Search Engine','','x',0,'2025-05-03 03:00:46'),(10,'MIANAMIN','MAININ','mina003@gmail.com','01227205334','x','1980-05-07','$2b$10$cOg09.PNFS3ExEBViy0c/.JeXIFRdK4XrWNK.zq8s01ODPLZBgIFy','Male','/@uploads/profile-1746241883750-40498648.jpg','Google','','x',0,'2025-05-03 03:05:33'),(11,'MinaFFF','mina','minaf@gmail.com','01227205334','x','1980-05-14','$2b$10$KpZyjtP/tTvFBMShXIKPPuwTsBtCEUbenaJu1tdJIT0mLci9TVypS','Female',NULL,'Social Media','','x',0,'2025-05-03 05:47:30'),(12,'Ahmed','Mousaaa','ahmedmousa44200513@gmail.com','01154398588','elmaady','2005-03-03','$2b$10$X.gaLx724WyE.VTvQHe2c.9YwuzY5by1HMtyMfL1cUDD51Y/cE/ZO','Male',NULL,'Search Engine','','dfs',0,'2025-05-03 15:46:56'),(13,NULL,NULL,'sdsasdsdfdfgdfvcbfghhfd@gmail.com','+20',NULL,NULL,'$2b$10$Jv38UF.E0f2S2bwdalpByOgTcPkULeaDb4A4PJUb9QaiL3pw7.F9S',NULL,NULL,NULL,NULL,NULL,0,'2025-05-03 19:17:51'),(14,NULL,NULL,'ahmed2323@gmail.com','+2001254399940',NULL,NULL,'$2b$10$J8muaBTv0p8cUyGCegKoXeEFvQbrUCYr1sJn1FRO7Eh/2gDksnZXa',NULL,NULL,NULL,NULL,NULL,0,'2025-05-03 19:19:26'),(15,'zzzzzzzzzzzzzz','wwwwwwwwwwww','ahmedmousa4420051444@gmail.com','01154398540','elmaady','2001-10-16','$2b$10$LLyNnaVkGBF.ws/TK33jl.aUVFLBJDSkh0p5fgtxs3xHl1qyAQ5Jy','Other',NULL,'Google','','frffsa',0,'2025-05-03 20:59:15'),(16,'assdsda','Mousa','ahmedmousa4420051333@gmail.com','01155598540','elmaady','1997-10-14','$2b$10$IArld0nZt9B5LhtVFPbFbuFvLLTqGI9BEp1kFfCsX/qsFz2prTZoq','Male',NULL,'Search Engine','','rfesaexdf',0,'2025-05-03 22:26:06'),(17,'assdsdaaass','Mousaaaa','ahmedmousa44200512333@gmail.com','01155568540','elmaadya','1997-10-30','$2b$10$wkNvaZRv50WfVw3rBHHe9.4NSrGCEm2TFnCneaxIX9XU9cX0DU9pK','Male',NULL,'Social Media','','sdada',0,'2025-05-03 22:32:42'),(18,'sadfsa','xxxxxxxxxxxxxxxx','ahmedmousa44200512222@gmail.com','01154399522','elmaadyr','1997-11-12','$2b$10$s6I3b/bcDyRjPcxLdY0tOec0O1EZfHoPAd2tBbTWEVTgDVoMH4mnm','Male',NULL,'Google','','dsfsaAAS',0,'2025-05-03 23:44:17');
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `location` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `sponsorshipTypes` json DEFAULT NULL,
  `otherSponsorship` varchar(255) DEFAULT NULL,
  `collaboration` text NOT NULL,
  `visibility` varchar(50) NOT NULL,
  `proposal` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `proposalFile` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'fdsf','sdsad@gmail.com','+20 01154398540','+20','4420041234\"aa',NULL,NULL,'fgcvbvcdcdxfd','Public',NULL,'2025-04-24 21:07:37',NULL),(3,'fdsf','sdsadfd@gmail.com','+2001154398540','+20','4420041234\"a',NULL,NULL,'rtrdgrd','Public',NULL,'2025-04-24 21:23:08',NULL),(7,'ahmed sdsf','sdsaddfdgf@gmail.com','+2001254398540','+20','123242345\"A',NULL,NULL,'asdsf','Anonymous',NULL,'2025-04-24 22:38:25',NULL),(8,'ahmeddsdsssaa','sdsasdsdfdfgdfvcb@gmail.com','+2001254398540','+20','34534233\"as',NULL,'dfdgfdfadafgvdfgv','sfrfdg','Public',NULL,'2025-04-24 22:40:22',NULL),(9,'wqq232234','ahmed232333@gmail.com','+20012543986740','+20','4420041234@a','[\"Financial Support\", \"Other\"]','edsrfesrwww','ghjghjghjhgjhgjghj','Anonymous',NULL,'2025-05-03 22:30:21','1746311421480-PULSE.docx');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'mina@gmail.com','$2b$10$i55m1g1FWATuCcPMkhdm.udspq5Qr3byNz.DajW2rt3HIPnuUJ0sW','2025-04-27 00:02:47','2025-04-27 06:06:41',NULL),(2,'mina2@gmail.com','$2b$10$RjAcITcAEWHzaQxwCkGxnedwrgaYO8p3dNigBMySlNmhb3xNVteoy','2025-04-27 00:36:14',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteers`
--

DROP TABLE IF EXISTS `volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `volunteers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `age` int DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `availability` varchar(100) NOT NULL,
  `volunteering_area` text NOT NULL,
  `previous_experience` varchar(100) NOT NULL,
  `experience_details` text,
  `languages` text NOT NULL,
  `other_volunteering` text,
  `other_language` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteers`
--

LOCK TABLES `volunteers` WRITE;
/*!40000 ALTER TABLE `volunteers` DISABLE KEYS */;
INSERT INTO `volunteers` VALUES (1,'Ahmed Mousa Mousa dfds',22,'ahmedmousa44200512@gmail.com','+2001254398540','+20','2132143432AAs','Full-time','[\"Medical Consultant\"]','No',NULL,'[\"Spanish\"]',NULL,NULL),(2,'Ahmed Mousa Mousa dfdswsrs',23,'ahmedmousa442005132@gmail.com','+2001254398240','+20','243212\"a','Part-time','[\"Medical Consultant\",\"Technical Support\",\"Community Outreach\"]','No',NULL,'[\"Spanish\"]',NULL,NULL),(3,'zzzzzzzzzzzzzz wwwwwwwwwwww',20,'ahmedmousa44200512345@gmail.com','+2001254598240','+20','4420041234@a','Full-time','[\"Medical Consultant\",\"Other\"]','No',NULL,'[\"Spanish\",\"French\",\"Other\"]','dsfsddadasewqe','saaasda');
/*!40000 ALTER TABLE `volunteers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-04  2:52:50
