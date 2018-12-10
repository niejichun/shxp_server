/** 产品表*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_financerecorditem', {
    financerecorditem_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: true
    },
    wms_type: {//进销存类型
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    manage_type: {//出入库类型
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    organization: {//对应单位
        type: db.STRING(64),
        allowNull: true
    },
    org_type: {//对应类型
        type: db.STRING(10),
        allowNull: true
    },
    content: {//对应内容
        type: db.STRING(64),
        allowNull: true
    },
    store_amount: {//数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    store_price: {//单价
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    }
});
