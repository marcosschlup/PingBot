const async = require('async'),
    moment = require('moment'),
    chalk = require('chalk'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    express = require('express');

module.exports = {
    controllers: {},
    start () {
        var self = this;

        this.log('APP Starting...')

        async.auto({
            loadConfig: (callback) => {
                
                this.config = require('../config.json');

                this.log(`[Config] loaded`);

                callback();

            },            
            createDB: ['loadConfig', (results,callback)=>{

                this.createDb(callback);

            }],
            loadModel: ['createDB', (results,callback)=>{

                this.createAPI(callback);

            }],
            createAPI: ['loadModel', (results,callback)=>{

                this.loadModel(callback);

            }],
            initControllers: ['createAPI', (results,callback)=>{

                this.initControllers(callback);

            }]
        },(err) => {
            if (err) return this.error(err);

            this.log('------');

        })

    },
    createDb (callback) {

        if (!this.config.db) return callback();

        this.db = mongoose.connect(`mongodb://${this.config.db.host}:${this.config.db.port}/${this.config.db.database}`, {useNewUrlParser: true })
            .then(() => { this.log(`[db] Connected (${this.config.db.host})`); callback(); })
            .catch((err) => callback(err));
        
    },

    loadModel (callback) {

        if (!this.config.db || !this.config.db.model) return callback();
        
        var schema = mongoose.Schema;

        var models = require(this.config.db.model);

        this.schemas = {};
        this.model = {};

        _.each(models,(data,name)=>{
            
            this.schemas[name] = new schema(data);

            this.model[name] = mongoose.model(name, this.schemas[name]);

        });

        callback();


    },
    createAPI (callback) {
        
        if (!this.config.api) return callback();

        this.api = {
            server: express()
        };

        this.createAPIRoutes();

        this.api.server.listen(this.config.api.port,() => {
            
            this.log(`[api] Server up (${this.config.api.port})`);

            callback();

        });

    },

    createAPIRoutes () {

        var Router = express.Router();

        var routes = require(this.config.api.routes);

        routes.forEach((item) => {
            
            item.methods.forEach((method) => {

                var httpMethod = method.type.toLocaleLowerCase();

                if (typeof Router[httpMethod] !== 'function') return this.error(`[api] Method '${method.type}' not found for ' ${item.path} '`)
                
                if (!this.controllers[method.controller]) return this.error(`[api] Controller '${method.controller}' not found for ' ${item.path} '`)
                
                if (!this.controllers[method.controller][method.handler]) return this.error(`[api] Handler '${method.handler}' not found in controller '${method.controller}' for ' ${item.path} '`)
                
                Router[httpMethod].apply(Router,[item.path,(req,res,next) => {
                    this.controllers[method.controller][method.handler].apply(this.controllers[method.controller],[req,res,next])
                }]);

            })

        });
        
        this.api.server.use(Router);
    },

    loadControllers (controllers) {

        this.log(`[Controlers] Loading (${controllers.length})`);

        function Controller(name,app) {

            this.name = name;
            this.app = app;
    
            this.log = (msg) => {
                console.log.apply(this,[`[${chalk.bold.blue(moment().format('HH:mm:ss'))}]${chalk.blue(` [${this.name}] ${msg}`)}`])        
            }
            this.error = (msg) => {
                console.log.apply(this,[`[${chalk.bold.red(moment().format('HH:mm:ss'))}]${chalk.red(` [${this.name}] ${msg}`)}`])        
            }
    
        }

        controllers.forEach((file)=>{

            var name = file.replace(/(.js|\s)/g,'');

            var data = require(`./controllers/${file}`);

            this.controllers[name] = new Controller(name,this);

            _.extend(this.controllers[name],data);

        })

    },

    initControllers (callback) {
        var self = this;

        async.parallel(
            _.reduce(_.keys(this.controllers),(memo,name) => {
                
                if (self.controllers[name].init) {
                    
                    memo.push(function(callback) {
                        
                        self.controllers[name].init.apply(self.controllers[name],[callback]);

                    });

                }

                return memo;

            },[])
        ,callback);

    },

    log (msg,context) {
        console.log.apply(context,[`[${chalk.bold.blue(moment().format('HH:mm:ss'))}] ${chalk.blue(msg)}`])
    },
    error (msg,context) {
        console.log.apply(context,[`[${chalk.bold.red(moment().format('HH:mm:ss'))}] ${chalk.bold.red(msg)}`])
    }
}