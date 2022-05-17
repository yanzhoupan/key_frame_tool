import * as posenet from '@tensorflow-models/posenet';

const color = 'aqua';
const lineWidth = 2;


export function drawScreenshot(video, pose, flip=false, minPoseConfidence=0.0, minPartConfidence = 0.0){
    /*
        Draw screenshot with key points
    */
    var canvas = document.createElement("canvas");

    // scale the canvas accordingly
    var scale = 0.6;
    // console.log('video width:', video.width)
    canvas.width = video.width * scale;
    canvas.height = video.height * scale;    

    // draw the video at that frame
    var ctx = canvas.getContext('2d');
    if(flip){
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        // draw keypoints on the screenshot
        if(pose.score >= minPoseConfidence){
            drawSkeleton(pose.keypoints, minPartConfidence, ctx, scale, flip=true);
        }
    }else{
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if(pose.score >= minPoseConfidence){
            drawSkeleton(pose.keypoints, minPartConfidence, ctx, scale, flip=false);
        }
    }
    
    //insert to the bginning of the display div
    var first = document.getElementById("resultDesplay").firstChild; //get the first element
    document.getElementById("resultDesplay").insertBefore(canvas, first);
}


function drawKeypoints(keypoints, minConfidence, ctx, scale=1, flip=false) {
    /*
        Draw the keypoints if it's score is larger than minConfidence
    */
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
    
        if (keypoint.score < minConfidence) {
            continue;
        }
  
        const {y, x} = keypoint.position;
        if (flip){
            x = ctx.canvas.width/scale  - x;
        }
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
  }

export function drawPoint(ctx, y, x, r, color) {
    /*
        Draw a single point
    */
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}


export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1, flip=false) {
    const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);
  
    adjacentKeyPoints.forEach((keypoints) => {
      drawSegment(
          toTuple(keypoints[0].position, ctx, scale, flip), toTuple(keypoints[1].position, ctx, scale, flip), color,
          scale, ctx, flip);
    });
}


export function drawSegment([ay, ax], [by, bx], color, scale, ctx, flip=false) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function toTuple({y, x}, ctx, scale, flip=false) {
    if (flip){
        return [y, ctx.canvas.width/scale  - x];
    }
    return [y, x];
}