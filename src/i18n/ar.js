export default {
  common: {
    appName: 'نظام أساور الضيوف - كود',
    appSubtitle: 'نظام أساور الضيوف',
    loading: 'جارٍ التحميل…',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
    back: 'رجوع',
    previous: 'السابق',
    next: 'التالي',
    retry: 'إعادة المحاولة',
    submit: 'إرسال',
    search: 'بحث',
    filter: 'تصفية',
    clear: 'مسح',
    actions: 'إجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    none: 'لا يوجد',
    yes: 'نعم',
    no: 'لا',
    viewDetails: 'عرض التفاصيل',
    requiredField: 'حقل مطلوب',
    demoModeNotice:
      'يعمل حالياً على بيانات تجريبية — لا يوجد اتصال فعلي بالخادم بعد.',
  },

  nav: {
    dashboard: 'لوحة التحكم',
    createJob: 'إنشاء سوار ضيف',
    bracelets: 'السجل',
    reconciliation: 'المطابقة',
    logout: 'تسجيل الخروج',
    language: 'English',
    signedInAs: 'تم تسجيل الدخول باسم',
  },

  auth: {
    loginTitle: 'تسجيل دخول المشغل',

    loginSubtitle:
      'أدخل اسمك ورقم الموظف لتسجيل الشخص الذي يقوم بإصدار أساور الضيوف.',

    employeeName: 'اسم الموظف',

    employeeId: 'رقم الموظف',

    loginButton: 'تسجيل الدخول',

    loggingIn: 'جارٍ تسجيل الدخول…',

    sharedLoginHint:
      'يتم استخدام حساب نظام مشترك واحد. رقم الموظف الخاص بك يحدد كل عملية إنشاء وكل إجراء يتم تسجيله.',

    signupTitle: 'طلب صلاحية المشغل',

    signupSubtitle:
      'لا تحتاج إلى إنشاء حساب فردي. استخدم اسمك ورقم الموظف لتسجيل الدخول.',

    fullName: 'الاسم الكامل',

    confirmPassword: 'تأكيد كلمة المرور',

    signupButton: 'طلب الوصول',

    signingUp: 'جارٍ الإرسال…',

    haveAccount: 'لديك حساب بالفعل؟',

    noAccount: '',

    goToSignup: '',

    goToLogin: 'تسجيل الدخول',

    signupSuccessTitle: 'تم استلام الطلب',

    signupSuccessBody:
      'لا تحتاج إلى حساب فردي. يمكنك استخدام نظام تسجيل الدخول المشترك.',

    backToLogin: 'العودة لتسجيل الدخول',

    sessionExpired:
      'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  },

  dashboard: {
    title: 'لوحة التحكم',

    welcomeBack:
      'مرحباً بعودتك، {{name}}',

    created: 'إجمالي ما تم إنشاؤه',

    todayCreated: 'تم إنشاؤها اليوم',

    remaining: 'المتبقي',

    max: 'الحد الأقصى لكل دفعة',

    createCta: 'إنشاء سوار ضيف',

    limitReachedBanner:
      'لقد وصلت إلى الحد الأقصى المسموح به وهو {{max}} سواراً في الدفعة الواحدة.',

    recentJobs: 'الطلبات الأخيرة',

    viewAllJobs:
      'عرض الكل في السجل',

    noJobs:
      'لا توجد طلبات بعد. أنشئ أول طلب سوار ضيف للبدء.',

    needsAttentionTitle:
      'يحتاج إلى مراجعة',

    needsAttentionEmpty:
      'لا يوجد ما يحتاج إلى مراجعة الآن.',

    needsAttentionCount:
      '{{count}} عنصر يحتاج إلى مراجعة',
  },

  createJob: {
    title: 'إنشاء سوار ضيف',

    subtitle:
      'أدخل عدد أساور الضيوف المطلوب إصدارها الآن.',

    quantityLabel: 'عدد الأساور',

    quantityHelp:
      'بحد أقصى {{max}} سواراً لكل دفعة.',

    remainingNote:
      'يمكنك إنشاء {{remaining}} سواراً إضافياً من الحد المسموح به وهو {{max}}.',

    batchLimit:
      'الحد الأقصى لكل دفعة',

    decrease: 'تقليل العدد',

    increase: 'زيادة العدد',

    submitButton: 'إنشاء الطلب',

    submitting:
      'جارٍ إنشاء الطلب…',

    successTitle:
      'تم إنشاء الطلب بنجاح',

    successBody:
      'تم إنشاء طلب لعدد {{quantity}} سواراً بواسطة {{name}} ({{employeeId}}).',

    viewJob:
      'عرض حالة الطلب',

    backToDashboard:
      'العودة إلى لوحة التحكم',

    errorTitle:
      'تعذّر إنشاء الطلب',

    limitExceeded:
      'هذا العدد يتجاوز الحد المسموح به وهو {{remaining}} سواراً.',
  },

  jobDetail: {
    title: 'الطلب',

    jobId: 'رقم الطلب',

    requestedBy: 'طلب بواسطة',

    quantity: 'الكمية',

    createdAt: 'تاريخ الإنشاء',

    status: 'الحالة',

    guestsBreakdown:
      'نتائج الضيوف',

    issued: 'تم الإصدار',

    failed: 'فشل',

    reconciliationRequired:
      'يحتاج إلى مطابقة',

    pending: 'قيد الانتظار',

    queued: 'في قائمة الانتظار',

    takingLonger:
      'هذا يستغرق وقتاً أطول من المعتاد. ستستمر المعالجة في الخلفية.',

    needsAttentionFlag:
      'تم تمييزه للمراجعة — تأخر هذا الطلب أكثر من المعتاد.',

    retryDispatch:
      'إعادة محاولة الإرسال',

    backToBracelets:
      'عرض أساور هذا الطلب',

    dispatchFailedNote:
      'فشل إرسال الطلب إلى نظام الإصدار بعد 3 محاولات.',

    viewBracelet: 'عرض',

    braceletNumber: 'رقم السوار',
  },

  bracelets: {
    title: 'سجل الأساور',

    searchPlaceholder:
      'ابحث برقم السوار…',

    filterStatus: 'الحالة',

    allStatuses: 'كل الحالات',

    braceletNumber: 'رقم السوار',

    jobIdCol: 'الطلب',

    statusCol: 'الحالة',

    updatedAt: 'آخر تحديث',

    empty:
      'لا توجد أساور بعد.',

    noResults:
      'لا توجد أساور مطابقة لبحثك.',
  },

  braceletDetail: {
    title: 'السوار',

    braceletNumber:
      'رقم السوار',

    braceletCode:
      'كود السوار',

    status: 'الحالة',

    job: 'الطلب',

    issuedAt:
      'تاريخ الإصدار',

    activatedAt:
      'تاريخ التفعيل',

    revokedAt:
      'تاريخ الإلغاء',

    lastError:
      'آخر خطأ',

    eventHistory:
      'سجل الأحداث',

    noEvents:
      'لا توجد أحداث مسجلة بعد.',

    actions: 'إجراءات',

    retryButton:
      'إعادة محاولة الإصدار',

    retryConfirmTitle:
      'إعادة محاولة هذا السوار؟',

    retryConfirmBody:
      'سيتم إعادة إدراج هذا السوار ضمن طلب جديد.',

    reconcileButton:
      'حل المطابقة',

    reconcileTitle:
      'حل المطابقة',

    reconcileBody:
      'تحقق من رقم السوار في لوحة تحكم PayMob، ثم أكّد النتيجة أدناه.',

    reconcileExists:
      'تم التأكيد — موجود في PayMob',

    reconcileMissing:
      'تم التأكيد — غير موجود في PayMob',

    reconcileWarning:
      'لا تخمّن أبداً. التأكيد الخاطئ قد يؤدي إلى إصدار مكرر أو سوار معلّق.',

    markActive:
      'تعيين كنشط',

    markLost:
      'تعيين كمفقود',

    markRevoked:
      'إلغاء السوار',

    adminOnly:
      'للمسؤولين فقط',

    confirmRevokeTitle:
      'إلغاء هذا السوار؟',

    confirmRevokeBody:
      'هذا الإجراء نهائي وسيتم تسجيله في سجل التدقيق.',
  },

  reconciliation: {
    title:
      'قائمة المطابقة',

    subtitle:
      'أساور بنتيجة غير مؤكدة من PayMob. تحقق من لوحة التحكم قبل الحل.',

    empty:
      'لا يوجد ما يحتاج إلى مطابقة الآن.',
  },

  statuses: {
    PENDING: 'قيد الانتظار',
    QUEUED: 'في قائمة الانتظار',
    ISSUED: 'تم الإصدار',
    FAILED: 'فشل',
    RECONCILIATION_REQUIRED:
      'يحتاج إلى مطابقة',
    ACTIVE: 'نشط',
    REVOKED: 'ملغى',
    LOST: 'مفقود',
    QUARANTINED: 'معزول',
  },

  jobStatuses: {
    QUEUED: 'في قائمة الانتظار',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
    COMPLETED_WITH_ERRORS:
      'مكتمل مع وجود أخطاء',
    FAILED: 'فشل',
  },

  toast: {
    jobCreated:
      'تم إنشاء الطلب بنجاح.',

    jobCreateFailed:
      'تعذّر إنشاء الطلب. يرجى المحاولة مرة أخرى.',

    retryQueued:
      'تمت إعادة إدراج السوار للإصدار.',

    reconcileResolved:
      'تم حل المطابقة.',

    statusUpdated:
      'تم تحديث الحالة.',

    loggedOut:
      'تم تسجيل خروجك.',

    copied:
      'تم النسخ.',
  },

  errors: {
    generic:
      'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    network:
      'حدث خطأ في الاتصال. تحقق من اتصالك وحاول مرة أخرى.',

    notFound:
      'العنصر المطلوب غير موجود.',

    required:
      'هذا الحقل مطلوب.',

    invalidEmail:
      'أدخل بريداً إلكترونياً صحيحاً.',

    passwordTooShort:
      'يجب ألا تقل كلمة المرور عن 6 أحرف.',

    passwordMismatch:
      'كلمتا المرور غير متطابقتين.',

    invalidQuantity:
      'أدخل رقماً صحيحاً.',

    quantityTooLow:
      'أدخل رقماً لا يقل عن 1.',

    quantityTooHigh:
      'يمكن إنشاء {{max}} سوارًا كحد أقصى في المرة الواحدة.',

    insufficientGuests:
      'لا يوجد عدد كافٍ من الأساور المتاحة. المتاح حالياً: {{count}}.',

    sessionNotFound:
      'لم يتم العثور على جلسة تسجيل دخول صالحة. يرجى تسجيل الدخول مرة أخرى.',
  },
};