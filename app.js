const log4js = require('log4js');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');

const config = require('./config');
const common = require('./util/CommonUtil.js');
const logger = require('./util/Logger').createLogger('app.js');

let app = express();
let cors = require('cors')
let ejs = require('ejs');

let authority = require('./util/Authority')
let AuthSRV = require('./util/AuthSRV')
let FileSRV = require('./util/FileSRV')
let services = require('./service')

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/temp', express.static(path.join(__dirname, '../public/temp')))
if (config.mongoFlag == false) {
    app.use('/files', express.static(path.join(__dirname, 'public/files')))
}
app.use(log4js.connectLogger(log4js.getLogger("http"), {
    level: 'auto',
    nolog: '\\.gif|\\.jpg$'
}));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.text({
    type: 'text/*'
}));
app.use(bodyParser.raw());
app.use(cookieParser());
app.use('/api', authority.AuthMiddleware);

//处理webpack服务请求
app.get('/__webpack_hmr', function (req, res) {
    res.send('')
})

app.get('/', (req, res) => {
    res.redirect('index.html');
});

app.get('/files/:filetag', FileSRV.FileResource);

app.post('/api/auth', AuthSRV.AuthResource);
app.post('/api/phoneresetpassword', AuthSRV.PhoneResetPasswordResource);
app.post('/api/signout', AuthSRV.SignOutResource);
app.post('/api/sms', AuthSRV.SMSResource);

// system

//common
//commonQuery
app.post('/api/common/components/userSelectDialogControl', services.UserSelectDialogSRV.UserSelectDialogResource);
app.post('/api/common/components/DomainSelectDialogControl', services.DomainSelectDialogSRV.DomainSelectDialogResource);

// baseconfig
app.post('/api/common/baseconfig/FollowerControl', services.FollowerControlSRV.FollowerControlResource);

// system
app.post('/api/common/system/SystemApiControl', services.SystemApiControlSRV.SystemApiControlResource);
app.post('/api/common/system/DomainTemplateControl', services.DomainTemplateControlSRV.DomainTemplateControlResource);
app.post('/api/common/system/DomainControl', services.DomainControlSRV.DomainControlResource);
app.post('/api/common/system/DomainGroupControl', services.DomainGroupControlSRV.DomainGroupControlResource);
app.post('/api/common/system/SysGroupApiControl', services.SysGroupApiControlSRV.SysGroupApiControlResource);
app.post('/api/common/system/OperatorControl', services.OperatorControlSRV.OperatorControlResource);
app.post('/api/common/system/UserSetting', services.UserSettingSRV.UserSettingResource);
app.post('/api/common/system/ResetPassword', services.UserResetPasswordSRV.UserResetPasswordResource);

// erc
// register
app.post('/api/erc/register', services.ERCRegisterControlSRV.ERCRegisterResource);

// customermanage
app.post('/api/erc/customermanage/ERCCustomerControl', services.ERCCustomerControlSRV.ERCCustomerControlResource);
app.post('/api/erc/customermanage/ERCAppointmentControl', services.ERCAppointmentControlSRV.ERCAppointmentControlResource);
app.post('/api/erc/customermanage/ERCInquiryControlControl', services.ERCInquiryControlSRV.ERCInquiryControlResource);
app.post('/api/erc/customermanage/ERCCustomerAssignControl', services.ERCCustomerAssignControlSRV.ERCCustomerAssignControlResource);
app.post('/api/erc/customermanage/ERCComplaintControl', services.ERCComplaintControlSRV.ERCComplaintControlResource);
app.post('/api/erc/customermanage/ERCLoanControl', services.ERCLoanControlSRV.ERCLoanControlResource);

// ordermanage
app.post('/api/erc/ordermanage/ERCOrderControl', services.ERCOrderControlSRV.ERCOrderControlResource);
app.post('/api/erc/ordermanage/ERCLandAgentOrderControl', services.ERCOrderControlSRV.ERCOrderControlResource);
app.post('/api/erc/ordermanage/ERCOrderDetailControl', services.ERCOrderDetailControlSRV.ERCOrderDetailControlResource);
app.post('/api/erc/ordermanage/ERCGOrderDetailControl', services.ERCGOrderDetailControlSRV.ERCGOrderDetailControlResource);
app.post('/api/erc/ordermanage/ERCOrderRequireControl', services.ERCOrderRequireControlSRV.OrderRequireControlResource);
app.post('/api/erc/ordermanage/ERCSOrderDetailControl', services.ERCSOrderDetailControlSRV.ERCSOrderDetailControlResource);
app.post('/api/erc/ordermanage/ERCHDOrderControl', services.ERCHDOrderControlSRV.ERCHDOrderControlResource);
app.post('/api/erc/ordermanage/ERCHDOrderDetailControl', services.ERCHDOrderDetailControlSRV.ERCHDOrderDetailControlResource);
app.post('/api/erc/ordermanage/ERCOrderShopSyncControl', services.ERCOrderShopSyncControlSRV.ERCOrderShopSyncControlResource);
app.post('/api/erc/ordermanage/ERCOrderSearchControl', services.ERCOrderSearchControlSRV.ERCOrderSearchControlResource);
app.post('/api/erc/ordermanage/ERCReceivablesRuleControl', services.ERCReceivablesRuleControlSRV.ERCReceivablesRuleControlResource);
app.post('/api/erc/ordermanage/ERCSaleOrderInstitutionsControl', services.ERCSaleOrderInstitutionsControlSRV.ERCSaleOrderInstitutionsControlResource);
app.post('/api/erc/ordermanage/ERCSaleOrderControl', services.ERCSaleOrderControlSRV.ERCSaleOrderControlResource);
app.post('/api/erc/ordermanage/ERCSaleOrderCompanyControl', services.ERCSaleOrderCompanyControlSRV.ERCSaleOrderCompanyControlResource);
app.post('/api/erc/ordermanage/ERCOrderReviewControl', services.ERCOrderReviewControlSRV.ERCOrderReviewControlResource);

// baseconfig
app.post('/api/erc/baseconfig/ERCEstateControl', services.ERCEstateControlSRV.ERCEstateControlResource);
app.post('/api/erc/baseconfig/ERCLandAgentEstateControl', services.ERCEstateControlSRV.ERCEstateControlResource);
app.post('/api/erc/baseconfig/ERCRoomTypeControl', services.ERCRoomTypeControlSRV.ERCRoomTypeControlResource);
app.post('/api/erc/baseconfig/ERCRoomTypeDetailControl', services.ERCRoomTypeDetailControlSRV.ERCRoomTypeDetailControlResource);
app.post('/api/erc/baseconfig/ERCMaterielControl', services.ERCMaterielControlSRV.ERCMaterielControlResource);
app.post('/api/erc/baseconfig/ERCSupplierControl', services.ERCSupplierControlSRV.ERCSupplierControlResource);
app.post('/api/erc/baseconfig/ERCSupplierMaterielControl', services.ERCSupplierMaterielControlSRV.ERCSupplierMaterielControlResource);
app.post('/api/erc/baseconfig/ERCLandAgentControl', services.ERCLandAgentControlSRV.ERCLandAgentControlResource);
app.post('/api/erc/baseconfig/ERCForemanControl', services.ERCForemanControlSRV.ERCForemanControlResource);
app.post('/api/erc/baseconfig/ERCProduceControl', services.ERCProduceControlSRV.ERCProduceControlResource);
app.post('/api/erc/baseconfig/ERCProductPlanControl', services.ERCProductPlanControlSRV.ERCProductPlanControlResource);
app.post('/api/erc/baseconfig/ERCProductProcedureControl', services.ERCProductProcedureControlSRV.ERCProductionProcedureControlResource);
app.post('/api/erc/baseconfig/ERCProductDeviceControl', services.ERCProductDeviceControlSRV.ERCProductDeviceControlResource);
app.post('/api/erc/baseconfig/ERCMaterielSyncControl', services.ERCMaterielSyncControlSRV.ERCMaterielSyncControlResource);
app.post('/api/erc/baseconfig/ERCTaskListControl', services.ERCTaskListControlSRV.ERCTaskListControlResource);
app.post('/api/erc/baseconfig/ERCTaskAllotControl', services.ERCTaskAllotControlSRV.ERCTaskAllotControlResource);
app.post('/api/erc/baseconfig/ERCSiteConfigCaseControl', services.ERCSiteConfigCaseControl.ERCSiteConfigCaseControl);
app.post('/api/erc/baseconfig/ERCSiteSearchCaseControl', services.ERCSiteSearchCaseControl.ERCSiteSearchCaseControl);
app.post('/api/erc/baseconfig/ERCSiteConfigDiaryControl', services.ERCSiteConfigDiaryControl.ERCSiteConfigDiaryControl);
app.post('/api/erc/baseconfig/ERCSiteSearchDiaryControl', services.ERCSiteSearchDiaryControl.ERCSiteSearchDiaryControl);
app.post('/api/erc/baseconfig/ERCWorkerControl', services.ERCWorkerControlSRV.ERCWorkerControlResource);
app.post('/api/erc/baseconfig/ERCProjectControl', services.ERCProjectControlSRV.ERCProjectControlResource);
app.post('/api/erc/baseconfig/ERCFinalAccountControl', services.ERCFinalAccountControlSRV.ERCFinalAccountControlResource);
app.post('/api/erc/baseconfig/ERCWorkerPriceControl', services.ERCWorkerPriceControlSRV.ERCWorkerPriceControlResource);
app.post('/api/erc/baseconfig/ERCNoticeControl', services.ERCNoticeControlSRV.ERCNoticeControlResource);
app.post('/api/erc/baseconfig/ERCHumanResourceControl', services.ERCHumanResourceControlSRV.ERCHumanResourceControlResource);
app.post('/api/erc/baseconfig/ERCEmployeeInformationControl', services.ERCEmployeeInformationControlSRV.ERCEmployeeInformationControlResource);
app.post('/api/erc/baseconfig/ERCAffiliatedCompanyControl', services.ERCAffiliatedCompanyControlSRV.ERCAffiliatedCompanyControlSRVResource);
app.post('/api/erc/baseconfig/ERCBusinessCustomerControl', services.ERCBusinessCustomerControlSRV.ERCBusinessCustomerControlSRVResource);
app.post('/api/erc/baseconfig/ERCSmallProgramControl', services.ERCSmallProgramSRV.SmallProgramResource);
app.post('/api/erc/baseconfig/ERCSmallProgramControl', services.ERCSmallProgramSRV.SmallProgramResource);
app.post('/api/erc/baseconfig/ERCMeetingRoomManageControl', services.ERCMeetingRoomManageControlSRV.ERCMeetingRoomManageControlResource);
app.post('/api/erc/baseconfig/ERCVehicleManageControl', services.ERCVehicleManageControlSRV.ERCVehicleManageControlResource);
app.post('/api/erc/baseconfig/ERCReimburseRankControl', services.ERCReimburseRankSRV.ERCReimburseRankResource);
app.post('/api/erc/baseconfig/ERCBaseDataControl', services.ERCBaseDataControlSRV.ERCBaseDataControlResource);
app.post('/api/erc/baseconfig/ERCMeetingManageControl', services.ERCMeetingManageControlSRV.ERCMeetingManageControlResource);
app.post('/api/erc/baseconfig/ERCMeetingMinuteControl', services.ERCMeetingMinuteControlSRV.ERCMeetingMinuteControlResource);
app.post('/api/erc/baseconfig/ERCTransReceptionListControl', services.ERCTransReceptionSRV.ERCTransReceptionResource);
app.post('/api/erc/baseconfig/ERCTransReceptionDetailControl', services.ERCTransReceptionDetailSRV.ERCTransReceptionDetailResource);
app.post('/api/erc/baseconfig/ERCAskForLeaveControl', services.ERCAskForLeaveControlSRV.ERCAskForLeaveControlResource);
app.post('/api/erc/baseconfig/ERCTransReceptionExpenseControl', services.ERCTransReceptionExpenseSRV.ERCTransReceptionExpenseResource);
app.post('/api/erc/baseconfig/ERCTransReceptionExpenseDetailControl', services.ERCTransReceptionExpenseDetailSRV.ERCTransReceptionExpenseDetailResource);
app.post('/api/erc/baseconfig/ERCCms', services.ERCCmsSRV.ERCCmsResource);
app.get('/api/erc/baseconfig/ERCCmsFile', services.ERCCmsFileSRV.ERCCmsFileResource);
app.post('/api/erc/baseconfig/ERCDocumentManagementControl', services.ERCDocumentManagementControlSRV.ERCDocumentManagementControlResource);
app.post('/api/erc/baseconfig/ERCDocumentNoticeControl', services.ERCDocumentNoticeControlSRV.ERCDocumentNoticeControlResource);
app.post('/api/erc/baseconfig/ERCSpecialExpenseControl', services.ERCSpecialExpenseControl.ERCSpecialExpenseSRV);
app.post('/api/erc/baseconfig/ERCCorporateClientsControl', services.ERCCorporateClientsControlSRV.ERCCorporateClientsControlResource);
app.post('/api/erc/baseconfig/ERCPointControl', services.ERCPointControlSRV.ERCPointControlResource);
app.post('/api/erc/baseconfig/ERCDepartmentControl', services.ERCDepartmentControlSRV.ERCDepartmentControlResource);
app.post('/api/erc/baseconfig/ERCUsergroupControl', services.ERCUsergroupControlSRV.ERCUsergroupControlResource);
app.post('/api/erc/baseconfig/UserDepartmentControl', services.UserDepartmentSRV.UserDepartmentSRVResource);
app.post('/api/erc/baseconfig/UserGroupControl', services.UserGroupSRV.UserGroupSRVResource);
app.post('/api/erc/baseconfig/UserDepartmentGroupControl', services.UserDepartmentGroupControlSRV.UserDepartmentGroupControlResource);
app.post('/api/erc/baseconfig/ERCEmployeeUserGroupControl', services.ERCEmployeeUserGroupControlSRV.ERCEmployeeUserGroupControlResource);
app.post('/api/erc/baseconfig/ERCProductSalesPriceControl', services.ERCProductSalesPriceControlSRV.ERCProductSalesPriceControlResource);
app.post('/api/erc/baseconfig/ERCSystemDataInitializationControl', services.ERCSystemDataInitializationControlSRV.ERCSystemDataInitializationControlResource);
app.post('/api/erc/baseconfig/ERCMessageListControl', services.ERCMessageListControlSRV.ERCMessageListControlResource);
app.post('/api/erc/baseconfig/ERCPointTypeControl', services.ERCPointTypeControlSRV.ERCPointTypeControlResource);
app.post('/api/erc/baseconfig/ERCCompanyControl', services.ERCCompanyControlSRV.ERCCompanyControlResource);

// purchasemanage
app.post('/api/erc/purchasemanage/ERCPurchaseControl', services.ERCPurchaseControlSRV.ERCPurchaseControlResource);
app.post('/api/erc/purchasemanage/ERCPurchaseListControl', services.ERCPurchaseControlSRV.ERCPurchaseControlResource);
app.post('/api/erc/purchasemanage/ERCPurchaseDetailControl', services.ERCPurchaseDetailControlSRV.ERCPurchaseDetailControlResource);
app.post('/api/erc/purchasemanage/ERCPurchaseApplyDetailControl', services.ERCPurchaseApplyDetailControlSRV.ERCPurchaseApplyDetailControlResource);
app.post('/api/erc/purchasemanage/ERCQualityAddControl', services.ERCQualityAddControlSRV.ERCQualityAddControlResource);
app.post('/api/erc/purchasemanage/ERCQualityCheckControl', services.ERCQualityCheckControlSRV.ERCQualityCheckControlResource);
app.post('/api/erc/purchasemanage/ERCReturnNoteControl', services.ERCReturnNoteControlSRV.ERCReturnNoteControlResource);

// inventorymanage
app.post('/api/erc/inventorymanage/ERCBuyInControl', services.ERCBuyInControlSRV.ERCBuyInControlResource);
app.post('/api/erc/inventorymanage/ERCSaleOutControl', services.ERCSaleOutControlSRV.ERCSaleOutControlResource);
app.post('/api/erc/inventorymanage/ERCCheckInventoryControl', services.ERCCheckInventoryControlSRV.ERCCheckInventoryControlResource);
app.post('/api/erc/inventorymanage/ERCInventoryControl', services.ERCInventoryControlSRV.ERCInventoryControlResource);
app.post('/api/erc/inventorymanage/ERCInventoryDetailControl', services.ERCInventoryDetailControlSRV.ERCInventoryDetailControlResource);
app.post('/api/erc/inventorymanage/ERCWarehouseControl', services.ERCWarehouseControlSRV.ERCWarehouseControlResource);
app.post('/api/erc/inventorymanage/ERCInvalidateControl', services.ERCInvalidateControlSRV.ERCInvalidateControlResource);
app.post('/api/erc/inventorymanage/ERCInvalidateApplyControl', services.ERCInvalidateControlSRV.ERCInvalidateControlResource);
app.post('/api/erc/inventorymanage/ERCStcokInApplyControl', services.ERCStcokInApplyControlSRV.ERCStcokInApplyControlResource);
app.post('/api/erc/inventorymanage/ERCStockOutApplyControl', services.ERCStcokOutApplyControlSRV.ERCStcokOutApplyControlResource);
app.post('/api/erc/inventorymanage/ERCIdleApplyControl', services.ERCIdleApplyControlSRV.ERCIdleApplyControlResource);
app.post('/api/erc/inventorymanage/ERCCollectGoodsControl', services.ERCCollectGoodsControlSRV.ERCCollectGoodsControlResource);
app.post('/api/erc/inventorymanage/ERCReceiptListControl', services.ERCReceiptListControlSRV.ERCReceiptListControlResource);

//homepage
app.post('/api/erc/homepage/ERCHomePageControl', services.ERCHomePageControlSRV.ERCHomePageControlResource);

//productionmanage
app.post('/api/erc/productionmanage/ERCMasterPlanControl', services.ERCMasterPlanControlSRV.ERCMasterPlanControlResource);
app.post('/api/erc/productionmanage/ERCWeeklyPlanControl', services.ERCWeeklyPlanControlSRV.ERCWeeklyPlanControlResource);
app.post('/api/erc/productionmanage/ERCDailyPlanControl', services.ERCDailyPlanControlSRV.ERCDailyPlanControlResource);
app.post('/api/erc/productionmanage/ERCProductiveTaskControl', services.ERCProductiveTaskControlSRV.ERCProductiveTaskControlResource);
app.post('/api/erc/productionmanage/ERCProductPlanExecuteControl', services.ERCProductPlanExecuteControlSRV.ERCProductPlanExecuteControlResource);

// mobile
app.post('/api/mobile/appointment', services.MBAppointmentSRV.MBAppointmentResource);
app.post('/api/mobile/quote', services.MBSmartQuoteSRV.MBSmartQuoteResource);
app.post('/api/mobile/node', services.MBNodeSRV.MBNodeResource);
app.post('/api/mobile/order', services.MBOrderSRV.MBOrderResource);
app.post('/api/mobile/user', services.MBUserSRV.MBUserResource);
app.post('/api/mobile/crew', services.MBCrewSRV.MBCrewResource);
app.post('/api/mobile/customer', services.MBCustomerSRV.MBCustomerResource);
app.post('/api/mobile/inquiry', services.MBInquirySRV.MBInquiryResource);
app.post('/api/mobile/feedback', services.MBFeedbackSRV.MBFeedbackResource);
app.post('/api/mobile/materiel', services.MBMaterielSRV.MBMaterielResource);
app.post('/api/mobile/design', services.MBDesignSRV.MBDesignResource);
app.post('/api/mobile/guest', services.MBGuestSRV.MBGuestResource);
app.post('/api/mobile/task', services.MBTaskSRV.ERCTaskListControlResource);
app.post('/api/mobile/complaint', services.MBComplaintSRV.ERCComplaintControlResource);

//微信小程序
app.post('/api/mobile/wechat', services.MBWechatSRV.WechatResource);

// longtermassets
app.post('/api/erc/longtermassets/ERCFixedAssetsControl', services.ERCFixedAssetsControlSRV.ERCFixedAssetsControlResource);
app.post('/api/erc/longtermassets/ERCAmortizeControl', services.ERCAmortizeControlSRV.ERCAmortizeControlResource);
app.post('/api/erc/longtermassets/ERCAmortizeDataControl', services.ERCAmortizeDataControlSRV.ERCAmortizeDataControlResource);
app.post('/api/erc/longtermassets/ERCAmortizeDetailControl', services.ERCAmortizeDetailControlSRV.ERCAmortizeDetailControlResource);
app.post('/api/erc/longtermassets/ERCAmortizeReceiveControl', services.ERCAmortizeReceiveControlSRV.ERCAmortizeReceiveControlResource);
app.post('/api/erc/longtermassets/ERCConsumablesControlSRV', services.ERCConsumablesControlSRV.ERCConsumablesControlResource);
app.post('/api/erc/longtermassets/ERCConsumablesDetailControlSRV', services.ERCConsumablesDetailControlSRV.ERCConsumablesDetailControlResource);
app.post('/api/erc/longtermassets/ERCAssetRetirementControl', services.ERCAssetRetirementControlSRV.ERCAssetRetirementControlResource);
app.post('/api/erc/longtermassets/ERCTakeStockSRV', services.ERCTakeStockSRV.ERCTakeStockResource);
app.post('/api/erc/longtermassets/ERCAmortizeConsumeControl', services.ERCAmortizeConsumeControlSRV.ERCAmortizeConsumeControlResource);
app.post('/api/erc/longtermassets/ERCAmortizeScribeOrderControl', services.ERCAmortizeScribeOrderControlSRV.ERCAmortizeScribeOrderControlResource);
app.post('/api/erc/longtermassets/ERCAmortizePurchaseOrderControl', services.ERCAmortizePurchaseOrderControlSRV.ERCAmortizePurchaseOrderControlResource);

app.post('/api/erc/longtermassets/ERCDevelopControl', services.ERCDevelopControlSRV.ERCDevelopControlResource);
app.post('/api/erc/longtermassets/ERCDevelopDetailControl', services.ERCDevelopDetailControlSRV.ERCDevelopDetailControlResource);
app.post('/api/erc/longtermassets/ERCDevelopScribeOrderControl', services.ERCDevelopScribeOrderControlSRV.ERCDevelopScribeOrderControlResource);
app.post('/api/erc/longtermassets/ERCDevelopPurchaseOrderControl', services.ERCDevelopPurchaseOrderControlSRV.ERCDevelopPurchaseOrderControlResource);
app.post('/api/erc/longtermassets/ERCDevelopReceiveControl', services.ERCDevelopReceiveControlSRV.ERCDevelopReceiveControlResource);
app.post('/api/erc/longtermassets/ERCDevelopConsumeControl', services.ERCDevelopConsumeControlSRV.ERCDevelopConsumeControlResource);
// cashiermanage
app.post('/api/erc/cashiermanage/ERCGatheringControl', services.ERCGatheringControlSRV.ERCGatheringControlResource);
app.post('/api/erc/cashiermanage/ERCPaymentConfirmControl', services.ERCPaymentConfirmControlSRV.ERCPaymentConfirmControlResource);
app.post('/api/erc/cashiermanage/ERCMaterielSRControl', services.ERCMaterielSRControlSRV.ERCMaterielSRControlResource);
app.post('/api/erc/cashiermanage/ERCSpecialExpenseGatheringSumControl', services.ERCSpecialExpenseGatheringSumControlSRV.ERCSpecialExpenseGatheringSumResource);
app.post('/api/erc/cashiermanage/ERCRecordingVoucherSCControl', services.ERCRecordingVoucherSCControlSRV.ERCRecordingVoucherSCControlResource);


// 上海协凭小程序
app.post('/api/shxp/baseconfig/SHXPProductControl', services.SHXPProductControlSRV.ERCSHXPProductControllResource);


//site
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'test') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        })
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

module.exports = app;
