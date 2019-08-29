function makeNotesArray() {
    return [
        {
            id: 1,
            date_modified: new Date(),
            note_name: 'Dogs',
            folder_id: 1,
            note_content: 'Lorem ipsum dog rule cats drool'
        },
        {
            id: 2,
            date_modified: new Date(),
            note_name: 'Cats',
            folder_id: 2,
            note_content: 'Lorem ipsum cats rule dogs drool'
        },
        {
            id: 3,
            date_modified: new Date(),
            note_name: 'Pigs',
            folder_id: 2,
            note_content: 'Lorem ipsum bacon'
        },
    ]
}

module.exports = {
    makeNotesArray
}