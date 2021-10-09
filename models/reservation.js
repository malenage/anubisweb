'use strict';
const ObjectID = require('mongodb').ObjectID;

module.exports = {
  propertiesObj: {
  },  
  reservationModel: (reservation) => {
    const res = {
      owner: (reservation.ownerId) ? ObjectID(reservation.ownerId) : null,
      dogId: (reservation.dogId) ? ObjectID(reservation.dogId) : null,
      dogName: (reservation.dogName) ? reservation.dogName : null,
      init: (reservation.init) ? new Date(reservation.init) : null,
      end: (reservation.end) ? new Date(reservation.end) : null,
      pickup: (reservation.pickup && reservation.pickup == 'true') ? true : false,
      pricePickup: (reservation.pricePickup) ? parseInt(reservation.pricePickup) : 0,
      delivery: (reservation.delivery && reservation.delivery == 'true') ? true : false,
      priceDelivery: (reservation.priceDelivery) ? parseInt(reservation.priceDelivery) : 0,
      type: (reservation.type) ? parseInt(reservation.type) : null,
      area: (reservation.area) ? parseInt(reservation.area) : null,
      notes: (reservation.notes) ? reservation.notes : null,
      dogNotes: (reservation.dogNotes) ? reservation.dogNotes : null,
      period: (reservation.period) ? reservation.period : 1,
      priceDay: (reservation.priceDay) ? reservation.priceDay : 0,
      priceDays: (reservation.priceDays) ? reservation.priceDays : 0,
      priceTotal: (reservation.priceTotal) ? parseInt(reservation.priceTotal) : 0,
      status: (reservation.status) ? parseInt(reservation.status) : 0,
      payed: (reservation.payed) ? true : false,
      paymentType: (reservation.paymentType) ? parseInt(reservation.paymentType) : null, 
    }; 
    return res;
  }
}