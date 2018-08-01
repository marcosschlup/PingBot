module.exports = [
    {
        path: '/ping',
        methods: [{
            type: 'POST',
            controller: 'api',
            handler: 'routePing'
        }]        
    },
    {
        path: '/pong/total',
        methods: [{
            type: 'GET',
            controller: 'api',
            handler: 'routePongTotal'
        }]        
    }
]