/**收发存明细**/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');
module.exports = db.defineModel('tbl_erc_inventoryaccount', {
    inventoryaccount_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {//机构id
        type: db.IDNO,
        allowNull: true
    },
    bill_code: {//单据编号
        type: db.ID,
        allowNull: false
    },
    order_id: {//源单编号
        type: db.STRING(30),
        allowNull: false
    },
    p_order_id: {//采购单编号
        type: db.STRING(30),
        allowNull: true
    },
    warehouse_id: {//仓库ID
        type: db.IDNO,
        allowNull: false
    },
    warehouse_zone_id: {//仓区
        type: db.IDNO,
        allowNull: true
    },
    materiel_id: {//物料ID
        type: db.IDNO,
        allowNull: false
    },
    account_operate_amount: {//本次操作的数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    remain_amount: {//结存数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    account_operate_type: {//出入库类型(3其他入库)
        type: db.STRING(4),
        allowNull: true
    },
    account_note: {//备注
        type: db.STRING(100),
        allowNull: true
    },
    company_name: {//对应单位
        type: db.STRING(100),
        allowNull: true
    }
});