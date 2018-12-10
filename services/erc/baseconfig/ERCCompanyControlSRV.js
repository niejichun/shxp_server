const fs = require('fs');
const path = require('path');
const iconvLite = require('iconv-lite');

const config = require('../../../config');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCEstateControlSRV');
const model = require('../../../model');

const sequelize = model.sequelize;
const tb_company = model.erc_company


exports.ERCCompanyControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res)
    } else if (method==='addCompany'){
        addCompany(req,res)
    } else if (method==='delCompany'){
        delCompany(req,res)
    } else if (method==='modifyCompany'){
        modifyCompany(req,res)
    } else if (method==='getCompany'){
        getCompany(req,res)
    } else {

        common.sendError(res, 'common_01')
    }
};

let getWB = async (req,res)=>{
    try {
        let returnData = [];

        let queryStr = "select d.* from tbl_erc_basetypedetail d,tbl_erc_basetype t" +
            " where d.basetype_id=t.basetype_id and t.basetype_code='WB'";
        let result = await sequelize.query(queryStr, {replacements: [], type: sequelize.QueryTypes.SELECT});
        for (let i of result) {
            returnData.push({
                id: i.basetypedetail_id,
                value: i.typedetail_name,
                text: i.typedetail_name
            })
        }

        return returnData
    } catch (error) {
        throw error

    }
}
let getJZBWB = async (req,res)=>{
    try {
        let returnData = [];

        let queryStr = "select d.* from tbl_erc_basetypedetail d,tbl_erc_basetype t" +
            " where d.basetype_id=t.basetype_id and t.basetype_code='JZBWB'";
        let result = await sequelize.query(queryStr, {replacements: [], type: sequelize.QueryTypes.SELECT});
        for (let i of result) {
            returnData.push({
                id: i.basetypedetail_id,
                value: i.typedetail_name,
                text: i.typedetail_name
            })
        }

        return returnData
    } catch (error) {
        throw error

    }
}
async function initAct(req,res){
    try {
        let returnData = {}
        returnData.WB = await getWB();
        returnData.JZBWB = await getJZBWB();

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
        return
    }
}
async function addCompany(req,res){
    try{
        let doc = common.docTrim(req.body);
        let user = req.user;

        let addCompany = await tb_company.create({
            domain_id:user.domain_id,
            company_code: doc.company_code,
            company_name: doc.company_name,
            company_business_scope: doc.company_business_scope,
            company_main_business: doc.company_main_business,
            company_legal: doc.company_legal,
            company_legal_no: doc.company_legal_no,
            company_agency_phone: doc.company_agency_phone,
            company_ERC_name: doc.company_ERC_name,
            company_ERC_phone: doc.company_ERC_phone,
            company_ERC_QQ: doc.company_ERC_QQ,
            company_province: doc.company_province,
            company_city: doc.company_city,
            company_area: doc.company_area,
            company_adress: doc.company_adress,
            company_recording_currency: doc.company_recording_currency,
            company_foreign: doc.company_foreign,
            company_precision: doc.company_precision,
            company_profit_pursuit: doc.company_profit_pursuit,
            company_advance_date: doc.company_advance_date,
            company_recognition_criteria: doc.company_recognition_criteria,
            company_service_purchase_criteria: doc.company_service_purchase_criteria,
            company_property_purchase_criteria: doc.company_property_purchase_criteria,
            company_complex_supplier_number: doc.company_complex_supplier_number,
            company_piece_amount: doc.company_piece_amount
        });
        common.sendData(res, addCompany);
    }catch (error) {
        common.sendFault(res, error);
    }
}

async function delCompany(req,res){
    try {
        let doc = common.docTrim(req.body);
        let delCompany = await tb_company.findOne({
            where: {
                company_id: doc.company_id,
                state: GLBConfig.ENABLE
            }
        });

        if (delCompany) {
            delCompany.state = GLBConfig.DISABLE;
            await delCompany.save();
            common.sendData(res);
            return
        } else {
            common.sendError(res, 'estate_01');
            return
        }
    } catch (error) {
        common.sendFault(res, error);
        return
    }
}

async function modifyCompany(req,res){
    try{
        let doc = common.docTrim(req.body)

        let modCompany = await tb_company.findOne({
            where: {
                company_id: doc.old.company_id
            }
        });

        if (modCompany) {
            modCompany.company_code = doc.new.company_code;
            modCompany.company_name = doc.new.company_name;
            modCompany.company_business_scope = doc.new.company_business_scope;
            modCompany.company_main_business = doc.new.company_main_business;
            modCompany.company_legal = doc.new.company_legal;
            modCompany.company_legal_no = doc.new.company_legal_no;
            modCompany.company_agency_phone = doc.new.company_agency_phone;
            modCompany.company_ERC_name = doc.new.company_ERC_name;
            modCompany.company_ERC_phone = doc.new.company_ERC_phone;
            modCompany.company_ERC_QQ = doc.new.company_ERC_QQ;
            modCompany.company_province = doc.new.company_province;
            modCompany.company_city = doc.new.company_city;
            modCompany.company_area = doc.new.company_area;
            modCompany.company_adress = doc.company_adress;
            modCompany.company_recording_currency = doc.new.company_recording_currency;
            modCompany.company_foreign = doc.new.company_foreign;
            modCompany.company_precision = doc.new.company_precision;
            modCompany.company_profit_pursuit = doc.new.company_profit_pursuit;
            modCompany.company_advance_date = doc.new.company_advance_date;
            modCompany.company_recognition_criteria = doc.new.company_recognition_criteria;
            modCompany.company_service_purchase_criteria = doc.new.company_service_purchase_criteria;
            modCompany.company_property_purchase_criteria = doc.new.company_property_purchase_criteria;
            modCompany.company_complex_supplier_number = doc.new.company_complex_supplier_number;
            modCompany.company_piece_amount = doc.new.company_piece_amount
            await modCompany.save()
        } else {
            return common.sendError(res, '公司不存在');
        }
        common.sendData(res, modCompany);
    }catch (error) {
        common.sendFault(res, error);
        return
    }
}

async function getCompany(req,res){
    try {
        let doc = common.docTrim(req.body);
        let returnData = {};
        let replacements = [];
        let user = req.user;

        let queryStr=`select * from tbl_erc_company where state=1 and domain_id=?`
        replacements.push(user.domain_id)
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.created_at.Format("yyyy-MM-dd");
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    }catch (error) {
        common.sendFault(res, error);
        return
    }
}