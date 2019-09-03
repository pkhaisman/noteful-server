const NotesService = {
    getAllNotes(knex) {
        return knex
            .select('*')
            .from('noteful_notes')
            .then(rows => {
                return rows
            })
    },

    getAllNotesInFolder(knex, folderId) {
        return knex
            .select('*')
            .from('noteful_notes')
            .where('folder_id', folderId)
            .then(rows => {
                return rows;
            })
    },

    getById(knex, noteId, folderId) {
        return knex
            .from('noteful_notes')
            .select('*')
            .where('id', noteId)
            .first()
    },

    addNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('noteful_notes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    deleteNote(knex, id) {
        return knex
            .from('noteful_notes')
            .where({ id })
            .delete()
    },

    updateNote(knex, id, newNoteFields) {
        return knex
            .from('noteful_notes')
            .where({ id })
            .update(newNoteFields)
    }
};

module.exports = NotesService;