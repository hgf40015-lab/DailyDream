
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { CommunityPost, Comment } from '../types';
import { 
    HeartIcon, 
    HeartFilledIcon, 
    CommentBubbleIcon, 
    PaperPlaneIcon, 
    BookmarkIcon, 
    MoreHorizontalIcon,
    CommunityIcon
} from './icons/Icons';

// Sub-component for individual Story bubbles
const StoryCircle: React.FC<{ username: string; image?: string; isSeen?: boolean }> = ({ username, image, isSeen }) => {
    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className={`p-[3px] rounded-full ${isSeen ? 'bg-gray-600' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
                <div className="bg-black p-[2px] rounded-full">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                        {image ? (
                            <img src={image} alt={username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-white">{username.charAt(0)}</span>
                        )}
                    </div>
                </div>
            </div>
            <span className="text-xs text-white truncate w-16 text-center">{username}</span>
        </div>
    );
};

// Sub-component for a single Post Card
const PostCard: React.FC<{ post: CommunityPost; onLike: (id: string) => void; onComment: (id: string, text: string) => void; currentUserId: string }> = ({ post, onLike, onComment }) => {
    const { translations } = useContext(LanguageContext);
    const [isLiked, setIsLiked] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleLikeClick = () => {
        setIsLiked(!isLiked);
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 300);
        onLike(post.id);
    };

    const handlePostComment = () => {
        if (!commentText.trim()) return;
        onComment(post.id, commentText);
        setCommentText('');
    };

    // Deterministic gradient based on post ID for visual variety
    const getGradient = (id: string) => {
        const gradients = [
            'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800',
            'bg-gradient-to-bl from-blue-900 via-cyan-900 to-teal-800',
            'bg-gradient-to-tr from-emerald-900 via-green-900 to-lime-900',
            'bg-gradient-to-r from-red-900 via-orange-900 to-yellow-900',
            'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900'
        ];
        return gradients[parseInt(id.slice(-1)) % gradients.length];
    };

    return (
        <div className="bg-black sm:bg-gray-900 border-b sm:border border-gray-800 sm:rounded-lg mb-4 w-full max-w-[470px] mx-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-xs">
                        {post.authorAlias.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-sm leading-tight">{post.authorAlias}</p>
                        <p className="text-[10px] text-gray-400">{translations.originalAudio}</p>
                    </div>
                </div>
                <button className="text-gray-400 w-5 h-5"><MoreHorizontalIcon /></button>
            </div>

            {/* "Image" Area - Text as Image */}
            <div className={`w-full aspect-[4/5] ${getGradient(post.id)} flex items-center justify-center p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <p className="text-xl md:text-2xl font-serif text-center text-white/90 drop-shadow-md leading-relaxed select-none relative z-10">
                    "{post.dream}"
                </p>
            </div>

            {/* Action Bar */}
            <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-4">
                        <button onClick={handleLikeClick} className={`w-7 h-7 transition-transform ${likeAnim ? 'scale-125' : ''}`}>
                            {isLiked ? <span className="text-red-500"><HeartFilledIcon /></span> : <HeartIcon />}
                        </button>
                        <button onClick={() => setCommentOpen(!commentOpen)} className="w-7 h-7 hover:text-gray-300">
                            <CommentBubbleIcon />
                        </button>
                        <button className="w-7 h-7 hover:text-gray-300">
                            <PaperPlaneIcon />
                        </button>
                    </div>
                    <button className="w-7 h-7 hover:text-gray-300">
                        <BookmarkIcon />
                    </button>
                </div>

                {/* Likes Count */}
                <p className="font-semibold text-sm mb-1">{post.likes + (isLiked ? 1 : 0)} {translations.likes}</p>

                {/* Caption */}
                <div className="text-sm mb-1">
                    <span className="font-semibold mr-2">{post.authorAlias}</span>
                    <span className="text-gray-200">{post.dream.substring(0, 50)}...</span>
                </div>

                {/* Tags */}
                {post.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.map(t => <span key={t} className="text-blue-400 text-xs">#{t}</span>)}
                    </div>
                )}

                {/* View Comments */}
                <button 
                    onClick={() => setCommentOpen(!commentOpen)}
                    className="text-gray-500 text-sm mb-2"
                >
                    {post.comments.length > 0 ? `${translations.viewAllComments} (${post.comments.length})` : translations.addComment}
                </button>

                {/* Timestamp */}
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">
                    {new Date(post.date).toLocaleDateString()}
                </p>

                {/* Add Comment Input */}
                {commentOpen && (
                    <div className="flex items-center gap-2 border-t border-gray-800 pt-3">
                        <span className="text-xl">😊</span>
                        <input 
                            type="text" 
                            placeholder={`${translations.addComment}...`}
                            className="bg-transparent text-sm flex-grow outline-none text-white placeholder-gray-500"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <button 
                            onClick={handlePostComment}
                            disabled={!commentText.trim()}
                            className="text-blue-500 font-semibold text-sm disabled:opacity-50"
                        >
                            {translations.postDream.split(' ')[0] || "Post"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Community: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newDream, setNewDream] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const savedPosts = localStorage.getItem('community-posts');
        if (savedPosts) {
            setPosts(JSON.parse(savedPosts));
        } else {
            const initialPosts: CommunityPost[] = [
                {
                    id: '1',
                    dream: "I was flying over a golden city made of glass. The sky was purple and two moons were visible.",
                    authorAlias: "StarGazer",
                    date: new Date(Date.now() - 86400000).toISOString(),
                    likes: 42,
                    comments: [],
                    tags: ['flying', 'space']
                },
                {
                    id: '2',
                    dream: "Tushimda katta ilonni ko'rdim, lekin u menga hujum qilmadi. Shunchaki oldimdan o'tib ketdi.",
                    authorAlias: "MysticUser",
                    date: new Date(Date.now() - 3600000).toISOString(),
                    likes: 15,
                    comments: [],
                    tags: ['snake', 'nature']
                }
            ];
            setPosts(initialPosts);
            localStorage.setItem('community-posts', JSON.stringify(initialPosts));
        }
    }, []);

    const handlePostDream = () => {
        if (!newDream.trim()) return;
        const post: CommunityPost = {
            id: Date.now().toString(),
            dream: newDream,
            authorAlias: translations.anonymous,
            date: new Date().toISOString(),
            likes: 0,
            comments: [],
            tags: ['dream', 'community']
        };
        const updatedPosts = [post, ...posts];
        setPosts(updatedPosts);
        localStorage.setItem('community-posts', JSON.stringify(updatedPosts));
        setNewDream('');
        setIsCreating(false);
    };

    const handleComment = (postId: string, text: string) => {
        const comment: Comment = {
            id: Date.now().toString(),
            author: "You",
            text: text,
            date: new Date().toISOString()
        };
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p);
        setPosts(updatedPosts);
        localStorage.setItem('community-posts', JSON.stringify(updatedPosts));
    };

    const handleLike = (postId: string) => {
        // Logic handled visually in subcomponent, usually you'd verify against user ID
        // For local demo, we just update count in state for persistence
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
        setPosts(updatedPosts);
        localStorage.setItem('community-posts', JSON.stringify(updatedPosts));
    }

    // Mock stories
    const stories = [
        { name: 'Your Story', img: null },
        { name: 'Luna_Dream', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
        { name: 'AstroBoy', img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' },
        { name: 'Morpheus', img: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80' },
        { name: 'Neo', img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80' },
        { name: 'Trinity', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
    ];

    return (
        <div className="max-w-2xl mx-auto pb-10">
            {/* Top Bar / Logo Area */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-black sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 text-white"><CommunityIcon /></div>
                    <span className="text-xl font-bold font-serif italic text-white tracking-wide">Daily Dream</span>
                </div>
                <div className="flex gap-4">
                    <button className="text-white hover:text-gray-300 w-6 h-6"><HeartIcon /></button>
                    <button className="text-white hover:text-gray-300 w-6 h-6"><PaperPlaneIcon /></button>
                </div>
            </div>

            {/* Stories Rail */}
            <div className="flex gap-4 overflow-x-auto p-4 border-b border-gray-800 bg-black no-scrollbar">
                {stories.map((s, i) => (
                    <StoryCircle key={i} username={s.name} image={s.img || undefined} isSeen={i > 2} />
                ))}
            </div>

            {/* Create Post Section (Simplified like "What's on your mind") */}
            <div className="bg-black p-4 border-b border-gray-800">
                {!isCreating ? (
                    <div 
                        onClick={() => setIsCreating(true)} 
                        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">You</div>
                        <span className="text-gray-500 text-sm">{translations.shareDreamPlaceholder}</span>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 animate-fade-in">
                        <textarea 
                            value={newDream}
                            onChange={(e) => setNewDream(e.target.value)}
                            placeholder={translations.dreamPlaceholder}
                            className="w-full bg-transparent text-white outline-none resize-none h-20 text-sm"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsCreating(false)} className="text-xs text-gray-400 font-bold px-3 py-1">{translations.cancel}</button>
                            <button onClick={handlePostDream} className="text-xs bg-blue-500 text-white px-4 py-1.5 rounded-md font-bold">{translations.share}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Feed */}
            <div className="pt-2 sm:pt-4 bg-black min-h-screen">
                {posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onLike={handleLike} 
                        onComment={handleComment}
                        currentUserId="current"
                    />
                ))}
            </div>
        </div>
    );
};

export default Community;
