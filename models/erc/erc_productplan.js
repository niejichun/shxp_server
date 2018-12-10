/** 产品表*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_productplan', {
    product_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    design_number: {
        type: db.IDNO,
        defaultValue: 0,
        allowNull: true
    },
    order_id: {
        type: db.ID,
        allowNull: true
    },
    workshop_id: {
        type: db.ID,
        allowNull: true
    },
    valid_state: {
        type: db.IDNO,
        defaultValue: 0,
        allowNull: false
    }
});
