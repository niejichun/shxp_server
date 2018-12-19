const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('ERCSupplierControlSRV');
const model = require('../../../model');

// tables
const sequelize = model.sequelize
const tb_product = model.shxp_product;

exports.ERCSHXPProductControllResource = (req, res) => {
    let method = req.query.method
    if (method === 'init') {
        initAct(req, res);
    } else if (method==='addProduct'){
        addProduct(req,res)
    } else if (method==='deleteProduct'){
        deleteProduct(req,res)
    } else if (method==='modifyProduct'){
        modifyProduct(req,res)
    } else if (method==='searchProduct'){
        searchProduct(req,res)
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
            shxpProductClass: GLBConfig.SHXPPRODUCTCLASS,
            shxpProductRecommend: GLBConfig.SHXPPRODUCTRECOMMEND
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendError(res, error)
    }
}

async function addProduct(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user,fileUrl

        if(doc.product_img_url){
            //图片mongo
            fileUrl = await common.fileMove(doc.product_img_url, 'upload');
        }else{
            fileUrl = ''
        }


        //mysql
        let ProductCode = await Sequence.genSHXPProductID()
        let product =  await tb_product.create({
            product_code:ProductCode,
            product_name:doc.product_name,
            product_price:doc.product_price,
            product_class:doc.product_class,
            product_recommend:doc.product_recommend,
            product_img_url:fileUrl
        });


        common.sendData(res, product);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function deleteProduct(req,res){
    try {
        let doc = common.docTrim(req.body), user = req.user

        let result = await tb_product.destroy({
            where: {
                product_id: doc.product_id
            }
        });
        if(doc.product_img_url){
            await common.fileRemove(doc.product_img_url);
        }

        common.sendData(res, result);
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function modifyProduct(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user
        let product = await tb_product.findOne({
            where: {
                product_id: doc.old.product_id
            }
        })
        if (product) {
            product.product_code = doc.new.product_code,
            product.product_name = doc.new.product_name,
            product.product_price = doc.new.product_price,
            product.product_class = doc.new.product_code,
            product.product_recommend = doc.new.product_recommend,
            // product.product_img_url = doc.new.product_img_url
            await product.save();
            common.sendData(res, product)
        } else {
            common.sendError(res, 'group_02')
            return
        }
    } catch (error) {
        common.sendFault(res, error)
    }
}

async function searchProduct(req,res){
    try {
        let doc = common.docTrim(req.body),user = req.user, returnData = {}
        let queryStr = `select * from tbl_shxp_product where state = 1`
        let result = await common.queryWithCount(sequelize, req, queryStr, [])
        returnData.total = result.count;
        returnData.rows = [];
        for(let r of result.data){
            let result = JSON.parse(JSON.stringify(r));
            result.created_at = r.created_at.Format("yyyy-MM-dd");
            result.files = [
                {
                    file_url: r.product_img_url
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

    await common.fileRemove(doc.product_img_url);
    common.sendData(res, {})
}