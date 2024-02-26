// Variables

const levelsFolder = './assets/levels/';
const colourPath = "./assets/colours.json";
const imagesFolder = './assets/images/';

const levelNames = [
    "t1",
    "t2",
    "t3",
    "b1",
    "b2",
    "b3",
    "a1",
    "a2"
]

var starLocations = {};
var starCount = 0;

var removedGates = [];


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


var resetDeathMessageTimeout;

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



function Interface_DisplayDeathMessage(message) {

    document.getElementById("LevelHelp").style.color = "#e8202a";
    document.getElementById("LevelHelp").innerHTML = "(!) " + message;

    if (resetDeathMessageTimeout) {

        clearTimeout(resetDeathMessageTimeout);
        resetDeathMessageTimeout = null;
        
    }

    resetDeathMessageTimeout = setTimeout(function() {
        document.getElementById("LevelHelp").style.color = "#ffffff50";
        document.getElementById("LevelHelp").innerHTML = "(?) " + Level.levelDescription;
    }, 2000)

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



function IncrementStarCount(level, reason) {

    if (starLocations[level]) {

        if (starLocations[level][reason]) { return; }

        starLocations[level][reason] = true;

    } else {

        starLocations[level] = {}
        starLocations[level][reason] = true;

    }

    starCount += 1;

    var starIcon = "<img id='StarCount_Image' src='/assets/images/ActiveStar.png'></img>"
    document.getElementById("StarCount").innerHTML = starIcon + starCount + "/" + (levelNames.length * 3);

}



// Function needs to be called before variables are wiped!
function Interface_UpdateStars() {

    IncrementStarCount(levelNames[currentLevel], "Completion");

    // Star 1
    document.getElementById("LevelComplete_Star1Label").innerHTML = "Moves (" + movesMade + " / " + Level.perfectMoveCount + ")";

    if (movesMade > Level.perfectMoveCount) {
        document.getElementById("LevelComplete_Star1").src = "/assets/images/InactiveStar.png";
        document.getElementById("LevelComplete_Star1").style.opacity = 0.6;
        document.getElementById("LevelComplete_Star1Label").style.color = "#ffffff50";
    } else {
        document.getElementById("LevelComplete_Star1").src = "/assets/images/ActiveStar.png";
        document.getElementById("LevelComplete_Star1").style.opacity = 1;
        document.getElementById("LevelComplete_Star1Label").style.color = "#36ce31";

        IncrementStarCount(levelNames[currentLevel], "Perfection");
    }

    // Star 3
    var timeDifference = Date.now() - timerBeganAt
    var formattedTimeDifference = Math.round(timeDifference / 100) / 10 + "s"
    var formattedPerfectTime = Level.perfectTime / 1000 + "s"

    document.getElementById("LevelComplete_Star3Label").innerHTML = "Time (" + formattedTimeDifference + " / " + formattedPerfectTime + ")";

    if (timeDifference > Level.perfectTime) {
        document.getElementById("LevelComplete_Star3").src = "/assets/images/InactiveStar.png";
        document.getElementById("LevelComplete_Star3").style.opacity = 0.6;
        document.getElementById("LevelComplete_Star3Label").style.color = "#ffffff50";
    } else {
        document.getElementById("LevelComplete_Star3").src = "/assets/images/ActiveStar.png";
        document.getElementById("LevelComplete_Star3").style.opacity = 1;
        document.getElementById("LevelComplete_Star3Label").style.color = "#36ce31";

        IncrementStarCount(levelNames[currentLevel], "Agility");
    }

}



function Level_Import(levelName, callback) {

    // If there's no level, roll credits
    if (!levelName) {
        document.getElementById("LevelScreen").style.visibility = "collapse";
        document.getElementById("CreditsScreen").style.visibility = "visible";
        return;
    }

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
   
            newTile.style.backgroundColor = Colour_GetContrast(Level.backgroundColour) + "50";
   
        }

        return;

    }

    
    var newTileIcon = document.createElement("img");
    newTileIcon.src = imagesFolder + tileData.subType + ".svg"
    newTileIcon.classList.add('TileIcon');
    newTile.appendChild(newTileIcon);

    if (Colours[Level.backgroundColour].invertNeutralColour == true) { newTileIcon.style.filter = "invert(100%)"}

    if (tileData.subType == "Resetter" || tileData.subType == "End" || tileData.subType == "Danger" ) { return; }


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



function Grid_Polish() {

    for (x = 0; x < Level.Size; x++) 
    {
        for (y = 0; y < Level.Size; y++) 
        {
            // Detect neighbours
            var tileElement = document.getElementById(x + "/" + y);
            if (Level.Layout[x][y].Type != "Wall") { continue; }

            tileElement.style.borderRadius = "0";
        }
    }

    for (x = 0; x < Level.Size; x++) 
    {
        for (y = 0; y < Level.Size; y++) 
        {
            // Detect neighbours
            var tileElement = document.getElementById(x + "/" + y);
            if (Level.Layout[x][y].Type != "Wall") { continue; }

            var leftNeighbourExists = (!Level.Layout[x][y - 1] || (Level.Layout[x][y - 1].Type == "Wall" && Level.Layout[x][y - 1].Colour != playerColour)) ? false : true;
            var rightNeighbourExists = (!Level.Layout[x][y + 1] || (Level.Layout[x][y + 1].Type == "Wall" && Level.Layout[x][y + 1].Colour != playerColour)) ? false : true;

            var topNeighbourExists = (!Level.Layout[x - 1] || (Level.Layout[x - 1][y].Type == "Wall" && Level.Layout[x - 1][y].Colour != playerColour)) ? false : true;
            var bottomNeighbourExists = (!Level.Layout[x + 1] || (Level.Layout[x + 1][y].Type == "Wall" && Level.Layout[x + 1][y].Colour != playerColour)) ? false : true;

            // Update borders
            tileElement.style.borderRadius = "0";
            tileElement.style.transitionProperty = "";

            if (leftNeighbourExists == true && topNeighbourExists == true) 
            { 
                tileElement.style.borderTopLeftRadius = "2vh"; tileElement.style.transitionProperty = "border-radius"
            }
            
            if (rightNeighbourExists == true && topNeighbourExists == true) 
            { 
                tileElement.style.borderTopRightRadius = "2vh"; tileElement.style.transitionProperty = "border-radius"
            }

            if (leftNeighbourExists == true && bottomNeighbourExists == true) 
            { 
                tileElement.style.borderBottomLeftRadius = "2vh"; tileElement.style.transitionProperty = "border-radius"
            }

            if (rightNeighbourExists == true && bottomNeighbourExists == true) 
            { 
                tileElement.style.borderBottomRightRadius = "2vh"; tileElement.style.transitionProperty = "border-radius"
            }

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

    if (playerColour == newColour) { return; }

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


    // Polish Grid
    Grid_Polish();

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
    if (newTileData.subType == "Gate" && (newTileData.Colour != playerColour)) { return; }

    // Update our position
    PosX = newX;
    PosY = newY;

    // Update our icon
    Player_UpdateIconLocation();

    // Update Move Counter
    movesMade += 1;
    Interface_UpdateMoveCount(movesMade, Level.perfectMoveCount)

    // Start timer if necessary
    Interface_BeginTimer();

    // Trigger node functions
    if (newTileData.Type != "Node") {  return;   }

    if (newTileData.subType == "Resetter") {
            
        Player_ChangeColour(Level.backgroundColour);

    } else if (newTileData.subType == "Setter") {

        Player_ChangeColour(newTileData.Colour);

    } else if (newTileData.subType == "Danger") {

        Interface_DisplayDeathMessage("Avoid the skulls")
        Level_Restart();

    } else if (newTileData.subType == "Launcher") {


    } else if (newTileData.subType == "Gate") {

        // Because of a check earlier, we have to be the same colour as the gate
        Level.Layout[PosY][PosX] = {}
        removedGates[removedGates.length] = {"x": PosX, "y": PosY, colour: newTileData.Colour }

        document.getElementById(PosY + "/" + PosX).getElementsByClassName("TileIcon")[0].remove();
        document.getElementById(PosY + "/" + PosX).getElementsByClassName("TileIconBackground")[0].remove();

    } else if (newTileData.subType == "Mixer") {

        var mixedColour = "_Error";
        var mixTable = Colours[newTileData.Colour].mixWith;

        if (playerColour == "White" || playerColour == newTileData.Colour) {

            mixedColour = newTileData.Colour

        } 
        else if (mixTable && mixTable[playerColour]) {

            mixedColour = mixTable[playerColour]

        } else {

            Interface_DisplayDeathMessage("You can't make that")

            Level_Restart();
            return;
            
        }

        Player_ChangeColour(mixedColour);

    }
    else if (newTileData.subType == "End") {

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
    movesMade = 0;

    // Create the grid
    Grid_Create();

    // Change the player's colour
    Player_ChangeColour(Level.backgroundColour);

    // User Interface    
    document.getElementById("LevelTitle").innerHTML = Level.levelOrder + ": " + Level.levelName;
    document.getElementById("LevelHelp").innerHTML = "(?) " + Level.levelDescription;
    Interface_UpdateMoveCount(movesMade, Level.perfectMoveCount);

    document.getElementById("LevelScreen").style.visibility = "visible";
    document.getElementById("LevelScreen").style.opacity = "1";

    // Allow us to move
    inGame = true;

}



function Level_End() {

    // Update Stars
    Interface_UpdateStars();

    // Wipe Variables
    Level = {};
    removedGates = [];
    playerColour = null;
    PosX = 0;
    PosY = 0;
    inGame = false;

    // End timer
    Interface_EndTimer();

    // Update UI
    document.getElementById("LevelCompleteOverlay").style.visibility = "visible";
    document.getElementById("LevelCompleteOverlay").style.opacity = "1";

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
    
    // Update our level number
    currentLevel += 1;

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
    
    // Reconstruct Gates
    for (i = 0; i < removedGates.length; i++) {

        var d = removedGates[i];

        Level.Layout[d.y][d.x] = { "Type": "Node", "subType": "Gate", "Colour": d.colour }

        var newTileIcon = document.createElement("img");
        newTileIcon.src = imagesFolder + "Gate.svg";
        newTileIcon.classList.add('TileIcon');
        document.getElementById(d.y + "/" + d.x).appendChild(newTileIcon);

        if (Colours[Level.backgroundColour].invertNeutralColour == true) { newTileIcon.style.filter = "invert(100%)"}

        var newTileBackground = document.createElement("div");
        newTileBackground.classList.add('TileIconBackground');
        newTileBackground.style.backgroundColor = Colours[d.colour].Hex;   
        document.getElementById(d.y + "/" + d.x).appendChild(newTileBackground);

    }

    removedGates = [];
}
 


function Level_Retry() {

    // Are we in game?
    if (inGame == true) { return; }

    // Update UI
    document.getElementById("LevelCompleteOverlay").style.opacity = "0";

    setTimeout(function() 
    {
        document.getElementById("LevelCompleteOverlay").style.visibility = "collapse";
    }, 300)
    
    // Clear Grid
    $('.Tile').remove();

    // Reload level
    Level_Import(levelNames[currentLevel], Level_Load);

}


function ReturnToMenu() {

    currentLevel = 0;
    
    document.getElementById("TitleScreen").style.opacity = 1;
    document.getElementById("TitleScreen").style.visibility = "visible";
    document.getElementById("CreditsScreen").style.visibility = "collapse";

}


// execution
document.addEventListener("keydown", (ev) => {

    if (ev.code == "KeyW" || ev.code == "ArrowUp") {

        Player_Move(0, -1);

    } else if (ev.code == "KeyS" || ev.code == "ArrowDown") {

        Player_Move(0, 1);

    } else if (ev.code == "KeyD" || ev.code == "ArrowRight") {

        Player_Move(1, 0);
       
    } else if (ev.code == "KeyA" || ev.code == "ArrowLeft") {

        Player_Move(-1, 0);
           
    } else if (ev.code == "KeyR" ) {

        if (inGame == true) {
            Level_Restart();
        } else {
            Level_Retry();
        }
       
           
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
document.getElementById("RetryButton").addEventListener("mouseup", (ev) => Level_Retry());
document.getElementById("ReturnToMenuButton").addEventListener("mouseup", (ev) => ReturnToMenu());

Colour_Import();
document.getElementById("StarCount").innerHTML = "<img id='StarCount_Image' src='/assets/images/ActiveStar.png'></img>0/" + (levelNames.length * 3);

// MINOR BUG: Setting node colour to black makes it impossible to see the outline

// FEATURE: Make launchers work! Create final level!

// MODERATE BUG: Star clips of the left edge of the screen when star count is 4 characters long