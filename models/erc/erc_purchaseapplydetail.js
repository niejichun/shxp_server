const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_purchaseapplydetail', {
    purchaseapplydetail_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    purchaseapply_id: {//采购申请单ID
        type: db.STRING(30),
        allowNull: true
    },
    order_id: {//采购申请单ID
        type: db.STRING(30),
        allowNull: true
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: false
    },
    apply_number: {//申请数量
        type: db.INTEGER,
        allowNull: true
    },
    delivery_time: { //预计到货时间
        type: db.DATE,
        allowNull: true
    },
    remark: { //备注
        type: db.STRING(100),
        allowNull: true
    },
    room_id: {//空间
        type: db.IDNO,
        allowNull: true
    },
    apply_money: {//金额
        type: db.INTEGER,
        allowNull: true
    },
    project_space_id: {//项目编号
        type: db.STRING(30),
        allowNull: true
    }
});
