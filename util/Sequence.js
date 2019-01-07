const util = require('util');
const db = require('./db');
const common = require('../util/CommonUtil');
const logger = require('./Logger').createLogger('Sequence');
const sequelize = db.sequelize;

let genUserID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'userIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        // let currentIndex = ('000000000000000' + queryRst[0].num).slice(-15)
        //
        // let today = (new Date()).Format("UIyyyyMMdd")
        //
        // return today + currentIndex;
        return "GH"+ queryRst[0].num;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genAmortizedID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'amortizedIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'DTZC' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genAmortizedSucribeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'subcribeOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'ZCSG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genAmortizedPurchaseeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'amoPurOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'ZCCG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genCashierID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'cashierIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyMMdd");
        return today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genReceiveID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'receiveIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyMM");

        return 'CLSL'  + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genConsumeID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'consumeIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyMM");

        return 'CLHY'  + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'orderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyMM");

        return user.domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genDevelopID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'developIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'YCZC' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genDevelopSucribeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'devSubcribeOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'YFSG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genDevelopPurchaseeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'devPurOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'YFCG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};



let genSalesOrderID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'salesOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'SO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genPurchaseOrderID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'purchaseOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'PO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genProductiveOrderID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productiveIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'SCRW' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genPurchaseApplyID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'purchaseApplyIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'AP' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genCheckInventoryID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'checkInventoryIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'CI' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genTaskID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'taskIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        if (!domain) {
            domain = 0;
        }
        return 'TK' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let getProjectID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'projectIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        if (!domain) {
            domain = 0;
        }
        return 'XM' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let getProjectSpaceID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'projectSpaceIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        if (!domain) {
            domain = 0;
        }
        return 'KJ' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genProductPlanID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'PP' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genZWProcessID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'zoweeProcessIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'ZW' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genInvalidateOrderId = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'IO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genStockOutApplyId = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'SO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genApplyID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'applyIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'AY' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genOtherID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'otherIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'OS' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genIdleApplyId = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'idleApplyIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'IA' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genMeetingRoomID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'meetingRoomIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        return 'HYS' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};


let genTransApplyID = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'transApplyIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'CL' +today+currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
}

let getAskForLeaveID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'askForLeaveIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'QJ'+today+currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let getDocumentID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'documentIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'WJ'+today+currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genSpecialExpenseID = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'specialExpenseIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'FYBX' +today+currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
}

let genTransExpenseApplyID = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'transExpenseApplyIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'CLE' +today+currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
}

let getCorporateClientsID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'corporateClientsIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        return 'KF'+currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genDepartmentID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'departmentIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        return 'BM' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genPositionID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'positionIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        return 'GW' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genfixedAssetsPurchNo = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'fixedAssetsPurchNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('0000' + queryRst[0].num).slice(-4);
        let today = (new Date()).Format("yyMM");

        return 'GDZCSGD' +today+currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
};

let genfixedAssetsCheckNo = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'fixedAssetsCheckNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('0000' + queryRst[0].num).slice(-4);
        let today = (new Date()).Format("yyMM");

        return 'GDZCYSD' +today+currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
};

let genfixedAssetsNo = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'fixedAssetsNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('0000' + queryRst[0].num).slice(-4);

        return 'GDZC' +currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
};

let genfixedAssetsRepairNo = async()=>{
    try{
        let queryRst= await sequelize.query('select nextval(\'fixedAssetsRepairNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('0000' + queryRst[0].num).slice(-4);

        return 'GDZCWXD' +currentIndex;
    }catch(error){
        logger.error(error);
        return error;
    }
};

let getConsumablesPurchaseID = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'consumablessPurchaseIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'ZCP' +today+currentIndex;
    } catch (error){
        logger.error('getConsumablesID'+error);
        return error;
    }
}

let getConsumablesAcceptanceID = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'consumablesAcceptanceIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'ZCA' +today+currentIndex;
    } catch (error){
        logger.error('getConsumablesID'+error);
        return error;
    }
}

let getConsumablesDetailID = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'consumablesDetailIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);

        return 'DZYH' + currentIndex;
    } catch (error){
        logger.error('consumablesDetailIDSeq'+error);
        return error;
    }
}

let genLongAssetsScrapNo = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'longAssetsScrapNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('0000' + queryRst[0].num).slice(-4);
        let today = (new Date()).Format("yyMM");

        return 'ZCBF' +today+ currentIndex;
    } catch (error){
        logger.error('longAssetsScrapNoSeq'+error);
        return error;
    }
}

let getTakeStockNo = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'getTakeStockNoSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });

        let currentIndex=('000000' + queryRst[0].num).slice(-6);
        let today = (new Date()).Format("yyMM");

        return 'ZCS' +today+currentIndex;
    } catch (error){
        logger.error('getConsumablesID'+error);
        return error;
    }
}

//收货单编号
let genReceiptID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'receiptIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'RT' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genProductionProcedureNo = async () =>{
    try{
        let queryRst= await sequelize.query('select nextval(\'productionProcedureIDSeq\') num', {
            type:sequelize.QueryTypes.SELECT
        });


        let currentIndex=('000000' + queryRst[0].num).slice(-6);

        return 'SCGX' + currentIndex;
    } catch (error){
        logger.error('productionProcedureIDSeq'+error);
        return error;
    }
};

let genProjectSucribeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'proSubcribeOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'GCSG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genProjectPurchaseeOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'proPurOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'GCCG' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genFinanceRecordMaterielID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'financeRecordMaterielIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'WLSF' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genSpecialExpenseSumID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'SpecialExpenseSumSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'ZJZC' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genCashiergatheringSumID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'CashiergatheringSumSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'KHSK' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genRecordingVoucherSID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'RecordingVoucherSSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return '付' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genRecordingVoucherCID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'RecordingVoucherCSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return '收' + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genSHXPProductID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'shxpProductId\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'P' + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genSHXPReserveID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'shxpReserveId\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return  today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
module.exports = {
    genSHXPProductID:genSHXPProductID,
    genUserID: genUserID,
    genOrderID: genOrderID,
    genSalesOrderID: genSalesOrderID,
    genPurchaseOrderID: genPurchaseOrderID,
    genPurchaseApplyID: genPurchaseApplyID,
    genCheckInventoryID: genCheckInventoryID,
    genTaskID: genTaskID,
    genProductPlanID: genProductPlanID,
    genZWProcessID: genZWProcessID,
    genInvalidateOrderID: genInvalidateOrderId,
    genStockOutApplyId: genStockOutApplyId,
    genApplyID: genApplyID,
    genOtherID: genOtherID,
    getProjectID: getProjectID,
    getProjectSpaceID: getProjectSpaceID,
    genIdleApplyId: genIdleApplyId,
    getProjectSpaceID: getProjectSpaceID,
    genMeetingRoomID: genMeetingRoomID,
    genTransApplyID:genTransApplyID,
    getAskForLeaveID: getAskForLeaveID,
    getDocumentID: getDocumentID,
    genSpecialExpenseID: genSpecialExpenseID,
    genTransExpenseApplyID:genTransExpenseApplyID,
    getCorporateClientsID: getCorporateClientsID,
    genDepartmentID: genDepartmentID,
    genPositionID: genPositionID,
    genAmortizedID:genAmortizedID,
    genfixedAssetsPurchNo: genfixedAssetsPurchNo,
    genfixedAssetsCheckNo:genfixedAssetsCheckNo,
    genfixedAssetsNo:genfixedAssetsNo,
    genfixedAssetsRepairNo:genfixedAssetsRepairNo,
    genReceiveID:genReceiveID,
    genConsumeID:genConsumeID,
    getConsumablesPurchaseID:getConsumablesPurchaseID,
    getConsumablesAcceptanceID:getConsumablesAcceptanceID,
    getConsumablesDetailID:getConsumablesDetailID,
    genLongAssetsScrapNo: genLongAssetsScrapNo,
    getTakeStockNo:getTakeStockNo,
    genCashierID:genCashierID,
    genAmortizedSucribeOrderID:genAmortizedSucribeOrderID,
    genAmortizedPurchaseeOrderID:genAmortizedPurchaseeOrderID,
    genDevelopID:genDevelopID,
    genDevelopSucribeOrderID:genDevelopSucribeOrderID,
    genDevelopPurchaseeOrderID:genDevelopPurchaseeOrderID,
    genReceiptID:genReceiptID,
    genProductionProcedureNo,
    genProjectSucribeOrderID:genProjectSucribeOrderID,
    genProjectPurchaseeOrderID:genProjectPurchaseeOrderID,
    genProductiveOrderID:genProductiveOrderID,
    genFinanceRecordMaterielID,
    genSpecialExpenseSumID:genSpecialExpenseSumID,
    genCashiergatheringSumID:genCashiergatheringSumID,
    genRecordingVoucherSID:genRecordingVoucherSID,
    genRecordingVoucherCID:genRecordingVoucherCID,
    genSHXPReserveID:genSHXPReserveID
};
