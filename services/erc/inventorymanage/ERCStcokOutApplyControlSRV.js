const fs = require('fs');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCStcokOutApplyControlSRV');
const Sequence = require('../../../util/Sequence');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const model = require('../../../model');
const moment = require('moment');
const task = require('../baseconfig/ERCTaskListControlSRV');

const sequelize = model.sequelize;
const tb_domain = model.common_domain;
const tb_user = model.common_user;
const tb_stockoutapply = model.erc_stockoutapply;
const tb_stockoutapplydetail = model.erc_stockoutapplydetail;
const tb_stockitem = model.erc_stockitem;//安全库存明细
const tb_stockmap = model.erc_stockmap;
const tb_warehouse = model.erc_warehouse;
const tb_warehousezone = model.erc_warehousezone;
const tb_stockotherapplyout = model.erc_stockotherapplyout;
const tb_inventoryaccount = model.erc_inventoryaccount;
const tb_otherstockout = model.erc_otherstockout;
const tb_financerecorditem = model.erc_financerecorditem;
const tb_custorgstructure = model.erc_custorgstructure;
const tb_department = model.erc_department;

exports.ERCStcokOutApplyControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'initApply') {
        initApply(req, res)
    } else if (method === 'initOtherApply') {
        initOtherApply(req, res)
    } else if (method === 'getStockOutApply') {
        getStockOutApply(req, res)
    } else if (method === 'search') {
        searchAct(req, res);
    } else if (method === 'searchTable') {
        searchTable(req, res)
    } else if (method === 'search_mtable') {
        search_mTable(req, res)
    } else if (method === 'add') {
        addAct(req, res);
    } else if (method === 'add_apply_order') {
        addApplyOrder(req, res)
    } else if (method === 'modify') {
        modify_mTable(req, res);
    } else if (method === 'delete') {
        delete_mTable(req, res)
    } else if (method === 'setTask') {
        setTask(req, res)
    } else if (method === 'searchOutMateriel') {
        searchOutMateriel(req, res)
    } else if (method === 'modifyWaitApply') {
        modifyWaitApply(req, res);
    } else if (method === 'getWarehouseZone') {
        getWarehouseZone(req, res);
    } else if (method === 'getOtherStockOut') {
        getOtherStockOut(req, res);
    } else if (method === 'searchOtherApplyOtherOut') {
        searchOtherApplyOtherOut(req, res)
    } else if (method === 'initOtherApplyOtherOut') {
        initOtherApplyOtherOut(req, res)
    } else if (method === 'modifyOtherApplyOtherOut') {
        modifyOtherApplyOtherOut(req, res);
    } else if (method === 'StockOtherOut') {
        StockOtherOut(req, res);
    } else {
        common.sendError(res, 'common_01')
    }
};
//初始化数据
async function initAct(req, res) {
    try {
        let doc = common.docTrim(req.body), user = req.user;
        let returnData = {
            stockoutapplyState: GLBConfig.STOCKOUTAPPLYSTATE,//申请单状态
            staffInfo: [],//团队人员
        };
        returnData.unitInfo = GLBConfig.UNITINFO;//单位
        let staff = await tb_user.findAll({
            where: {
                user_type: '01',
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });
        for (let s of staff) {
            returnData.staffInfo.push({
                id: (s.user_id).toString(),
                value: (s.user_id).toString(),
                text: s.name
            });
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}
//初始化申请数据
async function initApply(req, res) {
    try {

        let doc = common.docTrim(req.body), user = req.user;
        let returnData = {
            stockModelInfo: GLBConfig.MATERIELMANAGE, //库存管理模式
            stockoutapplyState: GLBConfig.STOCKOUTAPPLYSTATE,//申请单状态
            unitInfo: GLBConfig.UNITINFO,//单位
            staffInfo: [],//团队人员
        };
        let staff = await tb_user.findAll({
            where: {
                user_type: '01',
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });
        for (let s of staff) {
            returnData.staffInfo.push({
                id: (s.user_id).toString(),
                value: (s.user_id).toString(),
                text: s.name
            });
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}
//出库申请列表
async function getStockOutApply(req, res) {
    try {
        let doc = common.docTrim(req.body), user = req.user, replacements = [], returnData = [];
        let queryStr=`select a.*,
             ap.name as apply_applicant,av.name as apply_approver
             from tbl_erc_stockoutapply a
             left join tbl_common_user ap on (a.user_id=ap.user_id and ap.state=1)
             left join tbl_common_user av on (a.performer_user_id=av.user_id and av.state=1)
             where a.state=1 `;
        if (doc.stockoutapply_id) {
            queryStr += ' and a.stockoutapply_id=?';
            replacements.push(doc.stockoutapply_id)
        }
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        for (let r of result) {
            let result = JSON.parse(JSON.stringify(r));
            result.created_at = r.created_at.Format("yyyy-MM-dd");
            returnData.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
    common.sendError(res, error)
    }
}
//获取出库申请列表
async function searchAct(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {},
            replacements = [];
        let queryStr = 'select * from tbl_erc_stockoutapply where state = 1 and domain_id'+ await FDomain.getDomainListStr(req);
        if (doc.search_text) {
            queryStr += ' and stockoutapply_id like ?';
            replacements.push('%' + doc.search_text + '%');
        }

        queryStr+=' order by created_at desc'
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        //returnData.rows = result.data;
        returnData.rows = [];
        for (let r of result.data) {
            let rj = JSON.parse(JSON.stringify(r));
            rj.created_at = r.created_at ? r.created_at.Format("yyyy-MM-dd") : null;
            rj.complete_date = r.complete_date ? r.complete_date.Format("yyyy-MM-dd") : null;
            returnData.rows.push(rj);
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

//增加出库物料库存
let searchTable = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {},
            replacements = [];
        let queryStr = 'select s.materiel_id,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit,m.materiel_manage from tbl_erc_stockmap s left join tbl_erc_materiel m on s.materiel_id = m.materiel_id where m.state = 1 and s.domain_id'+ await FDomain.getDomainListStr(req);
        if (doc.matNameOrCodeOrFormat) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?)';
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
        }
        queryStr += ' group by s.materiel_id';

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//获取物料列表
let search_mTable = async (req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        let queryStr = `select ino.*,m.materiel_id,m.materiel_code, m.materiel_name,m.materiel_format,m.materiel_unit,m.materiel_manage
                from tbl_erc_stockoutapplydetail ino
                left join tbl_erc_materiel m on (ino.materiel_id = m.materiel_id and m.state = 1)
                where ino.state = 1`
        let replacements = [];

        if (doc.stockoutapply_id) {
            queryStr += ' and ino.stockoutapply_id=?';
            replacements.push(doc.stockoutapply_id)
        }

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
};
//创建出库申请
async function addAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let addOM = await tb_stockoutapply.create({
            stockoutapply_id: await Sequence.genStockOutApplyId(user.domain),
            domain_id: user.domain_id,
            user_id: user.user_id,
            stockoutapply_state: '0'
        });
        let retData = JSON.parse(JSON.stringify(addOM));
        common.sendData(res, retData);

    } catch (error) {
        common.sendFault(res, error);
    }
};
//创建出库申请
async function addApplyOrder(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let addorder = await tb_stockoutapplydetail.findOne({
            where: {
                //stockmap_id: doc.stockmap_id,
                materiel_id: doc.materiel_id,
                //warehouse_id: doc.warehouse_id,
                stockoutapply_id: doc.stockoutapply_id,
                state: GLBConfig.ENABLE
            }
        });
        if(addorder){
            common.sendError(res, 'invalidateApplyorder_02');
            return
        }

        let addOM = await tb_stockoutapplydetail.create({
            stockoutapply_id: doc.stockoutapply_id,
            materiel_id: doc.materiel_id,
            stockoutapplydetail_amount: 0,
            stockoutapplydetail_type: doc.materiel_manage
        });
        let retData = JSON.parse(JSON.stringify(addOM));
        common.sendData(res, retData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

//修改物料
let modify_mTable = async (req, res) => {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;

        let modifyLand = await tb_stockoutapplydetail.findOne({
            where: {
                stockoutapplydetail_id: doc.old.stockoutapplydetail_id
            }
        });

        if (modifyLand) {
            modifyLand.stockoutapplydetail_amount=doc.new.stockoutapplydetail_amount
            await modifyLand.save()
        } else {
            common.sendError(res, 'landagent_01');
            return
        }

        common.sendData(res, modifyLand);

    } catch (error) {
        return common.sendFault(res, error);
    }
};
//删除物料
let delete_mTable = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let delTemp = await tb_stockoutapplydetail.findOne({
            where: {
                stockoutapplydetail_id: doc.stockoutapplydetail_id,
                state: GLBConfig.ENABLE
            }
        });

        if (delTemp) {
            delTemp.state = GLBConfig.DISABLE;
            //delTemp.user_id = GLBConfig.DISABLE;
            await delTemp.save();

            return common.sendData(res);
        } else {
            return common.sendError(res, 'templateConstruction_01');

        }
    } catch (error) {
        return common.sendFault(res, error);
    }
};
//处理申请任务
async function setTask(req,res){  //报废单号提交
    try{// user, taskName, taskType  4, taskPerformer, taskReviewCode, taskDescription
        let user=req.user;
        let doc = req.body;
        // 申请状态 1待提交，2待审批，3未通过,4已报废
        let purchaseapply = await tb_stockoutapply.findOne({
            where:{
                state:GLBConfig.ENABLE,
                stockoutapply_id:doc.stockoutapply_id
            }
        });
        let applyorder = await tb_stockoutapplydetail.findOne({
            where:{
                state:GLBConfig.ENABLE,
                stockoutapply_id:doc.stockoutapply_id,
                stockoutapplydetail_amount: 0
            }
        });
        if(applyorder){
            return common.sendError(res, 'stockoutapplydetail_03');
        }


        let taskName = '出库申请';
        let taskDescription = doc.stockoutapply_id + '  出库申请';
        let groupId = common.getUUIDByTime(30);
        // user, taskName, taskType, taskPerformer, taskReviewCode, taskDescription, reviewId, taskGroup
        let taskResult = await task.createTask(user,taskName,11,'',doc.stockoutapply_id,taskDescription,'',groupId);
        if(!taskResult){
            return common.sendError(res, 'task_02');
        }else{
            if(purchaseapply){
                purchaseapply.stockoutapply_state= '1';
                await purchaseapply.save()
            }
            common.sendData(res, purchaseapply)
        }
    }catch (error){
        common.sendFault(res, error);
    }
};
//物料列表
async function searchOutMateriel(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {},
            replacements = [];

        // let queryStr = `select oo.otherstockout_id,oo.stockoutapply_id,sa.stockoutapplydetail_amount,sa.already_amount,sa.waitoutapply_amount,m.materiel_id,m.materiel_name,m.materiel_code,m.materiel_format,m.materiel_unit,m.materiel_manage
        //                from tbl_erc_otherstockout oo left join tbl_erc_stockoutapplydetail sa on oo.stockoutapply_id = sa.stockoutapply_id
        //                left join tbl_erc_materiel m on sa.materiel_id = m.materiel_id
        //                where oo.state = 1`

        let queryStr = `select sa.stockoutapplydetail_id,sa.stockoutapply_id,sa.stockoutapplydetail_amount,sa.already_amount,sa.stockoutapplydetail_type,m.materiel_id,m.materiel_name,m.materiel_code,m.materiel_format,m.materiel_unit,m.materiel_manage 
                from tbl_erc_stockoutapplydetail sa left join tbl_erc_materiel m on sa.materiel_id = m.materiel_id
                where sa.state = 1`

        if (doc.stockoutapply_id) {
            queryStr += ' and sa.stockoutapply_id=?';
            replacements.push(doc.stockoutapply_id)
        }

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
};
//修改申请
let modifyWaitApply = async (req, res) => {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;

        let modifyLand = await tb_stockoutapplydetail.findOne({
            where: {
                stockoutapplydetail_id: doc.old.stockoutapplydetail_id
            }
        });

        if (modifyLand) {
            modifyLand.waitoutapply_amount=doc.new.waitoutapply_amount
            await modifyLand.save()
        } else {
            common.sendError(res, 'landagent_01');
            return
        }

        common.sendData(res, modifyLand);

    } catch (error) {
        return common.sendFault(res, error);
    }
};
//初始化订单申请
async function initOtherApply(req, res) {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;
        let returnData = {
            stockModelInfo: GLBConfig.MATERIELMANAGE, //库存管理模式
            stockoutapplyState: GLBConfig.STOCKOUTAPPLYSTATE,//申请单状态
            unitInfo: GLBConfig.UNITINFO,//单位
            staffInfo: [],//团队人员
        };
        returnData.warehouseId = [];

        let warehouseI = await tb_warehouse.findAll({
            where: {
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });

        for (let land of warehouseI) {
            let elem = {};
            elem.id = land.warehouse_id;
            elem.value = land.warehouse_id;
            elem.text = land.warehouse_name;
            returnData.warehouseId.push(elem)
        }

        let staff = await tb_user.findAll({
            where: {
                user_type: '01',
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });
        for (let s of staff) {
            returnData.staffInfo.push({
                id: (s.user_id).toString(),
                value: (s.user_id).toString(),
                text: s.name
            });
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
};
//获取仓区
async function getWarehouseZone(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let replacements = [];
        let queryStr = 'select * from tbl_erc_warehousezone where state=1 and warehouse_id=?';
        replacements.push(doc.warehouse_id);
        let queryRst = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });
        let returnData = [];
        for (let i = 0; i < queryRst.length; i++) {
            let elem = {};
            elem.id = queryRst[i].warehouse_zone_id;
            elem.value = queryRst[i].warehouse_zone_id;
            elem.text = queryRst[i].zone_name;
            returnData.push(elem)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
        return
    }

};

//获取其他出库
async function getOtherStockOut(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        // let o = await tb_stockotherapplyout.findOne({
        //     where:{
        //         materiel_id:doc.materiel_id,
        //         stockoutapply_id: doc.stockoutapply_id,
        //     }
        // });
        // if(o){
        //     common.sendError(res, 'stockoutapplydetail_01');
        //     return
        // }


        if(doc.warehouse_zone_id == ""){
            let addOM = await tb_stockotherapplyout.create({
                stockoutapplydetail_id: doc.stockoutapplydetail_id,
                stockoutapply_id: doc.stockoutapply_id,
                materiel_id: doc.materiel_id,
                warehouse_id: doc.warehouse_id,
                //warehouse_zone_id: NULL,
                stockotherapplyout_amount: doc.stockoutapplydetail_amount,
                stockotherapplyout_type: doc.stockoutapplydetail_type,
            });
            let retData = JSON.parse(JSON.stringify(addOM));
            common.sendData(res, retData);
        }else{
            let addOM = await tb_stockotherapplyout.create({
                stockoutapplydetail_id: doc.stockoutapplydetail_id,
                stockoutapply_id: doc.stockoutapply_id,
                materiel_id: doc.materiel_id,
                warehouse_id: doc.warehouse_id,
                warehouse_zone_id: doc.warehouse_zone_id,
                stockotherapplyout_amount: doc.stockoutapplydetail_amount,
                stockotherapplyout_type: doc.stockoutapplydetail_type,
            });
            let retData = JSON.parse(JSON.stringify(addOM));
            common.sendData(res, retData);
        }

        /*let stockOtherApplyOut = await tb_stockotherapplyout.findOne({
            where: {
                stockoutapplydetail_id: doc.stockoutapplydetail_id,
                stockoutapply_id: doc.stockoutapply_id,
                materiel_id: doc.materiel_id,
                warehouse_id: doc.warehouse_id,
                warehouse_zone_id: doc.warehouse_zone_id
            }
        });

        if (!stockOtherApplyOut) {
            stockOtherApplyOut = await tb_stockotherapplyout.create({
                stockoutapplydetail_id: doc.stockoutapplydetail_id,
                stockoutapply_id: doc.stockoutapply_id,
                materiel_id: doc.materiel_id,
                warehouse_id: doc.warehouse_id,
                warehouse_zone_id: doc.warehouse_zone_id,
                stockotherapplyout_amount: doc.stockoutapplydetail_amount,
                stockotherapplyout_type: doc.stockoutapplydetail_type,
            });
        }

        common.sendData(res, stockOtherApplyOut);*/
    } catch (error) {
        common.sendFault(res, error);
    }
};
//初始化其他出库数据
async function initOtherApplyOtherOut(req, res) {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;
        let returnData = {};
            returnData.stockModelInfo = GLBConfig.MATERIELMANAGE, //库存管理模式
            returnData.unitInfo = GLBConfig.UNITINFO,//单位
            returnData.wzI = [];

        let landAgents = await tb_warehousezone.findAll({
            where: {
                state: GLBConfig.ENABLE,
                warehouse_id: doc.warehouse_id
            }
        })
        for (let land of landAgents) {
            let elem = {};
            elem.id = land.warehouse_zone_id;
            elem.value = land.warehouse_zone_id;
            elem.text = land.zone_name;
            returnData.wzI.push(elem)
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
};
//其他出库申请
async function searchOtherApplyOtherOut(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {},
            replacements = [];

        // let queryStr = `select sa.*,m.*
        //             from tbl_erc_stockotherapplyout sa left join tbl_erc_materiel m on sa.materiel_id = m.materiel_id
        //             where sa.state = 1`

        let queryStr = `select sa.*,m.*,sk.already_amount
                    from tbl_erc_stockotherapplyout sa left join tbl_erc_materiel m on sa.materiel_id = m.materiel_id
                    left join tbl_erc_stockoutapplydetail sk on sa.stockoutapplydetail_id = sk.stockoutapplydetail_id
                    where sa.state = 1`

        if (doc.stockoutapply_id) {
            queryStr += ' and sa.stockoutapply_id=?';
            replacements.push(doc.stockoutapply_id)
        }

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
};
//修改其他出库
let modifyOtherApplyOtherOut = async (req, res) => {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;
        if(doc.old.stockotherapplyout_type == '2'){
            let sale = await tb_stockmap.findOne({
                where:{
                    materiel_id:doc.old.materiel_id,
                    warehouse_id:doc.old.warehouse_id,
                    warehouse_zone_id: doc.old.warehouse_zone_id,
                    state: 1,
                    order_id: {
                        $eq: null
                    }
                }
            });
            if (doc.new.already_amount > doc.new.stockotherapplyout_amount) {
                return common.sendError(res, 'stockoutapplydetail_04');
            }
            if(doc.new.waitoutapply_amount > sale.current_amount){
                common.sendError(res, 'stockoutapplydetail_02');
                return
            }
        }else{
            let saleId = await tb_stockmap.findOne({
                where:{
                    materiel_id:doc.old.materiel_id,
                }
            });
            let safe = await tb_stockitem.findOne({
                where:{
                    stockmap_id:saleId.stockmap_id,
                    warehouse_zone_id:doc.old.warehouse_zone_id,
                    warehouse_id:doc.old.warehouse_id
                }
            });
            if(doc.new.waitoutapply_amount>safe.item_amount){
                common.sendError(res, 'stockoutapplydetail_02');
                return
            }
        }
        let modifyLand = await tb_stockotherapplyout.findOne({
            where: {
                stockotherapplyout_id: doc.old.stockotherapplyout_id,
            }
        });
        if (modifyLand) {
            modifyLand.warehouse_zone_id=doc.new.warehouse_zone_id
            modifyLand.waitoutapply_amount=doc.new.waitoutapply_amount
            if(doc.new.warehouse_zone_id != doc.old.warehouse_zone_id){
                modifyLand.waitoutapply_amount = 0
            }
            await modifyLand.save()
        } else {
            common.sendError(res, 'landagent_01');
            return
        }
        common.sendData(res, modifyLand);
    } catch (error) {
        return common.sendFault(res, error);
    }
};
//其他出库提交
let StockOtherOut = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user;
        let queryStrApply = 'select * from tbl_erc_stockotherapplyout where state = 1 and stockoutapply_id = ?';
        let replacementsf = [doc.stockoutapply_id];
        let resultApply = await sequelize.query(queryStrApply, {
            replacements: replacementsf,
            type: sequelize.QueryTypes.SELECT
        });
        let bill_code=new Date().valueOf();
        let stockOutPrice = 0;
        for(let r of resultApply){
            if(r.stockotherapplyout_type == '1'){//安全库存管理
                let saleId = await tb_stockmap.findOne({
                    where:{
                        materiel_id:r.materiel_id,
                    }
                });
                let safe = await tb_stockitem.findOne({
                    where:{
                        stockmap_id:saleId.stockmap_id,
                        warehouse_zone_id:r.warehouse_zone_id,
                        warehouse_id:r.warehouse_id
                    }
                });
                if(safe){
                    stockOutPrice = safe.store_price;
                    safe.item_amount = safe.item_amount-r.waitoutapply_amount
                    await safe.save()
                } else {
                    stockOutPrice = saleId.store_price;
                }
                if(saleId){
                    saleId.current_amount = saleId.current_amount-r.waitoutapply_amount
                    await saleId.save()
                }
            }else{//销售订单管理
                let sale = await tb_stockmap.findOne({
                    where:{
                        materiel_id:r.materiel_id,
                        warehouse_id:r.warehouse_id,
                        warehouse_zone_id:r.warehouse_zone_id,
                        state: 1,
                        order_id: {
                            $eq: null
                        }
                    }
                });
                if(sale){
                    stockOutPrice = sale.store_price;
                    sale.current_amount = sale.current_amount-r.waitoutapply_amount
                    await sale.save()
                }

            }

            //qqm start 生产财务单据数据
            let orgName = '';
            let orgType = '';
            const stockOutApply = await tb_stockoutapply.findOne({
                where: {
                    stockoutapply_id: r.stockoutapply_id
                }
            });

            if (stockOutApply) {
                const user_id = stockOutApply.user_id;

                const custorgstructure = await tb_custorgstructure.findOne({
                    where: {
                        user_id
                    }
                });

                if (custorgstructure) {
                    const department_id = custorgstructure.department_id;

                    const department = await tb_department.findOne({
                        where: {
                            department_id
                        }
                    });

                    if (department) {
                        orgName = department.department_name;
                        orgType = department.department_type;
                    }
                }
            }

            await tb_financerecorditem.create({
                domain_id: user.domain_id,
                materiel_id: r.materiel_id,
                wms_type: 2,
                manage_type: 3,
                organization: orgName,
                org_type: orgType,
                store_amount: Number(r.waitoutapply_amount),
                store_price: Number(stockOutPrice)
            });
            //qqm end 生产财务单据数据

            let addalready = await tb_stockoutapplydetail.findOne({
                where: {
                    stockoutapplydetail_id: r.stockoutapplydetail_id
                }
            });
            if(addalready){
                addalready.already_amount = r.waitoutapply_amount + addalready.already_amount
                await addalready.save()
            }
            let inventoryaccount = await tb_inventoryaccount.create({
                domain_id: user.domain_id,
                bill_code: bill_code,
                order_id: r.stockoutapply_id,
                warehouse_id: r.warehouse_id,
                warehouse_zone_id: r.warehouse_zone_id,
                materiel_id: r.materiel_id,
                account_operate_amount: r.waitoutapply_amount,
                account_operate_type: 4,
            });

            let end = await tb_stockotherapplyout.findOne({
                where: {
                    stockotherapplyout_id: r.stockotherapplyout_id
                }
            });
            if(end){
                end.state = 0
                end.waitoutapply_amount = 0
                await end.save()
            }
        }

        let queryStr = `select sum(stockoutapplydetail_amount) as total_stockoutapplydetail_amount,
            sum(already_amount) as already_amount
            from tbl_erc_stockoutapplydetail where stockoutapply_id=?`;
        let replacements = [];
        let otherstockout_state = 1;
        replacements.push(doc.stockoutapply_id);
        let count = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(count && count.length>0){
            if(Number(count[0].already_amount) == 0 ){
                otherstockout_state = 0
            }else if (Number(count[0].already_amount) > 0 && Number(count[0].already_amount)<Number(count[0].total_stockoutapplydetail_amount)){
                otherstockout_state = 2
            }else if (Number(count[0].already_amount) > 0 && Number(count[0].already_amount)==Number(count[0].total_stockoutapplydetail_amount)){
                otherstockout_state = 3
            }
        }
        let ORder = await tb_otherstockout.findOne({
            where:{
                stockoutapply_id:doc.stockoutapply_id
            }
        });
        if(ORder){
            ORder.otherstockout_state = otherstockout_state
            await ORder.save()
        }
        

        common.sendData(res);
    } catch (error) {
        return common.sendFault(res, error);
    }
};



