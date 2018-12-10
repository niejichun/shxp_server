const moment = require('moment');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ProduceControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');

const FDomain = require('../../../bl/common/FunctionDomainBL');

const sequelize = model.sequelize;
const tb_common_apidomain = model.common_apidomain;
const tb_user = model.common_user;
const tb_orderrequire = model.erc_orderrequire;
const tb_productplan = model.erc_productplan;
const tb_productplandetail = model.erc_productplandetail;
const tb_productplanrelated = model.erc_productplanrelated;
const tb_productplanprocedure = model.erc_productplanprocedure;
const tb_productmaterielverify = model.erc_productmaterielverify;
const tb_task = model.erc_task;

const TaskListControlSRV = require('../baseconfig/ERCTaskListControlSRV');

exports.ERCProductPlanControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'initProductPlan') {
        initProductPlan(req, res)
    } else if (method === 'getOrderList') {
        getOrderList(req, res)
    } else if (method === 'searchProductPlan') {
        searchProductPlan(req, res)
    } else if (method === 'addProductPlan') {
        addProductPlan(req, res)
    } else if (method === 'modifyProductPlan') {
        modifyProductPlan(req, res)
    } else if (method === 'deleteProductPlan') {
        deleteProductPlan(req, res)
    } else if (method === 'initProductPlanDetail') {
        initProductPlanDetail(req, res)
    } else if (method === 'searchProductDetail') {
        searchProductDetail(req, res)
    } else if (method === 'addProductMateriel') {
        addProductMateriel(req, res)
    } else if (method === 'modifyProductMateriel') {
        modifyProductMateriel(req, res)
    } else if (method === 'deleteProductMateriel') {
        deleteProductMateriel(req, res)
    } else if (method === 'searchProductRelated') {
        searchProductRelated(req, res)
    } else if (method === 'addProductRelated') {
        addProductRelated(req, res)
    } else if (method === 'modifyProductRelated') {
        modifyProductRelated(req, res)
    } else if (method === 'deleteProductRelated') {
        deleteProductRelated(req, res)
    } else if (method === 'searchProductProcedure') {
        searchProductProcedure(req, res)
    } else if (method === 'addProductProcedure') {
        addProductProcedure(req, res)
    } else if (method === 'modifyProductProcedure') {
        modifyProductProcedure(req, res)
    } else if (method === 'deleteProductProcedure') {
        deleteProductProcedure(req, res)
    } else if (method==='getMateriel'){
        getMateriel(req, res)
    } else if (method==='initPlanVerify'){
        initPlanVerify(req, res)
    } else if (method==='getMaterielByProductPlan'){
        getMaterielByProductPlan(req, res)
    } else if (method==='searchPlanVerify'){
        searchPlanVerify(req, res)
    } else if (method==='searchPlanMaterielVerify'){
        searchPlanMaterielVerify(req, res)
    } else if (method==='searchPlanMaterielFromOrderRequire'){
        searchPlanMaterielFromOrderRequire(req, res)
    } else if (method==='searchPlanRelatedFromOrderRequire'){
        searchPlanRelatedFromOrderRequire(req, res)
    } else if (method==='searchPlanProcedureFromOrderRequire'){
        searchPlanProcedureFromOrderRequire(req, res)
    } else if (method==='bindPlanVerifyForMateriel'){
        bindPlanVerifyForMateriel(req, res)
    } else if (method==='submitProductPlanVerify'){
        submitProductPlanVerify(req, res)
    } else if (method==='searchPlanProcedureMateriel'){
        searchPlanProcedureMateriel(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
};

//获取订单信息
async function getOrderInfo(req) {
    try {
        let queryStr = `select o.*,u.*, o.domain_id domain_id,ds.name designer_name,
            o.created_at order_created_at from
            tbl_erc_order o
            left join tbl_common_user u on o.user_id = u.user_id
            left join tbl_common_user ds on o.designer_id = ds.user_id
            left join tbl_common_domain d on d.domain_id = o.domain_id
            left join tbl_erc_roomtype r on o.roomtype_id = r.roomtype_id
            where o.state=1 and o.domain_id ` + await FDomain.getDomainListStr(req);
        queryStr += ' order by o.created_at desc';
        const orderResult = await common.queryWithCount(sequelize, req, queryStr, []);
        return orderResult.data.map((item) => {
            return {
                id: item.order_id,
                text: item.order_id
            }
        });
    } catch (error) {
        return [];
    }
}

async function initProductPlan(req, res) {
    const returnData = {};
    const user = req.user;

    await FDomain.getDomainListInit(req, returnData);
    returnData.domainTypeInfo = GLBConfig.DOMAINTYPE; //单位
    returnData.unitInfo = GLBConfig.UNITINFO; //单位
    returnData.materielSource = GLBConfig.MATERIELSOURCE; //物料来源
    returnData.materielManage = GLBConfig.MATERIELMANAGE; //管理模式
    returnData.materielAmto = GLBConfig.MATERIELAMTO; //管理模式
    returnData.statusInfo = GLBConfig.STATUSINFO; //生效状态
    returnData.materielType = GLBConfig.MATERIELTYPE;//物料分类
    returnData.stateManagementInfo = GLBConfig.MATERIELSTATEMANAGEMENT;
    returnData.validInfo = [
        {id: 0, text: '未评审'},
        {id: 1, text: '评审中'},
        {id: 2, text: '已评审'}
    ];

    returnData.orderInfo = await getOrderInfo(req);
    returnData.departmentInfo = await getDepartmentInfo(req, user.domain_id);

    common.sendData(res, returnData)
}

//获取部门信息
async function getDepartmentInfo(req, domain_id) {
    try {
        const replacements = [domain_id];
        let queryStr =
            `select t.department_id as id, t.department_name as text
             from tbl_erc_department t
             left join tbl_erc_department pt
             on t.p_department_id = pt.department_id
             where t.state = 1 and pt.state = 1 and t.domain_id = ?`;
        queryStr += ` order by t.created_at desc`;
        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        return result.data;
    } catch (error) {
        return [];
    }
}

//获取产品信息
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

async function initProductPlanDetail(req, res) {
    const returnData = {};
    const user = req.user;

    await FDomain.getDomainListInit(req, returnData);
    returnData.domainTypeInfo = GLBConfig.DOMAINTYPE; //单位
    returnData.unitInfo = GLBConfig.UNITINFO; //单位
    returnData.materielSource = GLBConfig.MATERIELSOURCE; //物料来源
    returnData.materielManage = GLBConfig.MATERIELMANAGE; //管理模式
    returnData.statusInfo = GLBConfig.STATUSINFO; //生效状态
    returnData.materielType = GLBConfig.MATERIELTYPE;//物料分类
    returnData.stateManagementInfo = GLBConfig.MATERIELSTATEMANAGEMENT;

    returnData.prdLevelInfo = [];
    for (let i = 2; i < 10; i++) {
        returnData.prdLevelInfo.push({
            id: i,
            value: i,
            text: i
        });
    }

    returnData.departmentInfo = await getDepartmentInfo(req, user.domain_id);
    returnData.procedureInfo = await getProcedureInfo(req, user.domain_id);
    returnData.materielLevelInfo = await getMaterielInfo(req, user.domain_id);
    if (req.body.product_plan_id) {
        returnData.materielInfo = await searchProductPlanDetailMateriel(req, user.domain_id, req.body.product_plan_id);
    }

    returnData.userInfo = await tb_user.findAll({
        where: {
            domain_id: user.domain_id,
            user_type: GLBConfig.TYPE_OPERATOR
        },
        attributes: [['user_id', 'id'], ['name', 'text']]
    });

    common.sendData(res, returnData)
}

//获取订单列表
async function getOrderList(req, res) {
    const returnData = {};
    const replacements = [];
    try {
        let queryStr = `select o.*,u.*, o.domain_id domain_id,ds.name designer_name,
            o.created_at order_created_at from
            tbl_erc_order o
            left join tbl_common_user u on o.user_id = u.user_id
            left join tbl_common_user ds on o.designer_id = ds.user_id
            left join tbl_common_domain d on d.domain_id = o.domain_id
            left join tbl_erc_roomtype r on o.roomtype_id = r.roomtype_id
            where o.state=1 and order_type = 1 and o.domain_id ` + await FDomain.getDomainListStr(req);
        queryStr += ' order by o.created_at desc';
        const orderResult = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = orderResult.count;
        returnData.rows = orderResult.data;
    } catch (error) {
        common.sendFault(res, error);
    }
}

//查询产品信息
async function searchProductPlan(req, res) {
    const body = req.body;
    const user = req.user;
    const returnData = {};

    try {
        let queryStr =
            `select pp.product_id, pp.domain_id, pp.design_number, pp.valid_state, pp.order_id, pp.workshop_id, mt.*
             from tbl_erc_productplan pp
             left join tbl_erc_materiel mt
             on pp.materiel_id = mt.materiel_id
             where true
             and pp.state = 1
             and pp.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.valid_state || body.valid_state === 0) {
            queryStr += ` and pp.valid_state = ?`;
            replacements.push(body.valid_state);
        }

        if (body.materiel_state_management) {
            queryStr += ` and mt.materiel_state_management = ?`;
            replacements.push(body.materiel_state_management);
        }

        if (body.materiel_source) {
            queryStr += ` and mt.materiel_source = ?`;
            replacements.push(body.materiel_source);
        }

        if (body.search_text) {
            queryStr += ' and (mt.materiel_code like ? or mt.materiel_name like ?)';
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

//新增产品信息
async function addProductPlan(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const addProductArray = [];
        for (let item of body.searchedRow){
            let productResult = await tb_productplan.findOne({
                where: {
                    domain_id: user.domain_id,
                    state: GLBConfig.ENABLE,
                    materiel_id: item.materiel_id
                }
            });

            if (!productResult) {
                const addResult = await tb_productplan.create({
                    materiel_id: item.materiel_id,
                    domain_id: user.domain_id
                });

                addProductArray.push(addResult);
            }
        }
        common.sendData(res, addProductArray);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//修改产品信息
async function modifyProductPlan(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let productResult = await tb_productplan.findOne({
            where: {
                product_id: body.old.product_id,
                domain_id: user.domain_id
            }
        });

        if (productResult) {
            productResult.design_number = body.new.design_number;
            productResult.order_id = body.new.order_id;
            productResult.workshop_id = body.new.workshop_id;
            await productResult.save();
            common.sendData(res, productResult);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        return common.sendFault(res, error);
    }
}

//删除产品信息
async function deleteProductPlan(req, res) {
    try {
        const body = req.body;
        const user = req.user;

        let deleteResult = await tb_productplan.findOne({
            where: {
                product_id: body.product_id,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE
            }
        });

        if (deleteResult) {
            deleteResult.state = GLBConfig.DISABLE;
            await deleteResult.save();

            await tb_productplandetail.destroy({
                where: {
                    product_plan_id: body.product_id
                }
            });

            await tb_productplanrelated.destroy({
                where: {
                    product_plan_id: body.product_id
                }
            });

            await tb_productplanprocedure.destroy({
                where: {
                    product_plan_id: body.product_id
                }
            });

            await tb_productmaterielverify.destroy({
                where: {
                    product_plan_id: body.product_id
                }
            });

            common.sendData(res);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//查询产品详情
async function searchProductDetail(req, res) {
    const body = req.body;
    const user = req.user;
    const returnData = {};

    try {
        let queryStr =
            `select
             ppd.product_dtl_id, ppd.product_plan_id, ppd.prd_level
             , ppd.design_number, ppd.loss_rate, ppd.workshop_id, ppd.level_materiel_id
             , mt.*
             from tbl_erc_productplandetail ppd
             left join tbl_erc_materiel mt
             on mt.materiel_id = ppd.src_materiel_id
             where true
             and ppd.state = 1
             and ppd.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.product_plan_id) {
            queryStr += ` and ppd.product_plan_id = ?`;
            replacements.push(body.product_plan_id);
        }

        if (body.materiel_id) {
            queryStr += ` and ppd.materiel_id = ?`;
            replacements.push(body.materiel_id);
        }

        if (body.dtl_materiel_id) {
            queryStr += ` and mt.materiel_id != ?`;
            replacements.push(body.dtl_materiel_id);
        }

        if (body.prd_level) {
            queryStr += ` and ppd.prd_level = ?`;
            replacements.push(body.prd_level);
        }

        if (body.search_text) {
            queryStr += ' and (mt.materiel_code like ? or mt.materiel_name like ?)';
            replacements.push('%' + body.search_text + '%');
            replacements.push('%' + body.search_text + '%');
        }

        queryStr +=' order by mt.materiel_code'
        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function searchPlanProcedureMateriel(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const dataArray1 = await searchProductPlanMateriel(req, user.domain_id, body.product_plan_id);
        const dataArray2 = await searchProductPlanDetailMateriel(req, user.domain_id, body.product_plan_id);
        common.sendData(res, [
            ...dataArray1,
            ...dataArray2
        ]);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function searchProductPlanMateriel(req, domain_id, product_plan_id) {
    try {
        let queryStr =
            `select pp.product_id, pp.domain_id, pp.design_number, pp.valid_state, pp.order_id, pp.workshop_id, mt.*
             from tbl_erc_productplan pp
             left join tbl_erc_materiel mt
             on pp.materiel_id = mt.materiel_id
             where true
             and pp.state = 1
             and pp.domain_id = ?`;

        const replacements = [domain_id];

        if (product_plan_id) {
            queryStr += ` and pp.product_id = ?`;
            replacements.push(product_plan_id);
        }

        const dataArray = await common.queryWithCount(sequelize, req, queryStr, replacements);
        return dataArray.data.map(item => {
            return {
                id: item.materiel_id,
                text: item.materiel_code
            }
        });
    } catch (error) {
        return [];
    }
}

async function searchProductPlanDetailMateriel(req, domain_id, product_plan_id) {
    try {
        let queryStr =
            `select
             ppd.product_dtl_id, ppd.product_plan_id, ppd.prd_level
             , ppd.design_number, ppd.loss_rate, ppd.workshop_id, ppd.level_materiel_id
             , mt.*
             from tbl_erc_productplandetail ppd
             left join tbl_erc_materiel mt
             on mt.materiel_id = ppd.src_materiel_id
             where true
             and ppd.state = 1
             and ppd.domain_id = ?`;

        const replacements = [domain_id];

        if (product_plan_id) {
            queryStr += ` and ppd.product_plan_id = ?`;
            replacements.push(product_plan_id);
        }

        const dataArray = await common.queryWithCount(sequelize, req, queryStr, replacements);
        return dataArray.data.map(item => {
            return {
                id: item.materiel_id,
                text: item.materiel_code
            }
        });
    } catch (error) {
        return [];
    }
}

//增加产品物料
async function addProductMateriel(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const addProductArray = [];
        for (let item of body.searchedRow){
            let productResult = await tb_productplandetail.findOne({
                where: {
                    domain_id: user.domain_id,
                    state: GLBConfig.ENABLE,
                    product_plan_id: body.product_plan_id,
                    materiel_id: body.materiel_id,
                    src_materiel_id: item.materiel_id
                }
            });

            if (!productResult) {
                const addResult = await tb_productplandetail.create({
                    product_plan_id: body.product_plan_id,
                    materiel_id: body.materiel_id,
                    src_materiel_id: item.materiel_id,
                    domain_id: user.domain_id
                });

                addProductArray.push(addResult);
            }
        }
        common.sendData(res, addProductArray);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//修改产品物料
async function modifyProductMateriel(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let productDtlResult = await tb_productplandetail.findOne({
            where: {
                product_dtl_id: body.old.product_dtl_id,
                domain_id: user.domain_id
            }
        });

        if (productDtlResult) {
            productDtlResult.prd_level = body.new.prd_level;
            productDtlResult.design_number = body.new.design_number;
            productDtlResult.loss_rate = body.new.loss_rate;
            productDtlResult.workshop_id = body.new.workshop_id;
            productDtlResult.level_materiel_id = body.new.level_materiel_id;
            await productDtlResult.save();
            common.sendData(res, productDtlResult);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        return common.sendFault(res, error);
    }
}

//删除产品物料
async function deleteProductMateriel(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const deleteResult = await tb_productplandetail.findOne({
            where: {
                product_dtl_id: body.product_dtl_id,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE
            }
        });

        if (deleteResult) {
            deleteResult.state = GLBConfig.DISABLE;
            await deleteResult.save();
            common.sendData(res);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取产品关联信息
async function searchProductRelated(req, res) {
    const body = req.body;
    const user = req.user;
    const returnData = {};

    try {
        let queryStr =
            `select ppr.product_rlt_id, ppr.rlt_materiel_code, ppr.prd_type, ppr.prd_number, mt.*
             from tbl_erc_productplanrelated ppr
             left join tbl_erc_materiel mt
             on mt.materiel_id = ppr.src_materiel_id
             where true
             and ppr.state = 1
             and ppr.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.product_plan_id) {
            queryStr += ` and ppr.product_plan_id = ?`;
            replacements.push(body.product_plan_id);
        }

        if (body.materiel_id) {
            queryStr += ` and ppr.materiel_id = ?`;
            replacements.push(body.materiel_id);
        }

        if (body.prd_type) {
            queryStr += ` and ppr.prd_type = ?`;
            replacements.push(body.prd_type);
        }

        if (body.search_text) {
            queryStr += ' and (mt.materiel_code like ? or mt.materiel_name like ?)';
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

//新增产品关联信息
async function addProductRelated(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const addProductArray = [];
        for (let item of body.searchedRow){
            let productResult = await tb_productplanrelated.findOne({
                where: {
                    domain_id: user.domain_id,
                    state: GLBConfig.ENABLE,
                    product_plan_id: body.product_plan_id,
                    materiel_id: body.materiel_id,
                    src_materiel_id: item.materiel_id,
                    prd_type: body.prd_type
                }
            });

            if (!productResult) {
                const addResult = await tb_productplanrelated.create({
                    product_plan_id: body.product_plan_id,
                    materiel_id: body.materiel_id,
                    src_materiel_id: item.materiel_id,
                    domain_id: user.domain_id,
                    prd_type: body.prd_type
                });

                addProductArray.push(addResult);
            }
        }
        common.sendData(res, addProductArray);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//修改产品关联信息
async function modifyProductRelated(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let productRltResult = await tb_productplanrelated.findOne({
            where: {
                product_rlt_id: body.old.product_rlt_id,
                domain_id: user.domain_id
            }
        });

        if (productRltResult) {
            productRltResult.prd_number = body.new.prd_number;
            productRltResult.rlt_materiel_code = body.new.rlt_materiel_code;
            await productRltResult.save();
            common.sendData(res, productRltResult);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        return common.sendFault(res, error);
    }
}

//删除产品关联信息
async function deleteProductRelated(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const deleteResult = await tb_productplanrelated.findOne({
            where: {
                product_rlt_id: body.product_rlt_id,
                prd_type: body.prd_type,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE
            }
        });

        if (deleteResult) {
            deleteResult.state = GLBConfig.DISABLE;
            await deleteResult.save();
            common.sendData(res);
        } else {
            common.sendError(res, 'produce_03');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//查询产品工序
async function searchProductProcedure(req, res) {
    const body = req.body;
    const user = req.user;
    const returnData = {};

    try {
        let queryStr =
            `select ppp.product_procedure_id, ppp.rlt_materiel_code, ppp.priority
             , pp.procedure_id, pp.procedure_code, pp.procedure_name
             , mt.materiel_id, mt.materiel_code, mt.materiel_name
             from tbl_erc_productplanprocedure ppp
             left join tbl_erc_productionprocedure pp
             on ppp.procedure_id = pp.procedure_id
             left join tbl_erc_materiel mt
             on ppp.rlt_materiel_code = mt.materiel_id
             where true
             and ppp.state = 1
             and ppp.domain_id = ?`;

        const replacements = [user.domain_id];

        if (body.product_plan_id) {
            queryStr += ` and ppp.product_plan_id = ?`;
            replacements.push(body.product_plan_id);
        }

        if (body.materiel_id) {
            queryStr += ` and ppp.materiel_id = ?`;
            replacements.push(body.materiel_id);
        }

        if (body.search_text) {
            queryStr += ' and (mt.materiel_code like ? or mt.materiel_name like ?)';
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

//新增产品工序
async function addProductProcedure(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let procedureResult = await tb_productplanprocedure.findOne({
            where: {
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE,
                product_plan_id: body.product_plan_id,
                // materiel_id: body.materiel_id,
                // procedure_id: body.procedure_id,
                rlt_materiel_code: body.rlt_materiel_code
            }
        });

        if (!procedureResult) {
            const addResult = await tb_productplanprocedure.create({
                product_plan_id: body.product_plan_id,
                materiel_id: body.materiel_id,
                procedure_id: body.procedure_id,
                rlt_materiel_code: body.rlt_materiel_code,
                priority: body.priority,
                domain_id: user.domain_id
            });

            common.sendData(res, addResult);
        } else {
            common.sendError(res, 'procedure_02');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//修改产品工序
async function modifyProductProcedure(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let productProcedureResult = await tb_productplanprocedure.findOne({
            where: {
                product_procedure_id: body.old.product_procedure_id,
                domain_id: user.domain_id
            }
        });

        if (productProcedureResult) {
            productProcedureResult.procedure_id = body.new.procedure_id;
            productProcedureResult.rlt_materiel_code = body.new.rlt_materiel_code;
            productProcedureResult.priority = body.new.priority;
            await productProcedureResult.save();
            common.sendData(res, productProcedureResult);
        } else {
            common.sendError(res, 'procedure_01');
        }
    } catch (error) {
        return common.sendFault(res, error);
    }
}

//删除产品工序
async function deleteProductProcedure(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const deleteResult = await tb_productplanprocedure.findOne({
            where: {
                product_procedure_id: body.product_procedure_id,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE
            }
        });

        if (deleteResult) {
            deleteResult.state = GLBConfig.DISABLE;
            await deleteResult.save();
            common.sendData(res);
        } else {
            common.sendError(res, 'procedure_01');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取材料信息
async function getMaterielInfo(req, domainId) {
    const replacements = [];
    const api_name = 'ERCMATERIELCONTROL';
    const dlist = [];

    dlist.push(domainId);
    let resultApi = await tb_common_apidomain.findAll({
        where: {
            api_name: api_name,
            domain_id: domainId,
            state: GLBConfig.ENABLE,
            effect_state:GLBConfig.ENABLE
        }
    });
    for(let r of resultApi) {
        dlist.push(r.follow_domain_id)
    }
    let queryInStr= ' in (' + dlist.join(",") + ')';

    let queryStr =
            `select m.materiel_id as id, m.materiel_id as value, m.materiel_code as text
            from tbl_erc_materiel m
            left join tbl_common_domain d on (m.domain_id=d.domain_id and d.state=1)
            where m.state=1 and m.domain_id ` + queryInStr;

    queryStr += ' order by m.domain_id,materiel_id';
    const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    return result.data;
}

async function getMateriel(req,res){
    try {
        let doc = common.docTrim(req.body),returnData = {},replacements = [];

        let user = req.user,api_name = 'ERCMATERIELCONTROL',dlist = [];

        // dlist.push(user.domain_id);
        // let resultApi = await tb_common_apidomain.findAll({
        //     where: {
        //         api_name: api_name,
        //         domain_id: user.domain_id,
        //         state: GLBConfig.ENABLE,
        //         effect_state:GLBConfig.ENABLE
        //     }
        // });
        // for(let r of resultApi) {
        //     dlist.push(r.follow_domain_id)
        // }
        // let queryInStr= ' in (' + dlist.join(",") + ')';
        //
        // let queryStr = `select m.*,d.domain_name
        //     from tbl_erc_materiel m
        //     left join tbl_common_domain d on (m.domain_id=d.domain_id and d.state=1)
        //     where true
        //     and m.state=1
        //     and m.materiel_source=?
        //     and m.domain_id ` + queryInStr;
        //
        // replacements.push(GLBConfig.MATERIELSOURCE[0].value);


        let queryStr = `select m.*,d.domain_name
            from tbl_erc_materiel m
            left join tbl_common_domain d on (m.domain_id=d.domain_id and d.state=1)
            where true
            and m.state=1
            and m.domain_id=? `
        replacements.push(user.domain_id);

        if(doc.tableName === 'productDetail' && doc.materiel_id){
            // queryStr+=' and materiel_id<>(select materiel_id from tbl_erc_produce where produce_id=?)'
            queryStr += ' and materiel_id != ?';
            replacements.push(doc.materiel_id);
        }

        if (doc.searchData) {
            queryStr += ' and (materiel_name like ? or materiel_code like ? or materiel_format like ?)';
            replacements.push('%' + doc.searchData + '%');
            replacements.push('%' + doc.searchData + '%');
            replacements.push('%' + doc.searchData + '%');
        }
        queryStr += ' order by m.domain_id,materiel_id';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);

        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.created_at.Format("yyyy-MM-dd");
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

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

async function initPlanVerify(req, res) {
    const user = req.user;

    try {
        const returnData = {
            order_require_type: GLBConfig.ORDERREQUIRETYPE,
        };

        returnData.userInfo = await tb_user.findAll({
            where: {
                domain_id: user.domain_id,
                user_type: GLBConfig.TYPE_OPERATOR
            },
            attributes: [['user_id', 'id'], ['name', 'text']]
        });

        returnData.unitInfo = GLBConfig.UNITINFO; //单位
        returnData.materielSource = GLBConfig.MATERIELSOURCE; //物料来源
        returnData.materielManage = GLBConfig.MATERIELMANAGE; //管理模式
        returnData.statusInfo = GLBConfig.STATUSINFO; //生效状态
        returnData.materielType = GLBConfig.MATERIELTYPE;//物料分类
        returnData.stateManagementInfo = GLBConfig.MATERIELSTATEMANAGEMENT;

        returnData.prdLevelInfo = [];
        for (let i = 2; i < 10; i++) {
            returnData.prdLevelInfo.push({
                id: i,
                value: i,
                text: i
            });
        }

        returnData.departmentInfo = await getDepartmentInfo(req, user.domain_id);
        returnData.materielLevelInfo = await getMaterielInfo(req, user.domain_id);

        returnData.procedureInfo = await getProcedureType(req, user.domain_id);
        returnData.procedureTypeInfo = returnData.procedureInfo.map(item => {
            return {
                id: item.basetypedetail_id,
                text: item.typedetail_name
            }
        });

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取产品计划物料
async function getMaterielByProductPlan(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const queryStr =
            `select
             mt.*
             from tbl_erc_productplan pp
             left join tbl_erc_materiel mt
             on pp.materiel_id = mt.materiel_id
             where true
             and pp.domain_id = ?
             and pp.product_id = ?`;

        const replacements = [user.domain_id, body.product_id];
        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        common.sendData(res, result);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取材料变更信息
async function searchPlanVerify(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const queryStr =
            `select
             orq.*
             from tbl_erc_orderrequire orq
             left join tbl_erc_productmaterielverify pmv
             on orq.require_id = pmv.require_id
             where true
             and orq.state = ?
             and orq.type_id = ?
             and orq.domain_id = ?
             and pmv.product_plan_id = ?
             group by orq.require_id`;

        const replacements = [GLBConfig.ENABLE, body.require_type, user.domain_id, body.product_id];
        const result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        const returnDate = {};
        returnDate.rows = result.data;
        returnDate.total = result.count;

        common.sendData(res, returnDate);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//计划的物料审核查询
async function searchPlanMaterielVerify(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let queryStr =
            `select
             odr.require_id, odr.require_name, odr.require_description, odr.require_user_id
             , u.name as require_user_name
             from tbl_erc_orderrequire odr
             left join tbl_common_user u
             on odr.require_user_id = u.user_id
             where true
             and odr.domain_id = ?
             and odr.state = ?
             and odr.type_id = ?
             and odr.require_user_id is not null`;
        const replacements = [user.domain_id, GLBConfig.ENABLE, body.require_type];

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        const returnDate = {};
        returnDate.requireList = result.data;

        returnDate.verifyList = await tb_productmaterielverify.findAll({
            where: {
                product_ppd_id: body.product_ppd_id,
                verify_type: body.verify_type,
                domain_id: user.domain_id
            }
        });

        common.sendData(res, returnDate);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//查询计划的物料信息
async function searchPlanMaterielFromOrderRequire(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let queryStr =
            `select
             pmv.materiel_verify_id, pmv.require_id
             , ppd.product_dtl_id, ppd.materiel_id as p_materiel_id, ppd.src_materiel_id
             , ppd.design_number, ppd.prd_level, ppd.loss_rate, ppd.workshop_id, ppd.level_materiel_id
             , mat.materiel_id, mat.materiel_code, mat.materiel_name, mat.materiel_format, mat.materiel_unit
             , ppd.product_plan_id as product_id
             , mat.*
             from tbl_erc_productmaterielverify pmv
             left join tbl_erc_productplandetail ppd
             on pmv.product_ppd_id = ppd.product_dtl_id
             left join tbl_erc_materiel mat
             on ppd.src_materiel_id = mat.materiel_id
             where true
             and pmv.domain_id = ?
             and pmv.require_id = ?
             and ppd.product_plan_id = ?`;

        const replacements = [user.domain_id, body.require_id, body.product_id];

        if (body.verify_type) {
            queryStr += ` and pmv.verify_type = ?`;
            replacements.push(body.verify_type);
        }

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        const returnDate = {};
        returnDate.rows = result.data;
        returnDate.total = result.count;

        common.sendData(res, returnDate);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取需求订单中的计划物料
async function searchPlanRelatedFromOrderRequire(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let queryStr =
            `select
             pmv.materiel_verify_id, pmv.require_id
             , ppd.product_rlt_id, ppd.materiel_id as p_materiel_id, ppd.src_materiel_id, ppd.prd_number
             , ppd.product_plan_id as product_id, ppd.rlt_materiel_code
             , mat.materiel_id, mat.materiel_code, mat.materiel_name, mat.materiel_format, mat.materiel_unit
             from tbl_erc_productmaterielverify pmv
             left join tbl_erc_productplanrelated ppd
             on pmv.product_ppd_id = ppd.product_rlt_id
             left join tbl_erc_materiel mat
             on ppd.src_materiel_id = mat.materiel_id
             where true
             and pmv.domain_id = ?
             and pmv.require_id = ?
             and ppd.product_plan_id = ?`;

        const replacements = [user.domain_id, body.require_id, body.product_id];

        if (body.verify_type) {
            queryStr += ` and pmv.verify_type = ?`;
            replacements.push(body.verify_type);
        }

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        const returnDate = {};
        returnDate.rows = result.data;
        returnDate.total = result.count;

        common.sendData(res, returnDate);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//查询订单需求中的产品信息
async function searchPlanProcedureFromOrderRequire(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        let queryStr =
            `select
             pmv.materiel_verify_id, pmv.require_id
             , ppd.product_procedure_id, ppd.materiel_id as p_materiel_id, ppd.product_plan_id as product_id
             , ppd.priority, ppd.rlt_materiel_code
             , mat.materiel_code
             , ppc.*
             from tbl_erc_productmaterielverify pmv
             left join tbl_erc_productplanprocedure ppd
             on pmv.product_ppd_id = ppd.product_procedure_id
             left join tbl_erc_productionprocedure ppc
             on ppd.procedure_id = ppc.procedure_id
             left join tbl_erc_materiel mat
             on ppd.rlt_materiel_code = mat.materiel_id
             where true
             and pmv.domain_id = ?
             and pmv.require_id = ?
             and ppd.product_plan_id = ?`;

        const replacements = [user.domain_id, body.require_id, body.product_id];

        if (body.verify_type) {
            queryStr += ` and pmv.verify_type = ?`;
            replacements.push(body.verify_type);
        }

        const result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        const returnDate = {};
        returnDate.rows = result.data;
        returnDate.total = result.count;

        common.sendData(res, returnDate);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//绑定物料
async function bindPlanVerifyForMateriel(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        await tb_productmaterielverify.destroy({
            where: {
                product_ppd_id: body.product_ppd_id,
                verify_type: body.verify_type
            }
        });

        let verifyArray = body.searchedRow;
        verifyArray = verifyArray.map(item => {
            return {
                product_plan_id: body.product_plan_id,
                product_ppd_id: body.product_ppd_id,
                require_id: item.require_id,
                verify_type: body.verify_type,
                domain_id: user.domain_id
            }
        });

        await await tb_productmaterielverify.bulkCreate(verifyArray);

        common.sendData(res, verifyArray);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取物料变更计划信息
async function getVerifyListFromProductPlan(req, product_id, verifyType) {
    const queryStr =
        `select
         orq.require_user_id
         from tbl_erc_productmaterielverify pmv
         left join tbl_erc_productplan pp
         on pmv.product_plan_id = pp.product_id
         left join tbl_erc_orderrequire orq
         on pmv.require_id = orq.require_id
         where true
         and pp.state = 1
         and pmv.product_plan_id = ?
         and pmv.verify_type = ?
         group by orq.require_user_id`;

    const replacements = [product_id, verifyType];

    return await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
}

async function getVerifyListFromProductPlanRelated(req, product_id, verifyType) {
    const queryStr =
        `select
         orq.require_user_id
         from tbl_erc_productmaterielverify pmv
         left join tbl_erc_productplanrelated ppr
         on pmv.product_ppd_id = ppr.product_rlt_id
         left join tbl_erc_orderrequire orq
         on pmv.require_id = orq.require_id
         left join tbl_erc_productplan pp
         on ppr.materiel_id = pp.materiel_id
         where true
         and pmv.verify_type = ?
         and pp.materiel_id = ?
         group by orq.require_user_id`;

    const replacements = [verifyType, materiel_id];

    return await common.queryWithCount(sequelize, req, queryStr, replacements);
}

async function getVerifyListFromProductPlanProcedure(req, product_id) {
    const queryStr =
        `select
         orq.require_user_id
         from tbl_erc_productmaterielverify pmv
         left join tbl_erc_productplanprocedure ppc
         on pmv.product_ppd_id = ppc.product_procedure_id
         left join tbl_erc_orderrequire orq
         on pmv.require_id = orq.require_id
         left join tbl_erc_productplan pp
         on ppc.materiel_id = pp.materiel_id
         where true
         and pmv.verify_type = 4
         and pp.materiel_id = ?
         group by orq.require_user_id`;

    const replacements = [materiel_id];

    return await common.queryWithCount(sequelize, req, queryStr, replacements);
}

async function addProductPlanTask(title, type, user, product_id, user_id) {
    const taskName = title;
    const taskType = type;
    const taskPerformer = user_id;
    const taskReviewCode = product_id;
    const taskDescription = title;
    await TaskListControlSRV.createTask(user, taskName, taskType, taskPerformer, taskReviewCode, taskDescription);
}

//发布审核任务
async function submitProductPlanVerify(req, res) {
    const body = req.body;
    const user = req.user;

    try {
        const ppdCount = await tb_productplandetail.count({
            where: {
                state: 1,
                product_plan_id: body.product_id,
                domain_id: user.domain_id
            }
        });

        if (ppdCount > 0) {
            const pppCount = await tb_productplanprocedure.count({
                where: {
                    state: 1,
                    product_plan_id: body.product_id,
                    domain_id: user.domain_id
                }
            });

            if (pppCount > 0) {
                let productResult = await tb_productplan.findOne({
                    where: {
                        state: 1,
                        product_id: body.product_id
                    }
                });

                if (productResult) {
                    const ppdResult = await tb_productplandetail.findAll({
                        where: {
                            state: 1,
                            product_plan_id: body.product_id
                        }
                    });
                    for (const item of ppdResult) {
                        const {product_dtl_id} = item;
                        const ppdVerifyCount = await tb_productmaterielverify.count({
                            where: {
                                product_ppd_id: product_dtl_id,
                                verify_type: 1
                            }
                        });

                        if (ppdVerifyCount < 1) {
                            return common.sendError(res, 'produce_09');
                        }
                    }

                    const pprResult = await tb_productplanrelated.findAll({
                        where: {
                            state: 1,
                            product_plan_id: body.product_id
                        }
                    });
                    for (const item of pprResult) {
                        const {product_rlt_id} = item;
                        const pprVerifyCount = await tb_productmaterielverify.count({
                            where: {
                                product_ppd_id: product_rlt_id,
                                verify_type: {
                                    $in: [2, 3]
                                }
                            }
                        });

                        if (pprVerifyCount < 1) {
                            return common.sendError(res, 'produce_09');
                        }
                    }

                    const pppResult = await tb_productplanprocedure.findAll({
                        where: {
                            state: 1,
                            product_plan_id: body.product_id
                        }
                    });
                    for (const item of pppResult) {
                        const {product_procedure_id} = item;
                        const pppVerifyCount = await tb_productmaterielverify.count({
                            where: {
                                product_ppd_id: product_procedure_id,
                                verify_type: 4
                            }
                        });

                        if (pppVerifyCount < 1) {
                            return common.sendError(res, 'produce_09');
                        }
                    }

                    if (productResult.valid_state < 1) {
                        productResult.valid_state = 1;
                        await productResult.save();

                        const verifyList1 = await getVerifyListFromProductPlan(req, body.product_id, 1);
                        for (const item of verifyList1.data) {
                            await addProductPlanTask('产品规划物料审核任务', '70', user, body.product_id, item.require_user_id);
                        }

                        const verifyList2 = await getVerifyListFromProductPlan(req, body.product_id, 2);
                        for (const item of verifyList2.data) {
                            await addProductPlanTask('产品规划联产品审核任务', '71', user, body.product_id, item.require_user_id);
                        }

                        const verifyList3 = await getVerifyListFromProductPlan(req, body.product_id, 3);
                        for (const item of verifyList3.data) {
                            await addProductPlanTask('产品规划边余料审核任务', '72', user, body.product_id, item.require_user_id);
                        }

                        const verifyList4 = await getVerifyListFromProductPlan(req, body.product_id, 4);
                        for (const item of verifyList4.data) {
                            await addProductPlanTask('产品规划工序管理审核任务', '73', user, body.product_id, item.require_user_id);
                        }

                        common.sendData(res);
                    } else {
                        common.sendError(res, 'produce_08');
                    }
                } else {
                    common.sendError(res, 'produce_03');
                }
            } else {
                common.sendError(res, 'produce_07');
            }
        } else {
            common.sendError(res, 'produce_06');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

exports.productPlanVerified = async (user, taskType, taskReviewId) => {
    const totalCount = await tb_task.count({
        where: {
            domain_id: user.domain_id,
            state: 1,
            task_type: {
                $in: [70, 71, 72, 73]
            },
            task_review_code: taskReviewId
        }
    });

    const verifyCount = await tb_task.count({
        where: {
            domain_id: user.domain_id,
            state: 1,
            task_type: {
                $in: [70, 71, 72, 73]
            },
            task_review_code: taskReviewId,
            task_state: 2
        }
    });

    if (totalCount === verifyCount) {
        let productResult = await tb_productplan.findOne({
            where: {
                product_id: taskReviewId,
                valid_state: 1
            }
        });

        if (productResult) {
            productResult.valid_state = 2;
            await productResult.save();
        }
    }
};
