const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCBuyInControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const sms = require('../../../util/SMSUtil.js');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const inventoryControl = require('./ERCInventoryControlSRV');

const sequelize = model.sequelize;
const tb_warehouse = model.erc_warehouse;
const tb_inventoryorder = model.erc_inventoryorder;
const tb_inventoryaccount = model.erc_inventoryaccount;
const tb_user = model.common_user;
const tb_warehousezone = model.erc_warehousezone;
const tb_otherstockorder = model.erc_otherstockorder;
const tb_stockapplyitem = model.erc_stockapplyitem;
const tb_stockmap = model.erc_stockmap;
const tb_materiel = model.erc_materiel;
const tb_stockitem = model.erc_stockitem;
const tb_otherinventoryorder = model.erc_otherinventoryorder;
const tb_otherinventoryaccount = model.erc_otherinventoryaccount;
const tb_stockapply = model.erc_stockapply;
const tb_qualitycheckdetail = model.erc_qualitycheckdetail;
const tb_qualitycheck = model.erc_qualitycheck;
const tb_productivetask = model.erc_productivetask;
const tb_productivetaskrelated = model.erc_productivetaskrelated;
const tb_purchasedetail = model.erc_purchasedetail;
const tb_financerecorditem = model.erc_financerecorditem;
const tb_custorgstructure = model.erc_custorgstructure;
const tb_department = model.erc_department;
const tb_supplier = model.erc_supplier;

exports.ERCBuyInControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'initActDetail') {
        initActDetail(req, res);
    } else if (method === 'initDetail') {
        initDetailAct(req, res);
    } else if (method === 'getZoneByWearHouse') {
        getZoneByWearHouse(req, res);
    } else if (method === 'getBuyInOrder') {
        getBuyInOrder(req, res);
    } else if (method === 'getOtherInOrder') {
        getOtherInOrderAct(req, res);
    } else if (method === 'getBuyInOrderMateriel') {
        getBuyInOrderMateriel(req, res);
    } else if (method === 'getOrderListForMateriel') {
        getOrderListForMateriel(req, res);
    } else if (method === 'createBuyInOrder') {
        createBuyInOrder(req, res);
    } else if (method === 'getBuyInOrderHistory') {
        getBuyInOrderHistory(req, res);
    } else if (method === 'getBuyInOrderHistoryDetail') {
        getBuyInOrderHistoryDetail(req, res);
    } else if (method === 'buyInOrderHistoryPrint') {
        buyInOrderHistoryPrint(req, res);
    } else if (method === 'inventoryAOGSms') {
        inventoryAOGSms(req, res)
    } else if (method === 'getWarehouseZone') {
        getWarehouseZoneAct(req, res);
    } else if (method === 'getOtherInOrderMateriel') {
        getOtherInOrderMaterielAct(req, res);
    } else if (method === 'add') {
        addStockApplyDetailAct(req, res);
    } else if (method === 'getOtherListForMateriel') {
        getOtherListForMaterielAct(req, res);
    } else if (method === 'modify') {
        modifyAct(req, res);
    } else if (method === 'getProductInOrderHistory') {
        getProductInOrderHistory(req, res);
    } else if (method === 'getOtherInOrderHistory') {
        getOtherInOrderHistoryAct(req, res);
    } else if (method === 'getOtherInOrderHistoryDetail') {
        getOtherInOrderHistoryDetailAct(req, res);
    } else if (method === 'getProductInOrderHistoryDetail') {
        getProductInOrderHistoryDetailAct(req, res);
    } else if (method === 'OtherInOrderHistoryPrint') {
        OtherInOrderHistoryPrintAct(req, res);
    } else if (method==='getQualityCheckOrder'){
        getQualityCheckOrderAct(req,res)
    } else if (method==='getQualityCheckOrderDetail'){
        getQualityCheckOrderDetailAct(req,res)
    } else if (method==='getQualityCheckListForMateriel'){
        getQualityCheckListForMaterielAct(req,res)
    } else if (method==='modifyQualityDetail'){
        modifyQualityDetailAct(req,res)
    } else if (method==='addStockMapDetailFromQuality'){
        addStockMapDetailFromQualityAct(req,res)
    } else if (method === 'getProductInOrder') {//获取产品入库列表
        getProductInOrderAct(req, res);
    } else if (method === 'getProductInItems') {//获取产品入库明细
        getProductInItemsAct(req, res);
    } else if (method === 'submitProductInItems') {//提交产品入库
        submitProductInItemsAct(req, res);
    } else {
        common.sendError(res, 'common_01')
    }
};

//初始化数据
let initAct = async (req, res) => {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        logger.debug('initAct:', doc);

        let resultData = {
            user: req.user,
            storeTypeInfo: GLBConfig.STORETYPE[0],
            TypeInfo: GLBConfig.STORETYPE[0],
            materielInfo: GLBConfig.MATERIELTYPE,
            inventoryInfo: GLBConfig.INVENTORYOPERATETYPE[0].value,
            housesInfo: []
        };

        let warehouses = await tb_warehouse.findAll({
            where: {
                state: GLBConfig.ENABLE,
                warehouse_state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });
        for (let w of warehouses) {
            resultData.housesInfo.push({
                id: (w.warehouse_id).toString(),
                value: (w.warehouse_id).toString(),
                text: w.warehouse_name
            });
        }

        let queryStr =
            `select warehouse_id as id, warehouse_name as text
                    from tbl_erc_warehouse
                    where true`;
        let replacements = [];

        if (user.domain_id) {
            queryStr += ` and domain_id = ?`;
            replacements.push(user.domain_id);
        }

        resultData.wareHouseInfo = await common.simpleSelect(sequelize, queryStr, replacements);

        if (doc.warehouse_id) {
            let queryStr =
                `select warehouse_zone_id as id, zone_name as text
                    from tbl_erc_warehousezone
                    where warehouse_id = ? and state = 1`;
            let replacements = [];
            replacements.push(doc.warehouse_id);
            resultData.wareHouseZoneInfo = await common.simpleSelect(sequelize, queryStr, replacements);
        }

        common.sendData(res, resultData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

//初始化详情数据
async function initActDetail(req, res) {
    try {
        let user = req.user;
        let result = await tb_warehouse.findAll({
            where: {
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });

        let subResult = [];
        if (result.length > 0) {
            let warehouse_id = result[0].dataValues.warehouse_id;
            let queryStr =
                `select warehouse_zone_id as id, zone_name as text
                    from tbl_erc_warehousezone
                    where warehouse_id = ? and state = 1`;
            let replacements = [];
            replacements.push(warehouse_id);
            subResult = await common.simpleSelect(sequelize, queryStr, replacements);
            logger.debug('subResult:', subResult);
        }

        common.sendData(res, {
            user: req.user,
            storeTypeInfo: GLBConfig.STORETYPE[0],
            materielInfo: GLBConfig.MATERIELTYPE,
            inventoryInfo: GLBConfig.INVENTORYOPERATETYPE[0].value,
            wareHouseInfo: result,
            wareHouseZoneInfo: subResult
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}

//初始化详情数据
async function initDetailAct(req, res) {
    try {
        let returnData = {},user = req.user;
        let doc = common.docTrim(req.body);
        returnData.wareHouseZoneInfo = [];
        returnData.materielInfo = GLBConfig.MATERIELTYPE

        let result = await tb_warehouse.findOne({
            where: {
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id,
                warehouse_id: doc.warehouse_id
            }
        });

        let wareHouseZoneInfo = await tb_warehousezone.findAll({
            where: {
                state: GLBConfig.ENABLE,
                warehouse_id: result.warehouse_id
            }
        });

        for (let land of wareHouseZoneInfo) {
            let elem = {};
            elem.id = land.warehouse_zone_id;
            elem.value = land.warehouse_zone_id;
            elem.text = land.zone_name;
            returnData.wareHouseZoneInfo.push(elem)
        }
        await FDomain.getDomainListInit(req, returnData);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取某仓库下的仓区
async function getZoneByWearHouse(req, res) {
    logger.debug('getZoneByWearHouse');
    try {
        let doc = common.docTrim(req.body);
        let queryStr =
            `select warehouse_zone_id as id, zone_name as text
                from tbl_erc_warehousezone where warehouse_id = ? and state = 1`;
        let replacements = [];
        replacements.push(doc.warehouse_id);
        let result = await common.simpleSelect(sequelize, queryStr, replacements);

        if (result) {
            common.sendData(res, result);
        } else {
            common.sendFault(res, '没有仓区');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

//获取待入库订单
async function getBuyInOrder(req, res) {
    logger.debug('getBuyInOrder:', req.user);
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
             a.purchaseorder_id, a.purchaseorder_domain_id, a.order_id, a.order_domain_id, a.supplier_id
             , b.total_count
             , ifnull(d.supplier, c.domain) as supplier
             , ifnull(d.supplier_name, c.domain_name) as supplier_name
             , ifnull(e.done_count, 0) as done_count
             , if(e.done_count is null, 1, if(e.done_count < b.total_count, 2, 3)) as order_status
             from tbl_erc_purchaseorder a
             left join (
             select pd.purchase_id, sum(pd.purchase_number) as total_count
             from tbl_erc_purchasedetail as pd
             group by pd.purchase_id) b
             on a.purchaseorder_id = b.purchase_id
             left join tbl_common_domain c
             on a.order_domain_id = c.domain_id
             left join tbl_erc_supplier d
             on a.supplier_id = d.supplier_id
             left join (
             select ia.p_order_id, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount ia
             where true
             and ia.account_operate_type = 1
             group by ia.p_order_id) e
             on a.purchaseorder_id = e.p_order_id
             where true`;
        let replacements = [];

        if (user.domain_id) {
            queryStr += ` and a.purchaseorder_domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.search_keyword) {
            queryStr += ' and a.purchaseorder_id like ?';
            let search_keyword = '%' + doc.search_keyword + '%';
            replacements.push(search_keyword);
        }

        if (doc.search_type == 1) {
            queryStr += ' and e.done_count is null';
        } else if (doc.search_type == 2) {
            queryStr += ' and e.done_count < b.total_count';
        } else if (doc.search_type == 3) {
            queryStr += ' and e.done_count = b.total_count';
        }

        queryStr += ` order by a.purchaseorder_id asc`;

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取其他入库订单
async function getOtherInOrderAct(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            replacements = [],
            returnData = {};

        let queryStr =
            `select distinct o.otherstock_id,o.stockapply_id,av.name as otherstock_approver,
            ifnull(e.done_count, 0) as done_count,
            if(e.done_count is null, 1, if(e.done_count < e.apply_amount, 2, 3)) as otherstock_state
            from tbl_erc_otherstockorder o
            left join tbl_common_user av
            on o.otherstock_approver=av.user_id and av.state=1
            left join (select s.stockapply_id,sum(s.apply_amount) as apply_amount,sum(s.remain_number) as done_count
            from tbl_erc_stockapplyitem s where true group by stockapply_id) e
            on o.stockapply_id = e.stockapply_id where true`;
        if (user.domain_id) {
            queryStr += ` and o.domain_id=?`;
            replacements.push(user.domain_id);
        }
        if (doc.search_order) {
            queryStr += ' and otherstock_id like ?';
            let search_keyword = '%' + doc.search_order + '%';
            replacements.push(search_keyword);
        }
        if (doc.search_Otype == 1) {
            queryStr += ' and e.done_count is null';
        } else if (doc.search_Otype == 2) {
            queryStr += ' and e.done_count < e.apply_amount';
        } else if (doc.search_Otype == 3) {
            queryStr += ' and e.done_count = e.apply_amount';
        }
        queryStr += ` order by otherstock_id asc`;

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取入库物料列表
async function getBuyInOrderMateriel(req, res) {
    logger.debug('getBuyInOrderMateriel');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
             a.purchase_id, a.materiel_id, a.purchase_number
             , b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit, b.materiel_manage
             , b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax
             , format((b.materiel_cost * a.purchase_number), 2) as pure_cost
             , format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.purchase_number), 2) as tax_cost
             , ifnull(c.done_count, 0) as done_count
             from tbl_erc_purchasedetail a
             left join tbl_erc_materiel b
             on a.materiel_id = b.materiel_id
             left join
             (select ia.account_operate_type, ia.materiel_id, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where true
             and ia.account_operate_type = 1
             and p_order_id = ?
             group by ia.materiel_id) c
             on a.materiel_id = c.materiel_id
             where true`;
        let replacements = [];
        replacements.push(doc.purchase_id);

        if (doc.purchase_id) {
            queryStr += ` and a.purchase_id = ?`;
            replacements.push(doc.purchase_id);
        }

        if (doc.materiel_manage) {
            queryStr += ` and b.materiel_manage = ?`;
            replacements.push(doc.materiel_manage);
        }

        queryStr += ` order by a.purchase_id asc`;
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取订单下的物料
async function getOrderListForMateriel(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr = '';
        let replacements = [];

        if (doc.safetyStock) {
            queryStr =
                `select
                    a.purchase_id, a.materiel_id, a.purchase_number as total_count
                    , b.domain_id, ifnull(b.current_amount, 0) as current_count
                    from tbl_erc_purchasedetail a
                    left join tbl_erc_stockmap b
                    on a.materiel_id = b.materiel_id
                    where true
                    and (b.current_amount is null or b.current_amount < a.purchase_number)
                    and b.domain_id = ${user.domain_id}`;

            if (doc.materiel_id) {
                queryStr += ` and a.materiel_id = ?`;
                replacements.push(doc.materiel_id);
            }

            queryStr += ` order by a.purchase_id asc`;
            logger.debug('queryStr:', queryStr);
        } else {
            queryStr =
                `select
                     a.order_id, a.materiel_id, a.total_count
                     , ifnull(b.current_amount, 0) as current_count
                     from (
                     select nd.order_id, nd.materiel_id, sum(nd.netdemand_amount) as total_count
                     from tbl_erc_netdemand as nd
                     where nd.mrp_domain_id = ${user.domain_id}
                     group by nd.order_id, nd.materiel_id) a
                     left join (
                     select sm.order_id, sum(sm.current_amount) as current_amount
                     from tbl_erc_stockmap as sm
                     where sm.materiel_id = ${doc.materiel_id}
                     group by sm.order_id) b
                     on a.order_id = b.order_id
                     where true
                     and (b.current_amount is null or b.current_amount < a.total_count)`;

            if (doc.materiel_id) {
                queryStr += ` and a.materiel_id = ?`;
                replacements.push(doc.materiel_id);
            }

            queryStr += ` order by a.order_id asc`;
            logger.debug('queryStr:', queryStr);
        }

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//创建入库单
async function createBuyInOrder(req, res) {
    logger.debug('createBuyInOrder:', req.body);
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let buyOrder = await tb_inventoryorder.create({
            domain_id: doc.buyOrderData.domain_id,
            bill_code: doc.buyOrderData.bill_code,
            bs_order_id: doc.buyOrderData.bs_order_id,
            warehouse_id: doc.buyOrderData.warehouse_id,
            account_operate_type: doc.buyOrderData.account_operate_type,
            ior_contact: doc.buyOrderData.ior_contact,
            ior_phone: doc.buyOrderData.ior_phone,
            supplier_code: doc.buyOrderData.supplier_code,
            supplier_name: doc.buyOrderData.supplier_name
        });

        if (buyOrder) {
            let buyOrderItems = await tb_inventoryaccount.bulkCreate(doc.buyOrderItems);
            if (buyOrderItems) {
                let pushArray = [];
                for (let i = 0; i < buyOrderItems.length; i++) {
                    let item = buyOrderItems[i];
                    if (doc.safetyStock) {
                        let pushData = await inventoryControl.dealWithSafeInventoryIn(item.warehouse_id, item.materiel_id,
                            item.account_operate_amount, item.domain_id, item.warehouse_zone_id);
                        pushArray.push(pushData);
                    } else {
                        let pushData = await inventoryControl.dealWithInventoryIn(item.warehouse_id, item.materiel_id,
                            item.account_operate_amount, item.order_id, item.domain_id, item.warehouse_zone_id);
                        pushArray.push(pushData);
                    }
                }

                await inventoryAOGSms({
                    bs_order_id: doc.buyOrderData.bs_order_id
                });

                common.sendData(res, pushArray);
            } else {
                return common.sendError(res, 'buyinorder_01', '入库订单明细生成失败');
            }
        } else {
            return common.sendError(res, 'buyinorder_02', '入库订单生成失败');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取入库历史
async function getBuyInOrderHistory(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
             a.ior_id, a.domain_id, a.bill_code, a.bs_order_id, a.warehouse_id
             , a.ior_phone, a.supplier_code, a.supplier_name, a.created_at
             , b.done_count
             from tbl_erc_inventoryorder a
             left join (
             select ia.bill_code, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where ia.account_operate_type = 1
             group by ia.bill_code) b
             on a.bill_code = b.bill_code
             where true
             and a.account_operate_type = 1`;
        let replacements = [];
        if (user.domain_id) {
            queryStr += ` and a.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.start_date) {
            queryStr += ` and to_days(a.created_at) >= to_days(?)`;
            replacements.push(doc.start_date);
        }
        if (doc.end_date) {
            queryStr += ` and to_days(a.created_at) <= to_days(?)`;
            replacements.push(doc.end_date);
        }
        if (doc.bill_code) {
            queryStr += ` and a.bill_code = ?`;
            replacements.push(doc.bill_code);
        }
        if (doc.bs_order_id) {
            queryStr += ` and a.bs_order_id = ?`;
            replacements.push(doc.bs_order_id);
        }
        if (doc.supplier) {
            queryStr += ` and (a.supplier_code like ?`;
            replacements.push('%' + doc.supplier + '%');
            queryStr += ` or a.supplier_name like ?)`;
            replacements.push('%' + doc.supplier + '%');
        }
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取入库历史详情
async function buyInOrderHistoryDetail(req, doc, user) {
    let returnData = {};
    let queryStr =
        `select
         a.bill_code, a.domain_id, a.order_id, a.p_order_id, a.account_operate_amount
         , a.warehouse_zone_id, a.company_name, a.account_note, a.created_at
         , b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit
         , b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax
         , format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost
         , format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
         , c.order_domain_id, c.supplier_id
         , pd.purchase_price
         from tbl_erc_inventoryaccount a
         left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
         left join tbl_erc_purchaseorder c on (a.order_id = c.order_id and c.order_id<>'')
         left join tbl_erc_purchasedetail pd
         on (c.purchaseorder_id = pd.purchase_id and a.materiel_id = pd.materiel_id)
         where true `;
    let replacements = [];
    if (user.domain_id) {
        queryStr += ` and a.domain_id = ?`;
        replacements.push(user.domain_id);
    }

    if (doc.bill_code) {
        queryStr += ` and a.bill_code = ?`;
        replacements.push(doc.bill_code);
    }
    if (doc.materiel) {
        queryStr += ` and (b.materiel_code like ?`;
        replacements.push(doc.materiel);
        queryStr += ` or b.materiel_name like ?)`;
        replacements.push(doc.materiel);
    }
    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = result.data;

    return returnData;
}
//获取入库历史详情
async function getBuyInOrderHistoryDetail(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await buyInOrderHistoryDetail(req, doc, user);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//入库的短信通知
async function inventoryAOGSms(params) {
    let queryStr =
        `select
             if(e.done_count is null, 1, if(e.done_count < b.total_count, 2, 3)) as order_status
             from tbl_erc_purchaseorder a
             left join (
             select pd.purchase_id, sum(pd.purchase_number) as total_count
             from tbl_erc_purchasedetail as pd
             group by pd.purchase_id) b
             on a.purchaseorder_id = b.purchase_id
             left join tbl_common_domain c
             on a.order_domain_id = c.domain_id
             left join tbl_erc_supplier d
             on a.supplier_id = d.supplier_id
             left join (
             select ia.p_order_id, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount ia
             where true
             and ia.account_operate_type = 1
             group by ia.p_order_id) e
             on a.purchaseorder_id = e.p_order_id
             where true`;
    let replacements = [];
    if (params.bs_order_id) {
        queryStr += ' and a.purchaseorder_id=?';
        replacements.push(params.bs_order_id);
    }
    let result = await sequelize.query(queryStr, {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT
    });
    if (result && result.length > 0) {
        if (result[0].order_status == 3) {
            replacements = [];
            // let smsText = '到货，请注意查收';
            queryStr = `select u.phone,group_concat(distinct i.order_id separator ';') as order_id
            from tbl_erc_inventoryaccount i,tbl_erc_order o,tbl_common_user u
            where i.state=1 and o.state=1 and u.state=1
            and i.order_id=o.order_id
            and o.order_foreman=u.user_id
            and i.p_order_id=?
            group by u.phone`;
            replacements.push(params.bs_order_id);

            let resultPhone = await sequelize.query(queryStr, {
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT
            });
            for (let rp of resultPhone) {
                let order = rp.order_id.slice(0, 38);
                if (rp.phone) {
                    sms.sedDataMsg(rp.phone, 'wms', order) //给工长发送短信
                }
            }

        }
    }
}
//获取某仓库下的仓区
let getWarehouseZoneAct = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            returnData = {};
        let zones = await tb_warehousezone.findAll({
            where: {
                warehouse_id: doc.warehouse_id,
                state: GLBConfig.ENABLE
            }
        });
        let zoneInfo = [];
        for (let z of zones) {
            zoneInfo.push({
                id: (z.warehouse_zone_id).toString(),
                value: (z.warehouse_zone_id).toString(),
                text: z.zone_name
            });
        }
        common.sendData(res, zoneInfo);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//获取其他入库时，可选物料的列表
async function getOtherInOrderMaterielAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let otherstockorder = await tb_otherstockorder.findOne({
            where: {
                state: GLBConfig.ENABLE,
                otherstock_id: doc.otherstock_id,
                domain_id: user.domain_id
            }
        });

        let queryStr =
            `select s.materiel_id,s.stockapplyitem_id,s.apply_amount,s.apply_price,ifnull(s.remain_number, 0) as remain_number, s.store_price,
            b.materiel_code,b.materiel_name,b.materiel_manage,b.materiel_format,b.materiel_unit
            from tbl_erc_stockapplyitem s,tbl_erc_materiel b
            where s.materiel_id = b.materiel_id and s.state = 1 and s.stockapply_id = ?`;

        let replacements = [];
        replacements.push(otherstockorder.stockapply_id);

        if (doc.search_keyword) {
            queryStr += ' and (b.materiel_code like ? or b.materiel_name like ?)'
            let search_text = '%' + doc.search_keyword + '%';
            replacements.push(search_text);
            replacements.push(search_text);
        }

        queryStr += ` order by s.stockapply_id asc`;

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//创建入库明细申请
async function addStockApplyDetailAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let materiels = doc.materiels;

        let idArray = []
        if (materiels.length > 0) {
            for (let i = 0; i < doc.materiels.length; i++) {
                idArray.push(doc.materiels[i].stockapplyitem_id)
            }
            let stockapplyitems = await tb_stockapplyitem.findAll({
                where: {
                    stockapplyitem_id: {
                        $in: idArray
                    },
                    state: GLBConfig.ENABLE
                }
            });
            for (let file of stockapplyitems) {
                if (file.stock_operate_amount > file.apply_amount || Number(file.stock_operate_amount) + Number(file.remain_number) > Number(file.apply_amount)) {
                    common.sendError(res, 'stock_01');
                    return;
                } else if (file.stock_operate_amount == 0) {
                    common.sendError(res, 'stock_03');
                    return;
                }
            }

            for (let d of materiels) {
                let materiel = await tb_materiel.findOne({
                    where: {
                        materiel_id: d.materiel_id,
                        state: GLBConfig.ENABLE
                    }
                });

                let stockapplyitem = await tb_stockapplyitem.findOne({
                    where: {
                        stockapplyitem_id: d.stockapplyitem_id,
                        state: GLBConfig.ENABLE
                    }
                });

                // if (stockapplyitem.stock_operate_amount > stockapplyitem.apply_amount || Number(stockapplyitem.stock_operate_amount) + Number(stockapplyitem.remain_number) > Number(stockapplyitem.apply_amount)) {
                //     common.sendError(res, 'stock_01');
                // } else if (stockapplyitem.stock_operate_amount == 0) {
                //     common.sendError(res, 'stock_03');
                // } else {
                if(stockapplyitem){
                    if (materiel.materiel_manage == '2') { //销售订单管理
                        let stockmap = await tb_stockmap.findOne({
                            where: {
                                materiel_id: stockapplyitem.materiel_id,
                                state: GLBConfig.ENABLE,
                                warehouse_id: stockapplyitem.warehouse_id,
                                warehouse_zone_id: stockapplyitem.warehouse_zone_id,
                                is_idle_stock: 1
                            }
                        });

                        if (stockmap) {
                            //qm start
                            // stockmap.store_price =
                            //     (Number(stockmap.current_amount) * Number(stockmap.store_price)
                            //         + Number(stockapplyitem.stock_operate_amount) * Number(stockapplyitem.apply_price))
                            //     / (Number(stockmap.current_amount) + Number(stockapplyitem.stock_operate_amount));
                            //qm end
                            stockmap.current_amount = Number(stockmap.current_amount) + Number(stockapplyitem.stock_operate_amount);
                            await stockmap.save()
                        } else {
                            let stockmap = await tb_stockmap.create({
                                domain_id: user.domain_id,
                                warehouse_id: stockapplyitem.warehouse_id,
                                materiel_id: stockapplyitem.materiel_id,
                                current_amount: stockapplyitem.stock_operate_amount,
                                available_amount: stockapplyitem.stock_operate_amount,
                                order_id: null,
                                is_idle_stock: 1,
                                warehouse_zone_id: stockapplyitem.warehouse_zone_id,
                                state: '1',
                                store_price: Number(stockapplyitem.apply_price)
                            });
                        }

                        //qqm start
                        if (stockmap) {
                            let stockMapCount = await tb_stockmap.sum('current_amount', {
                                where: {
                                    materiel_id: stockapplyitem.materiel_id,
                                    state: GLBConfig.ENABLE,
                                }
                            });

                            const storePrice = Number(stockmap.store_price);
                            const currentAmount = Number(stockapplyitem.stock_operate_amount);
                            const currentPrice = Number(stockapplyitem.apply_price);
                            stockMapCount -= currentAmount;
                            tb_stockmap.update({
                                store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                            }, {
                                where: {
                                    materiel_id: stockapplyitem.materiel_id,
                                    state: GLBConfig.ENABLE,
                                }
                            });
                        }
                        //qqm end

                        //qqm start
                        let orgName = '';
                        let orgType = '';
                        const stockapply = await tb_stockapply.findOne({
                            where: {
                                stockapply_id: stockapplyitem.stockapply_id,
                                state: GLBConfig.ENABLE
                            }
                        });

                        if (stockapply) {
                            const user_id = stockapply.apply_submit;

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
                            materiel_id: stockapplyitem.materiel_id,
                            wms_type: 1,
                            manage_type: 3,
                            organization: orgName,
                            org_type: orgType,
                            store_amount: Number(stockapplyitem.stock_operate_amount),
                            store_price: Number(stockapplyitem.apply_price)
                        });
                        //qqm end

                        if (stockapplyitem) {
                            //qqm start
                            stockapplyitem.store_price =
                                (Number(stockapplyitem.remain_number) * Number(stockapplyitem.store_price)
                                + Number(stockapplyitem.stock_operate_amount) * Number(stockapplyitem.apply_price))
                                / (Number(stockapplyitem.remain_number) + Number(stockapplyitem.stock_operate_amount));
                            //qqm end
                            stockapplyitem.remain_number = Number(stockapplyitem.remain_number) + Number(stockapplyitem.stock_operate_amount);

                            let stockapply = await tb_stockapply.findOne({
                                where: {
                                    stockapply_id: stockapplyitem.stockapply_id,
                                    state: GLBConfig.ENABLE
                                }
                            });

                            let inventoryaccount = await tb_inventoryaccount.create({
                                domain_id: user.domain_id,
                                bill_code: doc.other_bill_code,
                                order_id: doc.stockapply_id,
                                p_order_id: stockapply.stockapply_id,
                                warehouse_id: stockapplyitem.warehouse_id,
                                warehouse_zone_id: stockapplyitem.warehouse_zone_id,
                                materiel_id: stockapplyitem.materiel_id,
                                account_operate_amount: stockapplyitem.stock_operate_amount,
                                account_operate_type: 3,
                                remain_amount: Number(stockapplyitem.remain_number)
                            });

                            stockapplyitem.stock_operate_amount = 0
                            if (stockapplyitem.apply_amount == stockapplyitem.remain_number) {
                                stockapplyitem.state = 0
                            }
                            await stockapplyitem.save()
                        }
                    } else { //安全库存管理
                        let stockmap = await tb_stockmap.findOne({
                            where: {
                                materiel_id: stockapplyitem.materiel_id,
                                state: GLBConfig.ENABLE
                            }
                        });
                        if (stockmap) {
                            let stockitem = await tb_stockitem.findOne({
                                where: {
                                    stockmap_id: stockmap.stockmap_id,
                                    state: GLBConfig.ENABLE,
                                    warehouse_id: stockapplyitem.warehouse_id,
                                    warehouse_zone_id: stockapplyitem.warehouse_zone_id
                                }
                            });
                            if (stockitem) {
                                //qqm start
                                // stockitem.store_price =
                                //     (Number(stockitem.item_amount) * Number(stockitem.store_price)
                                //         + Number(stockapplyitem.stock_operate_amount) * Number(stockapplyitem.apply_price))
                                //     / (Number(stockitem.item_amount) + Number(stockapplyitem.stock_operate_amount));
                                //qqm end
                                stockitem.item_amount = Number(stockitem.item_amount) + Number(stockapplyitem.stock_operate_amount);
                                await stockitem.save()
                            } else {
                                let stockitem = await tb_stockitem.create({
                                    stockmap_id: stockmap.stockmap_id,
                                    warehouse_id: stockapplyitem.warehouse_id,
                                    materiel_id: stockapplyitem.materiel_id,
                                    item_amount: stockapplyitem.stock_operate_amount,
                                    warehouse_zone_id: stockapplyitem.warehouse_zone_id,
                                    state: '1',
                                    store_price: Number(stockapplyitem.apply_price)
                                });
                            }

                            //qqm start
                            // stockmap.store_price =
                            //     (Number(stockmap.current_amount) * Number(stockmap.store_price)
                            //         + Number(stockapplyitem.stock_operate_amount) * Number(stockapplyitem.apply_price))
                            //     / (Number(stockmap.current_amount) + Number(stockapplyitem.stock_operate_amount));
                            //qqm end
                            stockmap.current_amount = Number(stockmap.current_amount) + Number(stockapplyitem.stock_operate_amount);
                            await stockmap.save();

                            //qqm start
                            if (stockmap) {
                                let stockMapCount = await tb_stockmap.sum('current_amount', {
                                    where: {
                                        materiel_id: stockapplyitem.materiel_id,
                                        state: GLBConfig.ENABLE,
                                    }
                                });

                                const storePrice = Number(stockmap.store_price);
                                const currentAmount = Number(stockapplyitem.stock_operate_amount);
                                const currentPrice = Number(stockapplyitem.apply_price);
                                stockMapCount -= currentAmount;
                                tb_stockmap.update({
                                    store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                                }, {
                                    where: {
                                        materiel_id: stockapplyitem.materiel_id,
                                        state: GLBConfig.ENABLE,
                                    }
                                });
                            }
                            //qqm end

                            //qqm start
                            let orgName = '';
                            let orgType = '';
                            const stockapply = await tb_stockapply.findOne({
                                where: {
                                    stockapply_id: stockapplyitem.stockapply_id,
                                    state: GLBConfig.ENABLE
                                }
                            });

                            if (stockapply) {
                                const user_id = stockapply.apply_submit;

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
                                materiel_id: stockapplyitem.materiel_id,
                                wms_type: 1,
                                manage_type: 3,
                                organization: orgName,
                                org_type: orgType,
                                store_amount: Number(stockapplyitem.stock_operate_amount),
                                store_price: Number(stockapplyitem.apply_price)
                            });
                            //qqm end

                            if (stockapplyitem) {
                                //qqm start
                                stockapplyitem.store_price =
                                    (Number(stockapplyitem.remain_number) * Number(stockapplyitem.store_price)
                                        + Number(stockapplyitem.stock_operate_amount) * Number(stockapplyitem.apply_price))
                                    / (Number(stockapplyitem.remain_number) + Number(stockapplyitem.stock_operate_amount));
                                //qqm end
                                stockapplyitem.remain_number = Number(stockapplyitem.remain_number) + Number(stockapplyitem.stock_operate_amount)

                                let stockapply = await tb_stockapply.findOne({
                                    where: {
                                        stockapply_id: stockapplyitem.stockapply_id,
                                        state: GLBConfig.ENABLE
                                    }
                                });

                                let inventoryaccount = await tb_inventoryaccount.create({
                                    domain_id: user.domain_id,
                                    bill_code: doc.other_bill_code,
                                    order_id: doc.stockapply_id,
                                    p_order_id: stockapply.stockapply_id,
                                    warehouse_id: stockapplyitem.warehouse_id,
                                    warehouse_zone_id: stockapplyitem.warehouse_zone_id,
                                    materiel_id: stockapplyitem.materiel_id,
                                    account_operate_amount: stockapplyitem.stock_operate_amount,
                                    account_operate_type: 3,
                                    remain_amount: Number(stockapplyitem.remain_number)
                                });

                                stockapplyitem.stock_operate_amount = 0
                                if (stockapplyitem.apply_amount == stockapplyitem.remain_number) {
                                    stockapplyitem.state = 0
                                }
                                await stockapplyitem.save()
                            }
                        } else {
                            return common.sendError(res, 'stock_02')
                        }
                    }
                }

                // }
            }

            let inventoryorder = await tb_inventoryorder.create({
                domain_id: user.domain_id,
                bill_code: doc.other_bill_code,
                bs_order_id: doc.stockapply_id,
                warehouse_id: doc.warehouse_id,
                account_operate_type: 3
            });

        } else {
            return common.sendError(res, 'stock_03')
        }
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//入库历史打印
async function buyInOrderHistoryPrint(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await buyInOrderHistoryDetail(req, doc, user);
        if (doc.filetype != 'pdf' && doc.filetype != 'image') {
            return common.sendError(res, 'common_api_03')
        }

        let fileUrl = await common.ejs2File('erc/inventorymanage/ERCBuyInInvoice.ejs', {
            ejsData: {
                supplier_name: doc.supplier_name,
                bill_code: doc.bill_code,
                buyOrderItemList: JSON.parse(JSON.stringify(returnData.rows))
            }
        }, {
            htmlFlag: false
        }, doc.filetype)
        common.sendData(res, {
            url: fileUrl
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取其他入库历史
async function getOtherListForMaterielAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {},
            queryStr = '',
            replacements = [];
        let materiels = doc.materiels;

        let otherstockorder = await tb_otherstockorder.findOne({
            where: {
                state: GLBConfig.ENABLE,
                otherstock_id: doc.otherstock_id,
                domain_id: user.domain_id
            }
        });

        let idArray = []
        for (let i = 0; i < materiels.length; i++) {
            idArray.push(materiels[i].materiel_id)
        }

        if (doc.warehouse_id != '' && doc.warehouse_zone_id == '') {

            await tb_stockapplyitem.update({
                warehouse_id: doc.warehouse_id,
                warehouse_zone_id: null,
            }, {
                where: {
                    stockapply_id: otherstockorder.stockapply_id,
                    materiel_id: {
                        $in: idArray
                    }
                }
            })

            queryStr = `select s.materiel_id,s.warehouse_zone_id,s.stockapplyitem_id,
            s.apply_amount,s.apply_price,ifnull(s.remain_number, 0) as remain_number, s.store_price,
            b.materiel_code,b.materiel_name,b.materiel_manage,b.materiel_format,b.materiel_unit
            from tbl_erc_stockapplyitem s,tbl_erc_materiel b
            where s.materiel_id = b.materiel_id and s.state = 1 and s.stockapply_id = ? and s.materiel_id in (${idArray})`;

            replacements = [];
            replacements.push(otherstockorder.stockapply_id);

            if (doc.search_keyword) {
                queryStr += ' and (b.materiel_code like ? or b.materiel_name like ?)'
                let search_text = '%' + doc.search_keyword + '%';
                replacements.push(search_text);
                replacements.push(search_text);
            }

        } else {

            await tb_stockapplyitem.update({
                warehouse_id: doc.warehouse_id,
                warehouse_zone_id: doc.warehouse_zone_id,
            }, {
                where: {
                    stockapply_id: otherstockorder.stockapply_id,
                    materiel_id: {
                        $in: idArray
                    }
                }
            })

            queryStr = `select s.materiel_id,s.warehouse_zone_id,s.stockapplyitem_id,
            s.apply_amount,s.apply_price,ifnull(s.remain_number, 0) as remain_number, s.store_price,
            b.materiel_code,b.materiel_name,b.materiel_manage,b.materiel_format,b.materiel_unit
            from tbl_erc_stockapplyitem s,tbl_erc_materiel b
            where s.materiel_id = b.materiel_id and s.state = 1 and s.stockapply_id = ? and s.materiel_id in (${idArray})`;

            replacements = [];
            replacements.push(otherstockorder.stockapply_id);

            if (doc.search_keyword) {
                queryStr += ' and (b.materiel_code like ? or b.materiel_name like ?)'
                let search_text = '%' + doc.search_keyword + '%';
                replacements.push(search_text);
                replacements.push(search_text);
            }
        }

        queryStr += ` order by s.stockapply_id asc`;
        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//修改入库信息
async function modifyAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let stockapplyitem = await tb_stockapplyitem.findOne({
            where: {
                stockapplyitem_id: doc.new.stockapplyitem_id,
                state: GLBConfig.ENABLE
            }
        });
        if (doc.new.stock_operate_amount > stockapplyitem.apply_amount || Number(doc.new.stock_operate_amount) + Number(stockapplyitem.remain_number) > Number(stockapplyitem.apply_amount)) {
            common.sendError(res, 'stock_01');
            return
        } else {
            if (stockapplyitem) {
                stockapplyitem.stock_operate_amount = doc.new.stock_operate_amount, //本次操作数量
                    stockapplyitem.warehouse_zone_id = doc.new.warehouse_zone_id
                await stockapplyitem.save()
            }
        }

        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
        return;
    }
}
//获取产品入库历史
async function getProductInOrderHistory(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select a.ior_id, a.domain_id, a.bill_code, a.bs_order_id, a.warehouse_id, a.created_at
             , b.done_count, pt.productivetask_code, pt.order_id
             from tbl_erc_inventoryorder a
             left join (select ia.bill_code, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where ia.account_operate_type = 5
             group by ia.bill_code) b
             on a.bill_code = b.bill_code
             left join tbl_erc_productivetask pt
             on a.bs_order_id = pt.productivetask_id
             where true
             and a.account_operate_type = 5`;
        let replacements = [];
        if (user.domain_id) {
            queryStr += ` and a.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.start_date) {
            queryStr += ` and to_days(a.created_at) >= to_days(?)`;
            replacements.push(doc.start_date);
        }
        if (doc.end_date) {
            queryStr += ` and to_days(a.created_at) <= to_days(?)`;
            replacements.push(doc.end_date);
        }
        if (doc.other_bill_code) {
            queryStr += ` and a.bill_code = ?`;
            replacements.push(doc.other_bill_code);
        }
        if (doc.os_order_id) {
            queryStr += ` and a.bs_order_id = ?`;
            replacements.push(doc.os_order_id);
        }
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取其他入库历史
async function getOtherInOrderHistoryAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select a.ior_id, a.domain_id, a.bill_code,a.bs_order_id, a.warehouse_id, a.created_at, b.done_count
             from tbl_erc_inventoryorder a
             left join (select ia.bill_code, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where ia.account_operate_type = 3
             group by ia.bill_code) b
             on a.bill_code = b.bill_code
             where true
             and a.account_operate_type = 3`;
        let replacements = [];
        if (user.domain_id) {
            queryStr += ` and a.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.start_date) {
            queryStr += ` and to_days(a.created_at) >= to_days(?)`;
            replacements.push(doc.start_date);
        }
        if (doc.end_date) {
            queryStr += ` and to_days(a.created_at) <= to_days(?)`;
            replacements.push(doc.end_date);
        }
        if (doc.other_bill_code) {
            queryStr += ` and a.bill_code = ?`;
            replacements.push(doc.other_bill_code);
        }
        if (doc.os_order_id) {
            queryStr += ` and a.bs_order_id = ?`;
            replacements.push(doc.os_order_id);
        }
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取其他入库历史明细
async function otherInOrderHistoryDetail(req, doc, user) {

    let returnData = {};
    let queryStr = `select a.bill_code,a.domain_id,a.order_id,a.p_order_id,a.account_operate_amount,
        a.warehouse_zone_id, a.company_name, a.account_note, a.created_at,
        b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit,
        b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax,
        format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost,
        format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
        , sai.apply_price
        from tbl_erc_inventoryaccount a
        left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
        left join tbl_erc_stockapply c on a.p_order_id = c.stockapply_id
        left join tbl_erc_stockapplyitem sai
        on (c.stockapply_id = sai.stockapply_id and a.materiel_id = sai.materiel_id)
        where true and a.account_operate_type = 3 and a.bill_code = ?`;
    let replacements = [];
    replacements.push(doc.bill_code);
    if (user.domain_id) {
        queryStr += ` and a.domain_id = ?`;
        replacements.push(user.domain_id);
    }

    if (doc.other_bill_code) {
        queryStr += ` and a.bill_code = ?`;
        replacements.push(doc.other_bill_code);
    }
    if (doc.materiel) {
        queryStr += ` and (b.materiel_code like ?`;
        replacements.push(doc.materiel);
        queryStr += ` or b.materiel_name like ?)`;
        replacements.push(doc.materiel);
    }
    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = result.data;

    return returnData;
}
//获取产品入库历史明细
async function productInOrderHistoryDetail(req, doc, user) {

    let returnData = {};
    let queryStr =
        `select
            a.bill_code,a.domain_id,a.order_id,a.p_order_id,a.account_operate_amount
            , a.warehouse_zone_id, a.company_name, a.account_note, a.created_at
            , b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit
            , b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax
            , format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost
            , format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
            , pt.taskdesign_price
            from tbl_erc_inventoryaccount a
            left join tbl_erc_inventoryorder io
            on a.bill_code = io.bill_code
            left join tbl_erc_productivetask pt
            on io.bs_order_id = pt.productivetask_id
            left join tbl_erc_materiel b
            on a.materiel_id = b.materiel_id
            where a.bill_code = ?`;
    let replacements = [];
    replacements.push(doc.bill_code);
    if (user.domain_id) {
        queryStr += ` and a.domain_id = ?`;
        replacements.push(user.domain_id);
    }

    if (doc.other_bill_code) {
        queryStr += ` and a.bill_code = ?`;
        replacements.push(doc.other_bill_code);
    }
    if (doc.materiel) {
        queryStr += ` and (b.materiel_code like ?`;
        replacements.push(doc.materiel);
        queryStr += ` or b.materiel_name like ?)`;
        replacements.push(doc.materiel);
    }
    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = result.data;

    return returnData;
}
//获取其他订单明细
async function getOtherInOrderHistoryDetailAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await otherInOrderHistoryDetail(req, doc, user);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取其他订单明细
async function getProductInOrderHistoryDetailAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await productInOrderHistoryDetail(req, doc, user);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//其他订单历史打印
async function OtherInOrderHistoryPrintAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await otherInOrderHistoryDetail(req, doc, user);
        if (doc.filetype != 'pdf' && doc.filetype != 'image') {
            return common.sendError(res, 'common_api_03')
        }

        let fileUrl = await common.ejs2File('erc/inventorymanage/ERCOtherInInvoice.ejs', {
            ejsData: {
                bill_code: doc.bill_code,
                otherOrderItemList: JSON.parse(JSON.stringify(returnData.rows))
            }
        }, {
            htmlFlag: false
        }, doc.filetype)
        common.sendData(res, {
            url: fileUrl
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取质检单
async function getQualityCheckOrderAct(req, res) {
    let doc = common.docTrim(req.body),
        user = req.user,
        replacements = [],
        returnData = {};

    let queryStr =
        `select
             q.qualitycheck_id, q.purchaseorder_id
             , cu.name, if(qd.finishStock_number is null, 1, if(qd.finishStock_number < qd.qualified_number, 2, 3)) as order_status
             , if(finishStock_number = 0, 1, if(finishStock_number < qualified_number, 2, 3)) as order_status
             from tbl_erc_qualitycheck q 
             left join tbl_common_user cu
             on (q.user_id=cu.user_id and cu.state=1) 
             left join (
             select qualitycheck_id,IFNULL(sum(qualified_number),0) as qualified_number,IFNULL(sum(finishStock_number),0) as finishStock_number
             from tbl_erc_qualitycheckdetail
             where state=1
             group by qualitycheck_id) qd
             on (q.qualitycheck_id = qd.qualitycheck_id ) 
             where q.state=1 `;
    if (user.domain_id) {
        queryStr += ` and q.domain_id=?`;
        replacements.push(user.domain_id);
    }
    if (doc.search_keyword) {
        queryStr += ' and q.qualitycheck_id like ?';
        replacements.push('%' + doc.search_keyword + '%');
    }
    if (doc.search_type == 1) {
        queryStr += ' and qd.finishStock_number = 0';
    } else if (doc.search_type == 2) {
        queryStr += ' and qd.finishStock_number < qd.qualified_number and qd.finishStock_number<>0';
    } else if (doc.search_type == 3) {
        queryStr += ' and qd.finishStock_number = qd.qualified_number';
    }

    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = result.count;
    returnData.rows = result.data;
    common.sendData(res, returnData);
}
//获取质检单详情
async function getQualityCheckOrderDetailAct(req, res) {
    try{
        let doc = common.docTrim(req.body),
            user = req.user,
            replacements = [],
            returnData = {};

        let queryStr =
            `select
                qd.qualitycheckdetail_id,qd.order_id
                ,m.materiel_id,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit
                ,qd.qualified_number,qd.finishStock_number,qd.finishStock_price,q.supplier_id,s.supplier_name,s.supplier
                ,pd.purchase_number, pd.purchase_price
                from tbl_erc_qualitycheckdetail qd 
                left join tbl_erc_qualitycheck q
                on (qd.qualitycheck_id = q.qualitycheck_id and q.state=1) 
                left join tbl_erc_purchasedetail pd
                on qd.purchasedetail_id = pd.purchasedetail_id
                left join tbl_erc_materiel m
                on (qd.materiel_id = m.materiel_id and m.state=1) 
                left join tbl_erc_supplier s
                on (q.supplier_id = s.supplier_id and q.state=1) 
                where qd.state=1
                and qd.qualified_number<>0 `;
        if (doc.qualitycheck_id) {
            queryStr += ` and qd.qualitycheck_id=?`;
            replacements.push(doc.qualitycheck_id);
        }
        if (doc.search_keyword) {
            queryStr += ` and m.materiel_name like ?`;
            replacements.push('%' + doc.search_keyword + '%');
        }

        queryStr += ` order by qd.materiel_id`;

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取质检单物料详情
async function getQualityCheckListForMaterielAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {},
            queryStr = '',
            replacements = [];
        let materiels = doc.materiels;

        let idArray = [];
        for (let i = 0; i < materiels.length; i++) {
            idArray.push(materiels[i].qualitycheckdetail_id)
        }
        let warehouse_zone_id = null
        if (doc.warehouse_zone_id != null){
            warehouse_zone_id = doc.warehouse_zone_id
        }

        await tb_qualitycheckdetail.update({
            warehouse_id: doc.warehouse_id,
            warehouse_zone_id: warehouse_zone_id,
        }, {
            where: {
                qualitycheck_id: doc.qualitycheck_id,
                qualitycheckdetail_id: {
                    $in: idArray
                }
            }
        });

        queryStr =
            `select
                qd.qualitycheckdetail_id,qd.order_id
                ,m.materiel_code,m.materiel_name
                ,m.materiel_format,m.materiel_unit,m.materiel_manage
                ,qd.qualified_number,qd.finishStock_number,qd.finishStock_price,qd.warehouse_id,qd.warehouse_zone_id,0 as stock_operate_amount 
                ,pd.purchase_number, pd.purchase_price
                from tbl_erc_qualitycheckdetail qd 
                left join tbl_erc_qualitycheck q
                on (qd.qualitycheck_id = q.qualitycheck_id and q.state=1) 
                left join tbl_erc_purchasedetail pd
                on qd.purchasedetail_id = pd.purchasedetail_id
                left join tbl_erc_materiel m
                on (qd.materiel_id = m.materiel_id and m.state=1) 
                where qd.state=1
                and qd.qualitycheck_id=?
                and qd.qualitycheckdetail_id in (${idArray})`;
        replacements.push(doc.qualitycheck_id);
        if (doc.search_keyword) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?)';
            let search_text = '%' + doc.search_keyword + '%';
            replacements.push(search_text);
            replacements.push(search_text);
        }
        queryStr += ` order by m.materiel_id asc`;
        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//修改质检详情
async function modifyQualityDetailAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let qualitycheckdetail = await tb_qualitycheckdetail.findOne({
            where: {
                qualitycheckdetail_id: doc.new.qualitycheckdetail_id,
                state: GLBConfig.ENABLE
            }
        });
        if (doc.new.stock_operate_amount > qualitycheckdetail.qualified_number || Number(doc.new.stock_operate_amount) + Number(qualitycheckdetail.finishStock_number) > Number(qualitycheckdetail.qualified_number)) {
            common.sendError(res, 'stock_06');
            return
        } else {
            if (qualitycheckdetail) {
                qualitycheckdetail.stock_operate_amount = doc.new.stock_operate_amount, //本次操作数量
                qualitycheckdetail.warehouse_zone_id = doc.new.warehouse_zone_id;
                await qualitycheckdetail.save()
            }
        }
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
        return;
    }
}

//库存质检详情
async function addStockMapDetailFromQualityAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let materiels = doc.materiels;

        if (materiels.length > 0) {
            for (let d of materiels) {
                let materiel = await tb_materiel.findOne({
                    where: {
                        materiel_id: d.materiel_id,
                        state: GLBConfig.ENABLE
                    }
                });
                if (!materiel) {
                    return common.sendError(res, 'stock_07')
                }

                let qualitycheckdetail = await tb_qualitycheckdetail.findOne({
                    where: {
                        qualitycheckdetail_id: d.qualitycheckdetail_id,
                        state: GLBConfig.ENABLE
                    }
                });

                // if (qualitycheckdetail.stock_operate_amount > qualitycheckdetail.qualified_number || Number(qualitycheckdetail.stock_operate_amount) + Number(qualitycheckdetail.finishStock_number) > Number(qualitycheckdetail.qualified_number)) {
                //     return common.sendError(res, 'stock_06');
                // } else if (qualitycheckdetail.stock_operate_amount == 0) {
                //     return common.sendError(res, 'stock_03');
                // } else {
                if (qualitycheckdetail.stock_operate_amount > 0) {
                    const { purchase_price } = await tb_purchasedetail.findOne({
                        where: {
                            purchasedetail_id: qualitycheckdetail.purchasedetail_id,
                            materiel_id: d.materiel_id,
                            state: GLBConfig.ENABLE
                        },
                        attributes: ['purchase_price']
                    });

                    if (materiel.materiel_manage == '2') { //销售订单管理
                        let stockmap = await tb_stockmap.findOne({
                            where: {
                                materiel_id: qualitycheckdetail.materiel_id,
                                state: GLBConfig.ENABLE,
                                warehouse_id: qualitycheckdetail.warehouse_id,
                                warehouse_zone_id: qualitycheckdetail.warehouse_zone_id,
                                order_id:qualitycheckdetail.order_id
                            }
                        });

                        if (stockmap) {
                            //qm start
                            // stockmap.store_price =
                            //     (Number(stockmap.current_amount) * Number(stockmap.store_price)
                            //         + Number(qualitycheckdetail.stock_operate_amount) * Number(purchase_price))
                            //     / (Number(stockmap.current_amount) + Number(qualitycheckdetail.stock_operate_amount));
                            //qm end
                            stockmap.current_amount = Number(stockmap.current_amount) + Number(qualitycheckdetail.stock_operate_amount);
                            await stockmap.save()
                        } else {
                            let stockmap = await tb_stockmap.create({
                                domain_id: user.domain_id,
                                warehouse_id: qualitycheckdetail.warehouse_id,
                                materiel_id: qualitycheckdetail.materiel_id,
                                current_amount: qualitycheckdetail.stock_operate_amount,
                                available_amount: qualitycheckdetail.stock_operate_amount,
                                order_id: qualitycheckdetail.order_id,
                                is_idle_stock: 0,
                                warehouse_zone_id: qualitycheckdetail.warehouse_zone_id,
                                state: '1',
                                store_price: Number(purchase_price)
                            });
                        }

                        if (qualitycheckdetail) {
                            //qm start
                            qualitycheckdetail.finishStock_price =
                                (Number(qualitycheckdetail.finishStock_number) * Number(qualitycheckdetail.finishStock_price)
                                    + Number(qualitycheckdetail.stock_operate_amount) * Number(purchase_price))
                                / (Number(qualitycheckdetail.finishStock_number) + Number(qualitycheckdetail.stock_operate_amount));
                            //qm end
                            qualitycheckdetail.finishStock_number = Number(qualitycheckdetail.finishStock_number) + Number(qualitycheckdetail.stock_operate_amount)

                            let qualitycheck = await tb_qualitycheck.findOne({
                                where: {
                                    qualitycheck_id: doc.qualitycheck_id,
                                    state: GLBConfig.ENABLE
                                }
                            });

                            let inventoryaccount = await tb_inventoryaccount.create({
                                domain_id: user.domain_id,
                                bill_code: doc.quality_bill_code,
                                order_id: d.order_id,
                                p_order_id: qualitycheck.purchaseorder_id,
                                warehouse_id: qualitycheckdetail.warehouse_id,
                                warehouse_zone_id: qualitycheckdetail.warehouse_zone_id,
                                materiel_id: qualitycheckdetail.materiel_id,
                                account_operate_amount: qualitycheckdetail.stock_operate_amount,
                                account_operate_type: 1,
                                remain_amount: Number(qualitycheckdetail.finishStock_number)
                            });

                            //qqm start
                            if (stockmap) {
                                let stockMapCount = await tb_stockmap.sum('current_amount', {
                                    where: {
                                        materiel_id: qualitycheckdetail.materiel_id,
                                        state: GLBConfig.ENABLE,
                                    }
                                });

                                const storePrice = Number(stockmap.store_price);
                                const currentAmount = Number(qualitycheckdetail.stock_operate_amount);
                                const currentPrice = Number(purchase_price);
                                stockMapCount -= currentAmount;
                                tb_stockmap.update({
                                    store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                                }, {
                                    where: {
                                        materiel_id: qualitycheckdetail.materiel_id,
                                        state: GLBConfig.ENABLE,
                                    }
                                });
                            }
                            //qqm end

                            //qqm start 生产财务单据数据
                            let orgName = '';
                            const qualityCheck = await tb_qualitycheck.findOne({
                                where: {
                                    qualitycheck_id: qualitycheckdetail.qualitycheck_id
                                }
                            });

                            if (qualityCheck) {
                                const supplier_id = qualityCheck.supplier_id;

                                const supplier = await tb_supplier.findOne({
                                    where: {
                                        supplier_id
                                    }
                                });

                                if (supplier) {
                                    orgName = supplier.supplier_name;
                                }
                            }

                            await tb_financerecorditem.create({
                                domain_id: user.domain_id,
                                materiel_id: qualitycheckdetail.materiel_id,
                                wms_type: 1,
                                manage_type: 1,
                                organization: orgName,
                                store_amount: Number(qualitycheckdetail.stock_operate_amount),
                                store_price: Number(purchase_price)
                            });
                            //qqm end 生产财务单据数据

                            qualitycheckdetail.stock_operate_amount = 0;
                            if (qualitycheckdetail.qualified_number == qualitycheckdetail.finishStock_number) {
                                qualitycheckdetail.state = 0
                            }
                            await qualitycheckdetail.save()
                        }
                    } else { //安全库存管理
                        let stockmap = await tb_stockmap.findOne({
                            where: {
                                materiel_id: qualitycheckdetail.materiel_id,
                                state: GLBConfig.ENABLE
                            }
                        });
                        if (stockmap) {
                            let stockitem = await tb_stockitem.findOne({
                                where: {
                                    stockmap_id: stockmap.stockmap_id,
                                    state: GLBConfig.ENABLE,
                                    warehouse_id: qualitycheckdetail.warehouse_id,
                                    warehouse_zone_id: qualitycheckdetail.warehouse_zone_id
                                }
                            });
                            if (stockitem) {
                                //qm start
                                stockitem.store_price =
                                    (Number(stockitem.item_amount) * Number(stockitem.store_price)
                                        + Number(qualitycheckdetail.stock_operate_amount) * Number(purchase_price))
                                    / (Number(stockitem.item_amount) + Number(qualitycheckdetail.stock_operate_amount));
                                //qm end
                                stockitem.item_amount = Number(stockitem.item_amount) + Number(qualitycheckdetail.stock_operate_amount);
                                await stockitem.save()
                            } else {
                                let stockitem = await tb_stockitem.create({
                                    stockmap_id: stockmap.stockmap_id,
                                    warehouse_id: qualitycheckdetail.warehouse_id,
                                    materiel_id: qualitycheckdetail.materiel_id,
                                    item_amount: qualitycheckdetail.stock_operate_amount,
                                    warehouse_zone_id: qualitycheckdetail.warehouse_zone_id,
                                    state: '1',
                                    store_price: Number(purchase_price)
                                });
                            }

                            //qm start
                            // stockmap.store_price =
                            //     (Number(stockmap.current_amount) * Number(stockmap.store_price)
                            //         + Number(qualitycheckdetail.stock_operate_amount) * Number(purchase_price))
                            //     / (Number(stockmap.current_amount) + Number(qualitycheckdetail.stock_operate_amount));
                            //qm end
                            stockmap.current_amount = Number(stockmap.current_amount) + Number(qualitycheckdetail.stock_operate_amount);
                            await stockmap.save();

                            if (qualitycheckdetail) {
                                //qm start
                                qualitycheckdetail.finishStock_price =
                                    (Number(qualitycheckdetail.finishStock_number) * Number(qualitycheckdetail.finishStock_price)
                                        + Number(qualitycheckdetail.stock_operate_amount) * Number(purchase_price))
                                    / (Number(qualitycheckdetail.finishStock_number) + Number(qualitycheckdetail.stock_operate_amount));
                                //qm end
                                qualitycheckdetail.finishStock_number = Number(qualitycheckdetail.finishStock_number) + Number(qualitycheckdetail.stock_operate_amount);

                                let qualitycheck = await tb_qualitycheck.findOne({
                                    where: {
                                        qualitycheck_id: doc.qualitycheck_id,
                                        state: GLBConfig.ENABLE
                                    }
                                });

                                let inventoryaccount = await tb_inventoryaccount.create({
                                    domain_id: user.domain_id,
                                    bill_code: doc.quality_bill_code,
                                    order_id: qualitycheckdetail.order_id,
                                    p_order_id: qualitycheck.purchaseorder_id,
                                    warehouse_id: qualitycheckdetail.warehouse_id,
                                    warehouse_zone_id: qualitycheckdetail.warehouse_zone_id,
                                    materiel_id: qualitycheckdetail.materiel_id,
                                    account_operate_amount: qualitycheckdetail.stock_operate_amount,
                                    account_operate_type: 1,
                                    remain_amount: Number(qualitycheckdetail.finishStock_number)
                                });

                                //qqm start
                                if (stockmap) {
                                    let stockMapCount = await tb_stockmap.sum('current_amount', {
                                        where: {
                                            materiel_id: qualitycheckdetail.materiel_id,
                                            state: GLBConfig.ENABLE,
                                        }
                                    });

                                    const storePrice = Number(stockmap.store_price);
                                    const currentAmount = Number(qualitycheckdetail.stock_operate_amount);
                                    const currentPrice = Number(purchase_price);
                                    stockMapCount -= currentAmount;
                                    tb_stockmap.update({
                                        store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                                    }, {
                                        where: {
                                            materiel_id: qualitycheckdetail.materiel_id,
                                            state: GLBConfig.ENABLE,
                                        }
                                    });
                                }
                                //qqm end

                                //qqm start 生产财务单据数据
                                let orgName = '';
                                const qualityCheck = await tb_qualitycheck.findOne({
                                    where: {
                                        qualitycheck_id: qualitycheckdetail.qualitycheck_id
                                    }
                                });

                                if (qualityCheck) {
                                    const supplier_id = qualityCheck.supplier_id;

                                    const supplier = await tb_supplier.findOne({
                                        where: {
                                            supplier_id
                                        }
                                    });

                                    if (supplier) {
                                        orgName = supplier.supplier_name;
                                    }
                                }

                                await tb_financerecorditem.create({
                                    domain_id: user.domain_id,
                                    materiel_id: qualitycheckdetail.materiel_id,
                                    wms_type: 1,
                                    manage_type: 1,
                                    organization: orgName,
                                    store_amount: Number(qualitycheckdetail.stock_operate_amount),
                                    store_price: Number(purchase_price)
                                });
                                //qqm end 生产财务单据数据

                                qualitycheckdetail.stock_operate_amount = 0
                                if (qualitycheckdetail.qualified_number == qualitycheckdetail.finishStock_number) {
                                    qualitycheckdetail.state = 0
                                }
                                await qualitycheckdetail.save()
                            }
                        } else {
                            return common.sendError(res, 'stock_02')
                        }
                    }
                }
            }

            let inventoryorder = await tb_inventoryorder.create({
                domain_id: user.domain_id,
                bill_code: doc.quality_bill_code,
                bs_order_id: doc.qualitycheck_id,
                warehouse_id: doc.warehouse_id,
                account_operate_type: 1,
                supplier_code:doc.materiels[0].supplier?doc.materiels[0].supplier:'',
                supplier_name:doc.materiels[0].supplier_name?doc.materiels[0].supplier_name:''
            });

        } else {
            return common.sendError(res, 'stock_03')
        }
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
        return;
    }
}
//产品入库里列表
async function getProductInOrderAct(req, res) {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        let queryStr = `select pt.*, u.name from tbl_erc_productivetask pt
                        left join tbl_erc_productivetaskrelated ptr on pt.productivetask_id = ptr.productivetask_id
                        left join tbl_erc_order o on pt.order_id = o.order_id 
                        left join tbl_common_user u on o.user_id = u.user_id
                        where pt.domain_id = ? `;
        let replacements = [user.domain_id];
        if (doc.productivetask_code) {
            queryStr += ` and pt.productivetask_code = ? `;
            replacements.push(doc.productivetask_code);
        }
        if (doc.stock_in_state > 0) {
            queryStr += ` and pt.stock_in_state = ? `;
            replacements.push(doc.stock_in_state);
        }
        queryStr += ` group by pt.productivetask_id `;
        queryStr += ` order by pt.productivetask_id desc `;

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//产品入库明细
async function getProductInItemsAct(req, res) {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        //联产品边余料
        let queryStr = `select ptr.*, m.materiel_code, m.materiel_name, m.materiel_format, m.materiel_unit, pt.order_id,0 as inPrice 
                        from tbl_erc_productivetaskrelated ptr 
                        left join tbl_erc_materiel m on (ptr.materiel_id = m.materiel_id and m.state = 1) 
                        left join tbl_erc_productivetask pt on ptr.productivetask_id = pt.productivetask_id 
                        where ptr.productivetask_id = ? and pt.domain_id = ?`;
        let replacements = [doc.productivetask_id, user.domain_id];
        if (doc.search_text) {
            queryStr += ' and (m.materiel_code like ? or m.materiel_name like ?) '
            let search_text = '%' + doc.search_text + '%';
            replacements.push(search_text);
            replacements.push(search_text);
        }
        let result1 = await common.simpleSelect(sequelize, queryStr, replacements);
        //成品
        let queryStr2 = `select pt.*, m.materiel_code, m.materiel_name, m.materiel_format, m.materiel_unit,taskdesign_price as inPrice 
                         from tbl_erc_productivetask pt
                         left join tbl_erc_materiel m on (pt.materiel_id = m.materiel_id and m.state = 1) 
                         where pt.productivetask_id = ? and pt.domain_id = ?`;
        let replacements2 = [doc.productivetask_id, user.domain_id];
        if (doc.search_text) {
            queryStr2 += ' and (m.materiel_code like ? or m.materiel_name like ?) ';
            let search_text = '%' + doc.search_text + '%';
            replacements2.push(search_text);
            replacements2.push(search_text);
        }
        let result2 = await common.simpleSelect(sequelize, queryStr2, replacements2);
        // for(let r of result2){
        //     queryStr = `select `
        // }
        common.sendData(res, result1.concat(result2));
    } catch (error) {
        common.sendFault(res, error);
    }
}
//提交产品入库明细
async function submitProductInItemsAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let materiels = doc.materiels;

        if (materiels.length > 0) {
            for (let m of materiels) {
                let materiel = await tb_materiel.findOne({
                    where: {
                        materiel_id: m.materiel_id,
                        state: GLBConfig.ENABLE
                    }
                });
                let remains = 0;//入库剩余数量
                if (materiel.materiel_manage == '2') { //销售订单管理
                    let stockmap = await tb_stockmap.findOne({
                        where: {
                            materiel_id: m.materiel_id,
                            state: GLBConfig.ENABLE,
                            warehouse_id: doc.warehouse_id,
                            warehouse_zone_id: m.warehouse_zone_id,
                            order_id: m.order_id
                        }
                    });

                    if (stockmap) {
                        //nie start
                        // stockmap.store_price =
                        //     (Number(stockmap.current_amount) * Number(stockmap.store_price)
                        //     + Number(m.stock_operate_amount) * Number(m.inPrice))
                        //     / (Number(stockmap.current_amount) + Number(m.stock_operate_amount));
                        //nie end
                        stockmap.current_amount = Number(stockmap.current_amount) + Number(m.stock_operate_amount);
                        remains = stockmap.current_amount;
                        await stockmap.save()
                    } else {
                        let stockmap = await tb_stockmap.create({
                            domain_id: user.domain_id,
                            warehouse_id: doc.warehouse_id,
                            materiel_id: m.materiel_id,
                            current_amount: m.stock_operate_amount,
                            available_amount: m.stock_operate_amount,
                            order_id: m.order_id,
                            is_idle_stock: 0,
                            warehouse_zone_id: m.warehouse_zone_id,
                            state: '1',
                            store_price:m.inPrice
                        });
                        remains = stockmap.current_amount;
                    }

                    //nie start
                    if (stockmap) {
                        let stockMapCount = await tb_stockmap.sum('current_amount', {
                            where: {
                                materiel_id: stockapplyitem.materiel_id,
                                state: GLBConfig.ENABLE,
                            }
                        });

                        const storePrice = Number(stockmap.store_price);
                        const currentAmount = Number(m.stock_operate_amount);
                        const currentPrice = Number(m.inPrice);
                        stockMapCount -= currentAmount;
                        tb_stockmap.update({
                            store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                        }, {
                            where: {
                                materiel_id: m.materiel_id,
                                state: GLBConfig.ENABLE,
                            }
                        });
                    }
                    //nie end
                } else {
                    let stockmap = await tb_stockmap.findOne({
                        where: {
                            materiel_id: m.materiel_id,
                            state: GLBConfig.ENABLE
                        }
                    });
                    if (stockmap) {
                        let stockitem = await tb_stockitem.findOne({
                            where: {
                                stockmap_id: stockmap.stockmap_id,
                                state: GLBConfig.ENABLE,
                                warehouse_id: doc.warehouse_id,
                                warehouse_zone_id: m.warehouse_zone_id
                            }
                        });
                        if (stockitem) {
                            stockitem.item_amount = Number(stockitem.item_amount) + Number(m.stock_operate_amount);
                            await stockitem.save()
                        } else {
                            let stockitem = await tb_stockitem.create({
                                stockmap_id: stockmap.stockmap_id,
                                warehouse_id: doc.warehouse_id,
                                materiel_id: m.materiel_id,
                                item_amount: m.stock_operate_amount,
                                warehouse_zone_id: m.warehouse_zone_id,
                                state: '1'
                            });
                        }
                        stockmap.current_amount = Number(stockmap.current_amount) + Number(m.stock_operate_amount);
                        remains = stockmap.current_amount;
                        await stockmap.save()
                    }

                    //nie start
                    if (stockmap) {
                        let stockMapCount = await tb_stockmap.sum('current_amount', {
                            where: {
                                materiel_id: m.materiel_id,
                                state: GLBConfig.ENABLE,
                            }
                        });

                        const storePrice = Number(stockmap.store_price);
                        const currentAmount = Number(m.stock_operate_amount);
                        const currentPrice = Number(m.inPrice);
                        stockMapCount -= currentAmount;
                        tb_stockmap.update({
                            store_price: (stockMapCount * storePrice + currentAmount * currentPrice) / (stockMapCount + currentAmount)
                        }, {
                            where: {
                                materiel_id: m.materiel_id,
                                state: GLBConfig.ENABLE,
                            }
                        });
                    }
                    //nie end
                }
                //收发存明细
                let inventoryaccount = await tb_inventoryaccount.create({
                    domain_id: user.domain_id,
                    bill_code: doc.bill_code,
                    order_id: m.order_id,
                    p_order_id: doc.productivetask_id,
                    warehouse_id: doc.warehouse_id,
                    warehouse_zone_id: m.warehouse_zone_id,
                    materiel_id: m.materiel_id,
                    account_operate_amount: m.stock_operate_amount,
                    account_operate_type: 5,
                    remain_amount: Number(remains)
                });

                //qqm start
                let orgName = '';
                const invertoryOrder = await tb_inventoryorder.findOne({
                    where: {
                        bill_code: doc.bill_code
                    }
                });

                if (invertoryOrder) {
                    const productiveTask = await tb_productivetask.findOne({
                        where: {
                            productivetask_id: invertoryOrder.bs_order_id
                        }
                    });

                    if (productiveTask) {
                        orgName = productiveTask.productivetask_code;
                    }
                }

                await tb_financerecorditem.create({
                    domain_id: user.domain_id,
                    materiel_id: m.materiel_id,
                    wms_type: 1,
                    manage_type: 2,
                    organization: orgName,
                    store_amount: Number(m.stock_operate_amount),
                    store_price: Number(m.inPrice)
                });
                //qqm end

                //更新联产品、边余料、成品的已收货数量
                if (m.taskrelated_type) {
                    await tb_productivetaskrelated.increment(
                        ['related_stock_in_number'],
                        {
                            by: Number(m.stock_operate_amount),
                            where: {
                                productivetaskrelated_id: m.productivetaskrelated_id
                            }
                        }
                    );
                } else {
                    await tb_productivetask.increment(
                        ['stock_in_number'],
                        {
                            by: Number(m.stock_operate_amount),
                            where: {
                                productivetask_id: m.productivetask_id,
                                domain_id: user.domain_id
                            }
                        }
                    );
                }
            }

            //更改生产任务单入库状态
            let related = await tb_productivetaskrelated.findOne({
                where: {
                    productivetask_id: doc.productivetask_id
                }
            });
            let queryStr = '';
            if (related) {
                queryStr = `select pt.* from tbl_erc_productivetask pt
                            left join tbl_erc_productivetaskrelated ptr on pt.productivetask_id = ptr.productivetask_id
                            where pt.taskdesign_number = pt.stock_in_number 
                            and ptr.taskrelateddesign_number = ptr.related_stock_in_number 
                            and pt.domain_id = ? and pt.productivetask_id = ?`;
            } else {
                queryStr = `select * from tbl_erc_productivetask 
                            where taskdesign_number = stock_in_number 
                            and domain_id = ? and productivetask_id = ?`;
            }
            let replacements = [user.domain_id, doc.productivetask_id];
            let reuslt = await common.simpleSelect(sequelize, queryStr, replacements);
            if (reuslt.length > 0) {
                await tb_productivetask.update({
                    stock_in_state: 3
                }, {
                    where: {
                        productivetask_id: doc.productivetask_id,
                        domain_id: user.domain_id
                    }
                });
            } else {
                await tb_productivetask.update({
                    stock_in_state: 2
                }, {
                    where: {
                        productivetask_id:doc.productivetask_id,
                        domain_id: user.domain_id
                    }
                });
            }
            //入库流水
            let inventoryorder = await tb_inventoryorder.create({
                domain_id: user.domain_id,
                bill_code: doc.bill_code,
                bs_order_id: doc.productivetask_id,
                warehouse_id: doc.warehouse_id,
                account_operate_type: 5,
                supplier_code: '',
                supplier_name: ''
            });
        } else {
            return common.sendError(res, 'stock_03')
        }
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
    }
}
