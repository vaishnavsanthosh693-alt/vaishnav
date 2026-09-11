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
},

pencil: {
    name: "Pencil",
    emoji: "✏️"
},

bottle: {
    name: "Water Bottle",
    emoji: "🧴"
},

charger: {
    name: "Charger",
    emoji: "🔌"
},

spectacles: {
    name: "Spectacles",
    emoji: "👓"
},

pen: {
    name: "Pen",
    emoji: "🖊️"
},

eraser: {
    name: "Eraser",
    emoji: "◻️"
},

scale: {
    name: "Scale",
    emoji: "📏"
},

human: {
    name: "Human",
    emoji: "👤"
},

unknown: {
    name: "Other detected object",
    emoji: "✨"
}

};

const cameraSoulMap = {
    bottle: { soul: "Tired", emoji: "🧴", condition: "normal", message: "I have been carried everywhere today. A little rest would be lovely." },
    cup: { soul: "Happy", emoji: "☕", condition: "good", message: "I love being part of a warm little moment." },
    book: { soul: "Wise", emoji: "📖", condition: "good", message: "Every page I carry leaves me a little wiser." },
    keyboard: { soul: "Busy", emoji: "⌨️", condition: "normal", message: "There is always another thought waiting to be typed." },
    "cell phone": { soul: "Attention-seeking", emoji: "📱", condition: "normal", message: "Someone is always looking for me. I pretend not to enjoy it." },
    laptop: { soul: "Focused", emoji: "💻", condition: "good", message: "I am deep in the flow. Please do not distract me." },
    pencil: { soul: "Creative", emoji: "✏️", condition: "good", message: "Still ready to turn little ideas into something wonderful." },
    bottle: { soul: "Dependable", emoji: "🧴", condition: "good", message: "Always here to keep someone refreshed." },
    charger: { soul: "Energetic", emoji: "🔌", condition: "good", message: "Quietly giving everyone the energy they need." },
    spectacles: { soul: "Observant", emoji: "👓", condition: "good", message: "You help the world look a little clearer." },
    pen: { soul: "Expressive", emoji: "🖊️", condition: "good", message: "Always ready to leave a thoughtful mark." },
    eraser: { soul: "Forgiving", emoji: "◻️", condition: "good", message: "Some mistakes are lucky to have a friend like you." },
    scale: { soul: "Precise", emoji: "📏", condition: "good", message: "You keep every little measurement honest." },
    human: { soul: "Unique", emoji: "👤", condition: "normal", message: "Every visible expression tells part of a moment." },
    unknown: { soul: "Unknown", emoji: "✨", condition: "normal", message: "I don't know what I am yet... but every thing has a story." }
};

let cameraStream = null;
let objectModel = null;
let imageClassifier = null;
let capturedImage = null;
let cropper = null;
let faceModelsLoaded = false;

const cameraElements = {
    video: document.getElementById("cameraVideo"),
    frame: document.getElementById("cameraFrame"),
    canvas: document.getElementById("captureCanvas"),
    photo: document.getElementById("capturedPhoto"),
    placeholder: document.getElementById("cameraPlaceholder"),
    status: document.getElementById("cameraStatus"),
    startButton: document.getElementById("startCameraButton"),
    takeButton: document.getElementById("takePhotoButton"),
    upload: document.getElementById("imageUpload"),
    analyzeButton: document.getElementById("analyzePhotoButton"),
    retakeButton: document.getElementById("retakePhotoButton"),
    fullImageButton: document.getElementById("fullImageButton"),
    stopButton: document.getElementById("stopCameraButton"),
    cropPanel: document.getElementById("cropPanel"),
    cropImage: document.getElementById("cropImage"),
    cropAnalyzeButton: document.getElementById("cropAnalyzeButton"),
    chooseImageButton: document.getElementById("chooseImageButton"),
    detection: document.getElementById("detectionResult"),
    detectionLabel: document.getElementById("detectionLabel"),
    name: document.getElementById("detectedObjectName"),
    confidence: document.getElementById("detectedConfidence"),
    objects: document.getElementById("detectedObjectsList"),
    humanResult: document.getElementById("humanResult"),
    humanExpression: document.getElementById("humanExpression"),
    humanConfidence: document.getElementById("humanConfidence")
};

cameraElements.startButton.addEventListener("click", startCamera);
cameraElements.takeButton.addEventListener("click", takePhoto);
cameraElements.upload.addEventListener("change", handleImageUpload);
cameraElements.analyzeButton.addEventListener("click", analyzePhoto);
cameraElements.retakeButton.addEventListener("click", retakePhoto);
cameraElements.fullImageButton.addEventListener("click", useFullImage);
cameraElements.cropAnalyzeButton.addEventListener("click", cropAndAnalyze);
cameraElements.chooseImageButton.addEventListener("click", () => cameraElements.upload.click());
cameraElements.stopButton.addEventListener("click", stopCamera);

async function startCamera() {
    if (cameraStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus("This browser does not support camera access. You can still use the manual Soul selector below.");
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
        cameraElements.video.classList.remove("hidden");
        cameraElements.photo.classList.add("hidden");
        cameraElements.placeholder.classList.add("hidden");
        cameraElements.cropPanel.classList.add("hidden");
        cameraElements.takeButton.disabled = false;
        cameraElements.stopButton.disabled = false;
        setCameraStatus("Camera is ready. Frame your object, then take a photo.");
    } catch (error) {
        console.error("Camera start error:", error);
        stopCamera(false);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setCameraStatus("Camera permission was denied. Please allow camera access in your browser settings, then try again.");
        } else {
            setCameraStatus("I could not start the camera. Check that it is connected and not being used by another app.");
        }
    }
}

async function loadObjectModel() {
    if (objectModel) return objectModel;
    if (!window.cocoSsd) throw new Error("The object-detection model could not be loaded.");
    setCameraStatus("Loading the object-detection model...");
    objectModel = await cocoSsd.load();
    return objectModel;
}

async function loadImageClassifier() {
    if (imageClassifier) return imageClassifier;
    if (!window.mobilenet) return null;
    imageClassifier = await mobilenet.load({ version: 2, alpha: 1.0 });
    return imageClassifier;
}

async function getClassifierDetections() {
    try {
        const classifier = await loadImageClassifier();
        if (!classifier) return [];
        const classifications = await classifier.classify(cameraElements.canvas, 5);
        return classifications
            .map((classification) => ({
                class: classification.className,
                score: classification.probability,
                bbox: null,
                source: "image-classifier"
            }))
            .filter((prediction) => ["pencil", "pen", "eraser", "ruler", "water bottle", "bottle", "eyeglasses", "spectacles"].includes(normalizeDetectedLabel(prediction.class)));
    } catch (error) {
        console.warn("Optional image classifier unavailable:", error);
        return [];
    }
}

function takePhoto() {
    if (!cameraStream || cameraElements.video.readyState < 2) {
        setCameraStatus("Start the camera before taking a photo.");
        return;
    }

    cameraElements.canvas.width = cameraElements.video.videoWidth;
    cameraElements.canvas.height = cameraElements.video.videoHeight;
    const context = cameraElements.canvas.getContext("2d");
    context.drawImage(cameraElements.video, 0, 0, cameraElements.canvas.width, cameraElements.canvas.height);
    capturedImage = cameraElements.canvas.toDataURL("image/jpeg", 0.92);
    openCropEditor(capturedImage);
    cameraElements.video.classList.add("hidden");
    cameraElements.photo.classList.remove("hidden");
    cameraElements.takeButton.disabled = true;
    cameraElements.analyzeButton.disabled = true;
    cameraElements.retakeButton.disabled = false;
    cameraElements.fullImageButton.disabled = false;
    setCameraStatus("Photo captured. Crop the image or use the full image for analysis.");
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setCameraStatus("Please choose a JPG, PNG, or WEBP image.");
        return;
    }
    resetAutomaticAnalysis();
    stopCamera(false);
    const reader = new FileReader();
    reader.onload = () => {
        capturedImage = reader.result;
        openCropEditor(capturedImage);
        cameraElements.upload.value = "";
        setCameraStatus("Image loaded. Crop it or use the full image for analysis.");
    };
    reader.readAsDataURL(file);
}

function openCropEditor(imageSource) {
    cameraElements.photo.src = imageSource;
    cameraElements.photo.classList.remove("hidden");
    cameraElements.cropImage.src = imageSource;
    cameraElements.cropPanel.classList.remove("hidden");
    cameraElements.fullImageButton.disabled = false;
    if (cropper) cropper.destroy();
    cropper = new Cropper(cameraElements.cropImage, { viewMode: 1, autoCropArea: 0.85, responsive: true });
}

function cropAndAnalyze() {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: "high" });
    if (!croppedCanvas) return;
    capturedImage = croppedCanvas.toDataURL("image/jpeg", 0.92);
    cameraElements.canvas.width = croppedCanvas.width;
    cameraElements.canvas.height = croppedCanvas.height;
    cameraElements.canvas.getContext("2d").drawImage(croppedCanvas, 0, 0);
    cameraElements.photo.src = capturedImage;
    cameraElements.cropPanel.classList.add("hidden");
    cameraElements.analyzeButton.disabled = false;
    setCameraStatus("Crop saved. Analyze the final cropped image when ready.");
}

function useFullImage() {
    if (!capturedImage) return;
    const image = new Image();
    image.onload = () => {
        cameraElements.canvas.width = image.naturalWidth;
        cameraElements.canvas.height = image.naturalHeight;
        cameraElements.canvas.getContext("2d").drawImage(image, 0, 0);
        if (cropper) cropper.destroy();
        cropper = null;
        cameraElements.cropPanel.classList.add("hidden");
        cameraElements.analyzeButton.disabled = false;
        setCameraStatus("Using the full image. Analyze it when ready.");
    };
    image.src = capturedImage;
}

async function analyzePhoto() {
    if (!capturedImage) {
        setCameraStatus("Take a photo before analyzing it.");
        return;
    }

    cameraElements.analyzeButton.disabled = true;
    setCameraStatus("Analyzing the captured photo...");

    try {
        const model = await loadObjectModel();
        const predictions = await model.detect(cameraElements.canvas);
        const classifierDetections = await getClassifierDetections();
        showPhotoDetections(mergeDetections(predictions, classifierDetections));
        await analyzeHumanExpression();
    } catch (error) {
        console.error("Photo analysis error:", error);
        cameraElements.analyzeButton.disabled = false;
        setCameraStatus("I could not analyze that photo. Please retake it and try again.");
    }
}

function mergeDetections(detectorPredictions, classifierPredictions) {
    const merged = [...detectorPredictions];
    classifierPredictions.forEach((candidate) => {
        const candidateLabel = normalizeDetectedLabel(candidate.class);
        const detectorMatch = merged.find((prediction) => normalizeDetectedLabel(prediction.class) === candidateLabel);
        if (!detectorMatch) merged.push(candidate);
    });
    return merged;
}

async function analyzeHumanExpression() {
    const hasPerson = Array.from(cameraElements.objects.querySelectorAll("p"))
        .some((item) => item.textContent.toLowerCase().includes("person"));
    if (!window.faceapi) return;

    try {
        if (!faceModelsLoaded) {
            const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
            await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
            faceModelsLoaded = true;
        }
        const faces = await faceapi.detectAllFaces(
            cameraElements.canvas,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        ).withFaceExpressions();
        const face = faces[0];
        if (!face && hasPerson) {
            setAutomaticCondition("expression-unknown");
            setSweetComment(getSweetComment("human", "expression-unknown"));
            cameraElements.humanResult.classList.remove("hidden");
            return;
        }
        if (!face) return;

        if (!hasPerson) {
            const faceConfidence = Math.round((face.detection?.score || 0) * 100);
            if (faceConfidence >= 50) {
                const humanSoul = getSoulForDetection("human");
                syncDetectedObjectToSoulControls("human", humanSoul);
                setAutomaticCondition("expression-unknown");
                setSweetComment(getSweetComment("human", "expression-unknown"));
                cameraElements.detection.classList.remove("hidden");
                cameraElements.detectionLabel.textContent = "Human detected";
                cameraElements.name.textContent = "Human";
                cameraElements.confidence.textContent = `Confidence: ${faceConfidence}%`;
                cameraElements.objects.innerHTML = `<p>1. Human — ${faceConfidence}%</p>`;
                applyDetectedSoul("Human", humanSoul, faceConfidence);
            }
        }
        const best = Object.entries(face.expressions).sort((first, second) => second[1] - first[1])[0];
        const expressionConfidence = best ? Math.round(best[1] * 100) : 0;
        const expression = best && expressionConfidence >= 45 ? best[0] : "expression-unknown";
        cameraElements.humanExpression.textContent = expression === "expression-unknown" ? "Unknown" : expression.charAt(0).toUpperCase() + expression.slice(1);
        cameraElements.humanConfidence.textContent = best ? `Confidence: ${expressionConfidence}%` : "Confidence: —";
        setAutomaticCondition(expression);
        setSweetComment(getSweetComment("human", expression));
        cameraElements.humanResult.classList.remove("hidden");
    } catch (error) {
        console.error("Human expression analysis error:", error);
        cameraElements.humanExpression.textContent = "Unknown";
        cameraElements.humanConfidence.textContent = "Confidence: —";
        setAutomaticCondition("expression-unknown");
        setSweetComment(getSweetComment("human", "expression-unknown"));
        cameraElements.humanResult.classList.remove("hidden");
    }
}

function showPhotoDetections(predictions) {
    const detections = predictions
        .filter((prediction) => prediction && prediction.class && Number.isFinite(prediction.score))
        .sort((first, second) => second.score - first.score);

    cameraElements.detection.classList.remove("hidden");
    cameraElements.objects.innerHTML = "";

    if (!detections.length) {
        resetAutomaticAnalysis();
        cameraElements.detectionLabel.textContent = "Object not recognized";
        cameraElements.name.textContent = "Please retake the photo.";
        cameraElements.confidence.textContent = "Confidence: —";
        document.getElementById("result").classList.add("hidden");
        setCameraStatus("No object was detected in the captured photo. Please retake it.");
        return;
    }

    const primary = choosePrimaryDetection(detections);
    if (primary.score < 0.35) {
        resetAutomaticAnalysis();
        cameraElements.detection.classList.remove("hidden");
        cameraElements.detectionLabel.textContent = "Object uncertain";
        cameraElements.name.textContent = "Unknown";
        cameraElements.confidence.textContent = `Confidence: ${Math.round(primary.score * 100)}%`;
        setCameraStatus("Object could not be identified clearly. Please use a clearer image.");
        return;
    }
    const primaryConfidence = Math.round(primary.score * 100);
    const normalizedPrimary = normalizeDetectedLabel(primary.class);
    const soul = getSoulForDetection(normalizedPrimary);
    syncDetectedObjectToSoulControls(normalizedPrimary, soul);
    const primaryKey = normalizedPrimary === "human" ? "human" : normalizedPrimary;
    const automaticCondition = primaryKey === "human" ? "expression-unknown" : "unknown";
    setAutomaticCondition(automaticCondition);
    setSweetComment(getSweetComment(primaryKey, automaticCondition));
    cameraElements.detectionLabel.textContent = primary.score < 0.35 ? "Object uncertain" : "Object detected";
    cameraElements.name.textContent = primary.score < 0.35 ? `Best detection: ${displayDetectedLabel(normalizedPrimary)}` : displayDetectedLabel(normalizedPrimary);
    cameraElements.confidence.textContent = `Confidence: ${primaryConfidence}%`;

    detections.forEach((prediction, index) => {
        const item = document.createElement("p");
        item.textContent = `${index + 1}. ${prediction.class} — ${Math.round(prediction.score * 100)}%`;
        cameraElements.objects.appendChild(item);
    });

    applyDetectedSoul(displayDetectedLabel(normalizedPrimary), soul, primaryConfidence);
    setCameraStatus(`Photo analyzed. ${displayDetectedLabel(normalizedPrimary)} is selected below. Visible condition could not be determined by the available model, so it is set to Unknown.`);
}

function choosePrimaryDetection(detections) {
    const imageWidth = cameraElements.canvas.width || 1;
    const imageHeight = cameraElements.canvas.height || 1;
    const imageArea = imageWidth * imageHeight;
    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;

    return detections
        .map((prediction, index) => {
            const [x = 0, y = 0, width = 0, height = 0] = prediction.bbox || [];
            const areaRatio = Math.min(1, Math.max(0, (width * height) / imageArea));
            const boxCenterX = x + width / 2;
            const boxCenterY = y + height / 2;
            const centerDistance = Math.hypot(boxCenterX - centerX, boxCenterY - centerY);
            const maxDistance = Math.hypot(centerX, centerY) || 1;
            const centerWeight = 1 - Math.min(1, centerDistance / maxDistance);
            const prominence = prediction.score * 0.55 + areaRatio * 0.3 + centerWeight * 0.15;
            return { prediction, index, prominence };
        })
        .sort((first, second) => second.prominence - first.prominence || first.index - second.index)[0].prediction;
}

function normalizeDetectedLabel(label) {
    const normalized = String(label || "")
        .toLowerCase()
        .replace(/[\-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const aliases = {
        "cell phone": "phone",
        "mobile phone": "phone",
        smartphone: "phone",
        phone: "phone",
        ruler: "scale",
        "measuring ruler": "scale",
        eyeglasses: "spectacles",
        glasses: "spectacles",
        spectacles: "spectacles",
        person: "human",
        human: "human",
        "potted plant": "plant",
        bottle: "bottle",
        "water bottle": "bottle"
    };
    return aliases[normalized] || normalized;
}

function displayDetectedLabel(label) {
    const names = {
        phone: "Phone",
        scale: "Scale",
        spectacles: "Spectacles",
        bottle: "Water Bottle",
        human: "Human"
    };
    return names[label] || label.replace(/\b\w/g, (character) => character.toUpperCase());
}

function syncDetectedObjectToSoulControls(detectedClass, soul) {
    const thingKey = normalizeDetectedLabel(detectedClass);
    const thingSelect = document.getElementById("thing");
    const conditionSelect = document.getElementById("condition");

    if (things[thingKey] && thingSelect) {
        thingSelect.value = thingKey;
        thingSelect.dispatchEvent(new Event("change", { bubbles: true }));
        document.getElementById("objectEmoji").textContent = things[thingKey].emoji;
        document.getElementById("objectName").textContent = things[thingKey].name;
    } else if (thingSelect) {
        thingSelect.value = "unknown";
        thingSelect.dispatchEvent(new Event("change", { bubbles: true }));
        document.getElementById("objectEmoji").textContent = things.unknown.emoji;
        document.getElementById("objectName").textContent = `${detectedClass} - Other detected object`;
    }

    if (soul && soul.condition && conditionSelect && Array.from(conditionSelect.options).some((option) => option.value === soul.condition)) {
        conditionSelect.value = soul.condition;
        conditionSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

function getSoulForDetection(detectedClass) {
    const thingKey = normalizeDetectedLabel(detectedClass);
    if (cameraSoulMap[thingKey]) return cameraSoulMap[thingKey];
    if (things[thingKey] && thingKey !== "unknown") {
        const condition = "normal";
        return {
            soul: condition === "normal" ? "Okay" : "Unknown",
            emoji: things[thingKey].emoji,
            condition,
            message: getMessage(thingKey, condition)
        };
    }
    return cameraSoulMap[thingKey] || cameraSoulMap.unknown;
}

function setAutomaticCondition(condition) {
    const conditionSelect = document.getElementById("condition");
    if (!conditionSelect) return;
    const validCondition = Array.from(conditionSelect.options).some((option) => option.value === condition);
    conditionSelect.value = validCondition ? condition : "unknown";
    conditionSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function setSweetComment(comment) {
    const element = document.getElementById("sweetComment");
    if (element) element.textContent = comment ? `💬 Sweet comment: "${comment}"` : "";
}

function resetAutomaticAnalysis() {
    const thingSelect = document.getElementById("thing");
    const conditionSelect = document.getElementById("condition");
    if (thingSelect) {
        thingSelect.value = "unknown";
        thingSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (conditionSelect) {
        conditionSelect.value = "unknown";
        conditionSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    cameraElements.detection.classList.add("hidden");
    cameraElements.humanResult.classList.add("hidden");
    cameraElements.name.textContent = "Waiting for a captured photo...";
    cameraElements.confidence.textContent = "Confidence: —";
    cameraElements.objects.innerHTML = "";
    setSweetComment("");
}

function getSweetComment(thingKey, condition) {
    const comments = {
        pencil: { good: "Still ready to turn little ideas into something wonderful." },
        bottle: { good: "Always here to keep someone refreshed." },
        charger: { good: "Quietly giving everyone the energy they need." },
        spectacles: { good: "You help the world look a little clearer." },
        eraser: { good: "Some mistakes are lucky to have a friend like you." },
        human: {
            happy: "That smile makes the moment feel a little brighter.",
            sad: "Even quiet moments deserve a little kindness.",
            angry: "Looks like today needs a little patience.",
            neutral: "Calm, quiet, and simply being yourself."
        }
    };
    return comments[thingKey]?.[condition] || comments[thingKey]?.good || "Every visible detail has a little story to tell.";
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

function retakePhoto() {
    capturedImage = null;
    resetAutomaticAnalysis();
    cameraElements.photo.removeAttribute("src");
    cameraElements.photo.classList.add("hidden");
    cameraElements.video.classList.remove("hidden");
    cameraElements.takeButton.disabled = !cameraStream;
    cameraElements.analyzeButton.disabled = true;
    cameraElements.fullImageButton.disabled = true;
    cameraElements.retakeButton.disabled = true;
    setCameraStatus(cameraStream ? "Live camera restored. Frame your object, then take a photo." : "Camera is off. Start it to take another photo.");
}

function stopCamera(showStatus = true) {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    if (cameraElements.video) cameraElements.video.srcObject = null;
    if (cameraElements.placeholder) cameraElements.placeholder.classList.remove("hidden");
    cameraElements.video.classList.add("hidden");
    cameraElements.takeButton.disabled = true;
    cameraElements.stopButton.disabled = true;
    cameraElements.startButton.disabled = false;
    if (showStatus) setCameraStatus("Camera is off. Start it to take a photo.");
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

const humanExpression = ["happy", "sad", "angry", "surprised", "neutral", "fearful", "disgusted"].includes(condition);
const messageCondition = ["good", "normal", "damaged", "bad"].includes(condition) ? condition : "normal";


// ================================  
// EMOTION LEVELS  
// ================================  

if (humanExpression) {

    const expressionLabels = {
        happy: "😊 Happy",
        sad: "😢 Sad",
        angry: "😠 Angry",
        surprised: "😮 Surprised",
        neutral: "😐 Neutral",
        fearful: "😨 Fearful",
        disgusted: "🤢 Disgusted"
    };
    emotion = expressionLabels[condition];
    message = getSweetComment("human", condition);
    happy = condition === "happy" ? 90 : 45;
    sad = condition === "sad" ? 80 : 25;
    confidence = 65;

}

else if (condition === "good" || condition === "new") {  

    emotion = "😊 Happy";  

    message = getMessage(thing, "good");  

    happy = 95;  
    sad = 5;  
    confidence = 90;  

}  


else if (["normal", "used", "unknown", "expression-unknown"].includes(condition)) {  

    emotion = "🙂 Okay";  

    message = getMessage(thing, messageCondition);  

    happy = 65;  
    sad = 20;  
    confidence = 65;  

}  


else if (["damaged", "broken", "cracked", "rusty", "wet", "dirty"].includes(condition)) {  

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

    },

    unknown: {

        good:
            "I am still learning what I am, but I am happy to be noticed.",

        normal:
            "I am an object with a story that has not been identified yet.",

        damaged:
            "I may need a closer look before anyone can tell how I am doing.",

        bad:
            "Please take another photo so someone can understand me better."

    }

};  


    const thingMessages = messages[thing] || messages.unknown;
    return thingMessages[condition] || thingMessages.normal || messages.unknown.normal;

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