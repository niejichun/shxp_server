const fs = require('fs');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCSupplierMaterielControl');
const model = require('../../../model');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const moment = require('moment');

// tables
const sequelize = model.sequelize;
const tb_user = model.common_user;
const tb_materiel = model.erc_materiel;
const tb_suppliermateriel = model.erc_suppliermateriel;
const tb_supplier = model.erc_supplier;
const tb_domain = model.common_domain

exports.ERCSupplierMaterielControlResource = (req, res) => {
    let method = req.query.method
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'search') {
        searchAct(req, res)
    } else if (method === 'search_mat') {
        searchMat(req, res)
    } else if (method === 'SupplierMaterielControlSRV_add') {
        addMat(req, res)
    } else if (method === 'delete') {
        deleteAct(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
};

async function initAct(req, res) {
    try {
        let returnData = {};
        returnData.unitInfo = GLBConfig.UNITINFO; //物料单位
        returnData.priceEffective = GLBConfig.PRICEEFFECTIVE;//价格生效依据
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}
//获取供应商物料信息
async function searchAct(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};

        let replacements = [];

        let queryStr = `
            select sm.suppliermateriel_id,sm.suppliermateriel_purchasepricetax,sm.supplier_id,sm.suppliermateriel_effectivedata,sm.suppliermateriel_expirydate,sm.materiel_id,sm.suppliermateriel_mincount,sm.suppliermateriel_purchaseprice,sm.suppliermateriel_deliveryday,sm.suppliermateriel_tax,sm.suppliermateriel_priceeffective,m.materiel_id,m.materiel_code,m.materiel_format,m.materiel_name,m.materiel_unit,m.materiel_type
            from tbl_erc_suppliermateriel sm
            left join tbl_erc_materiel m on sm.materiel_id = m.materiel_id
            where m.state = 1 and sm.state = 1`;

        if (doc.supplier_id) {
            queryStr += ' and sm.supplier_id = ?';
            replacements.push(doc.supplier_id);
        }

        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ? or m.materiel_format like ?)'
            let search_text = '%' + doc.search_text + '%';
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
        }

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        //returnData.rows = result.data;

        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.suppliermateriel_tax = r.suppliermateriel_tax*100 +'%';
            result.suppliermateriel_purchaseprice = r.suppliermateriel_purchaseprice ? r.suppliermateriel_purchaseprice: 0;
            result.suppliermateriel_purchasepricetax = r.suppliermateriel_purchasepricetax ? r.suppliermateriel_purchasepricetax : 0;
            returnData.rows.push(result)
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//获取物料信息
async function searchMat(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let returnData = {};
        let replacements = [];

        let queryStr = 'select * from tbl_erc_materiel where materiel_source in (2,3) and state = 1 and domain_id' + await FDomain.getDomainListStr(req);

        if (doc.domain_id) {
            queryStr += ' and domain_id = ?';
            replacements.push(doc.domain_id);
        }

        if (doc.search_textM) {
            queryStr += ' and (materiel_name like ? or materiel_code like ? or materiel_format like ?)';
            replacements.push('%' + doc.search_textM + '%');
            replacements.push('%' + doc.search_textM + '%');
            replacements.push('%' + doc.search_textM + '%');
        }
        queryStr += ' order by materiel_id';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.suppliermateriel_effectivedata = r.suppliermateriel_effectivedata ? moment(r.suppliermateriel_effectivedata).format("YYYY-MM-DD") : null;
            result.suppliermateriel_expirydate = r.suppliermateriel_expirydate ? moment(r.suppliermateriel_expirydate).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
        return
    }
}

/**订单中的物料列表，信息由模板、订单、物料三者关联而来，关联关系由【生成物料单】操作建立
 * 用户也可在模板的物料单之外添加物料，所添加的物料应从系统已有的物料列表中选择
 **/
async function addMat(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        logger.info(doc.suppliermateriel_mincount)
        logger.info(doc.suppliermateriel_purchaseprice)
        let material = await tb_suppliermateriel.findOne({
            where: {
                materiel_id: doc.materiel_id,
                supplier_id: doc.supplier_id
            }
        });

        if(material){
            common.sendError(res, 'materiel_02');
        }else {
            let addOM = await tb_suppliermateriel.create({
                supplier_id:doc.supplier_id,
                materiel_id:doc.materiel_id,
                suppliermateriel_deliveryday:doc.suppliermateriel_deliveryday,
                suppliermateriel_tax:doc.suppliermateriel_tax/100,
                suppliermateriel_effectivedata:doc.suppliermateriel_effectivedata,
                suppliermateriel_expirydate:doc.suppliermateriel_expirydate,
                suppliermateriel_mincount:doc.suppliermateriel_mincount,
                suppliermateriel_purchaseprice:doc.suppliermateriel_purchaseprice,
                suppliermateriel_purchasepricetax: doc.suppliermateriel_purchaseprice*(1+doc.suppliermateriel_tax/100),
                suppliermateriel_priceeffective: doc.suppliermateriel_priceeffective
            });
            let retData = JSON.parse(JSON.stringify(addOM));
            common.sendData(res, retData);
        }
    } catch (error) {
        common.sendFault(res, error);
    }
};

/**
 * 删除供应商物料信息
 */
let deleteAct = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let delTemp = await tb_suppliermateriel.findOne({
            where: {
                suppliermateriel_id: doc.suppliermateriel_id,
                state: GLBConfig.ENABLE
            }
        });

        if (delTemp) {
            delTemp.state = GLBConfig.DISABLE;
            delTemp.materiel_id = GLBConfig.DISABLE;
            await delTemp.save();

            return common.sendData(res);
        } else {
            return common.sendError(res, 'templateConstruction_01');

        }
    } catch (error) {
        return common.sendFault(res, error);
    }
};
