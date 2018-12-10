const schedule = require('node-schedule');
const logger = require('./util/Logger').createLogger('schedule');
const exchange = require('./batch/exchange');
const vehicle = require('./batch/vehicle');

let scheduler = {
    scheduleJob: function() {
        let jobs = []
        // jobs.push(schedule.scheduleJob('*/1 * * * * *', exchange.test))

        // 根据交通接待申请时间，更新车辆状态 每天00:01:00执行一次
        jobs.push(schedule.scheduleJob('0 1 0 * * *', vehicle.runVehicle))
        return jobs;
    }
}

module.exports = scheduler;