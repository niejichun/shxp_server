/** WMS库存查询**/
const db = require('../../util/db');
module.exports = db.defineModel('tbl_erc_stockmap', {
    stockmap_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {//门店id
        type: db.IDNO,
        allowNull: true
    },
    warehouse_id: {//仓库id
        type: db.IDNO,
        allowNull: false
    },
    materiel_id: {//物料id
        type: db.IDNO,
        allowNull: false
    },
    current_amount: {//当前库存数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    available_amount: {//可用数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    frozen_amount: {//出库冻结数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    safe_amount: {//安全库存
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    order_id: {//销售订单号
        type: db.ID,
        allowNull: true
    },
    is_idle_stock: { //是否是闲置库存
        type: db.STRING(4),
        defaultValue: '0',
        allowNull: true
    },
    warehouse_zone_id: {//仓区的id
        type: db.IDNO,
        allowNull: true
    },
    min_purchase_amount: {//最低采购数量
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    trigger_safe_model: {//是否触发安全模式
        type: db.STRING(4),
        allowNull: true
    },
    trigger_idle_scan: {//是否触发闲置库存扫描
        type: db.STRING(4),
        allowNull: true
    },
    store_price: {
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    }
});
