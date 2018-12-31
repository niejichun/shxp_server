const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPWESubscribeControlResource');
const model = require('../../../model');

// tables
const sequelize = model.sequelize
const tb_reserve = model.shxp_reserve;
const tb_seatClass = model.shxp_seatClass;

exports.SHXPWESubscribeControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'getSubscribe') {
        getSubscribe(req, res);
    }else if (method==='addReserve'){
        addReserve(req,res)
    }
};
async function getSubscribe(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = []
        let queryStr = `select * from tbl_shxp_seatClass where state = 1 order by seatClass_id`
        let result = await sequelize.query(queryStr, {replacements: [], type: sequelize.QueryTypes.SELECT});

        for(let r of result){
            returnData.push({
                id:r.seatClass_id,
                url: r.seatClass_img_url,
                price: r.seatClass_price,
                allNum: r.seatClass_sum,
                residue: r.seatClass_have,
                name: r.seatClass_name,
                remark: r.seatClass_remark,
                location: r.seatClass_location,
                title:r.seatClass_title
            })
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}
async function addReserve(req,res){
    try{
        let doc = common.docTrim(req.body),user = req.user, returnData = [],replacements=[]

        let reserve = await tb_reserve.create({
            reserve_name:doc.reserve_name,
            reserve_phone:doc.reserve_phone,
            reserve_remark:doc.reserve_remark,
            reserve_date:doc.reserve_date,
            reserve_seat_class:doc.reserve_seat_class
        })



        let queryStr = `update tbl_shxp_seatClass set seatClass_have =seatClass_have+1,seatClass_no = seatClass_no-1 
            where seatClass_id = ?`;
        replacements.push(doc.seatClass_id)
        let result = await sequelize.query(queryStr, {replacements: replacements, type: sequelize.QueryTypes.UPDATE});
        common.sendData(res, {});

    }catch (error) {
        common.sendFault(res, error);
    }
}