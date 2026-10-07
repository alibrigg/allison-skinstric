import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Analysis.css";
import Header from "../components/Header";
import leftArrowImage from "../assets/left-arrow.svg";
import rightArrowImage from "../assets/right-arrow.svg";
import {
  analysisResultsUpdatedEvent,
  loadAnalysisResults,
  resetAnalysisResults,
  saveEditedAnalysisResults,
} from "../utils/analysisResults";

const analysisSections = [
  { id: "demographics", label: "DEMOGRAPHICS", position: "top" },
  { id: "cosmetic-concerns", label: "COSMETIC CONCERNS", position: "left" },
  { id: "skin-type-details", label: "SKIN TYPE DETAILS", position: "right" },
  { id: "weather", label: "WEATHER", position: "bottom" },
];

const exampleRaceEstimates = [
  { name: "East Asian", confidence: 96 },
  { name: "White", confidence: 6 },
  { name: "Black", confidence: 3 },
  { name: "South Asian", confidence: 2 },
  { name: "Latino Hispanic", confidence: 0 },
  { name: "South East Asian", confidence: 0 },
  { name: "Middle Eastern", confidence: 0 },
];

const exampleAgeEstimates = [
  { name: "0-2", confidence: 4 },
  { name: "3-9", confidence: 5 },
  { name: "10-19", confidence: 0 },
  { name: "20-29", confidence: 6 },
  { name: "30-39", confidence: 7 },
  { name: "40-49", confidence: 6 },
  { name: "50-59", confidence: 52 },
  { name: "60-69", confidence: 0 },
  { name: "70+", confidence: 15 },
];

const exampleGenderEstimates = [
  { name: "Male", confidence: 96 },
  { name: "Female", confidence: 4 },
];

const demographicTypes = [
  { id: "race", label: "RACE" },
  { id: "age", label: "AGE" },
  { id: "sex", label: "SEX" },
];

const highestEstimate = (estimates) =>
  estimates.reduce((highest, estimate) =>
    estimate.confidence > highest.confidence ? estimate : highest,
  );

const formatConfidence = (confidence) =>
  Number.isInteger(confidence) ? confidence : confidence.toFixed(1);

const Analysis = () => {
  const [savedAnalysis, setSavedAnalysis] = useState(loadAnalysisResults);
  const raceEstimates = savedAnalysis.results?.race ?? exampleRaceEstimates;
  const ageEstimates = savedAnalysis.results?.age ?? exampleAgeEstimates;
  const genderEstimates = savedAnalysis.results?.gender ?? exampleGenderEstimates;
  const [activeSection, setActiveSection] = useState("demographics");
  const [hoveredSection, setHoveredSection] = useState(null);
  const [showDemographics, setShowDemographics] = useState(false);
  const [activeDemographic, setActiveDemographic] = useState("race");
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedSex, setSelectedSex] = useState(null);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [draftPercentages, setDraftPercentages] = useState({});
  const [editError, setEditError] = useState("");
  const displayedRace = raceEstimates.some(({ name }) => name === selectedRace)
    ? selectedRace
    : highestEstimate(raceEstimates).name;
  const displayedAge = ageEstimates.some(({ name }) => name === selectedAge)
    ? selectedAge
    : highestEstimate(ageEstimates).name;
  const displayedSex = genderEstimates.some(({ name }) => name === selectedSex)
    ? selectedSex
    : highestEstimate(genderEstimates).name;
  const activeEstimate = demographicTypes.find(({ id }) => id === activeDemographic);
  const selectedRaceEstimate =
    raceEstimates.find(({ name }) => name === displayedRace) ??
    highestEstimate(raceEstimates);
  const selectedAgeEstimate =
    ageEstimates.find(({ name }) => name === displayedAge) ??
    highestEstimate(ageEstimates);
  const selectedGenderEstimate =
    genderEstimates.find(({ name }) => name === displayedSex) ??
    highestEstimate(genderEstimates);
  const selectedEstimate =
    activeDemographic === "race"
      ? selectedRaceEstimate
      : activeDemographic === "age"
        ? selectedAgeEstimate
        : activeDemographic === "sex"
          ? selectedGenderEstimate
          : selectedRaceEstimate;
  const activeEstimates =
    activeDemographic === "race"
      ? raceEstimates
      : activeDemographic === "age"
        ? ageEstimates
        : genderEstimates;
  const activeCategory =
    activeDemographic === "sex" ? "gender" : activeDemographic;
  const activeDraftPercentages = draftPercentages[activeCategory];

  const saveEstimatePercentages = () => {
    const draft = activeDraftPercentages;
    if (!draft) {
      return;
    }

    const percentages = activeEstimates.map(({ name, confidence }) => {
      const rawValue = draft[name] ?? String(confidence);
      return { name, confidence: Number(rawValue), rawValue };
    });
    const hasInvalidPercentage = percentages.some(
      ({ confidence, rawValue }) =>
        rawValue.trim() === "" ||
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 100,
    );
    const total = percentages.reduce(
      (sum, { confidence }) => sum + confidence,
      0,
    );
    if (hasInvalidPercentage || Math.abs(total - 100) > 0.000001) {
      setEditError("Percentages must be valid and add up to exactly 100%.");
      return;
    }

    const currentResults = savedAnalysis.results ?? {
      race: raceEstimates,
      age: ageEstimates,
      gender: genderEstimates,
    };
    const updatedResults = {
      ...currentResults,
      [activeCategory]: percentages.map(({ name, confidence }) => ({
        name,
        confidence,
      })),
    };

    try {
      const normalizedResults = saveEditedAnalysisResults(updatedResults);
      setSavedAnalysis({ results: normalizedResults, error: "" });
      setDraftPercentages((drafts) => {
        const updatedDrafts = { ...drafts };
        delete updatedDrafts[activeCategory];
        return updatedDrafts;
      });
      setEditError("");
      setEditingEstimate(null);
    } catch (error) {
      console.error("Unable to save edited analysis percentages.", error);
      setEditError("Unable to save these edits. Please try again.");
    }
  };

  useEffect(() => {
    const refreshAnalysis = () => {
      setSavedAnalysis(loadAnalysisResults());
      setSelectedRace(null);
      setSelectedAge(null);
      setSelectedSex(null);
      setDraftPercentages({});
      setEditingEstimate(null);
      setEditError("");
    };
    window.addEventListener(analysisResultsUpdatedEvent, refreshAnalysis);
    window.addEventListener("storage", refreshAnalysis);
    return () => {
      window.removeEventListener(analysisResultsUpdatedEvent, refreshAnalysis);
      window.removeEventListener("storage", refreshAnalysis);
    };
  }, []);

  const changeDemographic = (direction) => {
    const currentIndex = demographicTypes.findIndex(
      ({ id }) => id === activeDemographic,
    );
    const nextIndex =
      (currentIndex + direction + demographicTypes.length) %
      demographicTypes.length;
    setActiveDemographic(demographicTypes[nextIndex].id);
  };

  return (
    <>
    <Header />
    <main className="analysis-page">
      {!showDemographics && (
        <header className="analysis__intro">
          <h1 className="analysis__intro-h1">A.I. ANALYSIS</h1>
          <p className="analysis__intro-p">A.I. HAS ESTIMATED THE FOLLOWING.</p>
          <p className="analysis__intro-p">FIX ESTIMATED INFORMATION IF NEEDED.</p>
        </header>
      )}
      {savedAnalysis.error ? (
        <p className="analysis__data-message" role="alert">{savedAnalysis.error}</p>
      ) : !savedAnalysis.results ? (
        <p className="analysis__data-message">
          Showing example estimates. Submit a photo to see your analysis.
        </p>
      ) : null}
      {showDemographics ? (
        <section className="analysis__demographics" aria-label="Demographics estimates">
          <div className="analysis__demographics-heading">
            <div>
              <p>A. I. ANALYSIS</p>
              <h2>DEMOGRAPHICS</h2>
              <span className="analysis__demographics-label">PREDICTED {activeEstimate.label} &amp; AGE</span>
            </div>
            <div className="analysis__step-controls">
              <button
                className="analysis__step-control"
                type="button"
                aria-label="Previous demographic"
                onClick={() => changeDemographic(-1)}
              >
                <span className="analysis__step-control-diamond" aria-hidden="true">
                  <img src={leftArrowImage} alt="" />
                </span>
              </button>
              <button
                className="analysis__step-control"
                type="button"
                aria-label="Next demographic"
                onClick={() => changeDemographic(1)}
              >
                <span className="analysis__step-control-diamond" aria-hidden="true">
                  <img src={rightArrowImage} alt="" />
                </span>
              </button>
            </div>
          </div>
          <div className="analysis__demographics-grid">
            <nav className="analysis__demographic-tabs" aria-label="Demographic type">
              {demographicTypes.map(({ id, label }) => (
                <button
                  key={id}
                  className={activeDemographic === id ? "is-selected" : ""}
                  type="button"
                  aria-pressed={activeDemographic === id}
                  onClick={() => {
                    setActiveDemographic(id);
                  }}
                >
                  <strong>
                    {id === "race"
                      ? displayedRace.toUpperCase()
                      : id === "age"
                        ? displayedAge
                        : displayedSex.toUpperCase()}
                  </strong>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <section className="analysis__demographic-visual" aria-live="polite">
              <h3>
                {activeDemographic === "race"
                  ? displayedRace
                  : activeDemographic === "age"
                    ? `${displayedAge} y.o.`
                    : displayedSex}
              </h3>
              <div
                className={`analysis__confidence-ring${activeDemographic === "age" ? " analysis__confidence-ring--meter" : ""}`}
                style={{ "--confidence": `${selectedEstimate.confidence}%` }}
              >
                <span>{selectedEstimate.confidence}<sup>%</sup></span>
              </div>
            </section>
            <section className="analysis__estimate-list" aria-label={`${activeEstimate.label} estimates`}>
              <div className="analysis__estimate-list-heading">
                <span>{activeEstimate.label}</span>
                <span>A. I. CONFIDENCE</span>
              </div>
              {activeDemographic === "race" ||
              activeDemographic === "age" ||
              activeDemographic === "sex" ? (
                <ul>
                  {activeEstimates.map(({ name, confidence }) => {
                      const selectedValue = activeDemographic === "race"
                        ? displayedRace
                        : activeDemographic === "age"
                          ? displayedAge
                          : displayedSex;
                      const estimateKey = `${activeDemographic}:${name}`;
                      return (
                        <li key={name}>
                          <div className={`analysis__estimate-row${selectedValue === name ? " is-selected" : ""}`}>
                            <button
                              className="analysis__estimate-select"
                              type="button"
                              aria-pressed={selectedValue === name}
                              onClick={() => {
                                if (activeDemographic === "race") {
                                  setSelectedRace(name);
                                } else if (activeDemographic === "age") {
                                  setSelectedAge(name);
                                } else {
                                  setSelectedSex(name);
                                }
                              }}
                            >
                              <span className="analysis__estimate-name">
                                <span aria-hidden="true">{selectedValue === name ? "◈" : "◇"}</span>
                                {name}
                              </span>
                            </button>
                            {editingEstimate === estimateKey ? (
                              <input
                                className="analysis__confidence-input"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                aria-label={`${name} confidence percentage`}
                                value={activeDraftPercentages?.[name] ?? String(Math.round(confidence))}
                                autoFocus
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setDraftPercentages((drafts) => ({
                                    ...drafts,
                                    [activeCategory]: {
                                      ...(drafts[activeCategory] ??
                                        Object.fromEntries(
                                          activeEstimates.map((estimate) => [
                                            estimate.name,
                                            String(Math.round(estimate.confidence)),
                                          ]),
                                        )),
                                      [name]: value,
                                    },
                                  }));
                                  setEditError("");
                                }}
                                onBlur={() => setEditingEstimate(null)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                  } else if (event.key === "Escape") {
                                    setDraftPercentages((drafts) => {
                                      const categoryDraft = {
                                        ...drafts[activeCategory],
                                      };
                                      delete categoryDraft[name];
                                      const updatedDrafts = { ...drafts };
                                      if (Object.keys(categoryDraft).length) {
                                        updatedDrafts[activeCategory] = categoryDraft;
                                      } else {
                                        delete updatedDrafts[activeCategory];
                                      }
                                      return updatedDrafts;
                                    });
                                    setEditingEstimate(null);
                                    setEditError("");
                                  }
                                }}
                              />
                            ) : (
                              <button
                                className="analysis__confidence-edit"
                                type="button"
                                aria-label={`Edit ${name} confidence, ${formatConfidence(confidence)} percent`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditError("");
                                  setDraftPercentages((drafts) => ({
                                    ...drafts,
                                    [activeCategory]: drafts[activeCategory] ?? Object.fromEntries(
                                      activeEstimates.map((estimate) => [
                                        estimate.name,
                                        String(Math.round(estimate.confidence)),
                                      ]),
                                    ),
                                  }));
                                  setEditingEstimate(estimateKey);
                                }}
                              >
                                {activeDraftPercentages
                                  ? `${activeDraftPercentages[name] ?? Math.round(confidence)} %`
                                  : `${formatConfidence(confidence)} %`}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="analysis__estimate-current">
                  <span>{activeEstimate.value}</span>
                  <span>{activeEstimate.confidence} %</span>
                </p>
              )}
              {activeDraftPercentages && (
                <div className="analysis__estimate-save-area">
                  <button
                    className="analysis__estimate-save"
                    type="button"
                    onClick={saveEstimatePercentages}
                  >
                    SAVE
                  </button>
                  {editError && (
                    <p className="analysis__estimate-error" role="alert">
                      {editError}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
          <footer className="analysis__demographics-footer">
            <button
              className="analysis__back"
              type="button"
              onClick={() => setShowDemographics(false)}
            >
              <span className="analysis__back-icon" aria-hidden="true">
                <img src={leftArrowImage} alt="" />
              </span>
              BACK
            </button>
            <p>If A.I. estimate is wrong, select the correct one.</p>
            <div>
              <button
                className="analysis__reset"
                type="button"
                onClick={() => {
                  try {
                    const results = resetAnalysisResults();
                    setSavedAnalysis({ results, error: "" });
                    setActiveDemographic("race");
                    setSelectedRace(null);
                    setSelectedAge(null);
                    setSelectedSex(null);
                    setDraftPercentages({});
                    setEditingEstimate(null);
                    setEditError("");
                  } catch (error) {
                    console.error("Unable to reset analysis estimates.", error);
                    setEditError(
                      error instanceof Error
                        ? error.message
                        : "Unable to reset estimates. Please try again.",
                    );
                  }
                }}
              >
                RESET
              </button>
              <button
                className="analysis__confirm"
                type="button"
                onClick={() => setShowDemographics(false)}
              >
                CONFIRM
              </button>
            </div>
          </footer>
        </section>
      ) : (
        <nav
          className="analysis__sections"
          aria-label="Analysis categories"
          onPointerLeave={() => setHoveredSection(null)}
        >
          {hoveredSection && (
            <span
              key={hoveredSection}
              className="analysis__hover-outline"
              aria-hidden="true"
            />
          )}
          {analysisSections.map(({ id, label, position }) => (
            <span
              key={id}
              className={`analysis__tile analysis__tile--${position}`}
              onPointerEnter={() => setHoveredSection(id)}
            >
              <button
                className={`analysis__section${activeSection === id ? " is-active" : ""}`}
                type="button"
                disabled={id !== "demographics"}
                aria-pressed={activeSection === id}
                onClick={id === "demographics" ? () => {
                  setActiveSection(id);
                  setShowDemographics(true);
                } : undefined}
                onFocus={() => setHoveredSection(id)}
              >
                <span>{label}</span>
              </button>
            </span>
          ))}
        </nav>
      )}
      {!showDemographics && (
        <Link className="analysis__home" to="/">
          <span>HOME</span>
          <span className="analysis__home-diamond" aria-hidden="true">
            <img src={rightArrowImage} alt="" />
          </span>
        </Link>
      )}
    </main>
    </>
  );
};

export default Analysis;
