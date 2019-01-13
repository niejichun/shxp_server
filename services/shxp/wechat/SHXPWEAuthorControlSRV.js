const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPWEAuthorControlResource');
const model = require('../../../model');
const config = require('../../../config');
const crypto = require('crypto');
const https = require('https');
// tables
const sequelize = model.sequelize

const appid = 'wxb141309c0101eb3d'
const secret = '78ce417ce31de1c2f33ae60c9c174a5a'

exports.SHXPWEAuthorControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'get_openid') {
        getOpenIdAct(req, res);
    }else if (method==='addUser'){
        addUser(req,res)
    }
};

async function addUser(req,res) {
    try{
        let {code} = common.docTrim(req.body),returnData = {}
        // 获取openid
        let openIdRes = await getOpenId(code)
        returnData.openId = openIdRes.openid

        
    }catch (error){
        common.sendFault(res, error);
    }
}
let getOpenIdAct = async(req, res)=> {
    try {
        let doc = common.docTrim(req.body)

        let returnData = await getOpenId(doc.code)
        if (returnData.session_key){
            returnData.session_key = ''
        }
        common.sendData(res, returnData);
    } catch (error) {
        common.sendFault(res, error);
    }
};
function getOpenId(code) {
    let wxHost = 'api.weixin.qq.com';
    return new Promise(function (resolve, reject) {
        let options = {
            hostname: wxHost,
            path: encodeURI(`/sns/jscode2session?appid=${config.appid}&secret=${config.secret}&js_code=${code}&grant_type=authorization_code`),
            method: 'GET',
        };
        let req = https.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                let resJson = JSON.parse(chunk);
                resolve(resJson);
            });
            res.on('end', (e) => {
                console.log(e)
            });
        });
        req.on('error', function (e) {
            logger.error(e.message);
            reject(e);
        });
        req.end();
    });
}

async function getPhoneAct(e) {
    try {
        console.log(`***${e.session_key}***`)
        console.log(`***${e.encryptedData}***`)
        console.log(`***${e.iv}***`)

        let sessionKey = new Buffer(e.session_key, 'base64')
        let encryptedData = new Buffer(e.encryptedData, 'base64')
        let iv = new Buffer(e.iv, 'base64')

        let  decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true)
        let  decoded = decipher.update(encryptedData, 'binary', 'utf8')
        decoded += decipher.final('utf8')
        decoded = JSON.parse(decoded)
        return decoded
    } catch (error) {
        throw error
    }
}