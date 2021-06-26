console.log('LOAD');
//Master Field Data Object:
//FieldDataMaster[KEY][LABEL, GROUP, TYPE, [ VALUE, MIN, MAX, STEP, FUNCTION ] ]
FieldDataMaster = {
  testButton: ['Test Spin', 'Testing', 'button'],
  _info1: ['Middleware provided by lx', 'Middleware Setup', 'hidden'],
  sayToChat: ['Announce result to chat', 'Middleware Setup', 'dropdown', {no: 'No', yes:'Yes'}, i => i === 'yes'],
  _info2: ['https://jebaited.net/tokens/ ->', 'Middleware Setup', 'hidden'],
  jebaitedAPIToken: ['Token', 'Middleware Setup', 'text', 'token'],
  _info3: ['variables: {res} | {user}', 'Middleware Setup', 'hidden'],
  chatResponse: ['Chat Response', 'Middleware Setup', 'text', '{res}'],
  chatResponseDelay: ['Chat Response (stream) Delay (s)', 'Middleware Setup', 'slider', 5, 1, 10, 1],
  showWheelOnLoad: ['Show Wheel On Load', 'Main Settings', 'dropdown', {yes: 'Yes', no: 'No'}, i => i === 'yes'],
  spinCommand: ['Spin Command', 'Main Settings', 'text', '!spin'],
  wheelShowCommand: ['Show Wheel Command', 'Main Settings', 'text', '!showwheel'],
  wheelHideCommand: ['Hide Wheel Command', 'Main Settings', 'text', '!hidewheel'],
  duration: ['Duration (s)', 'Main Settings', 'slider', 10, 5, 30, 1],
  spins: ['Spin speed', 'Main Settings', 'slider', 10, 3, 50, 1],
  gameOverDelay: ['Spin End Screen (s)', 'Main Settings', 'slider', 5, 1, 30, 1],
  playTickSound: ['Play Tick Sound', 'Main Settings', 'dropdown', {yes: 'Yes', no: 'No'}, i => i === 'yes'],
  backgroundSound: ['Background Sound', 'Main Settings', 'sound-input', '', i => new Audio(i)],
  backgroundSoundVolume: ['Background Sound Volume', 'Main Settings', 'slider', 0.5, 0.1, 1, 0.1],
  fontFamily: ['Font', 'Visual Settings', 'googleFont', 'Open Sans'],
  fontSize: ['Font Size', 'Visual Settings', 'number', 20, 5, 100],
  usernameColor: ['Username Color', 'Visual Settings', 'colorpicker', 'white'],
  usernameFontSize: ['Username Font Size', 'Visual Settings', 'number', 50, 5, 300],
  usernameOffset: ['Username Y Position', 'Visual Settings', 'number', 600],
  foregroundVideo: ['Video Overlay', 'Visual Settings', 'video-input', 'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/JayniusGamingTV_demo.webm'],
  foregroundImage: ['Image Overlay', 'Visual Settings', 'image-input', 'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/streamElementsLogo.gif'],
  _info4: ['Animated gradient webcam frame', 'Animated Gradient Frame', 'hidden'],
  _info5: ['by Kagrayz', 'Animated Gradient Frame', 'hidden'],
  mask: ['Mask Image', 'Animated Gradient Frame', 'dropdown', {none: 'none',
        'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/demo1.png': 'Solid Border',
        'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/demo2.png': 'Faded Border',
        'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/demo3.png': 'Faded Border With Center Plug'}],
  firstColor: ['First Color', 'Animated Gradient Frame', 'colorpicker', '#00abff'],
  secondColor: ['Second Color', 'Animated Gradient Frame', 'colorpicker', '#6701a5'],
  frameDuration: ['Rotating duration (s)', 'Animated Gradient Frame', 'number', 2.5],
  cacheMask: ['Second Color', 'Animated Gradient Frame', 'checkbox'],
  gradientOverride: ['', 'Animated Gradient Frame', 'hidden', 40],
  wheelSize: ['Wheel Size', 'Advanced Settings', 'number', 900],
  textMargin: ['Wheel Text Margin', 'Advanced Settings', 'number', 20],
  wheelStartingPositionX: ['Wheel Start X Position', 'Advanced Settings', 'number', 50],
  wheelStartingPositionY: ['Wheel Start Y Position', 'Advanced Settings', 'number', 50],
  foregroundVideoSize: ['Video Overlay Size (%)', 'Advanced Settings', 'number', 110],
  foregroundImageSize: ['Image Overlay Size (%)', 'Advanced Settings', 'number', 25],
  foregroundImageRadius: ['Image Overlay Radius (%)', 'Advanced Settings', 'slider', 50,0,50,1],
};

// ***For Building JSON File
//exports.FieldDataMaster = FieldDataMaster;
//return;
//***

//Hidden Settings. These Are Fixed and will never change; (constant variables)
const WheelBot = 'yourbotname', //Lowercase name if wanting to use a bot to call commands
  tickSoundVolume = 0.5, //tick sound volume
  spinDelay = 1.5, //delay for wheel to start when off screen (sec)
  hideWheelAfterSpin = true, //hide the wheel when done spinning; default: true
  wheelGlow = 'black', //inner glow of the wheel; default wheel: white
  wheelGlowAmount = 0.5, //default 0.5
  pointerAngle = 0,
  tickSound = new Audio('https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune/tick.mp3'),
  RandomInt = (min, max) => Math.floor((Math.random() * (max - min) + min));
//set tick volume.
tickSound.volume = tickSoundVolume;
//Global Code variables that will change over time.
let theWheel, wheelSpinning = false, gameQueue = [], wheelOnScreen = false, wheelAngle = 0, randomSpins, randomTime, userOption = {}, jebaitedAPI;
//MASTER WHEEL LIST; BUILT ON WIDGET LOAD
let prizeWheelSegements = [];
//
window.addEventListener('onEventReceived', obj => {
  //Test Button
  if (obj.detail.event.listener === 'widget-button' && obj.detail.event.field === 'testButton') {
    showWheel();
    startSpin({
      user: 'TESTUSERNAME',
      prizeList: prizeWheelSegements
    });
    return;
  };
  //Broadcaster Commands
  if (obj.detail.listener === "message") {
    let data = obj.detail.event.data;
    if (data.userId === data.tags['room-id'] || data.nick === WheelBot) { //Broadcaster && LOWERCASE name
      if (data.text.startsWith(userOption.spinCommand)) {
        let msg = data.text.split(' '),
          user = typeof msg[1] === 'string' ? msg[1].replace('@', '') : '';
        startSpin({
          user: user,
          prizeList: prizeWheelSegements
        });
      }
      else if (data.text === userOption.wheelShowCommand) showWheel();
      else if (data.text === userOption.wheelHideCommand) hideWheel();
      else return;
    };
  };
  /*
  ADD OTHER EVENTS HERE
  TRIGGER A SPIN WITH:
      startSpin({
        user: `USERNAME`,
        prizeList: prizeWheelSegements //PRIZE LIST OBJECT
      });
  */
});
//Widget functions
const Widget = {
  wait: (ms) => new Promise(r => setTimeout(r, ms)),
  verifyLoad: () => Promise.all([jebaitedAPI.checkScope('botMsg')]).catch( e => Widget.displayError(`Jebaited Error: ${e.error ? e.error : e}`,false)), //[jebaitedAPI.checkScope('botMsg')] //[jebaitedAPI.checkScope('botMsg'), jebaitedAPI.checkScope('addPoints')]
  say: (msg) => { //say to chat
    console.log(msg);
    jebaitedAPI.sayMessage(`/me ${msg}`).catch(e => console.log('jebaited.sayMessage: ', e));
  },
  givePoints: (user, points) => { //give points NOT USED
    jebaitedAPI.addPoints(user, points).then(d => console.log(`${points} points added to ${user}`)).catch(e => console.log('jebaited.addPoints: ', e));
  },
  displayError: (e, critical = false) => {
      console.log('Error: ', e, critical);
      userOption.sayToChat = false;
      if (critical) {
        $('#errorText').append(`<div class='errorText'>${e.error ? e.error : e}.<br>This is a critical error and widget is disabled!</div>`);
        Widget.wait(5000).then(() => $('#container').html(''));
      } else {
        $('#errorText').append(`<div class='errorText'>${e.error ? e.error : e}.<br>This message will auto delete after 30 seconds</div>`);
        Widget.wait(30000).then(() => $('.errorText').first().remove());
      };
    }
};

window.addEventListener('onWidgetLoad', function(obj) {

const fieldData = obj.detail.fieldData;

//Build Master FD Object
for (const [key] of Object.entries(FieldDataMaster)) { //loop each key in Master FD
  userOption[key] = fieldData[key] ? fieldData[key] : FieldDataMaster[key][3]; //get the value in JSON or override to default if null
  if(typeof userOption[key] === 'object') userOption[key] = Object.keys(userOption[key])[0]; //check if object & grab 1st item if so (redundant; dropdowns should always have a value)
  let lastItem = FieldDataMaster[key][FieldDataMaster[key].length - 1]; //get last item of each Key
  if(typeof lastItem === 'function' && userOption[key]) userOption[key] = lastItem(userOption[key]); //if last item is a fuction, pass value through it
};
//Build Add-on FD objects (wheel segments)
for(let i = 1; i <= 51; i++) { //get segment info
  if(!fieldData[`segment${i}_wheelText`]) continue; //skip empty segements
  let bgColor, fontColor, styleMatchTarget = parseInt(fieldData[`segment${i}_styleMatch`]);
  //SET COLORS
  if(styleMatchTarget > 0 ) { //try to match the settings from other segment if set
    try {
      let targetSegment = prizeWheelSegements[styleMatchTarget - 1];
      bgColor = targetSegment.segmentBgColor;
      fontColor = targetSegment.fontColor;
    } catch {
      styleMatchTarget = 0;
      console.error('Segment Target Does Not Exist');;
    };
  };

  if(!styleMatchTarget) { //verfiy colors are valid or set to random
    bgColor = tinycolor(fieldData[`segment${i}_bgColor`]).isValid() ? fieldData[`segment${i}_bgColor`] : tinycolor.random().toHexString();
    fontColor = tinycolor(fieldData[`segment${i}_fontColor`]).isValid() ? fieldData[`segment${i}_fontColor`] : tinycolor.mostReadable(bgColor, [bgColor], {
      includeFallbackColors: true
    }).toHexString(); // white or black
  };

//***** WHEEL OBJECT !!!!
  prizeWheelSegements.push({ //build wheel object
      text: fieldData[`segment${i}_wheelText`],
      res: fieldData[`segment${i}_resText`],
      size: fieldData[`segment${i}_size`],
      segmentBgColor: bgColor,
      fontColor: fontColor,
      fontFamily: fieldData[`segment${i}_fontFamily`] || userOption.fontFamily, //not used; all segments have same font
      fontSize: fieldData[`segment${i}_fontSize`] || userOption.fontSize //not used; all segments have same font size
    });
};

//error check; wheel needs at least 1 thing :)
if(prizeWheelSegements.length < 2) Widget.displayError('2 segments are required!', true); //minimum 2 segements rquired.
//Jebaited API CHECK
if(userOption.sayToChat) {
  if(userOption.jebaitedAPIToken.length !== 24) {
    userOption.sayToChat = false;
    Widget.displayError('Say to Chat Enabled, but token is not correct')
  } else {
    jebaitedAPI = new Jebaited(fieldData['jebaitedAPIToken']);
    (() => Widget.wait(obj.detail.overlay.isEditorMode ? 2000 : 0).then(Widget.verifyLoad() ).catch(e => console.log('ummm... error: ?', e) )) ();
  };
};
  //Check background sound, and set volume
  if (!userOption.backgroundSound) userOption.backgroundSound = false; //Prevent audio call with no source;
  else userOption.backgroundSound.volume = userOption.backgroundSoundVolume;
  //build the wheel
  theWheel = buildWheel(prizeWheelSegements);
  //show on screen?
  if (userOption.showWheelOnLoad) showWheel(true);
  //Set video/image position
  let updateCanvas = () => {
    let canvas = $("#canvas");
    /* ADVANCED OVERRIDE IF NEEDED TO CENTER VIDEO OR IMAGE */
    let videoOffsetX = 0,
      videoOffsetY = 0,
      imageOffsetX = 0,
      imageOffsetY = 0;
    //offset for jay's non centered video :)
    if(userOption.foregroundVideo === 'https://raw.githubusercontent.com/pjonp/pjTestBot/master/modules/.SE_Overlays/chatterWheel/assets/JayniusGamingTV_demo.webm') {
      videoOffsetX = 1 * userOption.wheelSize/900,
      videoOffsetY = 5 * userOption.wheelSize/900;
    }
    //check and position overlay video
    if (!userOption.foregroundVideo || userOption.foregroundVideo === 'none') $("#video-center-piece").html('')
    else {
      $("#video-center-piece video").css('left', `${(canvas.width() - $("#video-center-piece video").width())/2 + videoOffsetX}px`);
      $("#video-center-piece video").css('top', `${(canvas.height() - $("#video-center-piece video").height())/2 + videoOffsetY}px`);
    };
    //check and position overlay image
    if (!userOption.foregroundImage || userOption.foregroundImage === 'none') $("#image-center-piece").html('');
    else {
      $("#image-center-piece img").css('left', `${(canvas.width() - $("#image-center-piece img").width())/2 + imageOffsetX}px`);
      $("#image-center-piece img").css('top', `${(canvas.height() - $("#image-center-piece img").height())/2 + imageOffsetY}px`);
    };
  };
  //set video and image positions on DOM load; then update again in case code beats browser
  $(() => updateCanvas()); //DOM ready
  setTimeout(() => updateCanvas(), 10000); //force update after loaded for 10 seconds; fixes position error.
  //"Animated gradient webcam frame" by Kagrayz
  if (userOption.mask && userOption.mask !== 'none') buildGradient();
  else $("#frame").html('');
});


//show/hide wheel functions
const showWheel = (hidden) => {
  if(hidden) $("#container").css('opacity', '1');
  $("#container").removeClass("hide").addClass("show");
  //wheelOnScreen = true; //handled with spin function
};
const hideWheel = () => {
  $("#container").removeClass("show").addClass("hide");
  wheelOnScreen = false;
};
//build wheel function
const buildWheel = (prizeList) => {
  if (wheelSpinning || prizeList.length < 0) return;
  //get wheel canvas, center point, and math the "segment size";
  let canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    canvasCenter = canvas.height / 2,
    defaultSegSize = prizeList.reduce((total, num) => total + (!num.size ? 1 : num.size), 0);
  //build each segment on the wheel
  prizeSegments = prizeList.map(i => {
    //segment gradient
    let radGradient = ctx.createRadialGradient(canvasCenter, canvasCenter, 0, canvasCenter, canvasCenter, userOption.wheelSize);
    //segment gradient
    radGradient.addColorStop(0, wheelGlow);
    radGradient.addColorStop(wheelGlowAmount, i.segmentBgColor);
    //final segment Object
    let segementOBJ = {
      text: i.text,
      fillStyle: radGradient,
      textFontFamily: i.fontFamily,
      textFontSize: i.fontSize,
      textFillStyle: i.fontColor
    };
    //set segment size
    if (i.size > 0) segementOBJ.size = 360 / defaultSegSize * i.size;
    return segementOBJ;
  });
  //randomize the power and duration
  randomSpins = RandomInt((userOption.spins - 3), (userOption.spins + 4)),
  randomTime = RandomInt((userOption.duration - 3), (userOption.duration + 4));

  return new Winwheel({
    'outerRadius': userOption.wheelSize / 2, // Set outer radius so wheel fits inside the background.
    'textFontSize': userOption.fontSize, // Set default font size for the segments.
    'textDirection': 'reversed',
    'textAlignment': 'outer', // Align text to outside of wheel.
    'textMargin': userOption.textMargin,
    'numSegments': prizeSegments.length, // Specify number of segments.
    'segments': prizeSegments, // Define segments including colour and text.
    'pointerAngle': pointerAngle,
    'animation': // Specify the animation to use.
    {
      'type': 'spinToStop',
      'duration': randomTime,
      'spins': randomSpins,
      'easing': 'Power4.easeOut'
    }
  });
};

const startSpin = async (spinObj) => {
  if (wheelSpinning) gameQueue.push(spinObj);
  else {
    theWheel = buildWheel(spinObj.prizeList);
    wheelSpinning = true;
    $('#center-text').html(spinObj.user);
    showWheel();
    theWheel.rotationAngle = wheelAngle;
    theWheel.stopAnimation(false);
    if (userOption.playTickSound) theWheel.animation.callbackSound = playTickSound;
    if (!wheelOnScreen) await (async () => new Promise(resolve => setTimeout(resolve, spinDelay * 1000)))();
    wheelOnScreen = true;
    theWheel.startAnimation();
    if(userOption.backgroundSound) playBackgroundSound();
    setTimeout(() => endSpin(spinObj), randomTime * 1000 + 100);
  };
};

const endSpin = (spinObj) => {
  tickSound.pause();
  tickSound.currentTime = 0;
  //get winner and make wheel pretty
  try {
    let winningSegmentNumber = theWheel.getIndicatedSegmentNumber(),
      canvas = document.getElementById('canvas'),
      ctx = canvas.getContext('2d'),
      canvasCenter = canvas.height / 2,
      radGradient = ctx.createRadialGradient(canvasCenter, canvasCenter, 0, canvasCenter, canvasCenter, userOption.wheelSize); // x0,y0,r0,x1,y1,r1

    wheelPrize = theWheel.getIndicatedSegment().text;
    radGradient.addColorStop(0, "white");
    radGradient.addColorStop(0.5, "gray");
    for (let i = 1; i < theWheel.segments.length; i++) {
      if (i !== winningSegmentNumber) {
        theWheel.segments[i].segmentBgColor = radGradient;
        theWheel.segments[i].textFillStyle = 'black';
      };
    }
    theWheel.draw();
  } catch {
    wheelPrize = ':shrug: something broke.'
  };
  let segmentIndex = spinObj.prizeList.findIndex(i => i.text === wheelPrize),
    prizeRes = spinObj.prizeList[segmentIndex].res || wheelPrize,
    chatMessage = userOption.chatResponse.replace('{user}', spinObj.user).replace('{res}', prizeRes).replace('{amount}', spinObj.amount);
  //delay chat response
  setTimeout(() => {
    if (userOption.sayToChat) Widget.say(chatMessage);
  }, userOption.chatResponseDelay * 1000);
  //check if done
  setTimeout(() => {
    if(userOption.backgroundSound) {
      userOption.backgroundSound.pause();
      userOption.backgroundSound.currentTime = 0;
    };
    wheelSpinning = false;
    $('#center-text').html('');

    if (gameQueue.length === 0) {
      console.log('Games Over');
      if (hideWheelAfterSpin) {
        hideWheel();
        wheelAngle = 0;
      };
    } else {
      wheelAngle = parseInt(theWheel.rotationAngle % 360);
      startSpin(gameQueue.shift());
    };
  }, userOption.gameOverDelay * 1000);
};
//tick sound
const playTickSound = () => {
  tickSound.currentTime = 0;
  tickSound.play();
};
//background sound
const playBackgroundSound = () => {
    userOption.backgroundSound.currentTime = 0;
    userOption.backgroundSound.play();
};
//"Animated gradient webcam frame" by Kagrayz
const buildGradient = () => {
  if (userOption.mask) {
    let maskUrl = userOption.mask + (userOption.cacheMask ? '' : '?_nocache=' + new Date().getTime());
    $('#frame')
      .css('width', `${userOption.wheelSize+userOption.gradientOverride}px`)
      .css('height', `${userOption.wheelSize+userOption.gradientOverride}px`)
      .css('left', `${-1*userOption.gradientOverride/2}px`)
      .css('top', `${-1*userOption.gradientOverride/2}px`)
      .css('mask-image', 'url(' + maskUrl + ')')
      .css('-webkit-mask-image', 'url(' + maskUrl + ')');
  };
};

    /*
    winWheel.js 2.8.0
    The MIT License (MIT)
    Copyright (c) 2012-2019 Douglas McKechie
    */
    function Winwheel(a,c){defaultOptions={canvasId:"canvas",centerX:null,centerY:null,outerRadius:null,innerRadius:0,numSegments:1,drawMode:"code",rotationAngle:0,textFontFamily:"Arial",textFontSize:20,textFontWeight:"bold",textOrientation:"horizontal",textAlignment:"center",textDirection:"normal",textMargin:null,textFillStyle:"black",textStrokeStyle:null,textLineWidth:1,fillStyle:"silver",strokeStyle:"black",lineWidth:1,clearTheCanvas:!0,imageOverlay:!1,drawText:!0,pointerAngle:0,wheelImage:null,imageDirection:"N",
    responsive:!1,scaleFactor:1};for(var b in defaultOptions)this[b]=null!=a&&"undefined"!==typeof a[b]?a[b]:defaultOptions[b];if(null!=a)for(var d in a)"undefined"===typeof this[d]&&(this[d]=a[d]);this.canvasId?(this.canvas=document.getElementById(this.canvasId))?(null==this.centerX&&(this.centerX=this.canvas.width/2),null==this.centerY&&(this.centerY=this.canvas.height/2),null==this.outerRadius&&(this.outerRadius=this.canvas.width<this.canvas.height?this.canvas.width/2-this.lineWidth:this.canvas.height/
    2-this.lineWidth),this.ctx=this.canvas.getContext("2d")):this.ctx=this.canvas=null:this.ctx=this.canvas=null;this.segments=Array(null);for(b=1;b<=this.numSegments;b++)this.segments[b]=null!=a&&a.segments&&"undefined"!==typeof a.segments[b-1]?new Segment(a.segments[b-1]):new Segment;this.updateSegmentSizes();null===this.textMargin&&(this.textMargin=this.textFontSize/1.7);this.animation=null!=a&&a.animation&&"undefined"!==typeof a.animation?new Animation(a.animation):new Animation;null!=a&&a.pins&&
    "undefined"!==typeof a.pins&&(this.pins=new Pin(a.pins));"image"==this.drawMode||"segmentImage"==this.drawMode?("undefined"===typeof a.fillStyle&&(this.fillStyle=null),"undefined"===typeof a.strokeStyle&&(this.strokeStyle="red"),"undefined"===typeof a.drawText&&(this.drawText=!1),"undefined"===typeof a.lineWidth&&(this.lineWidth=1),"undefined"===typeof c&&(c=!1)):"undefined"===typeof c&&(c=!0);this.pointerGuide=null!=a&&a.pointerGuide&&"undefined"!==typeof a.pointerGuide?new PointerGuide(a.pointerGuide):
    new PointerGuide;this.responsive&&(winwheelToDrawDuringAnimation=this,this._originalCanvasWidth=this.canvas.width,this._originalCanvasHeight=this.canvas.height,this._responsiveScaleHeight=this.canvas.dataset.responsivescaleheight,this._responsiveMinWidth=this.canvas.dataset.responsiveminwidth,this._responsiveMinHeight=this.canvas.dataset.responsiveminheight,this._responsiveMargin=this.canvas.dataset.responsivemargin,window.addEventListener("load",winwheelResize),window.addEventListener("resize",winwheelResize));
    if(1==c)this.draw(this.clearTheCanvas);else if("segmentImage"==this.drawMode)for(winwheelToDrawDuringAnimation=this,winhweelAlreadyDrawn=!1,b=1;b<=this.numSegments;b++)null!==this.segments[b].image&&(this.segments[b].imgData=new Image,this.segments[b].imgData.onload=winwheelLoadedImage,this.segments[b].imgData.src=this.segments[b].image)}
    Winwheel.prototype.updateSegmentSizes=function(){if(this.segments){for(var a=0,c=0,b=1;b<=this.numSegments;b++)null!==this.segments[b].size&&(a+=this.segments[b].size,c++);b=360-a;a=0;0<b&&(a=b/(this.numSegments-c));c=0;for(b=1;b<=this.numSegments;b++)this.segments[b].startAngle=c,c=this.segments[b].size?c+this.segments[b].size:c+a,this.segments[b].endAngle=c}};Winwheel.prototype.clearCanvas=function(){this.ctx&&this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)};
    Winwheel.prototype.draw=function(a){this.ctx&&("undefined"!==typeof a?1==a&&this.clearCanvas():this.clearCanvas(),"image"==this.drawMode?(this.drawWheelImage(),1==this.drawText&&this.drawSegmentText(),1==this.imageOverlay&&this.drawSegments()):"segmentImage"==this.drawMode?(this.drawSegmentImages(),1==this.drawText&&this.drawSegmentText(),1==this.imageOverlay&&this.drawSegments()):(this.drawSegments(),1==this.drawText&&this.drawSegmentText()),"undefined"!==typeof this.pins&&1==this.pins.visible&&
    this.drawPins(),1==this.pointerGuide.display&&this.drawPointerGuide())};
    Winwheel.prototype.drawPins=function(){if(this.pins&&this.pins.number){var a=this.centerX*this.scaleFactor,c=this.centerY*this.scaleFactor,b=this.outerRadius*this.scaleFactor,d=this.pins.outerRadius,e=this.pins.margin;this.pins.responsive&&(d=this.pins.outerRadius*this.scaleFactor,e=this.pins.margin*this.scaleFactor);for(var t=360/this.pins.number,h=1;h<=this.pins.number;h++)this.ctx.save(),this.ctx.strokeStyle=this.pins.strokeStyle,this.ctx.lineWidth=this.pins.lineWidth,this.ctx.fillStyle=this.pins.fillStyle,
    this.ctx.translate(a,c),this.ctx.rotate(this.degToRad(h*t+this.rotationAngle)),this.ctx.translate(-a,-c),this.ctx.beginPath(),this.ctx.arc(a,c-b+d+e,d,0,2*Math.PI),this.pins.fillStyle&&this.ctx.fill(),this.pins.strokeStyle&&this.ctx.stroke(),this.ctx.restore()}};
    Winwheel.prototype.drawPointerGuide=function(){if(this.ctx){var a=this.centerX*this.scaleFactor,c=this.centerY*this.scaleFactor,b=this.outerRadius*this.scaleFactor;this.ctx.save();this.ctx.translate(a,c);this.ctx.rotate(this.degToRad(this.pointerAngle));this.ctx.translate(-a,-c);this.ctx.strokeStyle=this.pointerGuide.strokeStyle;this.ctx.lineWidth=this.pointerGuide.lineWidth;this.ctx.beginPath();this.ctx.moveTo(a,c);this.ctx.lineTo(a,-(b/4));this.ctx.stroke();this.ctx.restore()}};
    Winwheel.prototype.drawWheelImage=function(){if(null!=this.wheelImage){var a=this.centerX*this.scaleFactor,c=this.centerY*this.scaleFactor,b=this.wheelImage.width*this.scaleFactor,d=this.wheelImage.height*this.scaleFactor,e=a-b/2,t=c-d/2;this.ctx.save();this.ctx.translate(a,c);this.ctx.rotate(this.degToRad(this.rotationAngle));this.ctx.translate(-a,-c);this.ctx.drawImage(this.wheelImage,e,t,b,d);this.ctx.restore()}};
    Winwheel.prototype.drawSegmentImages=function(){if(this.ctx){var a=this.centerX*this.scaleFactor,c=this.centerY*this.scaleFactor;if(this.segments)for(var b=1;b<=this.numSegments;b++){var d=this.segments[b];if(d.imgData.height){var e=d.imgData.width*this.scaleFactor,t=d.imgData.height*this.scaleFactor;var h=null!==d.imageDirection?d.imageDirection:this.imageDirection;if("S"==h){h=a-e/2;var n=c;var r=d.startAngle+180+(d.endAngle-d.startAngle)/2}else"E"==h?(h=a,n=c-t/2,r=d.startAngle+270+(d.endAngle-
    d.startAngle)/2):"W"==h?(h=a-e,n=c-t/2,r=d.startAngle+90+(d.endAngle-d.startAngle)/2):(h=a-e/2,n=c-t,r=d.startAngle+(d.endAngle-d.startAngle)/2);this.ctx.save();this.ctx.translate(a,c);this.ctx.rotate(this.degToRad(this.rotationAngle+r));this.ctx.translate(-a,-c);this.ctx.drawImage(d.imgData,h,n,e,t);this.ctx.restore()}else console.log("Segment "+b+" imgData is not loaded")}}};
    Winwheel.prototype.drawSegments=function(){if(this.ctx&&this.segments)for(var a=this.centerX*this.scaleFactor,c=this.centerY*this.scaleFactor,b=this.innerRadius*this.scaleFactor,d=this.outerRadius*this.scaleFactor,e=1;e<=this.numSegments;e++){var t=this.segments[e];var h=null!==t.fillStyle?t.fillStyle:this.fillStyle;this.ctx.fillStyle=h;var n=null!==t.lineWidth?t.lineWidth:this.lineWidth;this.ctx.lineWidth=n;var r=null!==t.strokeStyle?t.strokeStyle:this.strokeStyle;if((this.ctx.strokeStyle=r)||h){this.ctx.beginPath();
    if(this.innerRadius){var f=Math.cos(this.degToRad(t.startAngle+this.rotationAngle-90))*(b-n/2);n=Math.sin(this.degToRad(t.startAngle+this.rotationAngle-90))*(b-n/2);this.ctx.moveTo(a+f,c+n)}else this.ctx.moveTo(a,c);this.ctx.arc(a,c,d,this.degToRad(t.startAngle+this.rotationAngle-90),this.degToRad(t.endAngle+this.rotationAngle-90),!1);this.innerRadius?this.ctx.arc(a,c,b,this.degToRad(t.endAngle+this.rotationAngle-90),this.degToRad(t.startAngle+this.rotationAngle-90),!0):this.ctx.lineTo(a,c);h&&this.ctx.fill();
    r&&this.ctx.stroke()}}};
    Winwheel.prototype.drawSegmentText=function(){if(this.ctx)for(var a,c,b,d,e,t,h,n,r,f,l=this.centerX*this.scaleFactor,p=this.centerY*this.scaleFactor,w=this.outerRadius*this.scaleFactor,v=this.innerRadius*this.scaleFactor,y=1;y<=this.numSegments;y++){this.ctx.save();var g=this.segments[y];if(g.text){a=null!==g.textFontFamily?g.textFontFamily:this.textFontFamily;c=null!==g.textFontSize?g.textFontSize:this.textFontSize;b=null!==g.textFontWeight?g.textFontWeight:this.textFontWeight;d=null!==g.textOrientation?
    g.textOrientation:this.textOrientation;e=null!==g.textAlignment?g.textAlignment:this.textAlignment;t=null!==g.textDirection?g.textDirection:this.textDirection;h=null!==g.textMargin?g.textMargin:this.textMargin;n=null!==g.textFillStyle?g.textFillStyle:this.textFillStyle;r=null!==g.textStrokeStyle?g.textStrokeStyle:this.textStrokeStyle;f=null!==g.textLineWidth?g.textLineWidth:this.textLineWidth;c*=this.scaleFactor;h*=this.scaleFactor;var m="";null!=b&&(m+=b+" ");null!=c&&(m+=c+"px ");null!=a&&(m+=a);
    this.ctx.font=m;this.ctx.fillStyle=n;this.ctx.strokeStyle=r;this.ctx.lineWidth=f;a=g.text.split("\n");b=-(a.length/2*c)+c/2;"curved"!=d||"inner"!=e&&"outer"!=e||(b=0);for(f=0;f<a.length;f++){if("reversed"==t)if("horizontal"==d)this.ctx.textAlign="inner"==e?"right":"outer"==e?"left":"center",this.ctx.textBaseline="middle",m=this.degToRad(g.endAngle-(g.endAngle-g.startAngle)/2+this.rotationAngle-90-180),this.ctx.save(),this.ctx.translate(l,p),this.ctx.rotate(m),this.ctx.translate(-l,-p),"inner"==e?
    (n&&this.ctx.fillText(a[f],l-v-h,p+b),r&&this.ctx.strokeText(a[f],l-v-h,p+b)):"outer"==e?(n&&this.ctx.fillText(a[f],l-w+h,p+b),r&&this.ctx.strokeText(a[f],l-w+h,p+b)):(n&&this.ctx.fillText(a[f],l-v-(w-v)/2-h,p+b),r&&this.ctx.strokeText(a[f],l-v-(w-v)/2-h,p+b)),this.ctx.restore();else if("vertical"==d){this.ctx.textAlign="center";this.ctx.textBaseline="inner"==e?"top":"outer"==e?"bottom":"middle";m=g.endAngle-(g.endAngle-g.startAngle)/2-180;m+=this.rotationAngle;this.ctx.save();this.ctx.translate(l,
    p);this.ctx.rotate(this.degToRad(m));this.ctx.translate(-l,-p);var k=0;"outer"==e?k=p+w-h:"inner"==e&&(k=p+v+h);m=c-c/9;if("outer"==e)for(var q=a[f].length-1;0<=q;q--){var u=a[f].charAt(q);n&&this.ctx.fillText(u,l+b,k);r&&this.ctx.strokeText(u,l+b,k);k-=m}else if("inner"==e)for(q=0;q<a[f].length;q++)u=a[f].charAt(q),n&&this.ctx.fillText(u,l+b,k),r&&this.ctx.strokeText(u,l+b,k),k+=m;else if("center"==e)for(k=0,1<a[f].length&&(k=m*(a[f].length-1)/2),k=p+v+(w-v)/2+k+h,q=a[f].length-1;0<=q;q--)u=a[f].charAt(q),
    n&&this.ctx.fillText(u,l+b,k),r&&this.ctx.strokeText(u,l+b,k),k-=m;this.ctx.restore()}else{if("curved"==d)for(m=0,"inner"==e?(m=v+h,this.ctx.textBaseline="top"):"outer"==e?(m=w-h,this.ctx.textBaseline="bottom",m-=c*(a.length-1)):"center"==e&&(m=v+h+(w-v)/2,this.ctx.textBaseline="middle"),k=0,1<a[f].length?(this.ctx.textAlign="left",k=c/10*4,k*=100/m,q=g.startAngle+((g.endAngle-g.startAngle)/2-k*a[f].length/2)):(q=g.startAngle+(g.endAngle-g.startAngle)/2,this.ctx.textAlign="center"),q+=this.rotationAngle,
    q-=180,u=a[f].length;0<=u;u--){this.ctx.save();var x=a[f].charAt(u);this.ctx.translate(l,p);this.ctx.rotate(this.degToRad(q));this.ctx.translate(-l,-p);r&&this.ctx.strokeText(x,l,p+m+b);n&&this.ctx.fillText(x,l,p+m+b);q+=k;this.ctx.restore()}}else if("horizontal"==d)this.ctx.textAlign="inner"==e?"left":"outer"==e?"right":"center",this.ctx.textBaseline="middle",m=this.degToRad(g.endAngle-(g.endAngle-g.startAngle)/2+this.rotationAngle-90),this.ctx.save(),this.ctx.translate(l,p),this.ctx.rotate(m),this.ctx.translate(-l,
    -p),"inner"==e?(n&&this.ctx.fillText(a[f],l+v+h,p+b),r&&this.ctx.strokeText(a[f],l+v+h,p+b)):"outer"==e?(n&&this.ctx.fillText(a[f],l+w-h,p+b),r&&this.ctx.strokeText(a[f],l+w-h,p+b)):(n&&this.ctx.fillText(a[f],l+v+(w-v)/2+h,p+b),r&&this.ctx.strokeText(a[f],l+v+(w-v)/2+h,p+b)),this.ctx.restore();else if("vertical"==d){this.ctx.textAlign="center";this.ctx.textBaseline="inner"==e?"bottom":"outer"==e?"top":"middle";m=g.endAngle-(g.endAngle-g.startAngle)/2;m+=this.rotationAngle;this.ctx.save();this.ctx.translate(l,
    p);this.ctx.rotate(this.degToRad(m));this.ctx.translate(-l,-p);k=0;"outer"==e?k=p-w+h:"inner"==e&&(k=p-v-h);m=c-c/9;if("outer"==e)for(q=0;q<a[f].length;q++)u=a[f].charAt(q),n&&this.ctx.fillText(u,l+b,k),r&&this.ctx.strokeText(u,l+b,k),k+=m;else if("inner"==e)for(q=a[f].length-1;0<=q;q--)u=a[f].charAt(q),n&&this.ctx.fillText(u,l+b,k),r&&this.ctx.strokeText(u,l+b,k),k-=m;else if("center"==e)for(k=0,1<a[f].length&&(k=m*(a[f].length-1)/2),k=p-v-(w-v)/2-k-h,q=0;q<a[f].length;q++)u=a[f].charAt(q),n&&this.ctx.fillText(u,
    l+b,k),r&&this.ctx.strokeText(u,l+b,k),k+=m;this.ctx.restore()}else if("curved"==d)for(m=0,"inner"==e?(m=v+h,this.ctx.textBaseline="bottom",m+=c*(a.length-1)):"outer"==e?(m=w-h,this.ctx.textBaseline="top"):"center"==e&&(m=v+h+(w-v)/2,this.ctx.textBaseline="middle"),k=0,1<a[f].length?(this.ctx.textAlign="left",k=c/10*4,k*=100/m,q=g.startAngle+((g.endAngle-g.startAngle)/2-k*a[f].length/2)):(q=g.startAngle+(g.endAngle-g.startAngle)/2,this.ctx.textAlign="center"),q+=this.rotationAngle,u=0;u<a[f].length;u++)this.ctx.save(),
    x=a[f].charAt(u),this.ctx.translate(l,p),this.ctx.rotate(this.degToRad(q)),this.ctx.translate(-l,-p),r&&this.ctx.strokeText(x,l,p-m+b),n&&this.ctx.fillText(x,l,p-m+b),q+=k,this.ctx.restore();b+=c}}this.ctx.restore()}};Winwheel.prototype.degToRad=function(a){return.017453292519943295*a};Winwheel.prototype.setCenter=function(a,c){this.centerX=a;this.centerY=c};
    Winwheel.prototype.addSegment=function(a,c){var b=new Segment(a);this.numSegments++;if("undefined"!==typeof c){for(var d=this.numSegments;d>c;d--)this.segments[d]=this.segments[d-1];this.segments[c]=b;b=c}else this.segments[this.numSegments]=b,b=this.numSegments;this.updateSegmentSizes();return this.segments[b]};
    Winwheel.prototype.setCanvasId=function(a){if(a){if(this.canvasId=a,this.canvas=document.getElementById(this.canvasId))this.ctx=this.canvas.getContext("2d")}else this.canvas=this.ctx=this.canvasId=null};Winwheel.prototype.deleteSegment=function(a){if(1<this.numSegments){if("undefined"!==typeof a)for(;a<this.numSegments;a++)this.segments[a]=this.segments[a+1];this.segments[this.numSegments]=void 0;this.numSegments--;this.updateSegmentSizes()}};
    Winwheel.prototype.windowToCanvas=function(a,c){var b=this.canvas.getBoundingClientRect();return{x:Math.floor(a-this.canvas.width/b.width*b.left),y:Math.floor(c-this.canvas.height/b.height*b.top)}};Winwheel.prototype.getSegmentAt=function(a,c){var b=null,d=this.getSegmentNumberAt(a,c);null!==d&&(b=this.segments[d]);return b};
    Winwheel.prototype.getSegmentNumberAt=function(a,c){var b=this.windowToCanvas(a,c);var d=this.centerX*this.scaleFactor;var e=this.centerY*this.scaleFactor;var t=this.outerRadius*this.scaleFactor,h=this.innerRadius*this.scaleFactor;if(b.x>d){var n=b.x-d;d="R"}else n=d-b.x,d="L";if(b.y>e){var r=b.y-e;e="B"}else r=e-b.y,e="T";var f=180*Math.atan(r/n)/Math.PI;b=0;n=Math.sqrt(r*r+n*n);"T"==e&&"R"==d?b=Math.round(90-f):"B"==e&&"R"==d?b=Math.round(f+90):"B"==e&&"L"==d?b=Math.round(90-f+180):"T"==e&&"L"==
    d&&(b=Math.round(f+270));0!=this.rotationAngle&&(d=this.getRotationPosition(),b-=d,0>b&&(b=360-Math.abs(b)));d=null;for(e=1;e<=this.numSegments;e++)if(b>=this.segments[e].startAngle&&b<=this.segments[e].endAngle&&n>=h&&n<=t){d=e;break}return d};Winwheel.prototype.getIndicatedSegment=function(){var a=this.getIndicatedSegmentNumber();return this.segments[a]};
    Winwheel.prototype.getIndicatedSegmentNumber=function(){var a=0,c=this.getRotationPosition();c=Math.floor(this.pointerAngle-c);0>c&&(c=360-Math.abs(c));for(var b=1;b<this.segments.length;b++)if(c>=this.segments[b].startAngle&&c<=this.segments[b].endAngle){a=b;break}return a};
    Winwheel.prototype.getCurrentPinNumber=function(){var a=0;if(this.pins){var c=this.getRotationPosition();c=Math.floor(this.pointerAngle-c);0>c&&(c=360-Math.abs(c));for(var b=360/this.pins.number,d=0,e=0;e<this.pins.number;e++){if(c>=d&&c<=d+b){a=e;break}d+=b}"clockwise"==this.animation.direction&&(a++,a>this.pins.number&&(a=0))}return a};Winwheel.prototype.getRotationPosition=function(){var a=this.rotationAngle;0<=a?360<a&&(a-=360*Math.floor(a/360)):(-360>a&&(a-=360*Math.ceil(a/360)),a=360+a);return a};
    Winwheel.prototype.startAnimation=function(){if(this.animation){this.computeAnimation();winwheelToDrawDuringAnimation=this;var a=Array(null);a[this.animation.propertyName]=this.animation.propertyValue;a.yoyo=this.animation.yoyo;a.repeat=this.animation.repeat;a.ease=this.animation.easing;a.onUpdate=winwheelAnimationLoop;a.onComplete=winwheelStopAnimation;this.tween=TweenMax.to(this,this.animation.duration,a)}};
    Winwheel.prototype.stopAnimation=function(a){winwheelToDrawDuringAnimation&&(winwheelToDrawDuringAnimation.tween&&winwheelToDrawDuringAnimation.tween.kill(),winwheelStopAnimation(a));winwheelToDrawDuringAnimation=this};Winwheel.prototype.pauseAnimation=function(){this.tween&&this.tween.pause()};Winwheel.prototype.resumeAnimation=function(){this.tween&&this.tween.play()};
    Winwheel.prototype.computeAnimation=function(){this.animation&&("spinOngoing"==this.animation.type?(this.animation.propertyName="rotationAngle",null==this.animation.spins&&(this.animation.spins=5),null==this.animation.repeat&&(this.animation.repeat=-1),null==this.animation.easing&&(this.animation.easing="Linear.easeNone"),null==this.animation.yoyo&&(this.animation.yoyo=!1),this.animation.propertyValue=360*this.animation.spins,"anti-clockwise"==this.animation.direction&&(this.animation.propertyValue=
    0-this.animation.propertyValue)):"spinToStop"==this.animation.type?(this.animation.propertyName="rotationAngle",null==this.animation.spins&&(this.animation.spins=5),null==this.animation.repeat&&(this.animation.repeat=0),null==this.animation.easing&&(this.animation.easing="Power3.easeOut"),this.animation._stopAngle=null==this.animation.stopAngle?Math.floor(359*Math.random()):360-this.animation.stopAngle+this.pointerAngle,null==this.animation.yoyo&&(this.animation.yoyo=!1),this.animation.propertyValue=
    360*this.animation.spins,"anti-clockwise"==this.animation.direction?(this.animation.propertyValue=0-this.animation.propertyValue,this.animation.propertyValue-=360-this.animation._stopAngle):this.animation.propertyValue+=this.animation._stopAngle):"spinAndBack"==this.animation.type&&(this.animation.propertyName="rotationAngle",null==this.animation.spins&&(this.animation.spins=5),null==this.animation.repeat&&(this.animation.repeat=1),null==this.animation.easing&&(this.animation.easing="Power2.easeInOut"),
    null==this.animation.yoyo&&(this.animation.yoyo=!0),this.animation._stopAngle=null==this.animation.stopAngle?0:360-this.animation.stopAngle,this.animation.propertyValue=360*this.animation.spins,"anti-clockwise"==this.animation.direction?(this.animation.propertyValue=0-this.animation.propertyValue,this.animation.propertyValue-=360-this.animation._stopAngle):this.animation.propertyValue+=this.animation._stopAngle))};
    Winwheel.prototype.getRandomForSegment=function(a){var c=0;if(a)if("undefined"!==typeof this.segments[a]){var b=this.segments[a].startAngle;a=this.segments[a].endAngle-b-2;0<a?c=b+1+Math.floor(Math.random()*a):console.log("Segment size is too small to safely get random angle inside it")}else console.log("Segment "+a+" undefined");else console.log("Segment number not specified");return c};
    function Pin(a){var c={visible:!0,number:36,outerRadius:3,fillStyle:"grey",strokeStyle:"black",lineWidth:1,margin:3,responsive:!1},b;for(b in c)this[b]=null!=a&&"undefined"!==typeof a[b]?a[b]:c[b];if(null!=a)for(var d in a)"undefined"===typeof this[d]&&(this[d]=a[d])}
    function Animation(a){var c={type:"spinOngoing",direction:"clockwise",propertyName:null,propertyValue:null,duration:10,yoyo:!1,repeat:null,easing:null,stopAngle:null,spins:null,clearTheCanvas:null,callbackFinished:null,callbackBefore:null,callbackAfter:null,callbackSound:null,soundTrigger:"segment"},b;for(b in c)this[b]=null!=a&&"undefined"!==typeof a[b]?a[b]:c[b];if(null!=a)for(var d in a)"undefined"===typeof this[d]&&(this[d]=a[d])}
    function Segment(a){var c={size:null,text:"",fillStyle:null,strokeStyle:null,lineWidth:null,textFontFamily:null,textFontSize:null,textFontWeight:null,textOrientation:null,textAlignment:null,textDirection:null,textMargin:null,textFillStyle:null,textStrokeStyle:null,textLineWidth:null,image:null,imageDirection:null,imgData:null},b;for(b in c)this[b]=null!=a&&"undefined"!==typeof a[b]?a[b]:c[b];if(null!=a)for(var d in a)"undefined"===typeof this[d]&&(this[d]=a[d]);this.endAngle=this.startAngle=0}
    Segment.prototype.changeImage=function(a,c){this.image=a;this.imgData=null;c&&(this.imageDirection=c);winhweelAlreadyDrawn=!1;this.imgData=new Image;this.imgData.onload=winwheelLoadedImage;this.imgData.src=this.image};function PointerGuide(a){var c={display:!1,strokeStyle:"red",lineWidth:3},b;for(b in c)this[b]=null!=a&&"undefined"!==typeof a[b]?a[b]:c[b]}function winwheelPercentToDegrees(a){var c=0;0<a&&100>=a&&(c=a/100*360);return c}
    function winwheelAnimationLoop(){if(winwheelToDrawDuringAnimation){0!=winwheelToDrawDuringAnimation.animation.clearTheCanvas&&winwheelToDrawDuringAnimation.ctx.clearRect(0,0,winwheelToDrawDuringAnimation.canvas.width,winwheelToDrawDuringAnimation.canvas.height);var a=winwheelToDrawDuringAnimation.animation.callbackBefore,c=winwheelToDrawDuringAnimation.animation.callbackAfter;null!=a&&("function"===typeof a?a():eval(a));winwheelToDrawDuringAnimation.draw(!1);null!=c&&("function"===typeof c?c():eval(c));
    winwheelToDrawDuringAnimation.animation.callbackSound&&winwheelTriggerSound()}}
    function winwheelTriggerSound(){0==winwheelToDrawDuringAnimation.hasOwnProperty("_lastSoundTriggerNumber")&&(winwheelToDrawDuringAnimation._lastSoundTriggerNumber=0);var a=winwheelToDrawDuringAnimation.animation.callbackSound;var c="pin"==winwheelToDrawDuringAnimation.animation.soundTrigger?winwheelToDrawDuringAnimation.getCurrentPinNumber():winwheelToDrawDuringAnimation.getIndicatedSegmentNumber();c!=winwheelToDrawDuringAnimation._lastSoundTriggerNumber&&("function"===typeof a?a():eval(a),winwheelToDrawDuringAnimation._lastSoundTriggerNumber=
    c)}var winwheelToDrawDuringAnimation=null;function winwheelStopAnimation(a){0!=a&&(a=winwheelToDrawDuringAnimation.animation.callbackFinished,null!=a&&("function"===typeof a?a(winwheelToDrawDuringAnimation.getIndicatedSegment()):eval(a)))}var winhweelAlreadyDrawn=!1;
    function winwheelLoadedImage(){if(0==winhweelAlreadyDrawn){for(var a=0,c=1;c<=winwheelToDrawDuringAnimation.numSegments;c++)null!=winwheelToDrawDuringAnimation.segments[c].imgData&&winwheelToDrawDuringAnimation.segments[c].imgData.height&&a++;a==winwheelToDrawDuringAnimation.numSegments&&(winhweelAlreadyDrawn=!0,winwheelToDrawDuringAnimation.draw())}}
    function winwheelResize(){var a=40;"undefined"!==typeof winwheelToDrawDuringAnimation._responsiveMargin&&(a=winwheelToDrawDuringAnimation._responsiveMargin);var c=window.innerWidth-a,b=winwheelToDrawDuringAnimation._responsiveMinWidth;a=winwheelToDrawDuringAnimation._responsiveMinHeight;c<b?c=b:c>winwheelToDrawDuringAnimation._originalCanvasWidth&&(c=winwheelToDrawDuringAnimation._originalCanvasWidth);c/=winwheelToDrawDuringAnimation._originalCanvasWidth;winwheelToDrawDuringAnimation.canvas.width=
    winwheelToDrawDuringAnimation._originalCanvasWidth*c;winwheelToDrawDuringAnimation._responsiveScaleHeight&&(b=winwheelToDrawDuringAnimation._originalCanvasHeight*c,b<a?b=a:b>winwheelToDrawDuringAnimation._originalCanvasHeight&&(b=winwheelToDrawDuringAnimation._originalCanvasHeight),winwheelToDrawDuringAnimation.canvas.height=b);winwheelToDrawDuringAnimation.scaleFactor=c;winwheelToDrawDuringAnimation.draw()};




//
