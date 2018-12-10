
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCInventoryDetailControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const moment = require('moment');
const sequelize = model.sequelize;
const tb_erc_inventoryaccount = model.erc_inventoryaccount;

exports.ERCInventoryDetailControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'search') {
        searchAct(req, res);
    } else {
        common.sendError(res, 'common_01')
    }
};
//初始化数据
let initAct = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body);
        let returnData = {
            inventoryOperateType: GLBConfig.INVENTORYOPERATETYPE,
            unitInfo: GLBConfig.UNITINFO//单位
        };
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//库存明细列表
let searchAct = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        let queryStr = `select ia.*,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit from tbl_erc_inventoryaccount ia
        left join tbl_erc_materiel m on ia.materiel_id = m.materiel_id  
        where ia.state = ? and m.state = ? and ia.domain_id = ? `;
        let replacements = [GLBConfig.ENABLE, GLBConfig.ENABLE, user.domain_id];
        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ? or ia.company_name like ?)';
            let search_text = '%' + doc.search_text + '%';
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
        }
        if (doc.bill_code) {
            queryStr += ` and ia.bill_code = ? `;
            replacements.push(doc.bill_code);
        }
        if (doc.order_id) {
            queryStr += ` and ia.order_id = ? `;
            replacements.push(doc.order_id);
        }
        if (doc.created_at_start) {
            queryStr += ` and ia.created_at >= ? `;
            replacements.push(doc.created_at_start + ` 00:00:00`);
        }
        if (doc.created_at_end) {
            queryStr += ` and ia.created_at <= ? `;
            replacements.push(doc.created_at_end + ` 23:59:59`);
        }

        queryStr += ' order by ia.created_at desc';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];

        for (let r of result.data) {
            let rj = JSON.parse(JSON.stringify(r));
            rj.create_date = r.created_at.Format("yyyy-MM-dd");
            returnData.rows.push(rj);
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
