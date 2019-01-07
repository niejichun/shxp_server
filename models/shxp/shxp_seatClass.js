/** 桌台类型 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_shxp_seatClass', {
    seatClass_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    seatClass_name: {//名称
        type: db.STRING(100),
        allowNull: true
    },
    seatClass_title: {//标题
        type: db.STRING(100),
        allowNull: true
    },
    seatClass_price: {//预定单价
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    seatClass_img_url: {//座位照片存放路径
        type: db.STRING(300),
        allowNull: true
    },
    seatClass_remark: {//描述
        type: db.STRING(300),
        allowNull: true
    },
    seatClass_sum: {//总台数
        type: db.INTEGER,
        allowNull: true
    },
    seatClass_have: {//已预约
        type: db.INTEGER,
        allowNull: true
    },
    seatClass_no: {//未预约
        type: db.INTEGER,
        allowNull: true
    },
    seatClass_location: {//位置
        type: db.STRING(5),
        allowNull: true
    },
});
