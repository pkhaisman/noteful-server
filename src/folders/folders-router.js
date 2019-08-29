const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
    id: folder.id,
    folder_name: xss(folder.folder_name)
});

foldersRouter
    .route('/')
    .get((req, res, next) => {
        // Manish. Is it a bad idea to define this in the global scope? I assume yes but why?
        const knex = req.app.get('db');
        FoldersService.getAllFolders(knex)
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knex = req.app.get('db');
        const { id, folder_name } = req.body;
        const newFolder = { id, folder_name }

        for (const [key, value] of Object.entries(newNote))
            if (value == null)
                return res.status(400).json({
                    error: { 
                        message: `Missing '${key}' in request body` 
                    }
            })
            
        FoldersService.addFolder(knex, newFolder)
            .then(folder => {
                res
                    .status(201)
                    .json(folder)
            })
            .catch(next)
    });

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        const knex= req.app.get('db');
        // Manish. I want to inspect the req.params object. How do I do that with the debugger? 
        FoldersService.getById(knex, req.params.folder_id)
            .then(folder => {
                if (!folder)
                    return res.status(404).json({
                        error: {
                            message: `Folder doesn't exist`
                        }
                    })
                res.folder = folder
                // what does this do?
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        const knex = req.app.get('db');
        FoldersService.deleteFolder(knex, req.params.folder_id)
            .then(() => {
                res
                    .status(204)
                    .end()
            })
    })
    .patch(jsonParser, (req, res, next) => {
        const knex = req.app.get('db');
        const { folder_name } = req.body;
        const folderToUpdate = { folder_name };

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'folder_name'`
                }
            })
        }

        FoldersService.updateFolder(knex, req.params.folder_id, folderToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    });

module.exports = foldersRouter;