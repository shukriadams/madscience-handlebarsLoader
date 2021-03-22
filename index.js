let Handlebars = require('handlebars'),
    fs = require('fs-extra'),
    fsUtils = require('madscience-fsUtils'),
    pages = null,
    views = null,
    path = require('path'),
    layouts = require('handlebars-layouts'),
    model = {},
    options = {
        forceInitialize : false,
        helpers : null,
        partials : null,
        data : null,
        pages : null
    }

module.exports = {

    model,

    // expose the handlebars instance bound
    Handlebars,

    initialize(opts, overrideHandelbars){
        options = Object.assign(options, opts)

        // allow handlebars to passed in by initialize
        if (overrideHandelbars)
            Handlebars = overrideHandelbars
    },

    async _loadViews(){

        pages = {}
        views = {}
        
        // register layouts as helper, this is always loaded
        Handlebars.registerHelper(layouts(Handlebars))
        
        
        // load and register file-based helpers
        if (typeof options.helpers === 'string')
            options.helpers = [options.helpers]

        if (options.helpers)
            for (const helperPath of options.helpers){
                if (await fs.exists(helperPath)){
                    const helpers = fsUtils.getFilesAsModulePathsSync(helperPath)
                    for (const helperPath of helpers)
                        (require(helperPath))(Handlebars)

                } else console.warn(`helper path ${helperPath} not found`)
            }
        
        // data : data is a highly simplified way of creating a monolithic data context. this is normally
        // used for simple prototyping only
        if (typeof options.data === 'string')
            options.data = [options.data]

        if (options.data)
            for (const dataPath of options.data){
                if (!await fs.exists(dataPath)) {
                    console.warn(`partials path ${dataPath} not found`)
                    continue
                }

                const dataFilePaths = await fsUtils.readFilesUnderDir(dataPath) 
                for (const dataFilePath of dataFilePaths){
                    const content = fs.readFileSync(dataFilePath, 'utf8'),
                        // model name is the json file name relative to path folder, minus .hbs extension
                        name = path.resolve(dataFilePath).replace(path.resolve(dataPath), '').match(/\/(.*).json/).pop()

                    if (model[name]){
                        console.warn(`The model "${name}" (from file ${dataFilePath}) is already taken by another model.`)
                        continue
                    }    
                    let parsed = null
                    try {
                        parsed = JSON.parse(content)
                    } catch (ex){
                        console.error(`failed to parse expected JSON in file ${dataFilePath}. Is this a JSON file?`)
                        console.error(ex)
                    }

                    model[name] = parsed
                }
            }


        // partials
        if (typeof options.partials === 'string')
            options.partials = [options.partials]

        if (options.partials)
            for (const partialsPath of options.partials){
                if (!await fs.exists(partialsPath)){
                    console.warn(`partials path ${partialsPath} not found`)
                    continue
                }

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
            }

        
        // pages
        if (typeof options.pages === 'string')
            options.pages = [options.pages]

        if (options.pages)
            for (const pagesPath of options.pages){
                if (!await fs.exists(pagesPath)){
                    console.warn(`pages path ${pagesPath} not found`)
                    continue
                } 

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
