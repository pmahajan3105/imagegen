"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  ImageIcon,
  KeyRound,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  clearPersistedState,
  deleteCachedAnalysis,
  getCachedAnalysis,
  loadPersistedState,
  saveCachedAnalysis,
  savePersistedState,
  type HistoryEntry,
  type PreviewImage
} from "./lib/persistence";
import {
  AnalysisRefusedError,
  AnalysisSchemaError,
  AnalysisTransportError,
  analyzeBody,
  analyzePortrait,
  bodyCacheKey,
  hashFile,
  portraitCacheKey,
  type BodyAnalysis,
  type PortraitAnalysis
} from "./lib/analysis";
import {
  PORTRAIT_ANALYSIS_STEPS,
  type ImageReference,
  type PortraitAnalysisStep
} from "./lib/portraitSteps";
import { fetchReferenceFile, referenceUrlFor } from "./lib/referenceImages";

const API_KEY_STORAGE_KEY = "personal-gpt-image-api-key";
const OPENAI_IMAGE_GENERATIONS_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_EDITS_URL = "https://api.openai.com/v1/images/edits";
const MODEL = "gpt-image-2";
const QUALITY = "high";
const SIZE = "1024x1536";
const OUTPUT_FORMAT = "png";

type AppMode = "freeform" | "portrait";

type BatchReportResult = {
  title: string;
  imageUrl: string;
};

type DownloadFallback = {
  filename: string;
  title: string;
  imageUrl: string;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

type AnalysisErrorKind = "refused" | "schema" | "transport";

type AnalysisErrorState = {
  slot: "portrait" | "body";
  kind: AnalysisErrorKind;
  message: string;
};

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function imageDataUrl(base64: string) {
  return `data:image/png;base64,${base64}`;
}

function makeDownloadName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "imagegen-result"}.png`;
}

function getReportShortTitle(title: string) {
  const titleMap: Record<string, string> = {
    "Color Season Report": "Color Report",
    "Face Shape And Feature Map": "Face Map",
    "Best Hairstyles Board": "Hairstyle Board",
    "Wardrobe Capsule Board": "Wardrobe Board",
    "Color Try-On Comparison": "Color Try-On",
    "Makeup Shade Guide": "Makeup Guide",
    "Nail Color Guide": "Nail Guide",
    "Accessory & Jewelry Metals Guide": "Metals Guide",
    "Eyeglasses / Frames Guide": "Frames Guide",
    "Body Shape Guide": "Body Guide",
    "Outfit Style Guide": "Outfit Guide",
    "Makeup Feature Guide": "Feature Makeup",
    "Use Carefully Guide": "Use Carefully"
  };

  return titleMap[title] ?? title;
}

function base64ToFile(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: "image/png" });
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [metadata, base64 = ""] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mimeType });
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, base64 = ""] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function saveBlob(blob: Blob, filename: string) {
  const pickerWindow = window as SaveFilePickerWindow;

  if (pickerWindow.showSaveFilePicker) {
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "PNG image",
          accept: { "image/png": [".png"] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  throw new Error("Native save picker is unavailable.");
}

function triggerBrowserDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function openBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("The browser blocked opening the image. Try downloading it instead.");
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode the selected image."));
    };
    image.src = objectUrl;
  });
}

async function normalizeImageForOpenAI(file: File) {
  const image = await loadImage(file);
  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("This browser could not prepare the selected image.");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("This browser could not prepare the selected image.");
  }

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "portrait"}-openai.jpg`, {
    type: "image/jpeg"
  });
}

function getImageFromResponse(payload: OpenAIImageResponse) {
  const firstImage = payload.data?.[0];

  if (firstImage?.b64_json) {
    return firstImage.b64_json;
  }

  if (firstImage?.url) {
    throw new Error("The API returned a URL instead of base64 image data.");
  }

  throw new Error(payload.error?.message || "No image was returned by the API.");
}

async function parseOpenAIResponse(response: Response) {
  let payload: OpenAIImageResponse;

  try {
    payload = (await response.json()) as OpenAIImageResponse;
  } catch {
    throw new Error(`OpenAI returned ${response.status} ${response.statusText}.`);
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.message || `OpenAI returned ${response.status} ${response.statusText}.`
    );
  }

  return getImageFromResponse(payload);
}

function buildFollowUpPrompt(prompt: string) {
  return [
    "Edit the provided image. Preserve the current composition, subject identity, and overall style unless the request explicitly changes them.",
    "Apply this latest instruction:",
    prompt
  ].join("\n\n");
}


export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyInputRef = useRef<HTMLInputElement | null>(null);
  const handInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedPersistedState = useRef(false);
  const activeRunIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const selectedPreviewRef = useRef<PreviewImage | null>(null);
  const portraitAnalysisAbortRef = useRef<AbortController | null>(null);
  const bodyAnalysisAbortRef = useRef<AbortController | null>(null);
  const portraitAnalysisRunIdRef = useRef(0);
  const bodyAnalysisRunIdRef = useRef(0);
  const additionalPortraitRunIdRef = useRef(0);
  const [apiKey, setApiKey] = useState("");
  const [appMode] = useState<AppMode>("portrait");
  const [selectedPortraitReportIndex, setSelectedPortraitReportIndex] = useState(0);
  const [outfitIdentityAcknowledged, setOutfitIdentityAcknowledged] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [improvementPrompt, setImprovementPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [additionalPortraits, setAdditionalPortraits] = useState<File[]>([]);
  const [additionalPortraitPreviews, setAdditionalPortraitPreviews] = useState<string[]>([]);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [bodyPreviewUrl, setBodyPreviewUrl] = useState<string | null>(null);
  const [handImage, setHandImage] = useState<File | null>(null);
  const [handPreviewUrl, setHandPreviewUrl] = useState<string | null>(null);
  const [latestImageBase64, setLatestImageBase64] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PreviewImage | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [generatingReportTitle, setGeneratingReportTitle] = useState<string | null>(null);
  const [failedReportTitles, setFailedReportTitles] = useState<string[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [showGenerateAllConfirm, setShowGenerateAllConfirm] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [hasBatchRun, setHasBatchRun] = useState(false);
  const [batchCompletedCount, setBatchCompletedCount] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchReportResult[]>([]);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [downloadFallback, setDownloadFallback] = useState<DownloadFallback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestStartedAt, setRequestStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [portraitAnalysis, setPortraitAnalysis] = useState<PortraitAnalysis | null>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [analyzingSlot, setAnalyzingSlot] = useState<null | "portrait" | "body">(null);
  const [analysisError, setAnalysisError] = useState<AnalysisErrorState | null>(null);
  const [portraitHash, setPortraitHash] = useState<string | null>(null);
  const [bodyHash, setBodyHash] = useState<string | null>(null);

  const latestImageUrl = useMemo(
    () => (latestImageBase64 ? imageDataUrl(latestImageBase64) : null),
    [latestImageBase64]
  );
  const activePreview =
    selectedPreview ??
    (latestImageUrl
      ? {
          id: "latest",
          title: "Latest result",
          imageUrl: latestImageUrl
        }
      : null);
  const hasPreviousImage = Boolean(latestImageBase64);
  const activePortraitStep = PORTRAIT_ANALYSIS_STEPS[selectedPortraitReportIndex];
  const isPortraitMode = appMode === "portrait";
  const generatedReportTitles = useMemo(
    () => new Set(history.map((entry) => entry.title)),
    [history]
  );
  const batchMissingReferences = Array.from(
    new Set(
      PORTRAIT_ANALYSIS_STEPS.filter((step) => !getReferenceImage(step.reference)).map((step) =>
        getReferenceLabel(step.reference)
      )
    )
  );
  const batchNeedsBody = PORTRAIT_ANALYSIS_STEPS.some((step) => step.requires.body);
  const batchMissingAnalyses: string[] = [];
  if (!portraitAnalysis) batchMissingAnalyses.push("portrait analysis");
  if (batchNeedsBody && !bodyAnalysis) batchMissingAnalyses.push("body analysis");
  const batchMissingGuidance = !outfitIdentityAcknowledged
    ? ["confirm identity-preserving upload guidance"]
    : [];
  const batchBlockers = [...batchMissingReferences, ...batchMissingAnalyses, ...batchMissingGuidance];

  function isOutfitStyleStep(step: PortraitAnalysisStep) {
    return step.title === "Outfit Style Guide";
  }

  function stepBlockers(step: PortraitAnalysisStep): string[] {
    const blockers: string[] = [];
    if (!getReferenceImage(step.reference)) {
      blockers.push(getReferenceLabel(step.reference));
    }
    if (step.requires.portrait && !portraitAnalysis) {
      blockers.push("portrait analysis");
    }
    if (step.requires.body && !bodyAnalysis) {
      blockers.push("body analysis");
    }
    if (isOutfitStyleStep(step) && !outfitIdentityAcknowledged) {
      blockers.push("confirm identity-preserving upload guidance");
    }
    return blockers;
  }

  const activePortraitStepBlockers = activePortraitStep ? stepBlockers(activePortraitStep) : [];
  const activePortraitStepReady = activePortraitStep ? activePortraitStepBlockers.length === 0 : false;

  const actionLabel = isPortraitMode
    ? activePortraitStep
      ? "Generate Report"
      : "Generate report"
    : hasPreviousImage
      ? "Improve image"
      : "Generate image";

  function getReferenceLabel(reference: ImageReference) {
    if (reference === "body") {
      return "full-body photo";
    }

    if (reference === "hand") {
      return "hand photo";
    }

    return "portrait photo";
  }

  function clearDownloadFallback() {
    setDownloadFallback(null);
  }

  function setManualDownloadFallback(imageUrl: string, title: string, filename: string) {
    clearDownloadFallback();
    setDownloadFallback({ filename, title, imageUrl });
  }

  function getReferenceImage(reference: ImageReference) {
    if (reference === "body") {
      return bodyImage;
    }

    if (reference === "hand") {
      return handImage;
    }

    return uploadedImage;
  }

  function getReferencePreview(reference: ImageReference) {
    if (reference === "body") {
      return bodyPreviewUrl;
    }

    if (reference === "hand") {
      return handPreviewUrl;
    }

    return uploadedPreviewUrl;
  }

  function getReferenceInput(reference: ImageReference) {
    if (reference === "body") {
      return bodyInputRef;
    }

    if (reference === "hand") {
      return handInputRef;
    }

    return fileInputRef;
  }

  function setReferenceImage(reference: ImageReference, file: File | null) {
    if (reference === "body") {
      setBodyImage(file);
      return;
    }

    if (reference === "hand") {
      setHandImage(file);
      return;
    }

    setUploadedImage(file);
  }

  function setReferencePreview(reference: ImageReference, previewUrl: string | null) {
    if (reference === "body") {
      setBodyPreviewUrl(previewUrl);
      return;
    }

    if (reference === "hand") {
      setHandPreviewUrl(previewUrl);
      return;
    }

    setUploadedPreviewUrl(previewUrl);
  }

  function getMissingReferenceMessage(step: PortraitAnalysisStep) {
    return `${step.title} needs a ${getReferenceLabel(step.reference)}.`;
  }

  function beginRequestRun() {
    activeAbortControllerRef.current?.abort();
    activeRunIdRef.current += 1;
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    return {
      runId: activeRunIdRef.current,
      signal: abortController.signal
    };
  }

  function isCurrentRun(runId: number) {
    return activeRunIdRef.current === runId;
  }

  function finishRequestRun(runId: number) {
    if (isCurrentRun(runId)) {
      activeAbortControllerRef.current = null;
    }
  }

  function cancelActiveRun() {
    activeRunIdRef.current += 1;
    activeAbortControllerRef.current?.abort();
    activeAbortControllerRef.current = null;
  }

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setApiKey(window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "");
      } catch {
        setApiKey("");
      }
    });
  }, []);

  useEffect(() => {
    try {
      if (apiKey.trim()) {
        window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      } else {
        window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch {
      // Local storage may be unavailable in some embedded browser contexts.
    }
  }, [apiKey]);

  useEffect(() => {
    let isMounted = true;

    async function restoreHistory() {
      try {
        const persistedState = await loadPersistedState();

        if (!isMounted) {
          return;
        }

        if (persistedState?.history?.length) {
          setHistory(persistedState.history);
          const restoredPreview = persistedState.selectedPreview ?? persistedState.history[0];
          setSelectedPreview({
            id: restoredPreview.id,
            title: restoredPreview.title,
            imageUrl: restoredPreview.imageUrl
          });
        }
      } catch {
        if (isMounted) {
          setNotice("Local history could not be restored in this browser.");
        }
      } finally {
        if (isMounted) {
          hasLoadedPersistedState.current = true;
        }
      }
    }

    restoreHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    selectedPreviewRef.current = selectedPreview;
  }, [selectedPreview]);

  useEffect(() => {
    if (!hasLoadedPersistedState.current) {
      return;
    }

    savePersistedState({ history, selectedPreview: selectedPreviewRef.current }).catch(() => {
      setNotice("Local history could not be saved in this browser.");
    });
  }, [history]);

  useEffect(() => {
    if (!isLoading || !requestStartedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - requestStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isLoading, requestStartedAt]);

  useEffect(() => {
    if (!isBatchGenerating) {
      return;
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isBatchGenerating]);

  async function generateFromText(cleanPrompt: string, signal?: AbortSignal) {
    const response = await fetch(OPENAI_IMAGE_GENERATIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: cleanPrompt,
        n: 1,
        quality: QUALITY,
        size: SIZE,
        output_format: OUTPUT_FORMAT
      }),
      signal
    });

    return parseOpenAIResponse(response);
  }

  async function editImage(
    images: File | File[],
    cleanPrompt: string,
    signal?: AbortSignal
  ) {
    const imageList = Array.isArray(images) ? images : [images];
    const formData = new FormData();
    formData.append("model", MODEL);
    formData.append("prompt", cleanPrompt);
    formData.append("n", "1");
    formData.append("quality", QUALITY);
    formData.append("size", SIZE);
    // GPT image models return b64_json by default; response_format is not supported for them.
    formData.append("output_format", OUTPUT_FORMAT);
    const imageFieldName = imageList.length > 1 ? "image[]" : "image";
    for (const image of imageList) {
      formData.append(imageFieldName, image);
    }

    const response = await fetch(OPENAI_IMAGE_EDITS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: formData,
      signal
    });

    return parseOpenAIResponse(response);
  }

  function addResultToHistory({
    title,
    prompt: resultPrompt,
    mode,
    imageBase64
  }: {
    title: string;
    prompt: string;
    mode: HistoryEntry["mode"];
    imageBase64: string;
  }) {
    const imageUrl = imageDataUrl(imageBase64);
    const historyEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      title,
      prompt: resultPrompt,
      mode,
      imageUrl,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    setLatestImageBase64(imageBase64);
    setSelectedPreview({
      id: historyEntry.id,
      title: historyEntry.title,
      imageUrl: historyEntry.imageUrl
    });
    clearDownloadFallback();
    setHistory((entries) => [historyEntry, ...entries]);

    return historyEntry;
  }

  function startElapsedTimer() {
    const now = new Date().getTime();
    setRequestStartedAt(now);
    setElapsedSeconds(0);
  }

  function stopElapsedTimer() {
    setRequestStartedAt(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || isBatchGenerating) {
      return;
    }

    const cleanKey = apiKey.trim();
    const cleanPrompt = prompt.trim();

    if (!cleanKey) {
      setError("Add your OpenAI API key first.");
      setNotice("");
      return;
    }

    const reportImage = activePortraitStep ? getReferenceImage(activePortraitStep.reference) : null;

    if (isPortraitMode && activePortraitStep) {
      const blockers = stepBlockers(activePortraitStep);
      if (blockers.length) {
        setError(`${activePortraitStep.title} needs: ${blockers.join(", ")}.`);
        setNotice("");
        return;
      }
      if (!portraitAnalysis) {
        setError("Portrait analysis is required.");
        setNotice("");
        return;
      }
    }

    if (!isPortraitMode && !cleanPrompt) {
      setError("Describe the image or the change you want.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("");
    startElapsedTimer();
    if (isPortraitMode && activePortraitStep) {
      setFailedReportTitles((titles) => titles.filter((title) => title !== activePortraitStep.title));
    }
    setIsLoading(true);
    setGeneratingReportTitle(isPortraitMode ? activePortraitStep?.title ?? null : null);
    const { runId, signal } = beginRequestRun();

    try {
      const mode: HistoryEntry["mode"] = isPortraitMode
        ? "Portrait Analysis"
        : latestImageBase64 || uploadedImage
          ? "Edited"
          : "Generated";
      let imageBase64: string;
      let historyTitle = hasPreviousImage ? "Image improvement" : "Image generation";
      let historyPrompt = cleanPrompt;

      if (isPortraitMode && reportImage && activePortraitStep && portraitAnalysis) {
        const stepPrompt = activePortraitStep.buildPrompt({
          portrait: portraitAnalysis,
          body: bodyAnalysis ?? undefined
        });
        const imageInputs = await buildReportImageInputs(activePortraitStep, reportImage);
        imageBase64 = await editImage(imageInputs, stepPrompt, signal);
        historyTitle = activePortraitStep.title;
        historyPrompt = activePortraitStep.description;
      } else if (latestImageBase64) {
        imageBase64 = await editImage(
          base64ToFile(latestImageBase64, "latest-gpt-image-2-result.png"),
          buildFollowUpPrompt(cleanPrompt),
          signal
        );
      } else if (uploadedImage) {
        imageBase64 = await editImage(uploadedImage, buildFollowUpPrompt(cleanPrompt), signal);
      } else {
        imageBase64 = await generateFromText(cleanPrompt, signal);
      }

      if (!isCurrentRun(runId)) {
        return;
      }

      addResultToHistory({
        title: historyTitle,
        prompt: historyPrompt,
        mode,
        imageBase64
      });
      setNotice(`${historyTitle} is ready. Use Download in the preview, or download it from history.`);
      if (!isPortraitMode) {
        setPrompt("");
      }
    } catch (caughtError) {
      if (!isCurrentRun(runId)) {
        return;
      }
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      if (isPortraitMode && activePortraitStep) {
        setFailedReportTitles((titles) =>
          titles.includes(activePortraitStep.title) ? titles : [...titles, activePortraitStep.title]
        );
      }
    } finally {
      if (isCurrentRun(runId)) {
        setIsLoading(false);
        setGeneratingReportTitle(null);
        stopElapsedTimer();
        finishRequestRun(runId);
      }
    }
  }

  function handleRequestGenerateAllReports() {
    if (isLoading || isBatchGenerating) {
      return;
    }

    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setError("Add your OpenAI API key first.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("");
    setShowGenerateAllConfirm(true);
  }

  async function handleGenerateAllReports() {
    if (isLoading || isBatchGenerating) {
      return;
    }

    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setError("Add your OpenAI API key first.");
      setNotice("");
      return;
    }

    if (batchBlockers.length) {
      setError(`Generate All needs: ${batchBlockers.join(", ")}.`);
      setNotice("");
      return;
    }

    if (!portraitAnalysis) {
      setError("Portrait analysis is required.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("Starting all reports. Keep this tab open.");
    startElapsedTimer();
    setIsLoading(true);
    setIsBatchGenerating(true);
    setHasBatchRun(true);
    setBatchCompletedCount(0);
    setBatchResults([]);
    setFailedReportTitles([]);
    const { runId, signal } = beginRequestRun();

    const completedResults: BatchReportResult[] = [];
    const failedTitles: string[] = [];
    let lastErrorMessage = "";

    for (const [index, step] of PORTRAIT_ANALYSIS_STEPS.entries()) {
      if (!isCurrentRun(runId)) {
        return;
      }

      try {
        setSelectedPortraitReportIndex(index);
        setGeneratingReportTitle(step.title);
        setNotice(
          `Generating ${getReportShortTitle(step.title)} (${index + 1} / ${
            PORTRAIT_ANALYSIS_STEPS.length
          })...`
        );

        const referenceImage = getReferenceImage(step.reference);

        if (!referenceImage) {
          throw new Error(getMissingReferenceMessage(step));
        }

        const blockers = stepBlockers(step);
        if (blockers.length) {
          throw new Error(`${step.title} needs: ${blockers.join(", ")}.`);
        }

        const stepPrompt = step.buildPrompt({
          portrait: portraitAnalysis,
          body: bodyAnalysis ?? undefined
        });
        const imageInputs = await buildReportImageInputs(step, referenceImage);
        const imageBase64 = await editImage(imageInputs, stepPrompt, signal);

        if (!isCurrentRun(runId)) {
          return;
        }

        const historyEntry = addResultToHistory({
          title: step.title,
          prompt: step.description,
          mode: "Portrait Analysis",
          imageBase64
        });

        completedResults.push({
          title: historyEntry.title,
          imageUrl: historyEntry.imageUrl
        });
        setBatchResults([...completedResults]);
        setBatchCompletedCount(completedResults.length);
      } catch (caughtError) {
        if (!isCurrentRun(runId)) {
          return;
        }

        lastErrorMessage =
          caughtError instanceof Error ? caughtError.message : "Something went wrong.";
        failedTitles.push(step.title);
        setFailedReportTitles([...failedTitles]);
      }
    }

    if (!isCurrentRun(runId)) {
      return;
    }

    setIsLoading(false);
    setIsBatchGenerating(false);
    setGeneratingReportTitle(null);
    setShowGenerateAllConfirm(false);
    stopElapsedTimer();
    finishRequestRun(runId);

    if (completedResults.length) {
      setNotice(
        failedTitles.length
          ? `${completedResults.length} reports completed. ${failedTitles.length} failed. You can download a PDF of completed reports.`
          : "All reports are ready. You can download the PDF."
      );
    } else {
      setError(lastErrorMessage || "No reports completed. Check your API key and images.");
      setNotice("");
    }
  }

  async function handleImproveSelected() {
    if (isLoading || isBatchGenerating) {
      return;
    }

    const cleanKey = apiKey.trim();
    const cleanPrompt = improvementPrompt.trim();

    if (!cleanKey) {
      setError("Add your OpenAI API key first.");
      setNotice("");
      return;
    }

    if (!activePreview) {
      setError("Select or generate an image before applying an edit.");
      setNotice("");
      return;
    }

    if (!cleanPrompt) {
      setError("Describe the improvement to apply to the selected image.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("Generating edit from selected image...");
    startElapsedTimer();
    setIsLoading(true);
    setGeneratingReportTitle(null);
    const { runId, signal } = beginRequestRun();

    try {
      const sourceFile = dataUrlToFile(activePreview.imageUrl, makeDownloadName(activePreview.title));
      const imageBase64 = await editImage(sourceFile, buildFollowUpPrompt(cleanPrompt), signal);

      if (!isCurrentRun(runId)) {
        return;
      }

      const title = activePreview.title.startsWith("Edited: ")
        ? activePreview.title
        : `Edited: ${activePreview.title}`;

      addResultToHistory({
        title,
        prompt: cleanPrompt,
        mode: "Edited",
        imageBase64
      });
      setImprovementPrompt("");
      setNotice(`${title} is ready.`);
    } catch (caughtError) {
      if (!isCurrentRun(runId)) {
        return;
      }
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      if (isCurrentRun(runId)) {
        setIsLoading(false);
        stopElapsedTimer();
        finishRequestRun(runId);
      }
    }
  }

  function classifyAnalysisError(err: unknown): AnalysisErrorState["kind"] {
    if (err instanceof AnalysisRefusedError) return "refused";
    if (err instanceof AnalysisSchemaError) return "schema";
    if (err instanceof AnalysisTransportError) return "transport";
    return "transport";
  }

  async function runPortraitAnalysis(file: File) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setAnalysisError({
        slot: "portrait",
        kind: "transport",
        message: "Add your OpenAI API key first."
      });
      return;
    }

    portraitAnalysisAbortRef.current?.abort();
    portraitAnalysisRunIdRef.current += 1;
    const runId = portraitAnalysisRunIdRef.current;
    const controller = new AbortController();
    portraitAnalysisAbortRef.current = controller;

    setAnalyzingSlot("portrait");
    setAnalysisError(null);

    try {
      const hash = await hashFile(file);
      if (runId !== portraitAnalysisRunIdRef.current) return;
      setPortraitHash(hash);

      const cached = await getCachedAnalysis<PortraitAnalysis>(portraitCacheKey(hash));
      if (runId !== portraitAnalysisRunIdRef.current) return;

      if (cached && cached.schemaVersion) {
        setPortraitAnalysis(cached);
        setNotice("Portrait analysis loaded from cache.");
        return;
      }

      setNotice("Analyzing portrait...");
      const analysis = await analyzePortrait(file, cleanKey, controller.signal);
      if (runId !== portraitAnalysisRunIdRef.current) return;

      await saveCachedAnalysis(portraitCacheKey(hash), analysis);
      if (runId !== portraitAnalysisRunIdRef.current) return;

      setPortraitAnalysis(analysis);
      setNotice("Portrait analysis ready.");
    } catch (err) {
      if (runId !== portraitAnalysisRunIdRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;
      setAnalysisError({
        slot: "portrait",
        kind: classifyAnalysisError(err),
        message: err instanceof Error ? err.message : "Could not analyze the portrait."
      });
    } finally {
      if (runId === portraitAnalysisRunIdRef.current) {
        setAnalyzingSlot((current) => (current === "portrait" ? null : current));
        portraitAnalysisAbortRef.current = null;
      }
    }
  }

  async function runBodyAnalysis(file: File) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setAnalysisError({
        slot: "body",
        kind: "transport",
        message: "Add your OpenAI API key first."
      });
      return;
    }

    bodyAnalysisAbortRef.current?.abort();
    bodyAnalysisRunIdRef.current += 1;
    const runId = bodyAnalysisRunIdRef.current;
    const controller = new AbortController();
    bodyAnalysisAbortRef.current = controller;

    setAnalyzingSlot("body");
    setAnalysisError((current) => (current?.slot === "body" ? null : current));

    try {
      const hash = await hashFile(file);
      if (runId !== bodyAnalysisRunIdRef.current) return;
      setBodyHash(hash);

      const cached = await getCachedAnalysis<BodyAnalysis>(bodyCacheKey(hash));
      if (runId !== bodyAnalysisRunIdRef.current) return;

      if (cached && cached.schemaVersion) {
        setBodyAnalysis(cached);
        setNotice("Body analysis loaded from cache.");
        return;
      }

      setNotice("Analyzing body photo...");
      const analysis = await analyzeBody(file, cleanKey, controller.signal);
      if (runId !== bodyAnalysisRunIdRef.current) return;

      await saveCachedAnalysis(bodyCacheKey(hash), analysis);
      if (runId !== bodyAnalysisRunIdRef.current) return;

      setBodyAnalysis(analysis);
      setNotice("Body analysis ready.");
    } catch (err) {
      if (runId !== bodyAnalysisRunIdRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;
      setAnalysisError({
        slot: "body",
        kind: classifyAnalysisError(err),
        message: err instanceof Error ? err.message : "Could not analyze the body photo."
      });
    } finally {
      if (runId === bodyAnalysisRunIdRef.current) {
        setAnalyzingSlot((current) => (current === "body" ? null : current));
        bodyAnalysisAbortRef.current = null;
      }
    }
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    reference: ImageReference = "portrait"
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Use an image under 50MB.");
      return;
    }

    setError("");
    setNotice(`Preparing ${getReferenceLabel(reference)} for OpenAI...`);

    let normalizedFile: File;
    try {
      normalizedFile = await normalizeImageForOpenAI(file);
      setReferenceImage(reference, normalizedFile);
      setReferencePreview(reference, await readFileAsDataUrl(normalizedFile));
      setNotice(`${getReferenceLabel(reference)} prepared.`);
    } catch (caughtError) {
      setReferenceImage(reference, null);
      setReferencePreview(reference, null);
      setNotice("");
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not prepare the selected image."
      );
      return;
    }

    setLatestImageBase64(null);
    setSelectedPreview(null);
    setImprovementPrompt("");

    if (reference === "portrait") {
      setPortraitAnalysis(null);
      setAnalysisError((current) => (current?.slot === "portrait" ? null : current));
      void runPortraitAnalysis(normalizedFile);
    } else if (reference === "body") {
      setBodyAnalysis(null);
      setAnalysisError((current) => (current?.slot === "body" ? null : current));
      void runBodyAnalysis(normalizedFile);
    }
  }

  async function handleReanalyze(slot: "portrait" | "body") {
    if (slot === "portrait") {
      if (portraitHash) {
        try {
          await deleteCachedAnalysis(portraitCacheKey(portraitHash));
        } catch {
          /* ignore */
        }
      }
      setPortraitAnalysis(null);
      setAnalysisError((current) => (current?.slot === "portrait" ? null : current));
      if (uploadedImage) {
        void runPortraitAnalysis(uploadedImage);
      }
    } else {
      if (bodyHash) {
        try {
          await deleteCachedAnalysis(bodyCacheKey(bodyHash));
        } catch {
          /* ignore */
        }
      }
      setBodyAnalysis(null);
      setAnalysisError((current) => (current?.slot === "body" ? null : current));
      if (bodyImage) {
        void runBodyAnalysis(bodyImage);
      }
    }
  }

  function clearUpload(reference: ImageReference = "portrait") {
    setReferenceImage(reference, null);
    setReferencePreview(reference, null);
    setNotice("");

    if (reference === "portrait") {
      portraitAnalysisRunIdRef.current += 1;
      additionalPortraitRunIdRef.current += 1;
      portraitAnalysisAbortRef.current?.abort();
      portraitAnalysisAbortRef.current = null;
      setPortraitAnalysis(null);
      setPortraitHash(null);
      setAnalysisError((current) => (current?.slot === "portrait" ? null : current));
      setAdditionalPortraits([]);
      setAdditionalPortraitPreviews([]);
    } else if (reference === "body") {
      bodyAnalysisRunIdRef.current += 1;
      bodyAnalysisAbortRef.current?.abort();
      bodyAnalysisAbortRef.current = null;
      setBodyAnalysis(null);
      setBodyHash(null);
      setAnalysisError((current) => (current?.slot === "body" ? null : current));
    }

    const inputRef = getReferenceInput(reference);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleAdditionalPortraitChange(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    additionalPortraitRunIdRef.current += 1;
    const runId = additionalPortraitRunIdRef.current;

    if (!incoming.length) {
      return;
    }

    const remainingSlots = Math.max(0, 3 - additionalPortraits.length);
    if (remainingSlots === 0) {
      setError("You can add up to 3 additional portrait angles.");
      return;
    }

    const accepted = incoming.slice(0, remainingSlots);
    const skippedCount = incoming.length - accepted.length;
    setError("");
    setNotice(
      `Preparing ${accepted.length} additional portrait${accepted.length === 1 ? "" : "s"}...`
    );

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of accepted) {
      if (runId !== additionalPortraitRunIdRef.current) {
        return;
      }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        setError("Use PNG, JPG, or WebP images.");
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("Each additional image must be under 50MB.");
        continue;
      }
      try {
        const normalized = await normalizeImageForOpenAI(file);
        if (runId !== additionalPortraitRunIdRef.current) {
          return;
        }
        newFiles.push(normalized);
        newPreviews.push(await readFileAsDataUrl(normalized));
        if (runId !== additionalPortraitRunIdRef.current) {
          return;
        }
      } catch (caughtError) {
        if (runId !== additionalPortraitRunIdRef.current) {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not prepare an additional portrait."
        );
      }
    }

    if (runId !== additionalPortraitRunIdRef.current) {
      return;
    }

    if (!newFiles.length) {
      setNotice("");
      return;
    }

    setAdditionalPortraits((current) => [...current, ...newFiles]);
    setAdditionalPortraitPreviews((current) => [...current, ...newPreviews]);
    setNotice(
      `${newFiles.length} additional portrait${newFiles.length === 1 ? "" : "s"} added.${
        skippedCount ? ` ${skippedCount} skipped (max 3 extras).` : ""
      }`
    );
  }

  function removeAdditionalPortrait(index: number) {
    setAdditionalPortraits((current) => current.filter((_, i) => i !== index));
    setAdditionalPortraitPreviews((current) => current.filter((_, i) => i !== index));
  }

  async function buildReportImageInputs(
    step: PortraitAnalysisStep,
    baseFile: File
  ): Promise<File[]> {
    const inputs: File[] = [];

    if (step.reference === "portrait") {
      inputs.push(baseFile);
      inputs.push(...additionalPortraits);
    } else {
      if (uploadedImage) {
        inputs.push(uploadedImage);
        inputs.push(...additionalPortraits);
      }
      inputs.push(baseFile);
    }

    const refUrl = referenceUrlFor(step.title);
    if (refUrl) {
      const referenceFile = await fetchReferenceFile(refUrl);
      inputs.push(referenceFile);
    }
    return inputs;
  }

  function resetSession() {
    cancelActiveRun();
    additionalPortraitRunIdRef.current += 1;
    portraitAnalysisAbortRef.current?.abort();
    portraitAnalysisAbortRef.current = null;
    bodyAnalysisAbortRef.current?.abort();
    bodyAnalysisAbortRef.current = null;
    setPrompt("");
    setUploadedImage(null);
    setUploadedPreviewUrl(null);
    setAdditionalPortraits([]);
    setAdditionalPortraitPreviews([]);
    setBodyImage(null);
    setBodyPreviewUrl(null);
    setHandImage(null);
    setHandPreviewUrl(null);
    setLatestImageBase64(null);
    setSelectedPreview(null);
    setImprovementPrompt("");
    stopElapsedTimer();
    setFailedReportTitles([]);
    setShowGenerateAllConfirm(false);
    setIsBatchGenerating(false);
    setHasBatchRun(false);
    setBatchCompletedCount(0);
    setBatchResults([]);
    setError("");
    setNotice("");
    setSelectedPortraitReportIndex(0);
    setOutfitIdentityAcknowledged(false);
    setPortraitAnalysis(null);
    setBodyAnalysis(null);
    setPortraitHash(null);
    setBodyHash(null);
    setAnalysisError(null);
    setAnalyzingSlot(null);
    clearDownloadFallback();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (bodyInputRef.current) {
      bodyInputRef.current.value = "";
    }
    if (handInputRef.current) {
      handInputRef.current.value = "";
    }
  }

  function selectHistoryEntry(entry: HistoryEntry) {
    setSelectedPreview({
      id: entry.id,
      title: entry.title,
      imageUrl: entry.imageUrl
    });
    clearDownloadFallback();
    setNotice(`${entry.title} selected in preview.`);
  }

  function handleOpenImage(image: PreviewImage | HistoryEntry) {
    try {
      setError("");
      openBlob(dataUrlToBlob(image.imageUrl));
      setNotice(`${image.title} opened in a new tab.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open the image.");
      setNotice("");
    }
  }

  async function handleDownloadImage(image: PreviewImage | HistoryEntry) {
    const blob = dataUrlToBlob(image.imageUrl);
    const filename = makeDownloadName(image.title);

    try {
      setError("");
      const pickerWindow = window as SaveFilePickerWindow;
      if (pickerWindow.showSaveFilePicker) {
        await saveBlob(blob, filename);
      } else {
        triggerBrowserDownload(image.imageUrl, filename);
      }
      clearDownloadFallback();
      setNotice(`${image.title} download started.`);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        setNotice("Download canceled.");
        return;
      }

      setManualDownloadFallback(image.imageUrl, image.title, filename);
      setError("");
      setNotice("Automatic download was blocked. Use the Save image link below.");
    }
  }

  function handleManualDownloadFallback() {
    if (!downloadFallback) {
      return;
    }

    try {
      setError("");
      triggerBrowserDownload(downloadFallback.imageUrl, downloadFallback.filename);
      setNotice(`${downloadFallback.title} download started.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the image.");
      setNotice("");
    }
  }

  async function handleDownloadAll() {
    if (!history.length) {
      setError("There are no images to download yet.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("Preparing ZIP download...");
    setIsDownloadingZip(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      history.forEach((entry, index) => {
        const base64 = entry.imageUrl.split(",")[1];

        if (!base64) {
          return;
        }

        zip.file(
          `${String(history.length - index).padStart(2, "0")}-${makeDownloadName(entry.title)}`,
          base64,
          { base64: true }
        );
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "imagegen-history.zip";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice("ZIP download started.");
    } catch {
      setError("Could not prepare the ZIP download.");
      setNotice("");
    } finally {
      setIsDownloadingZip(false);
    }
  }

  async function handleDownloadPdf() {
    if (!batchResults.length) {
      setError("Generate reports before downloading a PDF.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("Preparing PDF...");
    setIsCreatingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "a4", unit: "pt", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const titleHeight = 24;
      const imageSize = Math.min(pageWidth - margin * 2, pageHeight - margin * 2 - titleHeight);
      const imageX = (pageWidth - imageSize) / 2;
      const imageY = margin + titleHeight;

      batchResults.forEach((result, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.text(result.title, margin, margin);
        pdf.addImage(result.imageUrl, "PNG", imageX, imageY, imageSize, imageSize);
      });

      pdf.save("portrait-analysis-reports.pdf");
      setNotice("PDF download started.");
    } catch {
      setError("Could not create the PDF.");
      setNotice("");
    } finally {
      setIsCreatingPdf(false);
    }
  }

  async function handleClearLocalHistory() {
    setHistory([]);
    setSelectedPreview(null);
    setLatestImageBase64(null);
    setImprovementPrompt("");
    setBatchResults([]);
    setBatchCompletedCount(0);
    setHasBatchRun(false);
    setFailedReportTitles([]);
    setError("");
    setNotice("Local history cleared.");
    clearDownloadFallback();

    try {
      await clearPersistedState();
    } catch {
      setNotice("History cleared from the app, but browser storage could not be cleared.");
    }
  }

  function renderAnalysisChips() {
    const portraitChips: Array<{ label: string; value: string; muted?: boolean }> = [];
    if (portraitAnalysis) {
      const p = portraitAnalysis;
      const hedge = (v: { value: string; confidence: "high" | "medium" | "low" }) =>
        v.confidence === "high" ? v.value : `${v.value} · most likely`;
      portraitChips.push({ label: "Depth", value: hedge(p.depth) });
      portraitChips.push({ label: "Contrast", value: hedge(p.contrast) });
      portraitChips.push({ label: "Undertone", value: p.undertone.displayLabel });
      portraitChips.push({
        label: "Season",
        value:
          p.colorSeason.confidence === "high"
            ? p.colorSeason.value
            : `${p.colorSeason.value} · most likely`
      });
      portraitChips.push({ label: "Face shape", value: hedge(p.faceShape) });
      portraitChips.push({ label: "Best metal", value: hedge(p.bestMetal) });
    }

    const bodyChips: Array<{ label: string; value: string }> = [];
    if (bodyAnalysis) {
      const hedge = (v: { value: string; confidence: "high" | "medium" | "low" }) =>
        v.confidence === "high" ? v.value : `${v.value} · most likely`;
      bodyChips.push({ label: "Body shape", value: hedge(bodyAnalysis.bodyShape) });
    }

    const noUploads = !uploadedImage && !bodyImage;
    if (noUploads && !analyzingSlot && !analysisError) {
      return null;
    }

    const errorBanner = analysisError ? (
      <div
        className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-[var(--danger)]"
        role="alert"
      >
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium">
            {analysisError.kind === "refused"
              ? `${analysisError.slot === "portrait" ? "Portrait" : "Body"} analysis was refused`
              : analysisError.kind === "schema"
                ? `${analysisError.slot === "portrait" ? "Portrait" : "Body"} analysis returned an unexpected shape`
                : `${analysisError.slot === "portrait" ? "Portrait" : "Body"} analysis failed`}
          </p>
          <p className="mt-0.5 leading-5">{analysisError.message}</p>
          <button
            type="button"
            className="mt-1 inline-flex items-center text-xs font-medium underline"
            onClick={() => handleReanalyze(analysisError.slot)}
          >
            Retry
          </button>
        </div>
      </div>
    ) : null;

    return (
      <div className="space-y-2 rounded-md border border-[var(--border)] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Analysis</h2>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            {analyzingSlot ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Analyzing {analyzingSlot}
              </span>
            ) : null}
            {portraitAnalysis ? (
              <button
                type="button"
                className="underline"
                onClick={() => handleReanalyze("portrait")}
                disabled={analyzingSlot === "portrait"}
              >
                Re-analyze portrait
              </button>
            ) : null}
            {bodyAnalysis ? (
              <button
                type="button"
                className="underline"
                onClick={() => handleReanalyze("body")}
                disabled={analyzingSlot === "body"}
              >
                Re-analyze body
              </button>
            ) : null}
          </div>
        </div>
        {portraitChips.length || bodyChips.length ? (
          <div className="flex flex-wrap gap-1.5">
            {portraitChips.map((chip) => (
              <span
                key={`p-${chip.label}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-2 py-0.5 text-xs"
              >
                <span className="font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  {chip.label}
                </span>
                <span>{chip.value}</span>
              </span>
            ))}
            {bodyChips.map((chip) => (
              <span
                key={`b-${chip.label}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-2 py-0.5 text-xs"
              >
                <span className="font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  {chip.label}
                </span>
                <span>{chip.value}</span>
              </span>
            ))}
          </div>
        ) : analyzingSlot ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Reading the photo to set depth, contrast, undertone, and season.
          </p>
        ) : analysisError ? null : (
          <p className="text-xs text-[var(--muted-foreground)]">
            Upload a portrait to start.
          </p>
        )}
        {errorBanner}
      </div>
    );
  }

  function renderAdditionalPortraitsSlot() {
    const remainingSlots = Math.max(0, 3 - additionalPortraits.length);

    return (
      <div className="space-y-2">
        <label
          className="flex items-center gap-2 text-sm font-medium"
          htmlFor="additional-portraits"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Additional portrait angles ({additionalPortraits.length}/3)
        </label>
        <input
          id="additional-portraits"
          className="w-full rounded-md border border-dashed border-[var(--border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          disabled={remainingSlots === 0}
          onChange={handleAdditionalPortraitChange}
        />
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          Optional. Add up to 3 more close, clear angles of the same person. Keep eyes open
          where possible. Identity-critical reports (Hairstyles, Frames, Metals, Color
          Try-On) get more stable results with more angles.
        </p>
        {additionalPortraitPreviews.length ? (
          <div className="grid grid-cols-3 gap-2">
            {additionalPortraitPreviews.map((url, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel-soft)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Additional angle ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-zinc-900"
                  onClick={() => removeAdditionalPortrait(index)}
                  aria-label={`Remove additional portrait ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  function renderUploadSlot({
    reference,
    title,
    helpText
  }: {
    reference: ImageReference;
    title: string;
    helpText: string;
  }) {
    const image = getReferenceImage(reference);
    const previewUrl = getReferencePreview(reference);
    const inputRef = getReferenceInput(reference);

    return (
      <div className="space-y-2">
        <label
          className="flex items-center gap-2 text-sm font-medium"
          htmlFor={`${reference}-image`}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {title}
        </label>
        <input
          ref={inputRef}
          id={`${reference}-image`}
          className="w-full rounded-md border border-dashed border-[var(--border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          // eslint-disable-next-line react-hooks/refs -- handleImageChange touches refs only inside async paths
          onChange={(event) => handleImageChange(event, reference)}
        />
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">{helpText}</p>
        {previewUrl ? (
          <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={title} className="h-14 w-14 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{image?.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Used for {getReferenceLabel(reference)} reports
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-[var(--muted-foreground)] transition hover:bg-white hover:text-zinc-900"
              onClick={() => clearUpload(reference)}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Personal GPT Image 2
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Generate, edit, download.
            </h1>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            {MODEL} / {QUALITY} / {SIZE}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="panel rounded-lg p-4 sm:p-5">
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium" htmlFor="api-key">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  OpenAI API key
                </label>
                <input
                  id="api-key"
                  className="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                />
                <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                  Your key is stored only in this browser. This app does not provide a shared API
                  key.
                </p>
              </div>

              {isPortraitMode ? (
                <>
                  {renderAnalysisChips()}

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="report">
                      Report
                    </label>
                    <select
                      id="report"
                      className="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                      value={selectedPortraitReportIndex}
                      onChange={(event) => {
                        const nextIndex = Number(event.target.value);
                        setSelectedPortraitReportIndex(nextIndex);
                        setError("");
                        setNotice(`${PORTRAIT_ANALYSIS_STEPS[nextIndex].title} selected.`);
                      }}
                      disabled={isLoading}
                    >
                      {PORTRAIT_ANALYSIS_STEPS.map((step, index) => (
                        <option key={step.title} value={index}>
                          {step.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                      {activePortraitStep.description}
                    </p>
                    <div className="rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                      {activePortraitStepBlockers.length ? (
                        <span>
                          Needs: <span className="font-medium">{activePortraitStepBlockers.join(", ")}</span>.
                        </span>
                      ) : (
                        <span>Ready to generate.</span>
                      )}
                      {generatedReportTitles.has(activePortraitStep.title) ? (
                        <span className="ml-1 text-emerald-700">Already generated.</span>
                      ) : null}
                      {failedReportTitles.includes(activePortraitStep.title) ? (
                        <span className="ml-1 text-red-700">Last attempt failed.</span>
                      ) : null}
                    </div>
                  </div>

                  {isOutfitStyleStep(activePortraitStep) ? (
                    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div>
                        <h2 className="text-sm font-medium text-amber-950">
                          Outfit identity requirements
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-amber-950">
                          This report renders photorealistic outfit portraits of the same person.
                          Use a close front-facing portrait with eyes open, face large in frame,
                          natural light, and a full-body photo. Wide selfies can work for analysis
                          but produce weaker face preservation.
                        </p>
                      </div>
                      <label className="flex gap-2 text-xs leading-5 text-amber-950">
                        <input
                          className="mt-1 h-4 w-4 shrink-0"
                          checked={outfitIdentityAcknowledged}
                          onChange={(event) => setOutfitIdentityAcknowledged(event.target.checked)}
                          type="checkbox"
                        />
                        <span>
                          I uploaded a close portrait and a full-body photo for
                          identity-preserving outfit results.
                        </span>
                      </label>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-medium">Uploads</h2>
                      <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                        Portrait is the default reference. Extra uploads appear only when the
                        selected report or Generate All needs them.
                      </p>
                    </div>
                    {renderUploadSlot({
                      reference: "portrait",
                      title: "Portrait photo",
                      helpText:
                        "Required for most reports. For face-preserving results, use a close front-facing head-and-shoulders photo with eyes open, face large in frame, natural light, and hair visible. Wide selfies can work for color analysis but are weaker for identity."
                    })}
                    {uploadedImage ? renderAdditionalPortraitsSlot() : null}
                    {activePortraitStep.reference === "body" ||
                    showGenerateAllConfirm ||
                    isBatchGenerating
                      ? renderUploadSlot({
                          reference: "body",
                          title: "Full-body photo",
                          helpText:
                            "Required for Body Shape Guide, Outfit Style Guide, and Generate All. Use a standing photo with the full silhouette visible. Face identity still comes from the portrait photo."
                        })
                      : null}
                    {activePortraitStep.reference === "hand" ||
                    showGenerateAllConfirm ||
                    isBatchGenerating
                      ? renderUploadSlot({
                          reference: "hand",
                          title: "Hand photo",
                          helpText:
                            "Required for Nail Color Guide and Generate All. Use a clear hand photo in natural light with fingers and skin tone visible."
                        })
                      : null}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" htmlFor="prompt">
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    Prompt
                  </label>
                  <textarea
                    id="prompt"
                    className="min-h-40 w-full resize-y rounded-md border border-[var(--border)] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={
                      hasPreviousImage
                        ? "Describe the improvement to make to the latest image..."
                        : "Describe the image you want..."
                    }
                  />
                </div>
              )}

              {error ? (
                <div
                  className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              ) : null}

              {notice ? (
                <div
                  aria-live="polite"
                  className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{notice}</p>
                </div>
              ) : null}

              {downloadFallback ? (
                <div
                  aria-live="polite"
                  className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
                  role="status"
                >
                  <span>Download did not start automatically.</span>
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300 bg-white px-3 text-sm font-medium transition hover:bg-amber-100"
                    onClick={handleManualDownloadFallback}
                    type="button"
                  >
                    Save image
                  </button>
                </div>
              ) : null}

              {showGenerateAllConfirm ? (
                <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <div>
                    <h3 className="font-medium">Generate all reports</h3>
                    <p className="mt-1 leading-6">
                      This will generate {PORTRAIT_ANALYSIS_STEPS.length} reports. Estimated time:
                      around 20-30 minutes. Keep this tab open.
                    </p>
                  </div>
                  <p className="text-xs leading-5">
                    Requires portrait, full-body, and hand photos plus their analyses.
                    {batchBlockers.length ? (
                      <span className="ml-1 font-medium">
                        Missing: {batchBlockers.join(", ")}.
                      </span>
                    ) : null}
                  </p>
                  <label className="flex gap-2 rounded-md border border-amber-300 bg-white/70 p-3 text-xs leading-5">
                    <input
                      className="mt-1 h-4 w-4 shrink-0"
                      checked={outfitIdentityAcknowledged}
                      onChange={(event) => setOutfitIdentityAcknowledged(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      I uploaded a close portrait and full-body photo for the Outfit Style report.
                    </span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isLoading || batchBlockers.length > 0}
                      className={cx(
                        "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] transition",
                        isLoading || batchBlockers.length > 0
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-zinc-700"
                      )}
                      onClick={handleGenerateAllReports}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Start Batch
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-3 text-sm font-medium transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => setShowGenerateAllConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {isBatchGenerating || hasBatchRun || batchResults.length > 0 ? (
                <div
                  aria-live="polite"
                  className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--panel-soft)] p-3 text-sm"
                  role="status"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium">Batch progress</h3>
                      <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                        {batchCompletedCount} / {PORTRAIT_ANALYSIS_STEPS.length} complete
                        {generatingReportTitle ? `, now ${generatingReportTitle}` : ""}.
                      </p>
                    </div>
                    {isBatchGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                  </div>
                  {failedReportTitles.length ? (
                    <p className="text-xs leading-5 text-red-700">
                      Failed: {failedReportTitles.join(", ")}
                    </p>
                  ) : null}
                  {batchResults.length ? (
                    <button
                      type="button"
                      disabled={isCreatingPdf || isBatchGenerating}
                      className={cx(
                        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition",
                        isCreatingPdf || isBatchGenerating
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-white"
                      )}
                      onClick={handleDownloadPdf}
                    >
                      {isCreatingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden="true" />
                      )}
                      Download PDF
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (isPortraitMode && !!activePortraitStep && !activePortraitStepReady)
                  }
                  className={cx(
                    "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition",
                    isLoading ||
                      (isPortraitMode && !!activePortraitStep && !activePortraitStepReady)
                      ? "cursor-not-allowed opacity-70"
                      : "hover:bg-zinc-700"
                  )}
                  title={
                    isPortraitMode && !!activePortraitStep && !activePortraitStepReady
                      ? `Needs: ${activePortraitStepBlockers.join(", ")}`
                      : actionLabel
                  }
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="truncate">
                    {isLoading
                      ? generatingReportTitle
                        ? `${getReportShortTitle(generatingReportTitle)} ${elapsedSeconds}s`
                        : `Working ${elapsedSeconds}s`
                      : actionLabel}
                  </span>
                </button>
                <div className={cx("grid gap-2", isPortraitMode && "sm:grid-cols-2")}>
                  {isPortraitMode ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      className={cx(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition",
                        isLoading
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-[var(--panel-soft)]"
                      )}
                      onClick={handleRequestGenerateAllReports}
                    >
                      <FileArchive className="h-4 w-4" aria-hidden="true" />
                      Generate All Reports
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition hover:bg-[var(--panel-soft)]"
                    onClick={resetSession}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="flex flex-col gap-5">
            <div className="panel rounded-lg p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Preview</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {activePreview
                      ? activePreview.title
                      : isPortraitMode
                        ? "Portrait reports use the original upload as reference."
                        : "Latest result is edited on every follow-up."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <button
                    className={cx(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition",
                      activePreview
                        ? "hover:bg-[var(--panel-soft)]"
                        : "cursor-not-allowed opacity-50"
                    )}
                    disabled={!activePreview}
                    onClick={() => {
                      if (activePreview) {
                        handleOpenImage(activePreview);
                      }
                    }}
                    type="button"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open
                  </button>
                  <button
                    className={cx(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition",
                      activePreview
                        ? "hover:bg-[var(--panel-soft)]"
                        : "cursor-not-allowed opacity-50"
                    )}
                    disabled={!activePreview}
                    onClick={() => {
                      if (activePreview) {
                        handleDownloadImage(activePreview);
                      }
                    }}
                    type="button"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>
                </div>
              </div>

              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel-soft)]">
                {activePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePreview.imageUrl}
                    alt={activePreview.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex max-w-xs flex-col items-center gap-3 px-5 text-center text-[var(--muted-foreground)]">
                    <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    <p className="text-sm leading-6">
                      Your 1024 x 1536 image will appear here after generation.
                    </p>
                  </div>
                )}
              </div>

              {!isPortraitMode ? (
                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                  <label
                    className="flex items-center gap-2 text-sm font-medium"
                    htmlFor="improvement-prompt"
                  >
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    Improve selected image
                  </label>
                  <textarea
                    id="improvement-prompt"
                    className="min-h-24 w-full resize-y rounded-md border border-[var(--border)] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    value={improvementPrompt}
                    onChange={(event) => setImprovementPrompt(event.target.value)}
                    placeholder="Describe the edit to apply to the current preview..."
                    disabled={!activePreview || isLoading}
                  />
                  <button
                    type="button"
                    disabled={!activePreview || isLoading}
                    className={cx(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition",
                      !activePreview || isLoading
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-zinc-700"
                    )}
                    onClick={handleImproveSelected}
                  >
                    {isLoading && !generatingReportTitle ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                    Apply Edit
                  </button>
                </div>
              ) : null}
            </div>

            <div className="panel rounded-lg p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">History</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Saved locally in this browser.
                  </p>
                </div>
                {history.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isDownloadingZip}
                      className={cx(
                        "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium transition",
                        isDownloadingZip
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-[var(--panel-soft)]"
                      )}
                      onClick={handleDownloadAll}
                    >
                      {isDownloadingZip ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <FileArchive className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Download All
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium transition hover:bg-[var(--panel-soft)]"
                      onClick={handleClearLocalHistory}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              {history.length > 0 ? (
                <div className="grid gap-3">
                  {history.map((entry) => (
                    <div
                      className={cx(
                        "overflow-hidden rounded-md border bg-white p-2 transition",
                        selectedPreview?.id === entry.id
                          ? "border-zinc-900"
                          : "border-[var(--border)]"
                      )}
                      key={entry.id}
                    >
                      <button
                        className="grid w-full grid-cols-[64px_minmax(0,1fr)] gap-3 text-left"
                        type="button"
                        onClick={() => selectHistoryEntry(entry)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.imageUrl}
                          alt=""
                          className="h-16 w-16 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <div className="mb-1 flex min-w-0 items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <span>{entry.mode}</span>
                            <span aria-hidden="true">/</span>
                            <span>{entry.createdAt}</span>
                          </div>
                          <h3 className="truncate text-sm font-medium">{entry.title}</h3>
                          <p className="truncate text-xs leading-5 text-[var(--muted-foreground)]">
                            {entry.prompt}
                          </p>
                        </div>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2 pl-[76px]">
                        <button
                          className="inline-flex h-8 items-center rounded-md border border-[var(--border)] px-2 text-xs font-medium transition hover:bg-[var(--panel-soft)]"
                          type="button"
                          onClick={() => handleOpenImage(entry)}
                        >
                          Open
                        </button>
                        <button
                          className="inline-flex h-8 items-center rounded-md border border-[var(--border)] px-2 text-xs font-medium transition hover:bg-[var(--panel-soft)]"
                          type="button"
                          onClick={() => handleDownloadImage(entry)}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                  No generations yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
