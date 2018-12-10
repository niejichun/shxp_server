/** 品质检验单*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_qualitycheck', {
    qualitycheck_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    purchaseorder_id: {//采购单ID
        type: db.ID,
        allowNull: false
    },
    user_id: {//质检人
        type: db.ID,
        allowNull: false
    },
    domain_id: {
        type: db.IDNO,
        allowNull: false
    },
    supplier_id: {//供应商id
        type: db.IDNO,
        allowNull: false
    }
});
