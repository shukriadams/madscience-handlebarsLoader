# madscience-handlebarsLoader

Loads Handlebars pages, partials and helpers, and returns compile page views. 

## Use 

Add to package.json :
    
    {
        "dependencies": {
            "madscience-handlebarsloader": "https://github.com/shukriadams/madscience-handlebarsloader.git#0.0.1"
        }
    }

Use

    const loader = require('madscience-handlebarsloader')

    // config
    loader.initialize({ 
        helpers : './path/to/handlebars/helpers',
        pages : './path/to/handlebars/pages',
        partials : './path/to/handlebars/partials',
    })

    // use in express route
    express.get('/', async function (req, res) {
        const view = await loader.getPage('myview')
        res.send(view())
    })
