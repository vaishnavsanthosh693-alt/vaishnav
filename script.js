const things = {

brick: {  
    name: "Cement Brick",  
    emoji: "🧱"  
},  

chair: {  
    name: "Chair",  
    emoji: "🪑"  
},  

phone: {  
    name: "Phone",  
    emoji: "📱"  
},  

plant: {  
    name: "Plant",  
    emoji: "🌱"  
},  

car: {  
    name: "Car",  
    emoji: "🚗"  
},  

book: {  
    name: "Book",  
    emoji: "📖"  
},  

guitar: {  
    name: "Guitar",  
    emoji: "🎸"  
},  

shoe: {  
    name: "Shoe",  
    emoji: "👟"  
}

};

const cameraSoulMap = {
    bottle: { soul: "Tired", emoji: "🧴", condition: "normal", message: "I have been carried everywhere today. A little rest would be lovely." },
    cup: { soul: "Happy", emoji: "☕", condition: "good", message: "I love being part of a warm little moment." },
    book: { soul: "Wise", emoji: "📖", condition: "good", message: "Every page I carry leaves me a little wiser." },
    keyboard: { soul: "Busy", emoji: "⌨️", condition: "normal", message: "There is always another thought waiting to be typed." },
    "cell phone": { soul: "Attention-seeking", emoji: "📱", condition: "normal", message: "Someone is always looking for me. I pretend not to enjoy it." },
    laptop: { soul: "Focused", emoji: "💻", condition: "good", message: "I am deep in the flow. Please do not distract me." },
    person: { soul: "Unknown", emoji: "🪞", condition: "normal", message: "I do not know what I am yet... but I am glad you are curious." },
    unknown: { soul: "Unknown", emoji: "✨", condition: "normal", message: "I don't know what I am yet... but every thing has a story." }
};

let cameraStream = null;
let objectModel = null;
let detectionTimer = null;
let lastDetectedLabel = "";

const cameraElements = {
    video: document.getElementById("cameraVideo"),
    frame: document.getElementById("cameraFrame"),
    placeholder: document.getElementById("cameraPlaceholder"),
    status: document.getElementById("cameraStatus"),
    startButton: document.getElementById("analyzeObjectButton"),
    stopButton: document.getElementById("stopCameraButton"),
    detection: document.getElementById("detectionResult"),
    name: document.getElementById("detectedObjectName"),
    confidence: document.getElementById("detectedConfidence")
};

if (cameraElements.startButton) {
    cameraElements.startButton.addEventListener("click", startCameraAnalyzer);
    cameraElements.stopButton.addEventListener("click", stopCameraAnalyzer);
}

async function startCameraAnalyzer() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus("This browser does not support camera access. You can still use the manual soul selector below.");
        return;
    }

    cameraElements.startButton.disabled = true;
    setCameraStatus("Requesting camera permission...");

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        cameraElements.video.srcObject = cameraStream;
        await cameraElements.video.play();
        cameraElements.placeholder.classList.add("hidden");
        cameraElements.frame.classList.add("is-scanning");
        cameraElements.stopButton.disabled = false;
        setCameraStatus("Camera is ready. Hold one object in view while I look for its soul...");
        await loadObjectModel();
        beginDetection();
    } catch (error) {
        console.error("Camera analyzer error:", error);
        stopCameraAnalyzer();
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setCameraStatus("Camera permission was denied. Please allow camera access in your browser settings, then try again.");
        } else {
            setCameraStatus("I could not start the camera. Check that it is connected and not being used by another app.");
        }
    }
}

async function loadObjectModel() {
    if (objectModel) return objectModel;
    if (!window.cocoSsd) throw new Error("The object detection model could not be loaded.");
    setCameraStatus("Camera is on. Loading the object-sensing part of my soul...");
    objectModel = await cocoSsd.load();
    return objectModel;
}

function beginDetection() {
    clearInterval(detectionTimer);
    detectObject();
    detectionTimer = setInterval(detectObject, 900);
}

async function detectObject() {
    if (!objectModel || !cameraStream || cameraElements.video.readyState < 2) return;
    try {
        const predictions = await objectModel.detect(cameraElements.video);
        const bestPrediction = predictions
            .filter((prediction) => prediction.score >= 0.35)
            .sort((first, second) => second.score - first.score)[0];
        if (bestPrediction) showDetectedObject(bestPrediction);
    } catch (error) {
        console.error("Object detection error:", error);
        setCameraStatus("The camera is still on, but I had trouble reading that frame. Try holding the object steady.");
    }
}

function showDetectedObject(prediction) {
    const label = prediction.class.toLowerCase();
    const confidence = Math.round(prediction.score * 100);
    const soul = cameraSoulMap[label] || cameraSoulMap.unknown;
    cameraElements.name.textContent = `${prediction.class} - ${soul.soul}`;
    cameraElements.confidence.textContent = `${confidence}% detected`;
    cameraElements.detection.classList.remove("hidden");
    setCameraStatus(`I see a ${prediction.class}. Now I am listening to its soul...`);

    if (label !== lastDetectedLabel) {
        lastDetectedLabel = label;
        applyDetectedSoul(prediction.class, soul, confidence);
    }
}

function applyDetectedSoul(name, soul, confidence) {
    document.getElementById("objectEmoji").textContent = soul.emoji;
    document.getElementById("objectName").textContent = `${name} - ${soul.soul}`;
    document.getElementById("emotionEmoji").textContent = soul.emoji;
    document.getElementById("emotionName").textContent = soul.soul;
    document.getElementById("message").textContent = soul.message;

    const happy = soul.condition === "good" ? 90 : 55;
    const sad = soul.condition === "good" ? 10 : 25;
    showStats(happy, sad, confidence);
    animateObject(soul.condition);
    createParticles(soul.condition);
    screenEffect(soul.condition);
    document.getElementById("result").classList.remove("hidden");
}

function showStats(happy, sad, confidence) {
    document.getElementById("happyBar").style.width = `${happy}%`;
    document.getElementById("happyValue").textContent = `${happy}%`;
    document.getElementById("sadBar").style.width = `${sad}%`;
    document.getElementById("sadValue").textContent = `${sad}%`;
    document.getElementById("confidenceBar").style.width = `${confidence}%`;
    document.getElementById("confidenceValue").textContent = `${confidence}%`;
}

function setCameraStatus(message) {
    if (cameraElements.status) cameraElements.status.textContent = message;
}

function stopCameraAnalyzer() {
    clearInterval(detectionTimer);
    detectionTimer = null;
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    lastDetectedLabel = "";
    if (cameraElements.video) cameraElements.video.srcObject = null;
    if (cameraElements.placeholder) cameraElements.placeholder.classList.remove("hidden");
    if (cameraElements.frame) cameraElements.frame.classList.remove("is-scanning");
    if (cameraElements.startButton) cameraElements.startButton.disabled = false;
    if (cameraElements.stopButton) cameraElements.stopButton.disabled = true;
    setCameraStatus("Camera is off. Start it to analyze an object.");
}

// ================================
// MAIN EMOTION SYSTEM
// ================================

function checkEmotion() {

const thing = document.getElementById("thing").value;  
const condition = document.getElementById("condition").value;  

const selectedThing = things[thing];  

if (!selectedThing) return;  


// Object information  
document.getElementById("objectEmoji").textContent =  
    selectedThing.emoji;  

document.getElementById("objectName").textContent =  
    selectedThing.name;  


let emotion;  
let message;  
let happy;  
let sad;  
let confidence;  


// ================================  
// EMOTION LEVELS  
// ================================  

if (condition === "good") {  

    emotion = "😊 Happy";  

    message = getMessage(thing, "good");  

    happy = 95;  
    sad = 5;  
    confidence = 90;  

}  


else if (condition === "normal") {  

    emotion = "🙂 Okay";  

    message = getMessage(thing, "normal");  

    happy = 65;  
    sad = 20;  
    confidence = 65;  

}  


else if (condition === "damaged") {  

    emotion = "😟 Worried";  

    message = getMessage(thing, "damaged");  

    happy = 30;  
    sad = 60;  
    confidence = 25;  

}  


else {  

    emotion = "😢 Sad";  

    message = getMessage(thing, "bad");  

    happy = 10;  
    sad = 90;  
    confidence = 10;  

}  


// ================================  
// UPDATE TEXT  
// ================================  

document.getElementById("emotionEmoji").textContent =  
    emotion.split(" ")[0];  

document.getElementById("emotionName").textContent =  
    emotion.substring(emotion.indexOf(" ") + 1);  

document.getElementById("message").textContent =  
    message;  


// ================================  
// UPDATE BARS  
// ================================  

document.getElementById("happyBar").style.width =  
    happy + "%";  

document.getElementById("happyValue").textContent =
    happy + "%";

document.getElementById("sadBar").style.width =  
    sad + "%";  

document.getElementById("sadValue").textContent =
    sad + "%";

document.getElementById("confidenceBar").style.width =  
    confidence + "%";  

document.getElementById("confidenceValue").textContent =
    confidence + "%";


// ================================  
// ADVANCED ANIMATION  
// ================================  

animateObject(condition);  

createParticles(condition);  

screenEffect(condition);  


// Show result  
document.getElementById("result").classList.remove("hidden");

}

// ======================================
// OBJECT ANIMATION
// ======================================

function animateObject(condition) {

const object = document.getElementById("objectEmoji");  

if (!object) return;  


// Remove previous animation  
object.classList.remove(  
    "happyAnimation",  
    "normalAnimation",  
    "damagedAnimation",  
    "sadAnimation"  
);  


// Force browser to restart animation  
void object.offsetWidth;  


if (condition === "good") {  

    object.classList.add("happyAnimation");  

}  

else if (condition === "normal") {  

    object.classList.add("normalAnimation");  

}  

else if (condition === "damaged") {  

    object.classList.add("damagedAnimation");  

}  

else {  

    object.classList.add("sadAnimation");  

}

}

// ======================================
// SCREEN EFFECT
// ======================================

function screenEffect(condition) {

document.body.classList.remove(  
    "goodEffect",  
    "normalEffect",  
    "damagedEffect",  
    "sadEffect"  
);  

void document.body.offsetWidth;  


if (condition === "good") {  

    document.body.classList.add("goodEffect");  

}  

else if (condition === "normal") {  

    document.body.classList.add("normalEffect");  

}  

else if (condition === "damaged") {  

    document.body.classList.add("damagedEffect");  

}  

else {  

    document.body.classList.add("sadEffect");  

}

}

// ======================================
// PARTICLE SYSTEM
// ======================================

function createParticles(condition) {

const container =  
    document.getElementById("particles");  

if (!container) return;  


container.innerHTML = "";  


let particleCount = 12;  


if (condition === "good") {  

    particleCount = 25;  

}  

else if (condition === "normal") {  

    particleCount = 8;  

}  

else if (condition === "damaged") {  

    particleCount = 15;  

}  

else {  

    particleCount = 10;  

}  


for (let i = 0; i < particleCount; i++) {  

    const particle =  
        document.createElement("span");  

    particle.classList.add("particle");  


    // Random position  
    particle.style.left =  
        Math.random() * 100 + "%";  

    particle.style.top =  
        Math.random() * 100 + "%";  


    // Random animation delay  
    particle.style.animationDelay =  
        Math.random() * 2 + "s";  


    // Different particles  
    if (condition === "good") {  

        particle.textContent =  
            Math.random() > 0.5 ? "✨" : "⭐";  

    }  

    else if (condition === "damaged") {  

        particle.textContent =  
            Math.random() > 0.5 ? "💥" : "⚡";  

    }  

    else if (condition === "bad") {  

        particle.textContent =  
            Math.random() > 0.5 ? "💧" : "☁️";  

    }  

    else {  

        particle.textContent = "•";  

    }  


    container.appendChild(particle);  

}

}

// ======================================
// OBJECT MESSAGES
// ======================================

function getMessage(thing, condition) {

const messages = {  

    brick: {  

        good:  
            "I'm strong! I feel like I can support the whole world! 🧱✨",  

        normal:  
            "I'm just an ordinary brick having an ordinary day.",  

        damaged:  
            "I'm cracked... I hope someone repairs me. 😟",  

        bad:  
            "I've been through a lot. I don't feel very strong anymore. 😢"  

    },  


    chair: {  

        good:  
            "I'm stable and ready for someone to sit on me! 🪑✨",  

        normal:  
            "Another normal day of supporting people.",  

        damaged:  
            "Please be careful... one of my legs isn't feeling great.",  

        bad:  
            "I really need some repair. 😢"  

    },  


    phone: {  

        good:  
            "Battery full! I'm ready for action! 📱⚡",  

        normal:  
            "I'm doing okay. Maybe charge me later.",  

        damaged:  
            "My screen isn't feeling very good... 😟",  

        bad:  
            "Please... I need some care. 😢"  

    },  


    plant: {  

        good:  
            "I'm growing beautifully! 🌱✨",  

        normal:  
            "I'm okay. A little sunlight would be nice.",  

        damaged:  
            "My leaves aren't feeling very healthy.",  

        bad:  
            "I really need some water and care. 💧"  

    },  


    car: {  

        good:  
            "Look at me! I'm ready for the road! 🚗💨",  

        normal:  
            "Nothing special today. Just cruising.",  

        damaged:  
            "That wasn't a very good day... 😟",  

        bad:  
            "I need repairs before I can go anywhere."  

    },  


    book: {  

        good:  
            "Someone takes good care of me. 📖✨",  

        normal:  
            "I'm waiting for someone to read me.",  

        damaged:  
            "My pages are getting hurt. 😟",  

        bad:  
            "Please don't throw me away. 😢"  

    },  


    guitar: {  

        good:  
            "Play me! I'm ready to make music! 🎸🎵",  

        normal:  
            "I'm just waiting for someone to play me.",  

        damaged:  
            "My body isn't feeling right.",  

        bad:  
            "I miss making music. 😢"  

    },  


    shoe: {  

        good:  
            "I'm clean and ready for another adventure! 👟✨",  

        normal:  
            "Just another day of walking around.",  

        damaged:  
            "I've walked a lot... I'm getting tired.",  

        bad:  
            "Please give me some rest. 😢"  

    }  

};  


return messages[thing][condition];

}

// ======================================
// RANDOM LITTLE LIFE
// ======================================

setInterval(() => {

const object =  
    document.getElementById("objectEmoji");  

if (!object) return;  

if (!object.classList.contains("happyAnimation") &&  
    !object.classList.contains("sadAnimation")) {  

    object.style.transform =  
        "translateY(-5px)";  

    setTimeout(() => {  

        object.style.transform =  
            "translateY(0)";  

    }, 400);  

}

}, 5000);