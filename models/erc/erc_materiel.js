/** 物料表*/
const db = require('../../util/db');
const GLBConfig = require('../../util/GLBConfig');

module.exports = db.defineModel('tbl_erc_materiel', {
    materiel_id: {
        type: db.IDNO,
        autoIncrement: true,
        primaryKey: true
    },
    domain_id: {
        type: db.IDNO,
        allowNull: true
    },
    materiel_code: {//物料编码
        type: db.STRING(20),
        unique: true
    },
    materiel_name: {//物料名称
        type: db.STRING(100),
        allowNull: true
    },
    materiel_format: {//规格型号
        type: db.STRING(200),
        allowNull: true
    },
    materiel_formatcount: {//算料规格
        type: db.STRING(50),
        allowNull: true
    },
    materiel_formatunit: {//规格单位
        type: db.STRING(200),
        allowNull: true
    },
    materiel_unit: {//计算单位
        type: db.STRING(5),
        allowNull: true
    },
    materiel_type: {//物料分类
        type: db.STRING(20),
        allowNull: true
    },
    materiel_batch: {
        type: db.STRING(20),
        allowNull: true
    },
    materiel_describe: {//描述
        type: db.STRING(200),
        allowNull: true
    },
    materiel_cost: {//采购金额
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    materiel_state: {//使用状态 MATEUSESTATE
        type: db.STRING(5),
        allowNull: true
    },
    materiel_source: { //物料来源
        type: db.STRING(12),
        allowNull: true
    },
    materiel_sale: { //销售价格
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    materiel_award_cost: { //发包价格
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    materiel_barcode: { //物料条形码
        type: db.STRING(200),
        allowNull: true
    },
    materiel_manage: { //物料管理模式    MATERIELMANAGE
        type: db.STRING(12),
        allowNull: true
    },
    materiel_source_kind: { //来源分类  MATERIELSOURCEKIND
        type: db.STRING(12),
        allowNull: true
    },
    materiel_tax: {  //税率
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    materiel_procedure: {  //工序
        type: db.STRING(12),
        allowNull: true
    },
    materiel_amto: {  //制品分类 MATERIELAMTO
        type: db.INTEGER,
        allowNull: true
    },
    materiel_loss: {  //损耗率
        type: db.DOUBLE,
        defaultValue: 0,
        allowNull: true
    },
    materiel_review_state: {//物料状态
        type: db.STRING(5),
        allowNull: true
    },
    materiel_formula: {//算料公式  FORMULA
        type: db.STRING(50),
        allowNull: true
    },
    materiel_x: { //长
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    materiel_y: { //宽
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    materiel_z: { //厚或高
        type: db.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    materiel_conversion: { //计算单位转换 MATERIELCONVERSION
        type: db.STRING(5),
        allowNull: true
    },
    materiel_intpart: { //是否取整 MATERIELINTPART
        type: db.STRING(5),
        allowNull: true
    },
    materiel_state_management: {//状态管理
        type: db.STRING(4),
        allowNull: true
    },
    materiel_procurement_type: {//采购类型
        type: db.STRING(4),
        allowNull: true
    }
});
