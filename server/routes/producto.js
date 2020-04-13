const express = require('express');

let {verificaToken} = require('../middlewares/autenticacion');

let app = express();

let Producto = require('../models/producto');

//Mostrar todos los prodcutos
app.get('/productos', (req, res) => {
    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Producto.find({ disponible: true }, 'nombre precioUni descripcion disponible categoria usuario')
            .skip(desde)
            .limit(limite)
            .sort('nombre')
            .populate('usuario', 'nombre email')
            .populate('categoria', 'descripcion')
            .exec((err, productos) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                Producto.count({ disponible: true }, (err, conteo) => {
                    res.json({
                        ok: true,
                        conteo,
                        productos
                    });
                });
            });
});

//Mostrar producto por ID
app.get('/productos/:id', (req, res) => {
    let id = req.params.id;
    Producto.findById(id)
            .populate('usuario', 'nombre email')
            .populate('categoria', 'descripcion')
            .exec((err, productoDB) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                if(!productoDB) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'El producto no existe'
                        }
                    });
                }
                if(!productoDB.disponible) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'El producto no esta disponible'
                        }
                    });
                }
                res.json({
                    ok: true,
                    producto: productoDB
                });
            });
});

//Buscar productos
app.get('/productos/buscar/:termino', (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    Producto.find({ nombre: regex})
            .populate('categoria', 'descripcion')
            .exec((err, productos) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                res.json({
                    ok: true,
                    productos
                });
            })
});


//Crear prodcuto
app.post('/productos', verificaToken ,(req, res) => {
    let body = req.body;
    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        usuario: req.usuario._id,
        categoria: body.categoria
    });

    producto.save((err, productoDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if(!productoDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            producto: productoDB
        });
    });
    //Grabar el usuario
    //Grabar una categoria del listado
});

//Actualizar prodcuto
app.put('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;

    Producto.findById(id, (err, productoDB) =>{
        if(err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if(!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto no existe'
                }
            });
        }
        productoDB.nombre = body.nombre;
        productoDB.precioUni = body.precioUni;
        productoDB.categoria = body.categoria;
        productoDB.disponible = body.disponible;
        productoDB.descripcion = body.descripcion;

        productoDB.save((err, productoGuardado) => {
            if(err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                producto: productoGuardado
            });
        });

    });
    //Grabar el usuario
    //Grabar una categoria del listado
});

//Borrar prodcuto
app.delete('/productos/:id',  verificaToken, (req, res) => {
    let id = req.params.id;
    let cambiaEstado = {
        disponible: false
    };
    Producto.findByIdAndUpdate(id, cambiaEstado, {new: true}, (err, productoBorrado) => {
        if(err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if(productoBorrado === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no encontrada'
                }
            });
        }

        res.json({
            ok: true,
            producto: productoBorrado
        });
    });
});

module.exports = app;