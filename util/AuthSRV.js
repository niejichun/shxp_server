const fs = require('fs');
const common = require('../util/CommonUtil.js');
const logger = require('./Logger').createLogger('AuthSRV.js');
const model = require('../model');
const Security = require('../util/Security');
const Sequence = require('../util/Sequence');
const config = require('../config');
const GLBConfig = require('../util/GLBConfig');
const RedisClient = require('../util/RedisClient');
const sms = require('../util/SMSUtil.js');

// table
const sequelize = model.sequelize;
const tb_common_api = model.common_api;
const tb_common_domain = model.common_domain;
const tb_common_user = model.common_user;
const tb_common_domainmenu = model.common_domainmenu;
const tb_common_usergroup = model.common_usergroup;

exports.AuthResource = async (req, res) => {
    let doc = common.docTrim(req.body);
    if (!('username' in doc)) {
        return common.sendError(res, 'auth_02');
    }
    if (!('identifyCode' in doc)) {
        return common.sendError(res, 'auth_03');
    }
    if (!('magicNo' in doc)) {
        return common.sendError(res, 'auth_04');
    }
    if (!('loginType' in doc)) {
        return common.sendError(res, 'auth_19');
    }
    if (doc.loginType != 'WEB' && doc.loginType != 'MOBILE') {
        return common.sendError(res, 'auth_19');
    }

    try {

        let replacements=[];
        let userQueryStr = 'select * from tbl_common_user t where t.username=? and t.state='+GLBConfig.ENABLE;
        replacements.push(doc.username)
        let user = await sequelize.query(userQueryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        if (user.length === 0) {
            return common.sendError(res, 'auth_05');
        }
        user=user[0];

        let decrypted = Security.aesDecryptModeCFB(doc.identifyCode, user.password, doc.magicNo)

        if (!(decrypted == user.username)) {
            return common.sendError(res, 'auth_05');
        } else {
            let session_token = Security.user2token(doc.loginType, user, doc.identifyCode, doc.magicNo)
            res.append('authorization', session_token);
            let loginData = await loginInit(user, session_token, doc.loginType);

            if (loginData) {
                loginData.authorization = session_token;
                return common.sendData(res, loginData);
            } else {
                return common.sendError(res, 'auth_05');
            }
        }
    } catch (error) {
        logger.error(error);
        common.sendFault(res, error);
        return
    }
}

/**
 * APP登录 del at next release
 * @param req
 * @param res
 * @constructor
 *
 * 监理用username 登录，业主、工人、工长用手机号登录
 */
exports.AuthByPhoneResource = async (req, res) => {
    let doc = common.docTrim(req.body);

    if (!('identifyCode' in doc)) {
        return common.sendError(res, 'auth_03');
    }
    if (!('magicNo' in doc)) {
        return common.sendError(res, 'auth_04');
    }
    if (!('type' in doc)) {
        return common.sendError(res, 'auth_15');
    }
    if (!('phone' in doc)) {
        return common.sendError(res, 'auth_16');
    }
    try {
        let user = await tb_common_user.findOne({
            where: {
                username: doc.phone,
                user_type: doc.type,
                state: GLBConfig.ENABLE
            }
        });

        if (!user) {
            return common.sendError(res, 'auth_05');
        }
        let decrypted = Security.aesDecryptModeCFB(doc.identifyCode, user.password, doc.magicNo);
        if (decrypted != user.username) {
            return common.sendError(res, 'auth_05');
        } else {
            let session_token = Security.user2token('MOBILE', user, doc.identifyCode, doc.magicNo);
            res.append('authorization', session_token);
            let loginData = await loginInit(user, session_token, 'MOBILE');
            loginData.authorization = session_token;
            if (loginData) {
                return common.sendData(res, loginData);
            } else {
                return common.sendError(res, 'auth_05');
            }
        }
    } catch (error) {
        logger.error(error);
        return common.sendFault(res, error);
    }
};

/**
 * 用户登出
 * @param req
 * @param res
 */
exports.SignOutResource = async (req, res) => {
    try {
        let token_str = req.get('authorization');
        if (token_str) {
            let tokensplit = token_str.split('-');

            let type = tokensplit[0],
                uid = tokensplit[1],
                magicNo = tokensplit[2],
                expires = tokensplit[3],
                sha1 = tokensplit[4]
            let error = await RedisClient.removeItem(GLBConfig.REDISKEY.AUTH + type + uid);
            if (error) logger.error(error);
        }
        return common.sendData(res);
    } catch (error) {
        logger.error(error);
        return common.sendData(res);
    }
};
exports.SMSResource = async (req, res) => {
    let doc = common.docTrim(req.body);
    if (!('phone' in doc)) {
        common.sendError(res, 'auth_06');
        return
    }
    if (!('type' in doc)) {
        common.sendError(res, 'auth_07');
        return
    }

    try {
        let result = await sms.sedCodeMsg(doc.phone, doc.type)
        if (result) {
            common.sendData(res);
            return
        } else {
            common.sendError(res, 'auth_08');
            return
        }
    } catch (error) {
        logger.error(error);
        common.sendFault(res, error);
        return
    }
}
exports.PhoneResetPasswordResource = async (req, res) => {
    try {
        let doc = common.docTrim(req.body),
            user = req.user;

        if (!('username' in doc)) {
            common.sendError(res, 'auth_06');
            return
        }
        if (!('type' in doc)) {
            common.sendError(res, 'auth_15');
            return
        }
        if (!('phone' in doc)) {
            common.sendError(res, 'auth_16');
            return
        }
        if (!('code' in doc)) {
            common.sendError(res, 'auth_17');
            return
        }
        if (!('password' in doc)) {
            common.sendError(res, 'auth_18');
            return
        }
        let modUser = await tb_common_user.findOne({
            where: {
                username: doc.username,
                user_type: doc.type,
                state: GLBConfig.ENABLE
            }
        });
        if (!modUser) {
            return common.sendError(res, 'operator_03');
        }
        let checkResult = await sms.certifySMSCode(doc.phone, doc.code, GLBConfig.SMSTYPE[1].value);
        if (checkResult) {
            modUser.password = doc.password;
            await modUser.save();
            let retData = JSON.parse(JSON.stringify(modUser));
            common.sendData(res, retData);
        } else return common.sendError(res, 'auth_12');
    } catch (error) {
        return common.sendFault(res, error);
    }
}

async function loginInit(user, session_token, type) {
    try {
        let returnData = {};
        returnData.avatar = user.avatar
        returnData.user_id = user.user_id;
        returnData.username = user.username;
        returnData.name = user.name;
        returnData.phone = user.phone;
        returnData.created_at = user.created_at.Format("MM, yyyy");
        returnData.type = user.user_type;
        returnData.city = user.city;
        let domain;
        if (user.domain_id) {
            domain = await tb_common_domain.findOne({
                'where': {
                    'domain_id': user.domain_id
                }
            });
            returnData.domain_id = user.domain_id
            returnData.domain_name = domain.domain_name
            returnData.domain_type = domain.domain_type
        } else {
            domain = null
            returnData.domain_id = user.domain_id;
            returnData.domain_name = '未知'
        }

        let usergroup = await tb_common_usergroup.findOne({
            'where': {
                'usergroup_id': user.usergroup_id,
                'state': GLBConfig.ENABLE
            }
        });

        if (usergroup) {
            returnData.description = usergroup.usergroup_name
            returnData.menulist = await iterationMenu(user, domain, usergroup.usergroup_id, '0', [], [usergroup.usergroup_id])

            if (config.redisCache) {
                // prepare redis Cache
                let authApis = []
                if (user.user_type === GLBConfig.TYPE_ADMINISTRATOR) {
                    if (domain.domain_type === '0') {
                        authApis.push({
                            api_name: '系统菜单维护',
                            api_path: '/common/system/SystemApiControl',
                            api_function: 'SYSTEMAPICONTROL',
                            auth_flag: '1',
                            show_flag: '1'
                        })
                        authApis.push({
                            api_name: '机构模板维护',
                            api_path: '/common/system/DomainTemplateControl',
                            api_function: 'DOMAINTEMPLATECONTROL',
                            auth_flag: '1',
                            show_flag: '1'
                        })
                        authApis.push({
                            api_name: '机构维护',
                            api_path: '/common/system/DomainControl',
                            api_function: 'DOMAINCONTROL',
                            auth_flag: '1',
                            show_flag: '1'
                        })
                        authApis.push({
                            api_name: '系统组权限维护',
                            api_path: '/common/system/SysGroupApiControl',
                            api_function: 'SYSGROUPAPICONTROL',
                            auth_flag: '1',
                            show_flag: '1'
                        })

                    }

                    authApis.push({
                        api_name: '用户设置',
                        api_path: '/common/system/UserSetting',
                        api_function: 'USERSETTING',
                        auth_flag: '1',
                        show_flag: '1'
                    })

                    authApis.push({
                        api_name: '角色设置',
                        api_path: '/common/system/DomainGroupControl',
                        api_function: 'DOMAINGROUPCONTROL',
                        auth_flag: '1',
                        show_flag: '1'
                    })

                    authApis.push({
                        api_name: '员工信息管理',
                        api_path: '/erc/baseconfig/ERCEmployeeInformationControl',
                        api_function: 'ERCEMPLOYEEINFORMATIONCONTROL',
                        auth_flag: '1',
                        show_flag: '1'
                    })

                    authApis.push({
                        api_name: '部门维护',
                        api_path: '/erc/baseconfig/ERCDepartmentControl',
                        api_function: 'ERCDEPARTMENTCONTROL',
                        auth_flag: '1',
                        show_flag: '1'
                    })
                    authApis.push({
                        api_name: '岗位维护',
                        api_path: '/erc/baseconfig/ERCUsergroupControl',
                        api_function: 'ERCUSERGROUPCONTROL',
                        auth_flag: '1',
                        show_flag: '1'
                    })
                } else {
                    let groupapis = await queryGroupApi(user.usergroup_id)
                    for (let item of groupapis) {
                        if (item.api_kind === '3') {
                            let sub_group = await tb_common_usergroup.findOne({
                                where: {
                                    usergroup_type: item.sys_usergroup_type
                                }
                            });
                            let subgroupapis = await queryGroupApi(sub_group.usergroup_id)
                            for (let subitem of subgroupapis) {
                                authApis.push({
                                    api_name: subitem.api_name,
                                    api_path: subitem.api_path,
                                    api_function: subitem.api_function,
                                    auth_flag: subitem.auth_flag,
                                    show_flag: subitem.show_flag
                                })
                            }
                        } else {
                            authApis.push({
                                api_name: item.api_name,
                                api_path: item.api_path,
                                api_function: item.api_function,
                                auth_flag: item.auth_flag,
                                show_flag: item.show_flag
                            })
                        }
                    }
                }
                let expired = null
                if (type == 'MOBILE') {
                    expired = RedisClient.mobileTokenExpired
                } else {
                    expired = RedisClient.tokenExpired
                }
                let error = await RedisClient.setItem(GLBConfig.REDISKEY.AUTH + type + user.user_id, {
                    session_token: session_token,
                    user: Object.assign(JSON.parse(JSON.stringify(user)), JSON.parse(JSON.stringify(domain))),
                    authApis: authApis
                }, expired)
                if (error) {
                    return null
                }
            }

            return returnData
        } else {
            return null
        }

    } catch (error) {
        logger.error(error);
        return null
    }
}

async function queryGroupApi(GroupID) {
    try {
        // prepare redis Cache
        let queryStr = `select * from tbl_common_usergroupmenu a, tbl_common_domainmenu b, tbl_common_api c
          where a.domainmenu_id = b.domainmenu_id
          and b.api_id = c.api_id
          and a.usergroup_id = ?
          and b.state = '1'`;

        let replacements = [GroupID];
        let groupmenus = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        })
        return groupmenus
    } catch (error) {
        logger.error(error);
        return []
    }
}

async function iterationMenu(user, domain, GroupID, parent_id, m_list, actGroups) {
    if (user.user_type === GLBConfig.TYPE_ADMINISTRATOR) {
        let return_list = []
        return_list.push({
            menu_type: GLBConfig.MTYPE_ROOT,
            menu_name: '管理员配置',
            menu_icon: 'fa-cogs',
            show_flag: '1',
            sub_menu: []
        })
        if (domain.domain_type === '0') {
            return_list[0].sub_menu.push({
                menu_type: GLBConfig.MTYPE_LEAF,
                menu_name: '系统菜单维护',
                show_flag: '1',
                menu_path: '/common/system/SystemApiControl',
                api_function: 'SYSTEMAPICONTROL',
                sub_menu: []
            })
            return_list[0].sub_menu.push({
                menu_type: GLBConfig.MTYPE_LEAF,
                menu_name: '机构模板维护',
                show_flag: '1',
                menu_path: '/common/system/DomainTemplateControl',
                api_function: 'DOMAINTEMPLATECONTROL',
                sub_menu: []
            })
            return_list[0].sub_menu.push({
                menu_type: GLBConfig.MTYPE_LEAF,
                menu_name: '机构维护',
                show_flag: '1',
                menu_path: '/common/system/DomainControl',
                api_function: 'DOMAINCONTROL',
                sub_menu: []
            })
            return_list[0].sub_menu.push({
                menu_type: GLBConfig.MTYPE_LEAF,
                menu_name: '系统组权限维护',
                show_flag: '1',
                menu_path: '/common/system/SysGroupApiControl',
                api_function: 'SYSGROUPAPICONTROL',
                sub_menu: []
            })
        }

        return_list[0].sub_menu.push({
            menu_type: GLBConfig.MTYPE_LEAF,
            menu_name: '角色设置',
            show_flag: '1',
            menu_path: '/common/system/DomainGroupControl',
            api_function: 'DOMAINGROUPCONTROL',
            sub_menu: []
        })

        return_list[0].sub_menu.push({
            menu_type: GLBConfig.MTYPE_LEAF,
            menu_name: '员工信息管理',
            show_flag: '1',
            menu_path: '/erc/baseconfig/ERCEmployeeInformationControl',
            api_function: 'ERCEMPLOYEEINFORMATIONCONTROL',
            sub_menu: []
        })

        return_list[0].sub_menu.push({
            menu_type: GLBConfig.MTYPE_LEAF,
            menu_name: '部门维护',
            show_flag: '1',
            menu_path: '/erc/baseconfig/ERCDepartmentControl',
            api_function: 'ERCDEPARTMENTCONTROL',
            sub_menu: []
        })

        return_list[0].sub_menu.push({
            menu_type: GLBConfig.MTYPE_LEAF,
            menu_name: '岗位维护',
            show_flag: '1',
            menu_path: '/erc/baseconfig/ERCUsergroupControl',
            api_function: 'ERCUSERGROUPCONTROL',
            sub_menu: []
        })

        return return_list
    } else {
        let return_list = m_list
        let queryStr = `select * from tbl_common_usergroupmenu a, tbl_common_domainmenu b
          left join tbl_common_api c on b.api_id = c.api_id
          where a.domainmenu_id = b.domainmenu_id
          and a.usergroup_id = ?
          and b.parent_id = ?
          order by b.domainmenu_index`;

        let replacements = [GroupID, parent_id];
        let menus = await sequelize.query(queryStr, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        })

        for (let m of menus) {
            let sub_menu = [];

            if (m.node_type === GLBConfig.MTYPE_ROOT && m.root_show_flag === '1') {
                if (m.api_kind === '3') {
                    sub_menu = await iterationMenu(user, domain, GroupID, m.domainmenu_id, return_list, actGroups);
                } else {
                    sub_menu = await iterationMenu(user, domain, GroupID, m.domainmenu_id, [], actGroups);
                }
            }

            if (m.api_kind === '3') {
                if (m.node_type === GLBConfig.MTYPE_LEAF) {
                    let usergroup = await tb_common_usergroup.findOne({
                        where: {
                            usergroup_type: m.sys_usergroup_type
                        }
                    });
                    if (usergroup) {
                        if (actGroups.indexOf(usergroup.usergroup_id) < 0) {
                            actGroups.push(usergroup.usergroup_id)
                            return_list = await iterationMenu(user, domain, usergroup.usergroup_id, '0', return_list, actGroups);
                        }
                    }
                }
            } else {
                if (m.node_type === GLBConfig.MTYPE_LEAF) {
                    return_list.push({
                        menu_id: m.domainmenu_id,
                        menu_kind: m.api_kind,
                        menu_type: m.node_type,
                        menu_name: m.domainmenu_name,
                        menu_path: m.api_path,
                        menu_icon: m.domainmenu_icon,
                        show_flag: m.show_flag,
                        api_function: m.api_function,
                        sub_menu: sub_menu
                    })
                } else if (m.node_type === GLBConfig.MTYPE_ROOT && sub_menu.length > 0 && m.root_show_flag === '1') {
                    let i
                    for (i = 0; i < return_list.length; i++) {
                        if (return_list[i].menu_id === m.domainmenu_id) {
                            for (let ms of sub_menu) {
                                let j;
                                for (j = 0; j < return_list[i].sub_menu.length; j++) {
                                    if (ms.menu_id === return_list[i].sub_menu[j].menu_id) break
                                }
                                if (j >= return_list[i].sub_menu.length) return_list[i].sub_menu.push({
                                    menu_id: ms.menu_id,
                                    menu_kind: ms.menu_kind,
                                    menu_type: ms.menu_type,
                                    menu_name: ms.menu_name,
                                    menu_path: ms.menu_path,
                                    menu_icon: ms.menu_icon,
                                    show_flag: ms.show_flag,
                                    api_function: m.api_function,
                                    sub_menu: ms.sub_menu
                                })
                            }
                            break
                        }
                    }
                    if (i >= return_list.length) {
                        return_list.push({
                            menu_id: m.domainmenu_id,
                            menu_kind: m.api_kind,
                            menu_type: m.node_type,
                            menu_name: m.domainmenu_name,
                            menu_path: m.api_path,
                            menu_icon: m.domainmenu_icon,
                            show_flag: m.show_flag,
                            api_function: m.api_function,
                            sub_menu: sub_menu
                        })
                    }
                }
            }

        }
        return return_list
    }
}
