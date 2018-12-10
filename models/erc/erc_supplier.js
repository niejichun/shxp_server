const db = require('../../util/db');
/**供应商**/
module.exports = db.defineModel('tbl_erc_supplier', {
    supplier_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    supplier: { //供应商编号
        type: db.STRING(100),
        unique: true
    },
    supplier_name: {
        type: db.STRING(50),
        defaultValue: '',
        allowNull: false
    },
    supplier_short: { //简称
        type: db.STRING(20),
        defaultValue: '',
        allowNull: false
    },
    supplier_province: {
        type: db.STRING(20),
        allowNull: true
    },
    supplier_city: {
        type: db.STRING(20),
        allowNull: true
    },
    supplier_district: {
        type: db.STRING(20),
        allowNull: true
    },
    supplier_address: { //地址
        type: db.STRING(100),
        defaultValue: '',
        allowNull: false
    },
    supplier_fax: { //传真
        type: db.STRING(100),
        defaultValue: '',
        allowNull: false
    },
    supplier_contact: { //联系人
        type: db.STRING(100),
        defaultValue: '',
        allowNull: false
    },
    supplier_phone: { //联系方式
        type: db.STRING(100),
        defaultValue: '',
        allowNull: false
    },
    supplier_description: { //经营范围
        type: db.STRING(200),
        defaultValue: '',
        allowNull: false
    },
    supplier_proportion: { //采购比率
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: false
    },
    supplier_remarks: { //备注
        type: db.STRING(500),
        defaultValue: '',
        allowNull: false
    }
});
