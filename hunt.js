var activities = [
    {
        title: 'Walk the plank!',
        description: 'Take a photo of a team member walking on a plank.',
        coords:{
            lat: 15.55574940950425,
            lng: -88.03365086437074
        }
    },
    {
        title: 'Sail Ho!',
        description: 'Take a photo of a ship.',
        coords:{
            lat:15.556782990757693,
            lng:-88.0283293616852
        }
    },{
        title: 'Dobloons',
        description: 'Find and take a photo of a team member holding a coin.',
        coords:{
            lat:15.547827870227007,
            lng:-88.02343701244203
        }
    }
]


function addActivities(){
    var list = document.getElementsByClassName('list-group-item');
    var newIndex = list.length;
    var title = activities[0].title;
    var description = activities[0].description;
    var newActivity = '<div class="list-group-item"><div class="row"><div class="col-md-4"><img class="profile" src="/icons/treasure-map.png" /></div><div class="col-md-8"><h4 class="list-group-item-heading"><input class="invisible-input" value="'+title+'" /></h4><div class="list-group-item-text"><textarea class="invisible-input" style="height: 148px;">'+description+'</textarea></div><div class="row"><button onclick="complete('+newIndex+')" class="primary" >Completed!</button></div></div></div></div>';
    document.getElementById('activity-list').insertAdjacentHTML('beforeend', newActivity);
    
    title = 'Hidden!';
    description = "Complete the previous steps to see this activity!";
    for (let i = 1; i < activities.length; i++) {
        const activity = activities[i];
        newActivity = '<div class="list-group-item hidden-item"><div class="row"><div class="col-md-4"><img class="profile" src="/icons/treasure-closed.png" /></div><div class="col-md-8"><h4 class="list-group-item-heading"><input class="invisible-input" value="'+title+'" /></h4><div class="list-group-item-text"><textarea class="invisible-input" style="height: 148px;">'+description+'</textarea></div><div class="row"></div></div></div></div>';
        document.getElementById('activity-list').insertAdjacentHTML('beforeend', newActivity);
    }
    
  }
  
  var map;
  var homebase;
  var mainCoord;
  var path;
  var ship;
  
  var directionsService;
  var dragonProjectedPath;
  var currentIndex;
  
  var getJSON = function(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      xhr.onload = function() {
        var status = xhr.status;
        if (status === 200) {
          callback(null, xhr.response);
        } else {
          callback(status, xhr.response);
        }
      };
      xhr.send();
  };
  
  // Initialize and add the map
  function initMap() {
    var data = sessionStorage.getItem('activities');
    if(data)
        activities = JSON.parse(data);
    console.log(activities);
    addActivities();
    directionsService = new google.maps.DirectionsService();
    var publishableKey = "prj_test_pk_29a2c828b7a9a10f820259ecd0279a7ed470e4cb";
    Radar.initialize(publishableKey);
    Radar.getLocation(function(err, result) {
      if (!err) {
        // do something with result.location, result.events, result.user
        // The location of coord
        var coord = {lat: result.location.latitude, lng: result.location.longitude};
        //coord = {lat: -33.891021, lng: 151.236683};
        //coord = { lat: 12.159080, lng: -86.273072 };
        // The map, centered at coord
        mainCoord = coord;
        getJSON("/mapstyle.json", function(error, response){
            if(!error){
                map = new google.maps.Map(
                    document.getElementById('map'), {
                        zoom: 15, 
                        center: coord,
                        styles: response,
                        mapTypeControl: false,
                        streetViewControl: false
                    });
                    currentIndex = 0;
                    homebase = new google.maps.Marker({position: activities[0].coords, map: map, icon: '/icons/treasure.png'});
                    drawShip(mainCoord);
                    google.maps.event.addListener(map, "click", event => {
                      setMovement(event.latLng);
                    });
            }
        });
      }else{
        console.log(err);
      }
    });
    
      // The marker, positioned at coord
  }
  
    function drawShip(coord){
      ship = new google.maps.Marker({position: coord, map: map, icon: '/icons/pirate.png', animation: google.maps.Animation.DROP});
      calculateAndDisplayRoute(homebase.position, ship, "black");
    }
  
    function calculateAndDisplayRoute(destination, unit, color) {
      directionsService.route(
        {
          origin: new google.maps.LatLng(destination.lat(), destination.lng()),
          destination: new google.maps.LatLng(unit.position.lat(), unit.position.lng()),
          travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
          if (status === "OK") {
            if(response.routes.length == 0)return;
            var distanceTotal = 0;
            var route = response.routes[0];
            var overview_path;
            for (var i = route.overview_path.length - 1; i > 0 ; i--) {
              var coords = route.overview_path[i];
              var coords2 = route.overview_path[i-1];
              distanceTotal += google.maps.geometry.spherical.computeDistanceBetween(coords, coords2);
              if(distanceTotal>=500){
                overview_path = route.overview_path.slice(i).reverse();
                break;
              }
            }
  
            path = createPolyline(route.overview_path, 1, color);
            //if(overview_path){
            //  unit.projectedPath = createPolyline(overview_path, 1, color);
            //  unit.path = overview_path;
            //  unit.targetPath = route.overview_path;
            //}
          } else {
            window.alert("Directions request failed due to " + status);
          }
        }
      );
    }
  
    function createPolyline(overview_path, opacity, color) {
        var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4,
            strokeColor: 'black'
        };
          
      var line = new google.maps.Polyline({
        path: overview_path,
        strokeColor: color,
        strokeOpacity: 0,
        icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '20px'
        }],
        strokeWeight: 4
      });
    
      line.setMap(map);
      return line;
    }
  
    function setMovement(latLng){
      if(!activities[selectedIndex]) return;
      activities[selectedIndex].coords = {lat: latLng.lat(), lng: latLng.lng()};
      homebase.setPosition(new google.maps.LatLng(activities[selectedIndex].coords.lat, activities[selectedIndex].coords.lng));
    }
  
    function complete(){
      
      var className = 'hidden-item';
      var list = document.getElementsByClassName(className);
      currentIndex++;
      if(list.length && activities[currentIndex]){
        var title = activities[currentIndex].title;
        var description = activities[currentIndex].description;
        var newActivity = '<div class="list-group-item"><div class="row"><div class="col-md-4"><img class="profile" src="/icons/treasure-map.png" /></div><div class="col-md-8"><h4 class="list-group-item-heading"><input class="invisible-input" value="'+title+'" /></h4><div class="list-group-item-text"><textarea class="invisible-input" style="height: 148px;">'+description+'</textarea></div><div class="row"><button onclick="complete('+(currentIndex + 1)+')" class="primary" >Completed!</button></div></div></div></div>';
        list[0].insertAdjacentHTML('beforebegin', newActivity);
        list[0].remove();
      }
  
      if(activities[currentIndex]){
        homebase.setPosition(new google.maps.LatLng(activities[currentIndex].coords.lat, activities[currentIndex].coords.lng));
        path.setMap(null);
        calculateAndDisplayRoute(homebase.position, ship, "black");
      }
      
      if(currentIndex >= activities.length){
          alert("Congratulations!!!");
      }
    }