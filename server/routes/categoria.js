const express = require('express');

let {verificaToken} = require('../middlewares/autenticacion');
let {verificaAdminRole} = require('../middlewares/autenticacion');

let app = express();

let Categoria = require('../models/categoria');

//Mostrar todas las categorias
app.get('/categoria', (req, res) => {
    Categoria.find({ estado: true }, 'descripcion usuario estado')
             .sort('descripcion')
             .populate('usuario', 'nombre email')
             .exec((err, categorias) => {
                 if(err) {
                     return res.status(500).json({
                         ok: false,
                         err
                     });
                 }
                 Categoria.count({ estado: true}, (err, conteo) => {
                     res.json({
                         ok: true,
                         conteo,
                         categorias
                     });
                 });
             });
});

//Mostrar categoria por ID
app.get('/categoria/:id', (req, res) => {
    let id = req.params.id;
    Categoria.findById(id, (err, categoriaDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if(!categoriaDB || !categoriaDB.estado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'La categoria no existe'
                }
            });
        }
        res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

//Crear nueva categoria
app.post('/categoria', verificaToken, (req, res) => {
    let body = req.body;
    let categoria = new Categoria({
        descripcion: body.descripcion,
        usuario: req.usuario._id
    });

    categoria.save((err, categoriaDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if(!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

//Actualizar categoria
app.put('/categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;
    let descCategoria = {
        descripcion: body.descripcion
    }
    Categoria.findByIdAndUpdate(id, descCategoria, {new: true, runValidators: true} , (err, categoriaDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if(!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            categoria: categoriaDB
        });

    });
});

//Borrar categoria
app.delete('/categoria/:id', [verificaToken, verificaAdminRole], (req, res) => {
    let id = req.params.id;
    let cambiaEstado = {
        estado: false
    };
    Categoria.findByIdAndUpdate(id, cambiaEstado, {new: true}, (err, categoriaBorrada) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if(categoriaBorrada === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Categoria no encontrada'
                }
            });
        }

        res.json({
            ok: true,
            categoria: categoriaBorrada
        });
    });
    // Solo admin puede borrar categorias
    // Categoria.findByIdAndRemove();
});

module.exports = app;
