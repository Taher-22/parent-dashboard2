// Translation dictionary. Add new keys here and they're available everywhere
// via the `t(key)` function from useLang(). Falls back to English when a
// translation is missing, then to the key itself.
//
// Keep keys snake_case_with_underscores so they're easy to scan.

export const STRINGS = {
  /* =========================
     ENGLISH
  ========================= */
  en: {
    // Brand
    brand:             "NeuroQuest",
    brand_subtitle:    "Parent Dashboard",

    // Nav / pages
    nav_overview:      "Overview",
    nav_time:          "Time",
    nav_time_control:  "Time Control",
    nav_subjects:      "Subjects",
    nav_answers:       "Answers",
    nav_reports:       "Reports",
    nav_messages:      "Messages",
    nav_ai:            "AI",
    nav_ai_helper:     "AI Helper",
    nav_admin:         "Analytics",
    nav_download:      "Download",
    nav_logout:        "Logout",

    // Common buttons
    btn_save:          "Save",
    btn_cancel:        "Cancel",
    btn_close:         "Close",
    btn_add:           "Add",
    btn_add_child:     "Add Child",
    btn_create:        "Create",
    btn_creating:      "Creating…",
    btn_delete:        "Delete",
    btn_edit:          "Edit",
    btn_refresh:       "Refresh",
    btn_send:          "Send",
    btn_login:         "Login",
    btn_register:      "Register",
    btn_print:         "Print / Save PDF",
    btn_save_pdf:      "Save PDF",
    btn_resume:        "Resume",
    btn_stop_play:     "Stop Play",
    btn_unlock:        "Unlock",

    // Status badges
    status_online:        "Online",
    status_offline:       "Offline",
    status_stopped:       "Stopped",
    status_in_game:       "In game",
    status_in_main_menu:  "In Main Menu",
    status_playing:       "Playing",
    status_loading:       "Loading…",
    status_no_child:      "No child selected",

    // Theme switcher
    theme_light:       "Light",
    theme_special:     "Special",

    // Auth pages
    auth_email:        "Email",
    auth_password:     "Password",
    auth_have_account: "Already have an account?",
    auth_new_account:  "Don't have an account yet?",

    // Add Child modal
    add_child_title:   "New Child",
    child_name:        "Child's name",
    child_code_label:  "Game Access Code",
    child_code_hint:   "Give this code to your child to link their game account.",

    // Overview
    overview_title:        "Overview",
    overview_subtitle:     "Snapshot of today's activity and progress",
    kpi_play_time:         "Play time",
    kpi_today_focus:       "Today Focus Minutes",
    kpi_sessions:          "Sessions",
    kpi_accuracy:          "Accuracy",
    kpi_avg_mastery:       "Avg mastery",
    kpi_best_score:        "Best score",
    kpi_top_subject:       "Top subject",
    kpi_coins:             "Coins",

    // Subjects
    subjects_title:        "Subjects",
    subject_mastery:       "Subject Mastery",
    mastery_strong:        "Strong",
    mastery_progressing:   "Progressing",
    mastery_needs_focus:   "Needs focus",
    no_subjects_yet:       "No subjects played yet — values appear here once they start the game.",

    // Reports
    reports_title:         "Reports",
    reports_subtitle:      "Progress report — print or save as PDF using your browser.",
    coin_balance:          "Coin balance",
    overall_accuracy:      "Overall accuracy",
    section_strengths:     "Strengths & focus",
    section_strength:      "Strength",
    section_focus:         "Focus area",
    section_mistakes:      "Common mistakes",
    section_recent:        "Recent sessions",
    section_7day:          "7-day activity",
    section_scorecard:     "Subject scorecard",
    correct_answer_was:    "Correct answer",
    times_repeated:        "times",

    // Answers tab
    answers_title:         "Answers",
    answers_filter_all:    "All",
    answers_filter_right:  "Correct",
    answers_filter_wrong:  "Wrong",
    answers_filter_timed:  "Timed Out",
    answers_correct:       "CORRECT",
    answers_wrong:         "WRONG",
    answers_timed_out:     "TIMED OUT",
    answers_no_answer:     "No answer given",

    // Time control
    time_control_title:    "Time Control",
    time_daily_limit:      "Daily limit",
    time_session_length:   "Session length",
    time_break:            "Break",
    time_allowed_from:     "Allowed from",
    time_allowed_to:       "Allowed to",
    time_bedtime:          "Bedtime block",
    minutes:               "min",

    // AI Helper
    ai_title:              "AI Helper",
    ai_context_no_child:   "No child selected",
    ai_context_for:        "Context",
    ai_placeholder:        "Ask anything about NeuroQuest…",
    ai_thinking:           "Thinking…",
    ai_failed:             "AI request failed. Try again in a moment.",

    // Messages
    messages_title:        "Messages",
    messages_send_to:      "Send a message",

    // Misc
    last_played:           "last played",
    last_seen:             "last seen",
    just_now:              "just now",
    ago_m:                 "m ago",
    ago_h:                 "h ago",
    ago_d:                 "d ago",
    language_label:        "Language",

    // Overview extras
    parent_overview:       "Parent Overview",
    overview_tagline:      "Time, progress patterns, mastery, and support signals.",
    badge_adhd:            "ADHD-friendly",
    badge_micro:           "Micro-sessions",
    badge_interventions:   "Interventions",
    loading_child:         "Loading child...",
    no_child_added:        "No child added yet",
    child_label:           "Child",
    this_week:             "This Week",
    avg_completion:        "Avg Completion",
    total_sessions:        "Total Sessions",
    learning_time_7d:      "Learning Time (7 Days)",
    sessions:              "sessions",
    offline_last_seen:     "Offline — last seen",
    never_connected:       "Never connected",
    in_main_menu:          "In Main Menu",

    // Subjects
    subjects_subtitle:     "Pick a subject to drill into mastery, time, and difficulties.",
    open_subject:          "Open",
    no_data_yet:           "No data yet",
    subject_math:          "Math",
    subject_reading:       "Reading",
    subject_astronomy:     "Astronomy",
    subject_science:       "Science",
    subject_english:       "English",
    subject_minigames:     "Minigames",

    // Subject Details
    performance_summary:   "Performance Summary",
    common_difficulties:   "Common Difficulties",
    recent_sessions:       "Recent Sessions",
    ai_insights:           "AI Insights",
    ask_ai_about:          "Ask the AI about this subject",
    total_time:            "Total Time",
    best_score_label:      "Best Score",
    coins_earned:          "Coins",
    answer_accuracy:       "Accuracy",

    // Answers
    answers_subtitle:      "Review every question with the kid's choice and the correct answer.",
    player_answered:       "Player answered",
    correct_was:           "Correct was",
    no_answers_yet:        "No answers recorded yet.",

    // AI Helper
    ai_greeting:           "Hi! I'm your NeuroQuest AI helper. Ask me anything about how your kid's doing — I can see their recent answers, mastery, and scores.",
    ai_suggest_practice:   "What should they practice next?",
    ai_suggest_accuracy:   "Why is accuracy slipping this week?",
    ai_suggest_motivate:   "How do I motivate them when they're frustrated?",
    ai_suggest_limits:     "Are the time limits I have set reasonable?",
    ai_suggest_summary:    "Summarize their progress so far",

    // Time Control
    time_control_subtitle: "Set daily and per-session limits, plus a bedtime window.",
    daily_minutes:         "Daily minutes",
    session_minutes:       "Session minutes",
    break_minutes:         "Break minutes",
    block_after_bedtime:   "Block after bedtime",
    save_changes:          "Save changes",
    settings_saved:        "Settings saved",

    // Messages
    messages_subtitle:     "Send a short message that appears in the game's inbox.",
    placeholder_message:   "Type a message…",
    no_messages_yet:       "No messages yet.",
    sent:                  "Sent",

    // Auth pages
    sign_in_title:         "Sign in",
    sign_up_title:         "Create your account",
    forgot_email:          "Email address",
    btn_continue:          "Continue",
    or_with_demo:          "or use the demo account",

    // Reports — KPI tile labels
    kpi_label_time:        "Time",
    kpi_label_mastery:     "Mastery",

    // Reports — table headers
    th_when:               "When",
    th_subject:            "Subject",
    th_duration:           "Duration",
    th_completion:         "Completion",

    // Reports — common
    print_avoid_break:     "",   // placeholder, unused
    cover_generated:       "Generated",
    cover_account_since:   "Account since",
    cover_last_active:     "Last active",
    answered:              "answered",

    // Time control form
    tc_daily_limit:        "Daily limit",
    tc_session_length:     "Session length",
    tc_break_length:       "Break length",
    tc_allowed_window:     "Allowed window",
    tc_bedtime_block:      "Bedtime block",
    tc_from:               "From",
    tc_to:                 "To",
    tc_minutes_per_day:    "Minutes per day",
    tc_per_session:        "Per session",
    tc_per_break:          "Per break",
    tc_save:               "Save changes",
    tc_reset:              "Reset",

    // Topbar
    topbar_child:          "Child",
    topbar_playing:        "Playing",
    topbar_in_game:        "In game",
    topbar_in_main_menu:   "In Main Menu",

    // Subject Details extras
    sd_back:               "Back to subjects",
    sd_no_score_data:      "No scores recorded yet for this subject.",
    sd_overall:            "Overall",
    sd_completion:         "Completion",
    sd_time_total:         "Time total",
    sd_sessions_count:     "Sessions",

    // Answers row
    ar_question:           "Question",
    ar_answered_label:     "Player answered",
    ar_correct_label:      "Correct was",
    ar_no_answer:          "No answer given",

    // Reports — AI recommendation + section helpers
    ai_recommendation:     "AI Recommendation",
    ai_generating:         "Generating…",
    ai_pulling_insights:   "Pulling insights from",
    ai_pulling_insights_2: "recent activity…",
    ai_no_rec:             "No recommendation generated yet.",
    ai_failed_short:       "Couldn't generate recommendation.",

    txt_report:            "Text report",
    txt_copied:            "Copied",

    daily_play_subtitle:   "Daily play time across all subjects",
    not_enough_data:       "Not enough data yet.",
    your_current_limits:   "Your current limits",
    no_sessions_yet:       "No sessions recorded yet.",
    last_n_sessions:       "Last",   // followed by N "play sessions"
    play_sessions:         "play sessions",
    avg_session:           "Avg session",
    hotspot_count:         "×",       // multiplier symbol used as is

    // Stop/Resume control
    btn_resume_play:       "Resume",
    btn_force_stop:        "Stop Play",
    badge_in_game:         "In game",
    badge_stopped:         "Stopped",
    confirm_couldnt_update: "Couldn't update. Try again.",

    // Light / Special theme labels
    theme_light_short:     "Light",
    theme_special_short:   "Special",

    // Analytics page (admin)
    an_search_visits:      "Search visits by email…",
    an_no_visits:          "No matching visits.",
    an_filter_reset:       "Clear filter",
    an_visits_filtered:    "Filtered to",
  },

  /* =========================
     ARABIC
  ========================= */
  ar: {
    brand:             "نيوروكويست",
    brand_subtitle:    "لوحة تحكم ولي الأمر",

    nav_overview:      "نظرة عامة",
    nav_time:          "الوقت",
    nav_time_control:  "التحكم بالوقت",
    nav_subjects:      "المواد",
    nav_answers:       "الإجابات",
    nav_reports:       "التقارير",
    nav_messages:      "الرسائل",
    nav_ai:            "ذكاء",
    nav_ai_helper:     "مساعد الذكاء الاصطناعي",
    nav_admin:         "التحليلات",
    nav_download:      "تحميل",
    nav_logout:        "تسجيل الخروج",

    btn_save:          "حفظ",
    btn_cancel:        "إلغاء",
    btn_close:         "إغلاق",
    btn_add:           "إضافة",
    btn_add_child:     "إضافة طفل",
    btn_create:        "إنشاء",
    btn_creating:      "جاري الإنشاء…",
    btn_delete:        "حذف",
    btn_edit:          "تعديل",
    btn_refresh:       "تحديث",
    btn_send:          "إرسال",
    btn_login:         "تسجيل الدخول",
    btn_register:      "إنشاء حساب",
    btn_print:         "طباعة / حفظ PDF",
    btn_save_pdf:      "حفظ PDF",
    btn_resume:        "استئناف",
    btn_stop_play:     "إيقاف اللعب",
    btn_unlock:        "فتح",

    status_online:        "متصل",
    status_offline:       "غير متصل",
    status_stopped:       "موقوف",
    status_in_game:       "داخل اللعبة",
    status_in_main_menu:  "في القائمة الرئيسية",
    status_playing:       "يلعب",
    status_loading:       "جاري التحميل…",
    status_no_child:      "لم يتم اختيار طفل",

    theme_light:       "فاتح",
    theme_special:     "مميز",

    auth_email:        "البريد الإلكتروني",
    auth_password:     "كلمة المرور",
    auth_have_account: "لديك حساب بالفعل؟",
    auth_new_account:  "ليس لديك حساب بعد؟",

    add_child_title:   "طفل جديد",
    child_name:        "اسم الطفل",
    child_code_label:  "رمز الوصول للعبة",
    child_code_hint:   "أعطِ هذا الرمز لطفلك لربط حسابه باللعبة.",

    overview_title:        "نظرة عامة",
    overview_subtitle:     "ملخص نشاط اليوم والتقدم",
    kpi_play_time:         "وقت اللعب",
    kpi_today_focus:       "دقائق التركيز اليوم",
    kpi_sessions:          "الجلسات",
    kpi_accuracy:          "الدقة",
    kpi_avg_mastery:       "متوسط الإتقان",
    kpi_best_score:        "أعلى نتيجة",
    kpi_top_subject:       "المادة الأكثر لعباً",
    kpi_coins:             "العملات",

    subjects_title:        "المواد",
    subject_mastery:       "إتقان المواد",
    mastery_strong:        "ممتاز",
    mastery_progressing:   "يتقدم",
    mastery_needs_focus:   "يحتاج تركيز",
    no_subjects_yet:       "لم يبدأ بأي مادة بعد — ستظهر هنا حالما يبدأ اللعب.",

    reports_title:         "التقارير",
    reports_subtitle:      "تقرير التقدم — اطبعه أو احفظه كملف PDF من المتصفح.",
    coin_balance:          "رصيد العملات",
    overall_accuracy:      "الدقة الإجمالية",
    section_strengths:     "نقاط القوة والتركيز",
    section_strength:      "نقطة قوة",
    section_focus:         "مجال التركيز",
    section_mistakes:      "الأخطاء الشائعة",
    section_recent:        "الجلسات الأخيرة",
    section_7day:          "نشاط آخر 7 أيام",
    section_scorecard:     "بطاقة الأداء حسب المادة",
    correct_answer_was:    "الإجابة الصحيحة",
    times_repeated:        "مرات",

    answers_title:         "الإجابات",
    answers_filter_all:    "الكل",
    answers_filter_right:  "صحيحة",
    answers_filter_wrong:  "خاطئة",
    answers_filter_timed:  "انتهى الوقت",
    answers_correct:       "صحيحة",
    answers_wrong:         "خاطئة",
    answers_timed_out:     "انتهى الوقت",
    answers_no_answer:     "لم يجب",

    time_control_title:    "التحكم بالوقت",
    time_daily_limit:      "الحد اليومي",
    time_session_length:   "مدة الجلسة",
    time_break:            "الاستراحة",
    time_allowed_from:     "السماح من",
    time_allowed_to:       "السماح إلى",
    time_bedtime:          "حظر النوم",
    minutes:               "د",

    ai_title:              "مساعد الذكاء الاصطناعي",
    ai_context_no_child:   "لم يتم اختيار طفل",
    ai_context_for:        "السياق",
    ai_placeholder:        "اسأل أي شيء عن نيوروكويست…",
    ai_thinking:           "يفكر…",
    ai_failed:             "فشل طلب الذكاء الاصطناعي. حاول مرة أخرى بعد قليل.",

    messages_title:        "الرسائل",
    messages_send_to:      "إرسال رسالة",

    last_played:           "آخر لعب",
    last_seen:             "آخر ظهور",
    just_now:              "الآن",
    ago_m:                 "د",
    ago_h:                 "س",
    ago_d:                 "ي",
    language_label:        "اللغة",

    // Overview extras
    parent_overview:       "نظرة عامة لولي الأمر",
    overview_tagline:      "الوقت، أنماط التقدم، الإتقان، والمؤشرات الداعمة.",
    badge_adhd:            "ملائم لفرط الحركة",
    badge_micro:           "جلسات قصيرة",
    badge_interventions:   "تدخلات",
    loading_child:         "جاري التحميل...",
    no_child_added:        "لم يتم إضافة طفل بعد",
    child_label:           "الطفل",
    this_week:             "هذا الأسبوع",
    avg_completion:        "متوسط الإكمال",
    total_sessions:        "إجمالي الجلسات",
    learning_time_7d:      "وقت التعلم (آخر 7 أيام)",
    sessions:              "جلسات",
    offline_last_seen:     "غير متصل — آخر ظهور",
    never_connected:       "لم يتصل أبداً",
    in_main_menu:          "في القائمة الرئيسية",

    subjects_subtitle:     "اختر مادة لرؤية الإتقان والوقت والصعوبات بالتفصيل.",
    open_subject:          "فتح",
    no_data_yet:           "لا توجد بيانات بعد",
    subject_math:          "الرياضيات",
    subject_reading:       "القراءة",
    subject_astronomy:     "الفلك",
    subject_science:       "العلوم",
    subject_english:       "الإنجليزية",
    subject_minigames:     "ألعاب صغيرة",

    performance_summary:   "ملخص الأداء",
    common_difficulties:   "الصعوبات الشائعة",
    recent_sessions:       "الجلسات الأخيرة",
    ai_insights:           "تحليلات الذكاء الاصطناعي",
    ask_ai_about:          "اسأل الذكاء الاصطناعي عن هذه المادة",
    total_time:            "إجمالي الوقت",
    best_score_label:      "أعلى نتيجة",
    coins_earned:          "العملات",
    answer_accuracy:       "الدقة",

    answers_subtitle:      "راجع كل سؤال مع إجابة الطفل والإجابة الصحيحة.",
    player_answered:       "أجاب اللاعب",
    correct_was:           "الإجابة الصحيحة",
    no_answers_yet:        "لم تُسجَّل أي إجابات بعد.",

    ai_greeting:           "مرحباً! أنا مساعد الذكاء الاصطناعي في نيوروكويست. اسألني أي شيء عن أداء طفلك — أستطيع رؤية إجاباته الأخيرة وإتقانه ودرجاته.",
    ai_suggest_practice:   "ما الذي يجب أن يتدرب عليه بعد ذلك؟",
    ai_suggest_accuracy:   "لماذا تتراجع الدقة هذا الأسبوع؟",
    ai_suggest_motivate:   "كيف أحفّزه عندما يشعر بالإحباط؟",
    ai_suggest_limits:     "هل حدود الوقت التي ضبطتها معقولة؟",
    ai_suggest_summary:    "لخّص تقدمه حتى الآن",

    time_control_subtitle: "اضبط الحدود اليومية ولكل جلسة، ونافذة وقت النوم.",
    daily_minutes:         "الدقائق اليومية",
    session_minutes:       "دقائق الجلسة",
    break_minutes:         "دقائق الاستراحة",
    block_after_bedtime:   "الحظر بعد وقت النوم",
    save_changes:          "حفظ التغييرات",
    settings_saved:        "تم حفظ الإعدادات",

    messages_subtitle:     "أرسل رسالة قصيرة تظهر في صندوق وارد اللعبة.",
    placeholder_message:   "اكتب رسالة…",
    no_messages_yet:       "لا توجد رسائل بعد.",
    sent:                  "تم الإرسال",

    sign_in_title:         "تسجيل الدخول",
    sign_up_title:         "أنشئ حسابك",
    forgot_email:          "البريد الإلكتروني",
    btn_continue:          "متابعة",
    or_with_demo:          "أو استخدم الحساب التجريبي",

    kpi_label_time:        "الوقت",
    kpi_label_mastery:     "الإتقان",

    th_when:               "متى",
    th_subject:            "المادة",
    th_duration:           "المدة",
    th_completion:         "الإنجاز",

    cover_generated:       "تم الإنشاء",
    cover_account_since:   "تاريخ الإنضمام",
    cover_last_active:     "آخر نشاط",
    answered:              "تمت الإجابة",

    tc_daily_limit:        "الحد اليومي",
    tc_session_length:     "مدة الجلسة",
    tc_break_length:       "مدة الاستراحة",
    tc_allowed_window:     "نافذة السماح",
    tc_bedtime_block:      "حظر النوم",
    tc_from:               "من",
    tc_to:                 "إلى",
    tc_minutes_per_day:    "الدقائق في اليوم",
    tc_per_session:        "في الجلسة",
    tc_per_break:          "في الاستراحة",
    tc_save:               "حفظ التغييرات",
    tc_reset:              "إعادة تعيين",

    topbar_child:          "الطفل",
    topbar_playing:        "يلعب",
    topbar_in_game:        "داخل اللعبة",
    topbar_in_main_menu:   "في القائمة الرئيسية",

    sd_back:               "العودة إلى المواد",
    sd_no_score_data:      "لم تُسجَّل أي درجات لهذه المادة بعد.",
    sd_overall:            "إجمالي",
    sd_completion:         "الإنجاز",
    sd_time_total:         "إجمالي الوقت",
    sd_sessions_count:     "الجلسات",

    ar_question:           "السؤال",
    ar_answered_label:     "إجابة الطفل",
    ar_correct_label:      "الإجابة الصحيحة",
    ar_no_answer:          "لم يجب",

    ai_recommendation:     "توصيات الذكاء الاصطناعي",
    ai_generating:         "جاري التحليل…",
    ai_pulling_insights:   "جاري استخلاص الرؤى من نشاط",
    ai_pulling_insights_2: "الأخير…",
    ai_no_rec:             "لم يتم إنشاء توصية بعد.",
    ai_failed_short:       "تعذّر إنشاء التوصية.",

    txt_report:            "تقرير نصي",
    txt_copied:            "تم النسخ",

    daily_play_subtitle:   "وقت اللعب اليومي لجميع المواد",
    not_enough_data:       "لا توجد بيانات كافية بعد.",
    your_current_limits:   "حدودك الحالية",
    no_sessions_yet:       "لم تُسجَّل أي جلسات بعد.",
    last_n_sessions:       "آخر",
    play_sessions:         "جلسات لعب",
    avg_session:           "متوسط الجلسة",
    hotspot_count:         "×",

    btn_resume_play:       "استئناف",
    btn_force_stop:        "إيقاف اللعب",
    badge_in_game:         "داخل اللعبة",
    badge_stopped:         "موقوف",
    confirm_couldnt_update: "تعذّر التحديث. حاول مرة أخرى.",

    theme_light_short:     "فاتح",
    theme_special_short:   "مميز",

    an_search_visits:      "ابحث في الزيارات حسب البريد…",
    an_no_visits:          "لا توجد زيارات مطابقة.",
    an_filter_reset:       "مسح التصفية",
    an_visits_filtered:    "تصفية إلى",
  },
};
