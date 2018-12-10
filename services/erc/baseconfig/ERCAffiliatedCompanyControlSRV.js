const fs = require('fs');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('GroupControlSRV');
const model = require('../../../model');

const FDomain = require('../../../bl/common/FunctionDomainBL');
// tables
const sequelize = model.sequelize;
const tb_common_domain = model.common_domain;
const tb_common_apidomain = model.common_apidomain;

exports.ERCAffiliatedCompanyControlSRVResource = (req, res) => {
    let method = req.query.method
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'search') {
        searchAct(req, res)
    } else if (method === 'close') {
        close(req, res)
    } else if (method === 'open') {
        open(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
};

async function initAct(req, res) {
    let returnData = {},
        user = req.user;

    await FDomain.getDomainListInit(req, returnData);
    returnData.unitInfo = GLBConfig.UNITINFO; //单位

    common.sendData(res, returnData)
}
//查询附属公司列表
async function searchAct(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            replacements = [],
            returnData = {};

        // let queryStr=`select ca.domain_id,ca.follow_domain_id,cd.*
        //         from tbl_common_apidomain ca left join tbl_common_domain cd on ca.domain_id = cd.domain_id
        //         where cd.domain_type = 1`

        let queryStr=`select * from tbl_common_domain where state = 1`

        if (doc.search_text) {
            queryStr += ' and (domain_id like ? or domain_name like ?)';
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
        }

        if (user.domain_id) {
            queryStr += ' and updomain_id = ?';
            replacements.push(user.domain_id);
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.domain_province = r.domain_province + r.domain_city +r.domain_district + r.domain_address
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        return common.sendFault(res, error);
    }
}
//关闭附属公司
async function close(req, res) {
    try {
        let doc = common.docTrim(req.body)
        let user = req.user
        let supplier = await tb_common_apidomain.findOne({
            where: {
                domain_id: doc.domain_id,
                follow_domain_id: doc.follow_domain_id,
            }
        })
        if (supplier) {
            supplier.state = GLBConfig.DISABLE
            await supplier.save();
            common.sendData(res, supplier)
        } else {
            common.sendError(res, 'group_02')
            return
        }
    } catch (error) {
        common.sendFault(res, error)
    }
}
//开启附属公司
async function open(req, res) {
    try {
        let doc = common.docTrim(req.body)
        let user = req.user
        let supplier = await tb_common_apidomain.findOne({
            where: {
                domain_id: doc.domain_id,
                follow_domain_id: doc.follow_domain_id,
            }
        })
        if (supplier) {
            supplier.state = GLBConfig.ENABLE
            await supplier.save();
            common.sendData(res, supplier)
        } else {
            common.sendError(res, 'group_02')
            return
        }
    } catch (error) {
        common.sendFault(res, error)
    }
}


