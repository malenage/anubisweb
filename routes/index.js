"use strict";
const express = require('express');
const router = express.Router();
const literals = require('./literals.json');
const common = require('./common.js');
const mongoCommon = require('../models/common.js');
const userModel = require('../models/user.js');
const dogModel = require('../models/dog.js');
const reservationModel = require('../models/reservation.js');
const emails = require('../emails/emails.js');
const jwt = require('./jwtAuth.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const moment = require('moment');
const async = require('async');
const google = require('googleapis');
const ObjectID = require('mongodb').ObjectID;
const constants = require('./constants.js');
let db, language, literalsLang;
const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
  api_key: process.env.CLOUDNARY_API_KEY, 
  api_secret: process.env.CLOUDNARY_API_SECRET
});

/* GET home page. */ 
router.get('/', (req, res) => {
  language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
  literalsLang = (language == 'es') ? literals.es : literals.en;
  res.render('index', { title: 'Anubis adiestramiento y productos caninos', lit: literalsLang});
});

/* Adiestramiento page */
router.get('/adiestramiento', (req, res) => {
  if (!literalsLang) {
    language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    literalsLang = (language == 'es') ? literals.es : literals.en;
  }
  res.render('adiestramiento', {title: "Adiestramiento | Anubis", lit: literalsLang});
});

router.get('/products', (req, res) => {
  if (!literalsLang) {
    language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    literalsLang = (language == 'es') ? literals.es : literals.en;
  }
  res.render('products', {title: "Productos Caninos | Anubis", lit: literalsLang});
});

router.get('/portfolio', (req, res) => {
  if (!literalsLang) {
    language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    literalsLang = (language == 'es') ? literals.es : literals.en;
  }
  res.render('portfolio', {title: "Portfolio | Anubis", lit: literalsLang});
});

router.get('/box', (req, res) => {
  if (!literalsLang) {
    language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    literalsLang = (language == 'es') ? literals.es : literals.en;
  }
  res.render('box', {title: "Fluf in the Box | Anubis", lit: literalsLang});
});

router.get('/allPurpose', (req, res) => {
  if (!literalsLang) {
    language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    literalsLang = (language == 'es') ? literals.es : literals.en;
  }
  res.render('allPurpose', {title: "Correa All Purpose | Anubis", lit: literalsLang});
});

router.get('/loginPage', (req, res) => {
  res.render('login', {title: "Login | Anubis", lit: literalsLang});
});

/* POST login */
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
    
  //Validate Fields
  req.check('email', 'Email cannot be empty').notEmpty();
  // req.check('password', 'Password cannot be empty').notEmpty();
  let errors = req.getValidationResult();
  errors.then((result) => {
    if (!result.isEmpty()) {
      res.render('index', {
        validationErrors : result.mapped(),
        title: 'Anubis', lit: literalsLang
      });
    } else {
      mongoCommon.mongoConnect()
        .then((dbConnection) => {
          db = dbConnection;
          const body = req.body;
          if ('login' in body) {
            logIn();
          } else {
            recoverEmail();
          }
          }).catch((err) => {
            res.render('index', {
              errormessage : err,
              title: 'Anubis', lit: literalsLang
            });
          });
    }
  });

  function logIn() {
    mongoCommon.findByEmail(email, (err, user) => {
      if (err) {
        res.render('index', {
          errormessage : err,
          title: 'Anubis', lit: literalsLang
        });
        console.log(err);
      } else if (!user) {
        res.render('index', {
            errormessage: "There is no user registered with that email",
            title: 'Anubis', lit: literalsLang
        });
      } else {
        bcrypt.compare(password, user.password, (err, isValid) => {
          if (isValid) {
            const userToken = {
              email: user.email,
              id: user._id,
              name: user.name,
              role: user.role
            };
            jwt.createAccessToken(userToken, (err, token) => {
              mongoCommon.recordLogins(userToken, req)
              const cookieOptions = {
                httpOnly: true,
                // secure: true,
                // sameSite: 'Strict',
                expires: new Date(Date.now() + 28800000),
              };
              res.cookie('id_token', token, cookieOptions);
              // res.accessToken = token;
              // req.headers.accessToken = token;
              // console.log(req.cookies.id_token);
              if (user.role == constants.ROLE_ADMIN) {
                res.redirect(307, '/adminConsole?accessToken=' + token);
              } else {
                res.redirect('/personalPage?user=' + user._id);
              } 
            });  
          } else {
            res.render('index', {
              errormessage : "Incorrect password",
              title: 'Anubis', lit: literalsLang
            });
            console.log('else');
          }
        });  
      }
    });
  }

  function recoverEmail() {
    const email = req.body.email;
    mongoCommon.findByEmail(email, (err, user) => {
      if (err) {
        res.render('index', {
          errormessage : err,
          title: 'Anubis', lit: literalsLang
        });
      } else if (!user) {
        res.render('index', {
          errormessage : "There is no user registered with that email",
          title: 'Anubis', lit: literalsLang
        });
      } else {
        const token = crypto.randomBytes(40).toString('hex');
        // save token in database
        mongoCommon.updateByEmail(email, {token: token}, (err) => {
          if (err) {
            res.render('index', {
              errormessage : err,
              title: 'Anubis', lit: literalsLang
            });
          } else {
            // send recovery email
            const emailLiterals = (language == 'en') ? emails.resetPassword.en : emails.resetPassword.es;
            const mailOptions = {
              from: process.env.EMAIL_FROM, // sender address
              to: email, // list of receivers
              subject: emailLiterals.subject,
              html: emailLiterals.body[0] + token + emailLiterals.body[1] +
              user._id + emailLiterals.body[2],
            };
            common.sendEmail(mailOptions);
            res.render('index', {
              errormessage : "An email has been sent with your password reset link.",
              title: 'Anubis', lit: literalsLang
            }); 
          }
        });
      }
    });
  }
});

router.post('/api/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  mongoCommon.findByEmail(email, (err, user) => {
    if (err) {
      res.send(err);
    } else if (!user) {
      res.json({ error: 'There is no user registered with that email' });
    } else {
      bcrypt.compare(password, user.password, (err, isValid) => {
        if (isValid) {
          const userToken = {
            email: user.email,
            id: user._id,
            name: user.name,
            role: user.role
          };
          jwt.createAccessToken(userToken, (err, token) => {
            if (err) console.log(err);
            if (user.role == constants.ROLE_ADMIN) {
              res.json({
                user: user._id,
                token,
                page: 'admin',
              });
            } else {
              res.json({ user: user._id, page: 'users' });
            }
          });  
        } else {
          res.json({ error: 'Incorrect password' });
        }
      });  
    }
  });
});

router.get('/api/getDogsList', jwt.verifyHeaderAccessToken, (req, res) => {
  mongoCommon.getDogs((err, results) => {
    if (err) {
      res.json({ error: err });
    } else {
      res.json(results);
    }
  });

  function getDates(startDate, stopDate) {
    let dateArray = [];
    let currentDate = moment(startDate);
    stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push( moment(currentDate).format('dd DD') )
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
  }
});

/*Reset Password */
router.get('/resetPassword', (req, res) => {
    const token = (req.query && req.query.token) ? req.query.token : null;
    const id = (req.query && req.query.id) ? req.query.id : null;
    const language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
    const literalsLang = 
    (language == 'es') ? literals.es : literals.en;
    mongoCommon.mongoConnect()
      .then(() => {
        mongoCommon.getByUserId(id, (err, user) => {
            if (err) {
              res.render('index', {
                errormessage : 'Something went wrong, please try again.',
                title: 'Anubis', lit: literalsLang
              });
            } else if (!user) {
              res.render('index', {
                errormessage : "There is no user registered with that email",
                title: 'Anubis', lit: literalsLang
              });
            } else if (user.token == token) {
              mongoCommon.updateByEmail(user.email, {token: null}, (err) => {
                if (err) {
                  console.error("Error deleting password recovery token from user " + email);
                }
              });
              res.render('reset', {
                email : user.email 
              });
            } else {
              res.render('index', {
                  errormessage: "The token provided is incorrect. Please request a new password reset.",
                  title: 'Anubis', lit: literalsLang
                });
            }
        });
      }).catch((err) => {
        res.render('index', {
          errormessage : 'Something went wrong, please try again.',
          title: 'Anubis', lit: literalsLang
        });
      });
});

router.post('/adminConsole', (req, res) => {
  const today = (req.body && req.body.from) ? new Date(req.body.from) : new Date(new Date().setHours(0,0,0,0));
  const lastDate = (req.body && req.body.to) ? new Date(req.body.to) : new Date(new Date().setDate(today.getDate()+30));
  const calendarDates = getDates(today, new Date().setDate(today.getDate()+30));
  const language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
  const literalsLang = (language == 'es') ? literals.es : literals.en;
  const accessToken = req.query.accessToken;
  req.query.accessToken = null;
  async.parallel([
    mongoCommon.getReservationsByDate.bind(null, today, lastDate),
    mongoCommon.getDogs.bind(null),
    mongoCommon.getReservations.bind(null),
  ], (err, results) => {
    if (err) {
      console.error(err);
      res.render('index', {
        errormessage : 'Something went wrong, please try again.',
        title: 'Anubis', lit: literalsLang
      });
    } else {
      let dogNumberArray = [];
      for (let day of calendarDates) {
        let count = 2;
        day = moment(day,'dd DD-MM-YY');
        for (let res of results[0]) {
          if (day >= moment(res.init,'dd DD-MM-YY').startOf("day") &&
          day <= moment(res.end, 'dd DD-MM-YY').startOf("day")) count = count + 1;
        }
        dogNumberArray.push(count);
      }
      // res.render('adminConsole', {
      //   calendarDates: calendarDates,
      //   reservations: results[0],
      //   dogs: results[1],
      //   moment: moment,
      //   dogNumberArray,
      //   accessToken,  
      //   lit: literalsLang
      // });
      res.render('dashboard', {
        dogs: results[1],
        dogNumberArray,
        reservations: results[0],
        // dogTrainings: results[2].length
      });
    }
  });

  function getDates(startDate, stopDate) {
    let dateArray = [];
    let currentDate = moment(startDate);
    stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        // dateArray.push( moment(currentDate).format('dd DD') )
        dateArray.push( moment(currentDate).format('dd DD-MM-YY') )
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
  }
});

router.get('/calendar', async (req, res) => {
  const today = (req.body && req.body.from) ? new Date(req.body.from) : new Date(new Date().setHours(0,0,0,0));
  // const lastDate = (req.body && req.body.to) ? new Date(req.body.to) : new Date(new Date().setDate(today.getDate()+30));
  // const calendarDates = getDates(today, new Date().setDate(today.getDate()+30));
  const language = (req && req.acceptsLanguages('es')) ? 'es' : 'en';
  // const literalsLang = (language == 'es') ? literals.es : literals.en;
  // const accessToken = req.query.accessToken;
  req.query.accessToken = null;
  let reservations = await mongoCommon.getReservationsPromise();
  res.render('calendar', {
    reservations
  });
});

router.get('/personalPage', jwt.verifyAccessToken, (req, res) => {
  const userId = req.query.user;
  mongoCommon.getDogsByUserId(userId, (err, user) => {
    const userName = (user && user.name) ? user.name.toUpperCase() : '';
    const numDogs = (user && user.dogsArray) ? user.dogsArray.length : 0;
    const profilePic = (user && user.dogsArray && user.dogsArray[0].profilePic) ? user.dogsArray[0].profilePic : '';
    res.render('personalPage', {
      userName: userName,
      profilePic: profilePic,
      lit: literalsLang
    });
  });
});

router.post('/addUser', jwt.verifyAccessToken, (req, res) => {
  const newUser = userModel.newUser(req.body);
  let newDog = dogModel.newDog(req.body);
  mongoCommon.insertNew('users', newUser, (err, result) => {
    if (err) {
      console.error(err);
      res.redirect(307, '/adminConsole');
    } else {
      newDog.owner = ObjectID(result._id);
      mongoCommon.insertNew('dogs', newDog, (err, dogResult) => {
        if (err) {
          console.error(err);
          res.redirect(307, '/adminConsole');
        } else {
          //update user with dogId
          mongoCommon.updateById(ObjectID(result._id), 'users', {dogs: [ObjectID(dogResult._id)]}, (err) => {
            if (err) console.error(err);
            res.redirect(307, '/adminConsole');
          });
        }
      });
    }
  });
});

router.get('/editUserForm', jwt.verifyAccessToken, (req, res) => {
  let ownerId = (req.query && req.query.ownerId) ? req.query.ownerId : null;
  if (ownerId) {
    mongoCommon.getByUserId(ownerId, (err, owner) => {
      if (err) {
        res.redirect(307, '/adminConsole');
      } else if (owner) {
        res.render('editUserForm', {
          owner,
          lit: literalsLang
        });
      } else {
        console.log('No owner with that id');
        res.redirect(307, '/adminConsole');
      }
    });
  } else {
    console.log('OwnerId empty');
    res.redirect(307, '/adminConsole');
  }
});

router.post('/editUser', jwt.verifyAccessToken, (req, res) => {
  const id = (req.body.id) ? req.body.id : null;
  if (id) {
    mongoCommon.getByUserId(id, (err, user) => {
      if (err) {
        console.error(err);
        res.redirect(307, '/adminConsole');
      } else if (!user) {
        console.error('User does not exist in database');
        res.redirect(307, '/adminConsole');
      } else {
        let updateVal = {};
        if(req.body.name && req.body.name != user.name) updateVal.name = req.body.name;
        if(req.body.lastName && req.body.lastName != user.lastName) updateVal.lastName = req.body.lastName;
        if(req.body.phone && req.body.phone != user.phone) updateVal.phone = req.body.phone;
        if(req.body.email && req.body.email != user.email) updateVal.email = req.body.email;
        if(req.body.address && req.body.address != user.address) updateVal.address = req.body.address;
        if(req.body.latitude && req.body.longitude && (parseFloat(req.body.latitude) != user.geopoint.coordinates[1] ||
        parseFloat(req.body.longitude) != user.geopoint.coordinates[0]))
        updateVal.geopoint = {coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)], type: 'point'};
        if(req.body.source && req.body.source != user.source) updateVal.source = req.body.source;
        if(req.body.notes && req.body.notes != user.notes) updateVal.notes = req.body.notes;

        mongoCommon.updateById(ObjectID(id), 'users', updateVal, (err) => {
          if (err) {
            console.error(err);
            res.redirect(307, '/adminConsole');
          } else {
            res.redirect(307, '/adminConsole');
          }
        });
      }
    });
  } else {
    console.error('No id on owner edit');
    res.redirect(307, '/adminConsole');
  }
});

router.get('/loadAddReservations', jwt.verifyAccessToken, (req, res) => {
  const dogId = (req.query && req.query.dogId) ? req.query.dogId : null;
  const ownerId = (req.query && req.query.ownerId) ? req.query.ownerId : null;
  const dogName = (req.query && req.query.dogName) ? req.query.dogName : null;
  
  if (dogId && ownerId) {
    res.render('reservationForm', {
      dogName,
      dogId,
      ownerId,
      lit: literalsLang
    });
  } else {
    res.redirect(307, '/adminConsole');
  }
});

router.get('/loadDogProfile', jwt.verifyAccessToken, (req, res) => {
  const dogId = (req.query && req.query.dogId) ? req.query.dogId : null;
  mongoCommon.getDogById(dogId, (err, dog) => {
    if (err) {

    } else {
      if (dog && dog.cloudinaryTag && dog.cloudinaryTag != '') {
        cloudinary.v2.search
          .expression(dog.cloudinaryTag)
          .with_field('tags')
          .max_results(500)
          .execute()
            .then(result => {
              dog.images = result
              res.render('dogsProfile', {
                dog,
                lit: literalsLang
              });
            });
      } else {
        res.render('dogsProfile', {
          dog,
          lit: literalsLang
        });
      }
    }
  });
});

router.get('/loadOwnerProfile', jwt.verifyAccessToken, (req, res) => {
  const ownerId = (req.query && req.query.ownerId) ? req.query.ownerId : null;
  mongoCommon.getDogsByUserId(ownerId, (err, owner) => {
    if (err) {

    } else {
      res.render('ownersProfile', {
        owner,
        lit: literalsLang
      });
    }
  });
});

router.get('/loadReservation', jwt.verifyAccessToken,(req, res) => {
  const reservationId = (req.query && req.query.reservationId) ? req.query.reservationId : null;
  mongoCommon.getReservationsById(reservationId, (err, reservation) => {
    if (err) {

    } else {
      res.render('reservationProfile', {
        reservation,
        lit: literalsLang
      })
    }
  });
});

router.post('/calculatePrice', (req, res) => {
  req.check('dogId', 'dogId cannot be missing').exists();
  req.check('ownerId', 'ownerId cannot be missing').exists();
  req.check('dogName', 'dogName cannot be missing').exists();
  req.check('type', 'Sitting or trining must be selected').exists();
  let errors = req.getValidationResult();
  errors.then((result) => {
    if (!result.isEmpty()) {
      res.render('reservationForm', {
        validationErrors: result.mapped()
      });
    } else {
      const reservation = {};
      reservation.dogId = (req.body && req.body.dogId) ? req.body.dogId : null;
      reservation.ownerId = (req.body && req.body.ownerId) ? req.body.ownerId : null;
      reservation.status = (req.body && req.body.status) ? req.body.status : 0;
      reservation.dogName = (req.body && req.body.dogName) ? req.body.dogName : null;
      reservation.type = (req.body && req.body.type) ? req.body.type : null;
      reservation.area = (req.body && req.body.area) ? parseInt(req.body.area) : null;
      reservation.pickup = (req.body && req.body.pickup) ? req.body.pickup : false;
      reservation.delivery = (req.body && req.body.delivery) ? req.body.delivery : false;
      reservation.init = (req.body && req.body.init) ? req.body.init : null;
      reservation.end = (req.body && req.body.end) ? req.body.end : null;
      reservation.notes = (req.body && req.body.notes) ? req.body.notes : null;
      reservation.dogNotes = (req.body && req.body.dogNotes) ? req.body.dogNotes : null;
      reservation.priceDays = 0;

      if (reservation.dogId) {
        const period = (reservation.init && reservation.end) ? calculatePeriod(reservation.init, reservation.end) : 1;
        const rateType = (reservation.type && reservation.type == 2) ? 6 :
        (reservation.type == 5) ? 7 :
        (period < 8) ? 1 :
        (period < 15) ? 2 :
        (period < 22) ? 3 :
        (period < 29) ? 4 : 5;
        mongoCommon.getRates(reservation.area, rateType, (err, rate) => {
          if (err) {
            reservation.error = 'Error getting rates';
            res.render('reservationForm', {
              reservation,
              lit: literalsLang
            });
          } else {
            reservation.period = period;
            reservation.priceDay = (rate && rate.priceDay) ? rate.priceDay : 0;
            reservation.priceDays = (period && rate && rate.priceDay) ? period * rate.priceDay : 0;
            reservation.pricePickup = (reservation.pickup) ? rate.priceTransportation : 0;
            reservation.priceDelivery = (reservation.delivery) ? rate.priceTransportation : 0;
            reservation.priceTotal = reservation.priceDays + reservation.pricePickup + reservation.priceDelivery;
            res.render('reservationPreview', {
              reservation,
            });
          }
        });
      } else {
        reservation.error = 'DogId cant be empty';
        res.render('reservationForm', {
          reservation,
          lit: literalsLang
        });
      }

      function calculatePeriod(init, end) {
        const oneDay = 24*60*60*1000;
        const initDate = new Date(init);
        const endDate = new Date(end);
        const period = Math.round(Math.abs((initDate.getTime() - endDate.getTime())/(oneDay)));
        if (period > 0) {
          return period
        } else {
          return 1
        };
      }
    }});
});

router.post('/addReservation', jwt.verifyAccessToken, (req, res) => {
  const reservation = (req.body && req.body.reservation) ? JSON.parse(req.body.reservation) : null;
  const newPrice = (req.body && req.body.newPrice) ? parseInt(req.body.newPrice) : null;

  if (reservation) {
    if (newPrice != reservation.priceTotal) {
      reservation.priceTotal = newPrice;
      if (reservation.pricePickup) newPrice - reservation.pricePickup
      if (reservation.priceDelivery) newPrice - reservation.priceDelivery
      reservation.priceDays = newPrice;
      reservation.priceDay = newPrice / reservation.period; 
    }
    let newReservation = reservationModel.reservationModel(reservation);
    mongoCommon.insertNew('reservations', newReservation, (err, result) => {
      if (err) {

      } else {
        const mailOptions = {
          from: process.env.EMAIL_FROM, // sender address
          to: process.env.EMAILS_UPDATES, // list of receivers
          subject: 'New Reservation',
          html: JSON.stringify(result),
        };
        common.sendEmail(mailOptions);

      //   let auth = new google.auth.OAuth2(
      //     process.env.GOOGLE_CLIENT_ID,
      //     process.env.GOOGLE_CLIENT_SECRET,
      //     process.env.GOOGLE_CALENDAR_REDIRECT_URI
      // );
      //   // Now use OAuth response to get an user authenticated API client
      //   let credentials = {
      //       access_token:'ACCESS_TOKEN',
      //       token_type:'TOKEN_TYPE', // mostly Bearer
      //       refresh_token:'REFRESH_TOKEN',
      //       expiry_date:'EXPIRY_TIME'
      //   };
      //   auth.setCredentials(credentials);
      //   let calendar = google.calendar({version: 'v3', auth});
      //   calendar.events.insert({
      //       auth: auth,
      //       calendarId: 'primary',
      //       resource: {
      //           'summary': reservation.dogName,
      //           'description': reservation.notes,
      //           'start': {
      //               'dateTime': reservation.init,
      //               'timeZone':'cest'
      //           },
      //           'end': {
      //               'dateTime': reservation.end,
      //               'timeZone':'cest'
      //           },
      //           'attendees': [],
      //           'reminders': {
      //               'useDefault': false,
      //               'overrides': [
      //                   {'method': 'email', 'minutes': 24 * 60},
      //                   {'method': 'popup', 'minutes': 10},
      //               ],
      //           },
      //           'colorId' : 4 ,
      //           'sendUpdates':'all',
      //           'status' : 'confirmed'
      //       },
        // }, (err, res) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         console.log(res.data);
        //     }
        // });
        res.redirect(307, '/adminConsole');
      }
    });
  } else {

  }
});

router.get('/editReservationForm', jwt.verifyAccessToken, (req, res) => {
  let reservationId = (req.query && req.query.reservationId) ? req.query.reservationId : null;
  if (reservationId) {
    mongoCommon.getReservationsById(reservationId, (err, reservation) => {
      if (err) {
        res.redirect(307, '/adminConsole');
      } else if (reservation) {
        res.render('editReservationForm', {
          reservation,
          lit: literalsLang
        });
      } else {
        console.log('No reservation with that id');
        res.redirect(307, '/adminConsole');
      }
    });
  } else {
    console.log('reservation empty');
    res.redirect(307, '/adminConsole');
  }
});

router.post('/editReservation', jwt.verifyAccessToken, (req, res) => {
  const id = (req.body.id) ? req.body.id : null;
  const resObj = (req.body) ? reservationModel.reservationModel(req.body) : null;
  if (id && resObj) {
    mongoCommon.getReservationsById(id, (err, reservation) => {
      if (err) {
        console.error(err);
        res.redirect(307, '/adminConsole');
      } else if (!reservation) {
        console.error('Reservation does not exist in database');
        res.redirect(307, '/adminConsole');
      } else {
        let updateVal = {};
        if(resObj.init != reservation.init) updateVal.init = resObj.init;
        if(resObj.end && resObj.end != reservation.end) updateVal.end = resObj.end;
        if(resObj.pickup && resObj.pickup != reservation.pickup) updateVal.pickup = resObj.pickup;
        if(resObj.delivery && resObj.delivery != reservation.delivery) updateVal.delivery = resObj.delivery;
        if(resObj.type && resObj.type != reservation.type) updateVal.type = resObj.type;
        if(resObj.area && resObj.area != reservation.area) updateVal.area = resObj.area;
        if(resObj.period && resObj.period != reservation.period) updateVal.period = parseInt(resObj.period);
        if(resObj.notes && resObj.notes != reservation.notes) updateVal.notes = resObj.notes;
        if(resObj.priceTotal && resObj.priceTotal != reservation.priceTotal) updateVal.priceTotal = resObj.priceTotal;
        if(resObj.status && resObj.status != reservation.status) updateVal.status = resObj.status;
        if(resObj.payed && resObj.payed != reservation.payed) updateVal.payed = resObj.payed;
        if(resObj.paymentType && resObj.paymentType != reservation.paymentType) updateVal.paymentType = resObj.paymentType;

        mongoCommon.updateById(ObjectID(id), 'reservations', updateVal, (err) => {
          if (err) {
            console.error(err);
            res.redirect(307, '/adminConsole');
          } else {
            res.redirect('/viewReservations');
          }
        });
      }
    });
  } else {
    console.error('No id on owner edit');
    res.redirect(307, '/adminConsole');
  }
});

router.get('/viewReservations', (req, res) => {
  const from = (req.query.from) ? new Date(req.query.from) : null;
  const to = (from) ? new Date(moment(from).add(1, 'months').subtract(1, 'minutes').format()) : null;
  const query = (from && to) ? {end: {$gte: from, $lte: to}} : null;
  mongoCommon.getReservations(query, (err, reservations) => {
    if (err) {
      console.error(err);
      res.redirect(307, '/adminConsole');
    } else {
      common.calculateTotals(reservations)
        .then(result => res.render('reservationsPage', {
          reservations,
          services: result.services,
          pps: result.pps,
          totalMoney: result.totalMoney,
          totalCash: result.totalCash,
          totalTransfer: result.totalTransfer,
          taxesCash: result.taxesCash,
          taxesTransfer: result.taxesTransfer,
          lit: literalsLang})
        );
    }
  });
});

router.get('/viewAccounting', jwt.verifyAccessToken, (req, res) => {
  const today = new Date();
  const currentYear = (req.query.year) ? parseInt(req.query.year) : today.getFullYear();
  async.parallel([
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('1/1/' + currentYear), $lt: new Date('2/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('2/1/' + currentYear), $lt: new Date('3/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('3/1/' + currentYear), $lt: new Date('4/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('4/1/' + currentYear), $lt: new Date('5/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('5/1/' + currentYear), $lt: new Date('6/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('6/1/' + currentYear), $lt: new Date('7/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('7/1/' + currentYear), $lt: new Date('8/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('8/1/' + currentYear), $lt: new Date('9/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('9/1/' + currentYear), $lt: new Date('10/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('10/1/' + currentYear), $lt: new Date('11/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('11/1/' + currentYear), $lt: new Date('12/1/' + currentYear)}}),
    mongoCommon.getReservations.bind(null, {end: {$gte: new Date('12/1/' + currentYear), $lt: new Date('1/1/' + (currentYear + 1))}}),
  ], (err, results) => {
    if (err) {
      console.error(err);
      res.render('adminConsole', {});
    } else {
      async.parallel([
        common.calculateTotalsCB.bind(null, results[0]),
        common.calculateTotalsCB.bind(null, results[1]),
        common.calculateTotalsCB.bind(null, results[2]),
        common.calculateTotalsCB.bind(null, results[3]),
        common.calculateTotalsCB.bind(null, results[4]),
        common.calculateTotalsCB.bind(null, results[5]),
        common.calculateTotalsCB.bind(null, results[6]),
        common.calculateTotalsCB.bind(null, results[7]),
        common.calculateTotalsCB.bind(null, results[8]),
        common.calculateTotalsCB.bind(null, results[9]),
        common.calculateTotalsCB.bind(null, results[10]),
        common.calculateTotalsCB.bind(null, results[11]),
      ], (err, formattedResults) => {
        if (err) {
          console.error(err);
          res.render('adminConsole', {});
        } else {
          let totalYear = 0;
          for (let year of formattedResults) {
            totalYear = year.totalMoney + totalYear;
          }
          res.render('accountingPage', {
            currentYear,
            jan: formattedResults[0],
            feb: formattedResults[1],
            mar: formattedResults[2],
            apr: formattedResults[3],
            may: formattedResults[4],
            jun: formattedResults[5],
            jul: formattedResults[6],
            ago: formattedResults[7],
            sep: formattedResults[8],
            oct: formattedResults[9],
            nov: formattedResults[10],
            dec: formattedResults[11],
            totalYear,
          });
        }
      });
    }
  });
});

router.get('/viewDogs', jwt.verifyAccessToken, (req, res) => {
  const today = (req.body && req.body.from) ? new Date(req.body.from) : new Date();
  const lastDate = (req.body && req.body.to) ? new Date(req.body.to) : new Date(new Date().setDate(today.getDate()+30));
  const calendarDates = getDates(today, new Date().setDate(today.getDate()+30));
  async.parallel([
    mongoCommon.getReservationsByDate.bind(null, today, lastDate),
    mongoCommon.getDogs.bind(null),
  ], (err, results) => {
    if (err) {
      console.error(err);
      res.render('adminConsole', {});
    } else {
      res.render('dogsPage', {
        calendarDates: calendarDates,
        reservations: results[0],
        dogs: results[1],
        moment: moment,
        lit: literalsLang
      });
    }
  });

  function getDates(startDate, stopDate) {
    let dateArray = [];
    let currentDate = moment(startDate);
    stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push( moment(currentDate).format('dd DD') )
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
  }
});

module.exports = router;