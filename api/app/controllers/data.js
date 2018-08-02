const async = require('async');

module.exports = {

    init (next) {
        
        this.queue = async.cargo((pings, callback) => {
            
            this.batchInsertPings(pings,callback);

        }, this.app.config.db_batch_insert_qty || 50);

        if (this.app.config.debug) this.queue.drain = () => { this.log(`[db] Queue drained`); }

        next();

    },

    insert (data) {
        
        if (this.app.config.debug && this.queue && !this.queue.length()) this.log(`[db] Filling queue`);

        if (this.queue) this.queue.push(data);

    },

    batchInsertPings (pings,callback) {

        this.app.model.pings.insertMany(pings)
            .then((docs) => {
                // console.log(`Inserted: ${docs.length}`);

                callback();
            })
            .catch((err) => {
                this.error(`[batch insert] ${err}`);
                callback();
            });

    }


}