"use strict";
const nodemailer = require('nodemailer');
const constants = require('./constants.js');

module.exports = {
    sendEmail: (mailOptions) => {
     const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err)
        } else {
          console.log(info);  
        }
     });
    },
    calculateTotals: (reservations) => {
      return new Promise((resolve, reject) => {
        let results = {};
        results.services = 0;
        results.totalMoney = 0;
        results.totalCash = 0;
        results.totalTransfer = 0;
        for (let reservation of reservations) {
          if (reservation.status != constants.RESERVATION_STATUS_CANCELLED &&
          reservation.type != constants.RESERVATION_TYPE_SHELTER) {
            reservation.ppd = (reservation.priceTotal && reservation.period) ?
              Math.round(reservation.priceTotal / reservation.period * 100) / 100 : null;
            results.services = (reservation.period) ? results.services + parseInt(reservation.period) : results.services;
            results.totalMoney = (reservation.priceTotal) ?
              results.totalMoney + reservation.priceTotal : results.totalMoney;
            results.totalCash = (reservation.priceTotal && reservation.paymentType && reservation.paymentType ==
              constants.PAYMENT_TYPE_CASH) ?
              results.totalCash + reservation.priceTotal : results.totalCash;
            results.totalTransfer = (reservation.priceTotal && reservation.paymentType && reservation.paymentType ==
              constants.PAYMENT_TYPE_TRANSFER) ?
              results.totalTransfer + reservation.priceTotal : results.totalTransfer;
          }
        }
        results.pps = results.totalMoney / results.services;
        results.taxesCash = Math.round((results.totalCash * 21 / 100) * 100) / 100 ;
        results.taxesTransfer = Math.round((results.totalTransfer * 21 / 100) * 100) / 100 ;
        resolve(results);
      });
    },
    calculateTotalsCB: (reservations, cb) => {
      let results = {};
      results.services = 0;
      results.totalMoney = 0;
      results.totalCash = 0;
      results.totalTransfer = 0;
      for (let reservation of reservations) {
        if (reservation.status != constants.RESERVATION_STATUS_CANCELLED &&
        reservation.type != constants.RESERVATION_TYPE_SHELTER) {
          reservation.ppd = (reservation.priceTotal && reservation.period) ?
            Math.round(reservation.priceTotal / reservation.period * 100) / 100 : null;
          results.services = (reservation.period) ? results.services + parseInt(reservation.period) : results.services;
          results.totalMoney = (reservation.priceTotal) ?
            results.totalMoney + reservation.priceTotal : results.totalMoney;
          results.totalCash = (reservation.priceTotal && reservation.paymentType && reservation.paymentType ==
            constants.PAYMENT_TYPE_CASH) ?
            results.totalCash + reservation.priceTotal : results.totalCash;
          results.totalTransfer = (reservation.priceTotal && reservation.paymentType && reservation.paymentType ==
            constants.PAYMENT_TYPE_TRANSFER) ?
            results.totalTransfer + reservation.priceTotal : results.totalTransfer;
        }
      }
      results.pps = (results.totalMoney / results.services).toFixed(2);
      results.taxesCash = Math.round((results.totalCash * 21 / 100) * 100) / 100 ;
      results.taxesTransfer = Math.round((results.totalTransfer * 21 / 100) * 100) / 100 ;
      cb(null, results);
    },
};

