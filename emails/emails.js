'use strict';

exports.resetPassword = {
    en: {
      subject: 'Reset your password',
      body: ['<p>You have requested to reset your password for Anubis\' Website. </p>' + 
      '<p>If that was not you please disregard this message. </p>' 
      +'<p> In order to set a new password go to the following link: </p><a href="http://centroanubis.herokuapp.com/resetPassword?token=', '&id=', '">Reset Password</a>'] ,
    },
    es: {
        subject: 'Reestablecer contraseña',
        body: ['<p>Has solicitado reestablecer tu contraseña para la página de Anubis. </p>' + 
        '<p>Si no has sido tu, ignora este mensaje. </p>' 
        +'<p> Para establecer una nueva contraseña sigue el siguiente vínculo: </p><a href="http://centroanubis.herokuapp.com/resetPassword?token=', '&id=', '">Reset Password</a>'] ,
      },
    
};