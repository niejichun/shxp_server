const config = {
  // for sequelize`
  sequelize: {
    dialect: 'mysql',
    database: 'ercdata',
    username: 'root',
    password: '123456',
    host: 'localhost',
    port: 33306
  },
  // for zowee`
  zowee: {
    user: "pdmzowee",
    password: "y13zowee",
    connectString: "//120.77.216.64/orcl",
    soapUrl: 'http://121.12.253.157:8004/ErpService.asmx?wsdl',
    joinno: '888888',
    shopno: '888888',
    brandid: 2,
    contracttypeid: 1,
    remedyid: 468
  },
  // for redis
  redisCache: true,
  redis: {
    host: 'localhost',
    port: 16379,
    opts: {}
  },
  // for mongo
  mongoFlag: true,
  mongo: {
    connect: 'mongodb://127.0.0.1:27017/erc'
  },
  // for elasticsearch
  elasticsearchFlag: false,
  elasticsearch: {
    index: 'ncahouse',
    host: 'localhost:9200',
    log: {
      type: 'file',
      level: 'trace',
      path: '../log/elasticsearch.log'
    }
  },
  // 电子签名
  signPDF: {
    server: 'http://localhost:8081/tech-sdkwrapper/'
  },
  // for logger
  loggerConfig: {
    level: 'DEBUG',
    config: {
      appenders: {
        out: {
          type: 'stdout'
        },
        everything: {
          type: 'dateFile',
          filename: '../log/app.log',
          pattern: '-yyyy-MM-dd',
          compress: true
        }
      },
      categories: {
        default: {
          appenders: ['out', 'everything'],
          level: 'debug'
        }
      }
    }
  },
  syslogFlag: true,
  uploadOptions: {
    uploadDir: '../public/temp',
    maxFileSize: 2 * 1024 * 1024,
    keepExtensions: true
  },
  tempDir: '../public/temp',
  filesDir: '../public/files',
  tmpUrlBase: '/temp/',
  fileUrlBase: '/files/',
  // SECRET_KEY
  SECRET_KEY: 'zc7#_66#g%u2n$j_)j$-r(swt63d(2l%wc2y=wqt_m8kpy%04*',
  TOKEN_AGE: 43200000, // 12 * 60 * 60 * 1000
  MOBILE_TOKEN_AGE: 31536000000, // 365 * 24 * 60 * 60 * 1000

    //微信小程序
    appid : 'wxb141309c0101eb3d',
    secret : '78ce417ce31de1c2f33ae60c9c174a5a'
};

module.exports = config;