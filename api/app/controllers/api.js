

module.exports = {

    routePing (req,res) {

        if (this.app.config.debug) console.log(`[<--] Receiving`)

        res.json({response: 'pong'})

    },

    routePongTotal (req,res) {

        res.json({total: 0})

    }

}