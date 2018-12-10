
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCAmortizeDetailControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');

const moment = require('moment');
const sequelize = model.sequelize;

const task = require('../baseconfig/ERCTaskListControlSRV');
const tb_taskallot = model.erc_taskallot;
const tb_taskallotuser = model.erc_taskallotuser;
const tb_cashiergathering = model.erc_cashiergathering;
const tb_user = model.common_user;
const tbl_corporateclients = model.erc_corporateclients;
const tb_domain = model.common_domain;

exports.ERCGatheringControlResource = (req, res) => {
    let method = req.query.method;
    if (method==='init'){
        initAct(req,res)
    } else if (method==='search'){
        searchAct(req,res)
    } else if (method==='add'){
        addAct(req,res)
    } else {
        common.sendError(res, 'common_01')
    }
};

async function initAct(req,res){
    try{
        let returnData={};
        returnData.gathering_type = GLBConfig.GATHERINGTYPE;
        returnData.cashiergathering_state = GLBConfig.CASHIERGATHERINGSTATE;
        returnData.PAYMENTMETHOD = GLBConfig.PAYMENTMETHOD;
        returnData.MONETARYFUNDTYPE = await getMonetaryFundType(req,res)
        returnData.corporateclients = [];
        returnData.storeList = [];
        let corporateclients = await tbl_corporateclients.findAll({
            where:{
                state:GLBConfig.ENABLE,
                domain_id:req.user.domain_id
            }
        });
        for(let c of corporateclients){
            returnData.corporateclients.push({
                id:c.corporateclients_id,
                value:c.corporateclients_id,
                text:c.corporateclients_name
            })
        }
        let domains = await tb_domain.findAll({
            where: {
                state: GLBConfig.ENABLE
            }
        });
        for (let d of domains) {
            returnData.storeList.push({
                id: d.domain_id,
                value: d.domain_id,
                text: d.domain_name
            });
        }
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }
}
let getMonetaryFundType = async (req,res)=>{
    try {
        let returnData = [];

        let queryStr = "select d.* from tbl_erc_basetypedetail d,tbl_erc_basetype t" +
            " where d.basetype_id=t.basetype_id and t.basetype_code='HBZJLX'";
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
//获取构建预算列表
async function searchAct(req,res){
    let doc = common.docTrim(req.body), user = req.user, returnData = {},replacements=[];
    let queryStr=`select c.*,u1.name as cashier_name,u2.name as declarant_name,d.domain_name   
            from tbl_erc_cashiergathering c 
            left join tbl_common_user u1 on (c.cashiergathering_cashier = u1.user_id and u1.state=1) 
            left join tbl_common_user u2 on (c.cashiergathering_declarant = u2.user_id and u2.state=1) 
            left join tbl_common_domain d on (c.cashiergathering_customer_code = d.domain_id and d.state=1)
            where c.state=1 and c.domain_id=?`;
    replacements.push(user.domain_id);
    if (doc.search_text) {
        queryStr += ` and (c.cashiergathering_name like ? or c.cashiergathering_source_name like ?) `;
        let search_text = `%${doc.search_text}%`;
        replacements.push(search_text);
        replacements.push(search_text);
    }
    if(doc.cashiergathering_id){
        queryStr += ` and c.cashiergathering_id = ? `;
        replacements.push(doc.cashiergathering_id);
    }
    if (doc.cashiergathering_code) {
        queryStr += ` and c.cashiergathering_code like ?  `;
        replacements.push( `%${doc.cashiergathering_code}%`);
    }
    if(doc.cashiergathering_type){
        queryStr += ` and c.cashiergathering_type = ? `;
        replacements.push(doc.cashiergathering_type);
    }
    if(doc.cashier_btime){
        queryStr += ` and c.cashiergathering_cashier_time >= ? `;
        replacements.push(doc.cashier_btime);
    }
    if(doc.cashier_etime){
        queryStr += ` and c.cashiergathering_cashier_time <= ? `;
        replacements.push(doc.cashier_etime);
    }

    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = [];
    for (let ap of result.data) {
        let d = JSON.parse(JSON.stringify(ap));
        d.created_at = ap.created_at ? moment(ap.created_at).format("YYYY-MM-DD") : null;
        d.updated_at = ap.updated_at ? moment(ap.updated_at).format("YYYY-MM-DD") : null;
        d.cashiergathering_cashier_time = ap.cashiergathering_cashier_time ? moment(ap.cashiergathering_cashier_time).format("YYYY-MM-DD") : null;
        returnData.rows.push(d)
    }
    common.sendData(res, returnData);
}

//新增收款申报记录
async function addAct(req,res){
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        //校验是否分配任务处理人员
        let taskallot = await tb_taskallot.findOne({
            where:{
                state:GLBConfig.ENABLE,
                taskallot_name:'出纳管理新增收款申报任务'
            }
        });
        let taskallotuser = await tb_taskallotuser.findOne({
            where:{
                state:GLBConfig.ENABLE,
                domain_id: user.domain_id,
                taskallot_id:taskallot.taskallot_id
            }
        });

        if (!taskallotuser) {
            return common.sendError(res, 'cashier_01');
        }else{
            let cashiergathering = await tb_cashiergathering.create({
                domain_id:user.domain_id,
                cashiergathering_code: await Sequence.genCashierID(user),
                cashiergathering_name: doc.cashiergathering_name,
                cashiergathering_customer_code:doc.cashiergathering_customer_code,
                cashiergathering_source_name: doc.cashiergathering_source_name,
                cashiergathering_gathering_money: doc.cashiergathering_gathering_money,
                cashiergathering_phone: doc.cashiergathering_phone,
                cashiergathering_cashier: doc.cashiergathering_cashier,
                cashiergathering_cashier_time: doc.cashiergathering_cashier_time,
                cashiergathering_remark: doc.cashiergathering_remark,
                cashiergathering_declarant:user.user_id,
                cashiergathering_state:1,
                payment_method: doc.payment_method,
                monetary_fund_type: doc.monetary_fund_type,
                bank_account: doc.bank_account
            });

            let taskName = '出纳管理新增收款申报任务';
            let taskDescription = cashiergathering.cashiergathering_name + '  出纳管理新增收款申报任务';
            let groupId = common.getUUIDByTime(30);
            let taskResult = await task.createTask(user,taskName,45,taskallotuser.user_id,cashiergathering.cashiergathering_id,taskDescription,'',groupId);
            if(!taskResult){
                return common.sendError(res, 'task_01');
            }else {
                common.sendData(res, cashiergathering);
            }
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}
