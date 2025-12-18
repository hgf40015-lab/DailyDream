
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { 
    Language, 
    DreamPrediction, 
    DreamMachineResult,
    DeepSummary,
    StoredDream,
    DreamSymbolMeaning,
    CardPredictionResult,
    DreamTestResult,
    DreamAnalysis,
    DreamMapData,
    CountryDreamStats
} from '../types';

export class SafetyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SafetyError";
    }
}

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

// New types for offline dictionary
type DreamDictionary = {
    [key: string]: string[];
};

type Dictionaries = {
    [lang in Language]?: {
        symbols: DreamDictionary;
        positiveWords: string[];
        negativeWords: string[];
        advice: string[];
    }
};

export const symbolAudioMap: { [key: string]: string } = {
    water: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3', // Water sound
    suv: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3', // Water sound (uzbek)
    rain: 'https://cdn.pixabay.com/audio/2022/08/10/audio_248321045b.mp3', // Rain sound
    yomgʻir: 'https://cdn.pixabay.com/audio/2022/08/10/audio_248321045b.mp3', // Rain sound (uzbek)
    fly: 'https://cdn.pixabay.com/audio/2022/03/24/audio_903960a5d2.mp3', // Wind sound
    uchish: 'https://cdn.pixabay.com/audio/2022/03/24/audio_903960a5d2.mp3', // Wind sound (uzbek)
    storm: 'https://cdn.pixabay.com/audio/2022/04/10/audio_5101a070e1.mp3', // Thunder sound
    boʻron: 'https://cdn.pixabay.com/audio/2022/04/10/audio_5101a070e1.mp3', // Thunder sound (uzbek)
    fire: 'https://cdn.pixabay.com/audio/2022/02/07/audio_f5592a8b5c.mp3', // Fire sound
    olov: 'https://cdn.pixabay.com/audio/2022/02/07/audio_f5592a8b5c.mp3', // Fire sound (uzbek)
    forest: 'https://cdn.pixabay.com/audio/2023/10/02/audio_1919427b2c.mp3', // Forest sound
    oʻrmon: 'https://cdn.pixabay.com/audio/2023/10/02/audio_1919427b2c.mp3', // Forest sound (uzbek)
    bird: 'https://cdn.pixabay.com/audio/2022/03/24/audio_55391c841c.mp3', // Birds singing
    qush: 'https://cdn.pixabay.com/audio/2022/03/24/audio_55391c841c.mp3', // Birds singing (uzbek)
    heart: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0a53235.mp3', // Heartbeat
    yurak: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0a53235.mp3' // Heartbeat (uzbek)
};


// Simple dictionary for offline fallback
export const offlineDictionaries: Dictionaries = {
    en: {
        symbols: {
            'water': ["represents emotional cleansing, your subconscious, or a fresh start.", "could point to your current emotional state. Calm water means peace, stormy water means turmoil.", "is a powerful symbol of purification and renewal."],
            'fly': ["suggests a sense of freedom, gaining a new perspective, or rising above a situation.", "can mean you feel unrestricted and powerful in your waking life.", "might be a sign that you are looking to escape from current pressures."],
            'fall': ["often indicates a loss of control, insecurity, or a feeling of failure.", "can symbolize letting go of something or someone.", "might reflect anxieties you are facing in your life right now."],
            'teeth': ["losing teeth can symbolize anxiety about your appearance, communication issues, or stress.", "can also represent a transition or a feeling of powerlessness.", "might be related to concerns about how others perceive you."],
            'snake': ["is a symbol of transformation, hidden fears, or healing energy.", "could represent a person or situation in your life that is unpredictable.", "often points to personal growth and shedding an old part of yourself."],
            'death': ["rarely means literal death. It usually symbolizes the end of a chapter and a major life change.", "suggests you are letting go of the past to make way for the new.", "can be a positive sign of transformation and rebirth."],
            'house': ["represents your self or your psyche. Different rooms can symbolize different aspects of your personality.", "a damaged house might mean you are feeling vulnerable.", "exploring a new house can suggest self-discovery."],
            'chased': ["indicates you are avoiding an issue or a person in your waking life.", "the thing chasing you often represents a part of yourself you are not confronting.", "it's a sign to face your fears or anxieties directly."],
            'car': ["Represents the journey of your life and the way you navigate it.", "The condition of the car can reflect your own physical or emotional state.", "Driving a car shows you are in control of your destiny, while being a passenger might mean you feel others are in control."],
            'money': ["Can symbolize self-worth, power, or resources.", "Finding money often points to unexpected opportunities or recognizing your own value.", "Losing money might indicate anxiety about security or a loss of energy."],
            'school': ["Relates to feelings of being tested, learning lessons, or anxieties about performance.", "Being in a classroom could mean you are facing a new challenge in your waking life.", "It can also represent a desire for knowledge or unresolved childhood issues."],
            'friend': ["The appearance of a friend in a dream can represent a quality you see in them or a part of your own personality.", "It could also be your subconscious processing recent interactions with them.", "An argument with a friend in a dream might not be literal, but about an internal conflict."],
            'dog': ["Symbolizes loyalty, protection, and unconditional friendship.", "A friendly dog suggests you are feeling supported and accepted.", "An aggressive dog might represent a hidden fear or a conflict with someone you trust."],
            'cat': ["Represents independence, intuition, and feminine energy.", "A playful cat can suggest you need to embrace your more creative and free-spirited side.", "A mysterious or hidden cat could point to your own hidden intuition or secrets."],
            'baby': ["Often symbolizes a new beginning, a new idea, or a vulnerable part of yourself.", "Caring for a baby can mean you are nurturing a new aspect of your life.", "A crying baby might represent an unfulfilled need or an aspect of yourself that needs attention."],
            'running': ["Running away from something signifies avoidance of an issue.", "Running towards something shows ambition and drive.", "Feeling unable to run can symbolize a feeling of being stuck or powerless in a situation."],
            'hiding': ["Suggests you are trying to avoid a situation or are not ready to face something.", "It can also mean you are protecting a vulnerable part of yourself.", "The dream might be encouraging you to come out of your shell."],
            'test': ["Being unprepared for a test is a common dream theme related to anxiety and fear of failure.", "It reflects a lack of confidence or feeling scrutinized in your waking life.", "Passing a test can symbolize overcoming a challenge and gaining self-assurance."],
            'naked': ["Represents vulnerability, exposure, or a fear of being judged.", "Feeling comfortable while naked can mean you are open and accepting of yourself.", "Feeling ashamed might indicate you are hiding something or fear your true self will be revealed."]
        },
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful', 'wonderful', 'win', 'success', 'friend', 'hug', 'party', 'laugh', 'baby', 'friend', 'sun', 'light', 'flower', 'smile', 'peace'],
        negativeWords: ['sad', 'fear', 'fall', 'cry', 'attack', 'monster', 'lost', 'death', 'snake', 'blood', 'chased', 'angry', 'dark', 'naked', 'hiding', 'scream', 'fight', 'storm'],
        advice: [
            "Pay attention to your feelings today; they are trying to tell you something important.",
            "Take a moment to appreciate the small things around you.",
            "An opportunity for a new beginning may present itself. Be open to it.",
            "Trust your intuition. It's stronger than you think.",
            "Confront a small fear today. You are stronger than you believe.",
            "Embrace a new challenge today, even if it feels daunting.",
            "Reach out to a friend you haven't spoken to in a while.",
            "Listen to your inner voice; it's guiding you correctly.",
            "Don't be afraid to show your vulnerable side. It is a sign of strength.",
            "A new idea is brewing. Give it the attention it deserves."
        ]
    },
    uz: {
        symbols: {
            'suv': ["hissiy tozalanish, ongingiz osti yoki yangi boshlanishni anglatadi.", "hozirgi hissiy holatingizga ishora qilishi mumkin. Tinch suv - xotirjamlik, bo'ronli suv - tartibsizlik.", "tozalanish va yangilanishning kuchli ramzidir."],
            'uchish': ["erkinlik hissi, yangi nuqtai nazarga ega' bo'lish yoki vaziyatdan yuqoriga ko'tarilishni taklif qiladi.", "hayotingizda o'zingizni cheklanmagan va kuchli his qilayotganingizni anglatishi mumkin.", "hozirgi bosimlardan qochishni istayotganingizning belgisi bo'lishi mumkin."],
            'yiqilish': ["ko'pincha nazoratni yo'qotish, ishonchsizlik yoki muvaffəqiyyətsizlik hissini bildiradi.", "biror narsani yoki kimnidir qo'yib yuborishni ramziy qilishi mumkin.", "hozirgi hayotingizda duch kelayotgan xavotirlaringizni aks ettirishi mumkin."],
            'tishlar': ["tishlarning tushishi tashqi ko'rinishingiz, muloqot muammolari yoki stress haqidagi xavotirni anglatishi mumkin.", "shuningdek, o'tish davri yoki kuchsizlik hissini ifodalashi mumkin.", "boshqalarning sizni qanday qabul qilishi bilan bog'liq xavotirlarga aloqador bo'lishi mumkin."],
            'ilon': ["o'zgarish, yashirin qo'rquvlar yoki shifobaxsh energiyaning ramzidir.", "hayotingizdagi oldindan aytib bo'lmaydigan odam yoki vaziyatni ifodalashi mumkin.", "ko'pincha shaxsiy o'sishga va o'zingizning eski bir qismingizdan xalos bo'lishga ishora qiladi."],
            'o\'lim': ["kamdan-kam hollarda haqiqiy o'limni anglatadi. Odatda bir bobning tugashi va hayotdagi katta o'zgarishni ramziy qiladi.", "yangi narsalarga yo'l ochish uchun o'tmishni qo'yib yuborayotganingizni ko'rsatadi.", "o'zgarish va qayta tug'ilishning ijobiy belgisi bo'lishi mumkin."],
            'uy': ["sizning o'zingizni yoki ruhiyatingizni ifodalaydi. Turli xonalar shaxsiyatingizning turli jihatlarini ramziy qilishi mumkin.", "shikastlangan uy sizning zaif his qilayotganingizni anglatishi mumkin.", "yangi uyni o'rganish o'z-o'zini kashf qilishni taklif qilishi mumkin."],
            'quvish': ["hayotingizda bir masala yoki odamdan qochayotganingizni ko'rsatadi.", "sizni quvlayotgan narsa ko'pincha o'zingizning yuzlashmayotgan qismingizni ifodalaydi.", "qo'rquv yoki xavotirlaringizga to'g'ridan-to'g'ri yuzma-yuz turish uchun belgi."],
            'mashina': ["Hayotiy sayohatingizni va uni qanday boshqarayotganingizni anglatadi.", "Mashinaning holati sizning jismoniy yoki hissiy holatingizni aks ettirishi mumkin.", "Mashina haydash o'z taqdiringizni nazorat qilayotganingizni ko'rsatadi, yo'lovchi bo'lish esa boshqalar nazorat qilayotganini his qilishingizni anglatishi mumkin."],
            'pul': ["O'z-o'zini qadrlash, kuch yoki resurslarni ramziy qilishi mumkin.", "Pul topish ko'pincha kutilmagan imkoniyatlarga yoki o'z qadringizni tan olishga ishora qiladi.", "Pul yo'qotish xavfsizlik haqidagi xavotirni yoki energiya yo'qotilishini ko'rsatishi mumkin."],
            'maktab': ["Sinovdan o'tish, saboq olish yoki ishlash borasidagi xavotirlar bilan bog'liq.", "Sinfda bo'lish hayotingizda yangi qiyinchilikka duch kelayotganingizni anglatishi mumkin.", "Shuningdek, bilimga intilish yoki hal etilmagan bolalik muammolarini ifodalashi mumkin."],
            'do\'st': ["Tushdagi do'stning paydo bo'lishi, siz ularda ko'rgan fazilatni yoki o'z shaxsiyatingizning bir qismini ifodalashi mumkin.", "Shuningdek, bu sizning ongingiz ostidagi ular bilan yaqinda bo'lgan muloqotlarni qayta ishlashi bo'lishi mumkin.", "Tushda do'st bilan tortishuv tom ma'noda bo'lmasligi, balki ichki ziddiyat haqida bo'lishi mumkin."],
            'it': ["Sadoqat, himoya va so'zsiz do'stlikni ramziy qiladi.", "Do'stona it sizni qo'llab-quvvatlanayotgan va qabul qilingan his qilayotganingizni ko'rsatadi.", "Tajovuzkor it yashirin qo'rquvni yoki siz ishongan odam bilan ziddiyatni ifodalashi mumkin."],
            'mushuk': ["Mustaqillik, sezgi va ayollik energiyasini ifodalaydi.", "O'ynoqi mushuk sizning ijodiy va erkin ruhli tomoningizni qabul qilishingiz kerakligini taklif qilishi mumkin.", "Sirli yoki yashirin mushuk o'zingizning yashirin sezgingizga yoki sirlaringizga ishora qilishi mumkin."],
            'chaqaloq': ["Ko'pincha yangi boshlanish, yangi g'oya yoki o'zingizning zaif bir qismingizni ramziy qiladi.", "Chaqaloqqa g'amxo'rlik qilish hayotingizning yangi bir jihatini tarbiyalayotganingizni anglatishi mumkin.", "Yig'layotgan chaqaloq qondirilmagan ehtojni yoki e'tiborga muhtoj bo'lgan o'zingizning bir jihatini ifodalashi mumkin."],
            'yugurish': ["Biror narsadan qochish masaladan qochishni bildiradi.", "Biror narsaga tomon yugurish ambitsiya va intilishni ko'rsatadi.", "Yugura olmaslik hissi vaziyatda tiqilib qolganlik yoki kuchsizlik hissini anglatishi mumkin."],
            'yashirinish': ["Vaziyatdan qochishga harakat qilayotganingizni yoki biror narsaga yuzma-yuz kelishga tayyor emasligingizni ko'rsatadi.", "Shuningdek, o'zingizning zaif bir qismingizni himoya qilayotganingizni anglatishi mumkin.", "Tush sizni qobig'ingizdan chiqishga undayotgan bo'lishi mumkin."],
            'imtihon': ["Imtihonga tayyor bo'lmaslik - bu tashvish va muvaffəqiyyətsizlik qo'rquvi bilan bog'liq keng tarqalgan tush mavzusi.", "Bu hayotingizda ishonch yo'qligini yoki o'zingizni tanqid ostida his qilayotganingizni aks ettiradi.", "Imtihondan o'tish qiyinchilikni yengib o'tish va o'ziga ishonchni qozonishni anglatishi mumkin."],
            'yalang\'och': ["Zaiflik, fosh bo'lish yoki hukm qilinish qo'rquvini ifodalaydi.", "Yalang'och holda o'zingizni qulay his qilish, o'zingizga ochiq va qabul qilingan ekanligingizni anglatishi mumkin.", "Uyatchanlik hissi biror narsani yashirayotganingizni yoki haqiqiy o'zingiz fosh bo'lishidan qo'rqayotganingizni ko'rsatishi mumkin."]
        },
        positiveWords: ['baxtli', 'shodlik', 'sevgi', 'uchish', 'go\'zal', 'ajoyib', 'g\'alaba', 'muvaffaqiyat', 'do\'st', 'quchoqlash', 'bazm', 'kulgi', 'chaqaloq', 'do\'st', 'quyosh', 'nur', 'gul', 'tabassum', 'tinchlik'],
        negativeWords: ['xafa', 'qo\'rquv', 'yiqilish', 'yig\'lash', 'hujum', 'maxluq', 'yo\'qolgan', 'o\'lim', 'ilon', 'qon', 'quvish', 'jahldor', 'qorong\'u', 'yalang\'och', 'yashirinish', 'baqirish', 'janjal', 'bo\'ron'],
        advice: [
            "Bugun his-tuyg'ularingizga e'tibor bering; ular sizga muhim narsani aytishga harakat qilmoqda.",
            "Atrofingizdagi mayda narsalardan zavqlanish uchun bir lahza vaqt ajrating.",
            "Yangi boshlanish uchun imkoniyat paydo bo'lishi mumkin. Unga ochiq bo'ling.",
            "O'z sezgilaringizga ishoning. U siz o'ylagandan kuchliroq.",
            "Bugun kichik bir qo'rquv bilan yuzma-yuz keling. Siz o'zingiz ishongandan ko'ra kuchliroqsiz.",
            "Qo'rqinchli tuyulsa ham, bugun yangi qiyinchilikni qabul qiling.",
            "Ancha vaqtdan beri gaplashmagan do'stingiz bilan bog'laning.",
            "Ichki ovozingizga quloq tuting; u sizni to'g'ri yo'naltirmoqda.",
            "Zaif tomoningizni ko'rsatishdan qo'rqmang. Bu kuch belgisidir.",
            "Yangi g'oya pishib yetilmoqda. Unga munosib e'tibor bering."
        ]
    },
    ru: {
        symbols: {
            'вода': ["символизирует эмоциональное очищение, ваше подсознание или новое начало.", "может указывать на ваше текущее эмоциональное состояние. Спокойная вода означает мир, бурная вода означает смятение.", "является мощным символом очищения и обновления."],
            'летать': ["предполагает чувство свободы, обретение новой перспективы или возвышение над ситуацией.", "может означать, что вы чувствуете себя неограниченным и сильным в своей реальной жизни.", "может быть признаком того, что вы хотите уйти от текущего давления."],
            'падать': ["часто указывает на потерю контроля, неуверенность или чувство неудачи.", "может символизировать отпускание чего-то или кого-то.", "может отражать тревоги, с которыми вы сталкиваетесь в своей жизни прямо сейчас."],
            'зубы': ["потеря зубов может символизировать беспокойство о вашей внешности, проблемы с общением или стресс.", "также может представлять переход или чувство бессилия.", "может быть связано с беспокойством о том, как вас воспринимают другие."],
            'змея': ["является символом трансформации, скрытых страхов или целительной энергии.", "может представлять человека или ситуацию в вашей жизни, которые непредсказуемы.", "часто указывает на личностный рост и избавление от старой части себя."],
            'смерть': ["редко означает буквальную смерть. Обычно символизирует конец главы и серьезные изменения в жизни.", "предполагает, что вы отпускаете прошлое, чтобы освободить место для нового.", "может быть положительным знаком трансформации и возрождения."],
            'дом': ["представляет ваше «я» или вашу психику. Разные комнаты могут символизировать разные аспекты вашей личности.", "поврежденный дом может означать, что вы чувствуете себя уязвимым.", "исследование нового дома может предполагать самопознание."],
            'погоня': ["указывает на то, что вы избегаете проблемы или человека в своей реальной жизни.", "то, что вас преследует, часто представляет часть вас самих, с которой вы не сталкиваетесь.", "это знак того, что нужно встретиться со своими страхами или тревогами лицом к лицу."],
            'машина': ["Представляет путешествие вашей жизни и то, как вы им управляете.", "Состояние машины может отражать ваше физическое или эмоциональное состояние.", "Вождение машины показывает, что вы контролируете свою судьбу, а быть пассажиром может означать, что вы чувствуете, что контролируют другие."],
            'деньги': ["Могут символизировать самооценку, власть или ресурсы.", "Нахождение денег часто указывает на неожиданные возможности или признание вашей ценности.", "Потеря денег может указывать на беспокойство о безопасности или потерю энергии."],
            'школа': ["Относится к чувствам тестирования, усвоения уроков или беспокойству о производительности.", "Нахождение в классе может означать, что вы сталкиваетесь с новой проблемой в своей реальной жизни.", "Это также может представлять желание знаний или нерешенные детские проблемы."],
            'друг': ["Появление друга во сне может представлять качество, которое вы видите в нем, или часть вашей собственной личности.", "Это также может быть обработкой вашим подсознанием недавних взаимодействий с ним.", "Ссора с другом во сне может быть не буквальной, а о внутреннем конфликте."],
            'собака': ["Символизирует верность, защиту и безусловную дружбу.", "Дружелюбная собака предполагает, что вы чувствуете поддержку и принятие.", "Агрессивная собака может представлять скрытый страх или конфликт с кем-то, кому вы доверяете."],
            'кот': ["Представляет независимость, интуицию и женскую энергию.", "Игривый кот может предложить вам принять свою более творческую и свободную сторону.", "Таинственный или скрытый кот может указывать на вашу собственную скрытую интуицию или секреты."],
            'ребенок': ["Часто символизирует новое начало, новую идею или уязвимую часть вас самих.", "Забота о ребенке может означать, что вы воспитываете новый аспект своей жизни.", "Плачущий ребенок может представлять неудовлетворенную потребность или аспект вас, требующий внимания."],
            'бежать': ["Убегать от чего-то означает избегание проблемы.", "Бежать к чему-то показывает амбиции и драйв.", "Чувство невозможности бежать может символизировать чувство застревания или бессилия в ситуации."],
            'прятаться': ["Предполагает, что вы пытаетесь избежать ситуации или не готовы столкнуться с чем-то.", "Это также может означать, что вы защищаете уязвимую часть себя.", "Сон может побуждать вас выйти из своей скорлупы."],
            'тест': ["Быть неподготовленным к тесту - распространенная тема снов, связанная с тревогой и страхом неудачи.", "Это отражает неуверенность или чувство, что вас тщательно изучают в реальной жизни.", "Сдача теста может символизировать преодоление проблемы и обретение уверенности в себе."],
            'обнаженный': ["Представляет уязвимость, разоблачение или страх быть осужденным.", "Чувство комфорта в обнаженном виде может означать, что вы открыты и принимаете себя.", "Чувство стыда может указывать на то, что вы что-то скрываете или боитесь, что ваше истинное «я» будет раскрыто."]
        },
        positiveWords: ['счастье', 'радость', 'любовь', 'летать', 'красивый', 'чудесный', 'победа', 'успех', 'друг', 'объятие', 'вечеринка', 'смех', 'ребенок', 'солнце', 'свет', 'цветок', 'улыбка', 'мир'],
        negativeWords: ['грустный', 'страх', 'падать', 'плакать', 'атака', 'монстр', 'потерянный', 'смерть', 'змея', 'кровь', 'погоня', 'злой', 'темный', 'голый', 'прятаться', 'крик', 'драка', 'шторм'],
        advice: [
            "Обратите внимание на свои чувства сегодня; они пытаются сказать вам что-то важное.",
            "Уделите минуту, чтобы оценить мелочи вокруг вас.",
            "Может представиться возможность для нового начала. Будьте открыты для этого.",
            "Доверяйте своей интуиции. Она сильнее, чем вы думаете.",
            "Встретьтесь с небольшим страхом сегодня. Вы сильнее, чем верите.",
            "Примите новый вызов сегодня, даже если он кажется пугающим.",
            "Свяжитесь с другом, с которым вы давно не разговаривали.",
            "Прислушайтесь к своему внутреннему голосу; он направляет вас правильно.",
            "Не бойтесь показать свою уязвимую сторону. Это признак силы.",
            "Назревает новая идея. Уделите ей то внимание, которого она заслуживает."
        ]
    }
};

const offlineTemplates: Record<string, { meaningIntro: string; symbolPrefix: string; symbolSuffix: string; noSymbol: string; insight: string; story: string; }> = {
    en: {
        meaningIntro: "Your dream is a reflection of your inner world. ",
        symbolPrefix: "The symbol of '",
        symbolSuffix: "' in your dream ",
        noSymbol: "It seems to be about your daily thoughts and feelings.",
        insight: "This is a basic analysis. For a deeper understanding, consider your recent life events and emotions.",
        story: "In a realm of slumber, your mind painted a scene, hinting at the whispers of your soul."
    },
    uz: {
        meaningIntro: "Tushingiz ichki dunyongizning aksidir. ",
        symbolPrefix: "Tushingizdagi '",
        symbolSuffix: "' ramzi ",
        noSymbol: "Bu sizning kundalik o'ylaringiz va his-tuyg'ularingiz haqida bo'lib tuyuladi.",
        insight: "Bu oddiy tahlil. Chuqurroq tushunish uchun yaqinda bo'lib o'tgan voqealar va his-tuyg'ularingizni o'ylab ko'ring.",
        story: "Uyqu olamida ongingiz ruhingiz shivirlariga ishora qiluvchi manzarani chizdi."
    },
    ru: {
        meaningIntro: "Ваш сон - это отражение вашего внутреннего мира. ",
        symbolPrefix: "Символ '",
        symbolSuffix: "' в вашем сне ",
        noSymbol: "Кажется, это о ваших повседневных мыслях и чувствах.",
        insight: "Это базовый анализ. Для более глубокого понимания учитывайте недавние события вашей жизни и эмоции.",
        story: "В царстве сна ваш разум нарисовал сцену, намекающую на шепот вашей души."
    },
};

const getOfflineInterpretation = (dream: string, lang: Language): DreamPrediction => {
    const dictionary = offlineDictionaries[lang] || offlineDictionaries.en!;
    const templates = offlineTemplates[lang] || offlineTemplates.en;
    
    const dreamWords = dream.toLowerCase().match(/\b(\w+)\b/g) || [];

    let meaning = templates.meaningIntro;
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let positiveScore = 0;
    let negativeScore = 0;

    const foundSymbols: string[] = [];
    dreamWords.forEach(word => {
        if (dictionary.symbols[word]) {
            foundSymbols.push(word);
        }
        if (dictionary.positiveWords.includes(word)) positiveScore++;
        if (dictionary.negativeWords.includes(word)) negativeScore++;
    });

    if (foundSymbols.length > 0) {
        const mainSymbol = foundSymbols[0];
        meaning += `${templates.symbolPrefix}${mainSymbol}${templates.symbolSuffix}${dictionary.symbols[mainSymbol][0]}`;
    } else {
        meaning += templates.noSymbol;
    }

    if (positiveScore > negativeScore) sentiment = 'positive';
    if (negativeScore > positiveScore) sentiment = 'negative';

    return {
        generalMeaning: meaning,
        nextDayAdvice: dictionary.advice[Math.floor(Math.random() * dictionary.advice.length)],
        luckPercentage: Math.floor(Math.random() * 51) + 50, // 50-100
        sentiment: sentiment,
        psychologicalInsight: templates.insight,
        story: templates.story,
        offline: true,
    };
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAI();
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                generalMeaning: { type: Type.STRING },
                nextDayAdvice: { type: Type.STRING },
                luckPercentage: { type: Type.INTEGER },
                sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                psychologicalInsight: { type: Type.STRING },
                story: { type: Type.STRING },
            },
            required: ['generalMeaning', 'nextDayAdvice', 'luckPercentage', 'sentiment', 'psychologicalInsight', 'story'],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a mystical dream interpreter. The user's dream is: "${dream}".
            Analyze this dream and provide a mystical, insightful, and positive interpretation.
            IMPORTANT: You MUST provide the response in the language code: "${language}". 
            If the code is 'uz', write in Uzbek. If 'ru', write in Russian.
            Your response must be a JSON object that strictly follows the provided schema. 
            The 'story' should be a short, mystical narrative (2-3 sentences) in ${language}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema,
                safetySettings,
            },
        });

        if (!response.text) {
            throw new Error("Empty response from AI");
        }

        const parsed = JSON.parse(response.text);
        return { ...parsed, offline: false };

    } catch (e) {
        console.error("AI interpretation failed, falling back to offline.", e);
        return getOfflineInterpretation(dream, language);
    }
};

export const getDeepSummary = async (dreams: StoredDream[], language: Language): Promise<DeepSummary> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            futurePrediction: { type: Type.STRING },
        },
        required: ['summary', 'futurePrediction'],
    };

    const dreamTexts = dreams.map((d, i) => `Dream ${i + 1}: ${d.dream}`).join('\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // For deeper analysis
        contents: `Analyze the following dreams from a user. Identify overarching themes, recurring symbols, and the user's emotional journey. Provide a concise summary of the key psychological insights and a mystical prediction for their near future based on this entire dream cycle.
        IMPORTANT: Respond in ${language} language.
        Dreams:\n${dreamTexts}`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for deep summary.");
    }
    return JSON.parse(response.text) as DeepSummary;
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            symbol: { type: Type.STRING },
            islamic: { type: Type.STRING },
            psychological: { type: Type.STRING },
            lifeAdvice: { type: Type.STRING },
        },
        required: ['symbol', 'islamic', 'psychological', 'lifeAdvice'],
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a detailed meaning for the dream symbol "${symbol}" in ${language}. Include three perspectives: a traditional Islamic interpretation (based on sources like Ibn Sirin), a modern psychological interpretation (referencing Jungian archetypes or Freudian concepts), and practical life advice derived from the symbol's meaning. The symbol should be returned in the response. Ensure all descriptions are in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for symbol meaning.");
    }
    return JSON.parse(response.text) as DreamSymbolMeaning;
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            prediction: { type: Type.STRING },
        },
        required: ['prediction'],
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, positive, and slightly mystical daily prediction for a user of a dream analysis app. The language is ${language}. It should be one sentence, like a fortune cookie message.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for daily prediction.");
    }
    return JSON.parse(response.text) as { prediction: string };
};

export const getPredictionFromLastDream = async (lastDream: string, language: Language): Promise<CardPredictionResult> => {
    const ai = getAI();
     const responseSchema = {
        type: Type.OBJECT,
        properties: {
            prediction: { type: Type.STRING },
        },
        required: ['prediction'],
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the user's last dream, provide a one-sentence prediction or piece of advice for their day. The dream was: "${lastDream}". Respond in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for prediction from last dream.");
    }
    return JSON.parse(response.text) as CardPredictionResult;
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            prediction: { type: Type.STRING },
        },
        required: ['prediction'],
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `The user has picked a dream card with the theme "${cardType}". Generate a short, mystical, and insightful one-sentence prediction related to this theme. Respond in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for card prediction.");
    }
    return JSON.parse(response.text) as CardPredictionResult;
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            state: { type: Type.STRING, enum: ['good', 'warning', 'warm', 'dark'] },
            reason: { type: Type.STRING },
        },
        required: ['state', 'reason'],
    };
    const dreamTexts = dreams.map(d => d.dream).join('\n---\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the user's last ${dreams.length} dreams to determine their current overall "Dream State". The state should be one of: 'good', 'warning', 'warm', 'dark'. Provide a brief, one-sentence "reason" for this state in ${language}. The dreams are:\n${dreamTexts}`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for dream state.");
    }
    return JSON.parse(response.text) as DreamAnalysis;
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: { setting: string, time: string, genre: string }): Promise<DreamMachineResult> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            story: { type: Type.STRING },
            interpretation: { type: Type.STRING },
        },
        required: ['title', 'story', 'interpretation'],
    };
    
    let prompt = `Create a short, mystical, and narrative dream story in ${language} based on the following symbols: ${symbols.join(', ')}.`;
    if (settings) {
        prompt += ` The setting should be "${settings.setting}", the time of day "${settings.time}", and the genre "${settings.genre}".`;
    }
    prompt += ` Provide a creative title, the story itself (max 150 words), and a brief mystical interpretation of what this constructed dream might signify.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for dream story generation.");
    }
    return JSON.parse(response.text) as DreamMachineResult;
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            themes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
        },
        required: ['themes'],
    };
    const dreamTexts = dreams.map(d => d.dream).join('\n---\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze these ${dreams.length} dreams and identify 3 to 4 core archetypal themes or powerful symbols present. Return them as a JSON object with a single key "themes" which is an array of short, evocative strings (2-4 words each) in ${language}. The dreams are:\n${dreamTexts}`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for dream test choices.");
    }
    const parsed = JSON.parse(response.text);
    return parsed.themes as string[];
};


export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            personalityType: { type: Type.STRING },
            analysis: { type: Type.STRING },
            advice: { type: Type.STRING },
        },
        required: ['personalityType', 'analysis', 'advice'],
    };
    const dreamTexts = dreams.map(d => d.dream).join('\n---\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on these ${dreams.length} dreams, and with a special focus on the theme of "${choice}", analyze the user's personality. Provide a "personalityType" (e.g., "The Intuitive Creator", "The Practical Problem-Solver"), a detailed "analysis" of their subconscious patterns, and a short, actionable "advice". Respond in ${language}. The dreams are:\n${dreamTexts}`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for personality test.");
    }
    return JSON.parse(response.text) as DreamTestResult;
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { 
                        id: { type: Type.STRING },
                        group: { type: Type.STRING, enum: ['person', 'place', 'object', 'emotion', 'action'] },
                        description: { type: Type.STRING }
                    },
                    required: ['id', 'group', 'description'],
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                        label: { type: Type.STRING },
                    },
                    required: ['source', 'target', 'label'],
                }
            },
        },
        required: ['nodes', 'links'],
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the symbolic structure of this dream: "${dream}". 
        1. Identify up to 8 key elements (nodes) and classify them into groups: 'person', 'place', 'object', 'emotion', or 'action'.
        2. Provide a short, 1-sentence description of what this symbol specifically means in the context of this dream for each node.
        3. Describe the relationships (links) between these nodes with a short verb or label (e.g., 'leads to', 'fears', 'uses').
        Respond in ${language} using the JSON schema.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for dream map.");
    }
    return JSON.parse(response.text) as DreamMapData;
};

export const getDreamCoachInitialMessage = async (dreams: StoredDream[], language: Language): Promise<{ message: string }> => {
    const ai = getAI();
     const responseSchema = {
        type: Type.OBJECT,
        properties: {
            message: { type: Type.STRING },
        },
        required: ['message'],
    };
    const dreamTexts = dreams.map(d => d.dream).join('\n---\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an AI Dream Coach. Based on the user's last few dreams, provide one insightful, gentle, and encouraging opening question or observation to start a coaching conversation. Be concise and inviting. The user's dreams are:\n${dreamTexts}\n Respond in ${language} as a JSON object with a "message" field.`,
         config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });
    if (!response.text) {
        throw new Error("Empty response from AI for coach's initial message.");
    }
    return JSON.parse(response.text);
};

export const enhanceVideoPrompt = async (originalPrompt: string): Promise<string> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            enhancedPrompt: { type: Type.STRING }
        },
        required: ['enhancedPrompt']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Rewrite the following dream description into a detailed, cinematic, and artistic video prompt suitable for an AI video generator like Veo or Sora. Focus on visual details, lighting, camera movement, and atmosphere. Keep it under 400 characters if possible, but make it vivid. Original dream: "${originalPrompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema
        }
    });

    if (!response.text) return originalPrompt;
    return JSON.parse(response.text).enhancedPrompt;
};

export const generateVideoFromDream = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<Blob> => {
    // Always get a fresh AI instance to ensure key is up to date if re-selected
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set for fetching video.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                resolution,
                aspectRatio,
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await ai.operations.getVideosOperation({ operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was provided.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            console.error("Video fetch error:", errorText);
            throw new Error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`);
        }
        
        return await videoResponse.blob();

    } catch (e: any) {
        console.error("Error generating video:", e);
        // Propagate specific errors related to billing/permissions
        if (e.message && (e.message.includes("Requested entity was not found") || e.message.includes("404"))) {
            throw new Error("API Key Error: Requested entity was not found.");
        }
        throw e;
    }
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    const ai = getAI();
    // We used to wrap the prompt in "Mystical, dream-like..." here.
    // Now we trust the component to build the full prompt including the user's specific subject.
    // This allows the user to simply say "horse" and get a horse, or "dream about flying" and get that.
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
                safetySettings,
            },
        });

        if (response?.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    return part.inlineData.data; // This is the base64 string
                }
            }
        }
        
        throw new SafetyError("No image was generated. The prompt might have been blocked for safety reasons.");

    } catch (e) {
        if (e instanceof SafetyError) {
            throw e;
        }
        console.error("Error generating image:", e);
        throw new Error("Failed to generate image from dream.");
    }
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    const ai = getAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            country: { type: Type.STRING },
            trends: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING },
                        percentage: { type: Type.INTEGER }
                    },
                    required: ['theme', 'percentage']
                }
            },
            analysis: { type: Type.STRING },
        },
        required: ['country', 'trends', 'analysis'],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a dream analyst and cultural expert. Generate plausible, hypothetical statistics about the most common dreams in the country: "${country}".
        1. Identify 6-8 common dream themes (e.g., Flying, Water, Snakes, Exams) relevant to the culture or current events of that country.
        2. Assign a percentage to each theme (totaling roughly 100%).
        3. Provide a short "analysis" paragraph explaining why these dreams might be popular in that specific country (cultural symbols, climate, current events, etc.).
        IMPORTANT: Respond in ${language} language. Return ONLY the JSON object.`,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            safetySettings,
        },
    });

    if (!response.text) {
        throw new Error("Empty response from AI for country stats.");
    }
    return JSON.parse(response.text) as CountryDreamStats;
};