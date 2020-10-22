

let Handlebars = require('handlebars'),
    fs = require('fs-extra'),
    fsUtils = require('madscience-fsUtils'),
    pages = null,
    views = null,
    path = require('path'),
    layouts = require('handlebars-layouts'),
    options = {
        forceInitialize : false,
        helpers : path.join('handlebars', 'helpers'),
        partials : path.join('handlebars', 'partials'),
        pages : path.join('handlebars', 'pages')
    }

module.exports = {

    initialize(opts){
        options = Object.assign(options, opts)
    },

    async _loadViews(){

        pages = {}
        views = {}
        
        // register layouts as helper, this is always loaded
        Handlebars.registerHelper(layouts(Handlebars))
        
        
        // load and register file-based helpers
        if (typeof options.helpers === 'string')
            options.helpers = [options.helpers]

        for (const helperPath of options.helpers){
            if (await fs.exists(helperPath)){
                const helpers = fsUtils.getFilesAsModulePathsSync(helperPath)
                for (const helperPath of helpers)
                    (require(helperPath))(Handlebars)

            } else console.warn(`helper path ${helperPath} not found`)
        }


        // partials
        if (typeof options.partials === 'string')
            options.partials = [options.partials]

        for (const partialsPath of options.partials){
            if (await fs.exists(partialsPath)){
                partialPaths = await fsUtils.readFilesUnderDir(partialsPath) 

                for (const partialPath of partialPaths){
                    const content = fs.readFileSync(partialPath, 'utf8'),
                        // partial name is the hbs file name relative to path folder, minus .hbs extension
                        name = path.resolve(partialPath).replace(path.resolve(partialsPath), '').match(/\/(.*).hbs/).pop()

                    if (views[name]){
                        console.warn(`The partial "${name}" (from view ${partialPath}) is already taken by another partial.`)
                        continue
                    }    

                    Handlebars.registerPartial(name, content)
                    views[name] = true
                }
            } else console.warn(`partials path ${partialsPath} not found`)
        }

        
        // pages
        if (typeof options.pages === 'string')
            options.pages = [options.pages]

        for (const pagesPath of options.pages){
            if (await fs.exists(pagesPath)){
                const pagePaths = await fsUtils.readFilesUnderDir(pagesPath)
                for (const pagePath of pagePaths){
                    const content = fs.readFileSync(pagePath, 'utf8'),
                        // view name is the hbs file name relative to path folder, minus .hbs extension
                        name = path.resolve(pagePath).replace(path.resolve(pagesPath), '').match(/\/(.*).hbs/).pop()
                    
                    if (pages[name]){
                        console.warn(`The page "${name}" (from view ${pagePath}) is already taken by another view.`)
                        continue
                    }    

                    pages[name] = Handlebars.compile(content)
                }
            } else console.warn(`pages path ${pagesPath} not found`)
        }
    },

    async getPage(page) {
        if (!pages || options.forceInitialize)
            await this._loadViews()

        if (!pages[page])
            throw `View ${page} not found`

        return pages[page]
    }

}
