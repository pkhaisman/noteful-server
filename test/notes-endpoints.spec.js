const app = require('../src/app');
const knex = require('knex');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');

describe(`Notes routes`, () => {
    let db;
    let testFolders = makeFoldersArray();
    let testNotes = makeNotesArray();

    before('set up db connection', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });

    after('destroy the db', () => db.destroy());

    describe(`GET /api/folders/:folder_id/notes`, () => {
        context(`Given 'noteful_notes' has data`, () => {
            beforeEach(() => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
                        .then(() => {
                            return db
                                .insert(testNotes)
                                .into('noteful_notes')
                        })
            });
    
            afterEach(() => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 200 and all notes within the given folder`, function() {
                this.retries(5)
                // i was trying to make this work with more than one note in a folder but i couldnt make it work? is that overkill? Is it enough to test for one?
                const folderId = 2;
                const expectedNote = testNotes.find(note => note.folder_id === folderId)
                return supertest(app)
                    .get(`/api/folders/${folderId}/notes`)
                    .expect(200)
                    .expect(res => {
                        // this tests the first object in the array
                        const expectedDate = new Date().toLocaleString()
                        const actualDate = new Date(res.body[0].date_modified).toLocaleString()
                        expect(res.body[0].note_name).to.eql(expectedNote.note_name)
                        expect(res.body[0].note_content).to.eql(expectedNote.note_content)
                        expect(res.body[0].folder_id).to.eql(expectedNote.folder_id)
                        expect(res.body[0]).to.have.property('id')
                        expect(actualDate).to.eql(expectedDate)
                        // this makes sure there is the expected number of notes. is this test good enough?
                        expect(res.body.length).to.eql(2)
                    })
            });
        });

        context(`Given 'noteful_notes' has no data`, () => {
            it(`responds with 200 and an empty array`, () => {
                const folderId = 2
                return supertest(app)
                    .get(`/api/folders/${folderId}/notes`)
                    .expect(200, [])
            })
        });
    });

    describe(`GET /api/folders/:folder_id/notes/:note_id`, () => {
        context(`Given 'noteful_notes' has data`, () => {
            beforeEach(() => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
                        .then(() => {
                            return db
                                .insert(testNotes)
                                .into('noteful_notes')
                        })
            });
    
            afterEach(() => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 200 and the specified note`, function() {
                this.retries(5)
                const folderId = 2;
                const noteId = 2;
                const expectedNote = testNotes.find(note => note.id === noteId)

                return supertest(app)
                    .get(`/api/folders/${folderId}/notes/${noteId}`)
                    .expect(200)
                    .expect(res => {
                        const expectedDate = new Date().toLocaleString()
                        const actualDate = new Date(res.body.date_modified).toLocaleString()
                        expect(res.body.note_name).to.eql(expectedNote.note_name)
                        expect(res.body.note_content).to.eql(expectedNote.note_content)
                        expect(res.body.folder_id).to.eql(expectedNote.folder_id)
                        expect(res.body).to.have.property('id')
                        expect(actualDate).to.eql(expectedDate)
                    })
            });
        });

        context(`Given 'noteful_notes' has no data`, () => {
            it(`responds with 404`, () => {
                const folderId = 2;
                const noteId = 2;
                return supertest(app)
                    .get(`/api/folders/${folderId}/notes/${noteId}`)
                    .expect(404, {
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
            })
        });
    });

    describe(`POST /api/folders/:folder_id/notes`, () => {
        beforeEach('insert folders', () => {
            return db
                .insert(testFolders)
                .into('noteful_folders')
        });

        afterEach('clean tables', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

        it(`responds with 201 and the created note`, function() {
            this.retries(5)
            const newNote = makeNotesArray()[0];
            return supertest(app)
                .post(`/api/folders/${newNote.folder_id}/notes`)
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.note_name).to.eql(newNote.note_name)
                    expect(res.body.note_content).to.eql(newNote.note_content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                    const expectedDate = new Date().toLocaleString()
                    const actualDate = new Date(res.body.date_modified).toLocaleString()
                    expect(actualDate).to.eql(expectedDate)
                })
                .then(postRes => {
                    return supertest(app)
                        .get(`/api/folders/${postRes.body.folder_id}/notes/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        });

        const requiredFields = ['note_name', 'note_content', 'folder_id']

        // validate required fields
        requiredFields.forEach(field => {
            const newNote = {
                note_name: 'Testing Missing Field',
                note_content: 'Lorem ipsum',
                folder_id: 1
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newNote[field]

                return supertest(app)
                    .post(`/api/folders/${newNote.folder_id}/notes`)
                    .send(newNote)
                    .expect(400, {
                        error: {
                            message: `Missing '${field}' in request body`
                        }
                    })
            });
        });

    });

    describe(`DELETE /api/folders/:folder_id/notes/note_id`, () => {
        context(`Given 'noteful_notes' has data`, () => {
            beforeEach('insert data into tables', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
                    .then(() => {
                        return db
                            .insert(testNotes)
                            .into('noteful_notes')
                    })
            })

            afterEach('clear data from tables', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 204 and removes the specified note`, function() {
                this.retries(5)
                const idOfNoteToDelete = 2
                const noteToBeDeleted = testNotes.find(note => note.id === idOfNoteToDelete)
                const notesInFolderBefore = testNotes.filter(note => note.folder_id === noteToBeDeleted.folder_id)
                const notesInFolderAfter = notesInFolderBefore.find(note => note.id !== idOfNoteToDelete)
                return supertest(app)
                    .delete(`/api/folders/${noteToBeDeleted.folder_id}/notes/${idOfNoteToDelete}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/folders/${noteToBeDeleted.folder_id}/notes`)
                            .expect(() => {
                                expect(notesInFolderAfter.note_name).to.eql(notesInFolderAfter.note_name)
                                expect(notesInFolderAfter.note_content).to.eql(notesInFolderAfter.note_content)
                                expect(notesInFolderAfter.folder_id).to.eql(notesInFolderAfter.folder_id)
                                expect(notesInFolderAfter).to.have.property('id')
                                const expectedDate = new Date().toLocaleString()
                                const actualDate = new Date(notesInFolderAfter.date_modified).toLocaleString()
                                expect(actualDate).to.eql(expectedDate)
                            })
                    })
            });
        });

        context(`Given 'noteful_notes' has no data`, () => {
            it(`responds with 404`, () => {
                const idToDelete = 1234
                return supertest(app)
                    .delete(`/api/folders/1/notes/${idToDelete}`)
                    .expect(404, {
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
            });
        });
    });

    describe(`PATCH /api/folders/:folder_id/notes/note_id`, () => {
        context(`Given 'noteful_notes' has data`, () => {
            beforeEach('insert folders and note', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    });
            });

            afterEach('clear data from tables', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 204 and updates the note`, function() {
                this.retries(5)
                const idToUpdate = 2;
                const unchangedNote = testNotes[idToUpdate - 1]
                const updatedNote = {
                    note_name: 'Updated name',
                    note_content: 'Updated content',
                    folder_id: 3
                }
                const expectedNote = {
                    ...unchangedNote,
                    ...updatedNote
                }
                return supertest(app)
                    .patch(`/api/folders/${unchangedNote.folder_id}/notes/${idToUpdate}`)
                    .send(updatedNote)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${updatedNote.folder_id}/notes/${idToUpdate}`)
                            .expect(res => {
                                expect(res.body.note_name).to.eql(expectedNote.note_name)
                                expect(res.body.note_content).to.eql(expectedNote.note_content)
                                expect(res.body.folder_id).to.eql(expectedNote.folder_id)
                                expect(res.body).to.have.property('id')
                                const expected = new Date().toLocaleString()
                                const actual = new Date(res.body.date_modified).toLocaleString()
                                expect(actual).to.eql(expected)
                            })    
                    )
            });

            it(`responds with 400 when there are no required fields`, () => {
                const idToUpdate = 2;
                const noteToUpdate = testNotes.find(note => note.id === idToUpdate);
                return supertest(app)
                    .patch(`/api/folders/${noteToUpdate.folder_id}/notes/${idToUpdate}`)
                    .send({ foo: 'Invalid field' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'note_name', 'note_content', or 'folder_id'`
                        }
                    })
            });

            it(`responds with 204 and updated not when updating only a subset of fields`, function() {
                this.retries(5)
                const idToUpdate = 2;
                const updatedNote = {
                    note_name: 'Updated title'
                }
                const unchangedNote = testNotes.find(note => note.id === idToUpdate)
                // note that order is important here. second overrides the first
                const expectedNote = {
                    ...unchangedNote,
                    ...updatedNote
                }
                return supertest(app)
                    .patch(`/api/folders/${unchangedNote.folder_id}/notes/${idToUpdate}`)
                    .send({
                        ...updatedNote,
                        fieldToIgnore: 'should not be in response'
                    })
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/folders/${unchangedNote.folder_id}/notes/${idToUpdate}`)
                            .expect(res => {
                                expect(res.body.note_name).to.eql(expectedNote.note_name)
                                expect(res.body.note_content).to.eql(expectedNote.note_content)
                                expect(res.body.folder_id).to.eql(expectedNote.folder_id)
                                expect(res.body).to.have.property('id')
                                const expected = new Date().toLocaleString()
                                const actual = new Date(res.body.date_modified).toLocaleString()
                                expect(actual).to.eql(expected)
                            })
                    })
            });
        });
        
        context(`Given 'noteful_notes' has no data`, () => {
            it(`responds with 404 and error message`, () => {
                const idToPatch = 1234;
                return supertest(app)
                    .patch(`/api/folders/1/notes/${idToPatch}`)
                    .expect(404, {
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
            })
        });
    });
});