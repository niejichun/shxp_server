/** 产品表*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_productdevice', {
    productdevice_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    fixedassetsdetail_id: {//固定资产ID
        type: db.IDNO,
        allowNull: false
    },
    day_capacity: {//日产能
        type: db.IDNO,
        allowNull: false,
        defaultValue: 0
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    }
});
