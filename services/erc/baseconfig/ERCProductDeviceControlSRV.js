const moment = require('moment');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ProduceControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');

const FDomain = require('../../../bl/common/FunctionDomainBL');

const sequelize = model.sequelize;
const tb_common_apidomain = model.common_apidomain;
const tb_productionprocedure = model.erc_productionprocedure;
const tb_productdevice = model.erc_productdevice;

exports.ERCProductDeviceControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'initProductDevice') {
        initProductDevice(req, res)
    } else if (method === 'searchProductDevice') {
        searchProductDevice(req, res)
    } else if (method === 'addProductDevice') {
        addProductDevice(req, res)
    } else if (method === 'modifyProductDevice') {
        modifyProductDevice(req, res)
    } else if (method === 'deleteProductDevice') {
        deleteProductDevice(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
};

async function getProcedureType(req, domain_id) {
    let queryStr =
        `select t.*, rt.basetype_code, rt.basetype_name
         from tbl_erc_basetypedetail t
         left join tbl_erc_basetype rt
         on t.basetype_id = rt.basetype_id
         where t.state = 1
         and t.domain_id = ?`;

    const replacements = [domain_id];
    queryStr += ' order by t.created_at desc';
    const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    return result.data;
}

async function getFixedAssets(req, domain_id) {
    let queryStr =
        `select
         fad.fixedassetscheckdetail_id, fad.fixedassets_no, fad.fixedassets_name, fad.fixedassets_model, fad.fixedassets_unit
         , fac.fixedassetscheck_no
         from tbl_erc_fixedassetscheckdetail fad
         left join tbl_erc_fixedassetscheck fac
         on fad.fixedassetscheck_id = fac.fixedassetscheck_id
         where true
         and fac.check_state = 3
         and fac.state = 1
         and fad.state = 1
         and fac.domain_id = ?`;

    queryStr += ' order by fac.created_at desc';
    const replacements = [domain_id];
    const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    return result.data;
}

async function initProductDevice(req, res) {
    const returnData = {};
    const user = req.user;

    try {
        await FDomain.getDomainListInit(req, returnData);
        // returnData.domainTypeInfo = GLBConfig.DOMAINTYPE; //单位
        // returnData.statusInfo = GLBConfig.STATUSINFO; //生效状态
        // returnData.procedureInfo = await getProcedureType(req, user.domain_id);
        // returnData.procedureTypeInfo = returnData.procedureInfo.map(item => {
        //     return {
        //         id: item.basetypedetail_id,
        //         text: item.typedetail_name
        //     }
        // });
        returnData.fixedAssetsInfo = await getFixedAssets(req, user.domain_id);
        returnData.deviceInfo = returnData.fixedAssetsInfo.map(item => {
            return {
                id: item.fixedassetscheckdetail_id,
                text: `${item.fixedassets_no} - ${item.fixedassets_name}`
            }
        });

        common.sendData(res, returnData)
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function searchProductDevice(req, res) {
    const body = req.body;
    const user = req.user;
    const returnData = {};

    try {
        let queryStr =
            `select
                *
                from tbl_erc_productdevice pd
                left join tbl_erc_fixedassetscheckdetail fac
                on pd.fixedassetsdetail_id = fac.fixedassetscheckdetail_id
                where true
                and pd.state = 1
                and pd.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.search_text) {
            queryStr += ' and (pp.procedure_code like ? or pp.procedure_name like ?)';
            replacements.push('%' + body.search_text + '%');
            replacements.push('%' + body.search_text + '%');
        }

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function addProductDevice(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const productDeviceResult = await tb_productdevice.findOne({
            where: {
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE,
                fixedassetsdetail_id: body.fixedassetsdetail_id
            }
        });

        if (!productDeviceResult) {
            const addResult = await tb_productdevice.create({
                domain_id: user.domain_id,
                fixedassetsdetail_id: body.fixedassetsdetail_id,
                day_capacity: body.day_capacity
            });
            common.sendData(res, addResult);
        } else {
            common.sendError(res, 'productdevice_01');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function modifyProductDevice(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const productDeviceResult = await tb_productdevice.findOne({
            where: {
                productdevice_id: body.old.productdevice_id,
                domain_id: user.domain_id
            }
        });

        if (productDeviceResult) {
            productDeviceResult.day_capacity = body.new.day_capacity;
            await productDeviceResult.save();
            common.sendData(res, productDeviceResult);
        } else {
            common.sendError(res, 'productdevice_01');
        }
    } catch (error) {
        return common.sendFault(res, error);
    }
}

async function deleteProductDevice(req, res) {
    try {
        const body = req.body;
        const user = req.user;

        let deleteResult = await tb_productdevice.findOne({
            where: {
                productdevice_id: body.productdevice_id,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE
            }
        });

        if (deleteResult) {
            deleteResult.state = GLBConfig.DISABLE;
            await deleteResult.save();
            common.sendData(res);
        } else {
            common.sendError(res, 'productdevice_01');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}
