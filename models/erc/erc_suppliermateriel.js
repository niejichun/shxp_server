const db = require('../../util/db');
/**供应商物料表**/
module.exports = db.defineModel('tbl_erc_suppliermateriel', {
    suppliermateriel_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    supplier_id: {  //供应商编号
        type: db.INTEGER,
        allowNull: true
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: false
    },
    suppliermateriel_mincount: {  //最低采购数量
        type: db.INTEGER,
        allowNull: true
    },
    suppliermateriel_purchaseprice: {  //不含税采购价
        type: db.DOUBLE,
        allowNull: true
    },
    suppliermateriel_purchasepricetax: {  //含税采购价
        type: db.DOUBLE,
        allowNull: true
    },
    suppliermateriel_deliveryday: {  //最短送货时间
        type: db.INTEGER,
        allowNull: true
    },
    suppliermateriel_tax: {  //税率
        type: db.DOUBLE,
        allowNull: true
    },
    suppliermateriel_effectivedata: {  //有效日期
        type: db.DATE,
        allowNull: true
    },
    suppliermateriel_expirydate: {  //失效日期
        type: db.DATE,
        allowNull: true
    },
    suppliermateriel_priceeffective: {//价格生效依据
        type: db.STRING(4),
        allowNull: true
    }
});
