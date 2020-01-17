// Model 
class MapObject {
    constructor (id, lat, lon, type, size, name) {
        this._id = id;
        this._name = name;
        this._lat = lat;
        this._lon = lon;
        this._size = size;
        this._type = type;
    };
    get id() {
        return this._id;
    };
    get name() {
        return this._name;
    };
    get size() {
        return this._size;
    };
    get lat() {
        return this._lat;
    };
    get lon() {
        return this._lon;
    };
    get type() {
        return this._type;
    };
    toString() {
        return "id " + this._id + ", name " + this._name;
    };
}

class MapObjectModel {
    constructor() {
        this._mapobject = [];
    };
    addMapobjects(mapobject){
        this._mapobject.push(mapobject);
    };
    clearMapObjects(){
        this._mapobject.length = 0;
    };
    get getMapObjects() {
        return this._mapobject;
    };
    //Get GeoJSON of array
};

class User {
    constructor(username, image, xp, lp) {
        this._username = username;
        this._lp = lp;
        this._xp = xp;
        this._image = image;
    };
    get username() {
        return this._username;
    };
    get lp() {
        return this._lp;
    };
    get xp() {
        return this._xp;
    };
    set username(username) {
        return this._username = username;
    };
    set lp(lp) {
        this._lp = lp;
    };
    set xp(xp) {
        this._xp = xp;
    };
    get image() {
        return this._image;
    };
    toString() {
        return "username " + this._username;
    };
}

class ProfileModel {
    constructor() {
        this._user = [];
    };
    addUser(user){
        this._user.push(user);
    }
    clearUser(){
        this._user.length = 0;
    }
    get getProfile(){
        return this._user;
    }
}

var mapobjectmodel = new MapObjectModel();
var profilemodel = new ProfileModel();
var map = 0;
var currentMarkers = [];
var coord = 0;
 
// Functions
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        if (checkConnection() == 'No network connection'){
            alert("You're not connected to the internet! Mostri Tascabili requires an active network connection.");
            //navigator.app.exitApp(); //Close App.
        }        
        
        // USED FOR MOBILE
        //localStorage.setItem('session_id', 'VkCzzcwmJRYCHd3v'); 
        if (navigator.geolocation){
            var options = {
                enableHighAccuracy: true,
                maximumAge: 3000
              };
            var error = function(err){console.warn(`ERROR(${err.code}): ${err.message}`);} 
            navigator.geolocation.getCurrentPosition(success_pos,error,options);
            navigator.geolocation.watchPosition(success_pos,error,options) // Get first location and load map
        } else {
            // Handle
        }
        if (localStorage.getItem("session_id") == null ) {
            getSessionId(); // Itself calls getUser() and mapLoader() to avoid synchronization issues
        } else {
            getUser();
            mapLoader(); //Loads map markers
        }
    }
};

function success_pos(pos){
    coord = pos.coords;
    // DEBUG LOCATION: Spawns hell on emulator logcat
    //console.log("Latitude: "+coord.latitude);
    //console.log("Latitude: "+coord.longitude);

}

//Load map: run only on app start
function mapLoader(){
    console.log("loadMap function called");
    mapboxgl.accessToken = 'pk.eyJ1IjoiZnJlc2hnaWFtbWkiLCJhIjoiY2szOHpjcjgzMGNweDNubmN0OGpzN2NmdiJ9.WR7W60fkc9bJEZx1pAlrJw';
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/dark-v10', // stylesheet location
        center: [9.1895100,45.4642700], // starting position [lng, lat]
        zoom: 9 // starting zoom
    });
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: true, 
        showZoom: false
    }));

    const geolocate = new mapboxgl.GeolocateControl({
        trackUserLocation: true, 
        positionOptions: {
            enableHighAccuracy: true
        },
        showUserLocation: true,
    })
    map.addControl(geolocate);
    map.on('load', function(){
        geolocate.trigger();
    });

    getMapObjects();
    document.getElementById("splash").setAttribute("class", "d-none"); 
    document.getElementById("mappage").setAttribute("class", "d-inline"); 
    map.resize(); // MApBox has issues rendering while div is hiddne: Resize to show correct height and width
    setInterval( function() { getMapObjects(map); }, 60000); // Update map every 60 seconds
};

//Fetch session_id: add to localstorage
function getSessionId() {
    $.ajax({
        method: 'get',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/register.php",
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax getSessionId request");
            let session_id = result.session_id;
            console.log("Session id acquired: "+session_id);
            localStorage.setItem("session_id", session_id);             
        },
        complete: function(){
            getUser();
            mapLoader(); //Loads map markers
        },
        error: function(error){
            console.error(error);
        }
    });
};

//Fetch Userprofile: add to model
function getUser() {
    $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/getprofile.php",
        data: JSON.stringify({session_id :localStorage.getItem("session_id")}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax getUser request");
            console.log(result);
            var user = new User(result.username,result.img,result.xp,result.lp);
            //Profilemodel only contains our profile: check if it's populated already, and empty if positive
            if (profilemodel.getProfile.length != 0)
                profilemodel.clearUser();
            profilemodel.addUser(user);

            // Check if Model has been populated
            // console.log("profile is " +profilemodel.getProfile.length);
            updateUserInfo(); // Populates DOM
        },
        error: function(error){
            console.error(error);
        }
    });
};

//Fetch mapobjects, then calls mapUpdater
function getMapObjects(){
    $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/getmap.php",
        data: JSON.stringify({session_id :localStorage.getItem("session_id")}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax getMapObjects request");
            let mapobjects = result.mapobjects;
            console.log(mapobjects);
            if (mapobjectmodel.getMapObjects.length != 0){
                mapobjectmodel.clearMapObjects();
            } // Model populated: purge it
            for (let i = 0; i<mapobjects.length; i++){
                var mapobject = new MapObject(mapobjects[i].id,
                    mapobjects[i].lat,
                    mapobjects[i].lon,
                    mapobjects[i].type,
                    mapobjects[i].size,
                    mapobjects[i].name);
                mapobjectmodel.addMapobjects(mapobject);
            }
            // Check if Model has been populated
            //console.log(mapobjectmodel.getMapObjects);
        },
        complete: function(){
                mapUpdater();
        },
        error: function(error){
            console.error(error);
        }
    });
};

// Loads Markers on map; called from getMapObjects
function mapUpdater(){
    let mapobjects = mapobjectmodel.getMapObjects;
    //console.log(currentMarkers.length);
    if (currentMarkers.length != 0){
        for (var i = currentMarkers.length - 1; i >= 0; i--) {
            currentMarkers[i].remove();
        }
        currentMarkers = [];
        console.log("Updating markers")
    }

    for (let i = 0; i<mapobjects.length; i++){
        //console.log(mapobjects[i]);
        let element = document.createElement("div");
        element.className = 'marker';
        element.id = mapobjects[i].id;
        
        let size = mapobjects[i].size;

        if (mapobjects[i].type == "CA") {
            if (size == "L") {
                element.style.backgroundImage = 'url("res/icon/svg/donut.svg")';
            } else if (size == "M") {
                element.style.backgroundImage = 'url("res/icon/svg/lollipop.svg")';
            } else {
                element.style.backgroundImage = 'url("res/icon/svg/candy.svg")';
            }
        } else { 
            if (size == "L") {
                element.style.backgroundImage = 'url("res/icon/svg/cthulhu.svg")';
            } else if (size == "M") {
                element.style.backgroundImage = 'url("res/icon/svg/dragon.svg\")';
            } else {
                element.style.backgroundImage = 'url("res/icon/svg/goblin.svg")';
            }
        } 
        
        let oneMarker = new mapboxgl.Marker(element).setLngLat([mapobjects[i].lon, mapobjects[i].lat]).addTo(map);
        // Aggiungo ciascun marker ad una array per poi rimuoverli
        currentMarkers.push(oneMarker);
        element.addEventListener('click', function() {
            mapObjectInfo(mapobjects[i].id);
        });
    }
    console.log(currentMarkers.length +" markers placed on the map.")
};

//Show MapObjectInfo
function mapObjectInfo(id) { 
    var mapobject = "";
    for(i=0; i<mapobjectmodel.getMapObjects.length; i++) {
        if (mapobjectmodel.getMapObjects[i].id == id) {
            mapobject = mapobjectmodel.getMapObjects[i];
            console.log("Fighting: "+mapobject);
        }
    }
    // Chiamata per scaricare l'immagine e impostare tutti i campi
    $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/getimage.php",
        data: JSON.stringify({session_id : localStorage.getItem("session_id"), target_id : id}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax objectImage request");
            document.getElementById("obj_name").innerHTML = mapobject.name;
            document.getElementById("obj_image").src = "data:image/(png|jpg);base64," + result.img;
            let size = mapobject.size;
            if (size == "L") {
                document.getElementById("obj_size").innerHTML = "Size: Large";
                document.getElementById("obj_lp").innerHTML = "50-100";
                document.getElementById("obj_xp").innerHTML = "10";
            } else if (size == "M") {
                document.getElementById("obj_size").innerHTML = "Size: Medium";
                document.getElementById("obj_lp").innerHTML = "25-75";
                document.getElementById("obj_xp").innerHTML = "3";
            } else {
                document.getElementById("obj_size").innerHTML = "Size: Small";
                document.getElementById("obj_lp").innerHTML = "0-50";
                document.getElementById("obj_xp").innerHTML = "1";
            }

            document.getElementById("button_action").addEventListener('click', function() {
                isStillAvailable(id);
            });
            /*
            if (mapobject.type == "CA") {
                if (areYouNearEnough(mapobject.lat, mapobject.lon)){
                    document.getElementById("obj_fight").innerHTML = "Wanna eat this candy?";
                    document.getElementById("button_action").innerHTML = "Eat!"
                } else {
                    document.getElementById("obj_fight").innerHTML = "You're too far from the candy! Get closer!";
                    document.getElementById("button_action").setAttribute('disabled', 'disabled');
                    document.getElementById("button_action").innerHTML = "Eat!"
                }
            } else {
                if (areYouNearEnough(mapobject.lat, mapobject.lon)){
                    document.getElementById("obj_fight").innerHTML = "Wanna fight this monster?";
                    document.getElementById("button_action").innerHTML = "Fight!"
                } else {
                    document.getElementById("obj_fight").innerHTML = "You're too far from the monster! Get closer!";
                    document.getElementById("button_action").setAttribute('disabled', 'disabled');
                    document.getElementById("button_action").innerHTML = "Fight!"
                }
            }
            */

            //DEBUG: Disabled distance check
        if (mapobject.type == "CA") {
                document.getElementById("obj_fight").innerHTML = "Wanna eat this candy?";
                document.getElementById("button_action").innerHTML = "Eat!"
                document.getElementById("result_lp_field").innerHTML = "Potential LP Gain"
                document.getElementById("obj_xp").innerHTML = "0"; // Candies give no XP Gain.
        } else {
            document.getElementById("obj_fight").innerHTML = "Wanna fight this monster?";
            document.getElementById("button_action").innerHTML = "Fight!"
            document.getElementById("result_lp_field").innerHTML = "Potential LP Loss"
        }
        show('mapobjectinfo'); //Page loaded; show to user
        },
        error: function(error){
            console.error(error);
        }
    });
};

function areYouNearEnough(lat, lon) {
    let lat1 = coord.latitude;
    let lon1 = coord.longitude;
    if ((lat1 == lat) && (lon1 == lon)) {
        return true;
    } 
    let theta = lon1 - lon;
    let distance = Math.sin(toRadians(lat1)) * Math.sin(toRadians(lat)) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat)) * Math.cos(toRadians(theta));
    distance = Math.acos(distance);
    distance = toDegrees(distance);
    distance = distance * 60 * 1.1515;
    // Distanza in kilometri
    distance = distance * 1.609344;
    if (distance > 0.05) {
        return false;
    }       
    return true;
}

function toRadians(degrees) {
    var pi = Math.PI;
    return degrees * (pi/180);
}

function toDegrees(radians) {
    var pi = Math.PI;
    return 1/radians * (pi/180);
}

//Show result after fight/eat
function mapObjectResult(id) { 

    // Copy mapobjectmodel, compare with new one. Find a way to get answer before executing rest of code
    var mapobject = "";
    for(i=0; i<mapobjectmodel.getMapObjects.length; i++) {
        if (mapobjectmodel.getMapObjects[i].id == id) {
            mapobject = mapobjectmodel.getMapObjects[i];        
        }
    }

    // Chiamata per combattere
    $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/fighteat.php",
        data: JSON.stringify({session_id : localStorage.getItem("session_id"), target_id : id}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax fighteat request");
            console.log(result)
            let died = result.died;
            profilemodel.getProfile[0].xp = result.xp;
            profilemodel.getProfile[0].lp = result.lp;
            if (died) {
                document.getElementById("life_result").innerHTML = "Oh no, you died!";
                // TODO: Death icon, hide XP & LP
                document.getElementById("result_data").style.display = "none";            
                document.getElementById("result_icon").setAttribute("src", "res/icon/svg/death.svg");
            }
            else if (mapobject.type =="MO") {
                document.getElementById("life_result").innerHTML = "Congratulations, you defeated the monster! You now have:";
                document.getElementById("xp_result").innerHTML = profilemodel.getProfile[0].xp + "XP";
                document.getElementById("lp_result").innerHTML = profilemodel.getProfile[0].lp + "LP";
                document.getElementById("result_data").style.display = "flex";
                // TODO: Win icon
                document.getElementById("result_icon").setAttribute("src", "res/icon/svg/success.svg");
            } else {
                document.getElementById("life_result").innerHTML = "Yummy, sweets! Health restored, current LP/XP:";
                document.getElementById("xp_result").innerHTML = profilemodel.getProfile[0].xp + "XP";
                document.getElementById("lp_result").innerHTML = profilemodel.getProfile[0].lp + "LP";
                document.getElementById("result_data").style.display = "flex";
                // TODO: Win icon
                document.getElementById("result_icon").setAttribute("src", "res/icon/svg/eating.svg");
            }

            //Clone the node to keep the button_action without the old, just used eventListener.
            var clone = document.getElementById("button_action").cloneNode(true);
            document.getElementById("button_action").parentNode.replaceChild(clone, document.getElementById("button_action"));

            getMapObjects();
            getUser(); // Update profile info
            updateUserInfo();
            show('result'); // Page loaded; show to user
        },
        error: function(error){
            console.error(error);
        }
    });    

};

//Show page passed as argument
function show(pagename) {
    hidePages();
    document.getElementById(pagename).setAttribute("class", "d-inline");
    console.log(pagename)
    if (pagename == 'mappage')
        map.resize(); // Investigate
};

//Hide all pages
function hidePages() {
    document.getElementById("mappage").setAttribute("class", "d-none");
    document.getElementById("profile").setAttribute("class", "d-none");
    document.getElementById("ranking").setAttribute("class", "d-none");
    document.getElementById("mapobjectinfo").setAttribute("class", "d-none");
    document.getElementById("result").setAttribute("class", "d-none");
};

//Load user profile page #profile
function loadProfile() {
    if (profilemodel.getProfile[0].username != null)
        document.getElementById("user_username").innerHTML = profilemodel.getProfile[0].username;
    if (profilemodel.getProfile[0].image != null)
        document.getElementById("user_image").setAttribute("src", "data:image/(png|jpg);base64," + profilemodel.getProfile[0].image);

    document.getElementById("user_lp").innerHTML = profilemodel.getProfile[0].lp;
    document.getElementById("user_xp").innerHTML = profilemodel.getProfile[0].xp;

    show("profile");
};

//Updates user info on map
function updateUserInfo() {
    $("#lp_circle").removeClass (function (index, className) {
        return (className.match (/(^|\s)p\S+/g) || []).join(' ');
    }); //REGEX WILDCARD: removes all instances of "p*" in order to reset progressbar percentage
    $("#lp_circle").addClass("p"+profilemodel.getProfile[0].lp)
    $("#lp_text").html("LP: "+profilemodel.getProfile[0].lp);
    $("#xp_text").html("XP: "+profilemodel.getProfile[0].xp);
};

function loadRanking() {
    // Spring cleaning; bye bye leaderboard
    while (document.getElementById("ranking_list").firstChild) {
        document.getElementById("ranking_list").firstChild.remove();
    }

    console.log("loadRanking function called");
    $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/ranking.php",
        data: JSON.stringify({session_id : localStorage.getItem("session_id")}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax ranking request");
            let rank = result.ranking;
            console.log(rank); 
            for (var i = 0; i<20; i++) {
                let a = document.createElement("a");
                a.className = "list-group-item my-3";
                a.id ="rank_item";

                let span = document.createElement("span");
                span.className = 'label label-default label-pill';
                span.innerHTML = i+1 + "°";
                
                if (i == 0)
                    span.style.color = "#d4af37";
                else if (i == 1)
                    span.style.color = "#c0c0c0";
                else if (i == 2)
                    span.style.color = "#cd7f32";
                
                    let img = document.createElement("img");
                img.className = "img-circle mr-4";
                if (rank[i].img == null) {
                    img.setAttribute("src", "res/icon/svg/person.svg");
                } else {
                    img.setAttribute("src", "data:image/(png|jpg);base64," + rank[i].img);
                }
                img.id = "image_rank";

                let div = document.createElement("div");
                div.className = "bmd-list-group-col";

                let p = document.createElement("p");
                p.className = "list-group-item-heading";
                if (rank[i].username != null)
                    p.innerHTML = rank[i].username;
                else 
                    p.innerHTML = "NULL_USERNAME";

                let span2 = document.createElement("span");
                span2.className = "list-group-item-text";
                span2.innerHTML = rank[i].xp + " XP";

                // Inserire l'immagine come nella mappa per XP

                a.append(span);
                a.append(img);
                a.append(div);
                div.append(p);
                div.append(span2);
                document.getElementById("ranking_list").append(a);
            }
            show("ranking");
        },
        error: function(error){
            console.error(error);
            //alert("Could not retreive ranking.");
        }
    });
};

function rename(){
    var rename = prompt("Please enter your name", profilemodel.getProfile[0].username);
    if (rename.length > 15){
        alert("Username too long! You can only insert upt to 15 letters. You inserted "+rename.length+" letters.");
    } else {
        if (rename != null && rename != profilemodel.getProfile[0].username) {
            //AJAX Set Profile
            $.ajax({
                method: 'post',
                url:"https://ewserver.di.unimi.it/mobicomp/mostri/setprofile.php",
                data: JSON.stringify({session_id :localStorage.getItem("session_id"), username: rename}),
                dataType: 'json',
                success: function(result) {
                    console.log("Successful ajax setProfile request");
                },
                complete: function(){
                    getUser();
                    document.getElementById("user_username").innerHTML = rename;
                },
                error: function(error){
                    console.error(error);
                }
            });
        }
    }
}

function changeProfilePic(){
    // Retrieve image file location from specified source
    navigator.camera.getPicture(cameraCallback, cameraError, { quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        correctOrientation: true,
        mediaType: Camera.MediaType.PICTURE, 
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM});
}

function cameraCallback(imageData) {
    if(imageData.length >= 137000){
        alert("The image you picked is too big! Please select an image smaller than 100kb.");
    }else{
        // AJAX: Set new ProfilePic
        $.ajax({
            method: 'post',
            url:"https://ewserver.di.unimi.it/mobicomp/mostri/setprofile.php",
            data: JSON.stringify({session_id :localStorage.getItem("session_id"), img: imageData}),
            dataType: 'json',
            success: function(result) {
                console.log("Successful ajax setProfile request");
            },
            complete: function(){
                getUser(); // Updates model
                var image = document.getElementById("user_image");
                image.src = "data:image/jpeg;base64," +imageData;
            },
            error: function(error){
                console.log("ERROR: Image too big, has a filesize bigger than of 100kb.")
                alert("The image you picked is too big! Please select an image smaller than 100kb.");
                console.error(error);
            }
        });
    }
 }

function cameraError(imageData) {
    console.log("ERROR: Could not retreive image.")
 }

 function isStillAvailable(id){
     // Check for mob
     var check = 0;

     for(i=0; i<mapobjectmodel.getMapObjects.length; i++) {
        if (mapobjectmodel.getMapObjects[i].id == id) {
            currentMapobject = mapobjectmodel.getMapObjects[i];        
        }
    }

     $.ajax({
        method: 'post',
        url:"https://ewserver.di.unimi.it/mobicomp/mostri/getmap.php",
        data: JSON.stringify({session_id :localStorage.getItem("session_id")}),
        dataType: 'json',
        success: function(result) {
            console.log("Successful ajax isStillAvailable request");
            let mapobjects = result.mapobjects;
            for (i = 0; i < mapobjects.length; i++){
                if (currentMapobject.id == mapobjects[i].id && currentMapobject.lat == mapobjects[i].lat && currentMapobject.lon == mapobjects[i].lon){
                    check++;
                    mapObjectResult(id)
                }
            }
            
            if (check == 0){
                if (currentMapobject.type =="MO") {
                    alert("Uh-oh! The monster has already been defeated.")
                    show("mappage");
                } else {
                    alert("Uh-oh! The candy has alreaxdy been eaten.") 
                    show("mappage");
                }
                var clone = document.getElementById("button_action").cloneNode(true);
                document.getElementById("button_action").parentNode.replaceChild(clone, document.getElementById("button_action"));
                getMapObjects();
            }
        },
        complete: function(){

        },
        error: function(error){
            console.error(error);
        }
    });

 }

 function checkConnection() {
    var networkState = navigator.connection.type;
 
    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';
 
    return states[networkState];
}