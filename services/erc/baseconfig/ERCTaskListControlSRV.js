const moment = require('moment');
const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const logger = require('../../../util/Logger').createLogger('ERCTaskListControlSRV');
const model = require('../../../model');
const Sequence = require('../../../util/Sequence');
const WeeklyPlanControlSRV = require('../productionmanage/ERCWeeklyPlanControlSRV');
const PurchaseApplyDetailControlSRV = require('../purchasemanage/ERCPurchaseApplyDetailControlSRV');
const ERCMaterielCrmControlSRV = require('../ordermanage/ERCMaterielCrmControlSRV');
const ERCInvalidateControlSRV = require('../inventorymanage/ERCInvalidateControlSRV');
const ERCProjectControlSRV = require('./ERCProjectControlSRV');
const ERCNoticeControlSRV = require('./ERCNoticeControlSRV');
const ERCHumanResourceControlSRV = require('./ERCHumanResourceControlSRV');
const ERCQualityAddControlSRV = require('../purchasemanage/ERCQualityAddControlSRV');
const ERCInventoryControlSRV = require('../inventorymanage/ERCInventoryControlSRV');
const ERCTransReceptionDetailSRV = require('../baseconfig/ERCTransReceptionDetailSRV');
const ERCTransReceptionExpenseDetailSRV = require('../baseconfig/ERCTransReceptionExpenseDetailSRV');
const ERCDocumentManagementControlSRV = require('../baseconfig/ERCDocumentManagementControlSRV');
const ERCAskForLeaveControlSRV = require('../baseconfig/ERCAskForLeaveControlSRV');
const ERCSpecialExpenseControl = require('../baseconfig/ERCSpecialExpenseControl');
const ERCFixedAssetsControlSRV = require('../longtermassets/ERCFixedAssetsControlSRV');
const ERCAmortizeControlSRV = require('../longtermassets/ERCAmortizeControlSRV');
const ERCAmortizeDetailControlSRV = require('../longtermassets/ERCAmortizeDetailControlSRV');
const ERCDevelopControlSRV = require('../longtermassets/ERCDevelopControlSRV');
const ERCDevelopDetailControlSRV = require('../longtermassets/ERCDevelopDetailControlSRV');
const ERCConsumablesDetailControlSRV = require('../longtermassets/ERCConsumablesDetailControlSRV');
const ERCAssetRetirementControlSRV = require('../longtermassets/ERCAssetRetirementControlSRV');
const ERCProductPlanControlSRV = require('../baseconfig/ERCProductPlanControlSRV');
const sms = require('../../../util/SMSUtil.js');

const sequelize = model.sequelize;
const Op = sequelize.Op;
const tb_task = model.erc_task;
const tb_user = model.common_user;
const tb_erc_orderreview = model.erc_orderreview;
const tb_reviewmateriel = model.erc_reviewmateriel;
const tb_materiel = model.erc_materiel;
const tb_invalidateorder = model.erc_invalidateorder;
const tb_invalidateApplyorder = model.erc_invalidateApplyorder;
const tb_stockitem = model.erc_stockitem; //安全库存明细
const tb_stockmap = model.erc_stockmap;
const tb_stockapply = model.erc_stockapply;
const tb_stockapplyitem = model.erc_stockapplyitem;
const tb_otherstockorder = model.erc_otherstockorder;
const tb_stockoutapply = model.erc_stockoutapply;
const tb_stockoutapplydetail = model.erc_stockoutapplydetail;
const tb_otherstockout = model.erc_otherstockout;
const tb_notice = model.erc_notice;
const tb_humanresource = model.erc_humanresource;
const tb_return = model.erc_return;
const tb_meetingattendee = model.erc_meetingattendee;
const tb_meeting = model.erc_meeting;
const tb_docuserstate = model.erc_docuserstate;
const tb_fixedassetsrepair = model.erc_fixedassetsrepair;
const tb_cashiergathering = model.erc_cashiergathering;
const tb_paymentconfirm = model.erc_paymentconfirm;
const tb_longassettakestock = model.erc_longassettakestock; //资产盘点管理列表
const tb_longassettakestockdetail = model.erc_longassettakestockdetail; //资产盘点管理详情
const tb_corporateclients = model.erc_corporateclients; //企业客户
const tb_creditlinedetail = model.erc_creditlinedetail; //信用额度明细
const tb_taskallot = model.erc_taskallot;
const tb_taskallotuser = model.erc_taskallotuser;
const tb_message_user = model.erc_message_user;
const tb_notice_user = model.erc_notice_user;
const tb_customtaskallot = model.erc_customtaskallot;
const tb_supremetask = model.erc_supremetask;
const tb_uploadfile = model.erc_uploadfile;
const tb_custorgstructure = model.erc_custorgstructure;

exports.ERCTaskListControlResource = (req, res) => {
  let method = req.query.method;
  if (method === 'init') {
    initAct(req, res);
  } else if (method === 'search') {//查询任务
    searchAct(req, res);
  } else if (method === 'add') {//新增
    addAct(req, res);
  } else if (method === 'complete') { //完成任务
    completeAct(req, res);
  } else if (method === 'confirm') { //确认已完成任务
    confirmAct(req, res);
  } else if (method === 'review') { //审核任务
    reviewAct(req, res);
  } else if (method === 'upload') {
    uploadAct(req, res);
  } else if (method === 'get_flow') {
    getFlowAct(req, res);
  } else if (method === 'get_publish_task') {
    getPublicTaskAct(req, res);
  } else if (method === 'delete_file') {
      deleteFileAct(req, res);
  } else if (method === 'modify') {
      modifyAct(req, res);
  } else {
    common.sendError(res, 'common_01')
  }
};
let initAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body),
      user = req.user;
    let returnData = {
      taskTypeInfo: GLBConfig.TASKTYPE, // 任务类型
      taskStateInfo: GLBConfig.TASKLISTSTATE, // 任务状态
      taskPriorityInfo: GLBConfig.TASKPRORITY, // 优先级
      staffInfo: [], // 团队人员
      customtaskInfo: [] // 自定义工作流
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

    let customtasks = await tb_customtaskallot.findAll({
      where: {
        taskallot_id: '1',
        state: GLBConfig.ENABLE,
        domain_id: user.domain_id
      }
    })
    for (let t of customtasks) {
      returnData.customtaskInfo.push({
        id: t.customtaskallot_id,
        value: t.customtaskallot_name,
        text: t.customtaskallot_name
      });
    }

    common.sendData(res, returnData);
  } catch (error) {
    common.sendFault(res, error);
  }
};

let caculateExpendTime = (startDate, endDate) => {
  let interval = endDate.getTime() - startDate.getTime();
  let days = Math.floor(interval / (24 * 3600 * 1000));

  let leaveh = interval % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
  let hours = Math.floor(leaveh / (3600 * 1000));

  let leavem = leaveh % (3600 * 1000); //计算小时数后剩余的毫秒数
  let minutes = Math.floor(leavem / (60 * 1000));

  let leaves = leavem % (60 * 1000); //计算分钟数后剩余的毫秒数
  let seconds = Math.round(leaves / 1000);
  return days + "天 " + hours + "小时 " + minutes + "分钟 " + seconds + "秒"
};
//查询任务
let searchAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body),
      user = req.user,
      returnData = {};
    let queryStr = `select t.*, f.file_url, u.avatar from tbl_erc_task t
    LEFT JOIN tbl_erc_supremetask s ON t.task_group = s.task_group
    LEFT JOIN tbl_erc_uploadfile f ON s.supremetask_id = f.order_id AND f.state = 1
    LEFT JOIN tbl_common_user u ON u.user_id = t.task_performer
    where t.state = 1 `;

    let replacements = [];
    // if (doc.domain_id) {
    //     queryStr += ` and domain_id = ? `;
    //     replacements.push(doc.domain_id);
    // }
    if (doc.task_type) {
      queryStr += ` and t.task_type = ? `;
      replacements.push(doc.task_type);
    }
    if (doc.task_state) {
      queryStr += ` and find_in_set(t.task_state , ?) `;
      replacements.push(doc.task_state);
    }
    if (doc.created_at_start) {
      queryStr += ` and t.created_at >= ? `;
      replacements.push(doc.created_at_start + ` 00:00:00`);
    }
    if (doc.created_at_end) {
      queryStr += ` and t.created_at <= ? `;
      replacements.push(doc.created_at_end + ` 23:59:59`);
    }
    if (doc.current_type == 1) { //收到的任务
      queryStr += ` and t.task_performer = ? `;
      replacements.push(user.user_id);
    }
    if (doc.current_type == 2) { //自己发布的任务
      queryStr += ` and t.task_publisher = ? `;
      replacements.push(user.user_id);
    }
    if (doc.task_id) {
      queryStr += ` and t.task_id = ? `;
      replacements.push(doc.task_id);
    }

    queryStr += ' order by t.created_at desc';

    let tempResult = await sequelize.query(queryStr, {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT
    })
    let tempArr = []
    for(let t of tempResult){
        const exist = tempArr.some(item => (item.task_id === t.task_id));
        if (!exist) {
            tempArr.push(t)
        }
    }

    let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
    returnData.total = tempArr.length;
    returnData.rows = [];

    for (let r of result.data) {
      let rj = JSON.parse(JSON.stringify(r));
      rj.task_create_date = r.created_at ? r.created_at.Format("yyyy-MM-dd") : null;
      rj.task_complete_date = r.task_complete_date ? r.task_complete_date.Format("yyyy-MM-dd") : null;
      rj.task_expend_time = r.task_complete_date ? caculateExpendTime(r.created_at, r.task_complete_date) : caculateExpendTime(r.created_at, new Date());
      rj.end_time = r.end_time ? moment(r.end_time).format("YYYY-MM-DD HH:mm") : null;

      const exist = returnData.rows.some(item => (item.task_id === rj.task_id));
      if (!exist) {
          rj.imgs = [];
          if (rj.file_url) {
              rj.imgs.push(rj.file_url)
          }
          returnData.rows.push(rj);
      } else {
          for (let d of returnData.rows) {
            if (d.task_id === rj.task_id) {
              if (rj.file_url) {
                  d.imgs = [...d.imgs, rj.file_url]
              }
              break;
            }
          }
      }
    }
    common.sendData(res, returnData);
  } catch (error) {
    common.sendFault(res, error);
  }
};
//新增任务
let addAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body);
    let user = req.user;
    // let taskId = await Sequence.genTaskID(user.domain_id);
    // let addT = await tb_task.create({
    //   task_id: taskId,
    //   domain_id: user.domain_id,
    //   task_name: doc.task_name,
    //   task_type: doc.task_type,
    //   task_priority: doc.task_priority,
    //   task_publisher: user.user_id,
    //   task_performer: doc.task_performer,
    //   task_state: '1',
    //   task_description: doc.task_description,
    //   end_time: doc.end_time
    // });
    // let retData = JSON.parse(JSON.stringify(addT));
    // //给执行人发推送消息
    // common.pushNotification('', '您收到一条新的任务', {
    //   msgFlag: '1'
    // }, doc.task_performer);
    let groupID = common.getUUIDByTime(30);
    let api_name = common.getApiName(req.path)
    await createTask(user, '审批任务', '1', '', '', doc.task_description, '', groupID, doc.customtaskallot_id, doc.files, api_name);
    common.sendData(res);
  } catch (error) {
    common.sendFault(res, error);
  }
};
//完成任务
let completeAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body);
    let user = req.user;
    let task = await tb_task.findOne({
      where: {
        task_id: doc.task_id,
      }
    });

    if (task.task_type === '5') { //修改订单评审的状态为'完成'
      let review = await tb_erc_orderreview.findOne({
        where: {
          order_id: task.task_review_code,
          review_id: task.review_id,
          duty_user_id: user.user_id
        }
      })

      if (review) {
        review.review_status = '3';
        review.review_description = doc.task_remark;
        review.review_date = new Date();
        await review.save();
      }
    }

    if (task) {
      task.task_state = '2';
      task.task_remark = doc.task_remark;
      task.task_complete_date = new Date();
      await task.save();
    } else {
      return common.sendError(res, 'task_01');
    }
    if (task.task_type === '1') {
      //给执行人发推送消息
      common.pushNotification('', '您发布的任务已完成', {
        msgFlag: '2'
      }, task.task_publisher);
    }

    if (task.task_type === '15') { //修改招录任务的状态为'已招录'
      let humanresource = await tb_humanresource.findOne({
        where: {
          state: GLBConfig.ENABLE,
          hr_id: task.task_review_code,
          hr_state: '1'
        }
      });
      if (humanresource) {
        humanresource.hr_state = '2';
        await humanresource.save();
      }
    }

    if (task.task_type === '16') { //修改退货任务的状态为'已处理'
      let returnInfo = await tb_return.findOne({
        where: {
          state: GLBConfig.ENABLE,
          return_id: task.task_review_code,
          return_state: '1'
        }
      });
      if (returnInfo) {
        returnInfo.return_state = '3';
        await returnInfo.save();
      }
    }

    if (task.task_type === '18') { //修改会议通知为已确认
      let returnInfo = await tb_meetingattendee.findOne({
        where: {
          state: GLBConfig.ENABLE,
          meetingattendee_id: task.task_review_code,
        }
      });
      if (returnInfo) {
        returnInfo.meetingattendee_state = '1';
        await returnInfo.save();
      }
    }

    if (task.task_type === '20') { //修改会议表中会议室状态为已确认
      let returnInfo = await tb_meeting.findOne({
        where: {
          state: GLBConfig.ENABLE,
          meeting_id: task.task_review_code,
        }
      });
      if (returnInfo) {
        returnInfo.meetingroom_state = '1';
        await returnInfo.save();
      }
    }

    if (task.task_type === '21') { //修改会议表中主持人状态为已确认
      let returnInfo = await tb_meeting.findOne({
        where: {
          state: GLBConfig.ENABLE,
          meeting_id: task.task_review_code,
        }
      });
      if (returnInfo) {
        returnInfo.host_state = '1';
        await returnInfo.save();
      }
    }

    if (task.task_type === '23') { //修改会议表中设备负责人状态为已确认
      let returnInfo = await tb_meeting.findOne({
        where: {
          state: GLBConfig.ENABLE,
          meeting_id: task.task_review_code,
        }
      });
      if (returnInfo) {
        returnInfo.meetingequipment_state = '1';
        await returnInfo.save();
      }
    }
    if (task.task_type === '26') {
      let docuserstate = await tb_docuserstate.findOne({
        where: {
          document_id: task.task_review_code,
          user_id: user.user_id
        }
      });

      if (docuserstate.read_state != 1) {

        task.task_state = '1';
        task.task_complete_date = null
        await task.save();

        common.sendError(res, 'docquestion_05');
        return
      }
    }
    if (task.task_type === '31') {
      let repairInfo = await tb_fixedassetsrepair.findOne({
        where: {
          state: GLBConfig.ENABLE,
          fixedassetsrepair_id: task.task_review_code,
        }
      });
      if (repairInfo.repair_state == 2) {
        //处理完成，更新任务状态
        task.task_state = '2';
        task.task_complete_date = new Date();
        await task.save();
      } else {
        common.sendError(res, 'fixedassetsrepair_04');
        return
      }

    }
    if (task.task_type === '45') {
      let cashiergathering = await tb_cashiergathering.findOne({
        where: {
          state: GLBConfig.ENABLE,
          cashiergathering_id: task.task_review_code,
        }
      });
      if (cashiergathering) {
        //短信通知申报人
        cashiergathering.cashiergathering_examine = user.user_id;
        cashiergathering.cashiergathering_examine_time = new Date();
        cashiergathering.cashiergathering_state = '2';
        await cashiergathering.save();

        let userDeclarant = await tb_user.findOne({
          where: {
            state: GLBConfig.ENABLE,
            user_id: cashiergathering.cashiergathering_declarant
          }
        });
        if (userDeclarant) {
          if (userDeclarant.phone) {
            sms.sedDataMsg(userDeclarant.phone, 'gather', [cashiergathering.cashiergathering_code, user.name, moment().format("YYYY-MM-DD HH:mm")]) //给申请人发送确认短信
          }
        }

        //如果是企业客户，恢复信用额度
        if (cashiergathering.cashiergathering_customer_code) {
          let corporateclients = await tb_corporateclients.findOne({
            where: {
              corporateclients_id: cashiergathering.cashiergathering_customer_code
            }
          });
          if (corporateclients) {
            if (cashiergathering.cashiergathering_gathering_money >= corporateclients.creditline_use) {
              corporateclients.creditline_advance += cashiergathering.cashiergathering_gathering_money - corporateclients.creditline_use
              corporateclients.creditline_use = 0;
            } else {
              corporateclients.creditline_use = corporateclients.creditline_use - cashiergathering.cashiergathering_gathering_money;
              corporateclients.creditline_advance += 0
            }
            await corporateclients.save();
          }
          corporateclients = await tb_corporateclients.findOne({
            where: {
              corporateclients_id: cashiergathering.cashiergathering_customer_code
            }
          });
          if (corporateclients) {
            //保存信用额度操作明细
            let creditlinedetail = await tb_creditlinedetail.create({
              corporateclients_id: corporateclients.corporateclients_id,
              creditlinedetail_type: '1',
              creditlinedetail_businessid: cashiergathering.cashiergathering_code,
              creditlinedetail_money: cashiergathering.cashiergathering_gathering_money,
              creditlinedetail_surplus_creditline: corporateclients.creditline_money - corporateclients.creditline_use,
              creditlinedetail_surplus_advance: corporateclients.creditline_advance
            });
          }
        }
      }
    }

    if (task.task_type === '46') {
      let paymentconfirm = await tb_paymentconfirm.findOne({
        where: {
          state: GLBConfig.ENABLE,
          paymentconfirm_id: task.task_review_code,
        }
      });
      if (paymentconfirm) {
        paymentconfirm.paymentconfirm_state = '2';
        await paymentconfirm.save();

        let userDeclarant = await tb_user.findOne({
          where: {
            state: GLBConfig.ENABLE,
            user_id: paymentconfirm.paymentconfirm_declarant
          }
        });
        if (userDeclarant) {
          if (userDeclarant.phone) {
            let paymentName = '';
            // 您有一笔付款已确认,类型:{},金额:{},单号:{},确认人:{},确认时间:{}
            if (paymentconfirm.paymentconfirm_name == 1) {
              paymentName = '资金支出'
            } else {
              paymentName = '交通接待费用报销'
            }
            sms.sedDataMsg(userDeclarant.phone, 'payment', [paymentName, paymentconfirm.paymentconfirm_money, paymentconfirm.paymentconfirm_source_code, user.name, moment().format("YYYY-MM-DD HH:mm")]) //给申请人发送确认短信
          }
        }
      }
    }

    if (task.task_type === '44') {
      let longassettakestock = await tb_longassettakestock.findOne({
        where: {
          take_stock_no: task.task_review_code,
          state: GLBConfig.ENABLE
        }
      });
      if (longassettakestock) {
        //盘点确认
        longassettakestock.take_stock_status = GLBConfig.TAKES_STOCK_STATUS[3].value;
        longassettakestock.take_stock_confirm_time = new Date();
        await longassettakestock.save();
        let longassettakestockdetail = await tb_longassettakestockdetail.findAll({
          where: {
            take_stock_parent_no: doc.take_stock_no,
            state: GLBConfig.ENABLE
          }
        });
        for (let l of longassettakestockdetail) {
          l.take_stock_detail_status = GLBConfig.TAKES_STOCK_STATUS[3].value;
          await l.save();
        }

      }
    }
    common.sendData(res, task);
  } catch (error) {
    common.sendFault(res, error);
  }
};
//任务提交
let confirmAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body);
    let user = req.user;
    let task = await tb_task.findOne({
      where: {
        task_id: doc.task_id,
        task_state: '2',
        task_publisher: user.user_id
      }
    });

    if (task) {
      task.task_state = '3';
      await task.save();
    } else {
      return common.sendError(res, 'task_01');
    }
    common.sendData(res, task);
  } catch (error) {
    common.sendFault(res, error);
  }
};
//审核任务
let reviewAct = async (req, res) => {
  try {
    let doc = common.docTrim(req.body);
    let user = req.user;
    let reviewResult = doc.review_result; //0:驳回, 1:通过
    let reviewType = doc.task_type; //2:采购申请, 4:生产计划, 7:物料审核, 8:物料变更审核 10:申请入库
    let task = await tb_task.findOne({
      where: {
        task_id: doc.task_id
      }
    });
    logger.info(task.task_complete_date)

    if (!task) {
      return common.sendError(res, 'task_01');
    }

    let supremetask = await tb_supremetask.findOne({
      where: {
        domain_id: task.domain_id,
        task_group: task.task_group
      }
    })

    if (reviewResult == 1) {
      let maxLev
      if (task.customtaskallot_id) {
        maxLev = await tb_taskallotuser.max('taskallotuser_level', {
          where: {
            taskallot_id: task.task_type,
            customtaskallot_id: task.customtaskallot_id,
            domain_id: user.domain_id
          }
        })
      } else {
        maxLev = await tb_taskallotuser.max('taskallotuser_level', {
          where: {
            taskallot_id: task.task_type,
            domain_id: user.domain_id
          }
        })
      }

      if (maxLev && task.taskallotuser_level < maxLev) {
        //在工作流中的审核，修改同组人的任务状态为'完成'
        let qStr = `select * from tbl_erc_taskallotuser t,tbl_common_user u
                    where t.user_id=u.user_id and t.state=1 and u.state=1
                    and taskallot_id= ? and t.domain_id =? and t.taskallotuser_level=?`;

        let replacements = [task.task_type, user.domain_id, task.taskallotuser_level];

        if (task.customtaskallot_id) {
          qStr += ' and t.customtaskallot_id=?'
          replacements.push(task.customtaskallot_id)
        }
        let tasks = await sequelize.query(qStr, {
          replacements: replacements,
          type: sequelize.QueryTypes.SELECT
        });

        for (let r of tasks) {
          let group
          if (r.customtaskallot_id) {
            group = await tb_task.findOne({
              where: {
                task_group: task.task_group,
                taskallotuser_level: task.taskallotuser_level,
                customtaskallot_id: r.customtaskallot_id,
                task_performer: r.user_id,
                task_state: '1'
              }
            });
          } else {
            group = await tb_task.findOne({
              where: {
                task_group: task.task_group,
                taskallotuser_level: task.taskallotuser_level,
                task_performer: r.user_id,
                task_state: '1'
              }
            });
          }

          if (group) {
            group.task_state = '2';
            group.task_remark = doc.task_remark;
            group.task_complete_date = new Date();
            await group.save();
          }
        }

        // 创建新的审批流
        let nextLev
        if (task.customtaskallot_id) {
          nextLev = await tb_taskallotuser.min('taskallotuser_level', {
            where: {
              taskallot_id: task.task_type,
              domain_id: user.domain_id,
              customtaskallot_id: task.customtaskallot_id,
              taskallotuser_level: {
                [Op.gt]: task.taskallotuser_level
              }
            }
          })
        } else {
          nextLev = await tb_taskallotuser.min('taskallotuser_level', {
            where: {
              taskallot_id: task.task_type,
              domain_id: user.domain_id,
              taskallotuser_level: {
                [Op.gt]: task.taskallotuser_level
              }
            }
          })
        }

        //  更新supremetask
        supremetask.currenttask_level = nextLev
        await supremetask.save()

        let nextStr = `select * from tbl_erc_taskallotuser t,tbl_common_user u
                where t.user_id=u.user_id and t.state=1 and u.state=1 and taskallot_id=? and t.domain_id=? and t.taskallotuser_level=?`;
        replacements = []
        replacements.push(task.task_type, user.domain_id, nextLev);
        if (task.customtaskallot_id) {
          nextStr += ' and t.customtaskallot_id=?'
          replacements.push(task.customtaskallot_id)
        }

        let nexttasks = await sequelize.query(nextStr, {
          replacements: replacements,
          type: sequelize.QueryTypes.SELECT
        });

        for (let u of nexttasks) {
          let taskId = await Sequence.genTaskID(user.domain_id);
          await tb_task.create({
            task_id: taskId,
            domain_id: task.domain_id,
            task_name: task.task_name,
            task_type: task.task_type,
            task_priority: task.task_priority,
            task_publisher: task.task_publisher,
            task_performer: u.user_id,
            task_review_code: task.task_review_code,
            task_state: '1',
            task_description: task.task_description,
            review_id: task.review_id,
            task_group: task.task_group,
            taskallotuser_level: nextLev,
            customtaskallot_id: task.customtaskallot_id
          });
          //给执行人发推送消息
          common.pushNotification('', '您收到一条新的任务', {
            msgFlag: '1'
          }, u.user_id);
        }
        await tb_reviewmateriel.update({
          review_remark: doc.task_remark
        }, {
          where: {
            review_materiel_code: task.task_review_code,
            state: GLBConfig.ENABLE
          }
        });
        return common.sendData(res, task);
      }
    }

    // //预算审核任务和决算审核任务
    // if (reviewType === '13') {
    //   await ERCProjectControlSRV.reviewProjectlTask(reviewResult, reviewType, task.task_review_code, doc.task_remark);
    // }
    if (reviewResult == 1) {
      if (reviewType === '2') {
        await PurchaseApplyDetailControlSRV.modifyPuchaseApplyState('2', doc.task_remark, task.task_review_code, user.user_id, user.domain_id);
      } else if (reviewType === '4') {
        await WeeklyPlanControlSRV.modifyPlanState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '8') {
        await ERCMaterielCrmControlSRV.reviewMaterialTask(user, '2', task.review_id, doc.task_remark)
      } else if (reviewType === '9') {
        let queryStrApply = 'select * from tbl_erc_invalidateapplyorder where state = 1 and invalidateorder_id = ?';
        let replacementsf = [task.task_review_code];
        let resultApply = await sequelize.query(queryStrApply, {
          replacements: replacementsf,
          type: sequelize.QueryTypes.SELECT
        });
        logger.info(resultApply)
        for (let r of resultApply) {
          if (r.invalidatemateriel_type == '1') { //安全库存管理
            let saleId = await tb_stockmap.findOne({
              where: {
                materiel_id: r.materiel_id,
              }
            });
            let safe = await tb_stockitem.findOne({
              where: {
                stockmap_id: r.stockmap_id,
                warehouse_zone_id: r.warehouse_zone_id,
                warehouse_id: r.warehouse_id
              }
            });
            if (safe) {
              safe.item_amount = safe.item_amount - r.invalidateapplyorder_amount
              await safe.save()
            }
            if (saleId) {
              saleId.current_amount = saleId.current_amount - r.invalidateapplyorder_amount
              await saleId.save()
            }
          } else { //销售订单管理
            let sale = await tb_stockmap.findOne({
              where: {
                stockmap_id: r.stockmap_id,
              }
            });
            if (sale) {
              sale.current_amount = sale.current_amount - r.invalidateapplyorder_amount
              await sale.save()
            }
          }
        }
        let invalidateorder = await tb_invalidateorder.findOne({
          where: {
            invalidateorder_id: task.task_review_code,
            state: GLBConfig.ENABLE,
          }
        });
        let complete = new Date();
        if (invalidateorder) {
          invalidateorder.invalidateorder_state = '4';
          invalidateorder.performer_user_id = user.user_id;
          invalidateorder.complete_date = complete;
          invalidateorder.rebut_reason = doc.task_remark;
          await invalidateorder.save()
        }
      } else if (reviewType === '11') {
        let stockoutapply = await tb_stockoutapply.findOne({
          where: {
            stockoutapply_id: task.task_review_code,
            state: GLBConfig.ENABLE,
          }
        });
        let complete = new Date();
        if (stockoutapply) {
          stockoutapply.stockoutapply_state = '3';
          stockoutapply.performer_user_id = user.user_id;
          stockoutapply.complete_date = complete;
          stockoutapply.stockoutapply_remark = doc.task_remark;
          await stockoutapply.save()
        }

        let addOut = await tb_otherstockout.create({
          stockoutapply_id: task.task_review_code,
          domain_id: user.domain_id,
          otherstockout_state: 1,
          performer_user_id: user.user_id
        });
        await addOut.save();
      } else if (reviewType === '7') {

        let materiel = await tb_materiel.findOne({
          where: {
            materiel_code: task.task_review_code,
            materiel_review_state: 1,
            state: 1
          }
        });
        if (materiel) {
          return common.sendError(res, 'materiel_05')
        } else {
          let reviewmateriel = await tb_reviewmateriel.findOne({
            where: {
              state: GLBConfig.ENABLE,
              review_materiel_code: task.task_review_code
            }
          });
          if (reviewmateriel) {
            reviewmateriel.review_state = '2';
            reviewmateriel.review_remark = doc.task_remark;
            await reviewmateriel.save();
          }

          let materiel = await tb_materiel.findOne({
            where: {
              materiel_code: task.task_review_code,
              materiel_review_state: 0
            }
          });
          if (materiel) {
            materiel.domain_id = user.domain_id,
              materiel.materiel_code = task.task_review_code,
              materiel.materiel_name = reviewmateriel.review_materiel_name,
              materiel.materiel_unit = reviewmateriel.review_materiel_unit,
              materiel.materiel_format = reviewmateriel.review_materiel_format,
              materiel.materiel_formatcount = reviewmateriel.review_materiel_formatcount,
              materiel.materiel_formatunit = reviewmateriel.review_materiel_formatunit,
              materiel.materiel_type = reviewmateriel.review_materiel_type,
              materiel.materiel_source = reviewmateriel.review_materiel_source,
              materiel.materiel_formula = reviewmateriel.review_materiel_formula,
              materiel.materiel_manage = reviewmateriel.review_materiel_manage,
              // materiel_batch = reviewmateriel.review_materiel_batch,
              materiel.materiel_sale = reviewmateriel.review_materiel_sale,
              materiel.materiel_award_cost = reviewmateriel.review_materiel_award_cost,
              materiel.materiel_tax = reviewmateriel.review_materiel_tax,
              materiel.materiel_loss = reviewmateriel.review_materiel_loss,
              materiel.materiel_describe = reviewmateriel.review_materiel_describe,
              // materiel_procedure = reviewmateriel.review_materiel_procedure,
              materiel.materiel_amto = reviewmateriel.review_materiel_amto,
              materiel.materiel_cost = reviewmateriel.review_materiel_cost,
              materiel.materiel_conversion = reviewmateriel.review_materiel_conversion,
              materiel.materiel_intpart = reviewmateriel.review_materiel_intpart,
              materiel.materiel_x = reviewmateriel.review_materiel_x,
              materiel.materiel_y = reviewmateriel.review_materiel_y,
              materiel.materiel_z = reviewmateriel.review_materiel_z,
              materiel.materiel_procurement_type = reviewmateriel.review_materiel_procurement_type,
              materiel.materiel_state_management = reviewmateriel.review_materiel_state_management,
              materiel.materiel_review_state = 1
            await materiel.save();
          } else {
            let materiel = await tb_materiel.create({
              domain_id: user.domain_id,
              materiel_code: task.task_review_code,
              materiel_name: reviewmateriel.review_materiel_name,
              materiel_unit: reviewmateriel.review_materiel_unit,
              materiel_format: reviewmateriel.review_materiel_format,
              materiel_formatcount: reviewmateriel.review_materiel_formatcount,
              materiel_formatunit: reviewmateriel.review_materiel_formatunit,
              materiel_type: reviewmateriel.review_materiel_type,
              materiel_source: reviewmateriel.review_materiel_source,
              materiel_formula: reviewmateriel.review_materiel_formula,
              materiel_manage: reviewmateriel.review_materiel_manage,
              // materiel_batch:reviewmateriel.review_materiel_batch,
              materiel_sale: reviewmateriel.review_materiel_sale,
              materiel_award_cost: reviewmateriel.review_materiel_award_cost,
              materiel_tax: reviewmateriel.review_materiel_tax,
              materiel_loss: reviewmateriel.review_materiel_loss,
              materiel_describe: reviewmateriel.review_materiel_describe,
              // materiel_procedure: reviewmateriel.review_materiel_procedure,
              materiel_amto: reviewmateriel.review_materiel_amto,
              materiel_cost: reviewmateriel.review_materiel_cost,
              materiel_conversion: reviewmateriel.review_materiel_conversion,
              materiel_intpart: reviewmateriel.review_materiel_intpart,
              materiel_x: reviewmateriel.review_materiel_x,
              materiel_y: reviewmateriel.review_materiel_y,
              materiel_z: reviewmateriel.review_materiel_z,
              materiel_procurement_type: reviewmateriel.review_materiel_procurement_type,
              materiel_state_management: reviewmateriel.review_materiel_state_management,
              materiel_review_state: '1'
            });
            await materiel.save();
          }
        }
      } else if (reviewType === '10') {
        let stockapply = await tb_stockapply.findOne({
          where: {
            stockapply_id: task.task_review_code,
            apply_type: '1',
            state: '1'
          }
        });
        if (stockapply) {
          stockapply.apply_state = '3';
          stockapply.apply_review = user.user_id;
          stockapply.apply_review_date = new Date();
          stockapply.apply_remark = doc.task_remark;
          await stockapply.save();

          if (stockapply.apply_state == '3') {
            let otherID = await Sequence.genOtherID(user.domain_id);
            let otherstockorder = await tb_otherstockorder.create({
              otherstock_id: otherID,
              stockapply_id: stockapply.stockapply_id,
              domain_id: user.domain_id,
              otherstock_approver: user.user_id
            });
            await otherstockorder.save();
          }

        } else {
          return common.sendError(res, 'puchase_apply_03')
        }
      } else if (reviewType === '14') {
        await ERCNoticeControlSRV.modifyNoticeState('3', doc.task_remark, task.task_review_code, user.user_id);
        let u = await tb_notice.findOne({
          where: {
            notice_id: task.task_review_code,
            state: 1,
            notice_state: 3
          }
        })
        if (u) {
          let userList = await tb_notice_user.findAll({
            where: {
              notice_id: task.task_review_code,
              state: 1,
              read_state: 0
            }
          })
          if (userList.length > 0) {
            let userRecords = [];
            for (let i = 0; i < userList.length; i++) {
              let userInfo = {};
              userInfo.message_id = userList[i].notice_id;
              userInfo.domain_id = userList[i].domain_id;
              userInfo.user_id = userList[i].user_id;
              userInfo.message_user_state = userList[i].read_state;
              userInfo.message_start_date = userList[i].created_at;
              userInfo.message_user_type = 1;
              userInfo.message_user_title = u.notice_title;
              userRecords.push(userInfo)
            }
            let addUser = await tb_message_user.bulkCreate(userRecords);
          }
        }
      } else if (reviewType === '15') {
        await ERCHumanResourceControlSRV.modifyHRState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '16') {
        await ERCQualityAddControlSRV.modifyReturnState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '17') {
        await ERCInventoryControlSRV.updateIdleApply('1', task.review_id, task.task_review_code, task.task_performer, user.domain_id);
      } else if (reviewType === '22') {
        await ERCTransReceptionDetailSRV.modifyTransApplyState('2', doc.task_remark, task.task_review_code, user.user_id, user.domain_id);
      } else if (reviewType === '25') {
        await ERCDocumentManagementControlSRV.modifyDocumentState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '27') {
        await ERCAskForLeaveControlSRV.modifyAskForLeaveState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '28') {
        //校验是否分配任务处理人员
        let taskallot = await tb_taskallot.findOne({
          where: {
            state: GLBConfig.ENABLE,
            taskallot_name: '出纳管理新增付款确认任务'
          }
        });
        let taskallotuser = await tb_taskallotuser.findOne({
          where: {
            state: GLBConfig.ENABLE,
            domain_id: user.domain_id,
            taskallot_id: taskallot.taskallot_id
          }
        });
        if (!taskallotuser) {
          common.sendError(res, 'cashier_02');
          return
        }
        await ERCSpecialExpenseControl.modifySpecialEpenseState('2', doc.task_remark, task.task_review_code, user.user_id, user.domain_id, user, taskallotuser);
      } else if (reviewType === '29') {
        await ERCFixedAssetsControlSRV.modifyFixedAssetsPurchState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '30') {
        await ERCFixedAssetsControlSRV.modifyFixedAssetsCheckState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '32') {
        await ERCAmortizeControlSRV.modifyAmortizeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '33') {
        await ERCAmortizeDetailControlSRV.modifyBudgetState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '34') {
        await ERCAmortizeDetailControlSRV.modifySubscribeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '35') {
        await ERCAmortizeDetailControlSRV.modifyReceiveState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '37') {
        await ERCAmortizeDetailControlSRV.modifyConsumeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '36') {
        await ERCAmortizeDetailControlSRV.modifyClearingState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '39') {
        await ERCAssetRetirementControlSRV.modifyScrapState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '38') {
        await ERCAmortizeDetailControlSRV.modifyCostState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '40') {
        await ERCConsumablesDetailControlSRV.modifyConsumableState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '41') {
        await ERCConsumablesDetailControlSRV.modifyConsumableState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '42') {
        await ERCAmortizeDetailControlSRV.modifyCheckState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '50') {
        await ERCDevelopControlSRV.modifyDevelopState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '51') {
        await ERCDevelopDetailControlSRV.modifyBudgetState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '52') {
        await ERCDevelopDetailControlSRV.modifySubscribeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '53') {
        await ERCDevelopDetailControlSRV.modifyReceiveState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '55') {
        await ERCDevelopDetailControlSRV.modifyConsumeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '54') {
        await ERCDevelopDetailControlSRV.modifyClearingState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '56') {
        await ERCDevelopDetailControlSRV.modifyCostState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '57') {
        await ERCDevelopDetailControlSRV.modifyCheckState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '60') {
        await ERCProjectControlSRV.modifySubscribeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '61') {
        await ERCProjectControlSRV.modifyClearingState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '62') {
        await ERCProjectControlSRV.modifyConsumeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '63') {
        await ERCProjectControlSRV.modifyCostState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '64') {
        await ERCProjectControlSRV.modifyCheckState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '65') {
        await ERCProjectControlSRV.modifyProjectState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '66') {
        await ERCProjectControlSRV.modifyBudgetState('2', doc.task_remark, task.task_review_code, user.user_id);
      }

      //  更新supremetask
      if (supremetask) {
        supremetask.supremetask_state = '2'
        await supremetask.save()
        //创建一个消息
        await tb_message_user.create({
            message_id: supremetask.supremetask_id,
            domain_id: user.domain_id,
            user_id: supremetask.task_publisher,
            message_user_state: '1',
            message_start_date: supremetask.created_at,
            message_user_type: '9',
            message_user_title: '审批状态更新'
        });


      }
    } else {
      if (reviewType === '2') {
        await PurchaseApplyDetailControlSRV.modifyPuchaseApplyState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '4') {
        await WeeklyPlanControlSRV.modifyPlanState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '8') {
        await ERCMaterielCrmControlSRV.reviewMaterialTask(user, '1', task.review_id, doc.task_remark)
      } else if (reviewType === '9') {
        let invalidateorder = await tb_invalidateorder.findOne({
          where: {
            invalidateorder_id: task.task_review_code,
            state: GLBConfig.ENABLE,
          }
        });
        let complete = new Date();
        if (invalidateorder) {
          invalidateorder.invalidateorder_state = '3';
          invalidateorder.performer_user_id = user.user_id;
          invalidateorder.complete_date = complete;
          invalidateorder.rebut_reason = doc.task_remark;
          await invalidateorder.save()
        }
      } else if (reviewType === '11') {
        let stockoutapply = await tb_stockoutapply.findOne({
          where: {
            stockoutapply_id: task.task_review_code,
            state: GLBConfig.ENABLE,
          }
        });
        let complete = new Date();
        if (stockoutapply) {
          stockoutapply.stockoutapply_state = '2';
          stockoutapply.performer_user_id = user.user_id;
          stockoutapply.complete_date = complete;
          stockoutapply.stockoutapply_remark = doc.task_remark;
          await stockoutapply.save()
        }
      } else if (reviewType === '7') {
        let materiel = await tb_materiel.findOne({
          where: {
            materiel_code: task.task_review_code,
            materiel_review_state: 0
          }
        });
        if (materiel) {
          materiel.materiel_review_state = 1

          await materiel.save()

          let reviewmateriel = await tb_reviewmateriel.findOne({
            where: {
              state: GLBConfig.ENABLE,
              review_materiel_code: task.task_review_code,
              review_state: '1'
            }
          });
          if (reviewmateriel) {
            reviewmateriel.review_materiel_code = materiel.materiel_code;
            reviewmateriel.review_materiel_name = materiel.materiel_name;
            reviewmateriel.review_materiel_unit = materiel.materiel_unit;
            reviewmateriel.review_materiel_format = materiel.materiel_format;
            reviewmateriel.review_materiel_formatcount = materiel.materiel_formatcount;
            reviewmateriel.review_materiel_formatunit = materiel.materiel_formatunit;
            reviewmateriel.review_materiel_type = materiel.materiel_type;
            reviewmateriel.review_materiel_describe = materiel.materiel_describe;
            reviewmateriel.review_materiel_source = materiel.materiel_source;
            reviewmateriel.review_materiel_formula = materiel.materiel_formula;
            reviewmateriel.review_materiel_manage = materiel.materiel_manage;
            reviewmateriel.review_materiel_cost = materiel.materiel_cost;
            reviewmateriel.review_materiel_sale = materiel.materiel_sale;
            // reviewmateriel.review_materiel_source_kind = materiel.materiel_source_kind;
            reviewmateriel.review_materiel_tax = materiel.materiel_tax;
            reviewmateriel.review_materiel_amto = materiel.materiel_amto;
            reviewmateriel.review_state = '2'; //已审核
            reviewmateriel.review_materiel_loss = materiel.materiel_loss;
            reviewmateriel.review_remark = doc.task_remark;
            reviewmateriel.review_materiel_state_management = materiel.materiel_state_management;
            reviewmateriel.review_materiel_procurement_type = materiel.materiel_procurement_type;
            //modimate.materiel_batch = materiel.materiel_batch;
            reviewmateriel.state = '1'; //0为驳回
            await reviewmateriel.save()
          }
        } else {
          let reviewmateriel = await tb_reviewmateriel.findOne({
            where: {
              state: GLBConfig.ENABLE,
              review_materiel_code: task.task_review_code,
              review_state: '1'
            }
          });
          if (reviewmateriel) {
            reviewmateriel.review_state = '3';
            reviewmateriel.review_remark = doc.task_remark;
            await reviewmateriel.save()
          }
        }
      } else if (reviewType === '10') {
        let stockapply = await tb_stockapply.findOne({
          where: {
            stockapply_id: task.task_review_code,
            apply_state: '1',
            apply_type: '1',
            state: '1'
          }
        });
        if (stockapply) {
          stockapply.apply_state = '2';
          stockapply.apply_review = user.user_id;
          stockapply.apply_review_date = new Date();
          stockapply.apply_remark = doc.task_remark;
          await stockapply.save();
        } else {
          return common.sendError(res, 'puchase_apply_03')
        }
      } else if (reviewType === '14') {
        await ERCNoticeControlSRV.modifyNoticeState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '17') {
        await ERCInventoryControlSRV.updateIdleApply('0', task.review_id, task.task_review_code, task.task_performer, user.domain_id, task.task_remark);
      } else if (reviewType === '22') {
        await ERCTransReceptionDetailSRV.modifyTransApplyState('3', doc.task_remark, task.task_review_code, user.user_id, user.domain_id);
      } else if (reviewType === '25') {
        await ERCDocumentManagementControlSRV.modifyDocumentState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '27') {
        await ERCAskForLeaveControlSRV.modifyAskForLeaveState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '28') {
        //校验是否分配任务处理人员
        let taskallot = await tb_taskallot.findOne({
          where: {
            state: GLBConfig.ENABLE,
            taskallot_name: '出纳管理新增付款确认任务'
          }
        });
        let taskallotuser = await tb_taskallotuser.findOne({
          where: {
            state: GLBConfig.ENABLE,
            domain_id: user.domain_id,
            taskallot_id: taskallot.taskallot_id
          }
        });
        if (!taskallotuser) {
          common.sendError(res, 'cashier_01');
          return
        }
        await ERCSpecialExpenseControl.modifySpecialEpenseState('3', doc.task_remark, task.task_review_code, user.user_id, user.domain_id, user);
      } else if (reviewType === '29') {
        await ERCFixedAssetsControlSRV.modifyFixedAssetsPurchState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '30') {
        await ERCFixedAssetsControlSRV.modifyFixedAssetsCheckState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '32') {
        await ERCAmortizeControlSRV.modifyAmortizeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '33') {
        await ERCAmortizeDetailControlSRV.modifyBudgetState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '34') {
        await ERCAmortizeDetailControlSRV.modifySubscribeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '35') {
        await ERCAmortizeDetailControlSRV.modifyReceiveState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '37') {
        await ERCAmortizeDetailControlSRV.modifyConsumeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '36') {
        await ERCAmortizeDetailControlSRV.modifyClearingState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '39') {
        await ERCAssetRetirementControlSRV.modifyScrapState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '38') {
        await ERCAmortizeDetailControlSRV.modifyCostState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '40') {
        await ERCConsumablesDetailControlSRV.modifyConsumableState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '41') {
        await ERCConsumablesDetailControlSRV.modifyConsumableState('2', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '42') {
        await ERCAmortizeDetailControlSRV.modifyCheckState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '50') {
        await ERCDevelopControlSRV.modifyDevelopState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '51') {
        await ERCDevelopDetailControlSRV.modifyBudgetState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '52') {
        await ERCDevelopDetailControlSRV.modifySubscribeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '53') {
        await ERCDevelopDetailControlSRV.modifyReceiveState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '55') {
        await ERCDevelopDetailControlSRV.modifyConsumeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '54') {
        await ERCDevelopDetailControlSRV.modifyClearingState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '56') {
        await ERCDevelopDetailControlSRV.modifyCostState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '57') {
        await ERCDevelopDetailControlSRV.modifyCheckState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '60') {
        await ERCProjectControlSRV.modifySubscribeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '61') {
        await ERCProjectControlSRV.modifyClearingState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '62') {
        await ERCProjectControlSRV.modifyConsumeState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '63') {
        await ERCProjectControlSRV.modifyCostState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '64') {
        await ERCProjectControlSRV.modifyCheckState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '65') {
        await ERCProjectControlSRV.modifyProjectState('3', doc.task_remark, task.task_review_code, user.user_id);
      } else if (reviewType === '66') {
        await ERCProjectControlSRV.modifyBudgetState('3', doc.task_remark, task.task_review_code, user.user_id);
      }

      //  更新supremetask
      if (supremetask) {
        supremetask.supremetask_state = '4'
        await supremetask.save()
        //创建一个消息
        await tb_message_user.create({
            message_id: supremetask.supremetask_id,
            domain_id: user.domain_id,
            user_id: supremetask.task_publisher,
            message_user_state: '2',
            message_start_date: supremetask.created_at,
            message_user_type: '9',
            message_user_title: '审批状态更新'
        });
      }
    }

    //在工作流中的审核，修改同组人的任务状态为'完成'
    let queryStr = `select * from tbl_erc_taskallotuser t,tbl_common_user u
                              where t.user_id=u.user_id and t.state=1 and u.state=1
                              and taskallot_id= ? and t.domain_id =?`;

    let replacements = [task.task_type, user.domain_id];
    let taskallotuser = await sequelize.query(queryStr, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });

    for (let r of taskallotuser) {
      let group = await tb_task.findOne({
        where: {
          task_group: task.task_group,
          task_performer: r.user_id,
          task_state: '1'
        }
      });
      if (group) {
        group.task_state = '2';
        group.task_remark = doc.task_remark;
        group.task_complete_date = new Date();
        await group.save();
      }
    }

    // 物料变更审核, 审核人不在工作流中, 所以单独判断
    if (task.task_type === '8' || task.task_type === '12' || task.task_type === '13' ||
      task.task_type === '70' || task.task_type === '71' || task.task_type === '72' || task.task_type === '73') {
      task.task_state = '2';
      task.task_remark = doc.task_remark;
      task.task_complete_date = new Date();
      await task.save();

      switch (task.task_type) {
        case '70':
        case '71':
        case '72':
        case '73':
          await ERCProductPlanControlSRV.productPlanVerified(user, task.task_type, task.task_review_code);
          break;
      }
    }

    common.sendData(res, task);
  } catch (error) {
    common.sendFault(res, error);
  }
};

//创建任务
let createTask = async (user, taskName, taskType, taskPerformer, taskReviewCode, taskDescription, reviewId, taskGroup, customtaskallotId, files, apiName) => {
  let replacements = [];
  let isSuccess = false;
  let result
  //2采购申请，4生产计划，7物料审核，9报废管理，11出库申请，14公告通知，15招录任务 ,16退货任务，
  // 17闲置库存申请 22交通接待申请 25文控管理 27请假审批 28资金支出管理 29固定资产申购
  // 30 固定资产验收 39 资产报废 40 低值易耗品验收申请
  if (taskType == 1 || taskType == 2 || taskType == 4 || taskType == 7 || taskType == 9 || taskType == 10 ||
    taskType == 11 || taskType == 14 || taskType == 16 || taskType == 17 ||
    taskType == 22 || taskType == 25 || taskType == 27 ||
    taskType == 28 || taskType == 29 || taskType == 30 || taskType == 32 ||
    taskType == 33 || taskType == 34 || taskType == 35 || taskType == 36 ||
    taskType == 37 || taskType == 38 || taskType == 39 || taskType == 40 ||
    taskType == 41 || taskType == 42 || taskType == 50 || taskType == 51 ||
    taskType == 52 || taskType == 53 || taskType == 54 || taskType == 55 ||
    taskType == 56 || taskType == 57 || taskType == 58 || taskType == 60 ||
    taskType == 61 || taskType == 62 || taskType == 63 || taskType == 64 ||
    taskType == 65 || taskType == 66) {
    let minlev
    if (customtaskallotId) {
      minlev = await tb_taskallotuser.min('taskallotuser_level', {
        where: {
          taskallot_id: taskType,
          customtaskallot_id: customtaskallotId,
          domain_id: user.domain_id
        }
      });
    } else {
      minlev = await tb_taskallotuser.min('taskallotuser_level', {
        where: {
          taskallot_id: taskType,
          domain_id: user.domain_id
        }
      });
    }
    if (!minlev) {
      minlev = 0
    }

    if (taskGroup) {
      let maxlev
      if (customtaskallotId) {
        maxlev = await tb_taskallotuser.max('taskallotuser_level', {
          where: {
            taskallot_id: taskType,
            customtaskallot_id: customtaskallotId,
            domain_id: user.domain_id
          }
        });
      } else {
        maxlev = await tb_taskallotuser.max('taskallotuser_level', {
          where: {
            taskallot_id: taskType,
            domain_id: user.domain_id
          }
        });
      }
      if (!maxlev) {
        maxlev = 0
      }
      const supremetaskId = await Sequence.genTaskID(user.domain_id);
      if (customtaskallotId) {
        await tb_supremetask.create({
          supremetask_id: supremetaskId,
          domain_id: user.domain_id,
          task_type: taskType,
          task_publisher: user.user_id,
          customtaskallot_id: customtaskallotId,
          task_group: taskGroup,
          task_publisher: user.user_id,
          task_name: taskName,
          task_description: taskDescription,
          supremetask_state: '1',
          currenttask_level: minlev,
          maxtask_level: maxlev
        })
      } else {
        await tb_supremetask.create({
          supremetask_id: supremetaskId,
          domain_id: user.domain_id,
          task_type: taskType,
          task_publisher: user.user_id,
          task_group: taskGroup,
          task_publisher: user.user_id,
          task_name: taskName,
          task_description: taskDescription,
          supremetask_state: '1',
          currenttask_level: minlev,
          maxtask_level: maxlev
        })
      }
      //添加审核图片
      if (files && files.length > 0) {
        for (let file of files) {
            const fileUrl = await common.fileMove(file.url, 'upload')
            await tb_uploadfile.create({
                api_name: apiName,
                order_id: supremetaskId,
                user_id: user.user_id,
                file_creator: user.name,
                file_name: file.name,
                file_url: fileUrl,
                file_type: file.type,
            });
        }
      }
    }

    let queryStr = `select * from tbl_erc_taskallotuser t 
      left join tbl_common_user u on (t.user_id=u.user_id and u.state=1) 
            where  t.state=1 and taskallot_id=? and t.domain_id=? and t.taskallotuser_level=?`;
    replacements.push(taskType, user.domain_id, minlev);

    if (customtaskallotId) {
      queryStr += ' and customtaskallot_id=?'
      replacements.push(customtaskallotId)
    }

    let taskallotuser = await sequelize.query(queryStr, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });

    for (let u of taskallotuser) {
      if(u.islastpost == 1){
          replacements=[];
          queryStr = `select p.p_position_id from tbl_erc_position p 
            left join tbl_erc_custorgstructure c on (p.position_id = c.position_id and c.state=1) 
            where p.state=1 and c.user_id=?`
          replacements.push(user.user_id)
          result = await sequelize.query(queryStr, {
              replacements: replacements,
              type: sequelize.QueryTypes.SELECT
          });

          if(result && result.length>0){
            if(result[0].p_position_id != ''){
                let p_user_id = await tb_custorgstructure.findAll({
                    where:{
                        state:1,
                        position_id:result[0].p_position_id
                    }
                })

                for(p of p_user_id){
                    let taskId = await Sequence.genTaskID(user.domain_id);
                    await tb_task.create({
                        task_id: taskId,
                        domain_id: user.domain_id,
                        task_name: taskName,
                        task_type: taskType,
                        task_priority: '1',
                        task_publisher: user.user_id,
                        task_performer: p.user_id,
                        task_review_code: taskReviewCode,
                        task_state: '1',
                        task_description: taskDescription,
                        review_id: reviewId,
                        task_group: taskGroup,
                        taskallotuser_level: minlev,
                    });
                    //给执行人发推送消息
                    common.pushNotification('', '您收到一条新的任务', {
                        msgFlag: '1'
                    }, p.user_id);
                }
            }
          }


      }else{
          let taskId = await Sequence.genTaskID(user.domain_id);
          await tb_task.create({
              task_id: taskId,
              domain_id: user.domain_id,
              task_name: taskName,
              task_type: taskType,
              task_priority: '1',
              task_publisher: user.user_id,
              task_performer: u.user_id,
              task_review_code: taskReviewCode,
              task_state: '1',
              task_description: taskDescription,
              review_id: reviewId,
              task_group: taskGroup,
              taskallotuser_level: minlev,
              customtaskallot_id: u.customtaskallot_id
          });
          //给执行人发推送消息
          common.pushNotification('', '您收到一条新的任务', {
              msgFlag: '1'
          }, u.user_id);
      }


    }
    if (taskallotuser.length > 0) {
      isSuccess = true;
    }
  } else {
    let taskId = await Sequence.genTaskID(user.domain_id);
    await tb_task.create({
      task_id: taskId,
      domain_id: user.domain_id,
      task_name: taskName,
      task_type: taskType,
      task_priority: '1',
      task_publisher: user.user_id,
      task_performer: taskPerformer,
      task_review_code: taskReviewCode,
      task_state: '1',
      task_description: taskDescription,
      review_id: reviewId
    });
    //给执行人发推送消息
    common.pushNotification('', '您收到一条新的任务', {
      msgFlag: '1'
    }, taskPerformer);
    isSuccess = true;
  }
  return isSuccess;
};

async function uploadAct(req, res) {
  try {
    let fileInfo = await common.fileSave(req);
    common.sendData(res, fileInfo);
  } catch (error) {
    return common.sendFault(res, error);
  }
}
//获取工作流
async function getFlowAct(req, res) {
  try {
    let doc = common.docTrim(req.body);
    let user = req.user;
    let replacements = [];
    let returnData = []

    let tasks = await tb_taskallotuser.findAll({
      where: {
        domain_id: user.domain_id,
        taskallot_id: doc.task_type,

      }
    })
    let queryStr = `select s.name, s.avatar, u.user_id, u.taskallotuser_level, t.updated_at, t.task_id, t.task_state, t.task_remark FROM
    tbl_erc_taskallotuser u
    left join tbl_erc_task t on t.domain_id = u.domain_id
    AND t.task_type = u.taskallot_id
    AND t.customtaskallot_id = u.customtaskallot_id 
    and t.task_performer = u.user_id
    and t.taskallotuser_level = u.taskallotuser_level
    AND t.task_group = ?
    left join tbl_common_user s on u.user_id = s.user_id
    where u.domain_id = ?
    AND u.taskallot_id = ?
    AND u.customtaskallot_id = ? order by u.taskallotuser_level`;
    replacements.push(doc.task_group, user.domain_id, doc.task_type, doc.customtaskallot_id);

    let result = await sequelize.query(queryStr, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });

    let index = -1
    for( let r of result) {
      if(r.taskallotuser_level !== index) {
        index = r.taskallotuser_level
        returnData.push([])
      }
      returnData[index].push({
        name: r.name,
        avatar: r.avatar,
        user_id: r.user_id,
        taskallotuser_level: r.taskallotuser_level,
        complete_time: r.updated_at ? moment(r.updated_at).format("YYYY-MM-DD HH:mm") : null,
        task_state: r.task_state,
        task_id: r.task_id,
        task_remark: r.task_remark
      })
    }

    common.sendData(res, returnData);
  } catch (error) {
    return common.sendFault(res, error);
  }
}
//获取发布的任务
let getPublicTaskAct = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        let queryStr = `select t.*, f.file_url, u.avatar from tbl_erc_supremetask t
        LEFT JOIN tbl_erc_uploadfile f ON t.supremetask_id = f.order_id and  f.state = 1
        LEFT JOIN tbl_common_user u ON u.user_id = t.task_publisher
        where t.state = 1 and t.task_publisher = ? `;

        let replacements = [user.user_id];
        if (doc.task_type) {
            queryStr += ` and t.task_type = ? `;
            replacements.push(doc.task_type);
        }
        if (doc.task_state) {
            queryStr += ` and find_in_set(t.supremetask_state , ?) `;
            replacements.push(doc.task_state);
        }
        if (doc.created_at_start) {
            queryStr += ` and t.created_at >= ? `;
            replacements.push(doc.created_at_start + ` 00:00:00`);
        }
        if (doc.created_at_end) {
            queryStr += ` and t.created_at <= ? `;
            replacements.push(doc.created_at_end + ` 23:59:59`);
        }
        if (doc.task_id) {
            queryStr += ` and t.supremetask_id = ? `;
            replacements.push(doc.task_id);
        }

        queryStr += ' order by t.created_at desc';

        let tempResult = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        })
        let tempArr = []
        for(let t of tempResult){
            const exist = tempArr.some(item => (item.supremetask_id === t.supremetask_id));
            if (!exist) {
                tempArr.push(t)
            }
        }

        let result = await common.queryWithCount(sequelize, req, queryStr, replacements);
        returnData.total = tempArr.length;
        returnData.rows = [];



        for (let r of result.data) {
            let rj = JSON.parse(JSON.stringify(r));
            rj.task_create_date = r.created_at ? r.created_at.Format("yyyy-MM-dd") : null;
            rj.task_complete_date = r.task_complete_date ? r.task_complete_date.Format("yyyy-MM-dd") : null;
            rj.task_expend_time = r.task_complete_date ? caculateExpendTime(r.created_at, r.task_complete_date) : caculateExpendTime(r.created_at, new Date());
            rj.end_time = r.end_time ? moment(r.end_time).format("YYYY-MM-DD HH:mm") : null;
            rj.task_state = r.supremetask_state
            rj.task_id = r.supremetask_id

            const exist = returnData.rows.some(item => (item.task_id === rj.task_id));
            if (!exist) {
                rj.imgs = [];
                if (rj.file_url) {
                    rj.imgs.push(rj.file_url)
                }
                returnData.rows.push(rj);
            } else {
                for (let d of returnData.rows) {
                    if (d.task_id === rj.task_id) {
                        if (rj.file_url) {
                            d.imgs = [...d.imgs, rj.file_url];
                        }
                        break;
                    }
                }
            }
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

let deleteFileAct = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        let file = await tb_uploadfile.findOne({
            where: {
                order_id: doc.task_id,
                file_url: doc.file_url
            }
        });
        if (file) {
          file.state = '0';
          await file.save();
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

let modifyAct = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user,
            returnData = {};
        const groupID = common.getUUIDByTime(30);
        let task = await tb_supremetask.findOne({
            where: {
                supremetask_id: doc.task_id,
            }
        });

        if (task) {
          task.supremetask_state = '1';
          task.customtaskallot_id = doc.customtaskallot_id;
          task.task_description = doc.task_description;
          task.task_group = groupID;
          await task.save();
        }

        //添加审核图片
        let api_name = common.getApiName(req.path)
        let files = doc.files;
        if (files && files.length > 0) {
            for (let file of files) {
                const fileUrl = await common.fileMove(file.url, 'upload')
                await tb_uploadfile.create({
                    api_name: api_name,
                    order_id: doc.task_id,
                    user_id: user.user_id,
                    file_creator: user.name,
                    file_name: file.name,
                    file_url: fileUrl,
                    file_type: file.type,
                });
            }
        }

        const customtaskallotId = doc.customtaskallot_id;
        let minlev
        if (customtaskallotId) {
            minlev = await tb_taskallotuser.min('taskallotuser_level', {
                where: {
                    taskallot_id: 1,
                    customtaskallot_id: customtaskallotId,
                    domain_id: user.domain_id
                }
            });
        } else {
            minlev = await tb_taskallotuser.min('taskallotuser_level', {
                where: {
                    taskallot_id: 1,
                    domain_id: user.domain_id
                }
            });
        }
        if (!minlev) {
            minlev = 0
        }

        let replacements = [];
        let queryStr = `select * from tbl_erc_taskallotuser t,tbl_common_user u
            where t.user_id=u.user_id and t.state=1 and u.state=1 and taskallot_id=? and t.domain_id=? and t.taskallotuser_level=?`;
        replacements.push(1, user.domain_id, minlev);

        if (customtaskallotId) {
            queryStr += ' and customtaskallot_id=?'
            replacements.push(customtaskallotId)
        }

        let taskallotuser = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        for (let u of taskallotuser) {
            let taskId = await Sequence.genTaskID(user.domain_id);
            await tb_task.create({
                task_id: taskId,
                domain_id: user.domain_id,
                task_name: '审批任务',
                task_type: 1,
                task_priority: '1',
                task_publisher: user.user_id,
                task_performer: u.user_id,
                task_review_code: '',
                task_state: '1',
                task_description: doc.task_description,
                review_id: '',
                task_group: groupID,
                taskallotuser_level: minlev,
                customtaskallot_id: u.customtaskallot_id
            });
            //给执行人发推送消息
            common.pushNotification('', '您收到一条新的任务', {
                msgFlag: '1'
            }, u.user_id);
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};

exports.initAct = initAct;
exports.caculateExpendTime = caculateExpendTime;
exports.searchAct = searchAct;
exports.addAct = addAct;
exports.completeAct = completeAct;
exports.confirmAct = confirmAct;
exports.reviewAct = reviewAct;
exports.createTask = createTask;