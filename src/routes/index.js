const express = require('express');
const loginRouter = require('./login');
const homeRouter = require('./home');

function route(app) {
  app.use('/', loginRouter);
  app.use('/', homeRouter);

}

module.exports = route;
