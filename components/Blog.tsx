
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { BlogPost } from '../types';
import { BlogIcon } from './icons/Icons';

// Rich Mock Data
const getBlogPosts = (language: string): BlogPost[] => {
    // Basic localization for the content
    const isUz = language === 'uz';
    
    return [
        {
            id: '1',
            title: isUz ? "Nega biz tush ko'ramiz? Ilmiy nuqtai nazar" : "Why Do We Dream? The Science Explained",
            excerpt: isUz ? "Miyamiz uyqu paytida nima uchun hikoyalar yaratishini o'rganamiz." : "Explore the leading theories behind why our brains create stories while we sleep.",
            category: "Science",
            content: isUz ? `
                <p>Tushlar asrlar davomida insoniyatni qiziqtirib kelgan. Ammo fan bu haqda nima deydi?</p>
                <p><strong>1. Xotirani mustahkamlash:</strong> Uyqu paytida miya kun davomida olingan ma'lumotlarni saralaydi. Muhim xotiralar uzoq muddatli xotiraga o'tkaziladi.</p>
                <p><strong>2. Hissiy qayta ishlash:</strong> Tushlar bizga qiyin his-tuyg'ularni xavfsiz muhitda qayta ishlashga yordam beradi. REM uyqusi paytida miyadagi stress kimyoviy moddalari kamayadi.</p>
                <p><strong>3. Muammolarni hal qilish:</strong> Ko'plab ixtirolar va san'at asarlari tushda ko'rilgan. "Davriy jadval" tushda kashf qilinganini bilarmidingiz?</p>
            ` : `
                <p>Dreams have fascinated humanity for centuries. But what does science say?</p>
                <p><strong>1. Memory Consolidation:</strong> While sleeping, the brain sorts through information gathered during the day. Important memories are moved to long-term storage.</p>
                <p><strong>2. Emotional Processing:</strong> Dreams help us process difficult emotions in a safe environment. Stress chemicals in the brain decrease during REM sleep.</p>
                <p><strong>3. Problem Solving:</strong> Many inventions and works of art were inspired by dreams. Did you know the Periodic Table was discovered in a dream?</p>
            `,
            image: "https://images.unsplash.com/photo-1541199249251-f713e6d054ea?w=800&q=80"
        },
        {
            id: '2',
            title: isUz ? "Freyd va Yung: Ong ostiga ikki xil yo'l" : "Freud vs. Jung: Two Paths to the Unconscious",
            excerpt: isUz ? "Freydning istaklar va Yungning arxetiplar nazariyasi o'rtasidagi farq." : "Understanding the difference between Freudian wish fulfillment and Jungian archetypes.",
            category: "Psychology",
            content: isUz ? `
                <p>Zigmund Freyd va Karl Yung tushlarni tahlil qilishda ikki xil maktabni yaratdilar.</p>
                <p><strong>Freyd:</strong> U tushlarni "bostirilgan istaklarning amalga oshishi" deb hisoblagan. Uning fikricha, tushdagi har bir narsa yashirin ma'noga ega, ko'pincha bolalikdagi travmalar bilan bog'liq.</p>
                <p><strong>Yung:</strong> Karl Yung esa "Kollektiv Ongsizlik" tushunchasini kiritdi. U tushlarni kelajakka yo'naltirilgan xabarlar va universal ramzlar (arxetiplar) deb bildi.</p>
            ` : `
                <p>Sigmund Freud and Carl Jung created two different schools of thought in dream analysis.</p>
                <p><strong>Freud:</strong> He believed dreams were the "fulfillment of repressed wishes." In his view, everything in a dream has a hidden meaning, often linked to childhood trauma.</p>
                <p><strong>Jung:</strong> Carl Jung introduced the concept of the "Collective Unconscious." He saw dreams as future-oriented messages containing universal symbols (archetypes).</p>
            `,
            image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80"
        },
        {
            id: '3',
            title: isUz ? "Lucid Tushlar: Tushda uyg'onish san'ati" : "Lucid Dreaming: How to Wake Up in Your Dreams",
            excerpt: isUz ? "Tushingizni boshqarish va anglash uchun amaliy texnikalar." : "Practical techniques to achieve consciousness within your dream state.",
            category: "Spirituality",
            content: isUz ? `
                <p>Lucid tush - bu tush ko'rayotganingizni bilgan holatingizdir. Bu sizga tush stsenariysini o'zgartirish, uchish yoki qo'rquvlarni yengish imkonini beradi.</p>
                <p><strong>Texnikalar:</strong></p>
                <ul>
                    <li>- Haqiqatni tekshirish: Kun davomida "Men uxlayapmanmi?" deb so'rang.</li>
                    <li>- Tush kundaligi: Har tong tushingizni yozib boring.</li>
                    <li>- MILD usuli: Uxlashdan oldin "Bugun tushimda uyg'onaman" deb niyat qiling.</li>
                </ul>
            ` : `
                <p>A lucid dream is a state where you know you are dreaming. This allows you to change the dream scenario, fly, or overcome fears.</p>
                <p><strong>Techniques:</strong></p>
                <ul>
                    <li>- Reality Checks: Ask yourself "Am I dreaming?" throughout the day.</li>
                    <li>- Dream Journal: Write down your dreams every morning.</li>
                    <li>- MILD Method: Set an intention before sleeping: "Tonight I will wake up in my dream."</li>
                </ul>
            `,
            image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&q=80"
        },
        {
            id: '4',
            title: isUz ? "Tushdagi ranglar ma'nosi" : "The Meaning of Colors in Dreams",
            excerpt: isUz ? "Qizil, ko'k va yashil ranglar tushingizda nimani anglatadi?" : "What do red, blue, and green symbolize in your dreams?",
            category: "Psychology",
            content: "...",
            image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80"
        }
    ];
};

const Blog: React.FC = () => {
    const { translations, language } = useContext(LanguageContext);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const posts = getBlogPosts(language || 'en');
    
    const categories = [
        { id: 'All', label: translations.blogCatAll || 'All' },
        { id: 'Psychology', label: translations.blogCatPsychology || 'Psychology' },
        { id: 'Science', label: translations.blogCatScience || 'Science' },
        { id: 'Spirituality', label: translations.blogCatSpirituality || 'Spirituality' },
    ];

    const filteredPosts = activeCategory === 'All' 
        ? posts 
        : posts.filter(post => post.category === activeCategory);

    if (selectedPost) {
        return (
            <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
                <button 
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-2 text-pink-400 hover:text-pink-300 font-bold mb-6 transition-all transform hover:-translate-x-1"
                >
                    ← {translations.backToBlog || "Back"}
                </button>
                
                <div className="bg-gray-900/60 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="h-64 sm:h-96 w-full relative">
                        <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <span className="inline-block px-3 py-1 bg-pink-500/80 backdrop-blur-sm rounded-full text-xs font-bold text-white mb-3">
                                {selectedPost.category}
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-lg">{selectedPost.title}</h1>
                        </div>
                    </div>
                    
                    <div className="p-8 sm:p-12">
                        <div 
                            className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                        />
                        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between text-sm text-gray-500">
                            <span>Author: Daily Dream AI</span>
                            <span>{translations.readTime ? `5 min ${translations.readTime}` : '5 min read'}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-[80px] -z-10"></div>
                <div className="w-16 h-16 mx-auto text-pink-300 mb-4 animate-pulse">
                    <BlogIcon />
                </div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">{translations.blogTitle}</h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto mt-2">{translations.blogSubtitle}</p>
            </div>

            {/* Filter */}
            <div className="flex justify-center gap-2 mb-10 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                            activeCategory === cat.id 
                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                    <div 
                        key={post.id} 
                        onClick={() => setSelectedPost(post)}
                        className="bg-gray-800/60 rounded-2xl overflow-hidden border border-white/10 hover:border-pink-400/50 transition-all duration-300 group hover:-translate-y-2 shadow-xl cursor-pointer flex flex-col h-full"
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                                {post.category}
                            </div>
                        </div>
                        <div className="p-6 flex-grow flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors leading-tight">{post.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">{post.excerpt}</p>
                            <span className="text-pink-400 font-bold text-sm hover:text-pink-300 flex items-center gap-1 mt-auto">
                                {translations.readMore} ➔
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blog;