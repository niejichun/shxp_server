/** 记账凭证（资金支出S，客户收款C） **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_recordingvouchersc', {
    recordingvouchersc_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    recordingvouchersc_code: {//记账凭证单号
        type: db.ID,
        allowNull: false
    },
    domain_id: {//机构id
        type: db.IDNO,
        allowNull: false
    },
    recordingvouchersc_depart_id: {//部门Id
        type: db.STRING(100),
        allowNull: true
    },
    recordingvouchersc_time: {//业务日期
        type: db.STRING(100),
        allowNull: true
    },
    recordingvouchersc_count: {//对应明细数
        type: db.INTEGER,
        allowNull: true
    },
    recordingvouchersc_type: {//区分   0资金支出，1客户收款
        type: db.STRING(5),
        allowNull: true
    },
    s_recordingvouchersc_type:{ //资金支出的付款类型
        type: db.INTEGER,
        allowNull: true
    },
});
