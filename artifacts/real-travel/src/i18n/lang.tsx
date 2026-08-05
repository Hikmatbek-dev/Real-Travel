import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "uz" | "ru" | "en";
export const LANGS: Lang[] = ["uz", "ru", "en"];
const STORAGE_KEY = "rt_lang";

/**
 * Whole-site translation. The redesigned pages hardcoded Uzbek text; this holds
 * every user-facing string in uz/ru/en. Language is kept in localStorage (not
 * the URL) so routing and SSR stay unchanged. DB content (tour/review text the
 * admin types) is not translated — only the interface chrome.
 */
const DICT = {
  uz: {
    currency: "so'm",
    nav: { home: "Bosh sahifa", tours: "Turlarimiz", about: "Biz haqimizda", contact: "Aloqa", book: "Turni band qilish" },
    hero: {
      badge: "Premium Tur Operator",
      title1: "Sayohatni",
      title2: "his qiling.",
      subtitle: "Dunyodagi eng sara sayohatlar va unutilmas sarguzashtlar.",
      searchPlaceholder: "Qayerga sayohat qilmoqchisiz?",
    },
    exclusive: { title: "Eksklyuziv Turlar", subtitle: "Premium toifadagi maxsus romantik va qiziqarli sayohat paketlari." },
    card: { details: "Tafsilotlar", book: "Band qilish", empty: "Hozircha turlar mavjud emas. Admin paneldan qo'shing." },
    popular: { title: "Mashhur davlatlar", subtitle: "Eng ko'p sayohat qilinadigan va sevib tanlanadigan manzillar" },
    why: {
      title: "Nega aynan biz?",
      subtitle: "Boshqalardan ajralib turadigan o'ziga xos qulayliklarimiz",
      f1t: "Premium Xizmat",
      f1d: "Bizning barcha turlarimiz yuqori sifat va mutlaq lyuks sharoitlarni kafolatlaydi.",
      f2t: "Ortiqcha xarajatsiz",
      f2d: "Agentlik bilan to'g'ridan-to'g'ri aloqa o'rnatib, ortiqcha vositachilarsiz sayohat qiling.",
      f3t: "24/7 Qo'llab-quvvatlash",
      f3d: "Sayohat davomida har qanday yordam uchun mutaxassislarimiz doim aloqada.",
    },
    reviewsHome: { title: "Mijozlarimiz fikri", empty: "Hozircha mijozlar fikri mavjud emas." },
    galleryHome: { title1: "REAL TRAVEL", title2: "sarguzashtlaridan namunalar", subtitle: "Biz bilan sayohat qilgan mijozlarimizning ajoyib damlaridan yorqin lavhalar" },
    faq: {
      title: "Tez-tez beriladigan savollar",
      subtitle: "Sayohatga oid savollaringizga qisqa javoblar",
      items: [
        { q: "Turlarni qanday qilib band qilsam bo'ladi?", a: "Saytdagi 'Turni band qilish' tugmasini bosing va o'z ma'lumotlaringizni qoldiring. Menejerlarimiz tez orada siz bilan bog'lanishadi." },
        { q: "Premium turlarga nimalar kiradi?", a: "Barcha premium turlarimiz 5 yulduzli mehmonxonalar, shaxsiy transferlar va eksklyuziv ekskursiyalarni o'z ichiga oladi." },
        { q: "To'lov qanday amalga oshiriladi?", a: "To'lov ofisimizda shartnoma asosida naqd yoki pul o'tkazish yo'li bilan amalga oshiriladi." },
      ],
    },
    toursPage: {
      title1: "Sayohat", title2: "turlari",
      subtitle: "Siz uchun maxsus tanlangan, eng mashhur va premium darajadagi sayohat yo'nalishlari.",
      searchPlaceholder: "Qidirish (Turlar bo'yicha)",
      countries: "Davlatlar", season: "Mavsum",
      all: "Barchasi",
      seasons: { spring: "Bahor", summer: "Yoz", autumn: "Kuz", winter: "Qish" },
      found: "Topilgan turlar:", count: "ta",
      sort: "Saralash:", sortPopular: "Ommabop", sortCheap: "Arzonroq", sortExpensive: "Qimmatroq",
      notFoundTitle: "Turlar topilmadi",
      notFoundText: "Kechirasiz, siz qidirgan yo'nalish yoki mavsum bo'yicha turlar hozircha yo'q. Iltimos, boshqa parametrlarni sinab ko'ring.",
      showAll: "Barcha turlarni ko'rish",
      startPrice: "Boshlang'ich narx", day: "Kun",
    },
    detail: {
      back: "Barcha turlar", perPersonPrice: "Narx (bir kishi uchun)",
      included: "Kiritilgan", excluded: "Kiritilmagan", itinerary: "Sayohat dasturi",
      notFound: "Tur topilmadi", allTours: "Barcha turlarga qaytish", book: "Turni band qilish", day: "kun",
    },
    aboutPage: {
      badge: "Kompaniya haqida", title1: "Bizning", title2: "hikoyamiz",
      heroSuffix: "— unutilmas va yuqori darajadagi sayohatlarni taqdim etuvchi rasmiy litsenziyalangan premium tur operator.",
      storyTitle: "Bizning hikoyamiz",
      story1: "Real Travel agentligi o'z faoliyatini insonlarga dunyoni kashf etishda yordam berish maqsadi bilan boshlagan. Bugungi kunga kelib biz minglab mijozlarga o'z orzularidagi sayohatlarni amalga oshirishda ko'maklashdik.",
      story2: "Bizning asosiy qadriyatimiz — har bir mijozning qiziqishlari va talablariga mos keluvchi shaxsiy yondashuvni ta'minlashdir. Sifat, xavfsizlik va qulaylik har doim biz uchun birinchi o'rinda.",
      missionTitle: "Missiyamiz",
      missionQuote: "\"Sayohat — bu yashash demakdir. Bizning missiyamiz har bir inson uchun dunyoning eng chiroyli burchaklariga xavfsiz va lyuks sayohat qilish imkoniyatini yaratishdir.\"",
    },
    contactPage: {
      title1: "Biz bilan", title2: "bog'laning",
      subtitle: "Sizning sayohatingiz shu yerdan boshlanadi. Barcha savollaringizga javob berishga va eng yaxshi turni tanlashga tayyormiz.",
      infoTitle: "Aloqa ma'lumotlari",
      phoneLabel: "Telefon raqam", addressLabel: "Manzil",
      hoursLabel: "Ish vaqti", hours1: "Dushanbadan shanbagacha 9:00 dan 18:30 gacha", hours2: "Yakshanba: Dam olish kuni",
      socialLabel: "Ijtimoiy tarmoqlar",
      formTitle: "Bizga yozing",
      nameLabel: "Ism va Familiya *", namePlaceholder: "To'liq ismingizni kiriting",
      phoneLabel2: "Telefon raqam *", phonePlaceholder: "+998 90 123 45 67",
      messageLabel: "Xabar *", messagePlaceholder: "Sayohat haqida o'z istaklaringizni yozib qoldiring...",
      send: "Xabarni yuborish", sending: "Yuborilmoqda...",
      successTitle: "Xabar yuborildi", successText: "Tez orada menejerlarimiz siz bilan bog'lanishadi. E'tiboringiz uchun rahmat.",
      mapTitle: "Xaritada ofisimiz",
    },
    booking: {
      title: "Band qilish",
      withTour: (name: string) => name,
      subTourSuffix: "turi bo'yicha so'rov qoldiring.",
      subNoTour: "Sayohat bo'yicha so'rov qoldiring.",
      nameLabel: "Ism va Familiya *", namePlaceholder: "Ismingizni kiriting",
      phoneLabel: "Telefon raqam *",
      noteLabel: "Qo'shimcha xabar (ixtiyoriy)", notePlaceholder: "Qandaydir istaklaringiz bo'lsa yozib qoldiring...",
      payGo: "To'lovga o'tish", processing: "To'lov sahifasiga o'tilmoqda...",
      errGeneric: "To'lov havolasini olishda xatolik yuz berdi.",
      errTooMany: "Bu raqamdan juda ko'p so'rov yuborildi. Birozdan so'ng urinib ko'ring yoki bizga qo'ng'iroq qiling.",
      errNetwork: "Internet tarmog'i bilan muammo yoki server xatosi. Iltimos qayta urinib ko'ring.",
    },
    footer: {
      tagline: "Biz dunyo bo'ylab eng yaxshi lyuks turlarni va unutilmas sayohatlarni taqdim etuvchi premium turistik agentlikmiz. Sayohatni biz bilan his qiling.",
      menu: "Menyu", toursHeading: "Turlar",
      t1: "Asal oyi", t2: "Sarguzasht", t3: "Oila", t4: "Shaharlar",
      contactHeading: "Aloqa Ma'lumotlari", hours: "Dush-Shan: 09:00 - 18:30",
      rights: "Barcha huquqlar himoyalangan.", developedBy: "Developed by",
    },
    notFound: { title: "Sahifa topilmadi", text: "Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.", back: "Bosh sahifaga qaytish" },
  },

  ru: {
    currency: "сум",
    nav: { home: "Главная", tours: "Туры", about: "О нас", contact: "Контакты", book: "Забронировать тур" },
    hero: {
      badge: "Премиум Тур Оператор",
      title1: "Почувствуйте",
      title2: "путешествие.",
      subtitle: "Лучшие путешествия мира и незабываемые приключения.",
      searchPlaceholder: "Куда вы хотите поехать?",
    },
    exclusive: { title: "Эксклюзивные туры", subtitle: "Особые романтические и увлекательные пакеты премиум-класса." },
    card: { details: "Подробнее", book: "Забронировать", empty: "Пока туров нет. Добавьте их в админ-панели." },
    popular: { title: "Популярные страны", subtitle: "Самые посещаемые и любимые направления" },
    why: {
      title: "Почему мы?",
      subtitle: "Наши особые преимущества, которые выделяют нас среди других",
      f1t: "Премиум сервис",
      f1d: "Все наши туры гарантируют высокое качество и абсолютный люкс.",
      f2t: "Без переплат",
      f2d: "Работайте напрямую с агентством, без лишних посредников.",
      f3t: "Поддержка 24/7",
      f3d: "Наши специалисты всегда на связи для любой помощи в поездке.",
    },
    reviewsHome: { title: "Отзывы клиентов", empty: "Пока нет отзывов клиентов." },
    galleryHome: { title1: "REAL TRAVEL", title2: "моменты из наших путешествий", subtitle: "Яркие кадры прекрасных моментов наших клиентов, путешествовавших с нами" },
    faq: {
      title: "Часто задаваемые вопросы",
      subtitle: "Краткие ответы на ваши вопросы о путешествиях",
      items: [
        { q: "Как забронировать тур?", a: "Нажмите кнопку «Забронировать тур» на сайте и оставьте свои данные. Наши менеджеры свяжутся с вами в ближайшее время." },
        { q: "Что входит в премиум-туры?", a: "Все наши премиум-туры включают 5-звёздочные отели, личные трансферы и эксклюзивные экскурсии." },
        { q: "Как производится оплата?", a: "Оплата производится в нашем офисе по договору наличными или банковским переводом." },
      ],
    },
    toursPage: {
      title1: "Туры", title2: "путешествий",
      subtitle: "Специально подобранные для вас самые популярные направления премиум-класса.",
      searchPlaceholder: "Поиск (по турам)",
      countries: "Страны", season: "Сезон",
      all: "Все",
      seasons: { spring: "Весна", summer: "Лето", autumn: "Осень", winter: "Зима" },
      found: "Найдено туров:", count: "шт",
      sort: "Сортировка:", sortPopular: "Популярные", sortCheap: "Дешевле", sortExpensive: "Дороже",
      notFoundTitle: "Туры не найдены",
      notFoundText: "К сожалению, по выбранному направлению или сезону туров пока нет. Пожалуйста, попробуйте другие параметры.",
      showAll: "Показать все туры",
      startPrice: "Начальная цена", day: "дн.",
    },
    detail: {
      back: "Все туры", perPersonPrice: "Цена (за человека)",
      included: "Включено", excluded: "Не включено", itinerary: "Программа тура",
      notFound: "Тур не найден", allTours: "Вернуться ко всем турам", book: "Забронировать тур", day: "дн.",
    },
    aboutPage: {
      badge: "О компании", title1: "Наша", title2: "история",
      heroSuffix: "— официально лицензированный премиум тур-оператор, предлагающий незабываемые путешествия высокого уровня.",
      storyTitle: "Наша история",
      story1: "Агентство Real Travel начало свою работу с целью помогать людям открывать мир. На сегодняшний день мы помогли тысячам клиентов осуществить путешествия их мечты.",
      story2: "Наша главная ценность — индивидуальный подход к интересам и запросам каждого клиента. Качество, безопасность и комфорт всегда на первом месте.",
      missionTitle: "Наша миссия",
      missionQuote: "«Путешествовать — значит жить. Наша миссия — дать каждому возможность безопасно и роскошно путешествовать в самые красивые уголки мира.»",
    },
    contactPage: {
      title1: "Свяжитесь", title2: "с нами",
      subtitle: "Ваше путешествие начинается здесь. Мы готовы ответить на все вопросы и помочь выбрать лучший тур.",
      infoTitle: "Контактная информация",
      phoneLabel: "Телефон", addressLabel: "Адрес",
      hoursLabel: "Часы работы", hours1: "С понедельника по субботу с 9:00 до 18:30", hours2: "Воскресенье: выходной",
      socialLabel: "Социальные сети",
      formTitle: "Напишите нам",
      nameLabel: "Имя и Фамилия *", namePlaceholder: "Введите ваше полное имя",
      phoneLabel2: "Телефон *", phonePlaceholder: "+998 90 123 45 67",
      messageLabel: "Сообщение *", messagePlaceholder: "Опишите ваши пожелания по путешествию...",
      send: "Отправить сообщение", sending: "Отправка...",
      successTitle: "Сообщение отправлено", successText: "Наши менеджеры свяжутся с вами в ближайшее время. Спасибо за внимание.",
      mapTitle: "Наш офис на карте",
    },
    booking: {
      title: "Бронирование",
      withTour: (name: string) => name,
      subTourSuffix: "— оставьте заявку на этот тур.",
      subNoTour: "Оставьте заявку на путешествие.",
      nameLabel: "Имя и Фамилия *", namePlaceholder: "Введите ваше имя",
      phoneLabel: "Телефон *",
      noteLabel: "Дополнительное сообщение (необязательно)", notePlaceholder: "Напишите ваши пожелания, если есть...",
      payGo: "Перейти к оплате", processing: "Переход на страницу оплаты...",
      errGeneric: "Ошибка при получении ссылки на оплату.",
      errTooMany: "С этого номера отправлено слишком много заявок. Попробуйте позже или позвоните нам.",
      errNetwork: "Проблема с интернетом или ошибка сервера. Пожалуйста, попробуйте снова.",
    },
    footer: {
      tagline: "Мы премиум туристическое агентство, предлагающее лучшие люкс-туры и незабываемые путешествия по всему миру. Почувствуйте путешествие с нами.",
      menu: "Меню", toursHeading: "Туры",
      t1: "Медовый месяц", t2: "Приключения", t3: "Семья", t4: "Города",
      contactHeading: "Контактная информация", hours: "Пн-Сб: 09:00 - 18:30",
      rights: "Все права защищены.", developedBy: "Developed by",
    },
    notFound: { title: "Страница не найдена", text: "Извините, запрашиваемая страница не существует или была удалена.", back: "Вернуться на главную" },
  },

  en: {
    currency: "UZS",
    nav: { home: "Home", tours: "Tours", about: "About us", contact: "Contact", book: "Book a tour" },
    hero: {
      badge: "Premium Tour Operator",
      title1: "Feel the",
      title2: "journey.",
      subtitle: "The world's finest journeys and unforgettable adventures.",
      searchPlaceholder: "Where would you like to travel?",
    },
    exclusive: { title: "Exclusive Tours", subtitle: "Special romantic and exciting premium-class travel packages." },
    card: { details: "Details", book: "Book now", empty: "No tours yet. Add them from the admin panel." },
    popular: { title: "Popular countries", subtitle: "The most visited and beloved destinations" },
    why: {
      title: "Why choose us?",
      subtitle: "The unique advantages that set us apart",
      f1t: "Premium Service",
      f1d: "All our tours guarantee high quality and absolute luxury.",
      f2t: "No extra costs",
      f2d: "Deal directly with the agency, without unnecessary middlemen.",
      f3t: "24/7 Support",
      f3d: "Our specialists are always available for any help during your trip.",
    },
    reviewsHome: { title: "Client reviews", empty: "No client reviews yet." },
    galleryHome: { title1: "REAL TRAVEL", title2: "moments from our journeys", subtitle: "Bright glimpses of wonderful moments from clients who travelled with us" },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Quick answers to your travel questions",
      items: [
        { q: "How can I book a tour?", a: "Click the 'Book a tour' button on the site and leave your details. Our managers will contact you shortly." },
        { q: "What is included in premium tours?", a: "All our premium tours include 5-star hotels, private transfers and exclusive excursions." },
        { q: "How is payment made?", a: "Payment is made at our office under a contract, in cash or by bank transfer." },
      ],
    },
    toursPage: {
      title1: "Travel", title2: "tours",
      subtitle: "Specially selected for you — the most popular, premium-class travel destinations.",
      searchPlaceholder: "Search (by tours)",
      countries: "Countries", season: "Season",
      all: "All",
      seasons: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
      found: "Tours found:", count: "",
      sort: "Sort:", sortPopular: "Popular", sortCheap: "Cheaper", sortExpensive: "More expensive",
      notFoundTitle: "No tours found",
      notFoundText: "Sorry, there are no tours for the selected destination or season yet. Please try other parameters.",
      showAll: "View all tours",
      startPrice: "Starting price", day: "Days",
    },
    detail: {
      back: "All tours", perPersonPrice: "Price (per person)",
      included: "Included", excluded: "Not included", itinerary: "Itinerary",
      notFound: "Tour not found", allTours: "Back to all tours", book: "Book a tour", day: "days",
    },
    aboutPage: {
      badge: "About the company", title1: "Our", title2: "story",
      heroSuffix: "— an officially licensed premium tour operator offering unforgettable, high-level journeys.",
      storyTitle: "Our story",
      story1: "Real Travel agency began its work with the goal of helping people discover the world. To date, we have helped thousands of clients make their dream journeys come true.",
      story2: "Our core value is a personal approach that matches every client's interests and needs. Quality, safety and comfort always come first for us.",
      missionTitle: "Our mission",
      missionQuote: "\"To travel is to live. Our mission is to give everyone the chance to travel safely and luxuriously to the most beautiful corners of the world.\"",
    },
    contactPage: {
      title1: "Get in", title2: "touch",
      subtitle: "Your journey starts here. We're ready to answer all your questions and help you choose the best tour.",
      infoTitle: "Contact information",
      phoneLabel: "Phone number", addressLabel: "Address",
      hoursLabel: "Working hours", hours1: "Monday to Saturday, 9:00 to 18:30", hours2: "Sunday: day off",
      socialLabel: "Social networks",
      formTitle: "Write to us",
      nameLabel: "Full name *", namePlaceholder: "Enter your full name",
      phoneLabel2: "Phone number *", phonePlaceholder: "+998 90 123 45 67",
      messageLabel: "Message *", messagePlaceholder: "Describe your travel wishes...",
      send: "Send message", sending: "Sending...",
      successTitle: "Message sent", successText: "Our managers will contact you shortly. Thank you for your attention.",
      mapTitle: "Our office on the map",
    },
    booking: {
      title: "Booking",
      withTour: (name: string) => name,
      subTourSuffix: "— leave a request for this tour.",
      subNoTour: "Leave a travel request.",
      nameLabel: "Full name *", namePlaceholder: "Enter your name",
      phoneLabel: "Phone number *",
      noteLabel: "Additional message (optional)", notePlaceholder: "Write your wishes, if any...",
      payGo: "Proceed to payment", processing: "Redirecting to payment page...",
      errGeneric: "An error occurred while getting the payment link.",
      errTooMany: "Too many requests from this number. Please try later or call us.",
      errNetwork: "Network problem or server error. Please try again.",
    },
    footer: {
      tagline: "We are a premium travel agency offering the best luxury tours and unforgettable journeys around the world. Feel the journey with us.",
      menu: "Menu", toursHeading: "Tours",
      t1: "Honeymoon", t2: "Adventure", t3: "Family", t4: "Cities",
      contactHeading: "Contact information", hours: "Mon-Sat: 09:00 - 18:30",
      rights: "All rights reserved.", developedBy: "Developed by",
    },
    notFound: { title: "Page not found", text: "Sorry, the page you are looking for does not exist or has been removed.", back: "Back to home" },
  },
};

export type Dict = (typeof DICT)["uz"];

type LangContextValue = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

const LangContext = createContext<LangContextValue>({ lang: "uz", setLang: () => {}, t: DICT.uz });

function readInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "uz" || saved === "ru" || saved === "en") return saved;
  } catch {
    // localStorage may be unavailable (private mode) — fall back to default.
  }
  return "uz";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Ignore — the choice still applies for this session.
    }
  };

  return <LangContext.Provider value={{ lang, setLang, t: DICT[lang] }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

export const LANG_LABELS: Record<Lang, string> = { uz: "O'z", ru: "Ру", en: "En" };
