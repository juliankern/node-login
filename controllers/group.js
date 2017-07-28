const Group = global.req('models/group.js');

module.exports = {
    get,
    create,
    update
};

/**
 * Get a specific group or grouplist
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} name Optional. Name of the user to ne returned
 *
 * @return {Promise}     Promise returning the grozp or an array of groups
 */
async function get(name) {
    if (!name) {
        return await findAll(); // show all for debug
    } else {
        return await find({ name: name });
    }
}

/**
 * Creates new group
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data Data for the new group
 *
 * @return {Promise}     Promise returning the created group
 */
async function create(data, options) {
    options = options || { new: false };
    // definitely check all fields, as they need to be filled
    let groupdata = await _validate(data, {
        check: [
            'name',
        ]
    });

    if(groupdata.errors) {
        return groupdata;
    }
    
    let newGroup = new Group(data);
      
    return await newGroup.save((err) => {
        if (err) global.error('New group save error:', err);
    });
}

/**
 * Update specific group with data
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {string} groupId Group ID of the to-be-updated group
 * @param  {object} data    Group data to be updated
 *
 * @return {Promise}       Promise returning the updated group
 */
async function update(name, data, user) {
    let groupId = (await get(name)).id;
    let groupdata = await _validate(Object.assign({}, data, { id: groupId }));

    if(groupdata.errors) {
        return groupdata;
    }

    return await Group.findByIdAndUpdate(groupId, data, { new: true }).exec((err, data) => {
        if (err) global.error('Group update error:', err);
    });
}

/**
 * find specific group
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} conditions Array of objects for OR handling or object for AND
 *
 * @return {Promise}           Promise returning the found Group
 */
async function find(conditions) {
    conditions = conditions || {};

    return await Group
        .findOne()
        .or(conditions)
        .populate('createdBy')
        .populate('updatedBy')
        .exec((err) => {
            if (err) global.error('Find group error', err);
        });
}

/**
 * find multiple group
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} conditions Array of objects for OR handling or object for AND
 *
 * @return {Promise}           Promise returning the found Groups
 */
async function findAll(conditions) {
    conditions = conditions || {};

    return await Group
        .find()
        .or(conditions)
        .populate('createdBy')
        .populate('updatedBy')
        .exec((err) => {
            if (err) global.error('FindAll group error', err);
        });
}

/**
 * PRIVATE - Validate group data
 *
 * @author Julian Kern <julian.kern@dmc.de>
 *
 * @param  {object} data    Form data
 * @param  {object} options Options for the check. Currently possible:
 *                          - check: {Array}    containing the field names which should definitely be checked, even if not set
 * // @param  {object} user    Current active user
 *
 * @return {object}         Object containung the original data and errors if occured
 */
async function _validate(data, options) {
    let errors = [];
    options = options || { check: '' };
    
    if ((data.name || options.check.includes('name')) && data.name == '') {
        errors.push({ fields: ['name'], messageTranslate: 'group.validate.name.empty:Bitte geben Sie einen Gruppennamen an!' });
    }

    return await Object.assign({}, data, { errors: errors.length > 0 ? errors : null });
}