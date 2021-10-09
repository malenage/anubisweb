'use strict';

module.exports = {
  propertiesObj: {
      name: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      dogs: 1,
  },  
  newUser: (form) => {
    const user = {
        name: form.name,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        geopoint: {
            coordinates: [form.longitude, form.latitude],
            type: 'point'
        },
        source: form.source,
        notes: form.notes,
        role: 2,
        password: '',
        dogs: []
    };
    return user;
  }
}