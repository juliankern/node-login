module.exports = [(base) => {
    base
        .get(async (req, res) => {
            res.render('index/template', { 
                headline: res.__('route.index.headline:Hauptseite')
            });
        });
}];