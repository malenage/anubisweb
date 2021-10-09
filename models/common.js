"use strict";
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID = require('mongodb').ObjectID;
const date = new Date().toISOString();
const constants = require('../routes/constants.js');
let db;

module.exports = {
    mongoConnect: () => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err){
                    console.error('mongoConnect:', err);
                    reject(err);
                } else {
                    db = client.db("anubis");
                    resolve(db);
                }   
            })  
        });
    },
    returnDbConnection: (db) => {
      return new Promise ((resolve, reject) => {
        if (db) {
            resolve(db);
          } else {
            module.exports.mongoConnect()
              .then((db) => {
                resolve(db);
              });
          }
      });
    },
    recordLogins: (user, req) => {
        const collection = db.collection('logins');
        let ipAddress;
        // Amazon EC2 / Heroku workaround to get real client IP
        const forwardedIpsStr = req.header('x-forwarded-for'); 
        if (forwardedIpsStr) {
            const forwardedIps = forwardedIpsStr.split(',');
            ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
            // Ensure getting client IP address still works in
            // development environment
            ipAddress = req.connection.remoteAddress;
        }
        const newlongin = {name: user.name, userId: user.id, ip: ipAddress, date: date};
        collection.insertOne(newlongin, (err, result) => {
            if (err) {
                console.error (err)
            }
        });
    },

    getByQuery: (collection, query, callback) => {
      module.exports.returnDbConnection(db)
        .then((db) => {
          db.collection(collection).find(query).toArray((err, result) => {
            if (err) {
              return callback(err);
            } else {
              return callback(null, result);
            }
          });
        }).catch(() => {
          callback('error returnDb Connection');
        }); 
    },

    findByEmail: (email, callback) => {
      if (!db) {
        module.exports.mongoConnect()
        .then((dbConnection) => {
          dbConnection.collection('users').findOne({email: email}, (err, result) => {
            if (err){
              console.error(err);
              reject(err);
            } else {
              return callback(null, result);
            }
          });
          }).catch((err) => {
            callback(err);
          });
      } else {
        db.collection('users').findOne({email: email}, (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            return callback(null, result);
          }
        });
      }
    },

    getByUserId: (userId, callback) => {
        db.collection('users').findOne({_id: ObjectID(userId)}, (err, result) => {
            if (err){
                console.error(err);
                reject(err);
            } else {
                return callback(null, result);
            }
        });
    },

    getByType: (type, propertiesObj, callback) => {
        if (db) {
            var collection = db.collection(type);    
            collection.find({}).project(propertiesObj).toArray((err, result) => {
                if (err) {   
                console.error(err);
                }
                return callback(null, result);
            });
        } else {
           return callback('Database connection lost'); 
        }                  
    },

    getCustomers: (callback) => {
        if (db) {   
            db.collection('users').aggregate([
                { $match:{role: 2}},
                { $lookup:
                    {
                      from: 'dogs',
                      localField: 'dogs',
                      foreignField: '_id',
                      as: 'dogsArray'
                    }
                }
            ]).toArray(function(err, result) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, result);
                }
            });
        } else {
           return callback('Database connection lost'); 
        }                  
    },

    getDogs: (callback) => {
        if (db) {   
            db.collection('dogs').aggregate([
                { $lookup:
                    {
                      from: 'users',
                      localField: 'owner',
                      foreignField: '_id',
                      as: 'owner'
                    }
                }
            ]).toArray(function(err, result) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, result);
                }
            });
        } else {
           return callback('Database connection lost'); 
        }                  
    },

    getDogsByUserId: (userId, callback) => {
      module.exports.returnDbConnection(db)
        .then((db) => {
          db.collection('users').aggregate([
            { $match:{_id: ObjectID(userId)}},
            { $lookup:
               {
                 from: 'dogs',
                 localField: '_id',
                 foreignField: 'owner',
                 as: 'dogsArray'
               }
             },
            //  { $lookup:
            //     {
            //       from: 'reservations',
            //       localField: '_id',
            //       foreignField: 'owner',
            //       as: 'reservationsArray'
            //     }
            //   }
            ]).toArray((err, result) => {
              if (err) {
                return callback(err);
              } else if (result && result.length > 0){
                return callback(null, result[0]);
              } else {
                return callback(null, result);
              }
          });
        }).catch(() => {
          callback('error returnDb Connection');
        });
    },

    getDogById: (dogId, callback) => {
      if (db) {
        db.collection('dogs').aggregate([
            { $match:{_id: ObjectID(dogId)}},
             { $lookup:
                {
                  from: 'reservations',
                  localField: '_id',
                  foreignField: 'dogId',
                  as: 'reservationsArray'
                }
              }
            ]).toArray(function(err, result) {
            if (err) {
                return callback(err);
            } else if (result && result.length > 0){
                return callback(null, result[0]);
            } else {
                return callback(null, {});
            }
          });
      } else {
        return callback('Database connection lost'); 
      }  
    },

    getRates: (area, type, callback) => {
      db.collection('rates').findOne({area: area, type: type}, (err, rate) => {
        if (err) {
          callback(err);
        } else {
          callback(null, rate);
        }
      });
    },

    getReservationsByDate: (start, end, callback) => {
      const propertiesObj = {
        _id: 1,
        owner: 1,
        dogId: 1,
        init: 1,
        end: 1,
        type: 1,
        dogName: 1,
        status: 1,
        priceDay: 1,
      }
      db.collection('reservations').find({init: {$lte: end}, end: {$gte: start},
        status: {$ne: constants.RESERVATION_STATUS_CANCELLED}}).project(propertiesObj).toArray((err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result);
        }
      });
    },

    getReservations: (query, callback) => {
      const dbase = 
      module.exports.returnDbConnection(db)
        .then(dbase => {
          if (dbase) {
            dbase.collection('reservations').find(query).sort({init: 1}).toArray((err, result) => {
              if (err) {
                callback(err);
              } else {
                callback(null, result);
              }
            });
          } else {
            callback('Database connection lost');
          }  
        }).catch(() => {
            callback('error returnDb Connection');
        });
    },

    getReservationsById: (reservationId, callback) => {
        db.collection('reservations').findOne({_id: ObjectID(reservationId)}, (err, result) => {
            if (err){
              console.error(err);
              reject(err);
            } else {
              return callback(null, result);
            }
        });
    },

    updateByEmail: (email, updateVal, callback) => {
        db.collection('users').updateOne({email: email}, {$set: updateVal}, (err, result) => {
            if (err){
                console.log ("error :" + err);
                callback(err);
            } else {
                callback();
            }   
        });
    },

    updateById: (id, collection, updateVal, callback) => {
        db.collection(collection).updateOne({_id: id}, {$set: updateVal}, (err, result) => {
            if (err){
                console.log ("error :" + err);
                callback(err);
            } else {
                callback();
            }   
        });
    },

    insertNew: (collection, insertObj, callback) => {
        if (db && insertObj) {
          db.collection(collection).insertOne(insertObj, (err, result) => {
            if (err){
              console.error("insertNew: " + err);
              return callback(err);
            } else {
              callback(null, result.ops[0]);
            } 
          });
        } else {
          callback('insertNew: insert object is empty');
        }     
    },
};