var Jamendo = function(clientId) {
	
	this.clientId = clientId;	
	this.baseUrl = "http://api.jamendo.com/v3.0";

	return this;	

}

Jamendo.prototype.request = function(path, params, successHandler, failureHandler) {

	var paramsToGetParams = function(params) {

		var parametersAsUriString = "";

		$.each(params, function(key, value) {
			parametersAsUriString = parametersAsUriString + "&" + key + "=" + encodeURIComponent(value);
		});

		return parametersAsUriString;

	}

	var apiUrl = this.baseUrl + path + "?client_id=" + this.clientId + "&format=json&limit=10" + paramsToGetParams(params);

	$.ajax({
		url: apiUrl,
		dataType: 'jsonp'
	}).done(function(data) {
		console.info("Data from Jamendo API call", apiUrl ," succesfully obtained. Data: ", data);			
		successHandler(data)
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("Calling of Jamendo API failed. API call", apiUrl ,". Text status: ", textStatus, ". Error thrown: ", errorThrown);
		failureHandler(jqXHR, textStatus, errorThrown);
	});


}

Jamendo.prototype.getTrack = function(params, success, failure) {

	console.log("Getting track for ", params);

	if (!success) {
		throw "Success handler is required";
	}

	this.request("/tracks", params, success, failure || function() {});
}

Jamendo.prototype.getTracksForArtist = function(params, success, failure) {

	console.log("Getting artist's track for " + params);

	if (!success) {
		throw "Success handler is required";
	}

	this.request("/artists/tracks", params, success, failure || function() {});
}