import Header from "../components/Header";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apertureImage from "../assets/aperture.svg";
import mountainImage from "../assets/mountain.svg";
import "./Intro.css";

const validAnswerPattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

const Intro = () => {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [leavePrompt, setLeavePrompt] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  useEffect(() => {
    if (step !== "loading") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setStep("thanks"), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [step]);

  const answer = step === "name" ? name : location;
  const hasAnswer = answer.trim().length > 0;
  const isAnswerValid = validAnswerPattern.test(answer.trim());
  const errorMessage =
    answer.length > 0 && !isAnswerValid
      ? step === "name"
        ? "Please input a proper name"
        : "Please input a proper place"
      : "";

  return (
    <main className={`intro-page${hasAnswer ? " intro-page--has-answer" : ""}`}>
      <Header />
      <section
        className={`intro__container${step === "method" ? " intro__container--method" : ""}${step === "thanks" || step === "loading" ? " intro__container--thanks" : ""}`}
      >
        <p className="intro__instruction">TO START ANALYSIS</p>
        {step === "method" ? (
          <>
            <div className="intro__methods">
              <button
                className={`intro__method intro__method-face${selectedMethod === "face" ? " intro__method--selected" : ""}`}
                type="button"
                aria-pressed={selectedMethod === "face"}
                onClick={() => setSelectedMethod("face")}
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
                onClick={() => setSelectedMethod("gallery")}
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
        ) : step === "thanks" ? (
          <div className="intro__thanks">
            <span className="intro__thanks-diamond" aria-hidden="true" />
            <span className="intro__thanks-square" aria-hidden="true" />
            <div className="intro__thanks-message">
              <h1>Thank you!</h1>
              <p>Proceed for the next step</p>
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
                {hasAnswer ? "INTRODUCE YOURSELF" : "CLICK TO TYPE"}
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
                  if (step === "name") {
                    setName(event.target.value);
                  } else {
                    setLocation(event.target.value);
                  }
                }}
              />
              {errorMessage && (
                <span className="intro__error" id="intro-input-error" role="alert">
                  {errorMessage}
                </span>
              )}
            </label>
          </div>
        )}
      </section>
      <button
        className="intro__back"
        type="button"
        onClick={() => {
          if (step === "method") {
            setStep("thanks");
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
      {step === "thanks" ? (
        <button
          className="intro__proceed intro__proceed-thanks"
          type="button"
          onClick={() => {
            setSelectedMethod("");
            setStep("method");
          }}
        >
          <span>PROCEED</span>
          <span className="intro__proceed-icon" aria-hidden="true" />
        </button>
      ) : step !== "method" && step !== "loading" ? (
        <button
          className="intro__proceed"
          type="button"
          disabled={!hasAnswer || !isAnswerValid}
          onClick={() => {
            if (step === "name" && hasAnswer && isAnswerValid) {
              setStep("location");
              setLeavePrompt(null);
            } else if (step === "location" && hasAnswer && isAnswerValid) {
              setStep("loading");
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
    </main>
  );
};

export default Intro;