const FoldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('noteful_folders');
    },

    addFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('noteful_folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            });
    },

    getById(knex, id) {
        return knex
            .from('noteful_folders')
            .select('*')
            .where({ id })
            .first();
    },

    deleteFolder(knex, id) {
        return knex
            .from('noteful_folders')
            .where({ id })
            .delete();
    },

    updateFolder(knex, id, newFolderFields) {
        return knex
            .from('noteful_folders')
            .where({ id })
            .update(newFolderFields);
    }
};

module.exports = FoldersService;