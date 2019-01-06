const common = require('../../../util/CommonUtil');
const GLBConfig = require('../../../util/GLBConfig');
const Sequence = require('../../../util/Sequence');
const logger = require('../../../util/Logger').createLogger('SHXPWEMeControlResource');
const model = require('../../../model');
const config = require('../../../config');
const crypto = require('crypto');
const https = require('https');
// tables
const sequelize = model.sequelize

const appid = 'wxb141309c0101eb3d'
const secret = '78ce417ce31de1c2f33ae60c9c174a5a'

exports.SHXPWEMeControlResource = (req, res) => {
    let method = req.query.method;
    if (method === 'get_openid') {
        getOpenIdAct(req, res);
    }
};

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

async function getPhoneAct(req, res) {
    try {
        const doc = common.docTrim(req.body);
        const data = await getOpenId(doc.code)
        console.log(`***${data.session_key}***`)
        console.log(`***${doc.encryptedData}***`)
        console.log(`***${doc.iv}***`)

        let sessionKey = new Buffer(data.session_key, 'base64')
        let encryptedData = new Buffer(doc.encryptedData, 'base64')
        let iv = new Buffer(doc.iv, 'base64')

        let  decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true)
        let  decoded = decipher.update(encryptedData, 'binary', 'utf8')
        decoded += decipher.final('utf8')
        decoded = JSON.parse(decoded)
        common.sendData(res, decoded.phoneNumber);
    } catch (error) {
        common.sendFault(res, error);
    }
}