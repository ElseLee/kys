/*global Phaser*/

var game = new Phaser.Game(600, 450, Phaser.AUTO, 'KYSContainer');

game.States = {};

var upKey;
var downKey;
var leftKey;
var rightKey;

// x & y values of the direction vector for character movement
var dX=0;
var dY=0;
// the width of a tile
var tileWidth=18;
var heroTileWidth=12;
var mmapSize=480;
var smapSize=64;
// to centralize the isometric level display
var borderOffset = new Phaser.Point(0,0);
var sorcerer;// hero
// this is the render texture onto which we draw depth sorted scene
var gameScene;
var mmapSprite;
// hero tile values in array
var heroMapTile;
// 2D coordinates of hero map marker sprite in minimap, assume this is mid point
// of graphic
var heroMapPos;
// well, speed of our hero
var heroSpeed=tileWidth; 

game.States.mmap=function() {
    // preload function
    this.preload=function() {
        // load all necessary assets
        game.load.atlasJSONArray('mpic', 'assets/mpic.png', 'assets/mpic.json');
        game.load.json('mmapEarth', 'assets/mmap/mmapEarth.json');
        game.load.json('mmapSurface', 'assets/mmap/mmapSurface.json');
        game.load.json('mmapBuilding', 'assets/mmap/mmapBuilding.json');
        game.load.json('mmapBuildXY', 'assets/mmap/mmapBuildXY.json');
        game.load.json('mmapEntrance', 'assets/mmap/mmapEntrance.json');
    }
    
    // create function
    this.create=function() {
        game.add.sprite(0, 0, gameScene);
        mmapSprite = new Array();
        // earth
        for (var i=0;i<=477;i++) {
            mmapSprite[i] = game.make.sprite(0, 0, 'mpic', i+".png");
            mmapSprite[i].anchor.set(0.5, 1);
        }
        for (var i=500;i<=511;i++) {
            mmapSprite[i] = game.make.sprite(0, 0, 'mpic', i+".png");
            mmapSprite[i].anchor.set(0.5, 1);
        }
        // surface
        for (var i=701;i<=909;i++) {
            mmapSprite[i] = game.make.sprite(0, 0, 'mpic', i+".png");
            mmapSprite[i].anchor.set(0.5, 1);
        }
        // building
        for (var i=1001;i<=1245;i++) {
            mmapSprite[i] = game.make.sprite(0, 0, 'mpic', i+".png");
            mmapSprite[i].anchor.set(0.5, 1);
        }
        for (var i=1348;i<=1445;i++) {
            mmapSprite[i] = game.make.sprite(0, 0, 'mpic', i+".png");
            mmapSprite[i].anchor.set(0.5, 1);
        }
        // createLevel();
        addHero();
        sorcerer.frame=sorcerer.initialFrameMap[game.save.facing]
        heroMapTile=new Phaser.Point(game.save && game.save.mx, game.save && game.save.my);
        heroMapPos=new Phaser.Point(heroMapTile.x * tileWidth+tileWidth/2,heroMapTile.y * tileWidth+tileWidth/2);
        // draw once the initial state
        renderMap();
    }
    // update function
    this.update=function(){
        // check key press
        detectKeyInput();
        // if no key is pressed then stop else play walking animation
        if (dY == 0 && dX == 0) {
            if (this.justStop){
                if (this.still++ >600) {
                    sorcerer.animations.play(game.save.facing+"Still");
                    renderMap();
                }
            } else {
                this.justStop=true;
                this.still=0;
                sorcerer.animations.stop();
                sorcerer.frame=sorcerer.initialFrameMap[game.save.facing];
                renderMap();
                game.save.mx= heroMapTile.x;
                game.save.my= heroMapTile.y;
                document.location.hash=JSON.stringify(game.save);
            }
            return;
        } else {
            this.justStop=false;
            sorcerer.animations.play(game.save.facing);
        }
        
        if("undefined" == typeof game.check) {
            game.check=0;
        }
        if (game.device.desktop && game.check++ % 3!=0) {
            return;
        }
        // check if we are walking into a wall else move hero in 2D
        if (isWalkable()) {
            heroMapPos.x +=  heroSpeed * dX;
            heroMapPos.y +=  heroSpeed * dY;
            // get the new hero map tile
            heroMapTile=getTileCoordinates(heroMapPos,tileWidth);
            // depthsort & draw new scene
            renderMap();
            var mmapEntrance = game.cache.getJSON('mmapEntrance');
            var entrance = mmapEntrance[heroMapTile.x+'_'+heroMapTile.y];
            if (typeof entrance != 'undefined') {
                game.save.where='smap';
                game.save.curscence= entrance.scene;
                game.save.sx = entrance.sx;
                game.save.sy = entrance.sy;
                document.location.hash=JSON.stringify(game.save);
                // jump
                game.state.start(game.save.where);
            }
        }
    }
}

game.States.smap=function() {
    // preload function
    this.preload=function() {
        game.load.json('spicOffset', 'assets/scene/spic.json');
        game.load.json('scene', 'assets/scene/scene_'+game.save.curscence+'.json');
        // spic 0 - 698
        game.load.atlasJSONArray('spic_0', 'assets/spic_0.png', 'assets/spic_0.json');
        // spic 701 - 2493 (1793)
        game.load.atlasJSONArray('spic_b', 'assets/spic_b.png', 'assets/spic_b.json');
        // spic 2529 - 3633, 3701 - 4130 (1105 + 430 = 1535)
        game.load.atlasJSONArray('spic_m', 'assets/spic_m.png', 'assets/spic_m.json');
    }

    // create function
    this.create=function() {
        game.add.sprite(0, 0, gameScene);
        smapSprite = new Array();
        for (var i=0;i<=698;i++) {
            smapSprite[i] = game.make.sprite(0, 0, 'spic_0', i+".png");
            // smapSprite[i].anchor.set(0.5, 1);
        }
        for (var i=701;i<=2493;i++) {
            smapSprite[i] = game.make.sprite(0, 0, 'spic_b', i+".png");
            // smapSprite[i].anchor.set(0.5, 1);
        }
        for (var i=2529;i<=3633;i++) {
            smapSprite[i] = game.make.sprite(0, 0, 'spic_m', i+".png");
            // smapSprite[i].anchor.set(0.5, 1);
        }
        for (var i=3701;i<=4130;i++) {
            smapSprite[i] = game.make.sprite(0, 0, 'spic_m', i+".png");
            // smapSprite[i].anchor.set(0.5, 1);
        }
        // createScene();
        addHero();
        sorcerer.frame=sorcerer.initialFrameMap[game.save.facing]
        heroMapTile=new Phaser.Point(game.save && game.save.sx, game.save && game.save.sy);
        heroMapPos=new Phaser.Point(heroMapTile.x * tileWidth+tileWidth/2,heroMapTile.y * tileWidth+tileWidth/2);
        renderMap();// draw once the initial state
    }

    // update function
    this.update=function(){
        // check key press
        detectKeyInput();
        // if no key is pressed then stop else play walking animation
        if (dY == 0 && dX == 0) {
            if (this.justStop){
                if (this.still++ >600) {
                    sorcerer.animations.play(game.save.facing+"Still");
                    renderMap();
                }
            } else {
                this.justStop=true;
                this.still=0;
                sorcerer.animations.stop();
                sorcerer.frame=sorcerer.initialFrameMap[game.save.facing];
                renderMap();
                game.save.sx= heroMapTile.x;
                game.save.sy= heroMapTile.y;
                document.location.hash=JSON.stringify(game.save);
            }
            return;
        } else {
            this.justStop=false;
            if(sorcerer.animations.currentAnim!=game.save.facing) {
                sorcerer.animations.play(game.save.facing);
            }
        }
        
        if("undefined" == typeof game.check) {
            game.check=0;
        }
        if (game.device.desktop && game.check++ % 3!=0){
            return;
        }
        // check if we are walking into a wall else move hero in 2D
        if (isWalkable()) {
            heroMapPos.x +=  heroSpeed * dX;
            heroMapPos.y +=  heroSpeed * dY;
            // get the new hero map tile
            heroMapTile=getTileCoordinates(heroMapPos,tileWidth);
            // depthsort & draw new scene
            renderMap();
            var scene = game.cache.getJSON('scene');
            var exit = scene.mapExit[heroMapTile.x+'_'+heroMapTile.y];
            if (typeof exit == 'boolean') {
                game.save.where='mmap';
                document.location.hash=JSON.stringify(game.save);
                // jump
                game.state.start(game.save.where);
            }
            if (typeof exit == 'object') {
                game.save.where='smap';
                game.save.curscence= exit.scene;
                game.save.sx = exit.sx;
                game.save.sy = exit.sy;
                document.location.hash=JSON.stringify(game.save);
                // jump
                game.state.start(game.save.where);
            }
        }
    }
}

game.States.boot=function() {
    // preload function
    this.preload=function() {
        if(!game.device.desktop) {
            this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            this.scale.refresh();
        }
        game.load.spritesheet('walk', 'assets/walk.24x50.png', 24, 50);
    }

    this.create=function() {
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        game.stage.backgroundColor = '#000000';
        // we draw the depth sorted scene into this render texture
        gameScene=game.add.renderTexture(game.width, game.height);
        game.add.sprite(0, 0, gameScene);

        game.save = document.location.hash && document.location.hash.length>1 ? JSON.parse(document.location.hash.substr(1)): {};
        game.save.facing = game.save.facing || 'east';
        game.save.where = game.save.where || 'mmap';
        game.save.curscence = game.save.curscence || 70;
        game.save.mx=game.save.mx || 357
        game.save.my=game.save.my || 235
        game.save.sx=game.save.sx || 20;
        game.save.sy=game.save.sy || 19;
        // failed here
        // addHero();
        
        // jump
        game.state.start(game.save.where);
    }
}


game.state.add('mmap', game.States.mmap);
game.state.add('smap', game.States.smap);
game.state.add('boot', game.States.boot);

game.state.start('boot');


function addHero() {
    // sprite
    sorcerer = game.add.sprite(-50, 0, 'walk');// keep him out side screen area
    sorcerer.anchor.set(0.5, 1);
    
    // animation
    var frameRate=12;
    sorcerer.animations.add('south', [22, 23, 24, 25, 26], frameRate, true);
    sorcerer.animations.add('west', [15, 16, 17, 18, 19, 20], frameRate, true);
    sorcerer.animations.add('north', [1, 2, 3, 4, 5, 6], frameRate, true);
    sorcerer.animations.add('east', [8, 9, 10, 11, 12, 13], frameRate, true);
    sorcerer.initialFrameMap={'south':21,'west':14,'north':0,'east':7};
    frameRate=3;
    sorcerer.animations.add('southStill', [21, 21, 21, 21, 46, 47, 48, 49, 50, 51], frameRate, true);
    sorcerer.animations.add('westStill', [14, 14, 14, 14, 40, 41, 42, 43, 44, 45], frameRate, true);
    sorcerer.animations.add('northStill', [0, 0, 0, 0, 28, 29, 30, 31, 32, 33], frameRate, true);
    sorcerer.animations.add('eastStill', [7, 7, 7, 7, 34, 35, 36, 37, 38, 39], frameRate, true);
}

function renderMap() {
    if ("mmap" == game.save.where){
        _renderMmap();
    } else if ("smap" == game.save.where){
        _renderScene();
    }
}
function _renderMmap() {
    gameScene.clear();// clear the previous frame then draw again
    var tileType=0;
    var heroCornerPt=new Phaser.Point(heroMapPos.x,heroMapPos.y);
    // find new isometric position for hero from 2D map position
    var isoPt=cartesianToIsometric(heroCornerPt);
    borderOffset.x = game.width/2 -isoPt.x;
    borderOffset.y = game.height/2 -isoPt.y + tileWidth/2;
    // earth
    var mmapEarth = game.cache.getJSON('mmapEarth'); 
    var mmapSurface = game.cache.getJSON('mmapSurface'); 
    for (var sum = 0; sum<=2* mmapSize -2; sum++) {
        var minX = sum < mmapSize ? 0 : sum- mmapSize + 1;
        for (var cx = minX; cx<=Math.min(sum, mmapSize - 1); cx++) {
            var cartPt = new Phaser.Point(cx, sum-cx);
            if (!checkScreen(cartPt.x, cartPt.y, heroMapTile.x, heroMapTile.y)) {
                continue;
            }
            tileType=mmapEarth[cartPt.y] && mmapEarth[cartPt.y][cartPt.x];
            if (tileType>=0) {
                drawTileIso(tileType,cartPt.y,cartPt.x);
            }
            // surface
            tileType=mmapSurface[cartPt.y] && mmapSurface[cartPt.y][cartPt.x];
            if (tileType!=0) {
                drawTileIso(tileType,cartPt.y,cartPt.x);
            }
        }
    }
    // building
    var mmapBuildXY = game.cache.getJSON('mmapBuildXY'); 
    var mmapBuilding = game.cache.getJSON('mmapBuilding'); 
    var printed={};
    for (var sum = 0; sum<=2* mmapSize -2; sum++) {
        var minX = sum < mmapSize ? 0 : sum- mmapSize + 1;
        for (var cx = minX; cx<=Math.min(sum, mmapSize - 1); cx++){
            var cartPt = new Phaser.Point(cx, sum-cx);
            if (!checkScreen(cartPt.x, cartPt.y, heroMapTile.x, heroMapTile.y)) {
                continue;
            }
            var buildxy=mmapBuildXY[cartPt.y] && mmapBuildXY[cartPt.y][cartPt.x];
            // draw the building squire
            if (buildxy && (buildxy[0]!=0 || buildxy[1]!=0)) {
                // drawTileIso(1,cartPt.y,cartPt.x);
            }
            if (buildxy && (buildxy[0]!=0 || buildxy[1]!=0) && !printed[buildxy[0]+"_"+buildxy[1]]) {
                buildxmy=cartPt.x>0? mmapBuildXY[cartPt.y] && mmapBuildXY[cartPt.y][cartPt.x-1] : null;
                buildxya=cartPt.y+1<mmapBuildXY.length? mmapBuildXY[cartPt.y+1] && mmapBuildXY[cartPt.y+1][cartPt.x] : null;
                // display when max y && min x
                if (!(buildxmy && buildxmy[0] == buildxy[0] && buildxmy[1]== buildxy[1])
                        && !(buildxya && buildxya[0] == buildxy[0] && buildxya[1]== buildxy[1])) {
                    tileType=mmapBuilding[buildxy[1]] && mmapBuilding[buildxy[1]][buildxy[0]];
                    printed[buildxy[0]+"_"+buildxy[1]]=true;
                    tileType && drawTileIso(tileType,buildxy[1],buildxy[0]);
                }
            }
            if(cartPt.y==heroMapTile.y&&cartPt.x==heroMapTile.x) {
                drawHeroIso();
            }
        }
    }
}
function _renderScene() {
    gameScene.clear();// clear the previous frame then draw again
    var tileType=0, xoff=0, yoff=0;
    var heroCornerPt=new Phaser.Point(heroMapPos.x,heroMapPos.y);
    // find new isometric position for hero from 2D map position
    var isoPt=cartesianToIsometric(heroCornerPt);
    borderOffset.x = game.width/2 -isoPt.x;
    borderOffset.y = game.height/2 -isoPt.y + tileWidth/2;
    var scene = game.cache.getJSON('scene');
    var spicOffset = game.cache.getJSON('spicOffset');
    // draw scene
    for (var sum = 0; sum<=2* smapSize -2; sum++) {
            var minX = sum < smapSize ? 0 : sum- smapSize + 1;
        for (var cx = minX; cx<=Math.min(sum, smapSize - 1); cx++) {
            var cartPt = new Phaser.Point(cx, sum-cx);
            if (!checkScreen(cartPt.x, cartPt.y, heroMapTile.x, heroMapTile.y)) {
                continue;
            }
            tileType=scene.mapGround[cartPt.y] && scene.mapGround[cartPt.y][cartPt.x];
            xoff = spicOffset[tileType] && spicOffset[tileType][2];
            yoff = spicOffset[tileType] && spicOffset[tileType][3];
            drawTileIso(tileType,cartPt.y,cartPt.x, xoff, yoff);
            // building
            tileType=scene.mapBuilding[cartPt.y] && scene.mapBuilding[cartPt.y][cartPt.x];
            xoff = spicOffset[tileType] && spicOffset[tileType][2];
            yoff = spicOffset[tileType] && spicOffset[tileType][3];
            var mapBuildingHeight = scene.mapBuildingHeight[cartPt.y] && scene.mapBuildingHeight[cartPt.y][cartPt.x] || 0;
            if (tileType!=0){
                tileType && drawTileIso(tileType,cartPt.y,cartPt.x, xoff, yoff+mapBuildingHeight);
            }
            // item
            tileType=scene.mapItem[cartPt.y] && scene.mapItem[cartPt.y][cartPt.x];
            xoff = spicOffset[tileType] && spicOffset[tileType][2];
            yoff = spicOffset[tileType] && spicOffset[tileType][3];
            var mapItemHeight = scene.mapItemHeight[cartPt.y] && scene.mapItemHeight[cartPt.y][cartPt.x] || 0;
            if (tileType!=0){
                tileType && drawTileIso(tileType,cartPt.y,cartPt.x, xoff, yoff+mapItemHeight);
            }
            if(cartPt.y==heroMapTile.y&&cartPt.x==heroMapTile.x) {
                drawHeroIso(mapBuildingHeight);
            }
            // event
            if (scene.mapEvent[cartPt.y] && scene.mapEvent[cartPt.y][cartPt.x] >= 0){
                var eventNum = scene.mapEvent[cartPt.y][cartPt.x];
                tileType=scene.def[eventNum] && scene.def[eventNum][5];
                xoff = spicOffset[tileType] && spicOffset[tileType][2];
                yoff = spicOffset[tileType] && spicOffset[tileType][3];
                tileType && drawTileIso(tileType,cartPt.y,cartPt.x, xoff, yoff+mapBuildingHeight);
            }
        }
    }
}
function drawHeroIso(height) {
    // drawTileIso(1,heroMapTile.y,heroMapTile.x);
    // draw hero to render texture
    gameScene.renderXY(sorcerer, game.width/2, game.height/2 - ('undefined' != typeof height? height: 0), false);
}
// place isometric level tiles
function drawTileIso(tileType,i,j, xoff, yoff) {
    var cartPt=new Phaser.Point();// This is here for better code readability.
    cartPt.x=j*tileWidth;
    cartPt.y=i*tileWidth;
    var isoPt=cartesianToIsometric(cartPt);
    try{
        if ("smap" == game.save.where){
            smapSprite[tileType] && gameScene.renderXY(smapSprite[tileType], isoPt.x+borderOffset.x - xoff, isoPt.y+borderOffset.y - yoff, false);
        } else {
            mmapSprite[tileType] && gameScene.renderXY(mmapSprite[tileType], isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
        }
    }catch(err){
        console.log(tileType, err);
    }
}
// It is not advisable to create points in update loop,
// but for code readability.
function isWalkable() {
    var heroCornerPt=new Phaser.Point(heroMapPos.x-heroTileWidth/2,heroMapPos.y-heroTileWidth/2);
    var cornerTL =new Phaser.Point();
    cornerTL.x=heroCornerPt.x +  (heroSpeed * dX);
    cornerTL.y=heroCornerPt.y +  (heroSpeed * dY);

    // just check once for always centered
    var newTileCorner=getTileCoordinates(cornerTL,tileWidth);
    if ("mmap" == game.save.where) {
        return _checkTileWalk(newTileCorner.x, newTileCorner.y);
    } else if ("smap" == game.save.where) {
        return _checkTileWalkInScene(newTileCorner.x, newTileCorner.y);
    }
}

function _checkTileWalk(x, y) {
    var mmapEarth = game.cache.getJSON('mmapEarth'); 
    var mmapBuildXY = game.cache.getJSON('mmapBuildXY'); 
    var mmapEntrance = game.cache.getJSON('mmapEntrance');
    var canwalk = true;
    if (y< 0|| y> mmapSize -1 || x<0 || x > mmapSize -1) {
        canwalk = false;
    }
    if (canwalk  && mmapEarth[y] && (mmapEarth[y][x]== 467 || mmapEarth[y][x]== 468)) {
        canwalk = false;
    }
    if (canwalk  && mmapBuildXY[y] && mmapBuildXY[y][x] && mmapBuildXY[y][x][0]!= 0 ) {
        canwalk = false;
    }
    var entrance = mmapEntrance[x+'_'+y]
    if (typeof entrance != 'undefined') {
        canwalk= true;
    }
    return canwalk;
}

function _checkTileWalkInScene(x, y) {
    var canwalk = true;
    if (x<0 || y<0 || x>smapSize -1 || y > smapSize -1) {
        return false;
    }
    var scene = game.cache.getJSON('scene');
    if (scene.mapBuilding[y] && scene.mapBuilding[y][x] > 0){
        canwalk = false;
    }
    if (scene.mapEvent[y] && scene.mapEvent[y][x] >= 0){
        var eventNum = scene.mapEvent[y][x];
        if (scene.def[eventNum] && scene.def[eventNum][0] == 1){
            canwalk = false;
        }
    }
    return canwalk;
}

// assign direction for character & set x,y speed components
function detectKeyInput() {
    dY = dX = 0;
    if (upKey.isDown) {
        dY = -1;
        game.save.facing = "north";
    } else if (downKey.isDown) {
        dY = 1;
        game.save.facing = "south";
    } else if (rightKey.isDown) {
        dX = 1;
        game.save.facing = "east";
    } else if (leftKey.isDown) {
        dX = -1;
        game.save.facing = "west";
    } else if (game.input.activePointer.isDown) {
        var ix = game.input.x;
        var iy = game.input.y;
        if (ix < game.width/4 && iy < game.height/4){
            dX = -1;
            game.save.facing = "west";
        } else if (game.width - ix < game.width/4 && game.height - iy < game.height/4){
            dX = 1;
            game.save.facing = "east";
        } else if (ix < game.width/4 && game.height - iy < game.height/4){
            dY = 1;
            game.save.facing = "south";
        } else if (game.width - ix < game.width/4 && iy < game.height/4){
            dY = -1;
            game.save.facing = "north";
        }
    }
}

function checkScreen(tx, ty, hx, hy) {
    var tempPt=new Phaser.Point();
    tempPt.x=tx - hx;
    tempPt.y=ty - hy;
    return -game.height/tileWidth-5<tempPt.x+tempPt.y && tempPt.x+tempPt.y< game.height/tileWidth+16 &&
    -game.width/2/tileWidth-7<tempPt.x-tempPt.y && tempPt.x-tempPt.y<game.width/2/tileWidth+7;
}
function cartesianToIsometric(cartPt) {
    var tempPt=new Phaser.Point();
    tempPt.x=cartPt.x-cartPt.y;
    tempPt.y=(cartPt.x+cartPt.y)/2;
    return (tempPt);
}
function isometricToCartesian(isoPt) {
    var tempPt=new Phaser.Point();
    tempPt.x=(2*isoPt.y+isoPt.x)/2;
    tempPt.y=(2*isoPt.y-isoPt.x)/2;
    return (tempPt);
}
function getTileCoordinates(cartPt, tileHeight) {
    var tempPt=new Phaser.Point();
    tempPt.x=Math.floor(cartPt.x/tileHeight);
    tempPt.y=Math.floor(cartPt.y/tileHeight);
    return(tempPt);
}
function getCartesianFromTileCoordinates(tilePt, tileHeight) {
    var tempPt=new Phaser.Point();
    tempPt.x=tilePt.x*tileHeight;
    tempPt.y=tilePt.y*tileHeight;
    return(tempPt);
}
