import './styles.css';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <div class="brand"><div class="brand-mark"><span></span><span></span><span></span></div><span>Dictator</span></div>
    <div class="top-actions">
      <button class="icon-button" id="infoButton" aria-label="How it works" title="How it works">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/></svg>
      </button>
      <button class="upload-button" id="headerUpload">
        <svg viewBox="0 0 24 24"><path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 15v3.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V15"/></svg>Upload PDF
      </button>
    </div>
  </header>
  <main class="workspace">
    <aside class="sidebar">
      <section class="control-section">
        <div class="section-heading"><span>Dictation</span><span class="status-badge" id="statusBadge">Ready</span></div>
        <button class="primary-button" id="startButton" disabled>
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Start dictating</span>
        </button>
        <div class="transport">
          <button class="transport-button" id="previousButton" disabled aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M18 5l-8 7 8 7zM6 5v14"/></svg></button>
          <button class="transport-button listen" id="repeatButton" disabled aria-label="Repeat"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 10-2.34 5.66M20 11V5m0 6h-6"/></svg></button>
          <button class="transport-button" id="nextButton" disabled aria-label="Next"><svg viewBox="0 0 24 24"><path d="M6 5l8 7-8 7zM18 5v14"/></svg></button>
          <button class="transport-button" id="pauseButton" disabled aria-label="Pause"><svg viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg></button>
        </div>
      </section>
      <section class="progress-section">
        <div class="progress-label"><span>Progress</span><span id="progressText">0 / 0</span></div>
        <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
        <div class="word-control">
          <label for="wordCountRange">Words per section</label>
          <div class="word-control-row">
            <input type="range" id="wordCountRange" min="1" max="20" value="6" />
            <input type="number" id="wordCountValue" min="1" max="20" value="6" aria-label="Words per section" />
          </div>
        </div>
        <div class="speed-control">
          <label for="speedRange">Reading speed <span id="speedValue">1.0x</span></label>
          <input type="range" id="speedRange" min="0.5" max="1.5" step="0.1" value="0.9" />
        </div>
        <div class="resume-control">
          <label for="resumeSection">Resume at section</label>
          <div class="resume-control-row">
            <input type="number" id="resumeSection" min="1" value="1" aria-label="Resume section" />
            <button id="resumeButton" disabled>Go</button>
          </div>
        </div>
      </section>
      <section class="voice-settings">
        <label for="voiceSelect">Voice</label>
        <select id="voiceSelect" disabled><option>Loading voices…</option></select>
      </section>
      <section class="voice-section">
        <div class="section-heading"><span>Voice control</span></div>
        <button class="voice-button" id="voiceButton" disabled>
          <span class="mic-ring"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3M9 21h6"/></svg></span>
          <span><strong id="voiceTitle">Start listening</strong><small id="voiceHint">Say "next" to continue</small></span>
        </button>
      </section>
    </aside>
    <section class="document-area">
      <div class="document-toolbar">
        <div class="document-name"><svg viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg><span id="documentName">No document selected</span></div>
        <div class="zoom-controls"><button id="zoomOut" aria-label="Zoom out">−</button><span id="zoomLabel">100%</span><button id="zoomIn" aria-label="Zoom in">+</button></div>
      </div>
      <div class="viewer" id="viewer">
        <label class="drop-zone" id="dropZone">
          <input type="file" id="fileInput" accept="application/pdf" />
          <div class="drop-icon"><svg viewBox="0 0 24 24"><path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 15v3.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V15"/></svg></div>
          <h2>Upload a PDF to begin</h2><p>Drag and drop a document here, or click to browse</p><span class="browse-button">Choose PDF</span>
        </label>
        <div class="pages" id="pages"></div>
      </div>
    </section>
  </main>
  <div class="toast" id="toast" role="status"></div>
  <div class="modal-backdrop" id="modal" hidden>
    <div class="modal"><button class="modal-close" id="modalClose" aria-label="Close">×</button><h2>How Dictator works</h2><ol><li>Upload a PDF document.</li><li>Choose the section size, voice, and reading speed.</li><li>Press Start or say “next” to dictate.</li><li>Use the arrow keys or buttons to move sections.</li></ol><div class="shortcut-list"><span><kbd>←</kbd> Previous</span><span><kbd>→</kbd> Next</span><span><kbd>R</kbd> Repeat</span><span><kbd>Space</kbd> Pause</span></div></div>
  </div>
`;

const el = Object.fromEntries(['fileInput','dropZone','pages','documentName','startButton','previousButton','repeatButton','nextButton','pauseButton','voiceButton','voiceTitle','voiceHint','progressText','progressFill','statusBadge','zoomLabel','toast','wordCountRange','wordCountValue','speedRange','speedValue','resumeSection','resumeButton','voiceSelect'].map(id => [id, document.querySelector('#'+id)]));

let pdfDoc = null, segments = [], currentIndex = -1, zoom = 1, pageRecords = [], recognition = null, listening = false, extractedText = '';
let playbackPaused = false;
let readingRate = 0.9;

const savedReadingRate = Number(localStorage.getItem('dictatorReadingRate'));
if (Number.isFinite(savedReadingRate) && savedReadingRate >= 0.5 && savedReadingRate <= 1.5) {
  readingRate = savedReadingRate;
  el.speedRange.value = String(readingRate);
  el.speedValue.textContent = `${readingRate.toFixed(1)}x`;
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.toast.classList.remove('visible'), 2600);
}

function splitIntoSegments(text, wordsPerSection = 6) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [clean];
  const result = [];
  sentences.forEach(sentence => {
    const words = sentence.trim().match(/\S+/g) || [];
    for (let i = 0; i < words.length; i += wordsPerSection) {
      const chunk = words.slice(i, i + wordsPerSection);
      const chunkText = chunk.join(' ');
      result.push({
        text: chunkText,
        words: normalizeWords(chunkText),
      });
    }
  });
  return result;
}

async function loadPdf(file) {
  if (!file || file.type !== 'application/pdf') return toast('Please choose a PDF file');
  el.documentName.textContent = file.name;
  el.statusBadge.textContent = 'Loading';
  el.pages.innerHTML = '<div class="loading">Loading document…</div>';
  el.dropZone.classList.add('hidden');
  try {
    pdfDoc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    pageRecords = [];
    segments = [];
    currentIndex = -1;
    await renderAllPages();
    extractedText = pageRecords.map(page => page.items.map(item => item.str).join(' ')).join(' ');
    segments = splitIntoSegments(extractedText, Number(el.wordCountValue.value));
    if (!segments.length) throw new Error('No readable text found in this PDF');
    [el.startButton, el.previousButton, el.repeatButton, el.nextButton, el.voiceButton].forEach(button => button.disabled = false);
    el.pauseButton.disabled = false;
    el.resumeButton.disabled = false;
    el.resumeSection.max = String(segments.length);
    el.resumeSection.value = '1';
    el.statusBadge.textContent = 'Ready';
    updateProgress();
    toast(`${pdfDoc.numPages} pages ready`);
  } catch (error) {
    console.error(error);
    el.statusBadge.textContent = 'Error';
    toast(error.message || 'Could not open this PDF');
  }
}

async function renderAllPages() {
  el.pages.innerHTML = '';
  pageRecords = [];
  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
    const page = await pdfDoc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min((720 * zoom) / base.width, 1.45) * zoom });
    const pageWrap = document.createElement('div');
    pageWrap.className = 'pdf-page';
    pageWrap.dataset.page = pageNumber;
    pageWrap.style.width = `${viewport.width}px`;
    pageWrap.style.height = `${viewport.height}px`;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    pageWrap.append(canvas, textLayer);
    el.pages.appendChild(pageWrap);
    await page.render({ canvasContext: context, canvas, viewport, transform: outputScale !== 1 ? [outputScale,0,0,outputScale,0,0] : null }).promise;
    const textContent = await page.getTextContent();
    await new TextLayer({ textContentSource: textContent, container: textLayer, viewport }).render();
    pageRecords.push({ pageNumber, items: textContent.items });
  }
}

function normalizeWords(text) {
  return (text.toLowerCase().match(/\p{L}[\p{L}\p{M}\p{N}]*/gu) || []);
}

function highlightCurrentSegment() {
  document.querySelectorAll('.textLayer span').forEach(span => {
    span.classList.remove('active-word');
    if (span.dataset.originalText != null) span.textContent = span.dataset.originalText;
  });
  if (currentIndex < 0 || !segments[currentIndex]) return;

  const segment = segments[currentIndex];
  const spans = Array.from(document.querySelectorAll('.textLayer span'));
  const flattened = [];

  spans.forEach(span => {
    if (span.dataset.originalText == null) span.dataset.originalText = span.textContent;
    const original = span.dataset.originalText;
    const matches = original.matchAll(/\p{L}[\p{L}\p{M}\p{N}]*/gu);
    for (const match of matches) {
      flattened.push({
        word: match[0].toLowerCase(),
        span,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });

  let searchFrom = 0;
  if (currentIndex > 0) {
    const previous = segments[currentIndex - 1];
    if (previous.matchEnd != null) searchFrom = previous.matchEnd;
  }

  let matchedStart = -1;
  let matchedEnd = -1;
  for (let i = searchFrom; i <= flattened.length - segment.words.length; i++) {
    const candidate = flattened.slice(i, i + segment.words.length).map(entry => entry.word);
    if (candidate.every((word, index) => word === segment.words[index])) {
      matchedStart = i;
      matchedEnd = i + segment.words.length;
      break;
    }
  }

  if (matchedStart >= 0) {
    segment.matchStart = matchedStart;
    segment.matchEnd = matchedEnd;
    const matchedEntries = flattened.slice(matchedStart, matchedEnd);
    const entriesBySpan = new Map();
    matchedEntries.forEach(entry => {
      if (!entriesBySpan.has(entry.span)) entriesBySpan.set(entry.span, []);
      entriesBySpan.get(entry.span).push(entry);
    });
    entriesBySpan.forEach((entries, span) => {
      span.classList.add('active-word');
      const original = span.dataset.originalText;
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      entries.sort((a, b) => a.start - b.start).forEach(entry => {
        fragment.append(document.createTextNode(original.slice(cursor, entry.start)));
        const mark = document.createElement('mark');
        mark.className = 'dictation-highlight';
        mark.textContent = original.slice(entry.start, entry.end);
        fragment.append(mark);
        cursor = entry.end;
      });
      fragment.append(document.createTextNode(original.slice(cursor)));
      span.replaceChildren(fragment);
    });
  }

  const activePage = document.querySelector('.textLayer span.active-word')?.closest('.pdf-page');
  activePage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateProgress() {
  const position = currentIndex < 0 ? 0 : currentIndex + 1;
  el.progressText.textContent = `${position} / ${segments.length}`;
  el.progressFill.style.width = `${segments.length ? position / segments.length * 100 : 0}%`;
  el.previousButton.disabled = currentIndex <= 0;
  el.nextButton.disabled = !segments.length || currentIndex >= segments.length - 1;
  el.resumeSection.disabled = !segments.length;
  el.resumeButton.disabled = !segments.length;
  if (segments.length) el.resumeSection.max = String(segments.length);
  el.startButton.querySelector('span').textContent = currentIndex >= 0 ? 'Restart dictation' : 'Start dictating';
}

function speakCurrent() {
  if (currentIndex < 0 || currentIndex >= segments.length) return;
  window.speechSynthesis.cancel();
  playbackPaused = false;
  updatePauseButton();
  const utterance = new SpeechSynthesisUtterance(speakPunctuation(segments[currentIndex].text));
  utterance.rate = readingRate;
  const selectedVoice = window.speechSynthesis
    .getVoices()
    .find(voice => voice.voiceURI === el.voiceSelect.value);
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.onstart = () => el.statusBadge.textContent = 'Speaking';
  utterance.onend = () => el.statusBadge.textContent = listening ? 'Listening' : 'Dictating';
  window.speechSynthesis.speak(utterance);
}

function startDictation() {
  currentIndex = 0;
  el.statusBadge.textContent = 'Dictating';
  updateProgress();
  highlightCurrentSegment();
  speakCurrent();
  if (recognition) startListening();
}

function nextSegment() {
  if (!segments.length) return;
  if (currentIndex < segments.length - 1) {
    currentIndex++;
    updateProgress();
    highlightCurrentSegment();
    speakCurrent();
  } else {
    window.speechSynthesis.cancel();
    el.statusBadge.textContent = 'Complete';
    toast('Dictation complete');
  }
}

function previousSegment() {
  if (currentIndex > 0) {
    currentIndex--;
    updateProgress();
    highlightCurrentSegment();
    speakCurrent();
  }
}

function speakPunctuation(text) {
  return text
    .replace(/\.{3}/g, ' ellipsis ')
    .replace(/\b([A-Z])\./g, '$1 ')
    .replace(/([.!?])(?=\s|$)/g, match => ({
      '.': ' period',
      '!': ' exclamation mark',
      '?': ' question mark',
    })[match])
    .replace(/,/g, ' comma')
    .replace(/;/g, ' semicolon')
    .replace(/:/g, ' colon')
    .replace(/—/g, ' em dash ')
    .replace(/\(/g, ' open parenthesis ')
    .replace(/\)/g, ' close parenthesis ')
    .replace(/"/g, ' quote ')
    .replace(/\s+/g, ' ')
    .trim();
}

function updatePauseButton() {
  el.pauseButton.classList.toggle('active', playbackPaused);
  el.pauseButton.setAttribute('aria-label', playbackPaused ? 'Resume dictation' : 'Pause dictation');
  el.pauseButton.title = playbackPaused ? 'Resume (Space)' : 'Pause (Space)';
  el.pauseButton.innerHTML = playbackPaused
    ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';
  if (playbackPaused) el.statusBadge.textContent = 'Paused';
}

function togglePause() {
  if (currentIndex < 0 || !segments.length) return;
  if (!playbackPaused && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    playbackPaused = true;
  } else if (playbackPaused) {
    window.speechSynthesis.resume();
    playbackPaused = false;
  }
  updatePauseButton();
  if (!playbackPaused && !window.speechSynthesis.speaking) speakCurrent();
}

function resumeAtSection() {
  if (!segments.length) return;
  const section = Math.min(segments.length, Math.max(1, Number(el.resumeSection.value) || 1));
  el.resumeSection.value = String(section);
  currentIndex = section - 1;
  playbackPaused = false;
  updateProgress();
  highlightCurrentSegment();
  speakCurrent();
  toast(`Resumed at section ${section}`);
}

function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    el.voiceButton.disabled = true;
    el.voiceHint.textContent = 'Use Chrome or Edge for voice control';
    el.voiceTitle.textContent = 'Browser unsupported';
    return;
  }
  if (!window.isSecureContext) {
    el.voiceHint.textContent = 'HTTPS or localhost is required';
  } else {
    el.voiceHint.textContent = 'Press to allow microphone';
  }
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 3;
  if ('processLocally' in recognition) {
    recognition.processLocally = true;
  }
  recognition.onstart = () => {
    listening = true;
    updateListeningUi();
  };
  recognition.onresult = event => {
    const result = event.results[event.results.length - 1];
    let transcript = '';
    for (let i = 0; i < result.length; i++) transcript += ` ${result[i].transcript}`;
    transcript = transcript.trim().toLowerCase();
    const now = Date.now();
    if (now - (recognition.lastCommandAt || 0) < 1200) return;
    if (/\b(next|continue|go forward|move forward)\b/.test(transcript)) nextSegment();
    else if (/\b(previous|back|go back|move back)\b/.test(transcript)) previousSegment();
    else if (/\b(repeat|again|say that again)\b/.test(transcript)) speakCurrent();
    else return;
    recognition.lastCommandAt = now;
  };
  recognition.onend = () => {
    if (listening) {
      window.setTimeout(() => {
        if (listening) {
          try { recognition.start(); } catch {}
        }
      }, 250);
    }
  };
  recognition.onerror = event => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      listening = false;
      updateListeningUi();
      toast('Microphone permission was denied');
      el.voiceHint.textContent = 'Allow microphone access, then try again';
    } else if (event.error === 'audio-capture') {
      listening = false;
      updateListeningUi();
      toast('No working microphone was found');
      el.voiceHint.textContent = 'Check your microphone';
    } else if (event.error === 'network') {
      listening = false;
      updateListeningUi();
      toast('On-device voice recognition is unavailable here. Use Chrome or the arrow keys.');
      el.voiceHint.textContent = 'Cloud blocked — use arrows or Chrome';
    } else if (event.error === 'no-speech') {
      el.voiceHint.textContent = 'Listening — say “next”';
    }
  };
}

function updateListeningUi() {
  el.voiceButton.classList.toggle('active', listening);
  el.voiceTitle.textContent = listening ? 'Listening…' : 'Start listening';
  el.voiceHint.textContent = listening ? 'Say “next” to continue' : 'Voice commands are off';
}

async function requestMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('Microphone access is unavailable in this browser');
    el.voiceHint.textContent = 'Use Chrome or Edge over HTTPS';
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    el.voiceHint.textContent = 'Microphone allowed';
    return true;
  } catch (error) {
    listening = false;
    updateListeningUi();
    el.voiceHint.textContent = 'Allow microphone access, then try again';
    toast(error.name === 'NotAllowedError'
      ? 'Microphone permission was denied'
      : 'Could not access your microphone');
    return false;
  }
}

function startListening() {
  if (!recognition) return;
  if (listening) return;
  requestMicrophonePermission().then(granted => {
    if (!granted) return;
    listening = true;
    updateListeningUi();
    try { recognition.start(); } catch {}
  });
}

function toggleListening() {
  if (!recognition) return;
  if (listening) {
    listening = false;
    try { recognition.stop(); } catch {}
    updateListeningUi();
  } else {
    startListening();
  }
}

el.fileInput.addEventListener('change', event => loadPdf(event.target.files[0]));
document.querySelector('#headerUpload').addEventListener('click', () => el.fileInput.click());
el.dropZone.addEventListener('dragover', event => { event.preventDefault(); el.dropZone.classList.add('dragging'); });
el.dropZone.addEventListener('dragleave', () => el.dropZone.classList.remove('dragging'));
el.dropZone.addEventListener('drop', event => { event.preventDefault(); el.dropZone.classList.remove('dragging'); loadPdf(event.dataTransfer.files[0]); });
el.startButton.addEventListener('click', startDictation);
el.nextButton.addEventListener('click', nextSegment);
el.previousButton.addEventListener('click', previousSegment);
el.repeatButton.addEventListener('click', speakCurrent);
el.voiceButton.addEventListener('click', toggleListening);
el.pauseButton.addEventListener('click', togglePause);
el.resumeButton.addEventListener('click', resumeAtSection);

function updateWordCount(nextValue) {
  const count = Math.min(20, Math.max(1, Number(nextValue) || 6));
  el.wordCountRange.value = String(count);
  el.wordCountValue.value = String(count);
  if (!extractedText) return;
  segments = splitIntoSegments(extractedText, count);
  currentIndex = -1;
  playbackPaused = false;
  window.speechSynthesis.cancel();
  updatePauseButton();
  updateProgress();
  document.querySelectorAll('.textLayer span').forEach(span => {
    span.classList.remove('active-word');
    if (span.dataset.originalText != null) span.textContent = span.dataset.originalText;
  });
  toast(`Each section now has ${count} word${count === 1 ? '' : 's'}`);
}

el.wordCountRange.addEventListener('input', event => updateWordCount(event.target.value));
el.wordCountValue.addEventListener('change', event => updateWordCount(event.target.value));

el.speedRange.addEventListener('input', event => {
  readingRate = Number(event.target.value);
  el.speedValue.textContent = `${readingRate.toFixed(1)}x`;
  localStorage.setItem('dictatorReadingRate', String(readingRate));
});

el.voiceSelect.addEventListener('change', () => {
  localStorage.setItem('dictatorVoice', el.voiceSelect.value);
  toast('Voice updated');
  if (currentIndex >= 0) speakCurrent();
});

function populateVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const selected = localStorage.getItem('dictatorVoice');
  const preferredNames = /(samantha|alex|ava|allison|susan|serena|victoria|daniel|karen|moira|tessa|rishi|aria|jenny|guy|sonia|zira|david|mark|google us english|google uk english|microsoft)/i;
  const curated = voices.filter(voice =>
    /^en[-_]/i.test(voice.lang) && preferredNames.test(`${voice.name} ${voice.voiceURI}`)
  );
  const sorted = (curated.length ? curated : voices.filter(voice => /^en[-_]/i.test(voice.lang))).sort((a, b) => {
    if (a.lang.startsWith('en') !== b.lang.startsWith('en')) return a.lang.startsWith('en') ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  el.voiceSelect.innerHTML = '';
  sorted.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} — ${voice.lang}${voice.localService ? '' : ' (network)'}`;
    el.voiceSelect.append(option);
  });
  el.voiceSelect.disabled = false;
  if (sorted.some(voice => voice.voiceURI === selected)) el.voiceSelect.value = selected;
  else {
    const preferred = sorted.find(voice => voice.lang.startsWith('en')) || sorted[0];
    el.voiceSelect.value = preferred.voiceURI;
  }
}

populateVoices();
window.speechSynthesis?.addEventListener?.('voiceschanged', populateVoices);

document.addEventListener('keydown', event => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable) return;
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextSegment();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    previousSegment();
  } else if (event.key.toLowerCase() === 'r') {
    event.preventDefault();
    speakCurrent();
  } else if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
});

document.querySelector('#zoomIn').addEventListener('click', async () => {
  if (!pdfDoc) return;
  zoom = Math.min(1.6, zoom + .1);
  el.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  await renderAllPages();
  highlightCurrentSegment();
});
document.querySelector('#zoomOut').addEventListener('click', async () => {
  if (!pdfDoc) return;
  zoom = Math.max(.6, zoom - .1);
  el.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  await renderAllPages();
  highlightCurrentSegment();
});
document.querySelector('#infoButton').addEventListener('click', () => document.querySelector('#modal').hidden = false);
document.querySelector('#modalClose').addEventListener('click', () => document.querySelector('#modal').hidden = true);
document.querySelector('#modal').addEventListener('click', event => { if (event.target.id === 'modal') event.target.hidden = true; });
window.addEventListener('beforeunload', () => { window.speechSynthesis.cancel(); if (recognition) recognition.stop(); });

setupVoiceRecognition();
