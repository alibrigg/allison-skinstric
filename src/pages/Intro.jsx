import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import apertureImage from "../assets/aperture.svg";
import mountainImage from "../assets/mountain.svg";
import { saveAnalysisResults } from "../utils/analysisResults";
import "./Intro.css";

const validAnswerPattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const userInfoStorageKey = "skinstricUserInfo";

const loadStoredUserInfo = () => {
  try {
    const storedInfo = window.localStorage.getItem(userInfoStorageKey);
    if (!storedInfo) {
      return { name: "", location: "", error: "" };
    }

    const parsedInfo = JSON.parse(storedInfo);
    if (
      typeof parsedInfo.name !== "string" ||
      typeof parsedInfo.location !== "string"
    ) {
      throw new Error("Saved user information is in an invalid format.");
    }

    return { name: parsedInfo.name, location: parsedInfo.location, error: "" };
  } catch (error) {
    console.error("Unable to load saved user information.", error);
    return {
      name: "",
      location: "",
      error: "Unable to load saved information from this browser.",
    };
  }
};

const Intro = () => {
  const navigate = useNavigate();
  const [initialUserInfo] = useState(loadStoredUserInfo);
  const [step, setStep] = useState("name");
  const [name, setName] = useState(initialUserInfo.name);
  const [location, setLocation] = useState(initialUserInfo.location);
  const [leavePrompt, setLeavePrompt] = useState(null);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraCaptureError, setCameraCaptureError] = useState("");
  const [cameraCountdown, setCameraCountdown] = useState(null);
  const [capturedCameraImage, setCapturedCameraImage] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageSubmitted, setImageSubmitted] = useState(false);
  const [imageError, setImageError] = useState("");
  const [storageError, setStorageError] = useState(initialUserInfo.error);
  const [submissionError, setSubmissionError] = useState("");
  const cameraVideoRef = useRef(null);
  const captureCameraImageRef = useRef(null);

  useEffect(() => {
    if (step !== "camera-loading") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setStep("camera"), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [step]);

  useEffect(() => {
    if (step === "camera" && cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, step]);

  useEffect(() => {
    if (cameraCountdown === null || step !== "camera") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (cameraCountdown === 1) {
        setCameraCountdown(null);
        captureCameraImageRef.current?.();
      } else {
        setCameraCountdown((countdown) =>
          countdown === null ? null : countdown - 1,
        );
      }
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [cameraCountdown, step]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  const persistUserInfo = (userInfo) => {
    try {
      window.localStorage.setItem(
        userInfoStorageKey,
        JSON.stringify(userInfo),
      );
      setStorageError("");
    } catch (error) {
      console.error("Unable to save user information.", error);
      setStorageError("Unable to save your information in this browser.");
    }
  };

  const answer = step === "name" ? name : location;
  const hasAnswer = answer.trim().length > 0;
  const isAnswerValid = validAnswerPattern.test(answer.trim());
  const errorMessage =
    answer.length > 0 && !isAnswerValid
      ? step === "name"
        ? "Please input a proper name"
        : "Please input a proper place"
      : "";

  const submitUserInfo = async () => {
    const userInfo = {
      name: name.trim(),
      location: location.trim(),
    };

    setSubmissionError("");
    persistUserInfo(userInfo);

    setStep("loading");
    try {
      const response = await fetch(
        "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userInfo),
        },
      );

      const responseText = await response.text();
      let responseMessage = "";
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          if (typeof responseData.message === "string") {
            responseMessage = responseData.message;
          }
        } catch {
          responseMessage = responseText;
        }
      }

      if (!response.ok) {
        throw new Error(
          responseMessage || `Request failed with status ${response.status}.`,
        );
      }

      setStep("thanks");
    } catch (error) {
      console.error("Unable to submit user information.", error);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "We couldn't submit your information. Please check your connection and try again.",
      );
      setStep("location");
    }
  };

  const submitImage = async () => {
    if (!selectedImage) {
      setImageError("Please select an image to continue.");
      return;
    }

    setImageError("");
    setStep("loading");

    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to read the selected image."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(selectedImage);
      });

      await submitImageData(imageData, "upload");
    } catch (error) {
      console.error("Unable to read selected image.", error);
      setImageError(
        error instanceof Error
          ? error.message
          : "We couldn't read the image. Please try again.",
      );
      setStep("upload");
    }
  };

  const submitImageData = async (imageData, returnStep) => {
    setStep("loading");
    try {
      const response = await fetch(
        "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseTwo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
        },
      );

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        if (!response.ok) {
          throw new Error(
            responseText || `Request failed with status ${response.status}.`,
          );
        }
        throw new Error("The analysis service returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          (typeof responseData?.message === "string" && responseData.message) ||
            `Request failed with status ${response.status}.`,
        );
      }

      saveAnalysisResults(responseData?.data);
      setImageSubmitted(true);
      if (returnStep === "camera-preview") {
        cameraStream?.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setStep("thanks");
    } catch (error) {
      console.error("Unable to submit image.", error);
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't submit the image. Please try again.";
      if (returnStep === "camera-preview") {
        setCameraCaptureError(message);
      } else {
        setImageError(message);
      }
      setStep(returnStep);
    }
  };

  const captureCameraImage = () => {
    const video = cameraVideoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setCameraCaptureError("Camera image is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraCaptureError("Unable to capture an image from the camera.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCameraCaptureError("");
    setCapturedCameraImage(canvas.toDataURL("image/jpeg", 0.9));
    setStep("camera-preview");
  };
  useEffect(() => {
    captureCameraImageRef.current = captureCameraImage;
  });

  const startCameraCountdown = () => {
    setCameraCaptureError("");
    setCameraCountdown(3);
  };

  const allowCameraAccess = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by this browser.");
      return;
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setCameraStream(cameraStream);
      setCameraCaptureError("");
      setShowCameraPrompt(false);
      setStep("camera-loading");
    } catch (error) {
      console.error("Unable to access the camera.", error);
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Camera access was denied. Update your browser permissions and try again."
          : "Unable to access the camera. Check your camera connection and try again.",
      );
    }
  };

  return (
    <main
      className={`intro-page${hasAnswer ? " intro-page--has-answer" : ""}${step === "camera" || step === "camera-preview" ? " intro-page--camera" : ""}`}
    >
      <Header />
      <section
        className={`intro__container${step === "method" ? " intro__container--method" : ""}${step === "thanks" || step === "loading" ? " intro__container--thanks" : ""}${step === "upload" ? " intro__container--upload" : ""}${step === "camera-loading" ? " intro__container--camera-loading" : ""}${step === "camera" || step === "camera-preview" ? " intro__container--camera" : ""}`}
      >
        <p className="intro__instruction">TO START ANALYSIS</p>
        {step === "method" ? (
          <>
            <div className="intro__methods">
              <button
                className={`intro__method intro__method-face${selectedMethod === "face" ? " intro__method--selected" : ""}`}
                type="button"
                aria-pressed={selectedMethod === "face"}
                onClick={() => {
                  setSelectedMethod("face");
                  setCameraError("");
                  setShowCameraPrompt(true);
                }}
              >
                <span className="intro__method-diamond intro__method-diamond-outer" aria-hidden="true" />
                <span className="intro__method-diamond intro__method-diamond-middle" aria-hidden="true" />
                <span className="intro__method-diamond intro__method-diamond-inner" aria-hidden="true" />
                <span className="intro__method-icon intro__face-icon" aria-hidden="true">
                  <img src={apertureImage} alt="" />
                </span>
                <span className="intro__method-callout intro__method-callout-face">
                  <span>ALLOW A.I.</span>
                  <span>TO SCAN YOUR FACE</span>
                </span>
              </button>
              <button
                className={`intro__method intro__method-gallery${selectedMethod === "gallery" ? " intro__method--selected" : ""}`}
                type="button"
                aria-pressed={selectedMethod === "gallery"}
                onClick={() => {
                  setSelectedMethod("gallery");
                  setSelectedImage(null);
                  setImageError("");
                  setStep("upload");
                }}
              >
                <span className="intro__method-diamond intro__method-diamond-outer" aria-hidden="true" />
                <span className="intro__method-diamond intro__method-diamond-middle" aria-hidden="true" />
                <span className="intro__method-diamond intro__method-diamond-inner" aria-hidden="true" />
                <span className="intro__method-icon intro__gallery-icon" aria-hidden="true">
                  <span className="intro__gallery-image-clip">
                    <img src={mountainImage} alt="" />
                  </span>
                </span>
                <span className="intro__method-callout intro__method-callout-gallery">
                  <span>ALLOW A.I.</span>
                  <span>ACCESS GALLERY</span>
                </span>
              </button>
            </div>
            <div className="intro__method-hint">
              <span className="intro__method-hint-icon" aria-hidden="true" />
              <span>SELECT PREFERRED WAY</span>
            </div>
          </>
        ) : step === "upload" ? (
          <div className="intro__upload">
            <span className="intro__diamond intro__diamond-outer" aria-hidden="true" />
            <span className="intro__diamond intro__diamond-middle" aria-hidden="true" />
            <span className="intro__diamond intro__diamond-inner" aria-hidden="true" />
            <div className="intro__upload-content">
              <h1>UPLOAD YOUR IMAGE</h1>
              <p>Choose a clear photo to continue</p>
              <label className="intro__file-picker">
                <span>{selectedImage ? selectedImage.name : "CHOOSE IMAGE"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageError("");
                    if (file && !file.type.startsWith("image/")) {
                      setSelectedImage(null);
                      setImageError("Please choose a valid image file.");
                      return;
                    }
                    setSelectedImage(file);
                  }}
                />
              </label>
              {imageError && (
                <p className="intro__upload-error" role="alert">
                  {imageError}
                </p>
              )}
            </div>
          </div>
        ) : step === "camera" ? (
          <div className="intro__camera-view">
            <video
              ref={cameraVideoRef}
              className="intro__camera-video"
              autoPlay
              muted
              playsInline
              aria-label="Live camera preview"
            />
            <div className="intro__face-guide">
              {cameraCountdown === null && (
                <span>PLACE YOUR HEAD IN AN ELLIPSE</span>
              )}
            </div>
            {cameraCountdown !== null && (
              <div className="intro__camera-countdown" role="status" aria-live="assertive">
                <span className="intro__camera-countdown-number">
                  {cameraCountdown || ""}
                </span>
                <span>HOLD STILL</span>
              </div>
            )}
            <div className="intro__camera-tips intro__camera-tips-live">
              <p>TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
              <ul>
                <li>NEUTRAL EXPRESSION</li>
                <li>FRONTAL POSE</li>
                <li>ADEQUATE LIGHTING</li>
              </ul>
            </div>
            {cameraCaptureError && (
              <p className="intro__camera-capture-error" role="alert">
                {cameraCaptureError}
              </p>
            )}
            <button
              className="intro__camera-capture"
              type="button"
              disabled={cameraCountdown !== null}
              onClick={startCameraCountdown}
            >
              <span>TAKE PICTURE</span>
              <span className="intro__camera-capture-icon" aria-hidden="true" />
            </button>
          </div>
        ) : step === "camera-preview" ? (
          <div className="intro__camera-view intro__camera-view--preview">
            <img
              className="intro__camera-photo"
              src={capturedCameraImage}
              alt="Captured photo preview"
            />
            <p className="intro__camera-great-shot">GREAT SHOT!</p>
            <div className="intro__camera-preview-actions">
              <h2>Preview</h2>
              {cameraCaptureError && (
                <p className="intro__camera-capture-error" role="alert">
                  {cameraCaptureError}
                </p>
              )}
              <div>
                <button
                  className="intro__camera-retake"
                  type="button"
                  onClick={() => {
                    setCameraCaptureError("");
                    setCapturedCameraImage("");
                    setStep("camera");
                  }}
                >
                  Retake
                </button>
                <button
                  className="intro__camera-use-photo"
                  type="button"
                  onClick={() => void submitImageData(capturedCameraImage, "camera-preview")}
                >
                  Use This Photo
                </button>
              </div>
            </div>
          </div>
        ) : step === "thanks" ? (
          <div className="intro__thanks">
            <span className="intro__thanks-diamond" aria-hidden="true" />
            <span className="intro__thanks-square" aria-hidden="true" />
            <div className="intro__thanks-message">
              <h1>Thank you!</h1>
              <p>Proceed for the next step</p>
            </div>
          </div>
        ) : step === "camera-loading" ? (
          <div className="intro__camera-loading" role="status" aria-live="polite">
            <span className="intro__camera-frame intro__camera-frame-diamond" aria-hidden="true" />
            <span className="intro__camera-frame intro__camera-frame-square" aria-hidden="true" />
            <span className="intro__camera-frame intro__camera-frame-tilted" aria-hidden="true" />
            <div className="intro__camera-loading-content">
              <span className="intro__camera-loading-icon">
                <img src={apertureImage} alt="" />
              </span>
              <p className="intro__camera-loading-title">SETTING UP CAMERA ...</p>
            </div>
            <div className="intro__camera-tips">
              <p>TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
              <ul>
                <li>NEUTRAL EXPRESSION</li>
                <li>FRONTAL POSE</li>
                <li>ADEQUATE LIGHTING</li>
              </ul>
            </div>
          </div>
        ) : step === "loading" ? (
          <div className="intro__thanks intro__loading" role="status" aria-live="polite">
            <span className="intro__thanks-diamond" aria-hidden="true" />
            <span className="intro__thanks-square" aria-hidden="true" />
            <div className="intro__loading-message">
              <p>Processing submission</p>
              <span className="intro__loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : (
          <div className="intro__centerpiece">
            <span className="intro__diamond intro__diamond-outer" aria-hidden="true" />
            <span className="intro__diamond intro__diamond-middle" aria-hidden="true" />
            <span className="intro__diamond intro__diamond-inner" aria-hidden="true" />
            <label className="intro__title" htmlFor={`intro-${step}`}>
              <span className="intro__prompt">
                {hasAnswer
                  ? step === "name"
                    ? "INTRODUCE YOURSELF"
                    : "WHERE ARE YOU FROM"
                  : "CLICK TO TYPE"}
              </span>
              <input
                id={`intro-${step}`}
                name={step}
                type="text"
                placeholder={step === "name" ? "Introduce Yourself" : "Where are you from?"}
                autoComplete={step === "name" ? "name" : "address-level2"}
                value={answer}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "intro-input-error" : undefined}
                onChange={(event) => {
                  setSubmissionError("");
                  if (step === "name") {
                    const updatedInfo = { name: event.target.value, location };
                    setName(updatedInfo.name);
                    persistUserInfo(updatedInfo);
                  } else {
                    const updatedInfo = { name, location: event.target.value };
                    setLocation(updatedInfo.location);
                    persistUserInfo(updatedInfo);
                  }
                }}
              />
              {errorMessage && (
                <span className="intro__error" id="intro-input-error" role="alert">
                  {errorMessage}
                </span>
              )}
              {(storageError || (step === "location" && submissionError)) && (
                <span className="intro__error intro__submission-error" role="alert">
                  {storageError || submissionError}
                </span>
              )}
            </label>
          </div>
        )}
      </section>
      <button
        className="intro__back"
        type="button"
        disabled={step === "loading"}
        onClick={() => {
          if (step === "method") {
            setStep("thanks");
          } else if (step === "upload") {
            setStep("method");
          } else if (step === "camera" || step === "camera-preview" || step === "camera-loading") {
            setCameraCountdown(null);
            cameraStream?.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
            setCapturedCameraImage("");
            setStep("method");
          } else if (step === "thanks" || step === "loading") {
            setStep("location");
          } else if (step === "location") {
            setStep("name");
          } else {
            setLeavePrompt("confirm");
          }
        }}
      >
        <span className="intro__back-icon" aria-hidden="true" />
        <span>BACK</span>
      </button>
      {step === "upload" ? (
        <button
          className="intro__proceed intro__proceed-upload"
          type="button"
          disabled={!selectedImage}
          onClick={() => void submitImage()}
        >
          <span>PROCEED</span>
          <span className="intro__proceed-icon" aria-hidden="true" />
        </button>
      ) : step === "thanks" ? (
        <button
          className="intro__proceed intro__proceed-thanks"
          type="button"
          onClick={() => {
            if (imageSubmitted) {
              navigate("/analysis");
            } else {
              setSelectedMethod("");
              setStep("method");
            }
          }}
        >
          <span>PROCEED</span>
          <span className="intro__proceed-icon" aria-hidden="true" />
        </button>
      ) : step !== "method" && step !== "loading" && step !== "camera-loading" ? (
        <button
          className="intro__proceed"
          type="button"
          disabled={!hasAnswer || !isAnswerValid}
          onClick={() => {
            if (step === "name" && hasAnswer && isAnswerValid) {
              setStep("location");
              setLeavePrompt(null);
            } else if (step === "location" && hasAnswer && isAnswerValid) {
              void submitUserInfo();
            }
          }}
        >
          <span>PROCEED</span>
          <span className="intro__proceed-icon" aria-hidden="true" />
        </button>
      ) : null}
      {leavePrompt && (
        <section
          className="intro__leave-prompt"
          role="alertdialog"
          aria-labelledby="leave-prompt-title"
          aria-describedby={leavePrompt === "confirm" ? "leave-prompt-description" : undefined}
        >
          <div className="intro__leave-message">
            {leavePrompt === "confirm" ? (
              <>
                <h2 id="leave-prompt-title">YOU ARE ABOUT TO LEAVE ANALYSIS.</h2>
                <p id="leave-prompt-description">ARE YOU SURE?</p>
              </>
            ) : (
              <h2 id="leave-prompt-title">SAD TO SEE YOU GO</h2>
            )}
          </div>
          {leavePrompt === "confirm" ? (
            <div className="intro__leave-actions">
              <button
                className="intro__leave-confirm"
                type="button"
                onClick={() => setLeavePrompt("goodbye")}
              >
                LEAVE
              </button>
              <button
                className="intro__leave-stay"
                type="button"
                onClick={() => setLeavePrompt(null)}
              >
                STAY
              </button>
            </div>
          ) : (
            <div className="intro__leave-actions intro__leave-actions-goodbye">
              <button
                className="intro__leave-stay"
                type="button"
                onClick={() => setLeavePrompt(null)}
              >
                CHANGED MY MIND
              </button>
              <Link
                className="intro__leave-final"
                to="/"
                aria-label="Finish leaving analysis"
              >
                ...
              </Link>
            </div>
          )}
        </section>
      )}
      {showCameraPrompt && (
        <section
          className="intro__camera-prompt"
          role="dialog"
          aria-labelledby="camera-prompt-title"
        >
          <div className="intro__camera-message">
            <h2 id="camera-prompt-title">ALLOW A.I. TO ACCESS YOUR CAMERA</h2>
            {cameraError && <p role="alert">{cameraError}</p>}
          </div>
          <div className="intro__camera-actions">
            <button
              type="button"
              onClick={() => setShowCameraPrompt(false)}
            >
              DENY
            </button>
            <button type="button" onClick={() => void allowCameraAccess()}>
              ALLOW
            </button>
          </div>
        </section>
      )}
    </main>
  );
};

export default Intro;