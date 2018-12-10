const fs = require('fs');
const path = require('path');
const iconvLite = require('iconv-lite');

const config = require('../../../config');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCBaseDataControlSRV');
const model = require('../../../model');

const XLSX = require('xlsx-style');
const sequelize = model.sequelize;
const tb_materiel = model.erc_materiel;
const tb_warehouse = model.erc_warehouse;
const tb_warehousezone = model.erc_warehousezone;
const tb_stockmap = model.erc_stockmap;
const tb_amortize = model.erc_amortize;
const tb_fixedassetscheckdetail = model.erc_fixedassetscheckdetail;
const tb_fixedassetscheck = model.erc_fixedassetscheck;
const tb_consumables = model.erc_consumables;//低值易耗品列表
const tb_consumablesdetail = model.erc_consumablesdetail;//低值易耗品详情
const tb_department = model.erc_department;//部门
const tb_position = model.erc_position;//岗位
const tb_common_usergroup = model.common_usergroup;//角色
const tb_user = model.common_user;
const tb_customer = model.erc_customer;
const tb_user_contract = model.erc_customercontract;
const tb_custorgstructure = model.erc_custorgstructure;
// 基础数据管理接口
exports.ERCBaseDataControlResource = async (req, res) => {
    let method = req.query.method;
    if (method === 'upload') {
        await upload(req, res)
    } else if (method==='importData'){
        await importData(req,res)
    }else {
        common.sendError(res, 'common_01')
    }
};

//获得类型ID
function getId(ConfigArr,text){
    if(text){
        for(let u of ConfigArr){
            if(u.text == text){
                return u.id
            }
        }
    }else {
        return null
    }
}
//上传文件
async function upload(req, res) {
    try {
        let uploadurl = await common.fileSave(req);
        common.sendData(res, {uploadurl: uploadurl})
    } catch (error) {
        common.sendFault(res, error);
    }
}
//导入基础数据
async function importData(req, res){
    try {
        const { type } = req.body;
        switch (type) {
            case 5:
                await importDepartment(req, res);//部门基本资料
                break;

            case 7:
                await importPosition(req, res);//岗位基本资料
                break;

            case 11:
                await importEmployee(req, res);//员工基本信息
                break;

            case 13:
                await importMateriel(req, res);//物料基本信息
                break;

            case 23:
                await importFixed(req, res);//固定资产明细信息
                break;

            case 26:
                await importAmortize(req, res);//待摊资产明细信息
                break;

            case 31:
                await importConsumable(req,res);//低值易耗品明细信息
                break;

            case 38:
                await importWearHouse(req, res);//仓库信息
                break;

            case 39:
                await importWearHouseZone(req, res);//仓区信息
                break;

            case 40:
                await importStockMap(req, res);//实时库存信息
                break;
        }
        common.sendData(res, '');
    } catch (error) {
        common.sendFault(res, error);
    }
}

// 13 导入物料
async function importMateriel(req,res) {
    try {
        let user = req.user;
        let doc = common.docTrim(req.body);
        let replacements = [],materiel_code="";

        let worksheet = await common.exceltojson(doc.uploadurl);
        let xlsxJson = XLSX.utils.sheet_to_json(worksheet);

        // let queryStr = 'delete from tbl_erc_materiel where domain_id=?';
        // replacements.push(user.domain_id);
        // let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.DELETE});

        if(xlsxJson.length>0){
            for(let i=2;i<=xlsxJson.length+1;i++){

                materiel_code = worksheet['A'+i]?worksheet['A'+i].v:null;
                if(materiel_code){
                    let materielExist= await tb_materiel.findAll({
                        where: {
                            materiel_code: materiel_code,
                            state: GLBConfig.ENABLE,
                            domain_id: user.domain_id
                        }
                    });

                    if(materielExist && materielExist.length==0){
                        let materiel = await tb_materiel.create({
                            domain_id: user.domain_id,
                            materiel_code: worksheet['A'+i]?worksheet['A'+i].v:null,
                            materiel_name: worksheet['B'+i]?worksheet['B'+i].v:null,
                            materiel_format:worksheet['C'+i]?worksheet['C'+i].v:null,//规格型号
                            materiel_x: worksheet['D'+i]?worksheet['D'+i].v:0,//长
                            materiel_y: worksheet['E'+i]?worksheet['E'+i].v:0,//宽
                            materiel_z: worksheet['F'+i]?worksheet['F'+i].v:0,//高
                            materiel_formula:  worksheet['G'+i]?worksheet['G'+i].v:null,//算料公式
                            materiel_source: getId(GLBConfig.MATERIELSOURCE,worksheet['H'+i]?worksheet['H'+i].v:null),//采购来源
                            materiel_manage: getId(GLBConfig.MATERIELMANAGE,worksheet['I'+i]?worksheet['I'+i].v:null),//管理模式
                            materiel_type: getId(GLBConfig.MATERIELTYPE,worksheet['J'+i]?worksheet['J'+i].v:null),//物料分类
                            materiel_unit: getId(GLBConfig.UNITINFO,worksheet['K'+i]?worksheet['K'+i].v:null),//单位
                            materiel_amto: getId(GLBConfig.MATERIELAMTO,worksheet['L'+i]?worksheet['L'+i].v:null),//制品分类
                            materiel_cost: worksheet['M'+i]?worksheet['M'+i].v:0,//采购价
                            materiel_sale:worksheet['N'+i]?worksheet['N'+i].v:0,//销售价
                            materiel_tax:worksheet['O'+i]?worksheet['O'+i].v:0,//税率
                            materiel_loss:worksheet['P'+i]?worksheet['P'+i].v:0,//损耗率
                            materiel_describe: worksheet['Q'+i]?worksheet['Q'+i].v:null,//描述
                            materiel_conversion: getId(GLBConfig.MATERIELCONVERSION,worksheet['R'+i]?worksheet['R'+i].v:null),//计算单位转换
                            materiel_intpart: getId(GLBConfig.MATERIELINTPART,worksheet['S'+i]?worksheet['S'+i].v:null),//是否取整，1是，2否
                            materiel_review_state: '1'
                            // materiel_formatcount: reviewmateriel.review_materiel_formatcount,//算料规格
                            // materiel_formatunit: reviewmateriel.review_materiel_formatunit,//规格单位
                        });
                    }
                }
            }
        }
        common.sendData(res, '');
    } catch (error) {
        throw error;
    }
}
//仓库信息
async function importWearHouse(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;
        for (const itemData of excelJsonArray) {
            const [code, name, type, address, status, contact, phone, fax] = Object.entries(itemData);
            if (code[0] === 'NO' && code[1]) {
                const wareHouseResult = await tb_warehouse.findOne({
                    where: {
                        warehouse_code: code[1],
                        domain_id: user.domain_id
                    }
                });

                if (!wareHouseResult) {
                    console.dir({code, name, type, address, status, contact, phone, fax});
                    await tb_warehouse.create({
                        domain_id: user.domain_id,
                        warehouse_code: code[1],
                        warehouse_name: name[1],
                        warehouse_type: type[1],
                        warehouse_state: status[1],
                        warehouse_address: address[1],
                        warehouse_contact: contact[1],
                        warehouse_phone: phone[1],
                        warehouse_fax: fax[1]
                    });
                    successNumber++;
                } else {
                    errorNumber++;
                }
            } else {
                errorNumber++;
                console.dir(code);
            }
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}
//仓区信息
async function importWearHouseZone(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;
        for (const itemData of excelJsonArray) {
            const [code, name, remark] = Object.entries(itemData);
            const wareHouseResult = await tb_warehouse.findOne({
                where: {
                    warehouse_id: code[1],
                    domain_id: user.domain_id
                }
            });

            if (wareHouseResult) {
                const zoneResult = await tb_warehousezone.findOne({
                    where: {
                        warehouse_id: code[1],
                        zone_name: name[1]
                    }
                });

                if (!zoneResult) {
                    console.dir({code, name, remark});
                    await tb_warehousezone.create({
                        warehouse_id: code[1],
                        zone_name: name[1],
                        zone_remark: remark[1]
                    });
                    successNumber++;
                } else {
                    errorNumber++;
                }
            } else {
                errorNumber++;
            }
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}
//实时库存信息
async function importStockMap(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;
        for (const itemData of excelJsonArray) {
            const [warehouseId, zoneId, materielId, store_number, safe_number, idle_store, min_number] = Object.entries(itemData);
            const wareHouseResult = await tb_warehouse.findOne({
                where: {
                    warehouse_id: warehouseId[1],
                    domain_id: user.domain_id
                }
            });

            if (wareHouseResult) {
                const zoneResult = await tb_warehousezone.findOne({
                    where: {
                        warehouse_id: warehouseId[1],
                        warehouse_zone_id: zoneId[1]
                    }
                });

                if (zoneResult) {
                    const materielResult = await tb_materiel.findOne({
                        where: {
                            materiel_id: materielId[1],
                            domain_id: user.domain_id,
                            state: GLBConfig.ENABLE
                        }
                    });

                    if (materielResult) {
                        const storeResult = await tb_stockmap.findOne({
                            where: {
                                domain_id: user.domain_id,
                                warehouse_id: warehouseId[1],
                                warehouse_zone_id: zoneId[1],
                                materiel_id: materielId[1]
                            }
                        });

                        if (!storeResult) {
                            await tb_stockmap.create({
                                domain_id: user.domain_id,
                                warehouse_id: warehouseId[1],
                                warehouse_zone_id: zoneId[1],
                                materiel_id: materielId[1],
                                current_amount: store_number[1],
                                safe_amount: safe_number[1],
                                is_idle_stock: idle_store[1],
                                min_purchase_amount: min_number[1]
                            });
                            successNumber++;
                        } else {
                            errorNumber++;
                            logger.debug('store already exist');
                        }
                    } else {
                        errorNumber++;
                        logger.debug('materiel no exist');
                    }
                } else {
                    errorNumber++;
                    logger.debug('ware house zone no exist');
                }
            } else {
                errorNumber++;
                logger.debug('ware house no exist');
            }
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}
//待摊资产明细信息
async function importAmortize(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;

        for (const itemData of excelJsonArray) {
            const [name, agelimit, way, already_mos, already_money, surplus_mos, department_id,amortize_manager,scrap_flag] = Object.entries(itemData);
            let amortize_code = await Sequence.genAmortizedID(user);
            await tb_amortize.create({
                domain_id: user.domain_id,
                amortize_code: amortize_code,
                amortize_name:name[1],
                amortize_departmant_id:department_id[1],
                amortize_manager:amortize_manager[1],
                amortize_agelimit:agelimit[1],
                amortize_way:getId(GLBConfig.AMORTIZED,way[1]),
                amortize_creator:req.user.user_id,
                amortize_project_state:2,
                amortize_check_state:2,
                scrap_flag:getId(GLBConfig.SCRAPTYPE,scrap_flag[1]),
                amortize_already_mos:already_mos[1],
                amortize_already_money:already_money[1],
                amortize_surplus_mos:surplus_mos[1],
                take_stock_flag:1,
                amortize_acceptor_time:new Date()
            });
            successNumber++;
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}
//固定资产
async function importFixed(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;

        for (const itemData of excelJsonArray) {
            const [name, timelimit, way, fixedassets_model,  fixedassets_unit, department_id, user_id,  scrap_flag, depreciation_category, fixedassetscheck_acceptance] = Object.entries(itemData);
            let fixedassetscheck_no = await Sequence.genfixedAssetsCheckNo();
            let addFixed = await tb_fixedassetscheck.create({
                fixedassetscheck_no: fixedassetscheck_no,
                domain_id: user.domain_id,
                check_state:3
            });
            let fixedassets_no = await Sequence.genfixedAssetsNo();
            await tb_fixedassetscheckdetail.create({
                fixedassetscheck_id:addFixed.fixedassetscheck_id,
                fixedassets_no: fixedassets_no,//固定资产编号
                fixedassets_name:name[1],//固定资产名称
                department_id:department_id[1],//归属部门
                user_id:user_id[1],//管理责任人
                use_time_limit:timelimit[1],//预计使用年限
                fixedassets_category:getId(GLBConfig.FIXEDASSETS,way[1]),//固定资产分类
                scrap_flag:getId(GLBConfig.SCRAPTYPE,scrap_flag[1]),//报废标志 0：已报废 1：未报废
                take_stock_flag:1,//盈亏状态 0：盈亏 1：正常
                fixedassets_model:fixedassets_model[1],//规格型号
                fixedassets_unit:fixedassets_unit[1],//计量单位
                depreciation_category:getId(GLBConfig.DEPRECIATIONMETHOD,depreciation_category[1]),//折旧方法
                fixedassetscheck_acceptance:getId(GLBConfig.FIXEDACCEPTANCETYPE,fixedassetscheck_acceptance[1]),//验收类型
            });
            successNumber++;
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}

//31 低值易耗品明细信息
async function importConsumable(req,res){
    try{
        const {user,body} = req;
        const wordsheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(wordsheet);
        let successNumber = 0;
        let errorNumber = 0;

        for(const itemData of excelJsonArray){
            const [name,specifications,unit,type,department_id,user_id,scrap_flag] = Object.entries(itemData);
            let consumables_code = await Sequence.getConsumablesAcceptanceID();
            let addData = await tb_consumables.create({
                consumables_code: consumables_code,
                domain_id: user.domain_id,
                consumables_creator_id:user.user_id,
                consumables_creator_name: user.name,
                consumables_type_id:GLBConfig.LOW_VALUE_TYPE[1].value,
                consumables_status: GLBConfig.LOW_VALUE_STATUS[3].value
            })

            let consumables_detail_code = await Sequence.getConsumablesDetailID();
             await tb_consumablesdetail.create({
                domain_id:user.domain_id,
                consumables_parent_code:consumables_code,
                consumables_detail_code: consumables_detail_code,//code
                consumables_detail_creator_id: user.user_id,//创建人ID
                consumables_detail_creator_name: user.name,//创建人名字
                consumables_detail_type_id: GLBConfig.LOW_VALUE_TYPE[1].value,//类型 1资产申购单 2验收单
                consumables_name: name[1],//易耗品名字
                consumables_specifications: specifications[1],//规格型号
                consumables_unit: unit[1],//计量单位
                consumables_administrator_id: user_id[1],//管理人
                department_id: department_id[1],//部门
                consumables_acceptance_type_id: getId(GLBConfig.LOW_VALUE_ACCEPTANCE_TYPE,type[1]),//验收类型ID
                consumables_number:0,//数量
                consumables_detail_status: GLBConfig.LOW_VALUE_STATUS[3].value,//审核状态
                take_stock_flag:1,//盈亏状态 0：盈亏 1：正常
                scrap_flag:getId(GLBConfig.SCRAPTYPE,scrap_flag[1]),//报废标志 0：已报废 1：未报废
            })
            successNumber++;
        }
        common.sendData(res, {successNumber, errorNumber});
        return
    }catch(error){
        throw error;
    }
}

//部门基本资料
async function importDepartment(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;
        let name = '', p_department_code = '', department_level = '';

        if(excelJsonArray.length>0){
            for(let i=2;i<=excelJsonArray.length+1;i++){
                name = worksheet['A'+i]?worksheet['A'+i].v:null;
                if (name) {
                    let aDepartment = await tb_department.findOne({
                        where: {
                            domain_id: user.domain_id,
                            department_name: name,
                            state: 1
                        }
                    });
                    if (!aDepartment) {//部门不存在
                        p_department_code = worksheet['C'+i]?worksheet['C'+i].v:null;
                        if (p_department_code != null && p_department_code != '') {//上级部门id不为空
                            let aDepartment2 = await tb_department.findOne({
                                where: {
                                    domain_id: user.domain_id,
                                    department_id: p_department_code,
                                    state: 1
                                }
                            });
                            if (aDepartment2) {//上级部门存在
                                department_level = worksheet['B'+i]?worksheet['B'+i].v:null;
                                if (department_level == GLBConfig.AUTH) {//管理架构层级为1，上级部门id不为空
                                    errorNumber++;
                                    logger.debug('p_department_id no null');
                                } else {
                                    let department_no = await Sequence.genDepartmentID();
                                    let addDepartment = await tb_department.create({
                                        department_id: department_no,
                                        domain_id: user.domain_id,
                                        department_name:worksheet['A'+i]?worksheet['A'+i].v:null,//部门名称
                                        p_department_id: worksheet['C'+i]?worksheet['C'+i].v:null,//上级部门id(部门编号)
                                        department_level: worksheet['B'+i]?worksheet['B'+i].v:null,//管理架构层级
                                        department_state: 1,
                                        department_plan_num: worksheet['D'+i]?worksheet['D'+i].v:null//部门编制
                                    });
                                    successNumber++;
                                }
                            } else {
                                errorNumber++;
                                logger.debug('department no exist');
                            }
                        } else {
                            department_level = worksheet['B'+i]?worksheet['B'+i].v:null;
                            if (department_level == GLBConfig.AUTH) {//上级部门id为空，管理架构层级不为1
                                let department_no = await Sequence.genDepartmentID();
                                let addDepartment2 = await tb_department.create({
                                    department_id: department_no,
                                    domain_id: user.domain_id,
                                    department_name:worksheet['A'+i]?worksheet['A'+i].v:null,//部门名称
                                    department_level: worksheet['B'+i]?worksheet['B'+i].v:null,//管理架构层级
                                    department_state: 1,
                                    department_plan_num: worksheet['D'+i]?worksheet['D'+i].v:null//部门编制
                                });
                                successNumber++;

                            }else {
                                errorNumber++;
                                logger.debug('department hierarchy no highest');
                            }
                        }
                    } else {
                        errorNumber++;
                        logger.debug('department already exist');
                    }
                }
            }
        }

        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}

//岗位基本资料
async function importPosition(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;
        let name = '', usergroup_name = '', department_id = '', p_position_id = '';

        if(excelJsonArray.length>0){
            for(let i=2;i<=excelJsonArray.length+1;i++){
                name = worksheet['B'+i]?worksheet['B'+i].v:null;
                if (name) {
                    let aPosition = await tb_position.findOne({
                        where: {
                            domain_id: user.domain_id,
                            position_name: name,
                            state: 1
                        }
                    });
                    if (aPosition) {//岗位存在
                        errorNumber++;
                        logger.debug('position already exist');
                    } else {
                        usergroup_name = worksheet['A'+i]?worksheet['A'+i].v:null;
                        let groupmenus = await tb_common_usergroup.findOne({
                            where: {
                                domain_id: user.domain_id,
                                usergroup_name: usergroup_name,
                                state: 1
                            }
                        });
                        if (!groupmenus){//角色不存在
                            errorNumber++;
                            logger.debug('usergroup no exist');
                        } else {
                            department_id = worksheet['C'+i]?worksheet['C'+i].v:null;
                            let aDepartment = await tb_department.findOne({
                                where: {
                                    domain_id: user.domain_id,
                                    department_id: department_id,
                                    state: 1
                                }
                            });
                            if (!aDepartment) {//部门不存在
                                errorNumber++;
                                logger.debug('department no exist');
                            } else {
                                p_position_id = worksheet['D'+i]?worksheet['D'+i].v:null;
                                if (p_position_id == null || p_position_id == undefined || p_position_id == ''){
                                    let position_id = await Sequence.genPositionID();
                                    let addPosition = await tb_position.create({
                                        position_id: position_id,
                                        domain_id: user.domain_id,
                                        usergroup_id:groupmenus.usergroup_id,//角色id
                                        department_id: worksheet['C'+i]?worksheet['C'+i].v:null,//所属部门
                                        position_name: worksheet['B'+i]?worksheet['B'+i].v:null,//岗位名称
                                        department_plan_num: worksheet['E'+i]?worksheet['E'+i].v:0//岗位编制
                                    });
                                    successNumber++;
                                } else {
                                    let aPosition2 = await tb_position.findOne({
                                        where: {
                                            domain_id: user.domain_id,
                                            position_id: p_position_id,
                                            state: 1
                                        }
                                    });
                                    if (!aPosition2) {//上级岗位不存在
                                        errorNumber++;
                                        logger.debug('position no exist');
                                    } else {
                                        let position_id = await Sequence.genPositionID();
                                        let addPosition = await tb_position.create({
                                            position_id: position_id,
                                            domain_id: user.domain_id,
                                            usergroup_id:groupmenus.usergroup_id,//角色id
                                            department_id: worksheet['C'+i]?worksheet['C'+i].v:null,//所属部门
                                            position_name: worksheet['B'+i]?worksheet['B'+i].v:null,//岗位名称
                                            p_position_id: worksheet['D'+i]?worksheet['D'+i].v:null,//上级岗位id
                                            department_plan_num: worksheet['E'+i]?worksheet['E'+i].v:0//岗位编制
                                        });
                                        successNumber++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}

//员工基本信息
async function importEmployee(req, res) {
    try {
        const { user, body } = req;
        const worksheet = await common.exceltojson(body.uploadurl);
        const excelJsonArray = XLSX.utils.sheet_to_json(worksheet);
        let successNumber = 0;
        let errorNumber = 0;

        for (const itemData1 of excelJsonArray) {
            const [name, gender, department_id, position_id, entry_date, user_form] = Object.entries(itemData1);

            let position = await tb_position.findOne({
                where: {
                    position_id: position_id[1],
                    department_id: department_id[1],
                    domain_id: user.domain_id
                }
            });

            if (position) {//部门，岗位存在
                if (position.usergroup_id) {
                    let usergroup = await tb_common_usergroup.findOne({
                        where: {
                            usergroup_id: position.usergroup_id
                        }
                    });

                    let user_id = await Sequence.genUserID()
                    let adduser = await tb_user.create({
                        user_id: user_id,
                        domain_id: user.domain_id,
                        usergroup_id: position.usergroup_id,
                        username: user_id,
                        password: GLBConfig.INITPASSWORD,
                        name: name[1],
                        gender: getId(GLBConfig.GENDERTYPE,gender[1]),
                        user_type: usergroup.usergroup_type,

                    });

                    if(adduser){
                        let addCustomer = await tb_customer.create({
                            user_id: adduser.user_id,
                            entry_date:entry_date[1],
                            user_form:getId(GLBConfig.CONTRACT,user_form[1])

                        });

                        let usercontract = await tb_user_contract.create({
                            user_id: adduser.user_id,
                            contract_name:'',
                            contract_state:1
                        });

                        let userorgstru = await tb_custorgstructure.create({
                            user_id: adduser.user_id,
                            department_id:department_id[1],
                            position_id:position_id[1]
                        });

                        delete adduser.password
                        successNumber++;
                    }else {
                        errorNumber++;
                        logger.debug('adduser no exist');
                    }
                } else {
                    errorNumber++;
                    logger.debug('usergroup no exist');
                }
            } else {
                errorNumber++;
                logger.debug('department and position no exist');
            }
        }
        common.sendData(res, {successNumber, errorNumber});
    } catch (error) {
        throw error;
    }
}