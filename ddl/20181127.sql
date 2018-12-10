SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;


/*
  your backup sql
*/


/*
  qm start
*/

ALTER TABLE `tbl_erc_financerecord` ADD COLUMN `org_type` varchar(10) DEFAULT '' AFTER `organization`;
ALTER TABLE `tbl_erc_financerecorditem` ADD COLUMN `org_type` varchar(10) DEFAULT '' AFTER `organization`;

call Pro_AddMenu('财务管理', '记账凭证', '/erc/cashiermanage/ERCRecordingVoucherControl', 'ERCRECORDINGVOUCHERCONTROL');
call Pro_AddMenu('财务管理', '会计科目列表', '/erc/cashiermanage/ERCAccountingListControl', 'ERCACCOUNTINGLISTCONTROL');

/*
  add your ddl
*/
