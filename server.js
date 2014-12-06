//Setup web server and socket
var twitter = require('twitter'),
    express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

//Setup twitter stream api
var twit = new twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
}),
stream = null;
var tweetfilter;
var test;
//Use the default port (for beanstalk) or default to 8081 locally
server.listen(8081);

//Setup rotuing for app
app.use(express.static(__dirname + '/public'));

//Create web sockets connection.
io.sockets.on('connection', function (socket) {
  
  socket.on('new filter', function(filter){
     tweetfilter = filter;
     console.log(filter);
     socket.emit('refresh', filter);
     socket.emit('refresh', filter);
  });

  socket.on("start tweets", function() {

    if(stream === null) {
      //Connect to twitter stream passing in filter for entire world.
      twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {
          stream.on('data', function(data) {
		
	      //Apply filter 
	      function contains(element, index, array){
			return element.text.toLowerCase()  == tweetfilter.toLowerCase();
	      }
	      if (data.entities.hashtags.length != 0 && tweetfilter)
	      {
			test = data.entities.hashtags.some(contains);
			//if(test) console.log(test);
	      }
              if (data.coordinates){
                if (data.coordinates !== null){
                  //If so then build up some nice json and send out to web sockets
                  var outputPoint = {"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1]};
		  if(!tweetfilter || (tweetfilter && test))
		  {
                  	socket.broadcast.emit("twitter-stream", outputPoint);

                  	//Send out to web sockets channel.
                  	socket.emit('twitter-stream', outputPoint);
			
			console.log(outputPoint.lat + " " + outputPoint.lng + " " + data.entities.hashtags);
                  }
		}
                else if(data.place){
                  if(data.place.bounding_box === 'Polygon'){
                    // Calculate the center of the bounding box for the tweet
                    var coord, _i, _len;
                    var centerLat = 0;
                    var centerLng = 0;

                    for (_i = 0, _len = coords.length; _i < _len; _i++) {
                      coord = coords[_i];
                      centerLat += coord[0];
                      centerLng += coord[1];
                    }
                    centerLat = centerLat / coords.length;
                    centerLng = centerLng / coords.length;
		    if(!tweetfilter || (tweetfilter && test))
                    {	
			// Build json object and broadcast it
                    	var outputPoint = {"lat": centerLat,"lng": centerLng};
                    	socket.broadcast.emit("twitter-stream", outputPoint);
			console.log(outputPoint + " " + data.entities.hashtag);
		    }
		   
                  }
                }
		test = false;
              }
              stream.on('limit', function(limitMessage) {
                return console.log(limitMessage);
              });

              stream.on('warning', function(warning) {
                return console.log(warning);
              });

              stream.on('disconnect', function(disconnectMessage) {
                return console.log(disconnectMessage);
              });
          });
      });
    }
  });

    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});
