
const async = require('async'),
    _ = require('underscore'),
    request = require('request');

module.exports = {

    init (next) {

        if (this.app.config.use_send_pings_on_start) this.autoSendPingsStart();

        next();

    },

    // envio usando parallel. Acumula memória montando array de requests
    // beneficio de estatisticas de envio do lado do bot
    sendPings (qty,callback) {
        var self = this;

        this.log(`Sending ${qty} Pings...`);

        var calls = [],
            stats = {
                errorsCount: 0,
                completedCount: 0,
                errors: []
            };

        _(qty).times((idx)=>{

            calls.push(function(callback) {

                if (self.app.config.debug) console.log(`[-->] ${idx} Sending`)

                request.post({url: 'http://api/ping',form: {message: 'ping'} ,json: true}, (err, httpResponse, body) => {
                    
                    if (self.app.config.debug) console.log(`[<--] ${idx} Receiving`)

                    if (err) {
                        stats.errorsCount++;
                        if (stats.errors.length <= 10) stats.errors.push(err);
                        return callback();
                    }

                    if (httpResponse.statusCode !== 200) {
                        stats.errorsCount++;
                        if (stats.errors.length <= 10) stats.errors.push(`StatusCode: ${httpResponse.statusCode}`);
                        return callback();
                    }

                    if (body && body.response && body.response === 'pong') {stats.completedCount++; callback();}

                    else {
                        stats.errorsCount++; 
                        if (stats.errors.length <= 10) stats.errors.push(`No PONG response`);
                        return callback();
                    }

                })
            })

        })

        async.parallel(calls,(err)=>{
            if (err) return callback(err);

            this.log(`----------`);
            this.log(`End sending pings:`);
            this.log(`Total: ${qty}`);
            this.log(`Errors: ${stats.errorsCount}`);
            this.log(`Completed: ${stats.completedCount}`);
            
            if (stats.errors.length) {

                this.log(` - Sample Errors:`)

                var sample = _.sample(stats.errors,5);

                _(sample.length).times((idx)=>{ this.log(`   ${sample[idx]}`) })  

            }
            
            this.log(`----------`);

            callback(null,stats);
        })

    },

    // envio simples com 'forEach'
    sendPingsSimple (qty,callback) {
        var self = this;

        this.log(`Sending ${qty} Pings...`);

        _(qty).times((idx)=>{

            if (self.app.config.debug) console.log(`[-->] Sending`);

            request.post({url: 'http://api/ping',form: {message: 'ping'} ,json: true}, (err, httpResponse, body) => {
                
                if (self.app.config.debug) console.log(`[<--] Receiving`);

            })
        })

        callback(null);

    },

    autoSendPingsStart () {

        this.log('Starting autoSendPings...');

        // Se utiliza envio simples com 'forEach' 
        // ou envio com parallel

        if (this.app.config.use_simple_sender) {
            this.sendPingsSimple(this.app.config.send_pings_on_start_qty,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        } else {
            this.sendPings(this.app.config.send_pings_on_start_qty,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        }

        


    }

}