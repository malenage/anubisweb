/*  ------------------
    Remove Preloader
    ------------------  */

// $(window).load(function () {
		
//     $('#preloader').delay(350).fadeOut('slow', function () {
//         $('.training-page, .resume-page, .contact-page, .portfolio-page, .login-page').hide();
//     });
// });
$(window).on('load', function () {
		
    $('#preloader').delay(350).fadeOut('slow', function () {
        $('.training-page, .resume-page, .contact-page, .portfolio-page, .login-page').hide();
    });
} )

$(document).ready(function () {

    'use strict';

    /*  ---------------------
         Homepage Responsive
        ---------------------  */


    function homepageResponsive() {

        // Homepage Main Portions Responsive

        var windowsWidth = $(window).width(),
            windowsHeight = $(window).height();

        if (windowsWidth > windowsHeight) {

            $('.introduction , .menu').css({
                width: '50%',
                height: '100%'
            });

        } else {

            $('.introduction , .menu').css({
                width: '100%',
                height: '50%'
            });

        }

        // Homepage Profile Image Responsive

        var introWidth = $('.introduction').width(),
            introHeight = $('.introduction').height(),
            bgImage = $('.introduction').find('img');

        if (introWidth > introHeight) {

            bgImage.css({
                width: '100%',
                height: 'auto'
            });

        } else {

            bgImage.css({
                width: 'auto',
                height: '100%'
            });

        }

    }

    $(window).on('load resize', homepageResponsive);

    /*  --------------
         Menu Settings
        --------------  */

    // Hide Menu

    $('.menu > div').on('click', function () {

        var introWidth = $('.introduction').width(),
            menuWidth = $('.menu').width();

        $('.introduction').animate({
            left: '-' + introWidth
        }, 1000, 'easeOutQuart');
        $('.menu').animate({
            left: menuWidth
        }, 1000, 'easeOutQuart', function () {
            $('.home-page').css({
                visibility: 'hidden'
            });
        });

    });

    // Show Reletive Page Onclick

    $('.menu div.training-btn').on('click', function () {
        $('.training-page').fadeIn(1200);
    });

    $('.menu div.hotel-btn').on('click', function () {
        $('.resume-page').fadeIn(1200);
    });

    $('.menu div.portfolio-btn').on('click', function () {
        $('.portfolio-page').fadeIn(1200);
    });

    $('.menu div.reservations-btn').on('click', function () {
        $('.contact-page').fadeIn(1200);
    });

    $('.menu div.login-btn').on('click', function () {
        $('.login-page').fadeIn(1200);
    });

    // Close Button, Hide Menu

    $('.close-btn').on('click', function () {
        $('.home-page').css({
            visibility: 'visible'
        });
        $('.introduction, .menu').animate({
            left: 0
        }, 1000, 'easeOutQuart');
        $('.training-page, .resume-page, .portfolio-page, .contact-page, .login-page').fadeOut(800);
    });

    /*  --------------------------------
         Maximize Services Items Height
        --------------------------------  */

    function maximizeHeight() {

        var minHeight = 0;

        $('.services').each(function () {

            var maxHeight = $(this).height();

            if (maxHeight > minHeight) {
                minHeight = maxHeight;
            }

        });

        $('.services').height(minHeight);
    }

    maximizeHeight();

    $(window).on('resize', maximizeHeight);

    /*  ----------------------------------------
         Tooltip Starter for Social Media Icons
        ----------------------------------------  */

    $('.intro-content .social-media [data-toggle="tooltip"]').tooltip({
        placement: 'bottom'
    });

    $('.contact-details .social-media [data-toggle="tooltip"]').tooltip();

    /*  -------------
         Contact Form
        ------------- */

    $('#contactForm').submit(function () {

        $.ajax({
            type: "POST",
            url: "php/contact.php",
            data: $('#contactForm').serialize(),
            success: function (msg) {
                if (msg == 'SEND') {
                    $('.success').fadeIn();
                    $('.error').fadeOut();
                    $('#contactForm')[0].reset();
                } else {
                    $('.success').fadeOut();
                    $('.error').fadeIn().find('h3').text(msg);
                }
            }
        });
        return false;
    });

    /*  -------------------------------
         Google Map ( for contact page )
        -------------------------------  */

    $('#google-map').gMap({
        latitude: 40.456887,
        longitude: -3.0531,
        maptype: 'SATELLITE',
        scrollwheel: false,
        zoom: 14,
        markers: [
            {
                latitude: 40.4388738,
                longitude: -3.7007639,
                html: "I am Here!",
                icon: {
                    image: "../images/icon/doghouse.png",
                    iconsize: [46, 46],
                    iconanchor: [12, 46]
                }
            }
        ],
        controls: {
            panControl: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false
        }
    });

    function moveToSelected(element) {

        if (element == "next") {
          var selected = $(".selected").next();
        } else if (element == "prev") {
          var selected = $(".selected").prev();
        } else {
          var selected = element;
        }
      
        var next = $(selected).next();
        var prev = $(selected).prev();
        var prevSecond = $(prev).prev();
        var nextSecond = $(next).next();
      
        $(selected).removeClass().addClass("selected");
      
        $(prev).removeClass().addClass("prev");
        $(next).removeClass().addClass("next");
      
        $(nextSecond).removeClass().addClass("nextRightSecond");
        $(prevSecond).removeClass().addClass("prevLeftSecond");
      
        $(nextSecond).nextAll().removeClass().addClass('hideRight');
        $(prevSecond).prevAll().removeClass().addClass('hideLeft');
      
      }
      
      // Eventos teclado
      $(document).keydown(function(e) {
          switch(e.which) {
              case 37: // left
              moveToSelected('prev');
              break;
      
              case 39: // right
              moveToSelected('next');
              break;
      
              default: return;
          }
          e.preventDefault();
      });
      
      $('#carousel div').click(function() {
        moveToSelected($(this));
      });
      
      $('#prev').click(function() {
        moveToSelected('prev');
      });
      
      $('#next').click(function() {
        moveToSelected('next');
      });

    //   YouTube
    // var tag = document.createElement('script');
    // tag.id = 'iframe-demo';
    // tag.src = 'https://www.youtube.com/iframe_api';
    // var firstScriptTag = document.getElementsByTagName('script')[0];
    // firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // var player;
    // function onYouTubeIframeAPIReady() {
    //     player = new YT.Player('existing-iframe-example', {
    //         events: {
    //         'onReady': onPlayerReady,
    //         'onStateChange': onPlayerStateChange
    //         }
    //     });
    // }
    // function onPlayerReady(event) {
    //     document.getElementById('existing-iframe-example').style.borderColor = '#FF6D00';
    // }
    // function changeBorderColor(playerStatus) {
    //     var color;
    //     if (playerStatus == -1) {
    //     color = "#37474F"; // unstarted = gray
    //     } else if (playerStatus == 0) {
    //     color = "#FFFF00"; // ended = yellow
    //     } else if (playerStatus == 1) {
    //     color = "#33691E"; // playing = green
    //     } else if (playerStatus == 2) {
    //     color = "#DD2C00"; // paused = red
    //     } else if (playerStatus == 3) {
    //     color = "#AA00FF"; // buffering = purple
    //     } else if (playerStatus == 5) {
    //     color = "#FF6DOO"; // video cued = orange
    //     }
    //     if (color) {
    //     document.getElementById('existing-iframe-example').style.borderColor = color;
    //     }
    // }
    // function onPlayerStateChange(event) {
    //     changeBorderColor(event.data);
    // }
});

function loadAddReservation(dogId, ownerId, dogName) {
    $('#sideProfile').load('/loadAddReservations/?ownerId='+ownerId+'&dogId='+dogId+'&dogName='+dogName);
}

function loadDogProfile(dogId) {
    $('#sideProfile').load('/loadDogProfile/?dogId='+dogId);
}

function loadOwnerProfile(ownerId) {
    $('#sideProfile').load('/loadOwnerProfile/?ownerId='+ownerId);
}

function loadReservation(reservationId) {
    $('#sideProfile').load('/loadReservation/?reservationId='+reservationId);
}

function loadUserEdit(ownerId) {
    $('#sideProfile').load('/editUserForm/?ownerId='+ownerId);
}

function loadReservationEdit(reservationId) {
    $('#sideProfile').load('/editReservationForm/?reservationId='+reservationId);
}