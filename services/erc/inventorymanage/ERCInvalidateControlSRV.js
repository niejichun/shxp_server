const fs = require('fs');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCSupplierMaterielControl');
const task = require('../baseconfig/ERCTaskListControlSRV');
const model = require('../../../model');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const moment = require('moment');

// tables
const sequelize = model.sequelize;
const tb_user = model.common_user;
const tb_domain = model.common_domain;
const tb_invalidateorder = model.erc_invalidateorder;
const tb_invalidateApplyorder = model.erc_invalidateApplyorder;
const tb_stockitem = model.erc_stockitem;//安全库存明细
const tb_warehouse = model.erc_warehouse;
const tb_stockmap = model.erc_stockmap;
const tb_warehousezone = model.erc_warehousezone;
const tb_materiel = model.erc_materiel;
const tb_netdemand = model.erc_netdemand;//净需求表

exports.ERCInvalidateControlResource = (req, res) => {
    let method = req.query.method
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'initApply') {
        initApply(req, res)
    } else if (method === 'search') {
        searchAct(req, res)
    } else if (method === 'searchTable') {
        searchTable(req, res)
    } else if (method === 'search_mtable') {
        search_mTable(req, res)
    } else if (method === 'getInvalidateApply') {
        getInvalidateApply(req, res)
    } else if (method === 'add') {
        addMat(req, res)
    } else if (method === 'add_apply_order') {
        addApplyOrder(req, res)
    } else if (method === 'modify') {
        modify_mTable(req, res)
    } else if (method === 'delete') {
        delete_mTable(req, res)
    } else if (method === 'setTask') {
        setTask(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
};
//初始化数据
async function initAct(req, res) {
    try {

        let doc = common.docTrim(req.body), user = req.user;
        let returnData = {
            invalidateorderState: GLBConfig.INVALIDATEORDERSTATE,//报废单状态
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
//报废品列表
async function searchAct(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};

        let replacements = [];

        let queryStr = 'select * from tbl_erc_invalidateorder where state = 1 and domain_id'+ await FDomain.getDomainListStr(req);

        if (doc.search_text) {
            queryStr += ' and invalidateorder_id like ?';
            replacements.push('%' + doc.search_text + '%');
        }

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

/**订单中的物料列表，信息由模板、订单、物料三者关联而来，关联关系由【生成物料单】操作建立
 * 用户也可在模板的物料单之外添加物料，所添加的物料应从系统已有的物料列表中选择
 **/
async function addMat(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let addOM = await tb_invalidateorder.create({
            invalidateorder_id: await Sequence.genInvalidateOrderID(user.domain),
            domain_id: user.domain_id,
            user_id: user.user_id,
            invalidateorder_state: '1'
        });
        let retData = JSON.parse(JSON.stringify(addOM));
        common.sendData(res, retData);

    } catch (error) {
        common.sendFault(res, error);
    }
};
//创建申请
async function initApply(req, res) {
    try {

        let doc = common.docTrim(req.body), user = req.user;
        let returnData = {
            invalidateorderState: GLBConfig.INVALIDATEORDERSTATE,//报废单状态
            stockModelInfo: GLBConfig.MATERIELMANAGE, //库存管理模式
            reasonInfo: GLBConfig.INVALIDATEORDERREASON, //报废原因
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
//获取报废品申请列表
async function getInvalidateApply(req, res) {
    let doc = common.docTrim(req.body), user = req.user, replacements = [], returnData = [];
    //let queryStr=`select * from tbl_erc_invalidateorder where state=1 `;


    //let queryStr = `select a.*,b.name from tbl_erc_invalidateorder a left join tbl_common_user b on a.user_id = b.user_id where a.state=1 `;

    let queryStr=`select a.*,
         ap.name as apply_applicant,av.name as apply_approver
         from tbl_erc_invalidateorder a
         left join tbl_common_user ap on (a.user_id=ap.user_id and ap.state=1)
         left join tbl_common_user av on (a.performer_user_id=av.user_id and av.state=1)
         where a.state=1 `;

    if (doc.invalidateorder_id) {
        queryStr += ' and a.invalidateorder_id=?';
        replacements.push(doc.invalidateorder_id)
    }

    let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
    for (let r of result) {
        let result = JSON.parse(JSON.stringify(r));
        result.created_at = r.created_at.Format("yyyy-MM-dd");
        returnData.push(result)
    }
    common.sendData(res, returnData);

}

//增加报废物料库存
let searchTable = async (req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        let queryStr = null;
        let replacements = [];
        if (doc.stock_model === '2') {
            queryStr = `select s.stockmap_id,s.warehouse_id,s.domain_id,s.warehouse_zone_id,s.safe_amount,s.min_purchase_amount,
        s.current_amount,s.trigger_safe_model,w.warehouse_name,wz.zone_name,m.materiel_id,
        m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit,m.materiel_manage from tbl_erc_stockmap s
        left join tbl_erc_warehouse w on (s.warehouse_id = w.warehouse_id and w.state=1)
        left join tbl_erc_materiel m on (s.materiel_id = m.materiel_id and m.state = 1)
        left join tbl_erc_warehousezone wz on (s.warehouse_zone_id = wz.warehouse_zone_id and wz.state = 1)
        where s.state = 1 and s.current_amount>0 and m.materiel_manage = 2 and s.is_idle_stock = 1 and s.domain_id ` + await FDomain.getDomainListStr(req);
        }
        if (doc.stock_model === '1') {
            queryStr = `select s.stockmap_id,sk.warehouse_id,sk.warehouse_zone_id,sk.item_amount,s.domain_id,w.warehouse_name,wz.zone_name,m.materiel_id,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit,m.materiel_manage
	    from tbl_erc_stockmap s
        left join tbl_erc_materiel m on (s.materiel_id = m.materiel_id and m.state = 1)
	    left join tbl_erc_stockitem sk on(s.stockmap_id = sk.stockmap_id)
        left join tbl_erc_warehouse w on (sk.warehouse_id = w.warehouse_id and w.state=1)
        left join tbl_erc_warehousezone wz on (sk.warehouse_zone_id = wz.warehouse_zone_id and wz.state = 1)
        where s.state = 1 and sk.item_amount>0 and m.materiel_manage = 1 and s.domain_id` + await FDomain.getDomainListStr(req);
        }

        if (doc.matNameOrCodeOrFormat) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ? or w.warehouse_name like ? or wz.zone_name like ?)';
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
        }
        queryStr += ' order by s.created_at desc';

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];

        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.created_at ? moment(r.created_at).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//创建报废申请列表
async function addApplyOrder(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        logger.info(doc)

        let addorder = await tb_invalidateApplyorder.findOne({
            where: {
                stockmap_id: doc.stockmap_id,
                materiel_id: doc.materiel_id,
                warehouse_id: doc.warehouse_id,
                invalidateorder_id: doc.invalidateorder_id,
                state: GLBConfig.ENABLE
            }
        });
        if(addorder){
            common.sendError(res, 'invalidateApplyorder_02');
            return
        }

        let addOM = await tb_invalidateApplyorder.create({
            invalidateorder_id: doc.invalidateorder_id,
            stockmap_id: doc.stockmap_id,
            materiel_id: doc.materiel_id,
            warehouse_id: doc.warehouse_id,
            warehouse_zone_id: doc.warehouse_zone_id,
            invalidateapplyorder_amount: 0,
            invalidatemateriel_type: doc.invalidatemateriel_type
        });
        let retData = JSON.parse(JSON.stringify(addOM));
        common.sendData(res, retData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//物料列表
let search_mTable = async (req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        let queryStr = `select ino.*, w.warehouse_name, wz.zone_name,m.materiel_id,m.materiel_code, m.materiel_name,m.materiel_format,m.materiel_unit,m.materiel_manage
                from tbl_erc_invalidateapplyorder ino
                left join tbl_erc_materiel m on (ino.materiel_id = m.materiel_id and m.state = 1)
                left join tbl_erc_warehouse w on (ino.warehouse_id = w.warehouse_id and w.state=1)
                left join tbl_erc_warehousezone wz on (ino.warehouse_zone_id = wz.warehouse_zone_id and wz.state = 1) where ino.state = 1`

        let replacements = [];

        if (doc.invalidateorder_id) {
            queryStr += ' and ino.invalidateorder_id=?';
            replacements.push(doc.invalidateorder_id)
        }

        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ? or w.warehouse_name like ? or wz.zone_name like ?)';
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
        }

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let resultTemp = JSON.parse(JSON.stringify(r));
            resultTemp.invalidateapplyorder_amount = r.invalidateapplyorder_amount?r.invalidateapplyorder_amount:0;
            returnData.rows.push(resultTemp)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//修改物料信息
let modify_mTable = async (req, res) => {
    try {

        let doc = common.docTrim(req.body),
            user = req.user;

        if(doc.old.invalidatemateriel_type == 1){
            let safe = await tb_stockitem.findOne({
                where:{
                    stockmap_id:doc.old.stockmap_id,
                    warehouse_zone_id:doc.old.warehouse_zone_id,
                    warehouse_id:doc.old.warehouse_id
                }
            });
            if(doc.new.invalidateapplyorder_amount>safe.item_amount){
                common.sendError(res, 'invalidateApplyorder_01');
                return
            }
        }else{
            let sale = await tb_stockmap.findOne({
                where:{
                    stockmap_id:doc.old.stockmap_id,
                }
            });
            if(doc.new.invalidateapplyorder_amount>sale.current_amount){
                common.sendError(res, 'invalidateApplyorder_01');
                return
            }
        }

        let modifyLand = await tb_invalidateApplyorder.findOne({
            where: {
                invalidateapplyorder_id: doc.old.invalidateapplyorder_id
            }
        });

        if (modifyLand) {
            modifyLand.invalidateapplyorder_amount=doc.new.invalidateapplyorder_amount,
            modifyLand.invalidateorder_reason=doc.new.invalidateorder_reason
            await modifyLand.save()
        } //else {
        //     common.sendError(res, 'landagent_01');
        //     return
        // }

        common.sendData(res, modifyLand);

    } catch (error) {
        return common.sendFault(res, error);
    }
};
//报废任务
async function setTask(req,res){  //报废单号提交
    try{// user, taskName, taskType  4, taskPerformer, taskReviewCode, taskDescription
        let user=req.user;
        let doc = req.body;
        // 申请状态 1待提交，2待审批，3未通过,4已报废

        let purchaseapply = await tb_invalidateorder.findOne({
            where:{
                state:GLBConfig.ENABLE,
                invalidateorder_id:doc.invalidateorder_id
            }
        });
        let taskName = '报废申请';
        let taskDescription = doc.invalidateorder_id + '  报废申请';
        let groupId = common.getUUIDByTime(30);
        // user, taskName, taskType, taskPerformer, taskReviewCode, taskDescription, reviewId, taskGroup
        let taskResult = await task.createTask(user,taskName,9,'',doc.invalidateorder_id,taskDescription,'',groupId);
        if(!taskResult){
            return common.sendError(res, 'task_02');
        }else{
            if(purchaseapply){
                purchaseapply.invalidateorder_state= '2';
                await purchaseapply.save()
            }
            common.sendData(res, purchaseapply)
        }

    }catch (error){
        common.sendFault(res, error);
    }
};
//删除物料
let delete_mTable = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let delTemp = await tb_invalidateApplyorder.findOne({
            where: {
                invalidateapplyorder_id: doc.invalidateapplyorder_id,
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


