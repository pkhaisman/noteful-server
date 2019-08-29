const NotesService = require('../src/notes/notes-service');
const knex = require('knex');
const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folders.fixtures');

describe(`Notes service object`, () => {
    let db;
    testNotes = makeNotesArray();
    testFolders = makeFoldersArray();

    before('connect to db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    });

    // after(() => db('noteful_notes').delete());

    afterEach('delete table', () => db('noteful_notes').delete());
    
    after('destroy db', () => db.destroy());
    
    context(`Given 'noteful_notes' has data`, () => {
        beforeEach('insert folders and notes into tables', () => {
            return db
                .insert(testFolders)
                .into('noteful_folders')
                .then(() => {
                    return db
                        .insert(testNotes)
                        .into('noteful_notes')
                })
        });

        afterEach(`delete data in 'noteful_folders' table`, () => db('noteful_folders').delete());
        afterEach(`delete data in 'noteful_notes' table`, () => db('noteful_notes').delete());
        
        it(`getAllNotesInFolder() returns all notes from the 'noteful_notes' table`, () => {
            const folderId = 2
            const expectedNotes = testNotes.filter(note => note.folder_id === folderId)
            return NotesService.getAllNotesInFolder(db, folderId)
                .then(actual => {
                    expect(actual).to.eql(expectedNotes);
                });
        });

        it(`getById() returns the specified note`, () => {
            const idToGet = 2;
            const expectedNote = testNotes[idToGet - 1];
            return NotesService.getById(db, idToGet)
                .then(actual => {
                    expect(actual).to.eql(expectedNote)
                });
        });

        it(`deleteNote() delete the specified note from the 'noteful_notes' table`, () => {
            const idToDelete = 2;
            const noteToDelete = testNotes.find(note => note.id === idToDelete)
            return NotesService.deleteNote(db, idToDelete)
                .then(() => NotesService.getAllNotesInFolder(db, noteToDelete.folder_id))
                .then(allNotes => {
                    const expected = testNotes.filter(note => note.id !== idToDelete && note.folder_id === noteToDelete.folder_id);
                    expect(allNotes).to.eql(expected);
                });
        });

        it(`updateNote() updates the specified note from the 'noteful_notes' table`, () => {
            const idToUpdate = 2;
            const newNoteData = {
                note_name: 'Updated Note Name',
                note_content: 'Updated content',
                date_modified: new Date(),
                folder_id: 1
            };
            return NotesService.updateNote(db, idToUpdate, newNoteData)
                .then(() => NotesService.getById(db, idToUpdate))
                .then((updatedNote) => {
                    expect(updatedNote).to.eql({
                        id: idToUpdate,
                        ...newNoteData
                    });
                });
        });
    });

    context(`Given 'noteful_notes' is empty`, () => {
        beforeEach(`insert folders`, () => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        });
        
        afterEach(`delete data in 'noteful_folders' table`, () => db('noteful_folders').delete());

        it(`getAllNotes() returns an empty array`, () => {
            const folderId = 2
            return NotesService.getAllNotesInFolder(db, folderId)
                .then(actual => {
                    expect(actual).to.eql([]);
                });
        });

        it(`addNote() inserts a new note to the 'noteful_notes' table and returns the note`, () => {
            const newNote = {
                id: 1,
                note_name: 'New Note',
                note_content: 'New content',
                folder_id: 3,
                date_modified: new Date()
            };
            return NotesService.addNote(db, newNote)
                .then(actual => {
                    expect(actual).to.eql(newNote)
                })
        });
    });
});