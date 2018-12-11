/** 菜单管理 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_shxp_product', {
    product_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    product_code: {//编号
        type: db.STRING(30),
        allowNull: true
    },
    product_name: {//名称
        type: db.STRING(100),
        allowNull: true
    },
    product_price: {//单价
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    procust_class: {//类别
        type: db.STRING(20),
        allowNull: true
    },
    procust_class: {//类别
        type: db.STRING(20),
        allowNull: true
    },
    procust_recommend: {//是否推荐菜
        type: db.STRING(5),
        allowNull: true
    }

});
