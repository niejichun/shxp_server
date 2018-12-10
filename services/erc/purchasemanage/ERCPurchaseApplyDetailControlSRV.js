const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCPurchaseApplyDetailControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const sequelize = model.sequelize;
const moment = require('moment');
const task = require('../baseconfig/ERCTaskListControlSRV');
const project11 = require('../baseconfig/ERCProjectControlSRV');
const tb_order = model.erc_order;
const tb_ordermateriel = model.erc_ordermateriel;
const tb_purchaseapply = model.erc_purchaseapply;
const tb_purchaseapplydetail = model.erc_purchaseapplydetail;
const tb_common_apidomain = model.common_apidomain;
const tb_materiel = model.erc_materiel;
const tb_orderroom = model.erc_orderroom;
const tb_projectspacedetail = model.erc_projectspacedetail;
const tb_projectdetail = model.erc_projectdetail;


const tb_purchaseorder = model.erc_purchaseorder;//采购单(包含申请单)
const tb_purchasedetail = model.erc_purchasedetail;//采购单物料明细库存表
const tb_orderworkflow = model.erc_orderworkflow;

// 采购申请单明细接口
exports.ERCPurchaseApplyDetailControlResource = (req, res) => {
    let method = req.query.method;
    if (method==='initAct'){
        initAct(req,res)
    }else if (method==='getPuchaseApply') {
        getPuchaseApply(req, res)
    }else if (method==='getPuchaseApplyDetail'){
        getPuchaseApplyDetail(req,res)
    }else if (method==='getSupplerMateiel'){
        getSupplerMateiel(req,res)
    }else if (method==='getOrderId'){
        getOrderId(req,res)
    }else if (method==='addPurchaseApplyDetail'){
        addPurchaseApplyDetail(req,res)
    }else if (method==='saveOrderMateriel'){
        saveOrderMateriel(req,res)
    }else if (method==='setTask'){
        setTask(req,res)
    }else if (method==='deletePurchaseApplyDetail'){
        deletePurchaseApplyDetail(req,res)
    }else if (method==='getOrderpace'){
        getOrderpace(req,res)
    }else if(method==='getpuchaseApplyPrint'){
        getpuchaseApplyPrint(req,res)
    }else if(method==='getPOA'){
        getPOA(req,res)
    }else if(method==='getPOB'){
        getPOB(req,res)
    } else {
        common.sendError(res, 'common_01')
    }
};

// 初始化基础数据
async function initAct(req, res) {
    let returnData = {},user=req.user;
    returnData.batchInfo = GLBConfig.BATCHINFO;//批次
    returnData.projectInfo = GLBConfig.PROJECTORDER;//选择销售订单项目编号
    returnData.unitInfo = GLBConfig.UNITINFO;//单位
    returnData.mateUseState = GLBConfig.MATEUSESTATE;//单位
    returnData.materielSource = GLBConfig.MATERIELSOURCE;//物料来源
    returnData.materielManage = GLBConfig.MATERIELMANAGE;//管理模式
    returnData.materielSourceKind = GLBConfig.MATERIELSOURCEKIND;//来源分类
    returnData.purchaseApplyType = GLBConfig.PURCHASEAPPLYSTATE;//申请单状态
    returnData.order=[];
    let order = await tb_order.findAll({
        where :{
            state:GLBConfig.ENABLE,
            domain_id:user.domain_id,
            order_type:1,
            order_state:['SIGNED','REVIEWING','WORKING']
        }
    });
    for(let o of order){
        returnData.order.push({
            id:o.order_id,
            text:o.order_id,
            value:o.order_id
        })
    }
    common.sendData(res, returnData)
}
// 查询采购申请单列表
async function getPuchaseApply(req,res){
    let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData=[];
    let queryStr=`select a.purchaseapply_id,a.apply_state,a.approval_date,a.created_at,
         ap.username as apply_applicant,av.username as apply_approver
         from tbl_erc_purchaseapply a
         left join tbl_common_user ap on (a.apply_applicant=ap.user_id and ap.state=1)
         left join tbl_common_user av on (a.apply_approver=av.user_id and av.state=1)
         where a.state=1 `;
    if(doc.purchaseapply_id){
        queryStr+=' and a.purchaseapply_id=?';
        replacements.push(doc.purchaseapply_id)
    }
    let result =  await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
    for(let r of result){
        let result = JSON.parse(JSON.stringify(r));
        result.created_at = r.created_at.Format("yyyy-MM-dd");
        result.approval_date = (r.approval_date)?r.approval_date.Format("yyyy-MM-dd"):'';
        returnData.push(result)
    }
    common.sendData(res, returnData);

}
// 根据采单主键，查询采购申请单详情
async function getPuchaseApplyDetail(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user, replacements = [], returnData = {};

        let queryStr = `select m.*,pd.order_id,pd.project_space_id,pd.apply_money,pd.apply_number,pd.delivery_time,pd.remark,pd.purchaseapplydetail_id
        from tbl_erc_purchaseapplydetail pd
        left join tbl_erc_materiel m on pd.materiel_id=m.materiel_id 
        where pd.state=1 `;
        if (doc.purchaseapply_id) {
            queryStr += ' and pd.purchaseapply_id=?';
            replacements.push(doc.purchaseapply_id);
        }
        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?)';
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        // for(let r of result.data){
        //     let result = JSON.parse(JSON.stringify(r));
        // result.created_at = r.created_at.Format("yyyy-MM-dd");
        // result.delivery_time = (r.delivery_time)?r.delivery_time.Format("yyyy-MM-dd"):'';
        //     returnData.rows.push(result)
        // }
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
        return;
    }
}
// 查询本机构供应商的物料
async function getSupplerMateiel(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user, replacements = [], returnData = {};

        let api_name = 'ERCMATERIELCONTROL',dlist = [];

        dlist.push(user.domain_id);
        let resultApi = await tb_common_apidomain.findAll({
            where: {
                api_name: api_name,
                domain_id: user.domain_id,
                state: GLBConfig.ENABLE,
                effect_state:GLBConfig.ENABLE
            }
        });
        for(let r of resultApi) {
            dlist.push(r.follow_domain_id)
        }
        let queryInStr= ' in (' + dlist.join(",") + ')';

        let queryStr = `select m.*,d.domain_name
            from tbl_erc_materiel m
            left join tbl_common_domain d on (m.domain_id=d.domain_id and d.state=1)
            where m.state=1 and m.domain_id ` + queryInStr;
        if (doc.matNameOrCodeOrFormat) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?)';
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
            replacements.push('%' + doc.matNameOrCodeOrFormat + '%');
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows=[];
        for(let r of result.data){
            let rtemp = JSON.parse(JSON.stringify(r));
            rtemp.apply_number = 0;
            returnData.rows.push(rtemp)
        }
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
        return;
    }
}
// async function addPurchaseApplyDetail(req,res){
//     try {
//         let doc = common.docTrim(req.body),
//             user = req.user;
//
//         for(let d of doc){
//             let m = await tb_materiel.findOne({
//                 where: {
//                     materiel_id:d.materiel_id,
//                 }
//             });
//             if(m.domain_id == user.domain_id){
//                 let queryStr,replacements=[];
//                 queryStr=`select s.supplier_id,s.domain_id,s.supplier_proportion,m.materiel_code,sm.suppliermateriel_purchasepricetax
//                         from tbl_erc_materiel m left join tbl_erc_suppliermateriel sm on m.materiel_id = sm.materiel_id
//                         left join tbl_erc_supplier s on sm.supplier_id = s.supplier_id
//                         where m.materiel_id = ? and m.domain_id = ?
//                         order by s.supplier_proportion desc`;
//                 replacements.push(d.materiel_id);
//                 replacements.push(m.domain_id);
//                 let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
//                 logger.info(result)
//                 let count = 0,
//                     counta = 0,
//                     c = 0,
//                     endcount =0;
//                 for(let i=0;i<result.length;i++){
//                     count += result[i].supplier_proportion;
//                 }
//                 logger.info(count)
//                 //最后一个供应商不安比例分配，该物料的总采购量-之前每个供应商分配量
//                 if(count <= 100){
//                     for(let i=0;i<result.length;i++){
//                         if(i == result.length-1){
//                             endcount += d.apply_number * (100-counta) * result[result.length-1].suppliermateriel_purchasepricetax
//                         }
//                         if(i != result.length-1){
//                             counta += result[i].supplier_proportion;
//                             endcount += d.apply_number * result[i].supplier_proportion * result[i].suppliermateriel_purchasepricetax
//                         }
//                     }
//                     if(d.xm_order == 1){
//                         let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
//                             purchaseapply_id:d.purchaseapply_id,
//                             order_id:d.order_id,
//                             materiel_id:d.materiel_id,
//                             apply_number:d.apply_number,
//                             room_id:d.room_id,
//                             apply_money: endcount/100
//                         });
//                         //common.sendData(res, addPurchaseApplyDetail);
//                     }else{
//                         let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
//                             purchaseapply_id:d.purchaseapply_id,
//                             order_id:0,
//                             project_space_id:d.order_id,
//                             materiel_id:d.materiel_id,
//                             apply_number:d.apply_number,
//                             apply_money: endcount/100
//                         });
//                         //common.sendData(res, addPurchaseApplyDetail);
//                     }
//                 }
//             }else{
//                 if(d.xm_order == 1){
//                     let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
//                         purchaseapply_id:d.purchaseapply_id,
//                         order_id:d.order_id,
//                         materiel_id:d.materiel_id,
//                         apply_number:d.apply_number,
//                         room_id:d.room_id,
//                         apply_money: m.materiel_sale * d.apply_number
//                     });
//                     //common.sendData(res, addPurchaseApplyDetail);
//                 }else{
//                     let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
//                         purchaseapply_id:d.purchaseapply_id,
//                         project_space_id:d.order_id,
//                         order_id:0,
//                         materiel_id:d.materiel_id,
//                         apply_number:d.apply_number,
//                         apply_money: m.materiel_sale * d.apply_number
//                     });
//                     //common.sendData(res, addPurchaseApplyDetail);
//                 }
//             }
//         }
//         common.sendData(res);
//     } catch (error) {
//         common.sendFault(res, error);
//         return;
//     }
// }

// 根据采购申请单主键，增加采购申请单明细
async function addPurchaseApplyDetail(req,res){
    try {
        let doc = common.docTrim(req.body),
            user = req.user;

        if(doc && doc.length!=0){
            await tb_purchaseapply.update({
                order_type:doc[0].xm_order,
            }, {
                where: {
                    purchaseapply_id:doc[0].purchaseapply_id
                }
            });
        }

        for(let d of doc){
            let m = await tb_materiel.findOne({
                where: {
                    materiel_id:d.materiel_id,
                }
            });
            if(m.domain_id == user.domain_id){
                let queryStr,replacements=[];
                queryStr=`select s.supplier_id,s.domain_id,s.supplier_proportion,m.materiel_code,sm.suppliermateriel_purchasepricetax
                        from tbl_erc_materiel m left join tbl_erc_suppliermateriel sm on m.materiel_id = sm.materiel_id
                        inner join tbl_erc_supplier s on sm.supplier_id = s.supplier_id and s.state=1
                        where m.materiel_id = ? and m.domain_id = ?
                        order by s.supplier_proportion desc`;
                replacements.push(d.materiel_id);
                replacements.push(m.domain_id);
                let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
                logger.info(result)
                let count = 0,
                    counta = 0,//每次的个数
                    c = 0,
                    endcount =0;   //最终数量
                for(let i=0;i<result.length;i++){
                    count += result[i].supplier_proportion;
                }
                //最后一个供应商不安比例分配，该物料的总采购量-之前每个供应商分配量
                for(let i=0;i<result.length;i++){
                    if(i == result.length-1){
                        endcount += (d.apply_number -counta) * result[result.length-1].suppliermateriel_purchasepricetax
                    }
                    if(i != result.length-1){
                        counta += Math.ceil(d.apply_number * (result[i].supplier_proportion/count));
                        endcount += Math.ceil(d.apply_number * (result[i].supplier_proportion/count)) * result[i].suppliermateriel_purchasepricetax
                    }
                }
                if(d.xm_order == 1){
                    let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
                        purchaseapply_id:d.purchaseapply_id,
                        order_id:d.order_id,
                        materiel_id:d.materiel_id,
                        apply_number:d.apply_number,
                        room_id:d.room_id,
                        apply_money: endcount
                    });
                    //common.sendData(res, addPurchaseApplyDetail);

                }else{
                    let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
                        purchaseapply_id:d.purchaseapply_id,
                        order_id:0,
                        project_space_id:d.order_id,
                        materiel_id:d.materiel_id,
                        apply_number:d.apply_number,
                        apply_money: endcount
                    });
                    //common.sendData(res, addPurchaseApplyDetail);
                }

            }else{
                if(d.xm_order == 1){
                    let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
                        purchaseapply_id:d.purchaseapply_id,
                        order_id:d.order_id,
                        materiel_id:d.materiel_id,
                        apply_number:d.apply_number,
                        room_id:d.room_id,
                        apply_money: m.materiel_sale * d.apply_number
                    });
                    //common.sendData(res, addPurchaseApplyDetail);
                }else{
                    let addPurchaseApplyDetail = await tb_purchaseapplydetail.create({
                        purchaseapply_id:d.purchaseapply_id,
                        project_space_id:d.order_id,
                        order_id:0,
                        materiel_id:d.materiel_id,
                        apply_number:d.apply_number,
                        apply_money: m.materiel_sale * d.apply_number
                    });
                    //common.sendData(res, addPurchaseApplyDetail);
                }
            }
        }
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
        return;
    }
}

// 删除采购申请单明细，根据申请单明细主键
async function deletePurchaseApplyDetail(req,res){
    try {
        let doc = common.docTrim(req.body),
            user = req.user;
        let deletePurchaseApplyDetail = await tb_purchaseapplydetail.findOne({
            where: {
                purchaseapplydetail_id:doc.purchaseapplydetail_id
            }
        });
        if (deletePurchaseApplyDetail) {
            deletePurchaseApplyDetail.state =  GLBConfig.DISABLE;
            await deletePurchaseApplyDetail.save()
        } else {
            common.sendError(res, 'puchase_apply_03');
            return
        }
        common.sendData(res, deletePurchaseApplyDetail);

    } catch (error) {
        return common.sendFault(res, error);
    }
}

// 根据order_id查询订单户型
async function getOrderpace(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user, replacements = [], returnData = [];

        let queryStr = `select * from tbl_erc_orderroom where state=1 and order_id=?`;
        replacements.push(doc.order_id);
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(result && result.length>0){
            for(let r of result){
                returnData.push({
                    id:r.room_id,
                    text:r.room_name,
                    value:r.room_id
                })
            }
        }
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
        return;
    }
}

// 打印采购申请单用的查询模块
async function getpuchaseApplyPrint(req,res){
    let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData={},result;
    try{
        replacements.push(doc.purchaseapply_id);
        // let queryStr=`select p.purchaseorder_id,pd.domain_name as puchaseDomainName,sd.domain_name as orderDomainName
        // from tbl_erc_purchaseorder p
        // left join tbl_common_domain pd on (p.purchaseorder_domain_id=pd.domain_id and pd.state=1)
        // left join tbl_common_domain sd on (p.purchaseorder_domain_id=sd.domain_id and sd.state=1)
        // where p.state=1 and p.purchaseorder_id=?`;
        // result = await sequelize.query(queryStr, {replacements: replacements,type: sequelize.QueryTypes.SELECT});
        // returnData.purchaseorder_id=result[0].purchaseorder_id;
        // returnData.puchaseDomainName=result[0].puchaseDomainName;
        // returnData.orderDomainName=result[0].orderDomainName;
        // returnData.date=[];

        queryStr=`select m.*,pad.apply_number from tbl_erc_purchaseapplydetail pad 
        left join tbl_erc_materiel m on (pad.materiel_id=m.materiel_id and m.state=1) 
        where pad.state=1 and pad.purchaseapply_id=?`;
        result = await sequelize.query(queryStr, {replacements: replacements,type: sequelize.QueryTypes.SELECT});
        returnData.data=result;
        common.sendData(res, returnData);
    }catch (error){
        common.sendFault(res, error);
    }

}

// 发送采购申请单任务
async function setTask(req,res){
    try{// user, taskName, taskType  4, taskPerformer, taskReviewCode, taskDescription
        let user=req.user;
        let doc = req.body;
        // 申请状态 0待提交，1已提交，2通过,3拒绝

        let purchaseapply = await tb_purchaseapply.findOne({
            where:{
                state:GLBConfig.ENABLE,
                purchaseapply_id:doc.purchaseapply_id
            }
        });
        let taskName = '采购申请';
        let taskDescription = doc.purchaseapply_id + '  采购申请';
        let groupId = common.getUUIDByTime(30);
        // user, taskName, taskType, taskPerformer, taskReviewCode, taskDescription, reviewId, taskGroup
        let taskResult = await task.createTask(user,taskName,2,'',doc.purchaseapply_id,taskDescription,'',groupId);
        if(!taskResult){
            return common.sendError(res, 'task_02');
        }else{
            if(purchaseapply){
                purchaseapply.apply_state=1;
                await purchaseapply.save()
            }
            common.sendData(res, {})
        }

    }catch (error){
        common.sendFault(res, error);
    }
}
// 任务审核后,修改采购单状态
async function modifyPuchaseApplyState(applyState,description,purchaseApplyId,applyApprover,applyDomain_id){
    let NowDoMainId = applyDomain_id

    await tb_purchaseapply.update({
        apply_state:applyState,
        approval_date:new Date(),
        apply_approver:applyApprover,
        description:description
    }, {
        where: {
            purchaseapply_id:purchaseApplyId
        }
    });

    if(applyState==2){
        let count = 0;
        // 申请状态 0待提交，1已提交，2通过,3拒绝
        let allmoney = await tb_purchaseapplydetail.findAll({
            where :{
                state:GLBConfig.ENABLE,
                purchaseapply_id:purchaseApplyId
            }
        });
        //计算当前申请单总金额count
        for(let a of allmoney){
            count += a.apply_money;
        }

        let all = await tb_purchaseapplydetail.findOne({
            where :{
                state:GLBConfig.ENABLE,
                purchaseapply_id:purchaseApplyId
            }
        });

        let addalready = await tb_projectspacedetail.findOne({
            where: {
                project_space_id:all.project_space_id
            }
        });

        let countEnd;

        if(addalready){
            countEnd = await tb_projectdetail.findOne({
                where: {
                    project_detail_id:addalready.project_detail_id
                }
            });

            addalready.material_total_final_price = count;
            await addalready.save();
            await project11.calculateTotalPrice(addalready.project_detail_id);

        }


        let order = await tb_purchaseapplydetail.findAll({
            attributes:['order_id'],
            where:{
                state:1,
                purchaseapply_id:purchaseApplyId
            },
            group:'order_id'
        });

        for(let o of order){
            let applyDetail = await tb_purchaseapplydetail.findAll({
                where:{
                    state:1,
                    purchaseapply_id:purchaseApplyId,
                    order_id:o.order_id,
                }
            });
            for(let ad of applyDetail){
                let addOrderMateriel = await tb_ordermateriel.create({
                    order_id:o.order_id,
                    materiel_id:ad.materiel_id,
                    materiel_amount:ad.apply_number,
                    change_state:2,
                    room_id:ad.room_id
                })
            }
        }
        //开始  生成采购单
        let datePP = new Date();

        let queryStr,replacements=[],supplerPurchase=[],thisNum=0,thisAllNum=0;
        queryStr=`select m.domain_id
                    from tbl_erc_purchaseapplydetail tp,tbl_erc_materiel m  
                    where tp.materiel_id = m.materiel_id and tp.purchaseapply_id = ?
                    GROUP BY m.domain_id `;
        replacements.push(purchaseApplyId);
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(result && result.length>0){
            for (let r of result) {
                //非本机构物料，向对应domainId的机构采购
                if(r.domain_id != NowDoMainId){
                    let POID = await Sequence.genPurchaseOrderID(NowDoMainId);
                    let SOID = await Sequence.genSalesOrderID(NowDoMainId);

                    // 采购单
                    let addNcaPurchaseOrder = await tb_purchaseorder.create({
                        purchaseorder_id:POID,                      //采购单号，PO开头
                        purchaseorder_domain_id:NowDoMainId, //采购方
                        order_id:SOID,                              //销售单号
                        order_domain_id:r.domain_id,                //销售方
                        purchaseorder_state:2                       //采购单状态，0未审核，1审核拒绝，2审核通过
                    });

                    //销售单
                    let addNcaOrder = await tb_order.create({
                        order_id: SOID,                             //销售单号
                        domain_id: r.domain_id,                     //销售方
                        purchase_order_id: POID,                    //采购单号
                        purchase_domain_id: NowDoMainId,     //采购方
                        order_type: 8,                              //订单类型，8采购订单，OTYPEINFO
                        order_state:'NEW'
                    });


                    ///采购单明细
                    replacements=[];
                    queryStr=`select tp.materiel_id ,tp.apply_number,tp.project_space_id as order_ids ,m.materiel_sale 
                        from tbl_erc_purchaseapplydetail tp, tbl_erc_materiel m
                        where tp.state = 1 and tp.materiel_id = m.materiel_id and tp.purchaseapply_id = ? and m.domain_id=?`;
                    replacements.push(purchaseApplyId);
                    replacements.push(r.domain_id);
                    let resultDetail = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});


                    //将resultDetail按matriel_id汇总
                    let map = {}, dest = [],existState=0;
                    for(let sp of resultDetail){
                        dest.push({
                            materiel_id:sp.materiel_id,
                            purchase_num:sp.apply_number,
                            purchase_price:sp.materiel_sale,
                            order_ids:sp.order_ids
                        });
                        map[sp.materiel_id] = sp;
                    }

                    for(let rd of dest){
                        //采购单明细
                        let addNcaPurchaseDetail = await tb_purchasedetail.create({
                            purchase_id: POID,
                            materiel_id: rd.materiel_id,
                            purchase_number: rd.purchase_num * countEnd.space_count,
                            purchase_price:rd.purchase_price,
                            order_ids:rd.order_ids
                        });
                        //销售单明细
                        let addNcaOrderMateriel = await tb_ordermateriel.create({
                            order_id: SOID,
                            materiel_id: rd.materiel_id,
                            materiel_amount: rd.purchase_num,
                        });
                    }

                    let orderworkflow = await tb_orderworkflow.findOne({
                        where: {
                            order_id: SOID,
                            orderworkflow_state: 'NEW'
                        }
                    });

                    if (!orderworkflow) {
                        await tb_orderworkflow.create({
                            order_id: SOID,
                            orderworkflow_state: 'NEW',
                            orderworkflow_desc: '新建'
                        });
                    }
                }else{
                    replacements=[];
                    //本机构物料，向本机构供应商采购，按比例分配
                    queryStr=`select tp.materiel_id ,tp.apply_number,tp.project_space_id as order_ids from tbl_erc_purchaseapplydetail tp, tbl_erc_materiel m
                                where tp.state = 1
                                 and tp.materiel_id = m.materiel_id
                                  and tp.purchaseapply_id = ? and m.domain_id=?`;
                    replacements.push(purchaseApplyId);
                    replacements.push(r.domain_id);
                    let resultDetail = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
                    for(let rd of resultDetail){
                        //查询机构对应供应商的采购比例
                        replacements=[];
                        queryStr='select s.supplier_proportion,s.supplier_id,sm.suppliermateriel_purchaseprice,sm.suppliermateriel_purchasepricetax  ' +
                            'from tbl_erc_supplier s,tbl_erc_suppliermateriel sm ' +
                            'where s.state=1 and sm.state=1 and s.supplier_id=sm.supplier_id and s.domain_id=? and sm.materiel_id=? ' +
                            'order by s.supplier_proportion desc';
                        replacements.push(NowDoMainId);
                        replacements.push(rd.materiel_id);
                        let resultSupplier = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
                        let total_proportion=0;
                        for(let i=0;i<resultSupplier.length;i++){
                            total_proportion+=resultSupplier[i].supplier_proportion;
                        }
                        thisNum=0;
                        thisAllNum=0;
                        for(let i=0;i<resultSupplier.length;i++){
                            //最后一个供应商不安比例分配，该物料的总采购量-之前每个供应商分配量
                            if(i == resultSupplier.length-1){
                                if(rd.apply_number-thisAllNum!=0){
                                    supplerPurchase.push({
                                        purchase_domain_id:NowDoMainId,
                                        supplier_id:resultSupplier[i].supplier_id,
                                        materiel_id:rd.materiel_id,
                                        purchase_num:rd.apply_number-thisAllNum,
                                        purchase_price:resultSupplier[i].suppliermateriel_purchasepricetax,
                                        order_ids:rd.order_ids
                                    })
                                }
                            }else{
                                thisNum=Math.round(rd.apply_number*(resultSupplier[i].supplier_proportion/total_proportion));
                                thisAllNum+=thisNum;
                                if(thisNum!=0){
                                    supplerPurchase.push({
                                        purchase_domain_id:NowDoMainId,
                                        supplier_id:resultSupplier[i].supplier_id,
                                        materiel_id:rd.materiel_id,
                                        purchase_num:thisNum,
                                        purchase_price:resultSupplier[i].suppliermateriel_purchasepricetax,
                                        order_ids:rd.order_ids
                                    })
                                }
                            }
                        }
                    }
                    //将supplerPurchase按供应商以及物料汇总
                    let mapSuppler = {}, destSuppler = [],existState=0;
                    for(let sp of supplerPurchase){
                        if(!mapSuppler[sp.supplier_id]){
                            destSuppler.push({
                                purchase_domain_id:sp.purchase_domain_id,
                                supplier_id:sp.supplier_id,
                                data: [{
                                    materiel_id:sp.materiel_id,
                                    purchase_num:sp.purchase_num,
                                    purchase_price:sp.purchase_price,
                                    order_ids:sp.order_ids
                                }]
                            });
                            mapSuppler[sp.supplier_id] = sp;
                        }else{
                            for(let ds of destSuppler){
                                if(ds.supplier_id == sp.supplier_id){
                                    ds.data.push({
                                        materiel_id:sp.materiel_id,
                                        purchase_num:sp.purchase_num,
                                        purchase_price:sp.purchase_price,
                                        order_ids:sp.order_ids
                                    });
                                    break;
                                }
                            }
                        }
                    }
                    // logger.info(destSuppler);
                    for(let d of destSuppler){
                        let POID = await Sequence.genPurchaseOrderID(NowDoMainId);
                        let SOID = await Sequence.genSalesOrderID(NowDoMainId);

                        // 采购单
                        let addNcaPurchaseOrder = await tb_purchaseorder.create({
                            purchaseorder_id:POID,                      //采购单号，PO开头
                            purchaseorder_domain_id:NowDoMainId, //采购方
                            order_id:'',                                //销售单号
                            order_domain_id:NowDoMainId,         //销售方
                            purchaseorder_state:2,                      //采购单状态，0未审核，1审核拒绝，2审核通过
                            supplier_id:d.supplier_id,                  //供应商id
                            created_at:datePP                 //如果记录当前时间，第二天的mrp会重复计算
                        });

                        let space_count=1;
                        if(countEnd){
                            //施工项订单
                            space_count=countEnd.space_count
                        }
                        for(let ddata of d.data){
                            //采购单明细
                            let addNcaPurchaseDetail = await tb_purchasedetail.create({
                                purchase_id: POID,
                                materiel_id: ddata.materiel_id,
                                purchase_number: ddata.purchase_num * space_count,
                                purchase_price:ddata.purchase_price,
                                created_at:datePP,
                                order_ids:ddata.order_ids
                            });
                        }
                    }
                }
            }
        }

        //结束


    }
}
// 查询已签约，审核中，已开工的订单
async function getPOA(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user=req.user;
        let returnData = [];
        let order = await tb_order.findAll({
            where :{
                state:GLBConfig.ENABLE,
                domain_id:user.domain_id,
                order_type:1,
                order_state:['SIGNED','REVIEWING','WORKING']
            }
        });
        for(let o of order){
            returnData.push({
                id:o.order_id,
                text:o.order_id,
                value:o.order_id
            })
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
        return
    }
}
// 查询施工空间明细
async function getPOB(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user=req.user;
        let returnData = [];
        let order = await tb_projectspacedetail.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });
        for(let o of order){
            returnData.push({
                id:o.project_space_id,
                text:o.project_space_id,
                value:o.project_space_id
            })
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
        return
    }
}
exports.modifyPuchaseApplyState = modifyPuchaseApplyState;
