const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCProductiveTaskControl');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const sequelize = model.sequelize;
const FDomain = require('../../../bl/common/FunctionDomainBL');

const tb_productivetask = model.erc_productivetask;
const tb_productplan = model.erc_productplan;
const tb_productplandetail = model.erc_productplandetail;

// 生产任务单接口
exports.ERCProductiveTaskControlResource = (req, res) => {
    let method = req.query.method;
    if(method === 'init'){
        initArc(req,res)
    }else if(method === 'search') {
        searchArc(req,res)
    }else if(method==='getProcedure'){
        getProcedure(req,res)
    }else if (method==='getFeeding'){
        getFeeding(req,res)
    }else if (method==='getRelated'){
        getRelated(req,res)
    }else {
        common.sendError(res, 'common_01')
    }

};

// 初始化基础数据
async function initArc(req,res){
    let returnData = {}
    const user = req.user;

    await FDomain.getDomainListInit(req, returnData);
    returnData.departmentInfo = await getDepartmentInfo(req, user.domain_id);
    returnData.procedureInfo = await getProcedureInfo(req, user.domain_id);
    returnData.unitInfo = GLBConfig.UNITINFO; //单位
    common.sendData(res, returnData)
}
// 查询生产任务单列表
async function searchArc(req,res){
    let doc = req.body,user = req.user,returnData={},replacements = [];

    try {
        let queryStr =
            `select p.*,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit 
             from tbl_erc_productivetask p 
             left join tbl_erc_materiel m on (p.materiel_id = m.materiel_id and m.state=1) 
             where p.state=1 and p.domain_id=?`;
        replacements.push(user.domain_id);

        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?)';
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

// 查询部门信息
async function getDepartmentInfo(req, domain_id) {
    try {
        const replacements = [domain_id];
        let queryStr =
            `select t.department_id as id, t.department_name as text
             from tbl_erc_department t
             left join tbl_erc_department pt
             on t.p_department_id = pt.department_id
             where t.state=1 and t.domain_id=?`;
        queryStr += ` order by t.created_at desc`;
        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        return result.data;
    } catch (error) {
        return [];
    }
}

// 查询产品工序信息
async function getProcedureInfo(req, domain_id) {
    try {
        let queryStr =
            `select pp.procedure_id as id, pp.procedure_name as text
             from tbl_erc_productionprocedure pp
             where true
             and pp.state = 1
             and pp.domain_id = ?`;

        const replacements = [domain_id];
        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        return result.data;
    } catch (error) {
        return [];
    }
}
// 查询生产任务单的车间与工序信息
async function getProcedure(req,res){
    try {
        let doc = req.body,user = req.user,returnData={},replacements = [],workshop='';

        let productiveTask = await tb_productivetask.findOne({
            where:{
                state:1,
                productivetask_id:doc.productivetask_id
            }
        });
        let productPlan = await tb_productplan.findOne({
            where:{
                state:1,
                product_id:productiveTask.product_id
            }
        });


        //车间
        if(productiveTask.materiel_id == productPlan.materiel_id){
            workshop = productPlan.workshop_id
        }else{
            let productPlandetail = await tb_productplandetail.findOne({
                where:{
                    state:1,
                    product_plan_id:productiveTask.product_id,
                    src_materiel_id:productiveTask.materiel_id
                }
            });
            workshop = productPlan.workshop_id
        }
        //工序
        let queryStr = `select pp.procedure_name,ppp.priority 
            from tbl_erc_productplanprocedure ppp 
            left join tbl_erc_productionprocedure pp on (ppp.procedure_id = pp.procedure_id and pp.state=1) 
            where ppp.state=1 and ppp.product_plan_id=? and rlt_materiel_code=? order by ppp.priority`;
        replacements.push(productiveTask.product_id);
        replacements.push(productiveTask.materiel_id);

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(var r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.workshop_id = workshop;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }
}
// 查询生产任务单的边余料信息
async function getFeeding(req,res){
    try {
        let doc = req.body,user = req.user,returnData={},replacements = [];
        let queryStr =
            `select p.*,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit 
            from tbl_erc_productivetaskdetail p 
            left join tbl_erc_materiel m on (p.materiel_id = m.materiel_id and m.state=1) 
            where p.state=1 and p.domain_id=? and p.productivetask_id = ?`;
        replacements.push(user.domain_id);
        replacements.push(doc.productivetask_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }
}

// 查询生产任务单的联产品信息
async function getRelated(req,res){
    try {
        let doc = req.body,user = req.user,returnData={},replacements = [];
        let queryStr =
            `select p.*,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit 
            from tbl_erc_productivetaskrelated p 
            left join tbl_erc_materiel m on (p.materiel_id = m.materiel_id and m.state=1) 
            where p.state=1 and p.domain_id=? and taskrelated_type=? and p.productivetask_id=?`;
        replacements.push(user.domain_id);
        replacements.push(doc.taskrelated_type);
        replacements.push(doc.productivetask_id);
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }
}