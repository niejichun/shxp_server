/* 企业客户表 */
const db = require('../../util/db');

module.exports = db.defineModel('tbl_erc_corporateclients', {
    corporateclients_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    corporateclients_no: {//企业客户编号
        type: db.ID,
        allowNull: false
    },
    domain_id: {
        type: db.IDNO,
        allowNull: false
    },
    corporateclients_name: {//客户名称
        type: db.STRING(100),
        allowNull: true
    },
    corporateclients_type: {//客户类型
        type: db.STRING(5),
        allowNull: true
    },
    corporateclients_province: {//省
        type: db.STRING(20),
        defaultValue: '',
        allowNull: true
    },
    corporateclients_city: {//市/县
        type: db.STRING(20),
        defaultValue: '',
        allowNull: true
    },
    corporateclients_district: {//区
        type: db.STRING(20),
        defaultValue: '',
        allowNull: true
    },
    corporateclients_address: {//客户地址
        type: db.STRING(100),
        allowNull: true
    },
    corporateclients_mobile_phone: {//客户电话
        type: db.STRING(100),
        allowNull: true
    },
    corporateclients_contact: {//联系人姓名
        type: db.STRING(100),
        allowNull: true
    },
    corporateclients_phone: {//联系人电话
        type: db.STRING(100),
        allowNull: true
    },
    corporateclients_fax: {   //传真
        type: db.STRING(100),
        allowNull: true
    },
    business_registration_no: {    //工商登记号
        type: db.STRING(100),
        allowNull: true
    },
    business_tax: {  //适用税率
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    corporateclients_contact_qq: {//联系人qq
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    corporateclients_contact_wechat: {//联系人微信
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    legalperson_contact: {//法人姓名
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    legalperson_phone: {//法人电话
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    legalperson_qq: {//法人qq
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    legalperson_wechat: {//法人微信
        type: db.STRING(100),
        defaultValue: '',
        allowNull: true
    },
    month_settlement: {//月结天数
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    settlement_way: {//结算方式
        type: db.STRING(5),
        allowNull: true
    },
    creditline_money: {  //信用额度
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    creditline_use: {  //已使用的信用额度
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    creditline_advance: {  //预付款
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    }
});
