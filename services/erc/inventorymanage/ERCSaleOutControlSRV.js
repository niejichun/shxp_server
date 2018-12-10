const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCSaleOutControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const FDomain = require('../../../bl/common/FunctionDomainBL');
const inventoryControl = require('./ERCInventoryControlSRV');

const sequelize = model.sequelize;
const tb_warehouse = model.erc_warehouse;
const tb_warehousezone = model.erc_warehousezone;
const tb_inventoryorder = model.erc_inventoryorder;
const tb_inventoryaccount = model.erc_inventoryaccount;
const tb_stockitem = model.erc_stockitem;
const tb_stockmap = model.erc_stockmap;
const tb_user = model.common_user;
const tb_order = model.erc_order;
const tb_orderworkflow = model.erc_orderworkflow;
const tb_materiel = model.erc_materiel;
const tb_productivetask = model.erc_productivetask;
const tb_productivetaskrelated = model.erc_productivetaskrelated;
const tb_financerecorditem = model.erc_financerecorditem;


exports.ERCSaleOutControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res);
    } else if (method === 'initActDetail'){
        initActDetail(req, res)
    } else if (method === 'getSaleOutOrderByType'){
        getSaleOutOrderByType(req, res)
    } else if (method === 'getSaleOutOrder'){
        getSaleOutOrder(req, res)
    } else if (method === 'getSaleOutOrderMateriel'){
        getSaleOutOrderMateriel(req, res)
    } else if (method === 'createSaleOutOrder') {
        createSaleOutOrder(req, res)
    } else if (method === 'getSaleOutOrderHistory') {
        getSaleOutOrderHistory(req, res)
    } else if (method === 'getSaleOutOrderHistoryDetail') {
        getSaleOutOrderHistoryDetail(req, res)
    } else if (method === 'getOtherOutOrderHistory') {
        getOtherOutOrderHistory(req, res)
    } else if (method === 'getOtherOutHistoryDetail') {
        getOtherOutHistoryDetail(req, res)
    } else if (method === 'getProductOutOrderHistory') {
        getProductOutOrderHistory(req, res)
    } else if (method === 'getProductOutHistoryDetail') {
        getProductOutHistoryDetail(req, res)
    } else if (method === 'otherOutHistoryPrint'){
        otherOutHistoryPrintAct(req, res)
    } else if (method === 'getOtherOutOrder') {
        getOtherOutOrder(req, res)
    } else if (method==='initSaleOut'){
        initSaleOut(req,res)
    } else if (method==='getWarehouseZone'){
        getWarehouseZone(req,res)
    } else if (method==='getSaleOutOrderMaterielOperate'){
        getSaleOutOrderMaterielOperate(req,res)
    } else if (method==='StockSaleOut'){
        StockSaleOut(req,res)
    } else if (method==='checkOutNumber'){
        checkOutNumber(req,res)
    } else if (method === 'getProductOutOrder') {//获取生产领料列表
        getProductOutOrderAct(req, res)
    } else if (method === 'getProductOutItems') {//获取生产领料明细
        getProductOutItemsAct(req, res);
    } else if (method === 'submitProductOutItems') {//提交生产领料出库
        submitProductOutItemsAct(req, res);
    }else {
        common.sendError(res, 'common_01')
    }
};
//初始化数据
let initAct = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        logger.debug('initAct:', doc);

        let orderTypeArray = [{
            'id': 0,
            'value': 0,
            'text': '全部订单'
        }].concat(GLBConfig.OTYPEINFO);
        let resultData = {
            user: req.user,
            storeTypeInfo: GLBConfig.STORETYPE[1],
            orderTypeInfo: orderTypeArray,
            materielInfo: GLBConfig.MATERIELTYPE,
            inventoryInfo: GLBConfig.INVENTORYOPERATETYPE[1].value,
            staffInfo: []
        };
        let staff = await tb_user.findAll({
            where: {
                user_type: '01',
                state: GLBConfig.ENABLE,
                domain_id: user.domain_id
            }
        });
        for (let s of staff) {
            resultData.staffInfo.push({
                id: (s.user_id).toString(),
                value: (s.user_id).toString(),
                text: s.name
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
                    where warehouse_id = ?`;
            let replacements = [];
            replacements.push(doc.warehouse_id);
            resultData.wareHouseZoneInfo = await common.simpleSelect(sequelize, queryStr, replacements);
        }

        common.sendData(res, resultData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
//初始化明细数据
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
                    where warehouse_id = ?`;
            let replacements = [];
            replacements.push(warehouse_id);
            subResult = await common.simpleSelect(sequelize, queryStr, replacements);
            logger.debug('subResult:', subResult);
        }

        common.sendData(res, {
            user: req.user,
            storeTypeInfo: GLBConfig.STORETYPE[1],
            materielInfo: GLBConfig.MATERIELTYPE,
            inventoryInfo: GLBConfig.INVENTORYOPERATETYPE[1].value,
            wareHouseInfo: result,
            wareHouseZoneInfo: subResult
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}
//出库列表
async function getSaleOutOrder(req, res) {
    logger.debug('getSaleOutOrder');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
                a.order_id, a.mrp_domain_id, a.total_count, b.order_type
                , usr.user_id, usr.name
                , est.estate_no, est.estate_name
                , dmn.domain, dmn.domain_name
                , (case b.order_type
                when 1 then usr.user_id
                when 7 then est.estate_no
                when 8 then dmn.domain
                else '-' end) as custom_code
                , (case b.order_type
                when 1 then usr.name
                when 7 then est.estate_name
                when 8 then dmn.domain_name
                else '-' end) as custom_name
                , ifnull(d.done_count, 0) as done_count
                , if(d.done_count is null, 1, if(d.done_count < a.total_count, 2, 3)) as order_status
                from (
                select ad.order_id, ad.mrp_domain_id, sum(ad.demand_amount) as total_count
                from tbl_erc_alldemand as ad
                group by ad.order_id, ad.mrp_domain_id) a
                left join tbl_erc_order b
                on a.order_id = b.order_id
                left join tbl_common_user usr
                on b.user_id = usr.user_id
                left join tbl_erc_estate est
                on b.estate_id = est.estate_id
                left join tbl_common_domain dmn
                on b.purchase_domain_id = dmn.domain_id
                left join (
                select ia.order_id, sum(ia.account_operate_amount) as done_count
                from tbl_erc_inventoryaccount as ia
                where ia.account_operate_type = 2
                group by ia.order_id) d
                on a.order_id = d.order_id
                where true`;
        let replacements = [];

        if (user.domain_id) {
            queryStr += ` and a.mrp_domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.orderType) {
            queryStr += ' and b.order_type = ?';
            replacements.push(doc.orderType);
        }

        if (doc.search_keyword) {
            queryStr += ' and a.order_id like ?';
            let search_keyword = '%' + doc.search_keyword + '%';
            replacements.push(search_keyword);
        }

        if (doc.search_type == 1) {
            queryStr += ' and d.done_count is null';
        } else if (doc.search_type == 2) {
            queryStr += ' and d.done_count < a.total_count';
        } else if (doc.search_type == 3) {
            queryStr += ' and d.done_count = a.total_count';
        }

        queryStr += ` order by a.order_id asc`;

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//按类型搜索出库列表
async function getSaleOutOrderByType(req, res) {
    logger.debug('getSaleOutOrderByType');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr = [
            `select
                a.order_id, a.mrp_domain_id, a.total_count, b.order_type, b.user_id as custom_code
                , c.username, c.email, c.phone, c.name as custom_name
                , ifnull(d.done_count, 0) as done_count
                , if(d.done_count is null, 1, if(d.done_count < a.total_count, 2, 3)) as order_status
                from (
                select ad.order_id, ad.mrp_domain_id, sum(ad.demand_amount) as total_count
                from tbl_erc_alldemand as ad
                group by ad.order_id, ad.mrp_domain_id) a
                left join tbl_erc_order b
                on a.order_id = b.order_id
                left join tbl_common_user c
                on b.user_id = c.user_id
                left join (
                select ia.order_id, sum(ia.account_operate_amount) as done_count
                from tbl_erc_inventoryaccount as ia
                where ia.account_operate_type = 2
                group by ia.order_id) d
                on a.order_id = d.order_id
                where true`,
            `select
                a.order_id, a.mrp_domain_id, a.total_count, b.user_id, b.order_type
                , c.estate_no as custom_code, c.estate_name as custom_name
                , ifnull(d.done_count, 0) as done_count
                , if(d.done_count is null, 1, if(d.done_count < a.total_count, 2, 3)) as order_status
                from (
                select ad.order_id, ad.mrp_domain_id, sum(ad.demand_amount) as total_count
                from tbl_erc_alldemand as ad
                group by ad.order_id, ad.mrp_domain_id) a
                left join tbl_erc_order b
                on a.order_id = b.order_id
                left join tbl_erc_estate c
                on b.estate_id = c.estate_id
                left join (
                select ia.order_id, sum(ia.account_operate_amount) as done_count
                from tbl_erc_inventoryaccount as ia
                where ia.account_operate_type = 2
                group by ia.order_id) d
                on a.order_id = d.order_id
                where true`,
            `select
                a.order_id, a.mrp_domain_id, a.total_count, b.user_id, b.order_type
                , c.domain as custom_code, c.domain_name as custom_name
                , ifnull(d.done_count, 0) as done_count
                , if(d.done_count is null, 1, if(d.done_count < a.total_count, 2, 3)) as order_status
                from (
                select ad.order_id, ad.mrp_domain_id, sum(ad.demand_amount) as total_count
                from tbl_erc_alldemand as ad
                group by ad.order_id, ad.mrp_domain_id) a
                left join tbl_erc_order b
                on a.order_id = b.order_id
                left join tbl_common_domain c
                on b.purchase_domain_id = c.domain_id
                left join (
                select ia.order_id, sum(ia.account_operate_amount) as done_count
                from tbl_erc_inventoryaccount as ia
                where ia.account_operate_type = 2
                group by ia.order_id) d
                on a.order_id = d.order_id
                where true`
        ];
        let replacements = [];
        queryStr[doc.orderType] += ` and b.order_type = ?`;
        replacements.push(GLBConfig.OTYPEINFO[doc.orderType].value);

        if (user.domain_id) {
            queryStr[doc.orderType] += ` and a.mrp_domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.search_keyword) {
            queryStr[doc.orderType] += ' and a.order_id like ?';
            let search_keyword = '%' + doc.search_keyword + '%';
            replacements.push(search_keyword);
        }

        if (doc.search_type == 1) {
            queryStr[doc.orderType] += ' and d.done_count is null';
        } else if (doc.search_type == 2) {
            queryStr[doc.orderType] += ' and d.done_count < a.total_count';
        } else if (doc.search_type == 3) {
            queryStr[doc.orderType] += ' and d.done_count = a.total_count';
        }

        queryStr[doc.orderType] += ` order by a.order_id asc`;

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr[doc.orderType], replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

// async function getSaleOutOrderMateriel(req, res) {
//     logger.debug('getSaleOutOrderMateriel');
//     try {
//         let doc = common.docTrim(req.body);
//         let user = req.user;
//         let returnData = {};
//
//         let findStockQuery = [
//             `left join tbl_erc_stockmap km
//                 on a.materiel_id = km.materiel_id
//                 left join (
//                 select sm.stockmap_id, sum(sm.item_amount) as current_count
//                 from tbl_erc_stockitem as sm
//                 where true
//                 and sm.warehouse_id = ${doc.warehouse_id}
//                 group by sm.stockmap_id) e
//                 on km.stockmap_id = e.stockmap_id`,
//             `left join (
//                 select sm.materiel_id, sum(sm.current_amount) as current_count
//                 from tbl_erc_stockmap as sm
//                 where true
//                 and sm.warehouse_id = ${doc.warehouse_id}
//                 group by sm.materiel_id) e
//                 on a.materiel_id = e.materiel_id`
//         ];
//
//         let queryStr =
//             `select
//              a.alldemand_id, a.materiel_id, a.order_id, a.demand_amount
//              , b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit, b.materiel_manage
//              , b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax
//              , format((b.materiel_cost * a.demand_amount), 2) as pure_cost
//              , format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.demand_amount), 2) as tax_cost
//              , c.domain_id, c.user_id
//              , ifnull(d.done_count, 0) as done_count
//              , ifnull(e.current_count, 0) as current_count
//              from tbl_erc_alldemand a
//              left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
//              left join tbl_erc_order c on a.order_id = c.order_id
//              left join (select ia.order_id, ia.materiel_id, sum(ia.account_operate_amount) as done_count from tbl_erc_inventoryaccount as ia
//              where true and ia.account_operate_type = 2 and ia.order_id = ? group by ia.materiel_id, ia.order_id) d
//              on a.materiel_id = d.materiel_id
//              ${findStockQuery[doc.materiel_manage - 1]}
//              where true
//              and (d.done_count is null or d.done_count < a.demand_amount)`;
//         let replacements = [];
//         replacements.push(doc.order_id);
//         // replacements.push(doc.warehouse_id);
//
//         if (user.domain_id) {
//             queryStr += ` and c.domain_id = ?`;
//             replacements.push(user.domain_id);
//         }
//
//         if (doc.order_id) {
//             queryStr += ` and a.order_id = ?`;
//             replacements.push(doc.order_id);
//         }
//
//         if (doc.materiel_manage) {
//             queryStr += ` and b.materiel_manage = ?`;
//             replacements.push(doc.materiel_manage);
//         }
//
//         queryStr += ` order by a.alldemand_id asc`;
//         logger.debug('queryStr:', queryStr);
//
//         let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
//         returnData.total = result.count;
//         returnData.rows = result.data;
//         common.sendData(res, returnData);
//     } catch (error) {
//         common.sendFault(res, error);
//     }
// }
//创建出库订单
async function createSaleOutOrder(req, res) {
    logger.debug('createSaleOutOrder');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let saleOut = await tb_inventoryorder.create({
            domain_id: doc.saleOrderData.domain_id,
            bill_code: doc.saleOrderData.bill_code,
            bs_order_id: doc.saleOrderData.bs_order_id,
            warehouse_id: doc.saleOrderData.warehouse_id,
            account_operate_type: doc.saleOrderData.account_operate_type,
            ior_contact: doc.saleOrderData.ior_contact,
            ior_phone: doc.saleOrderData.ior_phone
        });

        if (saleOut) {
            let saleOrderItems = await tb_inventoryaccount.bulkCreate(doc.saleOrderItems);
            if (saleOrderItems) {
                let pushArray = [];
                for (let i = 0; i < saleOrderItems.length; i++) {
                    let item = saleOrderItems[i];
                    if (doc.safetyStock) {
                        let pushData = await inventoryControl.dealWithSafeInventoryOut(item.warehouse_id, item.materiel_id,
                            item.account_operate_amount, item.domain_id, item.warehouse_zone_id);
                        pushArray.push(pushData);
                    } else {
                        let pushData = await inventoryControl.dealWithInventoryOut(item.warehouse_id, item.materiel_id,
                            item.account_operate_amount, item.order_id, item.domain_id, item.warehouse_zone_id);
                        pushArray.push(pushData);
                    }
                }
                common.sendData(res, pushArray);
            } else {
                common.sendError(res, 'saleoutorder_01', '出库订单明细生成失败');
            }
        } else {
            common.sendError(res, 'saleoutorder_02', '出库订单生成失败');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取出库历史
async function getSaleOutOrderHistory(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
             a.ior_id, a.domain_id, a.bill_code, a.bs_order_id, a.warehouse_id, a.ior_phone, a.created_at
             , b.done_count, c.user_id, d.name
             from tbl_erc_inventoryorder a
             left join (
             select ia.bill_code, ia.account_operate_type, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where ia.account_operate_type = 2
             group by ia.bill_code, account_operate_type) b
             on a.bill_code = b.bill_code
             left join tbl_erc_order c
             on a.bs_order_id = c.order_id
             left join tbl_common_user d
             on c.user_id = d.user_id
             where true
             and b.account_operate_type = 2`;
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
        if (doc.user_name) {
            queryStr += ` and (d.name like ?`;
            replacements.push('%' + doc.user_name + '%');
            queryStr += ` or d.name like ?)`;
            replacements.push('%' + doc.user_name + '%');
        }

        queryStr += ` order by a.ior_id asc`;
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//获取出库明细
async function saleOutOrderHistoryDetail(req, doc, user) {
    let returnData = {};
    let queryStr =
        `select
         a.bill_code, a.domain_id, a.order_id, a.p_order_id, a.account_operate_amount
         , a.warehouse_id, a.warehouse_zone_id, a.company_name, a.account_note, a.created_at
         , b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit
         , b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax
         , format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost
         , format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
         , c.order_domain_id, c.supplier_id
         , sm.store_price
         from tbl_erc_inventoryaccount a
         left join tbl_erc_materiel b
         on a.materiel_id = b.materiel_id
         left join tbl_erc_purchaseorder c
         on a.order_id = c.order_id
         left join tbl_erc_stockmap sm
         on (a.materiel_id = sm.materiel_id and a.warehouse_id = sm.warehouse_id and a.warehouse_zone_id = sm.warehouse_zone_id and a.domain_id = sm.domain_id)
         where true
         and a.account_operate_type = 2`;
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
//获取出库历史明细
async function getSaleOutOrderHistoryDetail(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = await saleOutOrderHistoryDetail(req, doc, user);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//其他出库历史
async function getOtherOutOrderHistory(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr = `select sum(account_operate_amount) as amount, bill_code, order_id, warehouse_id, created_at 
                        from tbl_erc_inventoryaccount
                        where account_operate_type = 4 and domain_id = ? 
                        group by bill_code, order_id, warehouse_id, created_at`;
        let replacements = [user.domain_id];
        if (doc.start_date) {
            queryStr += ` and to_days(created_at) >= to_days(?)`;
            replacements.push(doc.start_date);
        }
        if (doc.end_date) {
            queryStr += ` and to_days(created_at) <= to_days(?)`;
            replacements.push(doc.end_date);
        }
        if (doc.bill_code) {
            queryStr += ` and bill_code = ?`;
            replacements.push(doc.bill_code);
        }
        if (doc.order_id) {
            queryStr += ` and order_id = ?`;
            replacements.push(doc.order_id);
        }

        queryStr += ` order by bill_code desc`;
        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//生产领料历史
async function getProductOutOrderHistory(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};

        let queryStr =
            `select
             a.ior_id, a.domain_id, a.bill_code, a.bs_order_id, a.warehouse_id, a.ior_phone, a.created_at
             , b.done_count, pt.productivetask_code, pt.order_id
             from tbl_erc_inventoryorder a
             left join (select ia.bill_code, sum(ia.account_operate_amount) as done_count
             from tbl_erc_inventoryaccount as ia
             where ia.account_operate_type = 6
             group by ia.bill_code, ia.account_operate_type) b
             on a.bill_code = b.bill_code
             left join tbl_erc_productivetask pt
             on a.bs_order_id = pt.productivetask_id
             where true
             and a.account_operate_type = 6`;

        let replacements = [];
        if (user.domain_id) {
            queryStr += ` and a.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.start_date) {
            queryStr += ` and to_days(created_at) >= to_days(?)`;
            replacements.push(doc.start_date);
        }
        if (doc.end_date) {
            queryStr += ` and to_days(created_at) <= to_days(?)`;
            replacements.push(doc.end_date);
        }
        if (doc.bill_code) {
            queryStr += ` and bill_code = ?`;
            replacements.push(doc.bill_code);
        }
        if (doc.order_id) {
            queryStr += ` and order_id = ?`;
            replacements.push(doc.order_id);
        }

        queryStr += ` order by bill_code desc`;
        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//其他出库历史
async function otherOutHistoryDetail(req, doc) {
    let returnData = {};
    let user = req.user;
    let queryStr = `select a.bill_code,a.domain_id,a.order_id,a.p_order_id,a.account_operate_amount,
        a.warehouse_zone_id, a.company_name, a.account_note, a.created_at,
        b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit,
        b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax,
        format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost,
        format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
        , sm.store_price
        from tbl_erc_inventoryaccount a
        left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
        left join tbl_erc_stockapply c on a.order_id = c.stockapply_id
        left join tbl_erc_stockmap sm
         on (a.materiel_id = sm.materiel_id and a.warehouse_id = sm.warehouse_id and a.warehouse_zone_id = sm.warehouse_zone_id and a.domain_id = sm.domain_id)
         where true and a.account_operate_type = 4 and a.bill_code = ? and a.domain_id = ?`;
    let replacements = [doc.bill_code,user.domain_id];
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
//其他出库历史明细
async function getOtherOutHistoryDetail(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let returnData = await otherOutHistoryDetail(req, doc);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//其他出库打印
async function otherOutHistoryPrintAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let returnData = await otherOutHistoryDetail(req, doc);
        if (doc.filetype != 'pdf' && doc.filetype != 'image') {
            return common.sendError(res, 'common_api_03')
        }

        let fileUrl = await common.ejs2File('erc/inventorymanage/ERCOtherOutInvoice.ejs', {
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
//其他出库订单
async function getOtherOutOrder(req, res) {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        let replacements = [];
        let queryStr = 'select * from tbl_erc_otherstockout where state = 1 and domain_id'+ await FDomain.getDomainListStr(req);
        if (doc.search_order) {
            queryStr += ' and stockoutapply_id like ?';
            replacements.push('%' + doc.search_order + '%');
        }
        queryStr+=' order by created_at desc'
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

//其他出库物料
async function getSaleOutOrderMateriel(req,res){
    logger.debug('getSaleOutOrderMateriel');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};
        let queryStr =
            `select a.alldemand_id, a.materiel_id, a.order_id, a.demand_amount, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit, b.materiel_manage, b.materiel_cost
             , c.domain_id, c.user_id, ifnull(d.done_count, 0) as done_count 
             from tbl_erc_alldemand a
             left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
             left join tbl_erc_order c on a.order_id = c.order_id
             left join (select ia.order_id, ia.materiel_id, sum(ia.account_operate_amount) as done_count 
                from tbl_erc_inventoryaccount as ia
                where true  and ia.order_id = ? and ia.account_operate_type = 2 group by ia.materiel_id, ia.order_id) d 
                on a.materiel_id = d.materiel_id
             where true
             and (d.done_count is null or d.done_count < a.demand_amount)`;
        let replacements = [];
        replacements.push(doc.order_id);

        if (user.domain_id) {
            queryStr += ` and c.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.order_id) {
            queryStr += ` and a.order_id = ?`;
            replacements.push(doc.order_id);
        }

        queryStr += ` order by a.alldemand_id asc`;
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
//其他出库操作
async function getSaleOutOrderMaterielOperate(req,res){
    logger.debug('getSaleOutOrderMaterielOperate');
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;
        let returnData = {};
        let idArr = [];
        for(let m of doc.materiel){
            idArr.push(m.materiel_id)
        }

        let queryStr =
            `select a.alldemand_id, a.materiel_id, a.order_id, a.demand_amount, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit, b.materiel_manage, b.materiel_cost
             , c.domain_id, c.user_id, ifnull(d.done_count, 0) as done_count,? as  warehouse_id,? as warehouse_zone_id,0 as stock_operate_amount 
             from tbl_erc_alldemand a
             left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
             left join tbl_erc_order c on a.order_id = c.order_id
             left join (select ia.order_id, ia.materiel_id, sum(ia.account_operate_amount) as done_count 
                from tbl_erc_inventoryaccount as ia
                where true  and ia.order_id = ? and ia.account_operate_type = 2 group by ia.materiel_id, ia.order_id) d 
                on a.materiel_id = d.materiel_id
             where true
             and (d.done_count is null or d.done_count < a.demand_amount) and a.materiel_id in (${idArr})` ;
        let replacements = [];
        replacements.push(doc.warehouse_id);
        replacements.push(doc.warehouse_zone_id);
        replacements.push(doc.order_id);
        if (user.domain_id) {
            queryStr += ` and c.domain_id = ?`;
            replacements.push(user.domain_id);
        }

        if (doc.order_id) {
            queryStr += ` and a.order_id = ?`;
            replacements.push(doc.order_id);
        }

        queryStr += ` order by a.alldemand_id asc`;
        logger.debug('queryStr:', queryStr);

        let result = await common.queryWithGroupByCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = result.data;
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//生产领料历史
async function productOutHistoryDetail(req, doc) {
    let returnData = {};
    let user = req.user;
    let queryStr =
        `select
            a.bill_code,a.domain_id,a.order_id,a.p_order_id,a.account_operate_amount,
            a.warehouse_zone_id, a.company_name, a.account_note, a.created_at,
            b.materiel_id, b.materiel_code, b.materiel_name, b.materiel_format, b.materiel_unit,
            b.materiel_cost, concat(b.materiel_tax * 100, '%') as materiel_tax,
            format((b.materiel_cost * a.account_operate_amount), 2) as pure_cost,
            format(((b.materiel_cost + (b.materiel_cost * b.materiel_tax)) * a.account_operate_amount), 2) as tax_cost
            , sm.store_price
            from tbl_erc_inventoryaccount a
            left join tbl_erc_materiel b on a.materiel_id = b.materiel_id
            left join tbl_erc_stockapply c on a.order_id = c.stockapply_id
            left join tbl_erc_stockmap sm
            on (a.materiel_id = sm.materiel_id and a.warehouse_id = sm.warehouse_id and a.warehouse_zone_id = sm.warehouse_zone_id and a.domain_id = sm.domain_id)
            where true and a.account_operate_type = 6 and a.bill_code = ? and a.domain_id = ?`;
    let replacements = [doc.bill_code,user.domain_id];
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

//生产领料明细
async function getProductOutHistoryDetail(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let returnData = await productOutHistoryDetail(req, doc);
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

//初始化出库数据
async function initSaleOut(req, res) {
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
        returnData.warehouseZoneId = [];

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
            returnData.warehouseZoneId.push(elem)
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
//获取出库数量
async function checkOutNumber(req,res){
    let doc = common.docTrim(req.body),
        user = req.user,queryStr='',replacements=[];
    if(doc.materiel_manage==1){
        queryStr = 'select sum(i.item_amount) as sumItemAmount ' +
            'from tbl_erc_stockitem i,tbl_erc_stockmap m ' +
            'where i.state=1 and m.state=1 and i.stockmap_id = m.stockmap_id and m.materiel_id = ?';
        replacements.push(doc.materiel_id);
        if(doc.warehouse_id){
            queryStr +=' and i.warehouse_id=?';
            replacements.push(doc.warehouse_id);
        }
        if(doc.warehouse_zone_id){
            queryStr +=' and i.warehouse_zone_id=?';
            replacements.push(doc.warehouse_zone_id);
        }
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(parseInt(doc.stock_operate_amount)>parseInt(result[0].sumItemAmount)){
            common.sendError(res, 'stockoutapplydetail_02');
        }else {
            common.sendData(res, {});
        }
    }else{
        queryStr='select * from tbl_erc_stockmap where state=1 and materiel_id=?';
        replacements.push(doc.materiel_id);
        if(doc.order_id){
            queryStr +=' and order_id=?';
            replacements.push(doc.order_id);
        }
        if(doc.warehouse_zone_id){
            queryStr +=' and warehouse_zone_id=?';
            replacements.push(doc.warehouse_zone_id);
        }
        if(doc.warehouse_id){
            queryStr +=' and warehouse_id=?';
            replacements.push(doc.warehouse_id);
        }

        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        if(result && result.length==0){
            return common.sendError(res, 'stock_04');
        }else if (result[0].current_amount<doc.stock_operate_amount){
            return common.sendError(res, 'stock_05');
        }else{
            common.sendData(res, {});
        }

    }
}
//出库提交
async function StockSaleOut(req,res){
    try {
        let doc = common.docTrim(req.body),
            user = req.user,stockmap,safe;
        for (let m of doc.materiel){
            if (m.stock_operate_amount > 0) {
                if (m.materiel_manage == '1') {//安全库存管理
                    stockmap = await tb_stockmap.findOne({
                        where:{
                            materiel_id:m.materiel_id,
                        }
                    });
                    if(stockmap){
                        stockmap.current_amount = stockmap.current_amount - m.stock_operate_amount;
                        await stockmap.save()
                        safe = await tb_stockitem.findOne({
                            where:{
                                stockmap_id:stockmap.stockmap_id,
                                warehouse_zone_id:m.warehouse_zone_id,
                                warehouse_id:m.warehouse_id
                            }
                        });
                    }
                    if(safe){
                        safe.item_amount = safe.item_amount - m.stock_operate_amount;
                        await safe.save()
                    }

                    //qqm start 生产财务单据数据
                    let orgName = '';
                    const user = await tb_user.findOne({
                        where: {
                            user_id: m.user_id
                        }
                    });

                    if (user) {
                        orgName = user.name;
                    }

                    await tb_financerecorditem.create({
                        domain_id: user.domain_id,
                        materiel_id: m.materiel_id,
                        wms_type: 2,
                        manage_type: 1,
                        organization: orgName,
                        store_amount: Number(m.stock_operate_amount),
                        store_price: Number(stockmap.store_price)
                    });
                    //qqm end 生产财务单据数据
                } else {//销售订单管理
                    stockmap = await tb_stockmap.findOne({
                        where:{
                            materiel_id:m.materiel_id,
                            order_id:m.order_id,
                            warehouse_zone_id:m.warehouse_zone_id,
                            warehouse_id:m.warehouse_id
                        }
                    });
                    if(stockmap){
                        stockmap.current_amount = stockmap.current_amount-m.stock_operate_amount;
                        await stockmap.save()
                    }

                    //qqm start 生产财务单据数据
                    let orgName = '';
                    const userData = await tb_user.findOne({
                        where: {
                            user_id: m.user_id
                        }
                    });

                    if (userData) {
                        orgName = userData.name;
                    }

                    await tb_financerecorditem.create({
                        domain_id: user.domain_id,
                        materiel_id: m.materiel_id,
                        wms_type: 2,
                        manage_type: 1,
                        organization: orgName,
                        store_amount: Number(m.stock_operate_amount),
                        store_price: Number(stockmap.store_price)
                    });
                    //qqm end 生产财务单据数据

                    //销售类型的订单数量校验：如果此订单号的所有物料都已出库，则更改其订单状态从"发货中"到"已完成"
                    let saleOrderStockmaps = await tb_stockmap.findAll({
                        where: {
                            order_id: m.order_id
                        }
                    });
                    if (saleOrderStockmaps.length > 0) {
                        let hasRemains = false;//是否有未出库的物料
                        for (let sm of saleOrderStockmaps) {
                            if (Number(sm.current_amount) > 0) {
                                hasRemains = true;
                                break;
                            }
                        }
                        if (!hasRemains) {
                            let saleOrder = await tb_order.findOne({
                                where: {
                                    order_id: m.order_id
                                }
                            });
                            if (saleOrder) {
                                if (saleOrder.order_state === 'SHIPPED') {
                                    saleOrder.order_state = 'FINISHI';
                                    await saleOrder.save();

                                    let orderworkflow = await tb_orderworkflow.findOne({
                                        where: {
                                            order_id: saleOrder.order_id,
                                            orderworkflow_state: 'FINISHI'
                                        }
                                    });

                                    if (!orderworkflow) {
                                        await tb_orderworkflow.create({
                                            order_id: saleOrder.order_id,
                                            orderworkflow_state: 'FINISHI',
                                            orderworkflow_desc: '已完成'
                                        });
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }

        let bill_code=new Date().valueOf();
        let inventoryorder = await tb_inventoryorder.create({
            domain_id: user.domain_id,
            bill_code: bill_code,
            bs_order_id: doc.materiel[0].order_id,
            warehouse_id:doc.materiel[0].warehouse_id,
            account_operate_type: 2,
            ior_contact: '',
            ior_phone: ''
        });

        for(m of doc.materiel){
            if(m.stock_operate_amount>0){
                let inventoryaccount = await tb_inventoryaccount.create({
                    domain_id: user.domain_id,
                    bill_code: bill_code,
                    order_id: m.order_id,
                    warehouse_id:m.warehouse_id,
                    warehouse_zone_id: m.warehouse_zone_id,
                    materiel_id:  m.materiel_id,
                    account_operate_amount: m.stock_operate_amount,
                    account_operate_type: 2
                });
            }
        }

        common.sendData(res, {});

    } catch (error) {
        return common.sendFault(res, error);
    }
}
//副产品列表
async function getProductOutOrderAct(req, res) {
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
        if (doc.stock_out_state > 0) {
            queryStr += ` and pt.stock_out_state = ? `;
            replacements.push(doc.stock_out_state);
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
//副产品明细
async function getProductOutItemsAct(req, res) {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {};
        //联产品边余料
        let queryStr = `select ptr.*, m.materiel_code, m.materiel_name, m.materiel_format, m.materiel_unit, pt.order_id 
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
        let queryStr2 = `select pt.*, m.materiel_code, m.materiel_name, m.materiel_format, m.materiel_unit
                         from tbl_erc_productivetask pt
                         left join tbl_erc_materiel m on (pt.materiel_id = m.materiel_id and m.state = 1) 
                         where pt.productivetask_id = ? and pt.domain_id = ?`;
        let replacements2 = [doc.productivetask_id, user.domain_id];
        if (doc.search_text) {
            queryStr2 += ' and (m.materiel_code like ? or m.materiel_name like ?) '
            let search_text = '%' + doc.search_text + '%';
            replacements2.push(search_text);
            replacements2.push(search_text);
        }
        let result2 = await common.simpleSelect(sequelize, queryStr2, replacements2);

        common.sendData(res, result1.concat(result2));
    } catch (error) {
        common.sendFault(res, error);
    }
}
//副产品明细提交
async function submitProductOutItemsAct(req, res) {
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
                let remains = 0;//出库剩余数量
                let stockOutPrice = 0; //出库价格
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
                        stockmap.current_amount = Number(stockmap.current_amount) - Number(m.stock_operate_amount);
                        remains = stockmap.current_amount;
                        stockOutPrice = stockmap.store_price;
                        await stockmap.save()
                    }
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
                            stockitem.item_amount = Number(stockitem.item_amount) - Number(m.stock_operate_amount);
                            await stockitem.save()
                        }
                        stockmap.current_amount = Number(stockmap.current_amount) - Number(m.stock_operate_amount);
                        remains = stockmap.current_amount;
                        stockOutPrice = stockmap.store_price;
                        await stockmap.save()
                    }
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
                    account_operate_type: 6,
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
                    wms_type: 2,
                    manage_type: 2,
                    organization: orgName,
                    store_amount: Number(m.stock_operate_amount),
                    store_price: Number(stockOutPrice)
                });
                //qqm end

                //更新联产品、边余料、成品的已收货数量
                if (m.taskrelated_type) {
                    await tb_productivetaskrelated.increment(
                        ['related_stock_out_number'],
                        {
                            by: Number(m.stock_operate_amount),
                            where: {
                                productivetaskrelated_id: m.productivetaskrelated_id
                            }
                        }
                    );
                } else {
                    await tb_productivetask.increment(
                        ['stock_out_number'],
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
            //更改生产任务单出库状态
            let related = await tb_productivetaskrelated.findOne({
                where: {
                    productivetask_id: doc.productivetask_id
                }
            });
            let queryStr = '';
            if (related) {
                queryStr = `select pt.* from tbl_erc_productivetask pt
                            left join tbl_erc_productivetaskrelated ptr on pt.productivetask_id = ptr.productivetask_id
                            where pt.taskdesign_number = pt.stock_out_number 
                            and ptr.taskrelateddesign_number = ptr.related_stock_out_number 
                            and pt.domain_id = ? and pt.productivetask_id = ?`;
            } else {
                queryStr = `select * from tbl_erc_productivetask 
                            where taskdesign_number = stock_out_number 
                            and domain_id = ? and productivetask_id = ?`;
            }
            let replacements = [user.domain_id, doc.productivetask_id];
            let reuslt = await common.simpleSelect(sequelize, queryStr, replacements);
            if (reuslt.length > 0) {
                await tb_productivetask.update({
                    stock_out_state: 3
                }, {
                    where: {
                        productivetask_id: doc.productivetask_id,
                        domain_id: user.domain_id
                    }
                });
            } else {
                await tb_productivetask.update({
                    stock_out_state: 2
                }, {
                    where: {
                        productivetask_id:doc.productivetask_id,
                        domain_id: user.domain_id
                    }
                });
            }
            //出库流水
            let inventoryorder = await tb_inventoryorder.create({
                domain_id: user.domain_id,
                bill_code: doc.bill_code,
                bs_order_id: doc.productivetask_id,
                warehouse_id: doc.warehouse_id,
                account_operate_type: 6,
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
