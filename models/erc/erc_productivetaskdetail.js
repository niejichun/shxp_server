/** 生产任务明细(投料)*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_productivetaskdetail', {
    productivetaskdetail_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    productivetask_id: {
        type: db.IDNO,
        allowNull: true
    },
    materiel_id: {
        type: db.IDNO,
        allowNull: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    taskdetaildesign_number: {   //数量
        type: db.IDNO,
        defaultValue: 0,
        allowNull: true
    },
    taskdetailprd_level: {      //层级
        type: db.IDNO,
        allowNull: true
    }
});
