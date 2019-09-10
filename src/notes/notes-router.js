const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
    id: note.id,
    note_name: xss(note.note_name),
    note_content: xss(note.note_content),
    date_modified: note.date_modified,
    folder_id: note.folder_id,
});

notesRouter
    .route(`/`)
    .get((req, res, next) => {
        const knex = req.app.get('db');
        NotesService.getAllNotes(knex)
            .then(notes => {
                res.json(notes)
            })
            .catch(next)
    });

notesRouter
    .route('/:folder_id/notes')
    .get((req, res, next) => {
        const knex = req.app.get('db');
        NotesService.getAllNotesInFolder(knex, req.params.folder_id)
            .then(notes => {
                res.json(notes)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knex = req.app.get('db')
        const { note_name, note_content, folder_id } = req.body
        const newNote = { note_name, note_content, folder_id }

        for (const [key, value] of Object.entries(newNote))
            if (value == null)
                return res.status(400).json({
                    error: { 
                        message: `Missing '${key}' in request body` 
                    }
            })

        NotesService.addNote(knex, newNote)
            .then(note => {
                res
                    .status(201)
                    .json(note)
            })
            .catch(next)
    })

notesRouter
    .route('/:folder_id/notes/:note_id')
    .get((req, res, next) => {
        const knex = req.app.get('db')
        NotesService.getById(knex, req.params.note_id, req.params.folder_id)
            .then(note => {
                const paramInt = parseInt(req.params.folder_id)
                if (!note) {
                    return res.status(404).json({
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
                } else if (note.folder_id !== paramInt) {
                    return res.status(404).json({
                        error: {
                            message: `Note cannot be found in specified folder`
                        }
                    })
                } 
                res.json(serializeNote(note))
            })
                .catch(next)
    })
    .delete((req, res, next) => {
        const knex = req.app.get('db')
        NotesService.getById(knex, req.params.note_id, req.params.folder_id)
            .then(note => {
                const paramInt = parseInt(req.params.folder_id)
                if (!note) {
                    return res.status(404).json({
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
                } else if (note.folder_id !== paramInt) {
                    return res.status(404).json({
                        error: {
                            message: `Note cannot be found in specified folder`
                        }
                    })
                }
            })
            .catch(() => console.log('catch ran'))

        NotesService.deleteNote(knex, req.params.note_id)
            .then(() => {
                console.log('delete note then block')
                res.status(204).end()
            })
            .catch(() => console.log('delete notes service error'))
    })
    .patch(jsonParser, (req, res, next) => {
        const knex = req.app.get('db')
        const { note_name, note_content, folder_id } = req.body
        const noteToUpdate = { note_name, note_content, folder_id }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'note_name', 'note_content', or 'folder_id'`
                }
            })
        
        NotesService.getById(knex, req.params.note_id, req.params.folder_id)
            .then(note => {
                const paramInt = parseInt(req.params.folder_id)
                if (!note) {
                    return res.status(404).json({
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
                } else if (note.folder_id !== paramInt) {
                    return res.status(404).json({
                        error: {
                            message: `Note cannot be found in specified folder`
                        }
                    })
                } 
                res.note = note
                // next()
            })
            .catch(next)

        NotesService.updateNote(knex, req.params.note_id, noteToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter;