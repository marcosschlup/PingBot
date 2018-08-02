
var _ = require('underscore');

module.exports = {

    routePing (req,res) {

        res.json({response: 'pong'});

        // envia para batch insert
        this.app.controllers.data.insert({timestamp: Date.now()});

        this.receiveStop();

    },

    routePongTotal (req,res) {

        this.app.model.pings.countDocuments({},(err,count) => {
            if (err) return res.json({error: err});

            res.json({total: count});

        });

    },

    receiveStop: _.debounce(function() {

        this.log(`Stop or delay of pings from bot`);

    },4000)

}