module.exports = [
    {
        path: '/ping/:parallel/:qty',
        methods: [{
            type: 'POST',
            controller: 'api',
            handler: 'routeSendPing'
        }]        
    },
]