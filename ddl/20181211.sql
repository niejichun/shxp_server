SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;


insert into tbl_common_systemmenu (systemmenu_name,node_type,parent_id,version,created_at,updated_at) VALUES ('小程序基础信息维护','00','16',1,NOW(),NOW());
call Pro_AddMenu('小程序基础信息维护', '菜单管理','/shxp/baseconfig/SHXPProductControlSRV','SHXPPRODUCTCONTROLSRV');

insert into seqmysql values ('shxpProductId',1,1,99999999);

DROP TABLE IF EXISTS `tbl_shxp_product`;
CREATE TABLE `tbl_shxp_product` (
  `product_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_code` varchar(30) DEFAULT NULL,
  `product_name` varchar(100) DEFAULT NULL,
  `product_price` double DEFAULT '0',
  `product_class` varchar(20) DEFAULT NULL,
  `product_recommend` varchar(5) DEFAULT NULL,
  `product_img_url` varchar(300) DEFAULT NULL,
  `state` varchar(5) DEFAULT '1',
  `version` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`product_id`)
);