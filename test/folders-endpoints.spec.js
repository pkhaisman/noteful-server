const app = require('../src/app');
const knex = require('knex');
const { makeFoldersArray } = require('./folders.fixtures');

describe(`Folders routes`, () => {
    let db;
    let testFolders = makeFoldersArray();

    before('connect to db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    });

    after('destroy db', () => db.destroy());

    describe(`GET /api/folders`, () => {
        context(`Given 'noteful_folders' has data`, () => {
            beforeEach('insert folders', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
            });
    
            afterEach('remove folders', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 200 and all folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            });
        });

        context(`Given 'noteful_folders' has no data`, () => {
            it(`responds with 200 and an empty array`, () => {
                return supertest(app)
                    .get(`/api/folders`)
                    .expect(200, [])
            });
        });
    });

    describe(`GET /api/folders/:folder_id`, () => {
        context(`Given 'noteful_folders' has data`, () => {
            beforeEach('insert folders', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
            });
    
            afterEach('remove folders', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 200 and the specified folder`, () => {
                const idToGet = 2;
                return supertest(app)
                    .get(`/api/folders/${idToGet}`)
                    .expect(200, testFolders[idToGet - 1])
            });
        });

        context(`Given 'noteful_folders' has no data`, () => {
            it(`responds with 404 and an error message`, () => {
                const folderId = 2;
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, {
                        error: {
                            message: `Folder doesn't exist`
                        }
                    })
            });
        });
    });

    describe(`POST /api/folders`, () => {
        afterEach('remove folders', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

        it(`responds with 201 and the created folder`, () => {
            const newFolder = makeFoldersArray()[0];
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.folder_name).to.eql(newFolder.folder_name)
                })
                .then(postRes => {
                    return supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        });

        const requiredFields = ['folder_name']

        requiredFields.forEach(field => {
            const newFolder = {
                id: 1,
                folder_name: 'Folder Name'
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newFolder[field]

                return supertest(app)
                    .post(`/api/folders`)
                    .send(newFolder)
                    .expect(400, {
                        error: {
                            message: `Missing '${field}' in request body`
                        }
                    })
            });
        })
    });

    describe(`DELETE /api/folders/:folder_id`, () => {
        context(`Given 'noteful_folders' has data`, () => {
            beforeEach('insert folders', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
            });
    
            afterEach('remove folders', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));
            
            it(`responds with 204 and removes the folder`, () => {
                const folderId = 2;
                const expectedFolders = testFolders.filter(folder => folder.id !== folderId)
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/folders`)
                            .expect(expectedFolders)
                    })
            });
        });
        
        context(`Given 'noteful_folders' has no data`, () => {
            it(`responds with 404 and an error message`, () => {
                const folderId = 2;
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, {
                        error: {
                            message: `Folder doesn't exist`
                        }
                    })

            });
        });
    });

    describe(`PATCH /api/folders/:folder_id`, () => {
        context(`Given 'noteful_folders' has data`, () => {
            beforeEach('insert folders', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
            });
    
            afterEach('remove folders', () => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));

            it(`responds with 204 and the updated folder`, () => {
                const idToUpdate = 2;
                const updatedFolder = {
                    folder_name: 'Updated Name'
                }
                const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updatedFolder
                }
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send(updatedFolder)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(200, expectedFolder)
                    })
            });

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2;
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({ fieldDoesNotExist: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain 'folder_name'`
                        }
                    })
            })
        });

        context(`Given 'noteful_folders' has no data`, () => {
            it(`responds with 404`, () => {
                const idToUpdate = 1234;
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .expect(404, { error: {
                        message: `Folder doesn't exist`
                    }})
            })
        });
    });
});