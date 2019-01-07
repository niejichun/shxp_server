/** 微信用户 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_shxp_wechatuser', {
    wechatuser_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: db.ID,
        allowNull: true
    },
    wechat_open_id: {
        type: db.ID,
        allowNull: true
    },
    wechat_nickname: {
        type: db.STRING(20),
        defaultValue: '',
        allowNull: true
    }
});
