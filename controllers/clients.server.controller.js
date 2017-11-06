// Client management controller
// Displays a list of all the clients and allows doing various tasks for each one
let express = require('express');   //Express
let fs = require('fs');             //Node.js file I/O
let path = require('path')          //Node.js file & directory

let Client = require('../models/addClient.server.model.js');    //import client schema

exports.mngClients = function (req, res) {
    res.render('clients', { title: 'Manage Clients'});
}