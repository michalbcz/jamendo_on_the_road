$(function() {

	google.load('maps', '3.x', { callback: initialize, other_params: "sensor=true"});	

});

window.alreadyPlayed = [];
window.animationHeartBeat = 10000;
window.counter = Math.round(300000 / animationHeartBeat);


Array.prototype.remove = function(elementsToBeRemoved) {

	var self = this;

	var filtered = self.filter(function(value, index) {

		var result = true;
		var filteredArrayElement = value;

		elementsToBeRemoved.forEach(function(element) {
			if (filteredArrayElement == element) {
				result = false;
			}
		});

		return result;
	});

	return filtered;

}

function initialize() {

	var myOptions = {
      zoom: 5,      
      mapTypeControl: false,
	  streetViewControl: false,
	  zoomControl: false,
	  panControl: false,
	  center: new google.maps.LatLng(-27.463347, 153.02496),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    window.directionsDisplay = directionsDisplay = new google.maps.DirectionsRenderer();

    window.map = map = new google.maps.Map(document.getElementById('map-canvas'), myOptions);
    directionsDisplay.setMap(map);	

    $("#direction-bar button.send").click(function(e) {
    	e.preventDefault();
    	calcRoute();
    });

    $(document).bind('playingSong', showSongPlaying);

    $("#next-song").click(function() {
    	window.counter = 0;    
    	playSong(currentMarkerPosition.lat(), currentMarkerPosition.lng());

    });

    $("#from").focus();

    showCurrentUserLocation();

}

function showCurrentUserLocation() {

	 jQuery
	 	.when(deferredCurrentPosition())
	 	.fail(function(error) {
	 		console.error("Error when getting current location: ", error);
	 	})
	 	.done(function(position) {
	 		var coords = position.coords;
	 		var lat = coords.latitude;
	 		var lng = coords.longitude

	 		map.setCenter(new google.maps.LatLng(lat, lng));
	 		console.log("Position:", position);
	 	});

}

function deferredCurrentPosition() {

	return jQuery.Deferred(function(deferred) {

		if (Modernizr.geolocation) {

			var successHandler = function(position) {
				/* success */	
				deferred.resolve(position);
			};

			var errorHandler = function(positionError) {
				deferred.reject(positionError);
			};

			var options = {
				timeout: 1000 /* ms */,
				maximumAge: 0
			}

			navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);		

		} else {
			deferred.reject("no geolocation support for your browser");
		}		

	});	

}

function addressToLatLng(address) {

	var geocoder = new google.maps.Geocoder();

	var geocodeRequest = {
		 address: address		 
	}


}

function calcRoute() {

	var start = document.getElementById("from").value;
  	var end = document.getElementById("to").value;

	console.log("calcRoute directionsDisplay", directionsDisplay, "from: ", start, " to: ", end);

  	var request = {
    	origin:start,
    	destination:end,
    	travelMode: google.maps.TravelMode.DRIVING
  	};

  	var directionsService = new google.maps.DirectionsService();
  	directionsService.route(request, function(result, status) {
  		console.log("route -- ", "result: ", result, "status: ", status);
    	if (status == google.maps.DirectionsStatus.OK) {
      		directionsDisplay.setDirections(result);      		
    	}

    	var points = result.routes[0].overview_path;
    	var index = 0;

    	setTimeout(animateCar, 0, points, index);
    	
  	});

}

function animateCar(points, index, previousMarker) {

	if(previousMarker) {
		previousMarker.setVisible(false);
	}

	var carMarker = new google.maps.Marker({
	      position: points[index],
	      map: map,
	      icon: { url: '/images/car_icon.png', anchor: new google.maps.Point(22,22), scaledSize: new google.maps.Size(40, 40) }	
	});

	var markerPosition = window.currentMarkerPosition = carMarker.getPosition();
	console.log("Iteration number: ", index, "new poistion:", markerPosition);

	if (counter == Math.round(300000 / animationHeartBeat)) {
		playSong(markerPosition.lat(), markerPosition.lng());
		counter = 0
	}	

	counter++;
	index++;
	
	setTimeout(animateCar, window.animationHeartBeat, points, index, carMarker);

}

function playSong(latitude, longitude) {

	var apiUrl = 'http://api.jamendo.com/v3.0/artists/locations?client_id=2b8e7ae9&format=json&limit=5&haslocation=true&location_radius=50&location_coords=' + latitude + "_" + longitude;
	console.log("Obtaining data from Jamendo API with url: ", apiUrl);
	$.ajax({
		url: apiUrl,
		dataType: 'jsonp'
	}).done(function(data) {
		console.info("Data from Jamendo API succesfully obtained. Data: ", data);	
		
		var bands = ""

		$.each(data.results, function(index, value) {
			var result = value;
			bands = bands + result.id + "+"
		});

		bands = bands.substring(0, bands.length - 1); // remove last character which is ","

		console.debug("Bands concat result: ", bands);

		// start to play song
		var jamendo = new Jamendo("2b8e7ae9");

		jamendo.getTracksForArtist({ id: bands}, function(data) {

			var tracks = data.results.reduce(function(prev, current, index) {
				return prev.concat(current.tracks);
			}, []);

			console.debug("Concatenated tracks data before filtering out already played:" , tracks);

			var tracksIds = tracks.map(function(value, index) {
				return value.id;
			});	

			console.debug("Tracks before filtering out already played:" , tracksIds);

			tracksIds = tracksIds.remove(window.alreadyPlayed);
			console.debug("Already played: ", window.alreadyPlayed, " and tracks after filter them out: ", tracksIds);

			var trackId = tracksIds[Math.round(Math.random() * tracksIds.length)];
			console.debug("Picked track for playing: ", trackId);

			jamendo.getTrack({ id: [trackId], audioformat: "mp31"}, function(data) {

				var song = data.results[0];

				window.alreadyPlayed.push(song.id);

				var mp3url = song.audio;

				var $songPlayer = $("#player-component");
				var $audio = $songPlayer.find("audio");

				if($audio.size() == 0) {
					$songPlayer.append(new Audio());
				}

				var audio = $songPlayer.find("audio").get(0);

				audio.src = mp3url;
				audio.controls = true;

				audio.play();

				var songData = song

				// notify about playing song
				$(document).trigger('playingSong', [songData]);
			});

		});

	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("Calling of Jamendo API failed. Text status: ", textStatus, ". Error thrown: ", errorThrown);
	});

}

function showSongPlaying(event, song) {

	console.info("Show song ", song, " information panel");
	var $playing = $("#playing");
	$playing.text("Artist: " + song.artist_name + " Song name:" + song.name);

}