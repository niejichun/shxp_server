const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPSeatClassControlSRV');
const model = require('../../../model');

// tables
const sequelize = model.sequelize
const tb_seatClass = model.shxp_seatClass;

exports.SHXPSeatClassControlResource = (req, res) => {
    let method = req.query.method
    if (method === 'init') {
        initAct(req, res);
    } else if (method==='addSeatClass'){
        addSeatClass(req,res)
    } else if (method==='deleteSeatClass'){
        deleteSeatClass(req,res)
    } else if (method==='modifySeatClass'){
        modifySeatClass(req,res)
    } else if (method==='searchSeatClass'){
        searchSeatClass(req,res)
    } else if (method==='upload'){
        uploadAct(req,res)
    } else if (method==='removeFile'){
        removeFile(req,res)
    } else {
        common.sendError(res, 'common_01');
    }
};

async function initAct(req, res) {
    try {
        let returnData = {
            shxpSeatLocation: GLBConfig.SHXPSEATLOCATION,
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}
async function addSeatClass(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user,fileUrl

        if(doc.seatClass_img_url){
            //图片mongo
            fileUrl = await common.fileMove(doc.seatClass_img_url, 'upload');
        }else{
            fileUrl = ''
        }

        //mysql
        let seatClass =  await tb_seatClass.create({
            seatClass_name:doc.seatClass_name,
            seatClass_title:doc.seatClass_title,
            seatClass_price:doc.seatClass_price,
            seatClass_remark:doc.seatClass_remark,
            seatClass_sum:doc.seatClass_sum,
            seatClass_have:0,
            seatClass_no:doc.seatClass_sum,
            seatClass_location:doc.seatClass_location,
            seatClass_img_url:fileUrl
        });
        common.sendData(res, seatClass);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function deleteSeatClass(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user

        let result = await tb_seatClass.destroy({
            where: {
                seatClass_id: doc.seatClass_id
            }
        });
        if(doc.seatClass_img_url){
            await common.fileRemove(doc.seatClass_img_url);
        }

        common.sendData(res, result);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function modifySeatClass(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user
        let seatClass = await tb_seatClass.findOne({
            where: {
                seatClass_id: doc.old.seatClass_id
            }
        })
        if (seatClass) {
            seatClass.seatClass_name = doc.new.seatClass_name,
            seatClass.seatClass_title = doc.new.seatClass_title,
            seatClass.seatClass_price = doc.new.seatClass_price,
            seatClass.seatClass_remark = doc.new.seatClass_remark,
            seatClass.seatClass_sum = doc.new.seatClass_sum,
            seatClass.seatClass_location = doc.new.seatClass_location
            await seatClass.save();
            common.sendData(res, seatClass)
        } else {
            common.sendError(res, 'group_02')
            return
        }
    } catch (error) {
        common.sendFault(res, error)
    }
}

async function searchSeatClass(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = {}
        let queryStr = `select * from tbl_shxp_seatClass where state = 1`
        let result = await common.queryWithCount(sequelize, req, queryStr, [])
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.created_at = r.created_at.Format("yyyy-MM-dd");
            result.files = [
                {
                    file_url: r.seatClass_img_url
                }
             ]

            returnData.rows.push(result)
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function uploadAct (req, res){
    try {
        let fileInfo = await common.fileSave(req);
        common.sendData(res, fileInfo)
    } catch (error) {
        common.sendFault(res, error)
        return
    }
}

async function removeFile(req,res){
    let doc = common.docTrim(req.body), user = req.user

    await common.fileRemove(doc.seatClass_img_url);
    common.sendData(res, {})
}