/**
 * Created by Cici on 2018/4/26.
 */
/**
 * 资金支出管理
 */
const fs = require('fs');
const moment = require('moment');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCTransReceptionSRV');
const model = require('../../../model');


// tables
const sequelize = model.sequelize;
const tb_specialexpensesum = model.erc_specialexpensesum;
const tb_cashiergatheringsum = model.erc_cashiergatheringsum;
const tb_department = model.erc_department;
const tb_recordingvouchersc = model.erc_recordingvouchersc;

exports.ERCSpecialExpenseGatheringSumResource = (req, res) => {
    let method = req.query.method;
    if(method==='init'){
        initAct(req,res)
    }else if (method === 'dataExtractS') {
        dataExtractS(req, res)
    }else if(method == 'dataExtractC') {
        dataExtractC(req,res)
    }else if (method==='getSpecialexpenseSum') {
        getSpecialexpenseSum(req,res)
    }else if (method==='getCashiergatheringSum'){
        getCashiergatheringSum(req,res)
    }else if (method==='getSpecialexpenseSumDetail'){
        getSpecialexpenseSumDetail(req,res)
    }else if (method==='getCashiergatheringSumDetail'){
        getCashiergatheringSumDetail(req,res)
    }else {
        common.sendError(res, 'common_01')
    }
}

async function initAct(req,res) {
    try {
        let returnData = {}
        returnData.CAPITALCOSTTYLE = GLBConfig.CAPITALCOSTTYLE;
        common.sendData(res, returnData)
    }catch (error){
        common.sendFault(res, error);
    }

}
async function dataExtractC(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],queryStr='',detailCount=0,delResult

        queryStr = `delete from tbl_erc_cashiergatheringsum where state=1 
            and domain_id=? and cashiergatheringsum_time = ?`
        replacements.push(user.domain_id);
        replacements.push(doc.search_date);
        delResult = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.DELETE});

        queryStr = `delete from tbl_erc_recordingvouchersc where state=1 
            and domain_id=? and recordingvouchersc_time = ? and recordingvouchersc_type = 1`
        replacements.push(user.domain_id);
        replacements.push(doc.search_date);
        delResult = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.DELETE});

        replacements=[];
        queryStr = `select d.department_id,s.domain_id,
            sum(cashiergathering_gathering_money) as cashiergathering_gathering_money_sum 
            from tbl_erc_cashiergathering s 
            left join tbl_common_user u on (s.cashiergathering_declarant = u.user_id and u.state = 1) 
            left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
            left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
            where s.state=1 and cashiergathering_state = 2 and s.domain_id=?
            and cashiergathering_examine_time >= ? and cashiergathering_examine_time <= ?
            group by d.department_id,s.domain_id`;
        replacements.push(user.domain_id);
        replacements.push(doc.search_date + ' 00:00:00');
        replacements.push(doc.search_date + ' 23:59:59');
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        for(let r of result){
            let cashiergatheringsum_code = await Sequence.genCashiergatheringSumID(user);
            let addCashiergatheringsum = await tb_cashiergatheringsum.create({
                domain_id:r.domain_id,
                cashiergatheringsum_code:cashiergatheringsum_code,
                cashiergatheringsum_depart_id:r.department_id,
                cashiergatheringsum_time:doc.search_date,
                cashiergatheringsum_content:'客户收款申报单',
                cashiergatheringsum_amount:r.cashiergathering_gathering_money_sum
            })


            replacements = [];
            let queryStrCount = `select count(*) as count from tbl_erc_cashiergathering s 
                left join tbl_common_user u on (s.cashiergathering_declarant = u.user_id and u.state = 1) 
                left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
                left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
                where s.state=1 and cashiergathering_state = 2 and s.domain_id=? 
                and cashiergathering_examine_time >= ? and cashiergathering_examine_time <= ? 
                and d.department_id = ?`;
            replacements.push(r.domain_id);
            replacements.push(doc.search_date + ' 00:00:00');
            replacements.push(doc.search_date + ' 23:59:59');
            replacements.push(r.department_id);
            let resultCount = await sequelize.query(queryStrCount, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
            if(resultCount && resultCount.length>0){
                detailCount = resultCount[0].count?resultCount[0].count:0
            }
            let genRecordingVoucherCID = await Sequence.genRecordingVoucherCID(user);
            let addRecordingvouchersc = await tb_recordingvouchersc.create({
                recordingvouchersc_code:genRecordingVoucherCID,
                domain_id:user.domain_id,
                recordingvouchersc_depart_id:r.department_id,
                recordingvouchersc_time:doc.search_date,
                recordingvouchersc_count:detailCount,
                recordingvouchersc_type:1
            })
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}
async function dataExtractS(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],queryStr='',detailCount = 0,delResult

        queryStr = `delete from tbl_erc_specialexpensesum where state=1 
            and domain_id=? and s_expense_sum_time = ?`
        replacements.push(user.domain_id);
        replacements.push(doc.search_date);
        delResult = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.DELETE});

        queryStr = `delete from tbl_erc_recordingvouchersc where state=1 
            and domain_id=? and recordingvouchersc_time = ? and recordingvouchersc_type = 0`
        replacements.push(user.domain_id);
        replacements.push(doc.search_date);
        delResult = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.DELETE});

        replacements=[];
        queryStr = `select d.department_id,s.domain_id,s.s_capital_cost_type,
            sum(s_sum_fee) as s_sum_fee,
            sum(s_no_invoice_fee) as s_no_invoice_fee,
            sum(s_have_invoice_fee) as s_have_invoice_fee 
            from tbl_erc_specialexpense s 
            left join tbl_common_user u on (s.s_expense_creator_id = u.user_id and u.state = 1) 
            left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
            left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
            where s.state=1 and s_expense_state = 2 and s.domain_id=? 
            and s_expense_confirm_time >= ? and s_expense_confirm_time <= ?
            group by d.department_id,s.domain_id,s.s_capital_cost_type`;
        replacements.push(user.domain_id);
        replacements.push(doc.search_date + ' 00:00:00')
        replacements.push(doc.search_date + ' 23:59:59')
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        for(let r of result){
            let s_expense_sum_code = await Sequence.genSpecialExpenseSumID(user);
            let addSpecialexpensesum = await tb_specialexpensesum.create({
                domain_id:r.domain_id,
                s_expense_sum_code:s_expense_sum_code,
                s_expense_sum_depart_id:r.department_id,
                s_expense_sum_time:doc.search_date,
                s_expense_sum_content:'资金支出申请单',
                s_expense_sum_amount:r.s_sum_fee,
                s_no_invoice_sum_fee:r.s_no_invoice_fee,
                s_have_invoice_sum_fee:r.s_have_invoice_fee,
                s_capital_cost_sum_type:r.s_capital_cost_type
            })

            replacements = [];
            let queryStrCount = `select count(*) as count from tbl_erc_specialexpense s 
            left join tbl_common_user u on (s.s_expense_creator_id = u.user_id and u.state = 1) 
            left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
            left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
            where s.state=1 and s_expense_state = 2 and s.domain_id=? 
            and s_expense_confirm_time >= ? and s_expense_confirm_time <= ?
            and d.department_id = ? and s_capital_cost_type = ?`;
            replacements.push(r.domain_id);
            replacements.push(doc.search_date + ' 00:00:00');
            replacements.push(doc.search_date + ' 23:59:59');
            replacements.push(r.department_id);
            replacements.push(r.s_capital_cost_type);
            let resultCount = await sequelize.query(queryStrCount, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
            if(resultCount && resultCount.length>0){
                detailCount = resultCount[0].count?resultCount[0].count:0
            }
            let genRecordingVoucherSID = await Sequence.genRecordingVoucherSID(user);
            let addRecordingvouchersc = await tb_recordingvouchersc.create({
                recordingvouchersc_code:genRecordingVoucherSID,
                domain_id:user.domain_id,
                recordingvouchersc_depart_id:r.department_id,
                recordingvouchersc_time:doc.search_date,
                recordingvouchersc_count:detailCount,
                recordingvouchersc_type:0,
                s_recordingvouchersc_type:r.s_capital_cost_type
            })

        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function getSpecialexpenseSumDetail(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {}

        let queryStr = `select s.s_expense_id,s.domain_id,s.s_expense_confirm_time,d.department_id,s.bank_account,
            s.s_capital_cost_type,s_no_invoice_fee,s_have_invoice_fee,s_sum_fee,d.department_name  
            from tbl_erc_specialexpense s 
            left join tbl_common_user u on (s.s_expense_creator_id = u.user_id and u.state = 1) 
            left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
            left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
            where s.state=1 and s_expense_state = 2 and s.domain_id=? 
            and s_expense_confirm_time >= ? and s_expense_confirm_time <= ?
            and d.department_id = ? and s.s_capital_cost_type = ?`;
        replacements.push(user.domain_id);
        replacements.push(doc.s_expense_confirm_time + ' 00:00:00');
        replacements.push(doc.s_expense_confirm_time + ' 23:59:59');
        replacements.push(doc.department_id);
        replacements.push(doc.s_capital_cost_type);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.s_expense_confirm_time = moment(result.s_expense_confirm_time).format('YYYY-MM-DD')
            result.s_expense_content = '资金支出申请单'
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
async function getCashiergatheringSumDetail(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {}

        let queryStr = `select s.cashiergathering_id,s.domain_id,s.cashiergathering_examine_time,d.department_id,s.bank_account,
            s.cashiergathering_gathering_money,d.department_name 
            from tbl_erc_cashiergathering s 
            left join tbl_common_user u on (s.cashiergathering_declarant = u.user_id and u.state = 1) 
            left join tbl_erc_custorgstructure ot on u.user_id = ot.user_id and ot.state=1 
            left join tbl_erc_department d on ot.department_id = d.department_id and d.state=1
            where s.state=1 and cashiergathering_state = 2 and s.domain_id=? 
            and cashiergathering_examine_time >= ? and cashiergathering_examine_time <= ? 
            and d.department_id = ?`;
        replacements.push(user.domain_id);
        replacements.push(doc.cashiergatheringsum_time + ' 00:00:00');
        replacements.push(doc.cashiergatheringsum_time + ' 23:59:59');
        replacements.push(doc.department_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.cashiergathering_examine_time = moment(result.cashiergathering_examine_time).format('YYYY-MM-DD')
            result.cashiergatheringsum_content = '客户收款申报单'
            result.cashiergatheringsum_digest = '客户销售业务款'
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
async function getSpecialexpenseSum(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {}

        let queryStr = `select * from tbl_erc_specialexpensesum where state=1 and domain_id=?`;
        replacements.push(user.domain_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.s_expense_sum_time = moment(result.s_expense_sum_time).format('YYYY-MM-DD')
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
async function getCashiergatheringSum(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {}

        let queryStr = `select * from tbl_erc_cashiergatheringsum where state=1 and domain_id=?`;
        replacements.push(user.domain_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.cashiergatheringsum_time = moment(result.cashiergatheringsum_time).format('YYYY-MM-DD')
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}