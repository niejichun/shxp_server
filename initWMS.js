

const logger = require('./util/Logger').createLogger('ERCPurchaseControlSRV');
const model = require('./model');
const Sequence = require('./util/Sequence');
const sequelize = model.sequelize;
const moment = require('moment');
const fs = require('fs');
async function init() {
    try {
        // let result;
        // let queryArr = [
        //     'tbl_nca_alldemand','tbl_nca_netdemand','tbl_nca_purchaseorder','tbl_nca_purchasedetail',
        //     'tbl_nca_stockitem','tbl_nca_stockmap','tbl_nca_inventoryaccount','tbl_nca_inventoryorder',
        //     'tbl_nca_qualitycheckdetail','tbl_nca_qualitycheck','tbl_nca_otherstockorder','tbl_nca_stockapply',
        //     'tbl_nca_order','tbl_nca_ordermateriel'
        // ];
        // for(q of queryArr){
        //     let qyerySql = 'delete from ' + q;
        //     console.log(qyerySql);
        //     result = await sequelize.query(qyerySql, {replacements: [], type: sequelize.QueryTypes.DELETE});
        // }

        let replacements=[],writeStr = '';
        let qyerySql1 = `select table_name from information_schema.tables 
            where table_schema='ncadata' and table_type='base table';`
        let tableName = await sequelize.query(qyerySql1, {replacements: [], type: sequelize.QueryTypes.SELECT});

        for(let t of tableName){
            // console.log(t)
            let qyerySql2 =`show create table ${t.table_name}` ;
            let sqlddl = await sequelize.query(qyerySql2, {replacements: [], type: sequelize.QueryTypes.SELECT});
            writeStr +=JSON.stringify(sqlddl[0]) + '/n'

        }
        fs.writeFileSync('message.txt',writeStr);
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit();
    }
}

init();