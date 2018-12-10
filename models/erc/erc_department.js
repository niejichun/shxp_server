/** 部门 **/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_department', {
    department_id: {
        type: db.ID,
        primaryKey: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: false
    },
    department_name: {//部门名称
        type: db.STRING(50),
        allowNull: true
    },
    p_department_id: {//上级部门id
        type: db.ID,
        allowNull: true
    },
    department_level: {//管理架构层级
        type: db.STRING(4),
        allowNull: true
    },
    department_plan_num: {//部门编制（部门规划人数）
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    department_state: {//部门启用或停用
        type: db.STRING(8),
        allowNull: true
    },
    department_type: {//类型
        type: db.STRING(10),
        allowNull: true
    }
});
