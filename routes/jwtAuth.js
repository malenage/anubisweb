'use strict';

const jwt = require('jsonwebtoken');
const mongoCommon = require('../models/common.js');

exports.createAccessToken = (user, cb) => {
  const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '8h'});
  // save accessToken in DB
  const newToken = {
    userId: user.id,
    token,
    createdAt: new Date(),
    expiresIn: '8h'
  }
  mongoCommon.insertNew('accessTokens', newToken, (err, result) => {
    if (err) {
      cb(err);
    } else {
      cb(null, token);
    }
  });
};

exports.verifyAccessToken = (req, res, next) => {
  if (req && req.cookies && req.cookies.id_token) {
    mongoCommon.getByQuery('accessTokens', {token: req.cookies.id_token}, (err, tokens) => {
      if (err) {
        next(err);
      } else if (!tokens || tokens.length == 0) {
        res.render('index', {
          errormessage: 'Invalid access token'
        });
      } else {
        jwt.verify(req.cookies.id_token, process.env.JWT_SECRET, (err, result) => {
          if (err) {
            res.render('index', {
              errormessage: err
            });
          } else {
            req.validationResult = result;
            next();
          } 
        });
      }
    });
  } else {
    res.render('index', {
      errormessage: 'No token cookie'
    });
    next('No token cookie');
  }
};

exports.verifyHeaderAccessToken = (req, res, next) => {
  const headerToken = (req.headers && req.headers.authorization) ? req.headers.authorization : null;
  mongoCommon.getByQuery('accessTokens', {token: headerToken}, (err, tokens) => {
    if (err) {
      res.json({ error: err });
      // next(err);
    } else if (!tokens || tokens.length == 0) {
      res.json({ error: 'Invalid access token' });
    } else {
      jwt.verify(headerToken, process.env.JWT_SECRET, (err, result) => {
        if (err) {
          res.json({ error: err });
        } else {
          req.validationResult = result;
          next();
        } 
      });
    }
  });
};