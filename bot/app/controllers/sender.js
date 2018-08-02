
const async = require('async'),
    _ = require('underscore'),
    request = require('request');

module.exports = {

    init (next) {

        if (this.app.config.use_send_pings_on_start) this.autoSendPingsStart();

        next();

    },

    statsResponse (err, httpResponse, body, stats) {
        
        if (err) {
            stats.errorsCount++;
            if (stats.errors.length <= 10) stats.errors.push(err);
            return;
        }

        if (httpResponse.statusCode !== 200) {
            stats.errorsCount++;
            if (stats.errors.length <= 10) stats.errors.push(`StatusCode: ${httpResponse.statusCode}`);
            return;
        }

        if (body && body.response && body.response === 'pong') {stats.completedCount++;}

        else {
            stats.errorsCount++; 
            if (stats.errors.length <= 10) stats.errors.push(`No PONG response`);
            return;
        }

    },

    // filas em paralelo. Cada request aguarda o proximo na sua fila
    sendPingsWait (qty,qtyParallel,callback) {
        var self = this;

        this.log(`Sending ${qty} Pings...`);

        var blockQty = Math.floor(qty/qtyParallel),
            parallel = [],
            stats = {
                errorsCount: 0,
                completedCount: 0,
                errors: []
            };

        _(qtyParallel).times((idx) => {
            
            var q = (idx < qtyParallel-1) ? blockQty : ( qty - (qtyParallel-1) * blockQty ) ;

            parallel.push(function(callback) {

                self.log(`Start running parallel ${idx+1}`);

                var series = [];

                _(q).times(() => {

                    series.push(function(callbackSeries) {

                        request.post({url: `${self.app.config.api_host}/ping`,form: {message: 'ping'} ,json: true},(err, httpResponse, body) => {

                            self.statsResponse(err, httpResponse, body, stats);
    
                            callbackSeries();
    
                        });

                    });
                    
                });

                async.series(series,() => {
                    self.log(`Finish running parallel ${idx+1}`);
                    callback();
                });

            });

        });
        
        async.parallel(parallel, (err) => {
            if (err) return callback(err);

            this.log(`----------`);
            this.log(`Finish sending pings:`);
            this.log(`Total: ${qty}`);
            this.log(`Errors: ${stats.errorsCount}`);
            this.log(`Completed: ${stats.completedCount}`);
            
            if (stats.errors.length) {

                this.log(` - Sample Errors:`);

                var sample = _.sample(stats.errors,5);

                _(sample.length).times((idx)=>{ this.log(`   ${sample[idx]}`) });  

            }
            
            this.log(`----------`);

            callback(null,stats);
        })

    },

    // requests sem fila. Nao aguardam final de ultimo request
    sendPings (qty,qtyParallel,callback) {
        var self = this;

        this.log(`Sending ${qty} Pings...`);

        var blockQty = Math.floor(qty/qtyParallel),
            parallel = [];

        _(qtyParallel).times((idx) => {
            
            var q = (idx < qtyParallel-1) ? blockQty : ( qty - (qtyParallel-1) * blockQty ) ;

            parallel.push(function(callback) {
                self.log(`Start running parallel ${idx+1}`)

                _(q).times((idx) => {

                    request.post({url: `${self.app.config.api_host}/ping`,form: {message: 'ping'} ,json: true});

                    if (idx === q-1) {
                        self.log(`End running parallel ${idx+1} (${q} qty)`)
                        callback();
                    }

                });

            });

        });

        async.parallel(parallel,()=>{
            this.log(`End running ${qty} pings`)
        });

    },

    autoSendPingsStart () {

        this.log('Starting autoSendPings...');

        if (this.app.config.wait_on_parallel_send) {
            this.sendPingsWait(this.app.config.send_pings_on_start_qty,this.app.config.send_pings_on_start_parallel_qty,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        } else {
            this.sendPings(this.app.config.send_pings_on_start_qty,this.app.config.send_pings_on_start_parallel_qty,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        }

    }

}