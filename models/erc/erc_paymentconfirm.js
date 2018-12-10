/** 待摊资产 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_paymentconfirm', {
    paymentconfirm_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    paymentconfirm_name: {//付款类型名称
        type: db.STRING(100),
        allowNull: true
    },
    paymentconfirm_source_code: {//资金支出或交通接待单号
        type: db.STRING(100),
        allowNull: true
    },
    paymentconfirm_money: {//付款金额
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    paymentconfirm_expend_user: {//支出对象名称
        type: db.STRING(50),
        allowNull: true
    },
    paymentconfirm_declarant: {//申报人
        type: db.STRING(50),
        allowNull: true
    },
    paymentconfirm_declarant_time: {//申报时间
        type: db.DATE,
        allowNull: true
    },
    paymentconfirm_state: {//付款确认状态
        type: db.INTEGER,
        allowNull: true
    },
    paymentconfirm_examine: {//确认人
        type: db.STRING(100),
        allowNull: true
    },
    paymentconfirm_examine_time: {//确认时间
        type: db.DATE,
        allowNull: true
    }
});
