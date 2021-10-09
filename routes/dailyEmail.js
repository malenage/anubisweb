'use strict';
const common = require('./common.js');
const moment = require('moment');
const mongoCommon = require('../models/common.js');
const constants = require('./constants.js');

module.exports = {
  runDailyCron: () => {
    const today = moment().startOf("day");
    // const tomorrow = new Date(today.getTime() + (18 * 60 * 60 * 1000)); 
    const tomorrow = moment(today).add(1, 'days');
    const days3 = moment(tomorrow).add(3, 'days');
    console.log(today.toDate());
    console.log(tomorrow.toDate());
    mongoCommon.getReservations({status: {$ne: constants.RESERVATION_STATUS_CANCELLED}, $or: [{init: {$gte: today.toDate(), $lte: tomorrow.toDate()}},
      {end: {$gte: today, $lte: tomorrow}}]}, (err, events) => {
        if (err) {
        console.log(err);
        } else {
          let eventsList = '<p>Today </p> <ol>';
          if (events.length == 0 ) {
            eventsList += '<li> Nothing </li><ol>'
          } else {
            events.forEach((event) => {
              eventsList += '<li>';
              eventsList += '<p> Dog: ' + event.dogName + '</p>';
              eventsList += '<p> From: ' + moment(event.init).format('MMMM Do, h:mm a') +
              ' To:' + moment(event.end).format('MMMM Do, h:mm a')+ '</p>';
              eventsList += '<p> Pickup: ' + event.pickup + ', Delivery ' + event.delivery + '</p>';
              eventsList += '<p> Total Pirce: ' + event.priceTotal + ', payed ' + event.payed + '</p>';
              eventsList += '<p> Notes: ' + event.notes  + '</p>';
              eventsList += '</li>';
            });
            eventsList += '</ol>';
            eventsList += '<p> Upcoming events </p>'
            mongoCommon.getReservations({$or: [{init: {$gte: tomorrow.toDate(), $lte: days3.toDate()}},
              {end: {$gte: tomorrow.toDate(), $lte: days3.toDate()}}]}, (err, futureEvents) => {
                if (err) {
                console.log(err);
                } else {
                  eventsList += '<ol>';
                  futureEvents.forEach((event) => {
                    eventsList += '<li>';
                    eventsList += '<p> Dog: ' + event.dogName + '</p>';
                    eventsList += '<p> From: ' + moment(event.init).format('MMMM Do, h:mm a') +
                    ' To:' + moment(event.end).format('MMMM Do, h:mm a')+ '</p>';
                    eventsList += '<p> Pickup: ' + event.pickup + ', Delivery ' + event.delivery + '</p>';
                    eventsList += '<p> Total Pirce: ' + event.priceTotal + ', payed ' + event.payed + '</p>';
                    eventsList += '<p> Notes: ' + event.notes  + '</p>';
                    eventsList += '</li>';
                  });
                  eventsList += '</ol>';
                  const mailOptions = {
                    from: process.env.EMAIL_FROM, // sender address
                    to: process.env.EMAILS_UPDATES, // list of receivers
                    subject: 'Anubis - ' + moment(today).format('MMMM Do'),
                    html: eventsList,
                    };
                    common.sendEmail(mailOptions);
                }
              });
          }
        }  
    });
  }
};
