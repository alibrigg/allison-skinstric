export const analysisResultsStorageKey = "skinstricAnalysisResults";
export const originalAnalysisResultsStorageKey = "skinstricOriginalAnalysisResults";
export const analysisResultsUpdatedEvent = "skinstric:analysis-results-updated";

const categoryKeys = ["race", "age", "gender"];

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const formatEstimateName = (name) =>
  name.replace(/\b\w/g, (letter) => letter.toUpperCase());

export const normalizeAnalysisResults = (data) => {
  if (!isRecord(data)) {
    throw new Error("The analysis response did not include valid result data.");
  }

  const normalized = {};
  categoryKeys.forEach((category) => {
    const estimates = data[category];
    if (!isRecord(estimates) || Object.keys(estimates).length === 0) {
      throw new Error(`The analysis response is missing ${category} estimates.`);
    }

    normalized[category] = Object.entries(estimates).map(([name, score]) => {
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
        throw new Error(`The analysis response has an invalid ${category} estimate.`);
      }

      return { name: formatEstimateName(name), confidence: Math.round(score * 100) };
    });
  });

  normalized.race.sort((first, second) => second.confidence - first.confidence);
  normalized.age.sort((first, second) => {
    const firstStart = Number.parseInt(first.name, 10);
    const secondStart = Number.parseInt(second.name, 10);
    return firstStart - secondStart;
  });
  normalized.gender.sort((first, second) => second.confidence - first.confidence);

  return normalized;
};

export const saveAnalysisResults = (data) => {
  const results = normalizeAnalysisResults(data);
  window.localStorage.setItem(analysisResultsStorageKey, JSON.stringify(data));
  window.localStorage.setItem(originalAnalysisResultsStorageKey, JSON.stringify(data));
  window.dispatchEvent(new Event(analysisResultsUpdatedEvent));
  return results;
};

export const saveEditedAnalysisResults = (results) => {
  const data = Object.fromEntries(
    categoryKeys.map((category) => [
      category,
      Object.fromEntries(
        results[category].map(({ name, confidence }) => [
          name.toLowerCase(),
          confidence / 100,
        ]),
      ),
    ]),
  );
  const normalizedResults = normalizeAnalysisResults(data);
  window.localStorage.setItem(analysisResultsStorageKey, JSON.stringify(data));
  return normalizedResults;
};

export const resetAnalysisResults = () => {
  const originalResults = window.localStorage.getItem(
    originalAnalysisResultsStorageKey,
  );
  if (!originalResults) {
    throw new Error("Original estimates are unavailable. Please analyze the photo again.");
  }

  const parsedResults = JSON.parse(originalResults);
  const results = normalizeAnalysisResults(parsedResults);
  window.localStorage.setItem(
    analysisResultsStorageKey,
    JSON.stringify(parsedResults),
  );
  window.dispatchEvent(new Event(analysisResultsUpdatedEvent));
  return results;
};

export const loadAnalysisResults = () => {
  try {
    const storedResults = window.localStorage.getItem(analysisResultsStorageKey);
    if (!storedResults) {
      return { results: null, error: "" };
    }

    return { results: normalizeAnalysisResults(JSON.parse(storedResults)), error: "" };
  } catch (error) {
    console.error("Unable to load saved image analysis results.", error);
    return {
      results: null,
      error: "Unable to load the saved analysis. Please submit your photo again.",
    };
  }
};
