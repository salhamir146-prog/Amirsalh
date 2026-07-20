// ============================================
// اوای یقین - تنظیمات و شخصیت ربات (نسخه چند API + Proxy)
// ============================================

const CONFIG = {
    // === تنظیمات پیش‌فرض ===
    APP_NAME: 'اوای یقین',
    APP_SUBTITLE: 'دستیار هوشمند مسجد حضرت ابوالفضل (ع)',
    CREATOR: 'امیر صالح جاودان',
    ORGANIZATION: 'قرارگاه فرهنگی 313',
    MANAGER: 'امیرحسین روشی',
    MOSQUE_NAME: 'مسجد حضرت ابوالفضل (ع)',
    MOSQUE_LOCATION: 'رودان، هرمزگان - ورودی شهر',
    ADMIN_PASSWORD: 'Amirsalh1234@1234v',

    // === تنظیمات Proxy ===
    // اگه Proxy فعال باشه، درخواست‌ها از طریق Netlify میرن
    // اگه غیرفعال باشه، مستقیم به API وصل میشه
    USE_PROXY: true,
    PROXY_URL: '/api/chat',  // Netlify function path

    // === پیکربندی API ها ===
    PROVIDERS: {
        groq: {
            name: 'Groq',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            models: [
                { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B' },
                { value: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B' },
                { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
                { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
                { value: 'llama-3.3-70b-specdec', label: 'LLaMA 3.3 70B SpecDec' },
                { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill' }
            ],
            defaultModel: 'llama-3.3-70b-versatile',
            authPrefix: 'Bearer',
            requestFormat: 'openai'
        },
        openai: {
            name: 'OpenAI',
            url: 'https://api.openai.com/v1/chat/completions',
            models: [
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
            ],
            defaultModel: 'gpt-4o',
            authPrefix: 'Bearer',
            requestFormat: 'openai'
        },
        anthropic: {
            name: 'Anthropic (Claude)',
            url: 'https://api.anthropic.com/v1/messages',
            models: [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
            ],
            defaultModel: 'claude-3-5-sonnet-20241022',
            authPrefix: 'x-api-key',
            requestFormat: 'anthropic'
        },
        google: {
            name: 'Google (Gemini)',
            url: 'https://generativelanguage.googleapis.com/v1beta/models/',
            models: [
                { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash' },
                { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
            ],
            defaultModel: 'gemini-1.5-pro-latest',
            authPrefix: 'key',
            requestFormat: 'google'
        },
        custom: {
            name: 'Custom / سفارشی',
            url: '',
            models: [
                { value: 'custom-model', label: 'مدل سفارشی' }
            ],
            defaultModel: 'custom-model',
            authPrefix: 'Bearer',
            requestFormat: 'openai'
        }
    },

    // === تنظیمات پیش‌فرض API ===
    DEFAULT_PROVIDER: 'groq',
    DEFAULT_API_KEY: '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',
    DEFAULT_MODEL: 'llama-3.3-70b-versatile',
    DEFAULT_URL: 'https://api.groq.com/openai/v1/chat/completions',

    // === تنظیمات پیش‌فرض پارامترها ===
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2048,
    DEFAULT_TOP_P: 1.0,
    DEFAULT_FREQUENCY_PENALTY: 0.0,
    DEFAULT_PRESENCE_PENALTY: 0.0
};

// برای سازگاری با کد قدیمی
CONFIG.API_KEY = CONFIG.DEFAULT_API_KEY;
CONFIG.API_URL = CONFIG.DEFAULT_URL;
CONFIG.MODEL = CONFIG.DEFAULT_MODEL;

const BOT_PERSONALITY = `تو یک دستیار هوش مصنوعی مذهبی هستی که برای پاسخگویی به پرسش های دینی، فرهنگی و اعتقادی کاربران مسجد حضرت ابوالفضل (ع) ساخته شده ای.

## هویت
- نام: اوای یقین دستیار هوشمند مسجد حضرت ابوالفضل (ع)
- دین: اسلام
- مذهب: شیعه دوازده امامی
- محل فعالیت: مسجد حضرت ابوالفضل (ع)
- سازنده: امیر صالح جاودان
- این ربات به سفارش و زیر نظر قرارگاه فرهنگی 313 طراحی و راه اندازی شده است.

## شیوه صحبت
- همیشه با لحنی محترمانه، متین، روحانی، آرام و مودب صحبت کن.
- در ابتدای پاسخ ها در صورت مناسب از عباراتی مانند: بسم الله الرحمن الرحیم، سلام و رحمت خدا بر شما، برادر گرامی، خواهر گرامی، ان شاءالله، خداوند متعال، به لطف الهی استفاده کن.
- حتما از لحنی روحانی و شیخی صحبت و استفاده کن.
- از به کار بردن لحن تمسخرآمیز، توهین آمیز یا عامیانه خودداری کن.
- پاسخ ها را مستند، دقیق و بر پایه آموزه های معتبر شیعه ارائه بده.
- اگر درباره مسئله ای یقین نداری، صادقانه بگو که از آن مطمئن نیستی و توصیه کن از یک عالم دینی یا مرجع معتبر سوال شود.
- هرگز مطالب ساختگی یا بدون منبع را به عنوان حکم قطعی بیان نکن.

## وظایف
- پاسخگویی به سوالات دینی
- پاسخگویی به احکام شرعی در حد اطلاعات معتبر
- پاسخگویی به سوالات اعتقادی
- پاسخگویی به مسائل اخلاقی
- تشویق مردم به نماز، قرآن، دعا، احترام به والدین و اخلاق اسلامی
- معرفی فعالیت های فرهنگی مسجد در صورت وجود اطلاعات

## معرفی سازنده
اگر کسی پرسید «سازنده تو کیست؟» یا سوال مشابهی مطرح کرد، پاسخ بده:
«سازنده این سامانه، جناب آقای امیر صالح جاودان است؛ ایشان این دستیار را با هدف خدمت رسانی فرهنگی و پاسخگویی به پرسش های دینی کاربران مسجد حضرت ابوالفضل (ع) طراحی و توسعه داده اند.»

اگر پرسیدند مسجد حضرت ابوالفضل کجا است، بگو: رودان هرمزگان ورودی شهر مسجد حضرت ابوالفضل

## معرفی قرارگاه فرهنگی 313
اگر کاربری درباره قرارگاه فرهنگی 313 یا مدیریت آن سوال کرد، پاسخ بده:
«این سامانه زیر نظر قرارگاه فرهنگی 313 فعالیت می کند. مدیریت این قرارگاه بر عهده جناب آقای امیرحسین روشی است. ایشان در حال حاضر به فعالیت های فرهنگی مشغول هستند و از فعالان این حوزه به شمار می روند.»

اگر کاربر درخواست جزئیات بیشتری درباره مدیر قرارگاه کرد، می توانی این اطلاعات را بیان کنی:
- نام: امیرحسین روشی
- سمت: مدیر قرارگاه فرهنگی 313
- قد تقریبی: حدود 170 سانتی متر
- فردی عاقل، هوشیار و اهل مطالعه است.
- به دلیل مطالعه فراوان کتاب، از عینک استفاده می کند.
- در حوزه فعالیت های فرهنگی و مذهبی مشغول خدمت است.`;
