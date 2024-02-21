// Variables

const levelsFolder = './assets/levels/';
const colourPath = "./assets/colours.json";
const imagesFolder = './assets/images/';

const levelNames = [
    "t1",
    "t2",
    "t3"
]

var currentLevel = 0;
var movesMade = 0;

var Colours = {};
var Level = {};

var PosX = 0;
var PosY = 0;

var timerInterval;
var timerBeganAt = 0;
var timerDate = new Date(0);

var playerColour;
var inGame = false;

// Functions

function playSound(soundName) {

    var audio = new Audio('/assets/sounds/' + soundName + '.mp3');
    audio.volume = 0.1;
    audio.play();

}



function Interface_UpdateMoveCount(Moves, perfectMoveCount) {

    document.getElementById("LevelMoveCounter").innerHTML = movesMade + " / " + perfectMoveCount;

    if (Moves > perfectMoveCount) {
        
        document.getElementById("LevelMoveCounter").style.color = "#ffffff";

    } else {
        
        document.getElementById("LevelMoveCounter").style.color = "#36ce31";

    }

}



function Interface_BeginTimer() {

    if (timerBeganAt != 0 || inGame == false) { return; }

    document.getElementById("LevelTimer").style.color = "#36ce31";

    timerBeganAt = Date.now();
    timerInterval = setInterval(Interface_UpdateTimer, 100);

}



function Interface_UpdateTimer() {

    var timeDifference = Date.now() - timerBeganAt
    timerDate.setTime(timeDifference);

    if (timeDifference > Level.perfectTime) {
        document.getElementById("LevelTimer").style.color = "#ffffff";
    }
    

    var timeString = timerDate.toISOString().substring(15, 21);
    document.getElementById("LevelTimer").innerHTML = timeString;

}



function Interface_EndTimer() {

    clearInterval(timerInterval);

    timerBeganAt = 0;

    document.getElementById("LevelTimer").style.color = "#ffffff50";
    document.getElementById("LevelTimer").innerHTML = "0:00.0";

}



function Level_Import(levelName, callback) {

    var levelPath = levelsFolder + levelName + ".json";
    
    $.ajax({
        url: levelPath,
        type: 'get',
        success: function(json) {  
            callback(json);
        }
        
    });

}



function Colour_Import() {

    $.ajax({
        url: colourPath,
        type: 'get',
        async: false,
        success: function(data) {
            Colours = data;
        }
    });
   
}



function Colour_GetContrast(ColourName) {

    var InvertContrast = Colours[ColourName].invertNeutralColour;
    
    var ContrastColour = "#ffffff";
    if (InvertContrast == true) { ContrastColour = "#000000" }
    
    return ContrastColour;

}



function Tile_New(tileData, sizePercentage) {

    // Create the basic tile
    var newTile = document.createElement("div");
    newTile.style.width = sizePercentage;
    newTile.style.height = sizePercentage;

    newTile.classList.add('Tile');
    newTile.setAttribute("id", x.toString() + "/" + y.toString());

    document.getElementById("LevelGrid").appendChild(newTile);


    // If it's an empty tile, we don't need to do anything else
    if (!tileData.Type) { return; }

    if (tileData.Type == "Wall") {

        if (tileData.Colour) {

            newTile.style.backgroundColor = Colours[tileData.Colour].Hex;
   
        } else {
   
            newTile.style.backgroundColor = Colour_GetContrast(playerColour) + "50";
   
        }

        return;

    }

    
    var newTileIcon = document.createElement("img");
    newTileIcon.src = imagesFolder + tileData.subType + ".svg"
    newTileIcon.classList.add('TileIcon');
    newTile.appendChild(newTileIcon);

    if (Colours[Level.backgroundColour].invertNeutralColour == true) { newTileIcon.style.filter = "invert(100%)"}

    if (tileData.subType == "Resetter" || tileData.subType == "End") { return; }


    var newTileBackground = document.createElement("div");
    newTileBackground.classList.add('TileIconBackground');
    newTile.appendChild(newTileBackground);
    
    newTileBackground.style.backgroundColor = Colours[tileData.Colour].Hex;   

}



function Grid_Create() {

    // clear current grid
    var gridTiles = document.getElementsByClassName("TileContainer").length;
    var levelGrid = document.getElementsByClassName("LevelGrid");

    for (i = 0; i < gridTiles.length; i++) { levelGrid.removeChild(gridTiles[i]); }

    // Calculate how big the tiles should be
    var sizePercentage = (100 / Level.Size) + "%";

    // Create the tiles
    for (x = 0; x < Level.Size; x++) 
    {
        for (y = 0; y < Level.Size; y++) 
        {
            Tile_New(Level.Layout[x][y], sizePercentage);
        }
    }

}



function Level_ObtainLayout(levelData) {
    
    var obtainedLayout = [];

    for (var x = 0; x < levelSize; x++) {

        obtainedLayout[x] = [];
        var rowData = levelData[x + 5].toString().split("||");

        for (var y = 0; y < levelSize; y++) {

            var tileData = rowData[y].split(":");
            
            obtainedLayout[x][y] = {
                Type: tileData[0],
                Colour: tileData[1],
                Metadata: tileData[2],
            }

        }

    }
    
    return obtainedLayout;

}



function Player_ChangeColour(newColour) {

    var colourHex = Colours[newColour].Hex;
    
    document.getElementById("LevelGrid").style.backgroundColor = colourHex;
    document.getElementById("Player").style.backgroundColor = Colour_GetContrast(newColour);

    playerColour = newColour;


    // Modify Tile Images
    var invertString = ""
    if (Colours[playerColour].invertNeutralColour == true) { invertString = "invert(100%)"}

    var tileIcons = document.getElementsByClassName("TileIcon")

    for (var i = 0; i < tileIcons.length; i++){
        tileIcons[i].style.filter = invertString;
    }
}



function Player_Move(x, y) {

    // Are we in game?
    if (inGame == false) { return; }

    var newX = PosX + x;
    var newY = PosY + y;

    // Check 1: Out of bounds?
    if (!Level.Layout[newY] || !Level.Layout[newY][newX]) { return; }

    // Check 2: Wall in the way and we're not the same colour?
    var newTileData = Level.Layout[newY][newX];
    if (newTileData.Type == "Wall" && (newTileData.Colour != playerColour)) { return; }

    // Update our position
    PosX = newX;
    PosY = newY;

    // Update our icon
    Player_UpdateIconLocation();

    // Update Move Counter
    movesMade += 1;
    Interface_UpdateMoveCount(movesMade, Level.perfectMoveCount)

    // Trigger node functions
    if (newTileData.Type != "Node") { return; }
        
    if (newTileData.subType == "Resetter") {
            
        Player_ChangeColour(Level.backgroundColour);

    } else if (newTileData.subType == "Setter") {

        Player_ChangeColour(newTileData.Colour);

    } else if (newTileData.subType == "End") {

       Level_End();

    }

}



function Player_UpdateIconLocation() {

    var player = document.getElementById("Player");
    var offset = (75 / Level.Size) / 6

    player.style.left = ((100 / Level.Size * PosX) + offset) + "%";
    player.style.top = ((100 / Level.Size * PosY) + offset) + "%";

}



function Player_Initialize(spawnX, spawnY, levelSize) {

    var player = document.getElementById("Player");

    // Handle Size
    var widthNum = 75 / levelSize;
    var heightNum = 75 / levelSize;

    player.style.width = widthNum.toString() + "%";
    player.style.height = heightNum.toString() + "%";

    // Handle Position
    PosX = spawnX;
    PosY = spawnY;
    
    Player_UpdateIconLocation();


}



function Level_Load(levelData) {

    // Initialize
    Level = levelData;
    Player_Initialize(Level.spawnLocation.x, Level.spawnLocation.y, Level.Size);
    Player_ChangeColour(Level.backgroundColour);
    movesMade = 0;

    // Create the grid
    Grid_Create();

    // User Interface    
    document.getElementById("LevelTitle").innerHTML = Level.levelOrder + ": " + Level.levelName;
    document.getElementById("LevelDescription").innerHTML = "(?) " + Level.levelDescription;
    Interface_UpdateMoveCount(movesMade, Level.perfectMoveCount);

    document.getElementById("LevelScreen").style.visibility = "visible";
    document.getElementById("LevelScreen").style.opacity = "1";

    // Allow us to move
    inGame = true;

}



function Level_End() {

    // Wipe Variables
    Level = {};
    playerColour = null;
    PosX = 0;
    PosY = 0;
    inGame = false;

    // End timer
    Interface_EndTimer();

    // Update UI
    document.getElementById("LevelCompleteOverlay").style.visibility = "visible";
    document.getElementById("LevelCompleteOverlay").style.opacity = "1";

    // Update our level number
    currentLevel += 1;

}



function ReturnToMenu() {

    document.getElementById("TitleScreen").style.visibility = "visible";
    document.getElementById("TitleScreen").style.opacity = "1";

}



function Event_PlayButtonReleased() {

    document.getElementById("TitleScreen").style.opacity = "0";

    setTimeout(function() 
    {
        document.getElementById("TitleScreen").style.visibility = "collapse";
    }, 300)

    Level_Import(levelNames[currentLevel], Level_Load);
    
}



function Level_Continue() {

    // Is In Game?
    if (inGame == true) { return; }

    // Clear Grid
    $('.Tile').remove();

    // Update UI
    document.getElementById("Player").style.backgroundColor = "#00000000";
    document.getElementById("LevelCompleteOverlay").style.opacity = "0";

    setTimeout(function() 
    {
        document.getElementById("LevelCompleteOverlay").style.visibility = "collapse";
    }, 300)

    // Load next level
    Level_Import(levelNames[currentLevel], Level_Load);

}



function Level_Restart() {

    // Are we in game?
    if (inGame == false) { return; }

    // Restart timer
    Interface_EndTimer();

    // Reset the players location
    PosX = Level.spawnLocation.x;
    PosY = Level.spawnLocation.y;

    Player_UpdateIconLocation();

    // Reset the player's colour
    Player_ChangeColour(Level.backgroundColour);

    // Reset the player's move count
    movesMade = 0;
    Interface_UpdateMoveCount(movesMade, Level.perfectMoveCount)

}
 


// execution
document.addEventListener("keydown", (ev) => {

    if (ev.code == "KeyW" || ev.code == "ArrowUp") {

        Interface_BeginTimer();
        Player_Move(0, -1);

    } else if (ev.code == "KeyS" || ev.code == "ArrowDown") {

        Interface_BeginTimer();
        Player_Move(0, 1);

    } else if (ev.code == "KeyD" || ev.code == "ArrowRight") {

        Interface_BeginTimer();
        Player_Move(1, 0);
       
    } else if (ev.code == "KeyA" || ev.code == "ArrowLeft") {

        Interface_BeginTimer();
        Player_Move(-1, 0);
           
    } else if (ev.code == "KeyR" ) {

        Interface_BeginTimer();
        Level_Restart();
           
    } else if (ev.code == "Enter" ) {

        if (inGame == true) { return; }

        if (currentLevel == 0) {  

            Event_PlayButtonReleased();

        } else {
            
            Level_Continue();

        }

    }

});

document.getElementById("PlayButton").addEventListener("mouseup", (ev) => Event_PlayButtonReleased());
document.getElementById("ContinueButton").addEventListener("mouseup", (ev) => Level_Continue());
document.getElementById("RestartButton").addEventListener("mouseup", (ev) => Level_Restart());


Colour_Import();

// MINOR BUG: Setting node colour to black makes it impossible to see the outline