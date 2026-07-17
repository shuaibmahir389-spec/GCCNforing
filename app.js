/* ==========================================
   GCCNফড়িং Application Logic
   Features: State, CRUD, Theme, Search, Live Timeline & LocalStorage
   ========================================== */

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  projectId: "mahadi-8dda1",
  appId: "1:327561682151:web:0d389b933f505b2b589642",
  storageBucket: "mahadi-8dda1.firebasestorage.app",
  apiKey: "AIzaSyCH2S8kkd5n6Vox8pkKcsS9VEGQ2djhol0",
  authDomain: "mahadi-8dda1.firebaseapp.com",
  messagingSenderId: "327561682151"
};

// Safely check if Firebase is loaded
let firebaseAvailable = false;
try {
  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.initializeApp(firebaseConfig);
    firebaseAvailable = true;
  }
} catch (e) {
  console.warn("Firebase initialization failed:", e);
}


// --- INITIAL MOCK DATA ---
const DEFAULT_PDFS = [];

const DEFAULT_NOTICES = [];

const DEFAULT_SUBJECTS = [
  { key: "fundamentals", name: "Fundamentals of Nursing" },
  { key: "nutrition", name: "Nutrition" },
  { key: "orthopedic", name: "Orthopedic" },
  { key: "pediatric", name: "Pediatric Nursing" },
  { key: "medsurg", name: "Medical & Surgical Nursing" },
  { key: "pharmacology", name: "Pharmacology" }
];

const DEFAULT_ROUTINE = [];

function getDefaultExercisesForBmi(category) {
  switch(category) {
    case 'Underweight':
      return [
        { id: 'uw-1', day: 'Saturday', name: 'Barbell Squats (3 sets x 8 reps)', completed: false },
        { id: 'uw-2', day: 'Saturday', name: 'Leg Press machine (3 sets x 10 reps)', completed: false },
        { id: 'uw-3', day: 'Monday', name: 'Dumbbell Bench Press (3 sets x 10 reps)', completed: false },
        { id: 'uw-4', day: 'Monday', name: 'Overhead Press (3 sets x 8 reps)', completed: false },
        { id: 'uw-5', day: 'Wednesday', name: 'Dumbbell Rows (3 sets x 10 reps)', completed: false },
        { id: 'uw-6', day: 'Wednesday', name: 'Bicep Curls (3 sets x 12 reps)', completed: false },
        { id: 'uw-7', day: 'Thursday', name: 'Plank Hold (3 sets x 45 sec)', completed: false }
      ];
    case 'Overweight':
      return [
        { id: 'ow-1', day: 'Saturday', name: 'Burpees (3 sets x 12 reps)', completed: false },
        { id: 'ow-2', day: 'Saturday', name: 'Jump Squats (3 sets x 12 reps)', completed: false },
        { id: 'ow-3', day: 'Monday', name: 'Mountain Climbers (3 sets x 30 sec)', completed: false },
        { id: 'ow-4', day: 'Monday', name: 'Plank Hold (3 sets x 45 sec)', completed: false },
        { id: 'ow-5', day: 'Wednesday', name: 'High Knees running (3 sets x 40 sec)', completed: false },
        { id: 'ow-6', day: 'Wednesday', name: 'Brisk Walk (30 mins)', completed: false }
      ];
    case 'Obese':
      return [
        { id: 'ob-1', day: 'Saturday', name: 'Wall Push-ups (3 sets x 12 reps)', completed: false },
        { id: 'ob-2', day: 'Saturday', name: 'Glute Bridges (3 sets x 12 reps)', completed: false },
        { id: 'ob-3', day: 'Monday', name: 'Bodyweight Squats (3 sets x 10 reps)', completed: false },
        { id: 'ob-4', day: 'Monday', name: 'Incline Plank (3 sets x 30 sec)', completed: false },
        { id: 'ob-5', day: 'Wednesday', name: 'Lying Leg Raises (3 sets x 10 reps)', completed: false },
        { id: 'ob-6', day: 'Wednesday', name: 'Standing March (10 mins)', completed: false }
      ];
    case 'Normal':
    default:
      return [
        { id: 'n-1', day: 'Saturday', name: 'Push-ups (3 sets x 15 reps)', completed: false },
        { id: 'n-2', day: 'Saturday', name: 'Bodyweight Squats (3 sets x 20 reps)', completed: false },
        { id: 'n-3', day: 'Monday', name: 'Pull-ups or Chin-ups (3 sets x 6 reps)', completed: false },
        { id: 'n-4', day: 'Monday', name: 'Plank Hold (3 sets x 60 sec)', completed: false },
        { id: 'n-5', day: 'Wednesday', name: 'Dumbbell Lunges (3 sets x 12 reps)', completed: false },
        { id: 'n-6', day: 'Wednesday', name: 'Moderate Jogging (20 mins)', completed: false }
      ];
  }
}

const DEFAULT_WORKOUTS = [
  { id: "w1", day: "Saturday", name: "Chest & Triceps Focus", setsReps: "3 Sets x 10 Reps", completed: false },
  { id: "w2", day: "Monday", name: "Back & Biceps Pulls", setsReps: "3 Sets x 12 Reps", completed: false },
  { id: "w3", day: "Wednesday", name: "Shoulders & Core Press", setsReps: "3 Sets x 10 Reps", completed: false }
];

const DEFAULT_EXPENSES = [];

const DEFAULT_EXPENSE_HISTORY = [];

// --- LOAD VARIABLE PREFIX FUNCTION ---
function loadPrefixVariables() {
  const dbPrefix = state.isAdmin ? "edu_admin_" : "edu_user_";
  
  state.workoutRoutine = JSON.parse(localStorage.getItem(dbPrefix + "workout_routine")) || getDefaultExercisesForBmi("Normal");
  state.selectedWorkoutDay = localStorage.getItem(dbPrefix + "selected_workout_day") || null;
  state.selectedExpenseMonthFilter = localStorage.getItem(dbPrefix + "selected_expense_month_filter") || "all";
  state.viewingMonth = localStorage.getItem(dbPrefix + "viewing_month") || "active";
  
  state.expenses = JSON.parse(localStorage.getItem(dbPrefix + "expenses")) || (state.isAdmin ? DEFAULT_EXPENSES : []);
  
  state.pocketMoney = (function() {
    const history = JSON.parse(localStorage.getItem(dbPrefix + "pocket_money_history")) || [];
    if (history.length === 0) return 0;
    return localStorage.getItem(dbPrefix + "pocket_money") !== null ? Number(localStorage.getItem(dbPrefix + "pocket_money")) : 0;
  })();
  
  state.expenseHistory = (function() {
    const raw = localStorage.getItem(dbPrefix + "expense_history");
    if (!raw) return state.isAdmin ? DEFAULT_EXPENSE_HISTORY : [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
    return state.isAdmin ? DEFAULT_EXPENSE_HISTORY : [];
  })();
  
  state.pocketMoneyHistory = JSON.parse(localStorage.getItem(dbPrefix + "pocket_money_history")) || [];

  // Automatically clean up unwanted mock history logs and mock expenses from local storage
  state.expenseHistory = (state.expenseHistory || []).filter(h => h.id !== "hist-mock-june" && h.id !== "hist-mock-may");
  state.expenses = (state.expenses || []).filter(e => e.id !== "exp1" && e.id !== "exp2" && e.id !== "exp3" && e.id !== "exp4");
  saveState();
}

// --- APP STATE ---
let state = {
  pdfs: JSON.parse(localStorage.getItem("edu_pdfs")) || DEFAULT_PDFS,
  subjects: JSON.parse(localStorage.getItem("edu_subjects")) || DEFAULT_SUBJECTS,
  notices: JSON.parse(localStorage.getItem("edu_notices")) || DEFAULT_NOTICES,
  routine: JSON.parse(localStorage.getItem("edu_routine")) || DEFAULT_ROUTINE,
  favorites: JSON.parse(localStorage.getItem("edu_favorites")) || ["pdf-1", "pdf-4"],
  customRoutine: localStorage.getItem("edu_custom_routine") || null,
  customRoutineMeta: JSON.parse(localStorage.getItem("edu_custom_routine_meta")) || null,
  routineViewMode: localStorage.getItem("edu_routine_view_mode") || "grid",
  waterIntake: Number(localStorage.getItem("edu_water_intake")) || 0,
  currentTab: "dashboard",
  theme: localStorage.getItem("edu_theme") || "dark",
  workoutWeight: Number(localStorage.getItem("edu_workout_weight")) || 70,
  workoutHeight: Number(localStorage.getItem("edu_workout_height")) || 170,
  workoutCalorieIntake: Number(localStorage.getItem("edu_workout_calories")) || 2000,
  workoutGoal: localStorage.getItem("edu_workout_goal") || "gain",
  adminAvatar: localStorage.getItem("edu_admin_avatar") || null,
  isAdmin: false,
  user: null,
  filters: {
    pdfSubject: "fundamentals",
    noticeCategory: "all",
    searchQuery: ""
  }
};

// Initialize prefix variables
loadPrefixVariables();

// --- DOM ELEMENTS ---
const elements = {
  themeToggle: document.getElementById("theme-toggle-btn"),
  themeText: document.getElementById("theme-text"),
  adminLogoutBtn: document.getElementById("admin-logout-btn"),
  firebaseAuthForm: document.getElementById("firebase-auth-form"),
  googleLoginBtn: document.getElementById("google-login-btn"),
  loginToggleModeBtn: document.getElementById("login-toggle-mode-btn"),
  navButtons: document.querySelectorAll(".nav-btn"),
  tabContents: document.querySelectorAll(".tab-content"),
  pageTitle: document.getElementById("page-title"),
  liveDate: document.getElementById("live-date"),
  globalSearch: document.getElementById("global-search"),
  
  // Dashboard Widget lists
  statsPdfs: document.getElementById("stats-pdfs"),
  statsClasses: document.getElementById("stats-classes"),
  timelineList: document.getElementById("timeline-list"),
  liveStatus: document.getElementById("live-status"),
  recentNoticesList: document.getElementById("recent-notices-list"),
  recentFavoritesList: document.getElementById("recent-favorites-list"),
  workoutWidget: document.getElementById("workout-widget"),
  
  // Monthly Expenses Elements
  pocketMoneyInput: document.getElementById("exp-pocket-money"),
  saveHistoryBtn: document.getElementById("save-month-history-btn"),
  saveHistoryModal: document.getElementById("save-history-modal"),
  saveHistoryForm: document.getElementById("save-history-form"),
  expenseHistoryList: document.getElementById("expense-history-list"),
  
  // PDF Tab Elements
  pdfStoreGrid: document.getElementById("pdf-store-grid"),
  pdfSubjectFilters: document.getElementById("pdf-subject-filters"),
  pdfSubjectDropdown: document.getElementById("pdf-subject"),
  customSubjectGroup: document.getElementById("custom-subject-group"),
  customSubjectName: document.getElementById("custom-subject-name"),
  uploadPdfTrigger: document.getElementById("upload-pdf-trigger"),
  addPdfModal: document.getElementById("add-pdf-modal"),
  addPdfForm: document.getElementById("add-pdf-form"),
  fileDropZone: document.getElementById("file-drop-zone"),
  pdfFileInputRaw: document.getElementById("pdf-file-raw"),
  fileUploadStatus: document.getElementById("file-upload-status"),
  
  // Notices Tab Elements
  noticesMasterList: document.getElementById("notices-master-list"),
  noticeCategoryTabs: document.querySelectorAll(".cat-tab"),
  markAllReadBtn: document.getElementById("mark-all-read-btn"),
  noticeBadge: document.getElementById("notice-badge"),
  addNoticeTrigger: document.getElementById("add-notice-trigger"),
  addNoticeModal: document.getElementById("add-notice-modal"),
  addNoticeForm: document.getElementById("add-notice-form"),
  
  // Class Routine Tab Elements
  timetableBody: document.getElementById("timetable-body"),
  addClassTrigger: document.getElementById("add-class-trigger"),
  addClassModal: document.getElementById("add-class-modal"),
  addClassForm: document.getElementById("add-class-form"),
  classModalTitle: document.getElementById("class-modal-title"),
  editClassId: document.getElementById("edit-class-id"),
  deleteClassBtn: document.getElementById("delete-class-btn"),
  
  // Custom Routine File Elements
  routineGridPane: document.getElementById("routine-grid-pane"),
  routineCustomPane: document.getElementById("routine-custom-pane"),
  routineToggleBtns: document.querySelectorAll(".toggle-view-btn"),
  routineUploadZone: document.getElementById("routine-upload-zone"),
  routineDisplayZone: document.getElementById("routine-display-zone"),
  routineEmptyGuestPlaceholder: document.getElementById("routine-empty-guest-placeholder"),
  routineFileInput: document.getElementById("routine-file-input"),
  routineFileBrowseBtn: document.getElementById("routine-file-browse-btn"),
  routineFileName: document.getElementById("routine-file-name"),
  routineFileMeta: document.getElementById("routine-file-meta"),
  routineResetBtn: document.getElementById("routine-reset-btn"),
  routineDwnBtn: document.getElementById("routine-dwn-btn"),
  routineImgViewer: document.getElementById("routine-img-viewer"),
  routineImgElement: document.getElementById("routine-img-element"),
  routinePdfViewer: document.getElementById("routine-pdf-viewer"),
  routinePdfIframe: document.getElementById("routine-pdf-iframe"),
  routineImgViewport: document.getElementById("routine-img-viewport"),
  zoomInBtn: document.getElementById("zoom-in-btn"),
  zoomOutBtn: document.getElementById("zoom-out-btn"),
  zoomResetBtn: document.getElementById("zoom-reset-btn"),
  
  // Document View Modal
  pdfViewModal: document.getElementById("pdf-view-modal"),
  pdfViewTitle: document.getElementById("pdf-view-title"),
  pdfViewSubject: document.getElementById("pdf-view-subject"),
  pdfViewDesc: document.getElementById("pdf-view-desc"),
  pdfDownloadBtn: document.getElementById("pdf-download-btn"),
  pdfFavoriteToggleBtn: document.getElementById("pdf-favorite-toggle-btn"),
  pdfIframePreview: document.getElementById("pdf-iframe-preview"),
  pdfIframePlaceholder: document.getElementById("pdf-iframe-placeholder"),
  previewOpenExternal: document.getElementById("preview-open-external"),
  
  // Toast container
  toastHub: document.getElementById("toast-hub"),
  
  // Close modals
  closeModalBtns: document.querySelectorAll(".close-modal-btn, .close-modal-action-btn")
};

// --- INITIALIZATION ---
function init() {
  // Clear any past sync failure flags to retry connecting on load
  localStorage.removeItem("edu_sync_failed");

  // Instant UI Hydration from local session cache
  const loggedInCache = localStorage.getItem("edu_logged_in") === "true";
  const loginScreen = document.getElementById("login-screen");
  const appContainer = document.getElementById("app-container");
  
  if (loggedInCache) {
    if (loginScreen) loginScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";
    
    // Restore cached session details
    state.user = { email: localStorage.getItem("edu_user_email") || "" };
    state.isAdmin = (state.user.email === "shahalam8052020@gmail.com");
    loadPrefixVariables();
  }

  // If the stored PDFs/Routine are from the old template (math etc.), clear and reload them to reflect nursing subjects
  const isOldTemplate = state.pdfs.some(p => p.subject === "math" || p.subject === "physics");
  if (isOldTemplate) {
    state.pdfs = DEFAULT_PDFS;
    state.routine = DEFAULT_ROUTINE;
    state.notices = DEFAULT_NOTICES;
    state.favorites = [];
    saveState();
  }

  applyTheme(state.theme);
  setupEvents();
  updateLiveDateTime();
  startBanglaWatch();
  render();
  
  // Quran Ayat quote initialization
  rotateQuranAyat();
  setInterval(rotateQuranAyat, 18000);

  // Hydration tracker initialization
  updateWaterReminder();
  
  // Set up timer for live status updates every minute
  setInterval(() => {
    updateLiveDateTime();
    updateLiveRoutineTimeline();
  }, 60000);

  if (!firebaseAvailable) {
    console.warn("Firebase Auth SDK is not available. Bypassing auth gate.");
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.getElementById("app-container");
    if (loginScreen) loginScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";
    
    // Default to admin mode for local testing/offline use
    state.isAdmin = true;
    applyAdminControls();
    render();
    
    setTimeout(() => {
      showToast("Offline Mode: Firebase was blocked or not found. Accessing locally.", "warning");
    }, 1000);
    
    // Initialize PWA install prompt handler
    setupPwaInstall();
    return;
  }

  // Handle Google redirect sign-in result
  firebase.auth().getRedirectResult()
    .then((result) => {
      if (result.user) {
        localStorage.setItem("edu_logged_in", "true");
        localStorage.setItem("edu_user_email", result.user.email);
        
        state.user = result.user;
        state.isAdmin = (result.user.email === "shahalam8052020@gmail.com");
        loadPrefixVariables();
        
        const loginScreen = document.getElementById("login-screen");
        const appContainer = document.getElementById("app-container");
        if (loginScreen) loginScreen.style.display = "none";
        if (appContainer) appContainer.style.display = "flex";
        
        applyAdminControls();
        render();
        showToast("Authenticated with Google successfully!", "success");
      }
    })
    .catch((error) => {
      console.error("Google Redirect Auth error:", error);
      showToast(error.message, "danger");
    });

  // Firebase Auth State Observer
  firebase.auth().onAuthStateChanged((user) => {
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.getElementById("app-container");
    
    if (user) {
      // Set session cache keys
      localStorage.setItem("edu_logged_in", "true");
      localStorage.setItem("edu_user_email", user.email);

      // User is signed in
      state.user = user;
      state.isAdmin = (user.email === "shahalam8052020@gmail.com");
      
      // Load user/admin specific variables
      loadPrefixVariables();
      
      // Update UI displays
      if (loginScreen) loginScreen.style.display = "none";
      if (appContainer) appContainer.style.display = "flex";
      
      // Update profile info dynamically
      const userNames = document.querySelectorAll(".user-name");
      const userRoles = document.querySelectorAll(".user-role");
      const userEmails = document.querySelectorAll(".user-email");
      
      const displayName = user.displayName || (user.email === "shahalam8052020@gmail.com" ? "Mahadi" : user.email.split("@")[0]);
      const roleText = user.email === "shahalam8052020@gmail.com" ? "Basic BSc in Nursing (Owner)" : "Basic BSc in Nursing (Student)";
      
      userNames.forEach(el => el.textContent = displayName);
      userRoles.forEach(el => el.textContent = roleText);
      userEmails.forEach(el => {
        el.textContent = user.email;
        el.href = `mailto:${user.email}`;
      });

      // Render components
      applyAdminControls();
      render();
      
      // Force initial fetch
      syncFromCloud();
    } else {
      // Clear session cache keys
      localStorage.removeItem("edu_logged_in");
      localStorage.removeItem("edu_user_email");

      // User is signed out
      state.user = null;
      state.isAdmin = false;
      
      if (loginScreen) loginScreen.style.display = "flex";
      if (appContainer) appContainer.style.display = "none";
    }
  });

  // Poll for live database updates from ExtendsClass cloud bin every 10 seconds (skip if admin is logged in)
  setInterval(() => {
    if (state.user && !state.isAdmin) {
      syncFromCloud();
    }
  }, 10000);

  // Initialize PWA install prompt handler
  setupPwaInstall();
}

// --- CLOUD SYNCHRONIZATION HELPER ---
const READ_URLS = {
  pdfs: "https://extendsclass.com/api/json-storage/bin/acbabfb",
  routine: "https://extendsclass.com/api/json-storage/bin/eabbdff",
  notices: "https://extendsclass.com/api/json-storage/bin/dffaaee"
};

const WRITE_URLS = {
  pdfs: "/api/sync?key=pdfs",
  routine: "/api/sync?key=routine",
  notices: "/api/sync?key=notices"
};

let isCloudSyncing = false;

async function syncFromCloud() {
  if (isCloudSyncing) return;
  try {
    const [pdfsRes, routineRes, noticesRes] = await Promise.all([
      fetch(READ_URLS.pdfs).then(r => r.ok ? r.json() : null),
      fetch(READ_URLS.routine).then(r => r.ok ? r.json() : null),
      fetch(READ_URLS.notices).then(r => r.ok ? r.json() : null)
    ]);

    let changed = false;
    
    if (pdfsRes && Array.isArray(pdfsRes)) {
      // Merge with local Base64 data URLs to preserve uploaded files on this device
      const mergedPdfs = pdfsRes.map(freshPdf => {
        const localPdf = state.pdfs.find(p => p.id === freshPdf.id);
        if (localPdf && localPdf.link && (localPdf.link.startsWith("data:") || localPdf.link.startsWith("blob:"))) {
          return { ...freshPdf, link: localPdf.link };
        }
        return freshPdf;
      });

      const freshStr = JSON.stringify(mergedPdfs);
      if (freshStr !== JSON.stringify(state.pdfs)) {
        state.pdfs = mergedPdfs;
        localStorage.setItem("edu_pdfs", freshStr);
        changed = true;
      }
    }
    if (routineRes && Array.isArray(routineRes)) {
      const freshStr = JSON.stringify(routineRes);
      if (freshStr !== JSON.stringify(state.routine)) {
        state.routine = routineRes;
        localStorage.setItem("edu_routine", freshStr);
        changed = true;
      }
    }
    if (noticesRes && Array.isArray(noticesRes)) {
      const freshStr = JSON.stringify(noticesRes);
      if (freshStr !== JSON.stringify(state.notices)) {
        state.notices = noticesRes;
        localStorage.setItem("edu_notices", freshStr);
        changed = true;
      }
    }

    if (changed) {
      render();
      if (!state.isAdmin) {
        showToast("Study PDFs, schedules, or notices updated live!", "info");
      }
    }
  } catch (error) {
    console.error("Cloud sync failed:", error);
  }
}

async function syncToCloud(key, data) {
  isCloudSyncing = true;
  try {
    let cleanData = data;
    if (key === "pdfs" && Array.isArray(data)) {
      cleanData = data.map(p => {
        if (p.link && (p.link.startsWith("data:") || p.link.startsWith("blob:"))) {
          return { ...p, link: "" };
        }
        return p;
      });
    }

    const response = await fetch(WRITE_URLS[key], {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cleanData)
    });
    if (response.status === 404 || !response.ok) {
      localStorage.setItem("edu_sync_failed", "true");
      showToast("Sync Server Offline! Changes are saved locally, but cannot sync to other devices.", "warning");
      throw new Error(`Sync write failed with status ${response.status}`);
    } else {
      localStorage.removeItem("edu_sync_failed");
    }
  } catch (error) {
    console.error(`Failed to push ${key} to cloud:`, error);
    localStorage.setItem("edu_sync_failed", "true");
    throw error;
  } finally {
    isCloudSyncing = false;
  }
}

// --- STATE STORAGE HELPER ---
async function saveState() {
  localStorage.setItem("edu_pdfs", JSON.stringify(state.pdfs));
  localStorage.setItem("edu_subjects", JSON.stringify(state.subjects));
  localStorage.setItem("edu_notices", JSON.stringify(state.notices));
  localStorage.setItem("edu_routine", JSON.stringify(state.routine));
  localStorage.setItem("edu_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("edu_theme", state.theme);
  if (state.customRoutine) {
    localStorage.setItem("edu_custom_routine", state.customRoutine);
  } else {
    localStorage.removeItem("edu_custom_routine");
  }
  localStorage.setItem("edu_custom_routine_meta", JSON.stringify(state.customRoutineMeta));
  localStorage.setItem("edu_routine_view_mode", state.routineViewMode);
  localStorage.setItem("edu_water_intake", state.waterIntake);
  
  localStorage.setItem("edu_workout_weight", state.workoutWeight);
  localStorage.setItem("edu_workout_height", state.workoutHeight);
  localStorage.setItem("edu_workout_calories", state.workoutCalorieIntake);
  localStorage.setItem("edu_workout_goal", state.workoutGoal);
  const dbPrefix = state.isAdmin ? "edu_admin_" : "edu_user_";
  localStorage.setItem(dbPrefix + "workout_routine", JSON.stringify(state.workoutRoutine));
  localStorage.setItem(dbPrefix + "selected_workout_day", state.selectedWorkoutDay || '');
  localStorage.setItem(dbPrefix + "selected_expense_month_filter", state.selectedExpenseMonthFilter || 'all');
  localStorage.setItem(dbPrefix + "viewing_month", state.viewingMonth || 'active');
  localStorage.setItem("edu_admin_avatar", state.adminAvatar || '');
  localStorage.setItem("edu_is_admin", state.isAdmin);
  localStorage.setItem(dbPrefix + "expenses", JSON.stringify(state.expenses));
  localStorage.setItem(dbPrefix + "pocket_money", state.pocketMoney);
  localStorage.setItem(dbPrefix + "expense_history", JSON.stringify(state.expenseHistory));
  localStorage.setItem(dbPrefix + "pocket_money_history", JSON.stringify(state.pocketMoneyHistory));

  // Push updates to cloud storage database if admin is modifying contents
  if (state.isAdmin) {
    try {
      await Promise.all([
        syncToCloud("pdfs", state.pdfs),
        syncToCloud("routine", state.routine),
        syncToCloud("notices", state.notices)
      ]);
    } catch (err) {
      console.error("Cloud sync failed in saveState:", err);
      throw err;
    }
  }
}

// --- DYNAMIC ADMIN CONTROLS APPLICATOR ---
function applyAdminControls() {
  const uploadPdfTrigger = document.getElementById("upload-pdf-trigger");
  const addNoticeTrigger = document.getElementById("add-notice-trigger");
  const addClassTrigger = document.getElementById("add-class-trigger");
  const routineUploadZone = document.getElementById("routine-upload-zone");
  const routineResetBtn = document.getElementById("routine-reset-btn");
  
  const adminLogoutBtn = document.getElementById("admin-logout-btn");

  const expensesLockPane = document.getElementById("expenses-lock-pane");
  const expensesAdminPane = document.getElementById("expenses-admin-pane");

  const isAdmin = state.isAdmin;

  if (isAdmin) {
    if (uploadPdfTrigger) uploadPdfTrigger.style.display = "flex";
    if (addNoticeTrigger) addNoticeTrigger.style.display = "flex";
    if (addClassTrigger) addClassTrigger.style.display = "flex";
    if (routineUploadZone) routineUploadZone.style.display = "flex";
    if (routineResetBtn) routineResetBtn.style.display = "flex";

    if (expensesLockPane) expensesLockPane.style.display = "none";
    if (expensesAdminPane) expensesAdminPane.style.display = "flex";
  } else {
    if (uploadPdfTrigger) uploadPdfTrigger.style.display = "none";
    if (addNoticeTrigger) addNoticeTrigger.style.display = "none";
    if (addClassTrigger) addClassTrigger.style.display = "none";
    if (routineUploadZone) routineUploadZone.style.display = "none";
    if (routineResetBtn) routineResetBtn.style.display = "none";

    if (expensesLockPane) expensesLockPane.style.display = "flex";
    if (expensesAdminPane) expensesAdminPane.style.display = "none";
  }

  // Sign out button is always visible when signed in
  if (adminLogoutBtn) adminLogoutBtn.style.display = "flex";

  // Update profile avatar images across sidebar and mobile menu drawer
  const avatarSrc = state.adminAvatar || 'profile.jpg';
  const sidebarAvatar = document.getElementById("sidebar-avatar-img");
  const mobileDrawerAvatar = document.getElementById("mobile-drawer-avatar-img");
  if (sidebarAvatar) sidebarAvatar.src = avatarSrc;
  if (mobileDrawerAvatar) mobileDrawerAvatar.src = avatarSrc;

  // Show/Hide camera upload label based on admin lock status
  const avatarUploadLabel = document.getElementById("avatar-upload-label");
  if (avatarUploadLabel) {
    avatarUploadLabel.style.display = isAdmin ? "flex" : "none";
  }
}

// --- RENDERING ROUTINES ---
function render() {
  applyAdminControls();
  updateStats();
  renderActiveTab();
  updateNoticeBadge();

  if (state.currentTab === "dashboard") {
    updateLiveRoutineTimeline();
    renderRecentNotices();
    renderRecentFavorites();
    updateWaterReminder();
    renderWorkoutWidget();
  } else if (state.currentTab === "pdf-store") {
    renderPdfSubjectFilters();
    renderPdfGallery();
  } else if (state.currentTab === "notices") {
    renderNoticesList();
  } else if (state.currentTab === "routine") {
    renderTimetableGrid();
    renderCustomRoutine();
  } else if (state.currentTab === "expenses") {
    renderExpenses();
  }
}

// --- RENDER DYNAMIC DASHBOARD ELEMENTS ---
function updateStats() {
  if (elements.statsPdfs) {
    elements.statsPdfs.textContent = state.favorites.length;
  }
  
  // Count classes scheduled for today
  if (elements.statsClasses) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];
    const classesToday = state.routine.filter(c => c.day === todayName).length;
    elements.statsClasses.textContent = classesToday;
  }
}

function updateLiveDateTime() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  elements.liveDate.textContent = today.toLocaleDateString('en-US', options);
}

function startBanglaWatch() {
  const watchEl = document.getElementById("bangla-digital-watch");
  if (!watchEl) return;
  function tick() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    watchEl.textContent = `${hours}:${minutes}:${seconds}`;
  }
  tick();
  setInterval(tick, 1000);
}

function updateLiveRoutineTimeline() {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const todayName = daysOfWeek[now.getDay()];
  
  // Filter and sort today's classes
  const todaysClasses = state.routine
    .filter(c => c.day === todayName)
    .sort((a, b) => a.start.localeCompare(b.start));
    
  if (todaysClasses.length === 0) {
    elements.liveStatus.textContent = "No classes scheduled today";
    elements.liveStatus.className = "status-indicator";
    elements.timelineList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 6-6"/>
        </svg>
        <p>No classes scheduled for today! Time to relax or do some self-study.</p>
      </div>
    `;
    return;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let liveClassFound = false;
  let nextClass = null;

  const html = todaysClasses.map(c => {
    const [sHour, sMin] = c.start.split(":").map(Number);
    const [eHour, eMin] = c.end.split(":").map(Number);
    const startMinutes = sHour * 60 + sMin;
    const endMinutes = eHour * 60 + eMin;
    
    let stateClass = "";
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      stateClass = "active";
      liveClassFound = true;
    } else if (currentMinutes > endMinutes) {
      stateClass = "passed";
    } else if (currentMinutes < startMinutes && !nextClass) {
      nextClass = c;
    }
    
    return `
      <div class="timeline-item ${stateClass}" onclick="switchTab('routine')">
        <div class="timeline-item-left">
          <span class="timeline-time">${c.start} - ${c.end}</span>
          <span class="timeline-name">${escapeHtml(c.name)}</span>
          <span class="timeline-meta">${escapeHtml(c.teacher || 'N/A')}</span>
        </div>
        <div class="timeline-item-right">
          <span class="room-badge">${escapeHtml(c.room || 'N/A')}</span>
        </div>
      </div>
    `;
  }).join("");

  elements.timelineList.innerHTML = html;

  if (liveClassFound) {
    elements.liveStatus.textContent = "Class in session";
    elements.liveStatus.className = "status-indicator live";
  } else if (nextClass) {
    elements.liveStatus.textContent = `Next up: ${nextClass.name} at ${nextClass.start}`;
    elements.liveStatus.className = "status-indicator";
  } else {
    elements.liveStatus.textContent = "Classes done for today";
    elements.liveStatus.className = "status-indicator";
  }
}

function renderRecentNotices() {
  const unreadNotices = state.notices.filter(n => !n.isRead).slice(0, 3);
  const noticesToRender = unreadNotices.length > 0 ? unreadNotices : state.notices.slice(0, 3);

  if (noticesToRender.length === 0) {
    elements.recentNoticesList.innerHTML = "<p class='empty-state'>No announcements posted</p>";
    return;
  }

  elements.recentNoticesList.innerHTML = noticesToRender.map(n => `
    <div class="widget-notice-item" onclick="openNoticeFromWidget('${n.id}')">
      <div class="widget-notice-header">
        <span class="widget-notice-tag" style="color: ${getCategoryColor(n.category)}">${n.category}</span>
        <span class="widget-notice-date">${n.date}</span>
      </div>
      <div class="widget-notice-title">${escapeHtml(n.title)}</div>
    </div>
  `).join("");
}

function renderRecentFavorites() {
  const favPdfs = state.pdfs.filter(p => state.favorites.includes(p.id));

  if (favPdfs.length === 0) {
    elements.recentFavoritesList.innerHTML = `
      <div class="empty-state" style="width: 100%;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        <p>No bookmarked study files. Tap on standard PDF card hearts to add.</p>
      </div>
    `;
    return;
  }

  elements.recentFavoritesList.innerHTML = favPdfs.map(p => `
    <div class="pdf-fav-card" onclick="openPdfViewer(event, '${p.id}')">
      <div class="pdf-fav-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div>
        <div class="pdf-fav-title">${escapeHtml(p.title)}</div>
        <div class="pdf-fav-subject">${p.subject}</div>
      </div>
    </div>
  `).join("");
}

// --- RENDER PDF STOREHOUSE ---
function renderPdfGallery() {
  let filtered = state.pdfs;

  // Filter subject
  if (state.filters.pdfSubject !== "all") {
    filtered = filtered.filter(p => p.subject === state.filters.pdfSubject);
  }

  // Filter global search query
  if (state.filters.searchQuery) {
    const q = state.filters.searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    elements.pdfStoreGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No study PDFs found matching your selection.</p>
      </div>
    `;
    return;
  }

  elements.pdfStoreGrid.innerHTML = filtered.map(p => {
    const isFav = state.favorites.includes(p.id);
    return `
      <div class="pdf-card" onclick="openPdfViewer(event, '${p.id}')">
        <div class="pdf-card-thumbnail">
          <div class="pdf-cover-page" id="thumb-cover-${p.id}">
            <div class="pdf-cover-glow"></div>
            <svg class="pdf-cover-flower" viewBox="0 0 100 100">
              <path d="M50,20 C55,35 65,35 70,40 C75,45 75,55 70,60 C65,65 55,65 50,80 C45,65 35,65 30,60 C25,55 25,45 30,40 C35,35 45,35 50,20 Z" fill="none" stroke="var(--color-primary)" stroke-width="1.5" opacity="0.35" />
              <circle cx="50" cy="50" r="5" fill="var(--color-primary-light)" />
            </svg>
            <div class="pdf-cover-text">
              <span class="pdf-cover-title">${escapeHtml(p.title)}</span>
              <span class="pdf-cover-subject">${escapeHtml(p.subject.toUpperCase())}</span>
            </div>
            <div class="pdf-cover-badge">STUDY NOTES</div>
          </div>
        </div>
        <div class="pdf-card-header">
          <span class="pdf-card-badge ${p.subject}">${escapeHtml(p.subject)}</span>
          <div class="pdf-header-controls" style="display: flex; gap: 8px; align-items: center;">
            <button class="bookmark-btn ${isFav ? 'bookmarked' : ''}" onclick="toggleFavorite(event, '${p.id}')" aria-label="Toggle favorite">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            ${state.isAdmin ? `
            <div class="pdf-menu-container">
              <button class="pdf-menu-trigger" aria-label="More options">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="dots-icon" style="width: 14px; height: 14px; display: block;">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              <div class="pdf-dropdown-menu">
                <button class="dropdown-item delete-pdf-btn" data-id="${p.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="item-icon danger-icon" style="width:14px; height:14px; color:var(--danger-color); margin-right:8px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Delete Notes</span>
                </button>
                <div class="dropdown-submenu-trigger">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="item-icon" style="width:14px; height:14px; margin-right:8px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  <span>Move Section</span>
                  <div class="dropdown-submenu">
                    ${state.subjects.map(sub => `
                      <button class="submenu-item move-pdf-btn" data-id="${p.id}" data-target="${sub.key}">${escapeHtml(sub.name)}</button>
                    `).join("")}
                  </div>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="pdf-card-body">
          <h4 class="pdf-card-title">${escapeHtml(p.title)}</h4>
          <p class="pdf-card-desc">${escapeHtml(p.description)}</p>
        </div>
        <div class="pdf-card-footer">
          <span class="pdf-file-size">${p.size || 'Unknown'}</span>
          <div class="pdf-card-actions">
            <a href="${p.link}" download="${p.title}.pdf" class="icon-btn" onclick="event.stopPropagation();" aria-label="Download Document">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Asynchronously trigger PDF.js cover thumbnail loading
  filtered.forEach(p => {
    loadPdfThumbnailAsync(p);
  });
}

// --- RENDER NOTICES ---
function renderNoticesList() {
  let filtered = state.notices;

  // Filter Category
  if (state.filters.noticeCategory !== "all") {
    filtered = filtered.filter(n => n.category === state.filters.noticeCategory);
  }

  // Filter search queries
  if (state.filters.searchQuery) {
    const q = state.filters.searchQuery.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    elements.noticesMasterList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/>
        </svg>
        <p>No notices matching the criteria.</p>
      </div>
    `;
    return;
  }

  elements.noticesMasterList.innerHTML = filtered.map(n => `
    <div class="notice-card ${n.isRead ? '' : 'unread'}" onclick="markNoticeAsRead('${n.id}')">
      <div class="notice-icon-box ${n.category}">
        ${getCategoryIcon(n.category)}
      </div>
      <div class="notice-details">
        <div class="notice-meta-row">
          <span style="color: ${getCategoryColor(n.category)}">${n.category}</span>
          <span>&bull;</span>
          <span>${n.date}</span>
        </div>
        <h4 class="notice-title">${escapeHtml(n.title)}</h4>
        <p class="notice-content">${escapeHtml(n.content)}</p>
        ${state.isAdmin ? `
        <div class="notice-actions-row" style="margin-top: 8px;">
          <button class="sec-btn" onclick="event.stopPropagation(); deleteNotice('${n.id}');" style="padding: 4px 8px; font-size: 11px;">Delete Notice</button>
        </div>
        ` : ''}
      </div>
    </div>
  `).join("");
}

// --- RENDER CLASS TIMETABLE ---
function renderTimetableGrid() {
  const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // Determine standard time slots (e.g., 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00)
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

  let html = "";
  
  // Find current day name & time to mark ongoing classes
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const currentDayName = daysOfWeek[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  timeSlots.forEach(time => {
    html += `<div class="timetable-time-label">${time}</div>`;
    
    days.forEach(day => {
      // Find classes starting in this hour slot
      const hourPrefix = time.split(":")[0];
      const cellClasses = state.routine.filter(c => {
        return c.day === day && c.start.startsWith(hourPrefix);
      });

      html += `<div class="timetable-cell">`;
      cellClasses.forEach(c => {
        // Compute ongoing class
        let isOngoing = false;
        if (day === currentDayName) {
          const [sHour, sMin] = c.start.split(":").map(Number);
          const [eHour, eMin] = c.end.split(":").map(Number);
          const startMinutes = sHour * 60 + sMin;
          const endMinutes = eHour * 60 + eMin;
          if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            isOngoing = true;
          }
        }

        html += `
          <div class="class-card ${isOngoing ? 'current' : ''}" style="border-left-color: ${c.color || 'var(--color-primary)'};" ${state.isAdmin ? `onclick="openEditClassModal('${c.id}')"` : ''}>
            ${state.isAdmin ? `<button class="class-delete-btn" onclick="event.stopPropagation(); deleteClassSlot('${c.id}');">&times;</button>` : ''}
            <div class="class-card-header">
              <span class="class-card-time">${c.start}-${c.end}</span>
              <span class="class-card-room">${escapeHtml(c.room || 'Room')}</span>
            </div>
            <div class="class-card-title">${escapeHtml(c.name)}</div>
            <div class="class-card-teacher">${escapeHtml(c.teacher || '')}</div>
          </div>
        `;
      });
      html += `</div>`;
    });
  });

  elements.timetableBody.innerHTML = html;

  // Determine standard time slots for mobile daily view
  if (!state.selectedRoutineDay) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];
    // Default to Saturday if today is Friday (rest day)
    state.selectedRoutineDay = todayName === "Friday" ? "Saturday" : todayName;
  }

  // Render Day selector tabs
  const mobileDaySelector = document.querySelector(".mobile-day-selector");
  if (mobileDaySelector) {
    mobileDaySelector.innerHTML = days.map(d => {
      const isActive = state.selectedRoutineDay === d;
      return `
        <button class="day-tab ${isActive ? 'active' : ''}" onclick="selectRoutineDay('${d}')" style="background: ${isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)'}; color: ${isActive ? '#fff' : 'var(--text-muted)'}; border: 1px solid ${isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}; padding: 8px 14px; border-radius: 12px; font-weight: 700; font-size: 12px; cursor: pointer; flex-shrink: 0; transition: all 0.2s;">
          ${d.substring(0, 3)}
        </button>
      `;
    }).join("");
  }

  // Render Classes List for selected Day
  const mobileRoutineList = document.getElementById("mobile-routine-list");
  if (mobileRoutineList) {
    const dayClasses = state.routine.filter(c => c.day === state.selectedRoutineDay);
    
    // Sort classes by start time
    dayClasses.sort((a, b) => a.start.localeCompare(b.start));

    if (dayClasses.length === 0) {
      mobileRoutineList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px; width: 100%; box-sizing: border-box;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 32px; height: 32px; color: var(--color-primary); opacity: 0.4; margin-bottom: 8px; display: inline-block;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h4 style="font-size: 13px; font-weight: 600; color: var(--text-main); margin: 0 0 4px 0;">Rest Day</h4>
          <p style="font-size: 11px; opacity: 0.5; margin: 0;">No classes scheduled for ${state.selectedRoutineDay}. Enjoy your break!</p>
        </div>
      `;
    } else {
      mobileRoutineList.innerHTML = dayClasses.map(c => {
        let isOngoing = false;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayName = daysOfWeek[new Date().getDay()];
        if (c.day === todayName) {
          const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
          const [sHour, sMin] = c.start.split(":").map(Number);
          const [eHour, eMin] = c.end.split(":").map(Number);
          const startMinutes = sHour * 60 + sMin;
          const endMinutes = eHour * 60 + eMin;
          if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            isOngoing = true;
          }
        }

        return `
          <div class="glass-card timeline-item ${isOngoing ? 'active' : ''}" style="border-left: 4px solid ${c.color || 'var(--color-primary)'}; padding: 14px; border-radius: 14px; position: relative; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 6px; margin: 0;" ${state.isAdmin ? `onclick="openEditClassModal('${c.id}')"` : ''}>
            ${state.isAdmin ? `<button class="class-delete-btn" onclick="event.stopPropagation(); deleteClassSlot('${c.id}');" style="position: absolute; right: 12px; top: 12px; background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer;">&times;</button>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span style="font-size: 11px; font-weight: 700; color: var(--color-primary);">${c.start} - ${c.end}</span>
              <span style="font-size: 10.5px; font-weight: 700; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); color: var(--text-main);">${escapeHtml(c.room || 'Room')}</span>
            </div>
            <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 2px 0 0 0;">${escapeHtml(c.name)}</h4>
            <p style="font-size: 11.5px; opacity: 0.7; margin: 0; font-weight: 500;">Instructor: ${escapeHtml(c.teacher || 'Not Assigned')}</p>
          </div>
        `;
      }).join("");
    }
  }
}

// Global selector function for mobile day selector
window.selectRoutineDay = function(day) {
  state.selectedRoutineDay = day;
  renderTimetableGrid();
};

// Global function to remove pocket money addition history record
window.deleteFundRecord = function(index) {
  if (index >= 0 && index < state.pocketMoneyHistory.length) {
    const removedItem = state.pocketMoneyHistory[index];
    state.pocketMoney -= removedItem.amount;
    if (state.pocketMoney < 0) state.pocketMoney = 0; // prevent negative balance
    state.pocketMoneyHistory.splice(index, 1);
    saveState();
    render();
    showToast("Fund addition record removed.", "info");
  }
};

// Global function to toggle selected workout day tab
window.selectWorkoutDay = function(day) {
  state.selectedWorkoutDay = day;
  saveState();
  renderWorkoutWidget();
};

function renderCustomRoutine() {
  elements.routineToggleBtns.forEach(btn => {
    if (btn.getAttribute("data-mode") === state.routineViewMode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (state.routineViewMode === "grid") {
    elements.routineGridPane.classList.add("active");
    elements.routineCustomPane.classList.remove("active");
    elements.addClassTrigger.style.display = state.isAdmin ? "flex" : "none";
  } else {
    elements.routineGridPane.classList.remove("active");
    elements.routineCustomPane.classList.add("active");
    elements.addClassTrigger.style.display = "none";
    
    if (state.customRoutine) {
      elements.routineUploadZone.style.display = "none";
      if (elements.routineEmptyGuestPlaceholder) elements.routineEmptyGuestPlaceholder.style.display = "none";
      elements.routineDisplayZone.style.display = "flex";
      
      elements.routineFileName.textContent = state.customRoutineMeta.name;
      elements.routineFileMeta.textContent = `${state.customRoutineMeta.type.split("/")[1].toUpperCase()} • Uploaded ${state.customRoutineMeta.date}`;
      elements.routineDwnBtn.href = state.customRoutine;
      elements.routineDwnBtn.download = state.customRoutineMeta.name;
 
      if (state.customRoutineMeta.type === "application/pdf") {
        elements.routineImgViewer.style.display = "none";
        elements.routinePdfViewer.style.display = "block";
        elements.routinePdfIframe.src = state.customRoutine;
      } else {
        elements.routineImgViewer.style.display = "flex";
        elements.routinePdfViewer.style.display = "none";
        elements.routineImgElement.src = state.customRoutine;
      }
    } else {
      if (state.isAdmin) {
        elements.routineUploadZone.style.display = "flex";
        if (elements.routineEmptyGuestPlaceholder) elements.routineEmptyGuestPlaceholder.style.display = "none";
      } else {
        elements.routineUploadZone.style.display = "none";
        if (elements.routineEmptyGuestPlaceholder) elements.routineEmptyGuestPlaceholder.style.display = "flex";
      }
      elements.routineDisplayZone.style.display = "none";
    }
  }
}

// --- UTILITY FUNCTIONS ---
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

function getCategoryColor(cat) {
  switch (cat) {
    case "exams": return "var(--danger-color)";
    case "academic": return "var(--color-accent-purple)";
    case "events": return "var(--color-accent-green)";
    default: return "var(--color-primary)";
  }
}

function getCategoryIcon(cat) {
  switch (cat) {
    case "exams":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`;
    case "academic":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    case "events":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  }
}

function updateNoticeBadge() {
  const count = state.notices.filter(n => !n.isRead).length;
  if (elements.noticeBadge) {
    elements.noticeBadge.textContent = count;
    elements.noticeBadge.style.display = count > 0 ? "block" : "none";
  }
  
  const mobileNoticeBadge = document.getElementById("mobile-notice-badge");
  if (mobileNoticeBadge) {
    mobileNoticeBadge.style.display = count > 0 ? "block" : "none";
  }
}

// --- TAB TRANSITION MANAGER ---
function switchTab(tabId) {
  state.currentTab = tabId;
  
  // Update sidebar active buttons
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update mobile bottom tab active buttons
  const mobileNavBtns = document.querySelectorAll(".mobile-nav-btn");
  mobileNavBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
      btn.style.color = "var(--color-primary)";
    } else {
      btn.classList.remove("active");
      btn.style.color = "var(--text-muted)";
    }
  });

  // Update tabs DOM
  elements.tabContents.forEach(tab => {
    if (tab.id === `tab-${tabId}`) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Change page header
  elements.pageTitle.textContent = tabId.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  
  // Clear search field on navigation tab swap
  elements.globalSearch.value = "";
  state.filters.searchQuery = "";

  render();
}

function renderActiveTab() {
  // Clear modal states if active
  closeAllModals();
}

// --- MODAL UTILS ---
function openModal(modalEl) {
  modalEl.classList.add("active");
}

function closeAllModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("active"));
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  elements.toastHub.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// --- INTERACTIVE EVENT HANDLERS ---

// PDF Favorites Action
function toggleFavorite(event, pdfId) {
  event.stopPropagation();
  const index = state.favorites.indexOf(pdfId);
  if (index > -1) {
    state.favorites.splice(index, 1);
    showToast("Removed from favorite materials", "info");
  } else {
    state.favorites.push(pdfId);
    showToast("Added to study bookmarks!", "success");
  }
  saveState();
  render();
}

// Google Drive URL Converter helpers to enable direct iframe previewing and single-click downloading
function getEmbeddableDriveUrl(url) {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    let fileId = "";
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) {
      fileId = fileDMatch[1];
    } else {
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) fileId = idMatch[1];
    }
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  return url;
}

function getDownloadableDriveUrl(url) {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    let fileId = "";
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) {
      fileId = fileDMatch[1];
    } else {
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) fileId = idMatch[1];
    }
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return url;
}

// PDF Viewer opening
function openPdfViewer(event, pdfId) {
  // Gracefully handle programmatic calls where event is omitted and string is passed first
  if (typeof event === "string") {
    pdfId = event;
    event = null;
  }
  if (event && (event.target.closest(".pdf-menu-container") || event.target.closest(".bookmark-btn") || event.target.closest(".icon-btn"))) {
    return;
  }
  const pdf = state.pdfs.find(p => p.id === pdfId);
  if (!pdf) return;

  elements.pdfViewTitle.textContent = pdf.title;
  elements.pdfViewSubject.textContent = pdf.subject.toUpperCase();
  elements.pdfViewDesc.textContent = pdf.description || "No notes available.";

  if (!pdf.link || pdf.link === "#" || pdf.link === "") {
    elements.pdfDownloadBtn.style.display = "none";
    elements.pdfIframePreview.style.display = "none";
    elements.pdfIframePlaceholder.style.display = "flex";
    elements.pdfIframePlaceholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:12px;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p>No document attached. You can read the study notes on the left.</p>
    `;
    elements.previewOpenExternal.style.display = "none";
  } else {
    elements.pdfDownloadBtn.style.display = "inline-flex";
    elements.pdfDownloadBtn.href = getDownloadableDriveUrl(pdf.link);
    elements.pdfDownloadBtn.download = `${pdf.title}.pdf`;
    elements.previewOpenExternal.style.display = "inline-flex";

    // Sandboxed PDF Preview Mock for raw local base64/blobs
    if (pdf.link.startsWith("blob:") || pdf.link.startsWith("data:")) {
      elements.pdfIframePreview.style.display = "none";
      elements.pdfIframePlaceholder.style.display = "flex";
      elements.pdfIframePlaceholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:12px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p>PDF reader sandbox loaded. Preview simulated for demo purposes.</p>
      `;
      elements.previewOpenExternal.onclick = (e) => {
        e.preventDefault();
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <title>${escapeHtml(pdf.title)}</title>
                <style>
                  body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#0f172a; }
                  iframe { width:100%; height:100%; border:none; margin:0; padding:0; }
                </style>
              </head>
              <body>
                <iframe src="${pdf.link}"></iframe>
              </body>
            </html>
          `);
          newTab.document.close();
        } else {
          showToast("Pop-up blocked! Please allow pop-ups for this site.", "warning");
        }
      };
    } else {
      elements.pdfIframePreview.src = getEmbeddableDriveUrl(pdf.link);
      elements.pdfIframePreview.style.display = "block";
      elements.pdfIframePlaceholder.style.display = "none";
      elements.previewOpenExternal.onclick = (e) => {
        e.preventDefault();
        window.open(pdf.link, "_blank");
      };
    }
  }

  // Setup favorite toggle inside viewer
  const isFav = state.favorites.includes(pdf.id);
  setupPdfViewerFavoriteBtn(pdf.id, isFav);

  openModal(elements.pdfViewModal);
}


function setupPdfViewerFavoriteBtn(pdfId, isFav) {
  elements.pdfFavoriteToggleBtn.innerHTML = `
    <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="color: ${isFav ? 'var(--danger-color)' : 'inherit'}"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    <span>${isFav ? 'Bookmarked' : 'Add to Favorites'}</span>
  `;
  elements.pdfFavoriteToggleBtn.onclick = (e) => {
    toggleFavorite(e, pdfId);
    const newIsFav = state.favorites.includes(pdfId);
    setupPdfViewerFavoriteBtn(pdfId, newIsFav);
  };
}

// Notice board reading interactions
function markNoticeAsRead(noticeId) {
  const notice = state.notices.find(n => n.id === noticeId);
  if (notice && !notice.isRead) {
    notice.isRead = true;
    saveState();
    render();
  }
}

function deleteNotice(noticeId) {
  state.notices = state.notices.filter(n => n.id !== noticeId);
  saveState();
  showToast("Notice removed", "info");
  render();
}

function openNoticeFromWidget(noticeId) {
  switchTab("notices");
  // Find card and flash outline
  setTimeout(() => {
    markNoticeAsRead(noticeId);
  }, 100);
}

// Class Routine CRUD
function openEditClassModal(classId) {
  const c = state.routine.find(item => item.id === classId);
  if (!c) return;

  elements.classModalTitle.textContent = "Edit Class Slot Details";
  elements.editClassId.value = c.id;
  document.getElementById("class-subject-name").value = c.name;
  document.getElementById("class-teacher").value = c.teacher || "";
  document.getElementById("class-day").value = c.day;
  document.getElementById("class-room").value = c.room || "";
  document.getElementById("class-start").value = c.start;
  document.getElementById("class-end").value = c.end;
  
  // Check proper color dot radio
  const radios = document.getElementsByName("class-color");
  radios.forEach(r => {
    r.checked = r.value === c.color;
  });

  elements.deleteClassBtn.style.display = "inline-flex";
  openModal(elements.addClassModal);
}

function deleteClassSlot(classId) {
  state.routine = state.routine.filter(c => c.id !== classId);
  saveState();
  showToast("Class slot deleted", "danger");
  render();
}

// Theme Applier
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  if (elements.themeText) {
    elements.themeText.textContent = theme === "dark" ? "Dark Mode" : "Light Mode";
  }

  // Toggle sun/moon icons on mobile header
  const sunIcons = document.querySelectorAll(".sun-icon");
  const moonIcons = document.querySelectorAll(".moon-icon");
  if (theme === "dark") {
    sunIcons.forEach(i => i.style.display = "none");
    moonIcons.forEach(i => i.style.display = "block");
  } else {
    sunIcons.forEach(i => i.style.display = "block");
    moonIcons.forEach(i => i.style.display = "none");
  }
  saveState();
}

// --- SETUP EVENT LISTENERS ---
function setupEvents() {
  // Theme Toggle Event
  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} theme`, "info");
  });

  const mobileThemeToggle = document.getElementById("mobile-theme-toggle-btn");
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      showToast(`Switched to ${nextTheme} theme`, "info");
    });
  }

  // Firebase Authentication Mode & Forms Event Handlers
  if (firebaseAvailable) {
    let authMode = "login";
    if (elements.loginToggleModeBtn) {
      elements.loginToggleModeBtn.addEventListener("click", () => {
        const formHeaderTitle = document.getElementById("form-header-title");
        const loginSubmitBtn = document.getElementById("login-submit-btn");
        const loginToggleDesc = document.getElementById("login-toggle-desc");
        
        if (authMode === "login") {
          authMode = "register";
          if (formHeaderTitle) formHeaderTitle.textContent = "Create Account";
          if (loginSubmitBtn) loginSubmitBtn.textContent = "Register";
          if (loginToggleDesc) loginToggleDesc.textContent = "Already have an account?";
          if (elements.loginToggleModeBtn) elements.loginToggleModeBtn.textContent = "Sign In";
        } else {
          authMode = "login";
          if (formHeaderTitle) formHeaderTitle.textContent = "Sign In";
          if (loginSubmitBtn) loginSubmitBtn.textContent = "Sign In";
          if (loginToggleDesc) loginToggleDesc.textContent = "Don't have an account?";
          if (elements.loginToggleModeBtn) elements.loginToggleModeBtn.textContent = "Create Account";
        }
      });
    }

    if (elements.firebaseAuthForm) {
      elements.firebaseAuthForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const submitBtn = document.getElementById("login-submit-btn");
        
        const oldBtnText = submitBtn ? submitBtn.textContent : "Sign In";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Processing...";
        }
        
        // Intelligent login flow: try to sign in, fallback to create account if user doesn't exist
        firebase.auth().signInWithEmailAndPassword(email, password)
          .then(() => {
            showToast("Signed in successfully!", "success");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = oldBtnText;
            }
            elements.firebaseAuthForm.reset();
          })
          .catch((error) => {
            console.warn("Initial sign-in failed, checking for registration fallback:", error.code);
            if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential" || error.code === "auth/user-disabled") {
              // Try creating the account
              firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(() => {
                  showToast("Account created and signed in successfully!", "success");
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = oldBtnText;
                  }
                  elements.firebaseAuthForm.reset();
                })
                .catch((regError) => {
                  if (regError.code === "auth/email-already-in-use") {
                    showToast("Incorrect password for this email address.", "danger");
                  } else {
                    showToast(regError.message, "danger");
                  }
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = oldBtnText;
                  }
                });
            } else {
              showToast(error.message, "danger");
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = oldBtnText;
              }
            }
          });
      });
    }

    if (elements.googleLoginBtn) {
      elements.googleLoginBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        firebase.auth().signInWithPopup(provider)
          .then((result) => {
            if (result.user) {
              localStorage.setItem("edu_logged_in", "true");
              localStorage.setItem("edu_user_email", result.user.email);
              
              state.user = result.user;
              state.isAdmin = (result.user.email === "shahalam8052020@gmail.com");
              loadPrefixVariables();
              
              const loginScreen = document.getElementById("login-screen");
              const appContainer = document.getElementById("app-container");
              if (loginScreen) loginScreen.style.display = "none";
              if (appContainer) appContainer.style.display = "flex";
              
              applyAdminControls();
              render();
              showToast("Authenticated with Google successfully!", "success");
            }
          })
          .catch((error) => {
            console.error("Google Auth error:", error);
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
              // Fallback to redirect only if popup is blocked
              return firebase.auth().signInWithRedirect(provider);
            }
            showToast(error.message, "danger");
          });
      });
    }

    // Admin / Account Log Out Click
    if (elements.adminLogoutBtn) {
      elements.adminLogoutBtn.addEventListener("click", () => {
        firebase.auth().signOut()
          .then(() => {
            showToast("Signed out successfully", "info");
          })
          .catch((error) => {
            showToast("Sign out failed: " + error.message, "danger");
          });
      });
    }

    const mobileDrawerLockToggleBtn = document.getElementById("mobile-drawer-lock-toggle-btn");
    if (mobileDrawerLockToggleBtn) {
      mobileDrawerLockToggleBtn.addEventListener("click", () => {
        firebase.auth().signOut()
          .then(() => {
            showToast("Signed out successfully", "info");
            // Close mobile drawer menu if open
            const appSidebar = document.getElementById("app-sidebar");
            if (appSidebar) appSidebar.classList.remove("mobile-open");
          })
          .catch((error) => {
            showToast("Sign out failed: " + error.message, "danger");
          });
      });
    }
  }

  // Guest Access Trigger Click
  const guestAccessBtn = document.getElementById("guest-access-btn");
  if (guestAccessBtn) {
    guestAccessBtn.addEventListener("click", () => {
      const loginScreen = document.getElementById("login-screen");
      const appContainer = document.getElementById("app-container");
      if (loginScreen) loginScreen.style.display = "none";
      if (appContainer) appContainer.style.display = "flex";
      
      state.user = null;
      state.isAdmin = false;
      loadPrefixVariables();
      applyAdminControls();
      render();
      showToast("Accessing portal in Student Guest Mode.", "info");
    });
  }

  // Tab Sidebar Navigation
  elements.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      if (targetTab) {
        switchTab(targetTab);
      }
      
      // Clear mobile styles on desktop resize fallback
      const appSidebar = document.getElementById("app-sidebar");
      if (appSidebar) appSidebar.classList.remove("mobile-open");
    });
  });

  // Mobile Bottom Navigation Tabs Click
  const mobileNavBtns = document.querySelectorAll(".mobile-nav-btn");
  mobileNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      if (target) {
        switchTab(target);
      }
    });
  });

  // Mobile Admin Drawer Menu Trigger Click
  const mobileMenuTrigger = document.getElementById("mobile-menu-trigger");
  const mobileAdminDrawerModal = document.getElementById("mobile-admin-drawer-modal");
  if (mobileMenuTrigger && mobileAdminDrawerModal) {
    mobileMenuTrigger.addEventListener("click", () => {
      openModal(mobileAdminDrawerModal);
    });
  }



  // Profile Avatar Photo Upload Listener
  const avatarFileInput = document.getElementById("avatar-file-input");
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          state.adminAvatar = evt.target.result;
          saveState();
          render();
          showToast("Profile avatar photo updated successfully!", "success");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Add Pocket Money Funds Trigger Modal Button
  const addMoneyTriggerBtn = document.getElementById("add-money-trigger-btn");
  const addFundsModal = document.getElementById("add-funds-modal");
  if (addMoneyTriggerBtn && addFundsModal) {
    addMoneyTriggerBtn.addEventListener("click", () => {
      const addFundsForm = document.getElementById("add-funds-form");
      if (addFundsForm) addFundsForm.reset();
      openModal(addFundsModal);
    });
  }

  // Add Funds Form Submit Handler
  const addFundsForm = document.getElementById("add-funds-form");
  if (addFundsForm) {
    addFundsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amountInput = document.getElementById("add-funds-amount-input");
      if (amountInput) {
        const amount = parseFloat(amountInput.value) || 0;
        if (amount > 0) {
          state.pocketMoney += amount;
          state.pocketMoneyHistory.push({
            amount: amount,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
          saveState();
          closeAllModals();
          render();
          showToast(`Successfully added ${amount.toLocaleString()} BDT to pocket money!`, "success");
        }
      }
    });
  }

  // Dashboard Button Triggers
  document.querySelectorAll(".view-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target-tab");
      switchTab(target);
    });
  });

  // Modals close behaviors
  elements.closeModalBtns.forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });
  
  // Close modals on clicking backdrop
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  // Global search implementation
  elements.globalSearch.addEventListener("input", (e) => {
    const val = e.target.value;
    state.filters.searchQuery = val;
    
    // Auto shift view or display matched items on active tab
    if (state.currentTab === "dashboard") {
      // If user types in global search on dashboard, redirect them to PDF store
      switchTab("pdf-store");
    } else {
      render();
    }
  });

  // PDF Subject Dropdown change listener to support new dynamic custom option
  if (elements.pdfSubjectDropdown) {
    elements.pdfSubjectDropdown.addEventListener("change", (e) => {
      if (e.target.value === "__custom__") {
        elements.customSubjectGroup.style.display = "block";
        elements.customSubjectName.required = true;
        elements.customSubjectName.focus();
      } else {
        elements.customSubjectGroup.style.display = "none";
        elements.customSubjectName.required = false;
        elements.customSubjectName.value = "";
      }
    });
  }

  // PDF Upload Modal Form & File Drag/Drop
  elements.uploadPdfTrigger.addEventListener("click", () => {
    elements.addPdfForm.reset();
    renderPdfSubjectDropdown(); // Re-populate options dynamically
    elements.customSubjectGroup.style.display = "none";
    elements.customSubjectName.required = false;
    elements.customSubjectName.value = "";
    elements.fileUploadStatus.textContent = "No file selected";
    openModal(elements.addPdfModal);
  });

  // File Drop Zone simulation
  elements.fileDropZone.addEventListener("click", () => {
    elements.pdfFileInputRaw.click();
  });

  elements.pdfFileInputRaw.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      elements.fileUploadStatus.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
      
      // Attempt to auto fill title if blank
      const titleInput = document.getElementById("pdf-title");
      if (!titleInput.value) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      }
    }
  });

  // File drop event simulation
  elements.fileDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.fileDropZone.style.borderColor = "var(--color-primary)";
  });

  elements.fileDropZone.addEventListener("dragleave", () => {
    elements.fileDropZone.style.borderColor = "var(--border-card)";
  });

  elements.fileDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.fileDropZone.style.borderColor = "var(--border-card)";
    if (e.dataTransfer.files.length > 0) {
      elements.pdfFileInputRaw.files = e.dataTransfer.files;
      const file = e.dataTransfer.files[0];
      elements.fileUploadStatus.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
      
      const titleInput = document.getElementById("pdf-title");
      if (!titleInput.value) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      }
    }
  });

  // Save PDF upload
  elements.addPdfForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("pdf-title").value;
    let subject = document.getElementById("pdf-subject").value;
    const description = document.getElementById("pdf-description").value;
    let link = document.getElementById("pdf-link").value;
    let size = "1.5 MB";

    // Handle custom subject creation
    if (subject === "__custom__") {
      const customName = elements.customSubjectName.value.trim();
      if (!customName) {
        showToast("Please enter a subject name.", "danger");
        return;
      }
      const key = customName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      
      const exists = state.subjects.find(s => s.key === key);
      if (!exists) {
        state.subjects.push({ key, name: customName });
        localStorage.setItem("edu_subjects", JSON.stringify(state.subjects));
      }
      subject = key;
    }

    async function saveNewPdfRecord(finalLink, finalSize) {
      const newPdf = {
        id: "pdf-" + Date.now(),
        title,
        subject,
        description,
        link: finalLink,
        size: finalSize,
        uploadedAt: new Date().toISOString().split("T")[0]
      };

      state.pdfs.unshift(newPdf);

      const submitBtn = elements.addPdfForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : "Save to Library";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Syncing with Cloud...";
      }

      try {
        await saveState();
        showToast("PDF document added and synced with cloud!", "success");
      } catch (err) {
        showToast("Saved locally, but cloud sync failed.", "warning");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        closeAllModals();
        state.filters.pdfSubject = subject; // Auto focus newly added subject tab
        render();
      }
    }

    // Handle raw file if attached
    if (elements.pdfFileInputRaw.files.length > 0) {
      const file = elements.pdfFileInputRaw.files[0];
      const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      
      // Attempt Firebase Storage Upload if user is logged in
      if (state.user) {
        const submitBtn = elements.addPdfForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : "Save to Library";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Uploading to Cloud...";
        }
        
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`pdfs/${Date.now()}_${file.name}`);
        
        const uploadPromise = fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Upload timed out (5s)")), 5000);
        });

        Promise.race([uploadPromise, timeoutPromise])
          .then(downloadURL => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
            saveNewPdfRecord(downloadURL, fileSizeStr);
          })
          .catch(error => {
            console.warn("Firebase Storage upload failed/timed out, falling back to backup cloud host:", error);
            
            // Show toast and change button text
            showToast("Cloud bucket offline. Uploading via high-speed backup...", "info");
            if (submitBtn) {
              submitBtn.textContent = "Uploading to Cloud Backup...";
            }
            
            const formData = new FormData();
            formData.append("reqtype", "fileupload");
            formData.append("fileToUpload", file);
            
            fetch("https://catbox.moe/user/api.php", {
              method: "POST",
              body: formData
            })
            .then(res => {
              if (!res.ok) throw new Error("Catbox upload failed");
              return res.text();
            })
            .then(fileURL => {
              const cleanURL = fileURL.trim();
              console.log("Catbox backup upload succeeded:", cleanURL);
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
              }
              saveNewPdfRecord(cleanURL, fileSizeStr);
            })
            .catch(catboxError => {
              console.warn("Catbox backup upload failed, trying tmpfiles.org:", catboxError);
              
              if (submitBtn) {
                submitBtn.textContent = "Uploading to Tmpfiles...";
              }
              
              const tmpData = new FormData();
              tmpData.append("file", file);
              
              fetch("https://tmpfiles.org/api/v1/upload", {
                method: "POST",
                body: tmpData
              })
              .then(res => {
                if (!res.ok) throw new Error("Tmpfiles upload failed");
                return res.json();
              })
              .then(data => {
                if (data.status === "success" && data.data && data.data.url) {
                  const directLink = data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
                  console.log("Tmpfiles upload succeeded:", directLink);
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                  }
                  saveNewPdfRecord(directLink, fileSizeStr);
                } else {
                  throw new Error("Tmpfiles API returned error");
                }
              })
              .catch(tmpError => {
                console.error("All cloud backups failed, falling back to local Base64:", tmpError);
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.textContent = originalText;
                }
                showToast("All cloud uploads failed. Saved locally on this device only.", "warning");
                
                // Fallback to local Base64
                const reader = new FileReader();
                reader.onload = () => {
                  saveNewPdfRecord(reader.result, fileSizeStr);
                };
                reader.readAsDataURL(file);
              });
            });
          });
      } else {
        // Fallback for non-logged-in
        const reader = new FileReader();
        reader.onload = () => {
          saveNewPdfRecord(reader.result, fileSizeStr);
        };
        reader.readAsDataURL(file);
      }
    } else {
      saveNewPdfRecord(link || "", link ? "1.5 MB" : "Study Notes Only");
    }
  });

  // Notice board Category Filtering
  elements.noticeCategoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      elements.noticeCategoryTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.filters.noticeCategory = tab.getAttribute("data-category");
      renderNoticesList();
    });
  });

  // Mark all read notices
  elements.markAllReadBtn.addEventListener("click", () => {
    state.notices.forEach(n => n.isRead = true);
    saveState();
    showToast("All announcements marked as read", "success");
    render();
  });

  // Open Notice Modal
  elements.addNoticeTrigger.addEventListener("click", () => {
    elements.addNoticeForm.reset();
    openModal(elements.addNoticeModal);
  });

  // Submit Notice Form
  elements.addNoticeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("notice-title-input").value;
    const category = document.getElementById("notice-category-input").value;
    const content = document.getElementById("notice-content-input").value;

    const newNotice = {
      id: "notice-" + Date.now(),
      title,
      category,
      content,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      isRead: false
    };

    state.notices.unshift(newNotice);
    saveState();
    showToast("Announcement posted successfully!", "success");
    closeAllModals();
    render();
  });

  // Class Routine Add/Edit form triggers
  elements.addClassTrigger.addEventListener("click", () => {
    elements.addClassForm.reset();
    elements.editClassId.value = "";
    elements.deleteClassBtn.style.display = "none";
    elements.classModalTitle.textContent = "Add Class Slot";
    openModal(elements.addClassModal);
  });

  // Delete Class Routine Button Listener
  elements.deleteClassBtn.addEventListener("click", () => {
    const classId = elements.editClassId.value;
    if (classId && confirm("Are you sure you want to delete this class slot?")) {
      deleteClassSlot(classId);
      closeAllModals();
    }
  });

  // Save Class Routine
  elements.addClassForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const classId = elements.editClassId.value;
    const name = document.getElementById("class-subject-name").value;
    const teacher = document.getElementById("class-teacher").value;
    const day = document.getElementById("class-day").value;
    const room = document.getElementById("class-room").value;
    const start = document.getElementById("class-start").value;
    const end = document.getElementById("class-end").value;
    const color = document.querySelector('input[name="class-color"]:checked').value;

    if (classId) {
      // Edit class
      const idx = state.routine.findIndex(item => item.id === classId);
      if (idx > -1) {
        state.routine[idx] = { id: classId, name, teacher, day, room, start, end, color };
        showToast("Class routine slot updated!", "success");
      }
    } else {
      // Create new class
      const newSlot = {
        id: "c-" + Date.now(),
        name, teacher, day, room, start, end, color
      };
      state.routine.push(newSlot);
      showToast("New class slot scheduled!", "success");
    }

    saveState();
    closeAllModals();
    render();
  });

  // Custom Routine View Toggle buttons
  elements.routineToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      state.routineViewMode = btn.getAttribute("data-mode");
      saveState();
      render();
    });
  });

  // File browser trigger
  elements.routineFileBrowseBtn.addEventListener("click", () => {
    elements.routineFileInput.click();
  });

  // File selection
  elements.routineFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleRoutineUpload(e.target.files[0]);
    }
  });

  // Drag and drop handler
  elements.routineUploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.routineUploadZone.style.borderColor = "var(--color-primary)";
  });

  elements.routineUploadZone.addEventListener("dragleave", () => {
    elements.routineUploadZone.style.borderColor = "var(--border-card-active)";
  });

  elements.routineUploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.routineUploadZone.style.borderColor = "var(--border-card-active)";
    if (e.dataTransfer.files.length > 0) {
      handleRoutineUpload(e.dataTransfer.files[0]);
    }
  });

  // Reset routine
  elements.routineResetBtn.addEventListener("click", () => {
    state.customRoutine = null;
    state.customRoutineMeta = null;
    saveState();
    showToast("Custom routine removed.", "info");
    render();
  });

  // Zooming controls
  let zoomScale = 1;
  elements.zoomInBtn.addEventListener("click", () => {
    zoomScale = Math.min(3, zoomScale + 0.2);
    applyZoom();
  });

  elements.zoomOutBtn.addEventListener("click", () => {
    zoomScale = Math.max(0.5, zoomScale - 0.2);
    applyZoom();
  });

  elements.zoomResetBtn.addEventListener("click", () => {
    zoomScale = 1;
    applyZoom();
  });

  function applyZoom() {
    elements.routineImgElement.style.transform = `scale(${zoomScale})`;
  }

  // Panning/dragging within viewport
  let isPanning = false;
  let startPanX, startPanY;
  let scrollLeftStart, scrollTopStart;

  elements.routineImgViewport.addEventListener("mousedown", (e) => {
    isPanning = true;
    elements.routineImgViewport.style.cursor = "grabbing";
    startPanX = e.pageX - elements.routineImgViewport.offsetLeft;
    startPanY = e.pageY - elements.routineImgViewport.offsetTop;
    scrollLeftStart = elements.routineImgViewport.scrollLeft;
    scrollTopStart = elements.routineImgViewport.scrollTop;
  });

  elements.routineImgViewport.addEventListener("mouseleave", () => {
    isPanning = false;
    elements.routineImgViewport.style.cursor = "grab";
  });

  elements.routineImgViewport.addEventListener("mouseup", () => {
    isPanning = false;
    elements.routineImgViewport.style.cursor = "grab";
  });

  elements.routineImgViewport.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.pageX - elements.routineImgViewport.offsetLeft;
    const y = e.pageY - elements.routineImgViewport.offsetTop;
    const walkX = (x - startPanX) * 1.5;
    const walkY = (y - startPanY) * 1.5;
    elements.routineImgViewport.scrollLeft = scrollLeftStart - walkX;
    elements.routineImgViewport.scrollTop = scrollTopStart - walkY;
  });

  // Hydration Reminder logs
  const addWaterBtn = document.getElementById("add-water-btn");
  const resetWaterBtn = document.getElementById("reset-water-btn");
  
  if (addWaterBtn) {
    addWaterBtn.addEventListener("click", () => {
      state.waterIntake += 250;
      saveState();
      updateWaterReminder();
      showToast("Hydrated! +250ml added. 💧", "success");
    });
  }
  
  if (resetWaterBtn) {
    resetWaterBtn.addEventListener("click", () => {
      state.waterIntake = 0;
      saveState();
      updateWaterReminder();
      showToast("Hydration count reset.", "info");
    });
  }

  // Monthly Expenses Form Submit
  const addExpenseForm = document.getElementById("add-expense-form");
  if (addExpenseForm) {
    addExpenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const desc = document.getElementById("exp-desc").value.trim();
      const amount = parseFloat(document.getElementById("exp-amount").value);
      const category = "General";

      if (desc && amount > 0) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const todayStr = new Date().toLocaleDateString('en-US', options);

        state.expenses.push({
          id: "exp-" + Date.now(),
          desc,
          category,
          amount,
          date: todayStr
        });
        saveState();
        showToast("Expense added successfully!", "success");
        addExpenseForm.reset();
        renderExpenses();
      }
    });
  }

  // Monthly Expenses Clear All
  const clearExpensesBtn = document.getElementById("clear-all-expenses");
  if (clearExpensesBtn) {
    clearExpensesBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all monthly expenses?")) {
        state.expenses = [];
        saveState();
        showToast("All expenses cleared.", "warning");
        renderExpenses();
      }
    });
  }
  // Monthly Expenses Save History Trigger
  if (elements.saveHistoryBtn) {
    elements.saveHistoryBtn.addEventListener("click", () => {
      if (state.expenses.length === 0) {
        showToast("No active expenses to save for this month!", "warning");
        return;
      }
      const options = { month: 'long', year: 'numeric' };
      const defaultMonthLabel = new Date().toLocaleDateString('en-US', options);
      document.getElementById("history-month-input").value = defaultMonthLabel;
      openModal(elements.saveHistoryModal);
    });
  }

  // Monthly Expenses Save History Submit Form
  if (elements.saveHistoryForm) {
    elements.saveHistoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const monthLabel = document.getElementById("history-month-input").value.trim();
      if (!monthLabel) return;

      const totalSpent = state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const remaining = state.pocketMoney - totalSpent;

      state.expenseHistory.push({
        id: "hist-" + Date.now(),
        monthName: monthLabel,
        pocketMoney: state.pocketMoney,
        totalSpent,
        remaining,
        transactions: [...state.expenses]
      });

      // Clear active transactions, pocket money and dynamic history to start fresh
      state.expenses = [];
      state.pocketMoney = 0;
      state.pocketMoneyHistory = [];
      state.viewingMonth = "active";
      saveState();

      closeAllModals();
      showToast(`History for ${monthLabel} saved successfully!`, "success");
      renderExpenses();
    });
  }
}

function handleRoutineUpload(file) {
  if (!file) return;

  // Max 4.5 MB check to avoid localStorage quota issues
  if (file.size > 4.5 * 1024 * 1024) {
    showToast("File too large! Must be under 4.5MB for storage limits.", "danger");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.customRoutine = e.target.result;
    state.customRoutineMeta = {
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(1) + " KB",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    saveState();
    showToast("Routine document uploaded and custom page saved!", "success");
    render();
  };
  reader.onerror = () => {
    showToast("Failed to read file", "danger");
  };
  reader.readAsDataURL(file);
}

const QURAN_AYATS = [
  { text: "Indeed, with hardship [will be] ease.", ref: "Surah Ash-Sharh [94:6]" },
  { text: "So remember Me; I will remember you.", ref: "Surah Al-Baqarah [2:152]" },
  { text: "And He found you lost and guided [you].", ref: "Surah Ad-Duha [93:7]" },
  { text: "My mercy encompasses all things.", ref: "Surah Al-A'raf [7:156]" },
  { text: "And speak to people good [words].", ref: "Surah Al-Baqarah [2:83]" },
  { text: "And put your trust in Allah; and sufficient is Allah as a Disposer of affairs.", ref: "Surah Al-Ahzab [33:3]" },
  { text: "Is not the morning near?", ref: "Surah Hud [11:81]" },
  { text: "Indeed, my Lord is near and responsive.", ref: "Surah Hud [11:61]" }
];

function rotateQuranAyat() {
  const textEl = document.getElementById("ayat-text");
  const refEl = document.getElementById("ayat-ref");
  if (textEl && refEl) {
    const quote = QURAN_AYATS[Math.floor(Math.random() * QURAN_AYATS.length)];
    textEl.style.opacity = 0;
    refEl.style.opacity = 0;
    
    setTimeout(() => {
      textEl.textContent = `"${quote.text}"`;
      refEl.textContent = `— ${quote.ref}`;
      textEl.style.opacity = 1;
      refEl.style.opacity = 1;
    }, 400);
  }
}

function renderPdfSubjectFilters() {
  if (!elements.pdfSubjectFilters) return;
  let html = "";
  state.subjects.forEach(sub => {
    const isActive = state.filters.pdfSubject === sub.key;
    html += `
      <button class="filter-btn ${isActive ? 'active' : ''}" data-subject="${sub.key}">
        ${escapeHtml(sub.name)}
      </button>
    `;
  });
  elements.pdfSubjectFilters.innerHTML = html;

  // Rebind click events
  const buttons = elements.pdfSubjectFilters.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filters.pdfSubject = btn.getAttribute("data-subject");
      renderPdfGallery();
    });
  });
}

function renderPdfSubjectDropdown() {
  if (!elements.pdfSubjectDropdown) return;
  let html = "";
  state.subjects.forEach(sub => {
    html += `<option value="${sub.key}">${escapeHtml(sub.name)}</option>`;
  });
  html += `<option value="__custom__">+ Add New Subject...</option>`;
  elements.pdfSubjectDropdown.innerHTML = html;
}

function updateWaterReminder() {
  const target = 2000;
  const intake = state.waterIntake || 0;
  const percentage = Math.min(100, Math.round((intake / target) * 100));
  
  const progressText = document.getElementById("water-progress-text");
  const currentAmount = document.getElementById("water-current-amount");
  const levelFill = document.getElementById("water-level-fill");
  
  if (progressText && currentAmount && levelFill) {
    progressText.textContent = `${percentage}%`;
    currentAmount.textContent = `${intake} ml`;
    levelFill.style.height = `${percentage}%`;
  }
}

// Global click delegate for 3-dot dropdown menus
document.addEventListener("click", (e) => {
  // 1. Close other dropdowns
  document.querySelectorAll(".pdf-menu-container.active").forEach(el => {
    if (!el.contains(e.target)) {
      el.classList.remove("active");
    }
  });

  // 2. Click trigger toggling
  const trigger = e.target.closest(".pdf-menu-trigger");
  if (trigger) {
    e.stopPropagation();
    const container = trigger.closest(".pdf-menu-container");
    container.classList.toggle("active");
  }

  // 3. Delete button action
  const deleteBtn = e.target.closest(".delete-pdf-btn");
  if (deleteBtn) {
    e.stopPropagation();
    const pdfId = deleteBtn.getAttribute("data-id");
    deletePdf(pdfId);
  }

  // 4. Move button action
  const moveBtn = e.target.closest(".move-pdf-btn");
  if (moveBtn) {
    e.stopPropagation();
    const pdfId = moveBtn.getAttribute("data-id");
    const targetSubject = moveBtn.getAttribute("data-target");
    movePdf(pdfId, targetSubject);
  }
});

function deletePdf(pdfId) {
  state.pdfs = state.pdfs.filter(p => p.id !== pdfId);
  state.favorites = state.favorites.filter(id => id !== pdfId);
  saveState();
  render();
  showToast("Notes document deleted.", "info");
}

function movePdf(pdfId, targetSubject) {
  const pdf = state.pdfs.find(p => p.id === pdfId);
  if (pdf) {
    pdf.subject = targetSubject;
    saveState();
    render();
    showToast(`Notes moved to ${targetSubject.toUpperCase()} folder!`, "success");
  }
}

async function loadPdfThumbnailAsync(pdf) {
  if (!pdf.link || pdf.link === "#" || pdf.link === "") return;

  const targetEl = document.getElementById(`thumb-cover-${pdf.id}`);
  if (!targetEl) return;

  // 1. If we have a cached thumbnail, load it immediately
  if (pdf.thumbnail) {
    targetEl.innerHTML = `<img src="${pdf.thumbnail}" class="pdf-cover-img" alt="${escapeHtml(pdf.title)} First Page" />`;
    return;
  }

  // 2. Otherwise generate it asynchronously via PDFJS
  try {
    const isDataUri = pdf.link.startsWith("data:") || pdf.link.startsWith("blob:") || pdf.link.includes(window.location.origin) || pdf.link.startsWith("/");
    if (!isDataUri) return; // Prevent cross-origin resource block (CORS) exceptions on foreign URLs

    const loadingTask = pdfjsLib.getDocument(pdf.link);
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    
    const viewport = page.getViewport({ scale: 0.4 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const dataUrl = canvas.toDataURL();
    
    // Save to state cache to avoid repeated heavy renders
    pdf.thumbnail = dataUrl;
    saveState();
    
    // Smoothly swap to cover page image
    targetEl.innerHTML = `<img src="${dataUrl}" class="pdf-cover-img" alt="${escapeHtml(pdf.title)} First Page" />`;
  } catch (err) {
    console.warn("Could not generate PDF cover thumbnail asynchronously:", err);
  }
}

// --- DYNAMIC WORKOUT PLANNER CONTROL ---
// --- DYNAMIC WORKOUT PLANNER CONTROL ---
function renderWorkoutWidget() {
  if (!elements.workoutWidget) return;

  if (!state.activeWorkoutTab) {
    state.activeWorkoutTab = "tab-workout-routine";
  }

  const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  if (!state.selectedWorkoutDay) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    state.selectedWorkoutDay = daysOfWeek[new Date().getDay()];
  }

  // Calculate dynamic BMI details
  const weight = state.workoutWeight || 70;
  const height = state.workoutHeight || 170;
  const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
  
  let bmiCategory = "Normal";
  let bmiColor = "#22c55e"; // green
  let bmiDesc = "Normal Weight";
  if (bmi < 18.5) {
    bmiCategory = "Underweight";
    bmiColor = "#3b82f6"; // blue
    bmiDesc = "Underweight / Muscle Gain Focus";
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = "Overweight";
    bmiColor = "#f59e0b"; // orange
    bmiDesc = "Overweight / Fat Oxidation Focus";
  } else if (bmi >= 30) {
    bmiCategory = "Obese";
    bmiColor = "#ef4444"; // red
    bmiDesc = "Obese / Low-Impact Routine Focus";
  }

  // Render Day selector tabs html for the routine
  const workoutDayTabsHtml = days.map(d => {
    const isActive = state.selectedWorkoutDay === d;
    return `
      <button type="button" class="workout-day-tab ${isActive ? 'active' : ''}" onclick="selectWorkoutDay('${d}')" style="background: ${isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)'}; color: ${isActive ? '#fff' : 'var(--text-muted)'}; border: 1px solid ${isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; flex-shrink: 0; transition: all 0.2s;">
        ${d.substring(0, 3)}
      </button>
    `;
  }).join("");

  // Filter exercises by the active selected workout day
  const dayRoutine = state.workoutRoutine.filter(ex => {
    if (!ex.day) ex.day = "Saturday";
    return ex.day === state.selectedWorkoutDay;
  });

  elements.workoutWidget.innerHTML = `
    <div class="calorie-calculator-container" style="padding: 16px;">
      <!-- Header -->
      <div class="workout-header" style="margin-bottom: 12px;">
        <h3 style="font-size: 15px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--color-primary);">
            <path d="M4 9h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"/>
            <path d="M9 22V9"/>
            <path d="M15 22V9"/>
            <path d="M18 5H6a2 2 0 0 0-2 2v2h16V7a2 2 0 0 0-2-2Z"/>
          </svg>
          Health & Fitness Tracker
        </h3>
        <p style="font-size: 11px; opacity: 0.6; margin-top: 2px;">Track BMI, logged calories, and customized daily workout routines.</p>
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.25); padding: 3px; border-radius: 8px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.04);">
        <button type="button" class="workout-tab-btn ${state.activeWorkoutTab === 'tab-workout-routine' ? 'active' : ''}" data-tab="tab-workout-routine" style="flex: 1; background: ${state.activeWorkoutTab === 'tab-workout-routine' ? 'var(--bg-sidebar)' : 'none'}; border: none; color: ${state.activeWorkoutTab === 'tab-workout-routine' ? '#fff' : 'var(--text-muted)'}; font-size: 11.5px; font-weight: 700; padding: 7px 4px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">Routine</button>
        <button type="button" class="workout-tab-btn ${state.activeWorkoutTab === 'tab-bmi' ? 'active' : ''}" data-tab="tab-bmi" style="flex: 1; background: ${state.activeWorkoutTab === 'tab-bmi' ? 'var(--bg-sidebar)' : 'none'}; border: none; color: ${state.activeWorkoutTab === 'tab-bmi' ? '#fff' : 'var(--text-muted)'}; font-size: 11.5px; font-weight: 700; padding: 7px 4px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">BMI Calc</button>
        <button type="button" class="workout-tab-btn ${state.activeWorkoutTab === 'tab-calorie' ? 'active' : ''}" data-tab="tab-calorie" style="flex: 1; background: ${state.activeWorkoutTab === 'tab-calorie' ? 'var(--bg-sidebar)' : 'none'}; border: none; color: ${state.activeWorkoutTab === 'tab-calorie' ? '#fff' : 'var(--text-muted)'}; font-size: 11.5px; font-weight: 700; padding: 7px 4px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">Calories</button>
      </div>

      <!-- Content Panes -->
      
      <!-- 1. WORKOUT ROUTINE PANE -->
      <div id="tab-workout-routine" class="workout-pane" style="display: ${state.activeWorkoutTab === 'tab-workout-routine' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          
          <!-- Workout Day Selector Tabs -->
          <div class="workout-day-selector" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04); -webkit-overflow-scrolling: touch; width: 100%; box-sizing: border-box;">
            ${workoutDayTabsHtml}
          </div>

          <div class="workout-scroller" style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
            ${dayRoutine.length === 0 ? `
              <div style="text-align: center; padding: 30px 10px; opacity: 0.5; font-size: 12px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; color: var(--text-muted);">
                No exercises scheduled for ${state.selectedWorkoutDay}. Enjoy your rest day!
              </div>
            ` : dayRoutine.map(ex => `
              <div class="workout-item-row ${ex.completed ? 'completed' : ''}" data-id="${ex.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); background: ${ex.completed ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.01)'}; cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 8px; text-align: left; flex: 1; min-width: 0;">
                  <div style="width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid ${ex.completed ? 'var(--color-primary)' : 'rgba(255,255,255,0.25)'}; background: ${ex.completed ? 'var(--color-primary)' : 'transparent'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s;">
                    ${ex.completed ? `
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" style="width: 10px; height: 10px;">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ` : ''}
                  </div>
                  <span class="workout-name-text" style="font-size: 12px; font-weight: 600; text-decoration: ${ex.completed ? 'line-through' : 'none'}; opacity: ${ex.completed ? 0.5 : 1}; color: ${ex.completed ? 'var(--text-muted)' : '#fff'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(ex.name)}
                  </span>
                </div>
                <button type="button" class="workout-delete-btn" data-id="${ex.id}" style="background: none; border: none; color: var(--danger-color); opacity: 0.6; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;">
                  &times;
                </button>
              </div>
            `).join("")}
          </div>
          
          <!-- Add Custom Exercise -->
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <input type="text" id="add-exercise-input" placeholder="Add exercise to ${state.selectedWorkoutDay}..." style="flex: 1; padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff;">
            <button type="button" id="add-exercise-btn" class="primary-btn" style="padding: 0 14px; font-size: 14px; border-radius: 8px; cursor: pointer; height: 35px;">+</button>
          </div>
        </div>
      </div>

      <!-- 2. BMI CALCULATOR PANE -->
      <div id="tab-bmi" class="workout-pane" style="display: ${state.activeWorkoutTab === 'tab-bmi' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
          
          <!-- Height and Weight input rows -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 11px; opacity: 0.8; font-weight: 600;">Height (cm)</label>
              <input type="number" id="calc-height-bmi" value="${state.workoutHeight}" min="50" max="250" style="padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff; width: 100%; box-sizing: border-box;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 11px; opacity: 0.8; font-weight: 600;">Weight (kg)</label>
              <input type="number" id="calc-weight-bmi" value="${state.workoutWeight}" min="30" max="250" style="padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff; width: 100%; box-sizing: border-box;">
            </div>
          </div>

          <!-- BMI Results Display Gauge -->
          <div id="bmi-display-box" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Body Mass Index (BMI)</div>
            <div style="font-size: 32px; font-weight: 800; color: ${bmiColor};">${bmi}</div>
            <div style="font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: ${bmiColor}20; color: ${bmiColor}; border: 1px solid ${bmiColor}30; text-transform: uppercase; letter-spacing: 0.5px;">
              ${bmiCategory}
            </div>
            <span style="font-size: 11px; opacity: 0.7; margin-top: 4px; font-weight: 500; text-align: center;">${bmiDesc}</span>
          </div>

          <!-- Generate Routine Button -->
          <button type="button" id="generate-bmi-routine-btn" class="primary-btn" style="width: 100%; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer;">
            ⚡ Generate BMI-based Workout Routine
          </button>
        </div>
      </div>

      <!-- 3. CALORIE METER PANE -->
      <div id="tab-calorie" class="workout-pane" style="display: ${state.activeWorkoutTab === 'tab-calorie' ? 'block' : 'none'};">
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
          
          <!-- Inputs Grid -->
          <div class="calculator-inputs-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${!state.isAdmin ? `
              <div style="grid-column: span 2; font-size: 10px; color: var(--color-primary); background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.15); padding: 6px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 10px; height: 10px;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Unlock Admin to edit targets</span>
              </div>
            ` : ''}
            <div class="calc-group" style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 11px; opacity: 0.8; font-weight: 600;">Weight (kg)</label>
              <input type="number" id="calc-weight" value="${state.workoutWeight}" min="30" max="250" ${!state.isAdmin ? 'disabled' : ''} style="padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff; width: 100%; box-sizing: border-box; opacity: ${!state.isAdmin ? 0.65 : 1};">
            </div>
            <div class="calc-group" style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 11px; opacity: 0.8; font-weight: 600;">Intake (kcal)</label>
              <input type="number" id="calc-calories" value="${state.workoutCalorieIntake}" min="500" max="8000" ${!state.isAdmin ? 'disabled' : ''} style="padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff; width: 100%; box-sizing: border-box; opacity: ${!state.isAdmin ? 0.65 : 1};">
            </div>
            <div class="calc-group" style="grid-column: span 2; display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 11px; opacity: 0.8; font-weight: 600;">Goal Type</label>
              <select id="calc-goal" ${!state.isAdmin ? 'disabled' : ''} style="padding: 8px 12px; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: #fff; width: 100%; opacity: ${!state.isAdmin ? 0.65 : 1};">
                <option value="lose" ${state.workoutGoal === 'lose' ? 'selected' : ''}>Weight Loss / Deficit Cut</option>
                <option value="maintain" ${state.workoutGoal === 'maintain' ? 'selected' : ''}>Weight Maintenance</option>
                <option value="gain" ${state.workoutGoal === 'gain' ? 'selected' : ''}>Muscle Gain / Surplus Bulk</option>
              </select>
            </div>
          </div>

          <!-- Calorie Progress Meter -->
          <div class="calorie-progress-wrapper" style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.06); padding: 10px 12px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; margin-bottom: 6px;">
              <span>Logged: <strong style="color: var(--color-primary);" id="calc-logged-display">0 kcal</strong></span>
              <span>Target: <strong id="calc-target-display">0 kcal</strong></span>
            </div>
            <div class="meter-bar-outer" style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; position: relative;">
              <div id="calc-meter-fill" style="height: 100%; width: 0%; background: linear-gradient(to right, var(--color-primary), var(--color-accent-purple)); border-radius: 4px; transition: width 0.4s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; opacity: 0.6; margin-top: 6px;">
              <span id="calc-status-text">Intake vs Target status</span>
              <span id="calc-percentage-text">0%</span>
            </div>
          </div>

          <!-- TDEE Results -->
          <div class="calculator-results-box" style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 8px 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11.5px;">
              <div style="padding: 5px 8px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px;">
                <span style="display: block; font-size: 9px; opacity: 0.5; margin-bottom: 2px;">Maintenance (TDEE)</span>
                <strong id="calc-tdee-display">0 kcal</strong>
              </div>
              <div style="padding: 5px 8px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px;">
                <span style="display: block; font-size: 9px; opacity: 0.5; margin-bottom: 2px;">Daily Protein Goal</span>
                <strong id="calc-protein-display">0 g</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- TAB ACTION BINDINGS ---
  const tabs = elements.workoutWidget.querySelectorAll(".workout-tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => {
        b.classList.remove("active");
        b.style.background = "none";
        b.style.color = "var(--text-muted)";
      });
      btn.classList.add("active");
      btn.style.background = "var(--bg-sidebar)";
      btn.style.color = "#fff";
      
      const targetId = btn.getAttribute("data-tab");
      state.activeWorkoutTab = targetId;
      localStorage.setItem("edu_active_workout_tab", targetId);

      elements.workoutWidget.querySelectorAll(".workout-pane").forEach(p => {
        p.style.display = p.id === targetId ? "block" : "none";
      });
    });
  });

  // --- ROUTINE CHECKLIST HANDLERS ---
  const rows = elements.workoutWidget.querySelectorAll(".workout-item-row");
  rows.forEach(row => {
    row.addEventListener("click", (e) => {
      // If they clicked the delete button, skip toggle
      if (e.target.closest(".workout-delete-btn")) return;
      const id = row.getAttribute("data-id");
      const ex = state.workoutRoutine.find(item => item.id === id);
      if (ex) {
        ex.completed = !ex.completed;
        saveState();
        renderWorkoutWidget();
      }
    });
  });

  // Delete exercise
  const deleteBtns = elements.workoutWidget.querySelectorAll(".workout-delete-btn");
  deleteBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      state.workoutRoutine = state.workoutRoutine.filter(item => item.id !== id);
      saveState();
      renderWorkoutWidget();
      showToast("Exercise removed from routine.", "info");
    });
  });

  // Add custom exercise
  const addBtn = elements.workoutWidget.querySelector("#add-exercise-btn");
  const addInput = elements.workoutWidget.querySelector("#add-exercise-input");
  if (addBtn && addInput) {
    const handleAdd = () => {
      const val = addInput.value.trim();
      if (val) {
        state.workoutRoutine.push({
          id: 'custom-' + Date.now(),
          name: val,
          day: state.selectedWorkoutDay,
          completed: false
        });
        saveState();
        renderWorkoutWidget();
        showToast("Custom exercise added!", "success");
      }
    };
    addBtn.addEventListener("click", handleAdd);
    addInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleAdd();
    });
  }

  // --- BMI INPUT SYNC HANDLERS ---
  const heightBmiInput = elements.workoutWidget.querySelector("#calc-height-bmi");
  const weightBmiInput = elements.workoutWidget.querySelector("#calc-weight-bmi");
  if (heightBmiInput && weightBmiInput) {
    const syncBmiInput = () => {
      state.workoutHeight = parseFloat(heightBmiInput.value) || 170;
      state.workoutWeight = parseFloat(weightBmiInput.value) || 70;
      saveState();
      // Reactive widget update
      renderWorkoutWidget();
    };
    heightBmiInput.addEventListener("input", syncBmiInput);
    weightBmiInput.addEventListener("input", syncBmiInput);
  }

  // Generate BMI-based routine
  const genBtn = elements.workoutWidget.querySelector("#generate-bmi-routine-btn");
  if (genBtn) {
    genBtn.addEventListener("click", () => {
      state.workoutRoutine = getDefaultExercisesForBmi(bmiCategory);
      state.activeWorkoutTab = "tab-workout-routine";
      saveState();
      renderWorkoutWidget();
      showToast(`Generated ${bmiCategory} workout split routine!`, "success");
    });
  }

  // --- CALORIE PANE BINDINGS ---
  const weightInput = elements.workoutWidget.querySelector("#calc-weight");
  const caloriesInput = elements.workoutWidget.querySelector("#calc-calories");
  const goalInput = elements.workoutWidget.querySelector("#calc-goal");

  if (weightInput) {
    weightInput.addEventListener("input", () => {
      state.workoutWeight = parseFloat(weightInput.value) || 70;
      saveState();
      calculateCalorieAndWorkoutPlan();
    });
  }
  if (caloriesInput) {
    caloriesInput.addEventListener("input", () => {
      state.workoutCalorieIntake = parseFloat(caloriesInput.value) || 2000;
      saveState();
      calculateCalorieAndWorkoutPlan();
    });
  }
  if (goalInput) {
    goalInput.addEventListener("change", () => {
      state.workoutGoal = goalInput.value;
      saveState();
      calculateCalorieAndWorkoutPlan();
    });
  }

  calculateCalorieAndWorkoutPlan();
}

function calculateCalorieAndWorkoutPlan() {
  const weight = state.workoutWeight || 70;
  const loggedCalories = state.workoutCalorieIntake || 2000;
  const goal = state.workoutGoal;

  const tdee = Math.round(weight * 22 * 1.375);
  let targetCalories = tdee;
  let protein = Math.round(weight * 1.8);

  if (goal === "lose") {
    targetCalories = Math.max(1200, tdee - 500);
    protein = Math.round(weight * 2.2);
  } else if (goal === "maintain") {
    targetCalories = tdee;
    protein = Math.round(weight * 1.8);
  } else if (goal === "gain") {
    targetCalories = tdee + 300;
    protein = Math.round(weight * 2.0);
  }

  // Update DOM elements inside the Calories tab pane
  const loggedEl = document.getElementById("calc-logged-display");
  const targetEl = document.getElementById("calc-target-display");
  const tdeeEl = document.getElementById("calc-tdee-display");
  const proteinEl = document.getElementById("calc-protein-display");
  const fillBar = document.getElementById("calc-meter-fill");
  const pctText = document.getElementById("calc-percentage-text");
  const statusText = document.getElementById("calc-status-text");

  if (loggedEl) loggedEl.textContent = `${loggedCalories} kcal`;
  if (targetEl) targetEl.textContent = `${targetCalories} kcal`;
  if (tdeeEl) tdeeEl.textContent = `${tdee} kcal`;
  if (proteinEl) proteinEl.textContent = `${protein} g`;

  const pct = Math.round((loggedCalories / targetCalories) * 100);
  if (pctText) pctText.textContent = `${pct}%`;
  if (fillBar) fillBar.style.width = `${Math.min(100, pct)}%`;

  if (statusText) {
    if (loggedCalories < targetCalories - 100) {
      statusText.textContent = `Under target by ${targetCalories - loggedCalories} kcal (Caloric Deficit)`;
      statusText.style.color = "#3b82f6";
    } else if (loggedCalories > targetCalories + 100) {
      statusText.textContent = `Over target by ${loggedCalories - targetCalories} kcal (Caloric Surplus)`;
      statusText.style.color = "var(--color-primary)";
    } else {
      statusText.textContent = "Intake target met! Perfect balance.";
      statusText.style.color = "var(--color-accent-green)";
    }
  }
}

// --- RENDER EXPENSES CALCULATOR ---
function renderExpenses() {
  const totalSpentEl = document.getElementById("exp-total-spent");
  const budgetStatusEl = document.getElementById("exp-budget-status");
  const budgetPctEl = document.getElementById("exp-budget-pct");
  const budgetFillEl = document.getElementById("exp-budget-fill");
  const remainingDisplayEl = document.getElementById("exp-remaining-display");
  const categoriesListEl = document.getElementById("exp-categories-list");
  const transactionsBodyEl = document.getElementById("expense-transactions-body");
  const pocketMoneyValEl = document.getElementById("exp-pocket-money-val");
  const pocketMoneyHistoryListEl = document.getElementById("pocket-money-history-list");

  if (!totalSpentEl) return;

  const activeMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Populate active month selector dropdown
  const activeMonthSelectEl = document.getElementById("active-month-select");
  if (activeMonthSelectEl) {
    const currentVal = state.viewingMonth || "active";
    let optionsHtml = `<option value="active">Active (${activeMonthName})</option>`;
    if (state.expenseHistory && state.expenseHistory.length > 0) {
      state.expenseHistory.forEach(hist => {
        optionsHtml += `<option value="${hist.id}">${hist.monthName}</option>`;
      });
    }
    activeMonthSelectEl.innerHTML = optionsHtml;
    activeMonthSelectEl.value = currentVal;

    if (!activeMonthSelectEl.dataset.listenerBound) {
      activeMonthSelectEl.addEventListener("change", (e) => {
        state.viewingMonth = e.target.value;
        saveState();
        renderExpenses();
      });
      activeMonthSelectEl.dataset.listenerBound = "true";
    }
  }

  // Load values based on active vs historical viewing selection
  let displayPocketMoney = state.pocketMoney;
  let expenses = state.expenses || [];
  let isReadOnly = false;

  if (state.viewingMonth && state.viewingMonth !== "active") {
    const hist = state.expenseHistory.find(h => h.id === state.viewingMonth);
    if (hist) {
      displayPocketMoney = hist.pocketMoney || 0;
      expenses = hist.transactions || [];
      isReadOnly = true;
    }
  }

  // Update Pocket Money Display
  if (pocketMoneyValEl) {
    pocketMoneyValEl.textContent = displayPocketMoney.toLocaleString();
  }

  // Toggle controls depending on read-only state
  const addMoneyBtn = document.getElementById("add-money-trigger-btn");
  if (addMoneyBtn) {
    addMoneyBtn.style.display = isReadOnly ? "none" : "flex";
  }

  const addExpenseFormContainer = document.getElementById("add-expense-form");
  if (addExpenseFormContainer) {
    const parentCard = addExpenseFormContainer.closest(".expense-inner-card");
    if (parentCard) {
      let overlay = parentCard.querySelector(".archived-lock-overlay");
      if (isReadOnly) {
        addExpenseFormContainer.style.display = "none";
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.className = "archived-lock-overlay";
          overlay.style.cssText = "padding: 16px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: var(--color-primary); font-size: 11.5px; font-weight: 600; line-height: 1.4;";
          overlay.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 6px;">🔒</div>
            Archived Logs Mode<br>
            <span style="font-size: 10px; font-weight: 400; opacity: 0.6; margin-top: 4px; display: block;">You are viewing a saved monthly log. Switch to Active Month dropdown above to add transactions.</span>
          `;
          parentCard.appendChild(overlay);
        } else {
          overlay.style.display = "block";
        }
      } else {
        addExpenseFormContainer.style.display = "flex";
        if (overlay) overlay.style.display = "none";
      }
    }
  }

  const saveMonthHistoryBtn = document.getElementById("save-month-history-btn");
  if (saveMonthHistoryBtn) {
    const parentDiv = saveMonthHistoryBtn.parentElement;
    if (parentDiv) {
      parentDiv.style.display = isReadOnly ? "none" : "flex";
    }
  }

  function recalculateExpensesSummary() {
    const budgetLimit = displayPocketMoney;
    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = budgetLimit - totalSpent;
    const pct = budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0;

    totalSpentEl.textContent = `${totalSpent.toLocaleString()} BDT`;
    if (budgetPctEl) budgetPctEl.textContent = `${pct}%`;
    if (budgetFillEl) budgetFillEl.style.width = `${Math.min(100, pct)}%`;
    
    if (remaining >= 0) {
      if (remainingDisplayEl) {
        remainingDisplayEl.textContent = `Remaining BDT: ${remaining.toLocaleString()}`;
        remainingDisplayEl.style.color = "var(--text-main)";
      }
      if (budgetStatusEl) {
        budgetStatusEl.textContent = `Budget Limit: ${budgetLimit.toLocaleString()} BDT`;
        budgetStatusEl.style.color = "rgba(255,255,255,0.7)";
      }
    } else {
      if (remainingDisplayEl) {
        remainingDisplayEl.textContent = `Over Budget by: ${Math.abs(remaining).toLocaleString()} BDT`;
        remainingDisplayEl.style.color = "var(--danger-color)";
      }
      if (budgetStatusEl) {
        budgetStatusEl.textContent = "BUDGET LIMIT EXCEEDED!";
        budgetStatusEl.style.color = "var(--danger-color)";
      }
    }
  }

  recalculateExpensesSummary();

  // Render Pocket Money Addition History Logs list
  if (pocketMoneyHistoryListEl) {
    if (state.pocketMoneyHistory.length === 0) {
      pocketMoneyHistoryListEl.innerHTML = `
        <div style="text-align: center; padding: 20px 10px; opacity: 0.5; font-size: 11px;">
          No funds added yet.
        </div>
      `;
    } else {
      pocketMoneyHistoryListEl.innerHTML = [...state.pocketMoneyHistory].reverse().map((item, index) => {
        const realIndex = state.pocketMoneyHistory.length - 1 - index;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(34, 197, 94, 0.04); border: 1px solid rgba(34, 197, 94, 0.1); padding: 8px 12px; border-radius: 8px; font-size: 11.5px; margin: 0;">
            <span style="color: var(--color-accent-green); font-weight: 700;">+ ${item.amount.toLocaleString()} BDT</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="opacity: 0.6; font-size: 10px;">${item.date}</span>
              ${isReadOnly ? '' : `<button type="button" class="fund-delete-btn" onclick="deleteFundRecord(${realIndex})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 14px; padding: 2px; display: flex; align-items: center; justify-content: center; line-height: 1;">&times;</button>`}
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // 4. Render Transaction History Table
  if (transactionsBodyEl) {
    if (expenses.length === 0) {
      transactionsBodyEl.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 24px; opacity: 0.5; font-style: italic;">
            No transactions recorded.
          </td>
        </tr>
      `;
    } else {
      transactionsBodyEl.innerHTML = [...expenses].reverse().map(e => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;">
          <td style="padding: 10px 4px; font-weight: 600; color: #fff;">
            ${escapeHtml(e.desc)}
            <span style="display: block; font-size: 9.5px; opacity: 0.4; font-weight: 400; margin-top: 2px;">${e.date}</span>
          </td>
          <td style="padding: 10px 4px; font-weight: 700; text-align: right; color: var(--color-primary);">${Number(e.amount).toLocaleString()} BDT</td>
          <td style="padding: 10px 4px; text-align: center;">
            ${isReadOnly ? '' : `<button class="delete-expense-btn" data-id="${e.id}" style="background: none; border: none; color: var(--danger-color); opacity: 0.7; font-size: 14px; cursor: pointer; padding: 4px;" title="Delete item">&times;</button>`}
          </td>
        </tr>
      `).join("");

      // Bind delete events
      transactionsBodyEl.querySelectorAll(".delete-expense-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          state.expenses = state.expenses.filter(e => e.id !== id);
          saveState();
          showToast("Expense item deleted.", "info");
          renderExpenses();
        });
      });
    }
  }

  // 5. Render Saved History logs
  renderExpenseHistory();
}

function renderExpenseHistory() {
  const historyListEl = document.getElementById("expense-history-list");
  if (!historyListEl) return;

  const filterEl = document.getElementById("history-month-filter");
  if (filterEl) {
    const currentVal = state.selectedExpenseMonthFilter || "all";
    const calendarMonths = [
      { value: "all", label: "All Months" },
      { value: "January", label: "January" },
      { value: "February", label: "February" },
      { value: "March", label: "March" },
      { value: "April", label: "April" },
      { value: "May", label: "May" },
      { value: "June", label: "June" },
      { value: "July", label: "July" },
      { value: "August", label: "August" },
      { value: "September", label: "September" },
      { value: "October", label: "October" },
      { value: "November", label: "November" },
      { value: "December", label: "December" }
    ];

    let optionsHtml = "";
    calendarMonths.forEach(m => {
      optionsHtml += `<option value="${m.value}">${m.label}</option>`;
    });
    filterEl.innerHTML = optionsHtml;
    filterEl.value = currentVal;

    if (!filterEl.dataset.listenerBound) {
      filterEl.addEventListener("change", (e) => {
        state.selectedExpenseMonthFilter = e.target.value;
        saveState();
        renderExpenseHistory();
      });
      filterEl.dataset.listenerBound = "true";
    }
  }

  if (!state.expenseHistory || state.expenseHistory.length === 0) {
    historyListEl.innerHTML = `
      <p style="text-align: center; opacity: 0.5; font-size: 12px; font-style: italic; margin: 10px 0;">
        No saved monthly history logs.
      </p>
    `;
    return;
  }

  // Filter history based on selected month dropdown (case-insensitive substring match)
  const filterMonth = state.selectedExpenseMonthFilter || "all";
  const filteredHistory = filterMonth === "all" 
    ? state.expenseHistory 
    : state.expenseHistory.filter(h => h.monthName.toLowerCase().includes(filterMonth.toLowerCase()));

  if (filteredHistory.length === 0) {
    historyListEl.innerHTML = `
      <p style="text-align: center; opacity: 0.5; font-size: 12px; font-style: italic; margin: 10px 0;">
        No saved history logs match the selected month filter.
      </p>
    `;
    return;
  }

  historyListEl.innerHTML = filteredHistory.map(hist => {
    const hasTransactions = hist.transactions && hist.transactions.length > 0;
    return `
      <div class="history-log-card" style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; padding: 12px; transition: all 0.2s;">
        <!-- Header summary -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; cursor: pointer;" class="history-header" data-id="${hist.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; color: var(--color-primary);">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <strong style="font-size: 13px; color: #fff;">${escapeHtml(hist.monthName)}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 11.5px;">
            <span>Allowance: <strong>${Number(hist.pocketMoney).toLocaleString()} BDT</strong></span>
            <span>Spent: <strong style="color: var(--color-primary);">${Number(hist.totalSpent).toLocaleString()} BDT</strong></span>
            <span style="color: ${hist.remaining >= 0 ? 'var(--color-accent-green)' : 'var(--danger-color)'}; font-weight: 600;">
              ${hist.remaining >= 0 ? 'Remaining: ' : 'Over: '}<strong>${Math.abs(hist.remaining).toLocaleString()} BDT</strong>
            </span>
            <button class="delete-history-btn sec-btn" data-id="${hist.id}" style="font-size: 10.5px; padding: 2px 6px; border-color: rgba(225,29,72,0.25); background: rgba(225,29,72,0.03); color: var(--danger-color); height: 22px; line-height: 1;">Delete</button>
          </div>
        </div>

        <!-- Nested transactions (collapsible) -->
        <div class="history-details" id="details-${hist.id}" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.06); font-size: 11.5px;">
          ${hasTransactions ? `
            <table style="width: 100%; text-align: left; border-collapse: collapse;">
              <thead>
                <tr style="opacity: 0.5; font-size: 10px; text-transform: uppercase;">
                  <th style="padding: 4px;">Item</th>
                  <th style="padding: 4px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${hist.transactions.map(t => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <td style="padding: 6px 4px; color: #fff;">${escapeHtml(t.desc)}</td>
                    <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: var(--color-primary);">${Number(t.amount).toLocaleString()} BDT</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : '<p style="opacity: 0.5; text-align: center; margin: 5px 0;">No transactions recorded for this month.</p>'}
        </div>
      </div>
    `;
  }).join("");

  // Bind expand click listeners
  historyListEl.querySelectorAll(".history-header").forEach(hdr => {
    hdr.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-history-btn")) return;
      const id = hdr.getAttribute("data-id");
      const details = document.getElementById(`details-${id}`);
      if (details) {
        const isHidden = details.style.display === "none";
        details.style.display = isHidden ? "block" : "none";
        hdr.closest(".history-log-card").style.background = isHidden ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)";
      }
    });
  });

  // Bind delete history click listeners
  historyListEl.querySelectorAll(".delete-history-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this monthly history record?")) {
        state.expenseHistory = state.expenseHistory.filter(h => h.id !== id);
        saveState();
        showToast("History record deleted.", "info");
        renderExpenseHistory();
      }
    });
  });
}

// --- PWA INSTALL PROMPT HANDLER ---
let deferredPrompt = null;

function setupPwaInstall() {
  const banner = document.getElementById("pwa-install-banner");
  const installBtn = document.getElementById("pwa-install-btn");
  const cancelBtn = document.getElementById("pwa-cancel-btn");
  const closeBtn = document.getElementById("pwa-close-btn");
  const iosInstructions = document.getElementById("pwa-ios-instructions");

  if (!banner) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isDismissed = localStorage.getItem("edu_pwa_dismissed") === "true";

  if (isDismissed) return;

  function showBanner() {
    banner.style.display = "flex";
    setTimeout(() => {
      banner.style.transform = "translateY(0)";
    }, 100);
  }

  function hideBanner() {
    banner.style.transform = "translateY(120%)";
    setTimeout(() => {
      banner.style.display = "none";
    }, 400);
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showBanner, 3000);
  });

  if (isIOS && !window.navigator.standalone) {
    if (installBtn) {
      installBtn.textContent = "How to Install";
      installBtn.addEventListener("click", () => {
        iosInstructions.style.display = "block";
        installBtn.style.display = "none";
      });
    }
    setTimeout(showBanner, 3000);
  }

  if (installBtn && !isIOS) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      hideBanner();
    });
  }

  [cancelBtn, closeBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        hideBanner();
        localStorage.setItem("edu_pwa_dismissed", "true");
        setTimeout(() => {
          localStorage.removeItem("edu_pwa_dismissed");
        }, 3 * 24 * 60 * 60 * 1000);
      });
    }
  });

  window.addEventListener("appinstalled", () => {
    hideBanner();
    deferredPrompt = null;
  });
}

// Start application
window.addEventListener("DOMContentLoaded", init);
