
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCAmortizeDetailControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');

const moment = require('moment');
const sequelize = model.sequelize;

const tb_financerecord = model.erc_financerecord;

exports.ERCMaterielSRControlResource = async (req, res) => {
    let method = req.query.method;
    if (method==='initMaterielData'){
        await initMaterielData(req, res);
    } else if (method==='genMaterielCollectionData'){
        await genMaterielCollectionData(req, res);
    } else if (method==='getMaterielCollection'){
        await getMaterielCollection(req, res);
    } else if (method==='getMaterielBillItem'){
        await getMaterielBillItem(req, res);
    } else if (method==='getRecordingVoucherCollection'){
        await getRecordingVoucherCollection(req, res);
    } else if (method==='getRecordingVoucherDetail'){
        await getRecordingVoucherDetail(req, res);
    } else {
        common.sendError(res, 'common_01')
    }
};

async function initMaterielData(req, res){
    try {
        const returnData = {};
        returnData.unitInfo = GLBConfig.UNITINFO;
        returnData.materielInfo = GLBConfig.MATERIELTYPE;
        returnData.stateManagement = GLBConfig.MATERIELSTATEMANAGEMENT;
        returnData.departType = GLBConfig.DEPARTTYPE;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function genMaterielCollectionData(req, res) {
    const user = req.user;
    const body = req.body;

    try {
        const returnData = {};
        const queryStr =
            `select
                fri.organization, fri.org_type, fri.wms_type, fri.manage_type, fri.domain_id
                , date_format(fri.created_at, '%Y-%m-%d') as bill_date
                , sum(fri.store_price) as total_price
                , sum(fri.store_amount) as total_amount
                from tbl_erc_financerecorditem fri
                where true
                and to_days(fri.created_at) = to_days(?)
                group by date_format(fri.created_at, '%Y-%m-%d'), fri.organization, fri.org_type, fri.wms_type, fri.manage_type, fri.domain_id`;

        const replacements = [body.bill_date];
        const result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);

        const dataArray = result.data;
        for (const { bill_date, domain_id, organization, org_type, total_price, total_amount, wms_type, manage_type } of dataArray) {
            const financeRecord = await tb_financerecord.findOne({
                where: {
                    domain_id,
                    bill_date,
                    organization,
                    org_type,
                    wms_type,
                    manage_type
                }
            });

            if (financeRecord) {
                financeRecord.total_price = total_price;
                financeRecord.total_amount = total_amount;
                await financeRecord.save();
            } else {
                await tb_financerecord.create({
                    financerecord_code: await Sequence.genFinanceRecordMaterielID(user),
                    domain_id,
                    bill_date,
                    organization,
                    org_type,
                    wms_type,
                    manage_type,
                    total_price,
                    total_amount
                });
            }
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function getMaterielCollection(req, res) {
    const user = req.user;
    const body = req.body;

    try {
        const returnData = {};
        let queryStr =
            `select
                fr.financerecord_id, fr.financerecord_code, fr.bill_date, fr.organization, fr.org_type, fr.wms_type, fr.manage_type, fr.total_price
                from tbl_erc_financerecord fr
                where true
                and domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.financerecord_code) {
            queryStr += ' and fr.financerecord_code = ?';
            replacements.push(body.financerecord_code)
        }

        if (body.wms_type) {
            queryStr += ' and fr.wms_type = ?';
            replacements.push(body.wms_type)
        }

        if (body.manage_type) {
            queryStr += ' and fr.manage_type = ?';
            replacements.push(body.manage_type)
        }

        if (body.search_text) {
            queryStr += ' and fr.financerecord_code like ?';
            replacements.push(`%${body.search_text}%`);
        }

        queryStr += ` order by bill_date asc`;

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function getMaterielBillItem(req, res) {
    const user = req.user;
    const body = req.body;

    try {
        const returnData = {};
        let queryStr =
            `select
                date(fri.created_at) as bill_date, fri.organization, fri.org_type, fri.wms_type, fri.manage_type, fri.store_amount, fri.store_price
                , mat.materiel_id, mat.materiel_code, mat.materiel_name, mat.materiel_format, mat.materiel_unit
                from tbl_erc_financerecorditem fri
                left join tbl_erc_materiel mat
                on fri.materiel_id = mat.materiel_id
                where true
                and fri.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.bill_date) {
            queryStr += ' and to_days(fri.created_at) = to_days(?)';
            replacements.push(body.bill_date)
        }

        if (body.organization) {
            queryStr += ' and fri.organization = ?';
            replacements.push(body.organization)
        }

        if (body.wms_type) {
            queryStr += ' and fri.wms_type = ?';
            replacements.push(body.wms_type)
        }

        if (body.manage_type) {
            queryStr += ' and fri.manage_type = ?';
            replacements.push(body.manage_type)
        }

        if (body.search_text) {
            queryStr += ' and (fri.organization like ? or mat.materiel_code like ? or mat.materiel_name like ?)';
            replacements.push('%' + body.search_text + '%');
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

async function getRecordingVoucherCollection(req, res) {
    const user = req.user;
    const body = req.body;

    try {
        const returnData = {};
        let queryStr =
            `select
                sum(fri.store_price) as total_price
                , date_format(fri.created_at, '%Y-%m-%d') as record_date
                , fri.wms_type, fri.manage_type, fri.organization, fri.org_type, count(*) as paper_count
                from tbl_erc_financerecorditem fri
                where true
                and fri.domain_id = ?
                group by fri.wms_type, fri.manage_type, fri.organization, fri.org_type, date_format(fri.created_at, '%Y-%m-%d')`;

        queryStr += ` order by record_date desc, fri.wms_type asc, fri.manage_type asc, total_price asc`;

        const replacements = [user.domain_id];
        const result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function getRecordingVoucherDetail(req, res) {
    const user = req.user;
    const body = req.body;

    try {
        const returnData = {};
        let queryStr =
            `select
                fri.wms_type, fri.manage_type, fri.organization, fri.org_type, fri.store_price, date(fri.created_at) as record_date
                , mat.materiel_id, mat.materiel_name, mat.materiel_code, mat.materiel_format, mat.materiel_unit, mat.materiel_state_management
                from tbl_erc_financerecorditem fri
                left join tbl_erc_materiel mat
                on fri.materiel_id = mat.materiel_id
                where true
                and fri.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.record_date) {
            queryStr += ` and to_days(fri.created_at) = to_days(?)`;
            replacements.push(body.record_date);
        }

        if (body.wms_type) {
            queryStr += ` and fri.wms_type = ?`;
            replacements.push(body.wms_type);
        }

        if (body.manage_type) {
            queryStr += ` and fri.manage_type = ?`;
            replacements.push(body.manage_type);
        }

        if (body.organization) {
            queryStr += ` and fri.organization = ?`;
            replacements.push(body.organization);
        }

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
