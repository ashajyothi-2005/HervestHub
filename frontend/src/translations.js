// HarvestHub Comprehensive Bilingual Translations Dictionary (English <-> Telugu)

export const translations = {
  en: {
    // App Branding
    brand_name: "HarvestHub",
    brand_tagline: "AI-Powered Bilingual Agricultural Platform",
    brand_sub: "Bridging Farmers & Agricultural Labour with Machine Learning",

    // Navigation & Roles
    nav_dashboard: "Dashboard",
    nav_forecasts: "Market & Labour",
    nav_create_job: "Create Job",
    nav_find_workers: "Find Workers",
    nav_find_jobs: "Find Jobs",
    nav_recommended_jobs: "Recommended Jobs",
    nav_disease_detect: "Plant Disease AI",
    nav_my_jobs: "My Jobs",
    nav_applications: "Applications",
    nav_profile: "Profile",
    nav_notifications: "Notifications",

    role_farmer: "Farmer Mode",
    role_worker: "Worker Mode",
    role_switch_to_worker: "Switch to Worker",
    role_switch_to_farmer: "Switch to Farmer",
    role_farmer_subtitle: "Manage jobs, forecast wages & labour, detect crop diseases",
    role_worker_subtitle: "Discover high-match farm jobs, compare wages & apply",

    // Common Buttons & Actions
    btn_predict_wage: "Predict Market Wage",
    btn_predict_demand: "Forecast Labour Demand",
    btn_find_matches: "Match Suitable Workers",
    btn_post_job: "Post Agricultural Job",
    btn_apply_now: "Apply for Job",
    btn_applied: "Applied",
    btn_accept: "Accept",
    btn_reject: "Decline",
    btn_contact: "Contact Worker",
    btn_upload_leaf: "Upload Leaf Image",
    btn_diagnose: "Analyze Disease with AI",
    btn_try_sample: "Try Sample Leaf",
    btn_save_profile: "Save Profile",
    btn_filter: "Apply Filters",
    btn_clear_filter: "Reset Filters",
    btn_close: "Close",
    btn_details: "View Details",
    btn_invite: "Send Work Invitation",
    btn_back_to_dashboard: "Back to Dashboard",
    btn_mark_all_read: "Mark all as read",

    // Labels & Form Fields
    lbl_crop_type: "Crop Type",
    lbl_required_skill: "Required Skill",
    lbl_workers_needed: "Number of Workers Needed",
    lbl_district: "Region / District",
    lbl_location: "Village / Town",
    lbl_mandi_season: "Mandi Season",
    lbl_weather_condition: "Weather Condition",
    lbl_job_date: "Job Date",
    lbl_experience_req: "Required Experience (Years)",
    lbl_offered_wage: "Farmer Offered Wage (₹ / Day)",
    lbl_expected_wage: "Expected Wage (₹ / Day)",
    lbl_job_description: "Job Description & Field Details",
    lbl_worker_name: "Worker Name",
    lbl_farmer_name: "Farmer Name",
    lbl_primary_skills: "Primary Skills",
    lbl_distance: "Distance",
    lbl_rating: "Historical Rating",
    lbl_status: "Status",
    lbl_matching_score: "Matching Score",
    lbl_predicted_wage: "Predicted Market Wage",
    lbl_predicted_demand: "Predicted Labour Demand",
    lbl_historical_demanded: "Historical Labour Demanded",
    lbl_historical_supplied: "Historical Labour Supplied",
    lbl_active_jobs: "Active Jobs",
    lbl_available_workers: "Available Workers",
    lbl_total_applications: "Applications",
    lbl_compatibility: "Compatibility",
    lbl_why_match: "Why this match is suitable",
    lbl_phone: "Phone Number",
    lbl_total_jobs_done: "Jobs Completed",
    lbl_acceptance_rate: "Acceptance Rate",
    lbl_acres: "Land Area (Acres)",
    settings_language: "Settings · Language",
    hiring_pending: "Pending",
    hiring_accepted: "Accepted",
    hiring_rejected: "Rejected",
    hiring_accept_prompt: "Are you interested in this job?",
    hiring_worker_details: "Worker details",

    // Plant Disease Detection
    disease_title: "Plant & Crop Disease AI Diagnostic",
    disease_sub: "Upload a crop leaf photograph to identify disease and obtain ICAR-aligned management recommendations.",
    disease_supported_crops: "Supported Crops: Paddy, Chilli, Cotton, Sugarcane, Wheat",
    disease_upload_box: "Drag & drop leaf photo here, or click to browse",
    disease_upload_hint: "Supports JPG, PNG, WEBP leaf close-up photos",
    disease_detected_crop: "Detected Crop",
    disease_detected_name: "Detected Condition / Disease",
    disease_confidence: "AI Confidence Score",
    disease_symptoms: "Symptoms & Clinical Signs",
    disease_precautions: "Precautions & Field Management",
    disease_treatment: "Recommended Treatment & Pesticide Info",
    disease_healthy_msg: "Crop is in healthy state! No chemical fungicide/pesticide needed.",
    disease_quick_samples: "Quick Test Sample Leaves:",

    // Dashboard Farmer Summaries
    dash_farmer_title: "Farmer Command Center",
    dash_farmer_sub: "Smart agricultural labour management, real-time wage intelligence, and AI disease care.",
    stat_active_jobs: "Active Job Listings",
    stat_workers_available: "Workers Available Near You",
    stat_market_wage_avg: "Current Market Wage",
    stat_labour_demand: "Avg Regional Demand",
    stat_pending_apps: "New Applications",

    // Dashboard Worker Summaries
    dash_worker_title: "Agricultural Worker Dashboard",
    dash_worker_sub: "Find well-paying farm jobs that match your exact skillset and location.",
    stat_matched_jobs: "Jobs Matching Your Skills",
    stat_total_jobs: "Available Jobs in Region",
    stat_my_applications: "My Applications",
    stat_worker_rating: "Your Worker Rating",

    // Modals and Alerts
    alert_wage_calculated: "Market wage calculated using Machine Learning Regressor based on seasonal and district trends.",
    alert_demand_calculated: "Labour demand forecasted for next week based on regional supply-demand metrics.",
    alert_matching_success: "Worker matching model computed compatibility using geospatial distance, ratings, and skills.",
    msg_job_posted_success: "Agricultural job post created successfully!",
    msg_application_sent: "Application submitted to farmer successfully!",
    msg_status_updated: "Application status updated successfully.",
    msg_profile_saved: "Profile updated successfully.",
    server_online: "ML Server Online",
    server_offline: "ML Server Connecting...",

    // Empty States
    empty_no_jobs: "No agricultural jobs found matching your filter criteria.",
    empty_no_applications: "No worker applications received yet.",
    empty_no_notifications: "You are all caught up! No unread notifications.",
    empty_no_workers: "No workers currently available in this filter.",

    // Crops
    crop_paddy: "Paddy (Rice)",
    crop_sugarcane: "Sugarcane",
    crop_chilli: "Chilli",
    crop_cotton: "Cotton",
    crop_wheat: "Wheat",

    // Mandi Seasons
    season_kharif: "Kharif (Monsoon)",
    season_rabi: "Rabi (Winter)",
    season_zaid: "Zaid (Summer)",

    // Districts
    district_guntur: "Guntur District",
    district_kurnool: "Kurnool District",
    district_chittoor: "Chittoor Region",
    district_anantapur: "Anantapur District",
    district_east_godavari: "East Godavari",

    // Weather Conditions
    weather_sunny: "Sunny / Dry",
    weather_moderate_rain: "Moderate Rainfall",
    weather_heavy_rain: "Heavy Rain Alert",
    weather_heatwave: "Extreme Heatwave",

    // Skills
    skill_harvesting: "Harvesting",
    skill_seeding: "Seeding / Sowing",
    skill_pruning: "Pruning / Trimming",
    skill_pesticide_spraying: "Pesticide Spraying",
    skill_irrigation_setup: "Irrigation Setup",
    skill_tractor_driving: "Tractor Driving",

    // Matching details
    match_high: "High Compatibility",
    match_moderate: "Moderate Compatibility",
    match_low: "Low Compatibility",
    per_day: "/ day",
    workers_unit: "Workers",
    years_unit: "yrs exp",
    km_away: "km away"
  },

  te: {
    // App Branding
    brand_name: "హార్వెస్ట్ హబ్ (HarvestHub)",
    brand_tagline: "ఏఐ ఆధారిత ద్విభాషా వ్యవసాయ వేదిక",
    brand_sub: "మెషిన్ లెర్నింగ్ తో రైతులు మరియు వ్యవసాయ కూలీల అనుసంధానం",

    // Navigation & Roles
    nav_dashboard: "డ్యాష్‌బోర్డ్",
    nav_forecasts: "మార్కెట్ కూలీ & కూలీల అవసరం",
    nav_create_job: "పనిని సృష్టించండి",
    nav_find_workers: "కూలీలను వెతకండి",
    nav_find_jobs: "పనులను వెతకండి",
    nav_recommended_jobs: "సిఫార్సు చేయబడిన పనులు",
    nav_disease_detect: "పంట తెగుళ్ల గుర్తింపు (AI)",
    nav_my_jobs: "నా పనులు",
    nav_applications: "దరఖాస్తులు",
    nav_profile: "నా ప్రొఫైల్",
    nav_notifications: "నోటిఫికేషన్లు",

    role_farmer: "రైతు విభాగం (Farmer)",
    role_worker: "వ్యవసాయ కార్మికుడు (Worker)",
    role_switch_to_worker: "కార్మికుడిగా మారండి",
    role_switch_to_farmer: "రైతుగా మారండి",
    role_farmer_subtitle: "పనుల నిర్వహణ, మార్కెట్ కూలీ & కార్మికుల అవసరాల అంచనా, తెగుళ్ల గుర్తింపు",
    role_worker_subtitle: "నైపుణ్యానికి తగిన పనులను కనుగొనండి, కూలీ పోల్చండి మరియు దరఖాస్తు చేయండి",

    // Common Buttons & Actions
    btn_predict_wage: "మార్కెట్ కూలీ అంచనా వేయండి",
    btn_predict_demand: "కార్మికుల డిమాండ్ అంచనా",
    btn_find_matches: "సరిపడే కూలీలను వెతకండి",
    btn_post_job: "వ్యవసాయ పనిని పోస్ట్ చేయండి",
    btn_apply_now: "పనికి దరఖాస్తు చేసుకోండి",
    btn_applied: "దరఖాస్తు చేశారు",
    btn_accept: "ఆమోదించండి",
    btn_reject: "తిరస్కరించండి",
    btn_contact: "కార్మికుడిని సంప్రదించండి",
    btn_upload_leaf: "ఆకు ఫోటో అప్‌లోడ్ చేయండి",
    btn_diagnose: "AI తో తెగులు విశ్లేషించండి",
    btn_try_sample: "నమూనా ఆకును పరీక్షించండి",
    btn_save_profile: "ప్రొఫైల్ సేవ్ చేయండి",
    btn_filter: "ఫిల్టర్లు వర్తింపజేయండి",
    btn_clear_filter: "ఫిల్టర్లు తొలగించండి",
    btn_close: "మూసివేయండి",
    btn_details: "పూర్తి వివరాలు",
    btn_invite: "పనికి ఆహ్వానించండి",
    btn_back_to_dashboard: "డ్యాష్‌బోర్డ్‌కు వెళ్లండి",
    btn_mark_all_read: "అన్నీ చదివినట్లు గుర్తించండి",

    // Labels & Form Fields
    lbl_crop_type: "పంట రకం",
    lbl_required_skill: "అవసరమైన నైపుణ్యం",
    lbl_workers_needed: "అవసరమైన కూలీల సంఖ్య",
    lbl_district: "ప్రాంతం / జిల్లా",
    lbl_location: "గ్రామం / పట్టణం",
    lbl_mandi_season: "మండి ఋతువు (సీజన్)",
    lbl_weather_condition: "వాతావరణ పరిస్థితి",
    lbl_job_date: "పని ప్రారంభ తేదీ",
    lbl_experience_req: "కావలసిన అనుభవం (సంవత్సరాలు)",
    lbl_offered_wage: "రైతు ఆఫర్ చేసే కూలీ (రోజుకు ₹)",
    lbl_expected_wage: "ఆశించే కూలీ (రోజుకు ₹)",
    lbl_job_description: "పని మరియు పొలం వివరాలు",
    lbl_worker_name: "కార్మికుని పేరు",
    lbl_farmer_name: "రైతు పేరు",
    lbl_primary_skills: "ప్రధాన నైపుణ్యాలు",
    lbl_distance: "దూరం",
    lbl_rating: "రేటింగ్",
    lbl_status: "స్థితి",
    lbl_matching_score: "సరిపోలిక స్కోరు (Matching Score)",
    lbl_predicted_wage: "అంచనా వేసిన మార్కెట్ కూలీ",
    lbl_predicted_demand: "అంచనా వేసిన కూలీల డిమాండ్",
    lbl_historical_demanded: "గతంలో అవసరమైన కూలీలు",
    lbl_historical_supplied: "గతంలో లభించిన కూలీలు",
    lbl_active_jobs: "యాక్టివ్ పనులు",
    lbl_available_workers: "అందుబాటులో ఉన్న కూలీలు",
    lbl_total_applications: "వచ్చిన దరఖాస్తులు",
    lbl_compatibility: "అనుకూలత",
    lbl_why_match: "ఈ పని ఎందుకు సరిపోతుంది",
    lbl_phone: "ఫోన్ నంబర్",
    lbl_total_jobs_done: "పూర్తి చేసిన పనులు",
    lbl_acceptance_rate: "ఆమోద రేటు",
    lbl_acres: "భూమి విస్తీర్ణం (ఎకరాలు)",
    settings_language: "సెట్టింగ్‌లు · భాష",
    hiring_pending: "పెండింగ్",
    hiring_accepted: "అంగీకరించారు",
    hiring_rejected: "తిరస్కరించారు",
    hiring_accept_prompt: "ఈ పని చేయడానికి ఆసక్తిగా ఉన్నారా?",
    hiring_worker_details: "కార్మికుని వివరాలు",

    // Plant Disease Detection
    disease_title: "మొక్కలు & పంట తెగుళ్ల AI నిర్ధారణ",
    disease_sub: "పంట ఆకు ఫోటోను అప్‌లోడ్ చేసి తెగులును గుర్తించండి మరియు శాస్త్రీయ నివారణ మార్గదర్శకాలను పొందండి.",
    disease_supported_crops: "మద్దతు ఉన్న పంటలు: వరి, మిరప, పత్తి, చెరకు, గోధుమ",
    disease_upload_box: "ఆకు ఫోటోను ఇక్కడ లాగి వదలండి లేదా ఫైల్ ఎంచుకోండి",
    disease_upload_hint: "JPG, PNG, WEBP ఫార్మాట్లలో స్పష్టమైన ఆకు ఫోటోను అప్‌లోడ్ చేయండి",
    disease_detected_crop: "గుర్తించిన పంట",
    disease_detected_name: "గుర్తించిన తెగులు / వ్యాధి",
    disease_confidence: "AI విశ్వసనీయత స్కోరు",
    disease_symptoms: "తెగులు లక్షణాలు",
    disease_precautions: "జాగ్రత్తలు & క్షేత్ర నిర్వహణ",
    disease_treatment: "సిఫార్సు చేయబడిన నివారణ & పురుగుమందుల సమాచారం",
    disease_healthy_msg: "పంట ఆరోగ్యకరంగా ఉంది! ఎలాంటి పురుగుమందులు అవసరం లేదు.",
    disease_quick_samples: "పరీక్షించడానికి నమూనా ఆకులు:",

    // Dashboard Farmer Summaries
    dash_farmer_title: "రైతు డ్యాష్‌బోర్డ్",
    dash_farmer_sub: "స్మార్ట్ కూలీల నిర్వహణ, రియల్-టైమ్ కూలీ రేట్లు మరియు AI పంట రక్షణ.",
    stat_active_jobs: "మీ యాక్టివ్ పనులు",
    stat_workers_available: "సమీపంలోని కూలీలు",
    stat_market_wage_avg: "ప్రస్తుత మార్కెట్ కూలీ",
    stat_labour_demand: "ప్రాంతీయ కూలీల అవసరం",
    stat_pending_apps: "కొత్త దరఖాస్తులు",

    // Dashboard Worker Summaries
    dash_worker_title: "వ్యవసాయ కార్మికుని డ్యాష్‌బోర్డ్",
    dash_worker_sub: "మీ నైపుణ్యాలు మరియు ప్రాంతానికి తగిన మంచి కూలీ ఇచ్చే పనులను కనుగొనండి.",
    stat_matched_jobs: "మీకు తగిన పనులు",
    stat_total_jobs: "ప్రాంతంలో మొత్తం పనులు",
    stat_my_applications: "నా దరఖాస్తులు",
    stat_worker_rating: "మీ కార్మికుడి రేటింగ్",

    // Modals and Alerts
    alert_wage_calculated: "సీజన్ మరియు ప్రాంతీయ పరిస్థితుల ఆధారంగా ML మోడల్ ద్వారా మార్కెట్ కూలీ అంచనా వేయబడింది.",
    alert_demand_calculated: "ప్రాంతీయ సరఫరా-డిమాండ్ గణాంకాల ఆధారంగా వచ్చే వారానికి కూలీల అవసరం అంచనా వేయబడింది.",
    alert_matching_success: "దూరం, రేటింగ్స్ మరియు నైపుణ్యాల ఆధారంగా వర్కర్ మ్యాచింగ్ స్కోరు లెక్కించబడింది.",
    msg_job_posted_success: "వ్యవసాయ పని విజయవంతంగా పోస్ట్ చేయబడింది!",
    msg_application_sent: "రైతుకు మీ దరఖాస్తు విజయవంతంగా పంపబడింది!",
    msg_status_updated: "దరఖాస్తు స్థితి నవీకరించబడింది.",
    msg_profile_saved: "ప్రొఫైల్ విజయవంతంగా భద్రపరచబడింది.",
    server_online: "ML సర్వర్ సిద్ధంగా ఉంది",
    server_offline: "ML సర్వర్ అనుసంధానమవుతోంది...",

    // Empty States
    empty_no_jobs: "ఎంచుకున్న ఫిల్టర్లకు తగిన పనులేవీ కనుగొనబడలేదు.",
    empty_no_applications: "ఇంకా ఎలాంటి దరఖాస్తులు రాలేదు.",
    empty_no_notifications: "కొత్త నోటిఫికేషన్లు ఏవీ లేవు.",
    empty_no_workers: "ఈ విభాగంలో ప్రస్తుతం కూలీలు అందుబాటులో లేరు.",

    // Crops
    crop_paddy: "వరి (Paddy)",
    crop_sugarcane: "చెరకు (Sugarcane)",
    crop_chilli: "మిరప (Chilli)",
    crop_cotton: "పత్తి (Cotton)",
    crop_wheat: "గోధుమ (Wheat)",

    // Mandi Seasons
    season_kharif: "ఖరీఫ్ (Kharif)",
    season_rabi: "రబీ (Rabi)",
    season_zaid: "జైద్ (Zaid)",

    // Districts
    district_guntur: "గుంటూరు జిల్లా (Guntur)",
    district_kurnool: "కర్నూలు జిల్లా (Kurnool)",
    district_chittoor: "చిత్తూరు ప్రాంతం (Chittoor)",
    district_anantapur: "అనంతపురం జిల్లా (Anantapur)",
    district_east_godavari: "తూర్పు గోదావరి (East Godavari)",

    // Weather Conditions
    weather_sunny: "ఎండగా / పొడిగా (Sunny / Dry)",
    weather_moderate_rain: "మోస్తరు వర్షం (Moderate Rain)",
    weather_heavy_rain: "భారీ వర్ష సూచన (Heavy Rain Alert)",
    weather_heatwave: "తీవ్రమైన వడగాల్పులు (Heatwave)",

    // Skills
    skill_harvesting: "కోత కోయడం (Harvesting)",
    skill_seeding: "విత్తనాలు నాటడం (Seeding)",
    skill_pruning: "కత్తిరింపు / కత్తిరించడం (Pruning)",
    skill_pesticide_spraying: "పురుగుమందుల పిచికారీ (Spraying)",
    skill_irrigation_setup: "నీటిపారుదల వ్యవస్థాపన (Irrigation)",
    skill_tractor_driving: "ట్రాక్టర్ నడపడం (Tractor Driving)",

    // Matching details
    match_high: "అత్యధిక అనుకూలత",
    match_moderate: "మధ్యస్థ అనుకూలత",
    match_low: "తక్కువ అనుకూలత",
    per_day: "/ రోజుకు",
    workers_unit: "మంది కూలీలు",
    years_unit: "సం. అనుభవం",
    km_away: "కి.మీ దూరం"
  }
};

// ============================================================
// CRITICAL TRANSLATION MAPPINGS FOR ML DATA INTEGRITY
// Telugu is for UI display only; original English is preserved
// ============================================================

export const CROPS = [
  { value: "Paddy", labelKey: "crop_paddy", icon: "🌾" },
  { value: "Sugarcane", labelKey: "crop_sugarcane", icon: "🎋" },
  { value: "Chilli", labelKey: "crop_chilli", icon: "🌶️" },
  { value: "Cotton", labelKey: "crop_cotton", icon: "☁️" },
  { value: "Wheat", labelKey: "crop_wheat", icon: "🍞" }
];

export const MANDI_SEASONS = [
  { value: "Kharif", labelKey: "season_kharif" },
  { value: "Rabi", labelKey: "season_rabi" },
  { value: "Zaid", labelKey: "season_zaid" }
];

export const DISTRICTS = [
  { value: "Guntur District", labelKey: "district_guntur" },
  { value: "Kurnool District", labelKey: "district_kurnool" },
  { value: "East Godavari", labelKey: "district_east_godavari" },
  { value: "Chittoor Region", labelKey: "district_chittoor" },
  { value: "Anantapur District", labelKey: "district_anantapur" }
];

export const AP_DISTRICTS = [
  'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
  'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna',
  'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam',
  'Sri Potti Sriramulu Nellore', 'Sri Sathya Sai', 'Srikakulam', 'Tirupati',
  'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'
];

export const WEATHER_CONDITIONS = [
  { value: "Sunny / Dry", labelKey: "weather_sunny", icon: "☀️" },
  { value: "Moderate Rainfall", labelKey: "weather_moderate_rain", icon: "🌦️" },
  { value: "Heavy Rain Alert", labelKey: "weather_heavy_rain", icon: "⛈️" },
  { value: "Extreme Heatwave", labelKey: "weather_heatwave", icon: "🔥" }
];

export const SKILLS = [
  { value: "Harvesting", labelKey: "skill_harvesting", icon: "🌾" },
  { value: "Seeding", labelKey: "skill_seeding", icon: "🌱" },
  { value: "Pruning", labelKey: "skill_pruning", icon: "✂️" },
  { value: "Pesticide Spraying", labelKey: "skill_pesticide_spraying", icon: "🧪" },
  { value: "Irrigation Setup", labelKey: "skill_irrigation_setup", icon: "💧" },
  { value: "Tractor Driving", labelKey: "skill_tractor_driving", icon: "🚜" }
];

export function getCropDisplay(cropValue, lang = "en") {
  const item = CROPS.find(c => c.value.toLowerCase() === (cropValue || "").toLowerCase());
  if (item) {
    return translations[lang]?.[item.labelKey] || item.value;
  }
  return cropValue;
}

export function getDistrictDisplay(districtValue, lang = "en") {
  const item = DISTRICTS.find(d => d.value.toLowerCase() === (districtValue || "").toLowerCase());
  if (item) {
    return translations[lang]?.[item.labelKey] || item.value;
  }
  return districtValue;
}

export function getSkillDisplay(skillValue, lang = "en") {
  if (!skillValue) return "";
  const parts = skillValue.split(",").map(s => s.trim());
  return parts.map(p => {
    const item = SKILLS.find(s => s.value.toLowerCase() === p.toLowerCase());
    return item ? (translations[lang]?.[item.labelKey] || item.value) : p;
  }).join(", ");
}

export function getSeasonDisplay(seasonValue, lang = "en") {
  const item = MANDI_SEASONS.find(s => s.value.toLowerCase() === (seasonValue || "").toLowerCase());
  if (item) {
    return translations[lang]?.[item.labelKey] || item.value;
  }
  return seasonValue;
}

export function getWeatherDisplay(weatherValue, lang = "en") {
  const item = WEATHER_CONDITIONS.find(w => w.value.toLowerCase() === (weatherValue || "").toLowerCase());
  if (item) {
    return translations[lang]?.[item.labelKey] || item.value;
  }
  return weatherValue;
}
