module.exports = {

    routeSendPing (req,res) {

        if (this.app.config.wait_on_parallel_send) {
            this.app.controllers.sender.sendPingsWait(req.params.qty,req.params.parallel,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        } else {
            this.app.controllers.sender.sendPings(req.params.qty,req.params.parallel,(err,stats)=>{
                if (err) return this.error(err);
    
                this.log('End of autoSendPings');
    
            });
        }

        res.json({order: 'ok'})
    }

}