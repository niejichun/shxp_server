/** 预定表 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_shxp_reserve', {
    reserve_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    reserve_name: {//名称
        type: db.STRING(100),
        allowNull: true
    },
    reserve_phone: {//电话
        type: db.STRING(100),
        allowNull: true
    },
    reserve_remark: {//留言
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    reserve_date: {//日期
        type: db.DATE,
        allowNull: true
    },
    reserve_seat_class: {//预定的桌台类型
        type: db.STRING(5),
        allowNull: true
    }
});
