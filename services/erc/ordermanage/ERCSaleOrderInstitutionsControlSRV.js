const moment = require('moment')
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCSaleOrderInstitutionsControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const qr = require('qr-image');
const FDomain = require('../../../bl/common/FunctionDomainBL');


const sequelize = model.sequelize;
const tb_order = model.erc_order;
const tb_ordermateriel = model.erc_ordermateriel;
const tb_purchaseorder = model.erc_purchaseorder;//采购单(包含申请单)
const tb_purchasedetail = model.erc_purchasedetail;//采购单物料明细

const tb_userGroup = model.common_usergroup;
const tb_user = model.common_user;
const tb_customer = model.erc_customer;
const tb_orderworkflow = model.erc_orderworkflow;
const tb_domain = model.common_domain;
const tb_appointment = model.erc_appointment;
const tb_estate = model.erc_estate;
const tb_estateroom = model.erc_estateroom;
const tb_orderdesign = model.erc_orderdesign;
const tb_orderrequire = model.erc_orderrequire;
const tb_landagent = model.erc_landagent;
const tb_usergroup = model.common_usergroup;
const tb_thirdsignuser = model.erc_thirdsignuser;
const tb_corporateclients = model.erc_corporateclients;

const fs = require('fs');
const path = require('path');
const iconvLite = require('iconv-lite');
const config = require('../../../config');
exports.ERCSaleOrderInstitutionsControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'init') {
        initAct(req, res);
    } else if (method==='search_fit') {
        search_fit(req, res)
    } else if (method==='search_group'){
        search_group(req,res)
    } else if (method==='search_sales'){
        search_sales(req,res)
    } else if(method==='getLandAgentUserInfo'){
        getLandAgentUserInfo(req,res)
    } else if (method === 'search') {
        searchAct(req, res)
    } else if (method === 'searchForLandAgent') {
        searchForLandAgent(req, res)
    } else if (method === 'searchPhone') {
        searchPhoneAct(req, res)
    } else if (method === 'add') {
        addAct(req, res)
    } else if (method === 'modify') {
        modifyAct(req, res)
    } else if (method === 'delete') {
        deleteAct(req, res)
    } else if (method==='qrcode'){
        getQrcodeAct(req,res)
    } else if (method==='getArea'){
        getAreaAct(req,res)
    } else if (method==='addSaleOrder'){
        addUserDefinedSaleOrder(req,res)
    } else if (method==='addSaleOrderMateriel'){
        addUserDefinedSaleOrderDetail(req,res)
    } else if (method==='deleteSaleOrder'){
        deleteSaleOrder(req,res)
    } else if (method==='exportSaleData'){
        exportSaleData(req,res)
    }else {
        common.sendError(res, 'common_01')
    }
};
// 查询订单
let search_fit = async(req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {},replacements=[];
        let queryStr = `select o.*,u.*, o.domain_id domain_id,ds.name designer_name,
            o.created_at order_created_at from
            tbl_erc_order o
            left join tbl_common_user u on o.user_id = u.user_id
            left join tbl_common_user ds on o.designer_id = ds.user_id
            left join tbl_common_domain d on d.domain_id = o.domain_id
            left join tbl_erc_roomtype r on o.roomtype_id = r.roomtype_id
            where o.state=1 and order_type=1 and o.domain_id ` + await FDomain.getDomainListStr(req);
        if (doc.search_text) {
            queryStr += ' and (o.order_id like ? or o.order_address like ? or u.phone like ? or u.name like ?)';
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
            replacements.push('%' + doc.search_text + '%');
        }
        if(doc.order_state){
            queryStr+=' and order_state=?';
            replacements.push(doc.order_state)
        }
        if(doc.project_type){
            queryStr+=' and project_type=?';
            replacements.push(doc.project_type)
        }
        if(doc.createdBTime){
            queryStr+= ' and o.created_at>=?';
            replacements.push(doc.createdBTime)
        }
        if(doc.createdETime){
            queryStr+= ' and o.created_at<=?';
            replacements.push(doc.createdETime)
        }
        queryStr += ' order by o.created_at desc';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.order_created_at ? moment(r.order_created_at).format("YYYY-MM-DD") : null;
            result.break_date_f = r.break_date ? moment(r.break_date).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
// 查询订单
let search_group = async(req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {},replacements=[];
        let queryStr = `select o.*,u.*, o.domain_id domain_id,ds.name designer_name,
            o.created_at order_created_at,r.name as room_type_name,l.landagent_name
            from tbl_erc_order o
            left join tbl_common_user u on (o.user_id = u.user_id and u.state=1)
            left join tbl_common_user ds on (o.designer_id = ds.user_id and ds.state=1)
            left join tbl_common_domain d on (d.domain_id = o.domain_id and d.state=1)
            left join tbl_erc_roomtype r on (o.roomtype_id = r.roomtype_id and r.state=1)
            left join tbl_erc_estate e on (o.estate_id=e.estate_id and e.state=1)
            left join tbl_erc_landagent l on (e.land_agent=landagent_id and l.state=1)
            where o.state=1 and order_type=7 and o.domain_id ` + await FDomain.getDomainListStr(req);
        if (doc.search_text) {
            queryStr += ' and o.order_id like ? ';
            replacements.push('%' + doc.search_text + '%');
        }
        if(doc.order_state){
            queryStr+=' and order_state=?';
            replacements.push(doc.order_state)
        }
        if(doc.createdBTime){
            queryStr+= ' and o.created_at>=?';
            replacements.push(doc.createdBTime)
        }
        if(doc.createdETime){
            queryStr+= ' and o.created_at<=?';
            replacements.push(doc.createdETime)
        }
        if(doc.land_agent){
            queryStr+= ' and l.landagent_id=?';
            replacements.push(doc.land_agent)
        }
        queryStr += ' order by o.created_at desc';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;
        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.order_created_at ? moment(r.order_created_at).format("YYYY-MM-DD") : null;
            result.break_date_f = r.break_date ? moment(r.break_date).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
// 查询订单
let search_sales = async(req, res) => {
    try {
        let doc = common.docTrim(req.body), user = req.user, returnData = {},replacements=[];
        let queryStr = `select o.*,d.domain_name,d.domain_contact,d.domain_phone,u.username,u.phone,u.name,c.corporateclients_name,c.corporateclients_phone  
         from tbl_erc_order o
         left join tbl_common_domain d on (o.purchase_domain_id=d.domain_id and d.state=1)
         left join tbl_common_user u on (o.purchaser_user_id=u.user_id and u.state=1)
         left join tbl_erc_corporateclients c on (o.purchaser_corporateclients_id=c.corporateclients_id and c.state=1)
         where o.state=1 and o.order_type=8 and o.domain_id ` + await FDomain.getDomainListStr(req);
        if (doc.search_text) {
            queryStr += ' and o.order_id like ? ';
            replacements.push('%' + doc.search_text + '%');
        }
        if(doc.createdBTime){
            queryStr+= ' and o.created_at>=?';
            replacements.push(doc.createdBTime)
        }
        if(doc.createdETime){
            queryStr+= ' and o.created_at<=?';
            replacements.push(doc.createdETime)
        }
        if(doc.order_state){
            queryStr+=' and order_state=?';
            replacements.push(doc.order_state)
        }
        if(doc.purchase_domain_id){
            queryStr+=' and purchase_domain_id = ?';
            replacements.push(doc.purchase_domain_id)
        }
        if(doc.purchaser_type){
            queryStr+=' and purchaser_type = ?';
            replacements.push(doc.purchaser_type)
        }
        if(doc.user_id){
            queryStr+=' and u.user_id like ?';
            replacements.push('%' + doc.user_id + '%')
        }
        if(doc.corporateclients_id){
            queryStr+=' and c.corporateclients_id like ?';
            replacements.push('%' + doc.corporateclients_id + '%')
        }
        queryStr += ' order by o.created_at desc';
        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;

        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.created_at ? moment(r.created_at).format("YYYY-MM-DD") : null;
            result.break_date_f = r.break_date ? moment(r.break_date).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
// 初始化基础数据
let initAct = async(req, res) => {
    let returnData={},queryStr,queryStr2,replacements=[];

    returnData = {
        projectTypeInfo:GLBConfig.PROJECTTYPE,
        orderStateFitInfo: GLBConfig.ORDERSTATEINFO,
        orderStateGroupInfo:[],
        orderStateSalesInfo:[],
        userListInfo: [],
        storeList: [],
        landAgentList:[],
        clitenType:GLBConfig.CLIENTTYPE,
        sapState:GLBConfig.SAPSTATE,
        customerInfo:[],
        unitInfo:GLBConfig.UNITINFO,
        companyInfo:[],
        userInfo:[],
        customerTypeOne:GLBConfig.CUSTOMERTTYPEONE,
        customerTypeTwo:GLBConfig.CUSTOMERTTYPETWO,
        customerTypeThree:GLBConfig.CUSTOMERTTYPETHREE,
        enterpriseInfo: []
    };

    for(let o of GLBConfig.ORDERSTATEINFO){
        if(o.id=='NEW' || o.id=='WORKING' || o.id=='FINISHI'){
            returnData.orderStateGroupInfo.push({
                id: o.id,
                value: o.value,
                text: o.text
            });
        }
    }
    for(let o of GLBConfig.ORDERSTATEINFO){
        if(o.id == 'NEW' || o.id == 'PAYED' || o.id == 'REVIEWING' || o.id == 'SHIPPED' || o.id=='FINISHI'){
            returnData.orderStateSalesInfo.push({
                id: o.id,
                value: o.value,
                text: o.text
            });
        }
    }
    let userList = await tb_user.findAll({
        attributes: ['user_id', 'username','name'],
        where: {
            domain_id: req.user.domain_id,
            state: GLBConfig.ENABLE,
            user_type: GLBConfig.TYPE_OPERATOR
        }
    });
    for (let user of userList) {
        returnData.userListInfo.push({
            id: user.user_id,
            text: user.username,
            value: user.user_id,
            name: user.name
        });
    }

    let customerList = await tb_user.findAll({
        attributes: ['user_id', 'username','name'],
        where: {
            domain_id: req.user.domain_id,
            state: GLBConfig.ENABLE,
            user_type: GLBConfig.TYPE_CUSTOMER
        }
    });
    for (let c of customerList) {
        returnData.customerInfo.push({
            id: c.user_id,
            text: c.name,
            value: c.user_id
        });
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

    let landagents = await tb_landagent.findAll({
        where:{
            domain_id: req.user.domain_id,
            state:GLBConfig.ENABLE
        }
    });
    for (let l of landagents) {
        returnData.landAgentList.push({
            id:l.landagent_id,
            value:l.landagent_id,
            text:l.landagent_name
        });
    }

    let corporateclients = await tb_corporateclients.findAll({
        where :{
            domain_id: req.user.domain_id,
            state:GLBConfig.ENABLE
        }
    });
    for (let l of corporateclients) {
        returnData.companyInfo.push({
            id:l.corporateclients_id,
            value:l.corporateclients_id,
            text:l.corporateclients_name
        });
    }

    queryStr = `select distinct u.user_id,u.name from tbl_erc_order o 
    left join tbl_common_user u on (o.purchaser_user_id=u.user_id and u.state=1) 
    where o.state=1 and o.order_type=8 and purchaser_type ='2' and o.domain_id = ?`;

    replacements =[req.user.domain_id];
    queryRst = await sequelize.query(queryStr, {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT
    })
    returnData.userInfo = queryRst;

    queryStr2 = `select distinct c.corporateclients_id,c.corporateclients_name 
    from tbl_erc_order o 
    left join tbl_erc_corporateclients c on (o.purchaser_corporateclients_id=c.corporateclients_id and c.state=1) 
    where o.state=1 and o.order_type=8 and purchaser_type ='3' and o.domain_id = ?`;

    replacements =[req.user.domain_id];
    queryRst2 = await sequelize.query(queryStr2, {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT
    })
    returnData.enterpriseInfo = queryRst2;

    await FDomain.getDomainListInit(req, returnData);
    common.sendData(res, returnData);
};
// 修改订单
let modifyAct = async(req, res) => {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        let modiOrder = await tb_order.findOne({
            where: {
                order_id: doc.old.order_id
            }
        });

        if (modiOrder) {
            modiOrder.project_type = doc.new.project_type;
            modiOrder.order_address = doc.new.order_address; //装修地址
            modiOrder.roomtype_id = doc.new.roomtype_id;
            modiOrder.order_house_area = doc.new.order_house_area;
            modiOrder.order_operator = doc.new.order_operator;
            modiOrder.order_state = doc.new.order_state;
            modiOrder.sales_id = doc.new.sales_id;
            modiOrder.order_designer = doc.new.order_designer;
            modiOrder.order_supervision = doc.new.order_supervision;
            modiOrder.order_remark = doc.new.order_remark;
            modiOrder.break_date = doc.new.break_date;
            modiOrder.sap_order_state=doc.new.sap_order_state;
            await modiOrder.save();

            //同步预约的信息
            let appointment = await tb_appointment.findOne({
                where: {
                    order_id: doc.old.order_id
                }
            });
            if (appointment) {
                appointment.ap_address = doc.new.order_address;
                appointment.ap_house_area = doc.new.order_house_area;
                await appointment.save()
            }

        } else {
            common.sendError(res, 'order_02');
            return
        }
        let retData = JSON.parse(JSON.stringify(modiOrder));
        retData.break_date_f = modiOrder.break_date ? moment(modiOrder.break_date).format("YYYY-MM-DD") : null
        common.sendData(res, retData);

    } catch (error) {
        common.sendFault(res, error);
        return null
    }
};
// 按电话号码查找客户
let searchPhoneAct = async(req,res)=>{
    try {
        let doc = common.docTrim(req.body)

        let queryStr = 'select * from tbl_common_user a, tbl_erc_customer b where a.user_id = b.user_id and a.phone =?'

        let queryRst = await sequelize.query(queryStr, {
            replacements: [doc.phone],
            type: sequelize.QueryTypes.SELECT
        })

        if (queryRst.length > 0) {
            let retData = JSON.parse(JSON.stringify(queryRst[0]))
            delete retData.password
            common.sendData(res, retData);
        } else {
            common.sendData(res);
        }

    } catch (error) {
        common.sendFault(res, error);
        return
    }
};
// 增加订单
let addAct = async(req, res) => {
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;


        let addUser = await tb_user.findOne({
            where: {
                username: doc.phone,
                user_type: GLBConfig.TYPE_CUSTOMER
            }
        });
        if (!addUser) {
            let userGroup = await tb_userGroup.findOne({
                where: {
                    usergroup_type: GLBConfig.TYPE_CUSTOMER
                }
            });
            if (!userGroup) {
                common.sendError(res, 'customer_01');
                return
            }
            addUser = await tb_user.create({
                user_id: await Sequence.genUserID(),
                domain_id: user.domain_id,
                usergroup_id: userGroup.usergroup_id,
                username: doc.phone,
                phone: doc.phone,
                password: common.generateRandomAlphaNum(6),
                name: doc.name,
                user_type: userGroup.usergroup_type,
            });
            let customer = await tb_customer.create({
                user_id: addUser.user_id,
                customer_level: doc.customer_level,
                customer_type: doc.customer_type,
                decorate_address: doc.order_address,
                customer_remarks: doc.customer_remarks,
                customer_source: "3"
            });
        } else {
            if (addUser.domain_id != user.domain_id) {
                addUser.domain_id = user.domain_id
                await addUser.save()
            }
        }


        let addOrder = await tb_order.create({
            order_id: await Sequence.genOrderID(user),
            domain_id: user.domain_id,
            user_id: addUser.user_id,
            sales_id: user.user_id,
            order_type:doc.order_type,
            project_type: doc.project_type,
            recommender_phone: doc.recommender_phone,
            order_state: 'NEW', //ORDERSTATEINFO
            order_remark: doc.order_remark
        });
        let addFlow = await tb_orderworkflow.create({
            order_id: addOrder.order_id,
            orderworkflow_state: 'NEW',
            orderworkflow_desc: '新建'
        })

        if (doc.order_type != '7') {
            let requires = await tb_orderrequire.findAll({
                where: {
                    state: GLBConfig.ENABLE,
                    type_id: {in: [1,2]},
                    domain_id: user.domain_id
                }
            })
            for (let require of requires) {
                await tb_orderdesign.create({
                    order_id: addOrder.order_id,
                    require_id: require.require_id,
                    require_type: require.type_id
                });
            }
        }

        let retData = Object.assign(JSON.parse(JSON.stringify(addOrder)), JSON.parse(JSON.stringify(addUser)));
        retData.create_date = addOrder.created_at.Format("yyyy-MM-dd")
        common.sendData(res, retData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
// 查询订单
let searchAct = async(req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        let queryStr = `select o.*,u.*, o.domain_id domain_id,ds.name designer_name, o.created_at order_created_at,r.name as room_type_name from
        tbl_erc_order o
        left join tbl_common_user u on o.user_id = u.user_id
        left join tbl_common_user ds on o.designer_id = ds.user_id
        left join tbl_common_domain d on d.domain_id = o.domain_id
        left join tbl_erc_roomtype r on o.roomtype_id = r.roomtype_id `;
        queryStr += ` where 1=1 `;
        let replacements = [];
        if (doc.is_crm === '1') {
            queryStr += ` and o.domain_id = ? `;
            replacements.push(user.domain_id);
        } else if (doc.domain_id != null) {
            queryStr += ` and o.domain_id = ? `;
            replacements.push(doc.domain_id);
        }
        if (doc.user_id != null) {
            queryStr += ` and o.user_id = ? `;
            replacements.push(doc.user_id)
        }
        if (doc.order_state != null) {
            queryStr += ` and o.order_state = ? `;
            replacements.push(doc.order_state)
        }
        if (doc.order_type != null) {
            queryStr += ` and o.order_type = ? `;
            replacements.push(doc.order_type)
        }
        if (doc.created_at_start != null) {
            queryStr += ` and o.created_at >= ? `;
            replacements.push(doc.created_at_start + ` 00:00:00`);
        }
        if (doc.created_at_end != null) {
            queryStr += ` and o.created_at <= ? `;
            replacements.push(doc.created_at_end + ` 23:59:59`);
        }

        if (doc.search_text) {
            queryStr += ' and (o.order_id like ? or o.order_address like ? or u.phone like ? or u.name like ?)'
            let search_text = '%' + doc.search_text + '%';
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
        }

        queryStr += ' order by o.created_at desc';

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;

        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.order_created_at ? moment(r.order_created_at).format("YYYY-MM-DD") : null;
            result.break_date_f = r.break_date ? moment(r.break_date).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
let searchForLandAgent = async(req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        let queryStr = `select
            o.order_id, o.order_address, o.order_house_area, o.order_type, o.order_state, o.estate_id
            , ds.name as designer_name, u.name, u.phone
            , o.created_at order_created_at, r.name as room_type_name
            from tbl_erc_order o
            left join tbl_common_user u on o.user_id = u.user_id
            left join tbl_common_user ds on o.designer_id = ds.user_id
            left join tbl_common_domain d on d.domain_id = o.domain_id
            left join tbl_erc_roomtype r on o.roomtype_id = r.roomtype_id
            where true
            and o.domain_id = ?
            and o.order_type = 7`;
        let replacements = [];
        replacements.push(user.domain_id);

        queryStr += ` and o.estate_id in (select estate_id from tbl_erc_estate where domain_id = ? and land_agent = ?)`;
        replacements.push(user.domain_id);
        replacements.push(doc.landagent_id);

        if (doc.user_id) {
            queryStr += ` and o.user_id = ? `;
            replacements.push(doc.user_id)
        }
        if (doc.order_state) {
            queryStr += ` and o.order_state = ? `;
            replacements.push(doc.order_state)
        }

        if (doc.search_text) {
            queryStr += ' and (o.order_id like ? or o.order_address like ? or u.phone like ? or u.name like ?)';
            let search_text = '%' + doc.search_text + '%';
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
            replacements.push(search_text);
        }

        queryStr += ' order by o.created_at desc';

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = result.count;

        returnData.rows = [];
        for (let r of result.data) {
            let result = JSON.parse(JSON.stringify(r));
            result.create_date = r.order_created_at ? moment(r.order_created_at).format("YYYY-MM-DD") : null;
            result.break_date_f = r.break_date ? moment(r.break_date).format("YYYY-MM-DD") : null;
            returnData.rows.push(result)
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
// 查询户型
async function getAreaAct(req, res) {
    try {
        let doc = common.docTrim(req.body);
        let replacements = [];

        let queryStr = 'select * from tbl_erc_roomtype where estate_id = ? '
        replacements.push(doc.estate_id);
        //replacements.push(doc.name);

        let queryRst = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        let returnData = [];
        for (let i = 0; i < queryRst.length; i++) {
            let elem = {};
            elem.id = queryRst[i].roomtype_id;
            elem.value = queryRst[i].acreage;
            elem.text = queryRst[i].acreage;
            returnData.push(elem)
        }

        common.sendData(res, returnData);

    } catch (error) {
        common.sendFault(res, error);
        return
    }
}
// 获得二维码
async function getQrcodeAct(req,res){
    let doc = common.docTrim(req.body);
    let svg_string = qr.imageSync(doc.order_id, { type: 'svg' });
    common.sendData(res, {qrcode: svg_string});
}
// 获得地产商信息
async function getLandAgentUserInfo(req, res) {
    let returnData = {
        orderStateGroupInfo: []
    };
    let user = req.user;
    for (let o of GLBConfig.ORDERSTATEINFO) {
        if (o.id === 'NEW' || o.id === 'WORKING' || o.id === 'FINISHI') {
            returnData.orderStateGroupInfo.push({
                id: o.id,
                value: o.value,
                text: o.text
            });
        }
    }
    let userInfo = await tb_user.findOne({where: {user_id: user.user_id}});
    returnData.userGroup = await tb_usergroup.findOne({where: {usergroup_id: userInfo.usergroup_id}});
    let thirdSignUser = await tb_thirdsignuser.findOne({where: {user_id: user.user_id}});
    returnData.landAgent = await tb_landagent.findOne({where: {landagent_id: thirdSignUser.supplier_id}});
    common.sendData(res, returnData);
}

// 增加销售订单
async function addUserDefinedSaleOrder(req,res){
    try {
        let doc = common.docTrim(req.body);
        let user = req.user;

        if(doc.clientType==1){  //机构
            let POID = await Sequence.genPurchaseOrderID(doc.domain_id);
            let SOID = await Sequence.genSalesOrderID(doc.domain_id);

            // 采购单
            let addNcaPurchaseOrder = await tb_purchaseorder.create({
                purchaseorder_id:POID,                      //采购单号，PO开头
                purchaseorder_domain_id:doc.domain_id,      //采购方
                order_id:SOID,                              //销售单号
                order_domain_id:user.domain_id,             //销售方
                purchaseorder_state:2                       //采购单状态，0未审核，1审核拒绝，2审核通过
            });

            //销售单
            let addNcaOrder = await tb_order.create({
                order_id: SOID,                             //销售单号
                domain_id: user.domain_id,                  //销售方
                purchase_order_id: POID,                    //采购单号
                purchase_domain_id: doc.domain_id,          //采购方
                order_type: 8,                              //订单类型，8采购订单，OTYPEINFO
                order_state:'NEW',
                purchaser_type:1,                           //采购方类型 1机构，2个人
                sales_data_source:2,                         //标识该采购单来源 1mrp运算，2手动添加
                sap_order_state:1,                         //标识该销售单sap状态


            });

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
            let returnData = {
                SOID:SOID,
                POID:POID
            };
            common.sendData(res, returnData);
        }else if(doc.clientType==2){                  //个人
            let SOID = await Sequence.genSalesOrderID(user.domain_id);

            //销售单
            let addNcaOrder = await tb_order.create({
                order_id: SOID,                             //销售单号
                domain_id: user.domain_id,                  //销售方
                purchase_order_id: '',                      //采购单号
                purchase_domain_id: 0,                      //采购方
                order_type: 8,                              //订单类型，8采购订单，OTYPEINFO
                order_state:'NEW',
                purchaser_type:2,                           //采购方类型 1机构，2个人
                purchaser_user_id:doc.purchaser_user_id,    //客户user_id
                sales_data_source:2,                         //标识该采购单来源 1mrp运算，2手动添加
                sap_order_state:1,                         //标识该销售单sap状态
            });

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
            let returnData = {
                SOID:SOID
            };
            common.sendData(res, returnData);
        }else {
            let SOID = await Sequence.genSalesOrderID(user.domain_id);

            //销售单
            let addNcaOrder = await tb_order.create({
                order_id: SOID,                             //销售单号
                domain_id: user.domain_id,                  //销售方
                purchase_order_id: '',                      //采购单号
                purchase_domain_id: 0,                      //采购方
                order_type: 8,                              //订单类型，8采购订单，OTYPEINFO
                order_state:'NEW',
                purchaser_type:3,                           //采购方类型 1机构，2个人 3企业
                purchaser_corporateclients_id:doc.purchaser_corporateclients_id,    //企业ID
                sales_data_source:2,                         //标识该采购单来源 1mrp运算，2手动添加
                sap_order_state:1,                         //标识该销售单sap状态
            });

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
            let returnData = {
                SOID:SOID
            };
            common.sendData(res, returnData);
        }
    }catch (error){
        return common.sendFault(res, error);
    }



}
// 增加销售订单明细
async function addUserDefinedSaleOrderDetail(req,res){
    try{
        let doc = common.docTrim(req.body);
        let user = req.user;
        let addMateriel = [],existState=0;
        let orderMateriel = await tb_ordermateriel.findOne({
            where: {
                order_id: doc[0].SOID,
                state:1
            }
        });
        let order = await tb_order.findOne({
            where: {
                order_id: doc[0].SOID,
                state:1
            }
        });
        for(pm of doc){//本次新增的物料
            existState=0;
            if(orderMateriel && orderMateriel.length>0){
                for(let om of orderMateriel){//已经存在的物料
                    if(om.materiel_id==pm.materiel_id){
                        existState=1;
                        break
                    }
                }
            }
            if(!existState){
                addMateriel.push(pm)
            }
        }
        for(let am of addMateriel){
            //销售单明细
            let addNcaOrderMateriel = await tb_ordermateriel.create({
                order_id: am.SOID,
                materiel_id: am.materiel_id,
                materiel_amount: am.apply_number,
                sale_price: am.materiel_sale,
                sap_order_state:1,                         //标识该销售单sap状态
            });
        }

        if(order.purchaser_type==1){
            for(let am of addMateriel){
                //采购单明细
                let addNcaPurchaseDetail = await tb_purchasedetail.create({
                    purchase_id: am.POID,
                    materiel_id: am.materiel_id,
                    purchase_number: am.apply_number,
                    purchase_price:am.materiel_sale
                });
            }

        }
        common.sendData(res, []);
    }catch (error){
        return common.sendFault(res, error);
    }
}

// 删除销售订单
async function deleteSaleOrder(req,res){
    try{
        let doc = common.docTrim(req.body);
        let user = req.user;

        await tb_order.destroy({
            where: {
                order_id: doc.SOID
            }
        })

        await  tb_ordermateriel.destroy({
            where:{
                order_id:doc.SOID
            }
        });
        await  tb_purchaseorder.destroy({
            where:{
                purchaseorder_id:doc.POID
            }
        });
        await  tb_purchasedetail.destroy({
            where:{
                purchase_id:doc.POID
            }
        });
        common.sendData(res, []);
    }catch (error){
        return common.sendFault(res, error);
    }
}
// 导出数据
async function exportSaleData(req,res){
    try {
        let str = null;
        let filename = null;
        let doc = common.docTrim(req.body);
        let returnData = {};

        str = '物料编码,物料名称,规格型号,单位,数量,单价,金额,sap处理状态\r';
        filename = doc.order_id  +'.csv';

        let queryStr = `select om.*, m.materiel_id,m.materiel_code,m.materiel_name,m.materiel_format,m.materiel_unit,
         m.materiel_type,m.materiel_cost,m.materiel_source,m.materiel_procedure,om.materiel_amount,om.sale_price,(om.materiel_amount*om.sale_price) as sale_money,
          IF(sap_order_state=1,'新建','完成') as sap_order_state 
         from tbl_erc_ordermateriel om left join tbl_erc_materiel m on om.materiel_id = m.materiel_id
        where om.state = 1 and m.state = 1 and order_id = ?`;

        let replacements = [doc.order_id];

        result = await sequelize.query(queryStr, {replacements: replacements,type: sequelize.QueryTypes.SELECT});
        let sumMoney = 0;
        for(let r of result){
            sumMoney += r.sale_money
        }

        for(let r of result){
            for(let u of GLBConfig.UNITINFO){
                if(r.materiel_unit == u.id){
                    r.materiel_unit = u.text;
                    break
                }
            }
            str+=r.materiel_code + ',' + r.materiel_name + ',' + r.materiel_format + ',' + r.materiel_unit + ',' + r.materiel_amount + ',' + r.sale_price + ',' + r.sale_money + ',' + r.sap_order_state + '\r'
        }
        str += '总计,,,,,,' + sumMoney +  ',\r';


        let tempfile = path.join(__dirname, '../../../' + config.uploadOptions.uploadDir + '/' + filename);
        let csvBuffer = iconvLite.encode(str, 'gb2312');
        fs.writeFile(tempfile, csvBuffer, function(err) {
            if (err) throw err;
            common.sendData(res, config.tmpUrlBase + filename);
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}