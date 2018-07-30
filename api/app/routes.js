module.exports = [
    {
        path: '/ping',
        methods: [{
            type: 'POST',
            controller: 'api',
            handler: 'routePing'
        }]        
    }
]