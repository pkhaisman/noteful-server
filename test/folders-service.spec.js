const FoldersService = require('../src/folders/folders-service');
const { makeFoldersArray } = require('./folders.fixtures')
const knex = require('knex');

describe('Folders service object', () => {
    let db;
    let testFolders = makeFoldersArray();
    
    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    });
    
    after(() => db.destroy());
    
    context(`Given 'noteful_folders' has data`, () => {
        beforeEach(() => {
            console.log('beforeEach')
            return db
                .insert(testFolders)
                .into('noteful_folders')
        });

        afterEach(() => db.raw('TRUNCATE TABLE noteful_folders, noteful_notes CASCADE'));
        
        it(`getAllFolders() returns all folders from the 'noteful_folders' table`, () => {
            return FoldersService.getAllFolders(db)
                .then(actual => {
                    console.log('folders', actual)
                    expect(actual).to.eql(testFolders);
                });
        });

        it(`getById() returns the specified folder`, () => {
            const idToGet = 2;
            const expectedFolder = testFolders[idToGet - 1];
            return FoldersService.getById(db, idToGet)
                .then(actual => {
                    expect(actual).to.eql(expectedFolder)
                });
        });

        it(`deleteFolder() delete the specified folder from the 'noteful_folders' table`, () => {
            const idToDelete = 2;
            return FoldersService.deleteFolder(db, idToDelete)
                .then(() => FoldersService.getAllFolders(db))
                .then(allFolders => {
                    const expected = testFolders.filter(folder => folder.id !== idToDelete);
                    expect(allFolders).to.eql(expected);
                });
        });

        it(`updateFolder() updates the specified folder from the 'noteful_foldrs' table`, () => {
            const idToUpdate = 2;
            const newFolderData = {
                folder_name: 'Updated Folder Name'
            };
            return FoldersService.updateFolder(db, idToUpdate, newFolderData)
                .then(() => FoldersService.getById(db, idToUpdate))
                .then((updatedFolder) => {
                    expect(updatedFolder).to.eql({
                        id: idToUpdate,
                        ...newFolderData
                    });
                });
        });
    });

    context(`Given 'noteful_folders' is empty`, () => {
        it(`getAllFolders() returns an empty array`, () => {
            return FoldersService.getAllFolders(db)
                .then(actual => {
                    expect(actual).to.eql([]);
                });
        });

        it.skip(`addFolder() inserts a new folder to the 'noteful_folders' table and returns the folder`, () => {
            const newFolder = {
                folder_name: 'New Folder Name'
            };

            // before(() => {
            //     db.raw('DBCC CHECKIDENT(noteful_folders, RESEED, 0)')
            // })

            return FoldersService.addFolder(db, newFolder)
                .then(actual => {
                    console.log(actual)
                    expect(actual).to.eql({
                        // Manish how do i reset the id in the db to 1?
                        id: 1,
                        folder_name: 'New Folder Name'
                    })
                })
        });
    });
});