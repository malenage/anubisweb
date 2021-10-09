'use strict';

module.exports = {
  propertiesObj: {
      name: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      dogs: 1,
  },  
  newDog: (form) => {
    const dog = {
        name: form.dogName,
        gender: form.gender,
        breed: form.breed,
        neutered: (form.neutered == 'true') ? true : false,
        peopleFriendly: (form.peopleFriendly == 'true') ? true : false,
        dogFriendly: (form.dogFriendly == 'true') ? true : false,
        birth: form.birth,
        notes: form.dogNotes,
        cloudinaryTag: form.cloudinaryTag,
        reservations: []
    };
    return dog;
  }
}