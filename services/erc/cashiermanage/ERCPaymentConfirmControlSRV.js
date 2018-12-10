
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCPaymentConfirmControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');

const moment = require('moment');
const sequelize = model.sequelize;

const task = require('../baseconfig/ERCTaskListControlSRV');
const tb_taskallot = model.erc_taskallot;
const tb_taskallotuser = model.erc_taskallotuser;
const paymentconfirm = model.erc_paymentconfirm;
const tb_user = model.common_user;
const tbl_corporateclients = model.erc_corporateclients;

exports.ERCPaymentConfirmControlResource = (req, res) => {
    let method = req.query.method;
    if (method==='init'){
        initAct(req,res)
    } else if (method==='search'){
        searchAct(req,res)
    } else {
        common.sendError(res, 'common_01')
    }
};

async function initAct(req,res){
    try{
        let returnData={};
        returnData.payment_confirm_type = GLBConfig.PAYMENTCONFIRMTYPE;
        returnData.payment_confirm_state = GLBConfig.PAYMENTCONFIRMSTATE;
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }
}

//查询待摊资产列表
async function searchAct(req,res){
    let doc = common.docTrim(req.body), user = req.user, returnData = {},replacements=[];
    let queryStr=`select p.*,u1.name as expend_name,u2.name as declarant_name,u3.name as examine_name   
            from tbl_erc_paymentconfirm p 
            left join tbl_common_user u1 on (p.paymentconfirm_expend_user = u1.user_id and u1.state=1) 
            left join tbl_common_user u2 on (p.paymentconfirm_declarant = u2.user_id and u2.state=1) 
            left join tbl_common_user u3 on (p.paymentconfirm_examine = u2.user_id and u2.state=1) 
            where p.state=1 and p.domain_id=?`;
    replacements.push(user.domain_id);
    if (doc.search_text) {
        queryStr += ` and u1.name like ? `;
        let search_text = `%${doc.search_text}%`;
        replacements.push(search_text);
    }
    if(doc.paymentconfirm_name){
        queryStr += ` and p.paymentconfirm_name = ? `;
        replacements.push(doc.paymentconfirm_name);
    }
    if(doc.paymentconfirm_id){
        queryStr += ` and p.paymentconfirm_id = ? `;
        replacements.push(doc.paymentconfirm_id);
    }

    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = [];
    for (let ap of result.data) {
        let d = JSON.parse(JSON.stringify(ap));
        d.created_at = ap.created_at ? moment(ap.created_at).format("YYYY-MM-DD") : null;
        d.updated_at = ap.updated_at ? moment(ap.updated_at).format("YYYY-MM-DD") : null;
        d.paymentconfirm_examine_time = ap.paymentconfirm_examine_time ? moment(ap.paymentconfirm_examine_time).format("YYYY-MM-DD") : null;
        d.paymentconfirm_declarant_time = ap.paymentconfirm_declarant_time ? moment(ap.paymentconfirm_declarant_time).format("YYYY-MM-DD") : null;
        returnData.rows.push(d)
    }
    common.sendData(res, returnData);
}
