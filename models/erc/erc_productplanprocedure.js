/** 产品表*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_productplanprocedure', {
    product_procedure_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    product_plan_id: {
        type: db.IDNO,
        allowNull: false
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: false
    },
    procedure_id: {
        type: db.IDNO,
        allowNull: false
    },
    rlt_materiel_code: {
        type: db.ID,
        allowNull: true
    },
    priority: {
        type: db.IDNO,
        allowNull: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    }
});
