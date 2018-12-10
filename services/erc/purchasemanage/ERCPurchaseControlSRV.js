const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCPurchaseControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const sequelize = model.sequelize;
const moment = require('moment');

const tb_domain = model.common_domain;
const tb_user = model.common_user;
const tb_alldemand = model.erc_alldemand;//总需求表
const tb_netdemand = model.erc_netdemand;//净需求表
const tb_order = model.erc_order;//销售单
const tb_ordermateriel = model.erc_ordermateriel;//销售单物料明细
const tb_purchaseorder = model.erc_purchaseorder;//采购单(包含申请单)
const tb_purchasedetail = model.erc_purchasedetail;//采购单物料明细
const tb_warehouse = model.erc_warehouse//仓库
const tb_stockmap = model.erc_stockmap;//库存表
const tb_purchaseapply = model.erc_purchaseapply;//采购单申请表
const tb_orderworkflow = model.erc_orderworkflow;
const tb_thirdsignuser = model.erc_thirdsignuser;

const tb_productivetask = model.erc_productivetask;// 生产任务单
const tb_productivetaskdetail = model.erc_productivetaskdetail;// 生产任务单明细（投料）
const tb_productivetaskrelated = model.erc_productivetaskrelated;// 生产任务单明细（联产品）
const tb_productplandetail = model.erc_productplandetail;// 产品规划明细
const tb_productplan = model.erc_productplan;// 产品规划
const tb_productplanrelated = model.erc_productplanrelated;// 产品规划（联产品）

const ERCBusinessCustomerControlSRV = require('../baseconfig/ERCBusinessCustomerControlSRV');

// mrp主接口
exports.ERCPurchaseControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'dataExtract') {
        dataExtract(req, res);
    } else if (method==='initAct'){
        initAct(req,res)
    } else if (method==='getAllDemand'){
        getAllDemand(req,res)
    } else if (method==='getNetDemand'){
        getNetDemand(req,res)
    } else if (method==='getSupplerUser'){
        getSupplerUser(req,res)
    } else if (method==='getPurchaseOrder'){
        getPurchaseOrder(req,res)
    } else if (method==='addPuchaseApply'){
        addPuchaseApply(req,res)
    } else if (method==='getPuchaseApply'){
        getPuchaseApply(req,res)
    } else if (method==='initPuchase'){
        initPuchase(req,res)
    } else if (method==='initApplicent'){
        initApplicent(req,res)
    } else if (method==='setAllDemand'){
        setAllDemand(req,res)
    } else if (method==='setNetDemand') {
        setNetDemand(req, res)
    } else if (method==='setPurchase'){
        setPurchase(req,res)
    } else if (method==='setProduction'){
        setProduction(req,res)
    } else if (method==='deletePurchaseApply'){
        deletePurchaseApply(req,res)
    } else {
        common.sendError(res, 'common_01')
    }
};

// 获得实施库存
async function checkInventory(params,allDemand){
    let queryStr,replacements=[],netDemandAmount=0;//netDemandAmount代表缺少的数量
    //判断库存
    queryStr=`select s.* from tbl_erc_stockmap s,tbl_erc_warehouse w
        where s.state=1 and w.state=1 and s.warehouse_id=w.warehouse_id
        and w.domain_id=? and (order_id is null or order_id='') and s.materiel_id=?  `;
    replacements.push(params.nowDoaminId);
    replacements.push(allDemand.materiel_id);
    let resultStockmap = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
    if(resultStockmap && resultStockmap.length>0) {
        let alreadyNum = 0;
        for(let sm of resultStockmap){
            if(allDemand.demand_amount-alreadyNum<sm.current_amount){
                await tb_stockmap.update({
                    order_id: allDemand.order_id,
                    current_amount: allDemand.demand_amount-alreadyNum,
                    is_idle_stock: 0
                }, {
                    where: {
                        stockmap_id:sm.stockmap_id
                    }
                });
                await tb_stockmap.create({
                    domain_id:sm.domain_id,
                    warehouse_id:sm.warehouse_id,
                    materiel_id:sm.materiel_id,
                    warehouse_zone_id:sm.warehouse_zone_id,
                    current_amount:sm.current_amount-(allDemand.demand_amount-alreadyNum),
                    materiel_bar_code:'',
                    is_idle_stock: 1
                });
                alreadyNum+=allDemand.demand_amount;
                break
            }else{
                await tb_stockmap.update({
                    order_id: allDemand.order_id,
                    is_idle_stock: 0
                }, {
                    where: {
                        stockmap_id:sm.stockmap_id
                    }
                });
                alreadyNum+=sm.current_amount;
            }
        }
        netDemandAmount=allDemand.demand_amount-alreadyNum
    }else{
        netDemandAmount=allDemand.demand_amount
    }

    return netDemandAmount
}
// mrp总需求模块
async function allDemand(params){
    try{
        let queryStr,replacements=[],insertDate=[];
        // queryStr=`
        //     select om.materiel_id,om.order_id,sum(om.materiel_amount) as materiel_amount,o.order_type
        //     from tbl_erc_ordermateriel om,tbl_erc_order o
        //     where om.state=1 and o.state=1 and om.order_id=o.order_id
        //     and o.domain_id=? and om.created_at>=? and om.created_at<=?
        //     and (
        //     (o.order_type=1 and o.order_state in ('SIGNED','REVIEWING','WORKING') and (om.change_state is null or om.change_state=2))
        //     or o.order_type in (8)
        //     )
        //     group by om.materiel_id,om.order_id `;

        queryStr=`
            select om.materiel_id,om.order_id,sum(om.materiel_amount) as materiel_amount,o.order_type
            from tbl_erc_ordermateriel om,tbl_erc_order o
            where om.state=1 and o.state=1 and om.order_id=o.order_id
            and o.domain_id=? and om.created_at>=? and om.created_at<=?
            and o.order_state in ('WORKING','SHIPPED') 
            group by om.materiel_id,om.order_id `;

        replacements.push(params.nowDoaminId);
        replacements.push(params.beginTime);
        replacements.push(params.endTime);
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});

        if(result && result.length>0){
            for(let r of result){
                insertDate.push({
                    materiel_id: r.materiel_id,
                    order_id: r.order_id,
                    demand_amount: r.materiel_amount,
                    mrp_date: params.yesterday,
                    mrp_domain_id: params.nowDoaminId
                });
            }
            let addNcaAlldemand = await tb_alldemand.bulkCreate(insertDate);
        }
    } catch (error) {
        throw error;
    }
}
// mrp净需求模块
async function netDemand(params){
    try{
        // //materiel_manage 1安全库存，2订单管理,
        // //materiel_source 1自制，2外购，3委外加工
        // //materiel_amto  1品牌商品，2定制商品，3贴牌商品
        let queryStr,replacements=[],netDemandAmount=0;
        queryStr=`select a.*,m.domain_id,m.materiel_manage,m.materiel_source,materiel_amto 
            from tbl_erc_alldemand a,tbl_erc_materiel m
            where a.state=1 and m.state=1 and a.materiel_id=m.materiel_id and a.mrp_date=? and a.mrp_domain_id=?`;
        replacements.push(params.yesterday);
        replacements.push(params.nowDoaminId);
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(result && result.length>0){
            for(let r of result){
                //netDemandAmount代表缺少的数量
                netDemandAmount = await checkInventory(params,r);
                //保存净需求
                if(netDemandAmount>0){
                    let addNcaNetdemand = await tb_netdemand.create({
                        materiel_id: r.materiel_id,
                        order_id: r.order_id ? r.order_id : '',
                        netdemand_amount: netDemandAmount,
                        mrp_date: r.mrp_date,
                        mrp_domain_id: r.mrp_domain_id
                    });
                }
            }
        }
    } catch (error) {
        throw error
    }
}
async function getStockAVGPrice(product_id,level){
    let queryStr,replacements=[],productDetailPrice=0;
    // 产品单价 = 下级投料的库存平均单价总和+工序金额*工价系数

    // 下级投料的库存平均单价总和
    queryStr=`select min(store_price) as min_store_price,s.materiel_id 
            from tbl_erc_stockmap s,tbl_erc_productplandetail p 
            where s.state=1 and p.state=1 and s.materiel_id=p.src_materiel_id 
            and p.product_plan_id=?  and prd_level=?
            group by s.materiel_id `;
    replacements.push(product_id);
    replacements.push(level);
    let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
    if(result && result.length>0){
        for(let r of result){
            productDetailPrice+=r.min_store_price

            replacements=[];
            queryStr=`select p.procedure_cost,p.procedure_coefficient 
                from tbl_erc_productionprocedure p,tbl_erc_productplanprocedure pd 
                where p.state=1 and pd.state=1 and p.procedure_id=pd.procedure_id 
                and pd.product_plan_id=? and rlt_materiel_code=? `
            replacements.push(product_id)
            replacements.push(r.materiel_id)
            let resultP = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
            for(let rp of resultP){
                productDetailPrice+=rp.procedure_cost * rp.procedure_coefficient
            }
        }
    }
    return productDetailPrice
}
// mrp生产模块
async function production(params){
    let queryStr,replacements=[],netDemand,netDemandAmount = 0,checkParams,productDetailPrice = 0;
    let productPlan,productPlanDetail
    queryStr=`select n.*,m.materiel_amto 
        from tbl_erc_netdemand n,tbl_erc_materiel m
        where n.state=1 and m.state=1 and n.materiel_id=m.materiel_id 
        and n.mrp_date=? and n.mrp_domain_id=? and m.domain_id=? and m.materiel_source=1`;//m.materiel_source=1 需生产的产品
    replacements.push(params.yesterday);
    replacements.push(params.nowDoaminId);
    replacements.push(params.nowDoaminId);
    netDemand = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
    for(let nd of netDemand){
        // 确定产品规划
        // materiel_amto   1品牌商品，2定制商品，3贴牌商品
        // 如果是定制或贴牌，则按订单号来区分产品规划
        productPlan = await tb_productplan.findOne({
            where:{
                state: 1,
                materiel_id: nd.materiel_id,
                domain_id: params.nowDoaminId,
                order_id:  nd.materiel_amto != "1" ? nd.order_id : null
            }
        });
        if(!productPlan){
            continue
        }

        productDetailPrice = await getStockAVGPrice(productPlan.product_id,2);
        // 最终产品生产任务
        productPlanDetail = await tb_productplandetail.findAll({
            where:{
                state: 1,
                product_plan_id: productPlan.product_id,
                prd_level: 2,//最外层的产品投料，只需查level==2
                level_materiel_id: nd.materiel_id,
            }
        });

        let POID = await Sequence.genProductiveOrderID(params.nowDoaminId);
        let addProductTask = await tb_productivetask.create({
            productivetask_code: POID,
            product_id: productPlan.product_id,
            materiel_id: nd.materiel_id,
            domain_id:  params.nowDoaminId,
            taskdesign_number: nd.netdemand_amount,
            order_id: nd.order_id ? nd.order_id : '',
            product_level:1,
            taskdesign_price:productDetailPrice
        });

        for(let ppd of productPlanDetail){
            let addProductTaskDetail = await tb_productivetaskdetail.create({
                productivetask_id: addProductTask.productivetask_id,
                materiel_id:  ppd.src_materiel_id,
                domain_id: params.nowDoaminId,
                taskdetaildesign_number: ppd.design_number * nd.netdemand_amount,
                taskdetailprd_level: ppd.prd_level
            });
        }
        // 最终产品生产任务end


        //分解产品
        replacements = [];
        queryStr = `select pd.*,m.materiel_source from tbl_erc_productplandetail pd 
            left join tbl_erc_materiel m on (pd.src_materiel_id = m.materiel_id and m.state = 1) 
             where pd.state=1 and pd.product_plan_id=? order by prd_level`;
        replacements.push(productPlan.product_id);
        productPlanDetail = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        for(let pd of productPlanDetail){
           //判断库存，缺少的数量生产或采购
            if(pd.prd_level == 2){
                checkParams = {
                    materiel_id: pd.src_materiel_id,
                    demand_amount: nd.netdemand_amount * pd.design_number,
                    order_id: nd.order_id
                };
            }else{
                for(let pdTemp of productPlanDetail){
                    if(pdTemp.prd_level == pd.prd_level - 1 && pd.level_materiel_id == pdTemp.src_materiel_id){
                        checkParams = {
                            materiel_id: pd.src_materiel_id,
                            demand_amount: nd.netdemand_amount * pdTemp.design_number * pd.design_number,
                            order_id: nd.order_id
                        };
                        break
                    }
                }
            }

            netDemandAmount = await checkInventory(params,checkParams);
            if(netDemandAmount>0){
                // materiel_source 1自制，2外购，3委外加工
                // 采购的物料加入净需求
                if(pd.materiel_source == 2){
                    let addNcaNetdemand = await tb_netdemand.create({
                        materiel_id: pd.src_materiel_id,
                        order_id: nd.order_id ? nd.order_id : '',
                        netdemand_amount: netDemandAmount,
                        mrp_date: nd.mrp_date,
                        mrp_domain_id: params.nowDoaminId
                    });
                }else{
                    //生产任务单
                    let POID = await Sequence.genProductiveOrderID(params.nowDoaminId);
                    productDetailPrice = await getStockAVGPrice(productPlan.product_id,pd.prd_level+1);
                    let addProductTask = await tb_productivetask.create({
                        productivetask_code: POID,
                        product_id: productPlan.product_id,
                        materiel_id: pd.src_materiel_id,
                        domain_id:  params.nowDoaminId,
                        taskdesign_number: netDemandAmount,
                        order_id: nd.order_id ? nd.order_id : '',
                        product_level:pd.prd_level,
                        taskdesign_price:productDetailPrice
                    });
                    for(let pdTemp of productPlanDetail){
                        if(pdTemp.prd_level == pd.prd_level + 1 && pdTemp.level_materiel_id == pd.src_materiel_id){
                            let addProductTaskDetail = await tb_productivetaskdetail.create({
                                productivetask_id: addProductTask.productivetask_id,
                                materiel_id:  pdTemp.src_materiel_id,
                                domain_id: params.nowDoaminId,
                                taskdetaildesign_number: pdTemp.design_number * netDemandAmount,
                                taskdetailprd_level: pdTemp.prd_level
                            });
                        }
                    }

                    // 联产品
                    let productplanrelated1 = await tb_productplanrelated.findAll({
                        where:{
                            state: 1,
                            product_plan_id: productPlan.product_id,
                            rlt_materiel_code: pd.src_materiel_id,
                            prd_type: 1
                        }
                    });
                    for(let ppe1 of productplanrelated1){
                        let addProductpTaskRelated1 = await tb_productivetaskrelated.create({
                            productivetask_id: addProductTask.productivetask_id,
                            materiel_id: ppe1.src_materiel_id,
                            domain_id:params.nowDoaminId,
                            taskrelateddesign_number: ppe1.prd_number * netDemandAmount,
                            taskrelated_type: 1
                        });
                    }
                    // 边余料
                    let productplanrelated2 = await tb_productplanrelated.findAll({
                        where:{
                            state: 1,
                            product_plan_id: productPlan.product_id,
                            rlt_materiel_code: pd.src_materiel_id,
                            prd_type: 2
                        }
                    });
                    for(let ppe2 of productplanrelated2){
                        let addProductpTaskRelated2 = await tb_productivetaskrelated.create({
                            productivetask_id: addProductTask.productivetask_id,
                            materiel_id: ppe2.src_materiel_id,
                            domain_id:params.nowDoaminId,
                            taskrelateddesign_number: ppe2.prd_number * netDemandAmount,
                            taskrelated_type: 2
                        });
                    }
                }
            }
        }
    }
}
// mrp采购模块
async function purchase(params){
    try{
        let queryStr,replacements=[],supplerPurchase=[],thisNum=0,thisAllNum=0;
        queryStr=`select m.domain_id from tbl_erc_netdemand n,tbl_erc_materiel m
            where n.state=1 and m.state=1 and n.materiel_id=m.materiel_id 
            and n.mrp_date=? and n.mrp_domain_id=? and m.materiel_source=2
            group by m.domain_id `;
        replacements.push(params.yesterday);
        replacements.push(params.nowDoaminId);
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(result && result.length>0){
            for (let r of result) {
                //非本机构物料，向对应domainId的机构采购
                if(r.domain_id != params.nowDoaminId){

                    let POID = await Sequence.genPurchaseOrderID(params.nowDoaminId);
                    let SOID = await Sequence.genSalesOrderID(params.nowDoaminId);

                    // 采购单
                    let addNcaPurchaseOrder = await tb_purchaseorder.create({
                        purchaseorder_id:POID,                      //采购单号，PO开头
                        purchaseorder_domain_id:params.nowDoaminId, //采购方
                        order_id:SOID,                              //销售单号
                        order_domain_id:r.domain_id,                //销售方
                        purchaseorder_state:2                       //采购单状态，0未审核，1审核拒绝，2审核通过
                    });

                    //销售单
                    let addNcaOrder = await tb_order.create({
                        order_id: SOID,                             //销售单号
                        domain_id: r.domain_id,                     //销售方
                        purchase_order_id: POID,                    //采购单号
                        purchase_domain_id: params.nowDoaminId,     //采购方
                        order_type: 8,                              //订单类型，8采购订单，OTYPEINFO
                        order_state:'NEW',
                        purchaser_type:1,                           //采购方类型 1机构，2个人
                        sales_data_source:1,                         //标识该采购单来源 1mrp运算，2手动添加
                        sap_order_state:1,                         //标识该销售单sap状态
                    });


                    ///采购单明细
                    replacements=[];
                    queryStr=`select n.materiel_id,n.netdemand_amount,m.materiel_sale as materiel_sale,n.order_id as order_ids
                            from tbl_erc_netdemand n,tbl_erc_materiel m
                            where n.state=1 and m.state=1 and n.materiel_id=m.materiel_id 
                            and n.mrp_date=? and n.mrp_domain_id=? and m.domain_id=? and m.materiel_source=2`;
                    replacements.push(params.yesterday);
                    replacements.push(params.nowDoaminId);
                    replacements.push(r.domain_id);
                    let resultDetail = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});


                    //将resultDetail按matriel_id汇总
                    let map = {}, dest = [],existState=0;
                    for(let sp of resultDetail){
                        // if(!map[sp.materiel_id]){
                        let materiel_sale_offer = await ERCBusinessCustomerControlSRV.searchPrice({}, r.domain_id,params.nowDoaminId,{materiel_id:sp.materiel_id});
                        logger.info(materiel_sale_offer);
                        dest.push({
                            materiel_id:sp.materiel_id,
                            purchase_num:sp.netdemand_amount,
                            // purchase_price:sp.materiel_sale,
                            purchase_price:materiel_sale_offer[0].PRICE?materiel_sale_offer[0].PRICE:0,
                            order_ids:sp.order_ids
                        });
                        map[sp.materiel_id] = sp;
                        // }else{
                        //     existState=0;
                        //     for(let ds of dest){
                        //         if(ds.materiel_id == sp.materiel_id){
                        //             ds.purchase_num +=sp.netdemand_amount;
                        //             ds.order_ids = ds.order_ids+","+sp.order_ids;
                        //             existState=1;
                        //             break;
                        //         }
                        //     }
                        //     if(existState==0){
                        //         ds.push({
                        //             materiel_id:sp.materiel_id,
                        //             purchase_num:sp.netdemand_amount,
                        //             purchase_price:sp.materiel_sale,
                        //             order_ids:sp.order_ids
                        //         });
                        //     }
                        // }
                    }
                    // logger.info(dest);

                    for(let rd of dest){
                        //采购单明细
                        let addNcaPurchaseDetail = await tb_purchasedetail.create({
                            purchase_id: POID,
                            materiel_id: rd.materiel_id,
                            purchase_number: rd.purchase_num,
                            purchase_price:rd.purchase_price,
                            order_ids:rd.order_ids
                        });
                        //销售单明细
                        let addNcaOrderMateriel = await tb_ordermateriel.create({
                            order_id: SOID,
                            materiel_id: rd.materiel_id,
                            materiel_amount: rd.purchase_num,
                            sale_price: rd.purchase_price,
                            sap_order_state:1,                         //标识该销售单sap状态
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
                }else {
                    //本机构物料，向本机构供应商采购，按比例分配
                    replacements=[];
                    queryStr=`select n.materiel_id,n.netdemand_amount,n.order_id as order_ids 
                        from tbl_erc_netdemand n,tbl_erc_materiel m
                        where n.state=1 and m.state=1 and n.materiel_id=m.materiel_id 
                        and n.mrp_date=? and n.mrp_domain_id=? and m.domain_id=? and m.materiel_source=2`;//m.materiel_source=2 需采购的物料
                    replacements.push(params.yesterday);
                    replacements.push(params.nowDoaminId);
                    replacements.push(params.nowDoaminId);
                    let resultDetail = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});

                    for(let rd of resultDetail){
                        //查询机构对应供应商的采购比例
                        replacements=[];
                        queryStr='select s.supplier_proportion,s.supplier_id,sm.suppliermateriel_purchaseprice,sm.suppliermateriel_purchasepricetax  ' +
                            'from tbl_erc_supplier s,tbl_erc_suppliermateriel sm ' +
                            'where s.state=1 and sm.state=1 and s.supplier_id=sm.supplier_id and s.domain_id=? and sm.materiel_id=? ' +
                            'order by s.supplier_proportion desc';
                        replacements.push(params.nowDoaminId);
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
                                if(rd.netdemand_amount-thisAllNum!=0){
                                    supplerPurchase.push({
                                        purchase_domain_id:params.nowDoaminId,
                                        supplier_id:resultSupplier[i].supplier_id,
                                        materiel_id:rd.materiel_id,
                                        purchase_num:rd.netdemand_amount-thisAllNum,
                                        purchase_price:resultSupplier[i].suppliermateriel_purchasepricetax,
                                        order_ids:rd.order_ids
                                    })
                                }
                            }else{
                                thisNum=Math.round(rd.netdemand_amount*(resultSupplier[i].supplier_proportion/total_proportion));
                                thisAllNum+=thisNum;
                                if(thisNum!=0){
                                    supplerPurchase.push({
                                        purchase_domain_id:params.nowDoaminId,
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
                                    // existState=0;
                                    // for(let dds of ds.data){
                                    //     if(dds.materiel_id==sp.materiel_id){
                                    //         dds.purchase_num +=sp.purchase_num;
                                    //         dds.order_ids = dds.order_ids+","+sp.order_ids;
                                    //         existState=1;
                                    //     }
                                    // }
                                    // if(existState==0){
                                    ds.data.push({
                                        materiel_id:sp.materiel_id,
                                        purchase_num:sp.purchase_num,
                                        purchase_price:sp.purchase_price,
                                        order_ids:sp.order_ids
                                    });
                                    // }
                                    break;
                                }
                            }
                        }
                    }
                    // logger.info(destSuppler);
                    for(let d of destSuppler){
                        let POID = await Sequence.genPurchaseOrderID(params.nowDoaminId);
                        let SOID = await Sequence.genSalesOrderID(params.nowDoaminId);

                        // 采购单
                        let addNcaPurchaseOrder = await tb_purchaseorder.create({
                            purchaseorder_id:POID,                      //采购单号，PO开头
                            purchaseorder_domain_id:params.nowDoaminId, //采购方
                            order_id:'',                                //销售单号
                            order_domain_id:params.nowDoaminId,         //销售方
                            purchaseorder_state:2,                      //采购单状态，0未审核，1审核拒绝，2审核通过
                            supplier_id:d.supplier_id,                  //供应商id
                            created_at:params.yesterday                 //如果记录当前时间，第二天的mrp会重复计算
                        });
                        // //销售单
                        // let addNcaOrder = await tb_order.create({
                        //     order_id: SOID,                             //销售单号
                        //     domain_id: params.nowDoaminId,              //销售方
                        //     purchase_order_id: POID,                    //采购单号
                        //     purchase_domain_id: params.nowDoaminId,     //采购方
                        //     order_type: 8,                              //订单类型
                        //     created_at:params.yesterday,
                        //     order_state:'NEW',
                        //
                        // });

                        for(let ddata of d.data){
                            //采购单明细
                            let addNcaPurchaseDetail = await tb_purchasedetail.create({
                                purchase_id: POID,
                                materiel_id: ddata.materiel_id,
                                purchase_number: ddata.purchase_num,
                                purchase_price:ddata.purchase_price,
                                created_at:params.yesterday,
                                order_ids:ddata.order_ids
                            });
                            //
                            // //销售单明细
                            // let addNcaOrderMateriel = await tb_ordermateriel.create({
                            //     order_id: SOID,
                            //     materiel_id: ddata.materiel_id,
                            //     materiel_amount: ddata.purchase_num,
                            //     created_at:params.yesterday
                            // });
                        }

                        // let orderworkflow = await tb_orderworkflow.findOne({
                        //     where: {
                        //         order_id: SOID,
                        //         orderworkflow_state: 'NEW'
                        //     }
                        // });
                        //
                        // if (!orderworkflow) {
                        //     await tb_orderworkflow.create({
                        //         order_id: SOID,
                        //         orderworkflow_state: 'NEW',
                        //         orderworkflow_desc: '新建'
                        //     });
                        // }

                    }
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

// 总需求，净需求，生产，采购->全部流程
async function dataExtract(req,res){
    try{
        let doc=common.docTrim(req.body),user=req.user

        // let yesterday = moment().add('days',-1).format('YYYY-MM-DD');
        let yesterday = doc.mrp_date;
        let beginTime = yesterday +' 00:00:00';
        let endTime = yesterday +' 23:59:59';

        let params={
            yesterday:yesterday,
            beginTime:beginTime,
            endTime:endTime
        };

        let domain=await tb_domain.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });

        for(let d of domain){
            params.nowDoaminId = d.domain_id;
            params.userDomainId = user.domain_id;
            //总需求
            await allDemand(params);
            //净需求
            await netDemand(params);
            //生产    必须在采购之前
            await production(params);
            //采购
            await purchase(params);
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}

// 生成mrp总需求  对应页面按钮
async function setAllDemand(req,res){
    try{
        // let yesterday = moment().add('days',-1).format('YYYY-MM-DD');

        let doc=common.docTrim(req.body)
        let yesterday = doc.mrp_date;
        let beginTime = yesterday +' 00:00:00';
        let endTime = yesterday +' 23:59:59';
        if(doc.mrp_date =='') return;
        let params={
            yesterday:yesterday,
            beginTime:beginTime,
            endTime:endTime
        };

        let domain=await tb_domain.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });
        for(let d of domain){
            params.nowDoaminId = d.domain_id;
            //mrp总需求
            await allDemand(params);
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 生成 mrp总需求  对应页面按钮
async function setNetDemand(req,res){
    try{
        // let yesterday = moment().add('days',-1).format('YYYY-MM-DD');

        let doc=common.docTrim(req.body)
        let yesterday = doc.mrp_date;
        let beginTime = yesterday +' 00:00:00';
        let endTime = yesterday +' 23:59:59';
        if(doc.mrp_date =='') return;
        let params={
            yesterday:yesterday,
            beginTime:beginTime,
            endTime:endTime
        };

        let domain=await tb_domain.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });
        for(let d of domain){
            params.nowDoaminId = d.domain_id;
            //净需求
            await netDemand(params);
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 生成 mrp总需求  对应页面按钮
async function setProduction(req,res){
    try{
        // let yesterday = moment().add('days',-1).format('YYYY-MM-DD');

        let doc=common.docTrim(req.body)
        let yesterday = doc.mrp_date;
        let beginTime = yesterday +' 00:00:00';
        let endTime = yesterday +' 23:59:59';
        if(doc.mrp_date =='') return;
        let params={
            yesterday:yesterday,
            beginTime:beginTime,
            endTime:endTime
        };

        let domain=await tb_domain.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });
        for(let d of domain){
            params.nowDoaminId = d.domain_id;
            //采购单
            await production(params);
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 生成 mrp总需求  对应页面按钮
async function setPurchase(req,res){
    try{
        // let yesterday = moment().add('days',-1).format('YYYY-MM-DD');
        let doc=common.docTrim(req.body)
        let yesterday = doc.mrp_date;
        let beginTime = yesterday +' 00:00:00';
        let endTime = yesterday +' 23:59:59';
        if(doc.mrp_date =='') return;
        let params={
            yesterday:yesterday,
            beginTime:beginTime,
            endTime:endTime
        };

        let domain=await tb_domain.findAll({
            where :{
                state:GLBConfig.ENABLE
            }
        });
        for(let d of domain){
            params.nowDoaminId = d.domain_id;
            //采购单
            await purchase(params);
        }
        common.sendData(res, {});
    } catch (error) {
        common.sendFault(res, error);
    }
}

// 查询总需求列表
async function getAllDemand(req,res){
    try{
        let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData={};
        let queryStr='select m.*,d.order_id,d.mrp_date,demand_amount ' +
            'from tbl_erc_alldemand d ' +
            'left join tbl_erc_materiel m on (d.materiel_id=m.materiel_id and m.state=1) ' +
            'where d.state=1 and d.mrp_domain_id=? ';
        replacements.push(user.domain_id);
        if(doc.search_text){
            queryStr+=' and (materiel_code like ? or materiel_name like ? or order_id like ?)';
            replacements.push('%'+doc.search_text+'%');
            replacements.push('%'+doc.search_text+'%');
            replacements.push('%'+doc.search_text+'%');
        }
        if(doc.materiel_source){
            queryStr+=' and materiel_source=?';
            replacements.push(doc.materiel_source);
        }
        if(doc.materiel_manage){
            queryStr+=' and materiel_manage=?';
            replacements.push(doc.materiel_manage);
        }
        if(doc.beginTime){
            queryStr+=' and d.mrp_date>=?';
            replacements.push(doc.beginTime)
        }
        if(doc.endTime){
            queryStr+=' and d.mrp_date<=?';
            replacements.push(doc.endTime)
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 查询净需求列表
async function getNetDemand(req,res){
    try{
        let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData={};
        let queryStr='select m.*,d.mrp_date,d.netdemand_amount,d.order_id ' +
            'from tbl_erc_netdemand d ' +
            'left join tbl_erc_materiel m on (d.materiel_id=m.materiel_id and m.state=1) ' +
            'where d.state=1 and d.mrp_domain_id=? ';
        replacements.push(user.domain_id);
        if(doc.search_text){
            queryStr+=' and (materiel_code like ? or materiel_name like ? or order_id like ?)';
            replacements.push('%'+doc.search_text+'%');
            replacements.push('%'+doc.search_text+'%');
            replacements.push('%'+doc.search_text+'%');
        }
        if(doc.materiel_source){
            queryStr+=' and materiel_source=?';
            replacements.push(doc.materiel_source);
        }
        if(doc.management_model){
            queryStr+=' and management_model=?';
            replacements.push(doc.management_model);
        }
        if(doc.beginTime){
            queryStr+=' and d.mrp_date>=?';
            replacements.push(doc.beginTime)
        }
        if(doc.endTime){
            queryStr+=' and d.mrp_date<=?';
            replacements.push(doc.endTime)
        }
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            // result.mrp_date = r.mrp_date.Format("yyyy-MM-dd");
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 查询采购列表
async function getPurchaseOrder(req,res){
    try{
        let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData={};
        let queryStr=`select p.purchaseorder_id,s.supplier_name,p.created_at,d.domain_name as order_domain,dd.domain_name as purchase_domain
            from tbl_erc_purchaseorder p
            left join tbl_erc_supplier s on (p.supplier_id=s.supplier_id and s.state=1)
            left join tbl_common_domain d on (p.order_domain_id=d.domain_id and d.state=1)
            left join tbl_common_domain dd on (p.purchaseorder_domain_id=dd.domain_id and dd.state=1)
            where p.state=1 and p.purchaseorder_domain_id=? `;
        replacements.push(user.domain_id);
        if(doc.supplier_id){
            queryStr+=' and p.supplier_id = ?';
            replacements.push(doc.supplier_id);
        }
        if(doc.purchaseorder_id){
            queryStr+=' and purchaseorder_id like ?';
            replacements.push('%'+doc.purchaseorder_id+'%');
        }
        if(doc.search_text){
            queryStr+=' and purchaseorder_id like ?';
            replacements.push('%'+doc.search_text+'%');
        }

        if(doc.beginTime){
            queryStr+=' and created_at>=?';
            replacements.push(doc.beginTime + ' 00:00:00')
        }
        if(doc.endTime){
            queryStr+=' and created_at<=?';
            replacements.push(doc.endTime + ' 23:59:59')
        }
        queryStr+= ' order by purchaseorder_id';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.created_at = r.created_at.Format("yyyy-MM-dd");
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

// 增加采购单
async function addPuchaseApply(req,res){
    let doc = common.docTrim(req.body),user = req.user;

    try {
        let applyID = await Sequence.genPurchaseApplyID(user.domain_id);
        let create = await tb_purchaseapply.create({
            purchaseapply_id: applyID,
            app_domain_id:user.domain_id,
            apply_state: 0,
            apply_approver: doc.apply_approver,
            apply_applicant:user.user_id
        });
        common.sendData(res, create);
    }catch (error) {
        common.sendFault(res, error);
        return
    }
}
// 查询采购单列表
async function getPuchaseApply(req,res){
    try{
        let doc = common.docTrim(req.body), user = req.user,replacements=[],returnData={};
        let queryStr=`select a.purchaseapply_id,a.apply_state,a.approval_date,a.created_at,
             ap.username as apply_applicant,av.username as apply_approver,a.description,a.order_type 
             from tbl_erc_purchaseapply a
             left join tbl_common_user ap on (a.apply_applicant=ap.user_id and ap.state=1)
             left join tbl_common_user av on (a.apply_approver=av.user_id and av.state=1)
             where a.state=1 and app_domain_id=? `;
        replacements.push(user.domain_id);
        if(doc.purchaseapply_id){
            queryStr+=' and a.purchaseapply_id=?';
            replacements.push(doc.purchaseapply_id)
        }
        if(doc.apply_state){
            queryStr+=' and a.apply_state=?';
            replacements.push(doc.apply_state)
        }
        if(doc.beginDate){
            queryStr+=' and a.created_at>=?';
            replacements.push(doc.beginDate)
        }
        if(doc.endDate){
            queryStr+=' and a.created_at<=?';
            replacements.push(doc.endDate)
        }
        if(doc.search_text){
            queryStr+=' and purchaseapply_id like ?';
            replacements.push('%'+doc.search_text+'%');
        }
        queryStr+=' order by purchaseapply_id desc'
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.created_at = r.created_at.Format("yyyy-MM-dd");
            result.approval_date = (r.approval_date)?r.approval_date.Format("yyyy-MM-dd"):'';
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 删除采购单
async function deletePurchaseApply(req,res){
    try {
        let doc = common.docTrim(req.body),
            user = req.user;
        let deletePurchaseApply = await tb_purchaseapply.findOne({
            where: {
                purchaseapply_id:doc.purchaseapply_id
            }
        });
        if (deletePurchaseApply) {
            deletePurchaseApply.state =  GLBConfig.DISABLE;
            await deletePurchaseApply.save()
        } else {
            common.sendError(res, 'puchase_apply_03');
            return
        }
        common.sendData(res, deletePurchaseApply);

    } catch (error) {
        return common.sendFault(res, error);
    }
}
// 初始化基础数据
async function initAct(req, res) {
    try{
        let returnData = {};
        await FDomain.getDomainListInit(req, returnData);
        returnData.batchInfo = GLBConfig.BATCHINFO;//批次
        returnData.unitInfo = GLBConfig.UNITINFO;//单位
        returnData.mateUseState = GLBConfig.MATEUSESTATE;//单位
        returnData.materielSource = GLBConfig.MATERIELSOURCE;//物料来源
        returnData.materielManage = GLBConfig.MATERIELMANAGE;//管理模式
        returnData.materielSourceKind = GLBConfig.MATERIELSOURCEKIND;//来源分类
        returnData.purchaseApplyType = GLBConfig.PURCHASEAPPLYSTATE;//申请单状态
        returnData.user = [];
        let user1=req.user;
        let userDate = await tb_user.findAll({
            where:{
                state: GLBConfig.ENABLE,
                domain_id:user1.domain_id
            }
        });
        for(let u of userDate){
            returnData.user.push({
                id:u.user_id,
                text:u.name,
                value:u.user_id
            })
        }
        common.sendData(res, returnData)
    } catch (error) {
        common.sendFault(res, error);
    }
}
// 查询供应商名称
async function getSupplerUser(req, res) {
    try{
        let returnData = {};
        returnData.thirdUser = await tb_thirdsignuser.findOne({
            where: {
                user_id: req.user.user_id
            }
        });
        common.sendData(res, returnData)
    } catch (error) {
        common.sendFault(res, error);
    }
}
