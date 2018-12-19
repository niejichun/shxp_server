const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCSupplierControlSRV');
const model = require('../../../model');

// tables
const sequelize = model.sequelize
const tb_product = model.shxp_product;

exports.SHXPWEHomeControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'searchSignboardProduct') {
        searchSignboardProduct(req, res);
    }
};

async function searchSignboardProduct(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = []
        let queryStr = `select * from tbl_shxp_product where state = 1 and product_recommend = 1`
        let result = await sequelize.query(queryStr, {replacements: [], type: sequelize.QueryTypes.SELECT});

        for(let r of result){
            returnData.push({
                url:r.product_img_url,
                name:r.product_name,
                price:r.product_price
            })
        }

        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
}