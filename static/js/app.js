$(function() {

	google.load('maps', '3.x', { callback: initialize, other_params: "sensor=true"});	

});

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

    window.map = map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
    directionsDisplay.setMap(map);	

    $("#direction_bar #send").click(function(e) {
    	e.preventDefault();

    	calcRoute();
    });

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

	var markerPosition = carMarker.getPosition();
	console.log("Iteration number: ", index, "new poistion:", markerPosition);

	showSong(markerPosition.lat(), markerPosition.lng());

	index++;
	
	setTimeout(animateCar, 30000, points, index, carMarker);

}

function showSong(latitude, longitude) {



	var apiUrl = 'http://api.jamendo.com/v3.0/artists/locations?client_id=2b8e7ae9&format=json&limit=5&haslocation=true&location_radius=50&location_coords=' + latitude + "_" + longitude;
	console.log("Obtaining data from Jamendo API with url: ", apiUrl);
	$.ajax({
		url: apiUrl,
		dataType: 'jsonp'
	}).done(function(data) {
		console.info("Data from Jamendo API succesfully obtained. Data: ", data);	
		var $playing = $("#playing");
		$playing.text(data.results[0].name);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("Calling of Jamendo API failed. Text status: ", textStatus, ". Error thrown: ", errorThrown);
	});

}
