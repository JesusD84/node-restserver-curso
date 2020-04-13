const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const { verificaToken } = require('../middlewares/autenticacion');
const { verificaAdminRole } = require('../middlewares/autenticacion');
const app = express();

app.get('/usuario', verificaToken, function (req, res) {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Usuario.find({ estado: true }, 'nombre email role estado google img')
           .skip(desde)
           .limit(limite)
           .exec((err, usuarios) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                Usuario.count({ estado: true }, (err, conteo) => {
                    res.json({
                        ok: true,
                        conteo,
                        usuarios
                    });
                });
                
           });
});

app.post('/usuario', [verificaToken, verificaAdminRole], function (req, res) {
    let body = req.body;
    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    usuario.save((err, usuarioDB) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // usuarioDB.password = null;

        res.json({
            ok: true,
            usuario: usuarioDB
        });
    });
    
});

app.put('/usuario/:id', [verificaToken, verificaAdminRole], function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre','email','img','role','estado']);
    //_.pick es paracido
    //Opcion para filtrar los parametros no deseados de mi body
    //delete body.password;
    //delete body.google;              //Para que las validaciones no choquen
    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        
        res.json({
            ok: true,
            usuario: usuarioDB
        });
    });
});

app.delete('/usuario/:id', [verificaToken, verificaAdminRole], function (req, res) {
    let id = req.params.id;
    let cambiaEstado = {
        estado: false
    };
    //Borrando solo cambiando el estado a false
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if(usuarioBorrado === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        });

    /*
    BORRAR REGISTRO FISICAMENTE DEL DB
    Usuario.findByIdAndRemove(id,(err, usuarioBorrado) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if(usuarioBorrado === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        })
        */
    });
    


});

module.exports = app;