import { drawSkeleton } from './util.js'
require('babel-polyfill');

const posenet = require('@tensorflow-models/posenet');
const resnet_conf = {
    architecture: 'ResNet50',
    outputStride: 32,
    inputResolution: { width: 480, height: 270 },
    quantBytes: 2
};


// control the video player
function localFileVideoPlayer() {
    var URL = window.URL || window.webkitURL

    var displayMessage = function(message, isError) {
        var element = document.querySelector('#message')
        element.innerHTML = message
        element.className = isError ? 'error' : 'info'
    }

    var playSelectedFile = function(event) {
        var file = this.files[0]
        var type = file.type
        var videoNode = document.querySelector('video')
        var canPlay = videoNode.canPlayType(type)
        if (canPlay === '') canPlay = 'no'
        var message = 'Can play type "' + type + '": ' + canPlay
        var isError = canPlay === 'no'
        displayMessage(message, isError)
  
        if (isError) {
            return
        }
  
        var fileURL = URL.createObjectURL(file)
        videoNode.src = fileURL
    }
    var inputNode = document.querySelector('input')
    inputNode.addEventListener('change', playSelectedFile, false)
}


// control the event listerner of buttons
function buttonManager(){
    var submit_btn = document.getElementById("btn_submit");
    var download_btn = document.getElementById("btn_download");
    var reload_btn = document.getElementById("btn_reload");
    var poses_data = new Array();    

    // start to generate poses
    submit_btn.addEventListener('click', function(){
        var video_element = document.getElementById("video");

        var key_frames = getKeyframes();
        // console.log(key_frames);

        if(!video_element.src){
            alert("请选择一个视频！");
        }else if(key_frames.length == 0){
            alert("请按正确格式输入视频帧率和关键帧位置！");
        }else{
            submit_btn.setAttribute("disabled", true);
            submit_btn.innerHTML = "生成中...";

            Promise.resolve(getPose(video_element, key_frames)).then(poses=>{
                // console.log(poses);
                poses_data = poses;
            });
        }
    }, false);


    // download the generated data
    download_btn.addEventListener('click', function(){
        var input_file = document.getElementById("input_file");
        var filename = input_file.files[0].name.split('.')[0];

        // convert JSON Array to string.
        var json = JSON.stringify(poses_data);
 
        // convert JSON string to BLOB.
        json = [json];
        var blob1 = new Blob(json, { type: "text/plain;charset=utf-8" });

        var url = window.URL || window.webkitURL;
        var link = url.createObjectURL(blob1);

        var hiddenElement = document.createElement("a");
        hiddenElement.download = "pose_data_" + filename + ".txt";
        hiddenElement.href = link;
        document.body.appendChild(hiddenElement);
        hiddenElement.click();
        document.body.removeChild(hiddenElement);
    }, false);


    // reload page
    reload_btn.addEventListener('click', function(){
        location.reload();
    }, false);
}


// get key frame time from the input
function getKeyframes(){
    var input = document.getElementById("key_frame").value.split('\n');
    var fps = input[0];

    if(isNaN(Number(fps)) || Number(fps)%1 != 0){
        return [];
    }

    var spf = 1/fps;
    var key_frames = new Array();

    for(var idx = 1; idx < input.length; idx++ ){
        var curr_line = input[idx];
        var curr_frame = curr_line.split(',')[0].split(':');
        var curr_sec = parseInt(curr_frame[0]) * 3600 + 
            parseInt(curr_frame[1]) * 60 + 
            parseInt(curr_frame[2]) + 
            parseInt(curr_frame[3]) * spf;
        curr_sec = curr_sec.toFixed(3);
        key_frames.push(curr_sec)
    }
    return key_frames;
}


// get pose data
async function getPose(video, key_frames){
    /*
        input: 
            video: the video element
            key_frames: the time of key frames, accurate milliseconds
        output:
            pose data of each key frames as a list
    */
    var net = await posenet.load(resnet_conf);
    var output = document.getElementById("output");
    
    var idx = 0;
    var key_frame = key_frames[idx];
    video.currentTime = key_frame;
    var poseData = new Array();

    video.addEventListener('timeupdate', ()=>{
        var mycanvas = document.createElement("canvas");
        mycanvas.id = "mycanvas";
        output.appendChild(mycanvas);
        mycanvas.width = 240
        mycanvas.height = 135
        var ctx = mycanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, mycanvas.width, mycanvas.height);

        // get single pose from posenet
        Promise.resolve(
            net.estimateSinglePose(mycanvas, {
                flipHorizontal: false
            })
        ).then(pose=>{
            poseData.push(pose);
            // console.log(JSON.stringify(pose));
            drawSkeleton(pose.keypoints, 0.0, ctx, 1);
        });

        // keep changing currentTime of the video
        if(idx + 1 < key_frames.length){
            idx += 1;
            key_frame = key_frames[idx];
            video.currentTime = key_frame
        }else{
            var submit_btn = document.getElementById("btn_submit");
            var download_btn = document.getElementById("btn_download");
            submit_btn.innerHTML = "请下载数据";
            download_btn.removeAttribute("disabled");
        }
    })

    return poseData;
}


localFileVideoPlayer();
buttonManager();




// [{"score":0.9835409592179691,"keypoints":[{"score":0.9980477094650269,"part":"nose","position":{"x":79.78859782070232,"y":39.149265957249746}},{ "score":0.9954955577850342,"part":"leftEye","position":{ "x":81.93142973013579,"y":38.044430625113996} },{ "score":0.9891964197158813,"part":"rightEye","position":{ "x":78.4063190293659,"y":37.764908460327625} },{ "score":0.9517959356307983,"part":"leftEar","position":{ "x":85.48235373387962,"y":41.24184886769098} },{ "score":0.8045171499252319,"part":"rightEar","position":{ "x":75.94065695146018,"y":38.64753916105872} },{ "score":0.9985060691833496,"part":"leftShoulder","position":{ "x":86.80844921976514,"y":53.088924541547605} },{ "score":0.9996874928474426,"part":"rightShoulder","position":{ "x":70.3774065108904,"y":50.51078974504879} },{ "score":0.9984479546546936,"part":"leftElbow","position":{ "x":90.1693828368633,"y":66.22343649660104} },{ "score":0.9985679984092712,"part":"rightElbow","position":{ "x":61.156533350319975,"y":62.78893719387426} },{ "score":0.995936393737793,"part":"leftWrist","position":{ "x":97.65345799055517,"y":79.09869301643818} },{ "score":0.9973172545433044,"part":"rightWrist","position":{ "x":49.42695728706471,"y":66.00039025688913} },{ "score":0.9995830655097961,"part":"leftHip","position":{ "x":81.64645214437695,"y":78.08671914185996} },{ "score":0.9975977540016174,"part":"rightHip","position":{ "x":70.41104614511598,"y":77.34408397155049} },{ "score":0.9997063279151917,"part":"leftKnee","position":{ "x":82.33476958403716,"y":99.74699977770854} },{ "score":0.9998247623443604,"part":"rightKnee","position":{ "x":73.98716789769037,"y":98.6003926199234} },{ "score":0.9975147247314453,"part":"leftAnkle","position":{ "x":87.43423595150891,"y":119.83999734722687} },{ "score":0.9984537363052368,"part":"rightAnkle","position":{ "x":73.40259931092451,"y":118.2743974975111} }]},

// { "score":0.9907317371929393,"keypoints":[{ "score":0.9976304173469543,"part":"nose","position":{ "x":86.70963279422753,"y":39.07559316909731} },{ "score":0.9931168556213379,"part":"leftEye","position":{ "x":88.95267212167848,"y":37.939125387585115} },{ "score":0.9971168041229248,"part":"rightEye","position":{ "x":85.58536711948578,"y":37.19627781136955} },{ "score":0.9525057077407837,"part":"leftEar","position":{ "x":90.36855057619218,"y":40.0310550496736} },{ "score":0.9458303451538086,"part":"rightEar","position":{ "x":82.53758268296843,"y":38.366313741364834} },{ "score":0.9988411068916321,"part":"leftShoulder","position":{ "x":91.14544385882277,"y":52.64982542639113} },{ "score":0.9994663596153259,"part":"rightShoulder","position":{ "x":75.55275391640139,"y":49.888328225696135} },{ "score":0.9991844296455383,"part":"leftElbow","position":{ "x":94.32347795323871,"y":65.60580019820989} },{ "score":0.998466968536377,"part":"rightElbow","position":{ "x":71.13680046858758,"y":63.24603871148848} },{ "score":0.9884660243988037,"part":"leftWrist","position":{ "x":98.52425125978593,"y":76.41131746165948} },{ "score":0.9858195781707764,"part":"rightWrist","position":{ "x":66.74982603077086,"y":74.04704735900641} },{ "score":0.9984810948371887,"part":"leftHip","position":{ "x":88.55405684568282,"y":77.96524700951484} },{ "score":0.999228835105896,"part":"rightHip","position":{ "x":77.76389634733141,"y":78.14905426381627} },{ "score":0.998769998550415,"part":"leftKnee","position":{ "x":90.60013483566951,"y":97.60751123094373} },{ "score":0.99912029504776,"part":"rightKnee","position":{ "x":79.76157739207056,"y":98.63923484713187} },{ "score":0.9971076846122742,"part":"leftAnkle","position":{ "x":96.53822577272285,"y":119.44921857188184} },{ "score":0.9932870268821716,"part":"rightAnkle","position":{ "x":79.22260777717321,"y":117.79755024594556} }]}]
