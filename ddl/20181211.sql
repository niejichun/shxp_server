SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;


insert into tbl_common_systemmenu (systemmenu_name,node_type,parent_id,version,created_at,updated_at) VALUES ('小程序基础信息维护','00','16',1,NOW(),NOW());
call Pro_AddMenu('小程序基础信息维护', '菜单管理','/erc/baseconfig/SHXPProductControl','SHXPPRODUCTCONTROL');




