SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;


/*
  your backup sql
*/

/* nie */

call Pro_AddMenu('生产计划管理', '生产主计划列表','/erc/productionmanage/ERCProductPlanExecuteControl','ERCPRODUCTPLANEXECUTECONTROL');
call Pro_AddMenu('出纳管理', '资金费用汇总表','/erc/cashiermanage/ERCSpecialExpenseGatheringSumControl','ERCSPECIALEXPENSEGATHERINGSUMCONTROL');
call Pro_AddMenu('出纳管理', '资金费用记账凭证','/erc/cashiermanage/ERCRecordingVoucherSCControl','ERCRECORDINGVOUCHERSCCONTROL');
call Pro_AddMenu('基础数据维护', '公司资料维护','/erc/baseconfig/ERCCompanyControl','ERCCOMPANYCONTROL');

ALTER TABLE `tbl_erc_productionprocedure` ADD COLUMN `procedure_coefficient` DOUBLE AFTER `domain_id`;
ALTER TABLE `tbl_erc_productivetask` ADD COLUMN `taskdesign_price` DOUBLE AFTER `productivetask_state`;
ALTER TABLE `tbl_erc_fixedassetscheckdetail` ADD COLUMN `original_value` DOUBLE AFTER `fixedassetspurchdetail_id`;
ALTER TABLE `tbl_erc_fixedassetscheckdetail` ADD COLUMN `monthly_depreciation` DOUBLE AFTER `original_value`;
ALTER TABLE `tbl_erc_taskallotuser` ADD COLUMN `islastpost` DOUBLE DEFAULT '0' AFTER `customtaskallot_id`;
ALTER TABLE `tbl_erc_department` ADD COLUMN `department_type` varchar(10) DEFAULT '' AFTER `department_state`;
ALTER TABLE `tbl_erc_specialexpense` ADD COLUMN `payment_method` varchar(10) DEFAULT null AFTER `s_capital_cost_type`;
ALTER TABLE `tbl_erc_specialexpense` ADD COLUMN `monetary_fund_type` varchar(10) DEFAULT null AFTER `payment_method`;
ALTER TABLE `tbl_erc_specialexpense` ADD COLUMN `bank_account` varchar(100) DEFAULT null AFTER `monetary_fund_type`;
ALTER TABLE `tbl_erc_cashiergathering` ADD COLUMN `payment_method` varchar(10) DEFAULT null AFTER `cashiergathering_refuse_remark`;
ALTER TABLE `tbl_erc_cashiergathering` ADD COLUMN `monetary_fund_type` varchar(10) DEFAULT null AFTER `payment_method`;
ALTER TABLE `tbl_erc_cashiergathering` ADD COLUMN `bank_account` varchar(100) DEFAULT null AFTER `monetary_fund_type`;
insert into tbl_erc_basetype value (2,'HBZJLX','货币资金类型',1,1,'2018-07-31 15:38:31','2018-07-31 15:38:31')
insert into tbl_erc_basetype value (3,'JZBWB','记账本位币',1,1,'2018-07-31 15:38:31','2018-07-31 15:38:31')
insert into tbl_erc_basetype value (4,'WB','外币',1,1,'2018-07-31 15:38:31','2018-07-31 15:38:31')

insert into seqmysql values ('SpecialExpenseSumSeq',1,1,99999999);
insert into seqmysql values ('CashiergatheringSumSeq',1,1,99999999);
insert into seqmysql values ('RecordingVoucherSSeq',1,1,99999999);
insert into seqmysql values ('RecordingVoucherCSeq',1,1,99999999);

DROP TABLE IF EXISTS `tbl_erc_product_plan_execute`;
CREATE TABLE `tbl_erc_product_plan_execute` (
  `product_plan_execute_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `m1_materiel_code` varchar(255) DEFAULT NULL,
  `m1_materiel_name` varchar(255) DEFAULT NULL,
  `m1_materiel_id` varchar(255) DEFAULT NULL,
  `m2_materiel_code` varchar(255) DEFAULT NULL,
  `m2_materiel_name` varchar(255) DEFAULT NULL,
  `m2_materiel_id` varchar(255) DEFAULT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `productivetask_code` varchar(255) DEFAULT NULL,
  `productivetask_state` varchar(255) DEFAULT NULL,
  `workshop_id` varchar(255) DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `product_level` varchar(255) DEFAULT NULL,
  `procedure_name` varchar(255) DEFAULT NULL,
  `priority` varchar(255) DEFAULT NULL,
  `productivetask_id` varchar(255) DEFAULT NULL,
  `product_id` varchar(255) DEFAULT NULL,
  `taskdesign_number` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `begin_date` varchar(255) DEFAULT NULL,
  `UUID` varchar(255) DEFAULT NULL,
  `prod_end_date` varchar(255) DEFAULT NULL,
  `state` varchar(5) DEFAULT '1',
  `version` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`product_plan_execute_id`)
);

DROP TABLE IF EXISTS `tbl_erc_cashiergatheringsum`;
CREATE TABLE `tbl_erc_cashiergatheringsum` (
  `cashiergatheringsum_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `domain_id` bigint(20) DEFAULT NULL,
  `cashiergatheringsum_code` varchar(100) DEFAULT NULL,
  `cashiergatheringsum_depart_id` varchar(100) DEFAULT NULL,
  `cashiergatheringsum_time` varchar(100) DEFAULT NULL,
  `cashiergatheringsum_content` varchar(100) DEFAULT NULL,
  `cashiergatheringsum_amount` varchar(100) DEFAULT NULL,
  `state` varchar(5) DEFAULT '1',
  `version` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`cashiergatheringsum_id`)
);

DROP TABLE IF EXISTS `tbl_erc_specialexpensesum`;
CREATE TABLE `tbl_erc_specialexpensesum` (
  `s_expense_sum_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `domain_id` bigint(20) DEFAULT NULL,
  `s_expense_sum_code` varchar(100) DEFAULT NULL,
  `s_expense_sum_depart_id` varchar(100) DEFAULT NULL,
  `s_expense_sum_time` varchar(100) DEFAULT NULL,
  `s_expense_sum_content` varchar(100) DEFAULT NULL,
  `s_expense_sum_amount` varchar(100) DEFAULT NULL,
  `s_no_invoice_sum_fee` double DEFAULT '0',
  `s_have_invoice_sum_fee` double DEFAULT '0',
  `s_capital_cost_sum_type` int(11) DEFAULT NULL,
  `state` varchar(5) DEFAULT '1',
  `version` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`s_expense_sum_id`)
);

DROP TABLE IF EXISTS `tbl_erc_recordingvouchersc`;
CREATE TABLE `tbl_erc_recordingvouchersc` (
  `recordingvouchersc_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `recordingvouchersc_code` varchar(30) NOT NULL,
  `domain_id` bigint(20) NOT NULL,
  `recordingvouchersc_depart_id` varchar(100) DEFAULT NULL,
  `recordingvouchersc_time` varchar(100) DEFAULT NULL,
  `recordingvouchersc_count` int(11) DEFAULT NULL,
  `recordingvouchersc_type` varchar(5) DEFAULT NULL,
  `s_recordingvouchersc_type` int(11) DEFAULT NULL,
  `state` varchar(5) DEFAULT '1',
  `version` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`recordingvouchersc_id`)
);
/*end nie */
/*
  qm start
*/

ALTER TABLE tbl_erc_stockmap ADD COLUMN store_price double NUll DEFAULT '0' AFTER `trigger_idle_scan`;
ALTER TABLE tbl_erc_stockitem ADD COLUMN store_price double NUll DEFAULT '0' AFTER `item_amount`;

/*
  add your ddl
*/
