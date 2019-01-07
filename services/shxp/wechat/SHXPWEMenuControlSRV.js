const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPWEMenuControlResource');
const model = require('../../../model');

// tables
const sequelize = model.sequelize
const tb_product = model.shxp_product;

exports.SHXPWEMenuControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'getMenu') {
        getMenu(req, res);
    }else if (method==='getClass'){
        getClass(req,res)
    }
};
async function getClass(req,res){
    try {
        console.log(1234)
        let returnData = {
            shxpProductClass: GLBConfig.SHXPPRODUCTCLASS,
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}
async function getMenu(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = []
        let queryStr = `select * from tbl_shxp_product where state = 1 order by product_class,product_id`
        let result = await sequelize.query(queryStr, {replacements: [], type: sequelize.QueryTypes.SELECT});

        for(let r of result){
            returnData.push({
                url:r.product_img_url,
                name:r.product_name,
                price:r.product_price,
                class:r.product_class
            })
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}