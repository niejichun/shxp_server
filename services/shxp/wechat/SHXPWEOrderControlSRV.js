const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPWEOrderControlResource');
const model = require('../../../model');
const moment = require('moment');
// tables
const sequelize = model.sequelize
const tb_reserve = model.shxp_reserve;
exports.SHXPWEOrderControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'getReserve') {
        getReserve(req, res);
    }else if (method==='modifyReserve'){
        modifyReserve(req,res)
    }
};
async function getReserve(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = [],replacements=[]
        let queryStr = `select r.*,c.seatClass_name,c.seatClass_title,c.seatClass_price,c.seatClass_img_url
            from tbl_shxp_reserve r,tbl_shxp_seatClass c 
            where r.state = 1 and c.state=1 and r.seatClass_id=c.seatClass_id`
        if(doc.reserve_state && doc.reserve_state != 0){
            queryStr += ` and r.reserve_state = ?`;
            replacements.push(doc.reserve_state)
        }
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.SELECT});
        for(let r of result){
            r.reserve_date = moment(r.reserve_date).format("YYYY-MM-DD")
        }
        common.sendData(res, result);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function modifyReserve(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user
        let reserve = await tb_reserve.findOne({
            where:{
                state:1,
                reserve_id:doc.reserve_id
            }
        })

        if(reserve){
            reserve.reserve_state = doc.reserve_state
            reserve.save()
        }
        common.sendData(res, reserve);
    } catch (error) {
        common.sendFault(res, error);
    }
}