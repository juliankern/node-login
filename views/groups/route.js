const group = global.req('controllers/group');
const security = global.req('controllers/security');

module.exports = ['/new', '/:name', (base, newGroup, name) => {
    base
        .get(
            security.isLoggedin, 
            security.hasRight('group'), 
        async (req, res) => {
            res.render('groups/list', { 
                headline: res.__('route.groups.headline:Gruppen'),
                groups: await group.get() 
            });
        });

    newGroup
        .get(
            security.isLoggedin, 
            security.hasRight('group.create'),
        async (req, res) => {
            res.render('groups/view', { 
                headline: res.__('route.groups.new.headline:Neue Gruppe anlegen'),
                group: {}
            });
        })
        .post(
            security.isLoggedin, 
            security.hasRight('group.create'),
        async (req, res) => {
            req.body.updatedBy = req.user._id;
            req.body.createdBy = req.user._id;
            let newGroup = await group.create(req.body);
            
            if(newGroup.errors && newGroup.errors.length > 0) {
                req.arrayFlash(newGroup.errors, 'error');
                
                res.redirect('/' + res.__('path.groups.new:groups/new')); 
            } else {
                req.flash('success', { message: res.__('route.groups.success.create:Die Gruppe wurde erfolgreich angelegt') });
                
                res.redirect('/' + res.__('path.groups.base:groups') + '/' + newGroup.name);
            }
        });

    name
        .get(
            security.isLoggedin, 
            security.hasRight('group'), 
        async (req, res) => {
            res.render('groups/view', { 
                headline: res.__('route.groups.headline:Gruppen'),
                group: await group.get(req.params.name)
            });
        })
        .post(
            security.isLoggedin, 
            security.hasRight('group.change'), 
        async (req, res) => {
            req.body.updatedBy = req.user._id;
            let updatedGroup = await group.update(req.params.name, req.body);
            
            if(updatedGroup.errors && updatedGroup.errors.length > 0) {
                req.arrayFlash(updatedGroup.errors, 'error'); 
            } else {
                req.flash('success', { message: res.__('route.groups.success.change:Die Gruppe wurde erfolgreich geändert') });
            }
            
            res.redirect('/' + res.__('path.groups.base:groups') + '/' + updatedGroup.name);
        });
}];