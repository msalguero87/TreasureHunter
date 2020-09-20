
function addActivity(){
  var list = document.getElementsByClassName('list-group-item');
  var newIndex = list.length;
  var title = 'New Activity!';
  var description = 'Please describe the activity the treasure hunters must complete.';
  var newActivity = '<div class="list-group-item"><div class="row"><div class="col-md-4"><img class="profile" src="/icons/treasure-map.png" /></div><div class="col-md-8"><h4 class="list-group-item-heading"><input class="invisible-input" value="'+title+'" /></h4><div class="list-group-item-text"><textarea class="invisible-input" style="height: 148px;">'+description+'</textarea></div><div class="row"><button onclick="selectUnit('+newIndex+')" class="primary" >Select</button></div></div></div></div>';
  document.getElementById('activity-list').insertAdjacentHTML('beforeend', newActivity);
  activities.push({title: title, description: description, coords: mainCoord});
  selectUnit(newIndex);
}

var map;
var homebase;
var mainCoord;

var directionsService;
var dragonProjectedPath;
var selectedIndex;
var activities = [];

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
                  selectedIndex = 0;
                  activities.push({coords: mainCoord});
                  homebase = new google.maps.Marker({position: coord, map: map, icon: '/icons/treasure.png'});
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
    units.dragon = new google.maps.Marker({position: coord, map: map, icon: '/icons/dragon1.png', animation: google.maps.Animation.DROP});
    calculateAndDisplayRoute(homebase.position, units.dragon, "#FFFFFF");
  }

  function onClickUnit(unit){
    for (let i = 0; i < units.keys.length; i++) {
      const un = units.keys[i];
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      }
    }

    
    unit.setAnimation(google.maps.Animation.BOUNCE);
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

          unit.wholePath = createPolyline(route.overview_path, 0.3, color);
          if(overview_path){
            unit.projectedPath = createPolyline(overview_path, 1, color);
            unit.path = overview_path;
            unit.targetPath = route.overview_path;
          }
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  }

  function createPolyline(overview_path, opacity, color) {
    var line = new google.maps.Polyline({
      path: overview_path,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: 4
    });
  
    line.setMap(map);
    return line;
    for (var i = 0; i < line.getPath().length; i++) {
      var marker = new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        },
        position: line.getPath().getAt(i),
        map: map
      });
    }
  }

  function setMovement(latLng){
    if(!activities[selectedIndex]) return;
    activities[selectedIndex].coords = {lat: latLng.lat(), lng: latLng.lng()};
    homebase.setPosition(new google.maps.LatLng(activities[selectedIndex].coords.lat, activities[selectedIndex].coords.lng));
  }

  function selectUnit(index){
    selectedIndex = index;
    var className = 'active-unit';
    var list = document.getElementsByClassName(className);
    for (let i = 0; i < list.length; i++)
      list[i].classList.remove(className);

    list = document.getElementsByClassName('list-group-item');
    for (let i = 0; i < list.length; i++){
      if(index === i){
        list[i].classList.add(className);
      }
    }
    if(activities[index]){
      homebase.setPosition(new google.maps.LatLng(activities[index].coords.lat, activities[index].coords.lng));
    }
  }

  function startHunt(){
    var list = document.getElementsByClassName('list-group-item');
    for (let i = 0; i < list.length; i++){
      var title = list[i].getElementsByTagName('input')[0].value;
      var description = list[i].getElementsByTagName('textarea')[0].value;
      activities[i].title = title;
      activities[i].description = description;
    }
    sessionStorage.setItem('activities', JSON.stringify(activities));
    window.location = 'hunt.html';
  }