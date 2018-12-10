/**
 * Created by Cici on 2018/4/26.
 */
/**
 * 资金费用记账凭证
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

exports.ERCRecordingVoucherSCControlResource = (req, res) => {
    let method = req.query.method;
    if(method==='init') {
        initAct(req, res)
    }else if (method==='getRecordingVoucherSC'){
        getRecordingVoucherSC(req,res)
    }else if (method==='getRecordingVoucherDetail'){
        getRecordingVoucherDetail(req,res)
    }else if (method==='getRecordingVoucherDetailC'){
        getRecordingVoucherDetailC(req,res)
    }else if (method==='getRecordingVoucherDetailS'){
        getRecordingVoucherDetailS(req,res)
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
async function getRecordingVoucherSC(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {}

        let queryStr = `select s.*,d.department_name  
            from tbl_erc_recordingvouchersc s 
            left join tbl_erc_department d on s.recordingvouchersc_depart_id = d.department_id and d.state=1
            where s.state=1 and s.domain_id=? `;
        replacements.push(user.domain_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let resultTemp = JSON.parse(JSON.stringify(r));
            resultTemp.recordingvouchersc_time = moment(resultTemp.recordingvouchersc_time).format('YYYY-MM-DD');
            if(resultTemp.recordingvouchersc_type == 0){
                resultTemp.order_type = '资金支出申请单'
            }else{
                resultTemp.order_type = '客户收款申请单'
            }
            returnData.rows.push(resultTemp)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function getRecordingVoucherDetailC(req,res){
    let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {},sumMoney = 0
    let queryStr = `select s.*,b.typedetail_name from tbl_erc_cashiergathering s 
            left join tbl_erc_basetypedetail b on (s.monetary_fund_type = b.basetypedetail_id and b.state=1)
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
        result.digest = '收款申请单';                //  摘要

        for(let p of GLBConfig.PAYMENTMETHOD){     //   总账科目
            if(result.payment_method == p.id){
                result.accsum = p.text;
            }
        }

        if(result.payment_method == 0){             //  科目明细
            result.activeAccount = ''
        }else if (result.payment_method = 1){
            result.activeAccount = r.bank_account
        }else{
            result.activeAccount = r.typedetail_name
        }

        result.debite = r.cashiergathering_gathering_money; //借方金额
        sumMoney += r.cashiergathering_gathering_money;

        returnData.rows.push(result)
    }
    returnData.rows.push({
        digest : '收款申请单',
        accsum : '应收账款',
        activeAccount : '',
        debite : '',
        credit : sumMoney
    });
    common.sendData(res, returnData);


}
async function getRecordingVoucherDetailS(req,res){
    let doc=common.docTrim(req.body),user=req.user,replacements = [],returnData = {},sumMoney = 0,department_name=''
    let queryStr = `select s.*,b.typedetail_name,d.department_name from tbl_erc_specialexpense s 
            left join tbl_erc_basetypedetail b on (s.monetary_fund_type = b.basetypedetail_id and b.state=1)
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
        department_name = r.department_name
        let result = JSON.parse(JSON.stringify(r));
        result.digest = '资金支出申请单';                //  摘要

        for(let p of GLBConfig.PAYMENTMETHOD){     //   总账科目
            if(result.payment_method == p.id){
                result.accsum = p.text;
            }
        }

        if(result.payment_method == 0){             //  科目明细
            result.activeAccount = ''
        }else if (result.payment_method = 1){
            result.activeAccount = r.bank_account
        }else{
            result.activeAccount = r.typedetail_name
        }

        result.credit = r.s_sum_fee; //贷方金额
        sumMoney += r.s_sum_fee;

        returnData.rows.push(result)
    }

    let accsum = ''
    if(doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[0]){          //商品及劳务采购款
        accsum = '应付账款';
        activeAccount = department_name
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[1]){   //职工薪酬
        accsum = '应付职工薪酬'
        activeAccount=''
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[3]){   //短期投资款
        accsum = '交易性金融资产'
        activeAccount = '本金'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[13]){   //长期资产采购款
        accsum = '应付账款'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[4]){   //长期投资款中长期股权投资
        accsum = '长期股权投资'
        activeAccount='投资成本'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[5]){   //支付长期投资款中持有至到期投资
        accsum = '持有至到期投资'
        activeAccount='成本'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[6]){   //可供出售金融资产
        accsum = '可供出售金融资产'
        activeAccount='成本'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[7]){   //归还短期借款本金
        accsum = '短期借款'
        activeAccount=''
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[8]){   //归还长期借款本金
        accsum = '长期借款'
        activeAccount=''
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[9]){   //支付借款利息
        accsum = '应付利息'
        activeAccount='借款利息'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[10]){   //支付分红
        accsum = '应付利润'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[11]){   //生产部门费用报销
        accsum = '制造费用'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[12]){   //销售部门费用报销
        accsum = '销售费用'
    }else if (doc.s_recordingvouchersc_type == GLBConfig.CAPITALCOSTTYLE[14]){   //其他部门费用报销
        accsum = '管理费用'
    }

    let activeAccount = ''

    returnData.rows.push({
        digest : '资金支出申请单',
        accsum : accsum,
        activeAccount : activeAccount,
        debite : sumMoney,
        credit :''
    });
    common.sendData(res, returnData);


}
