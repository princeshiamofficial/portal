import React, { useState } from 'react';
import { Template } from '../types.ts';

interface TemplatesProps {
    templates: Template[];
    loading: boolean;
    onSave?: (template: Partial<Template>) => void;
    onDelete?: (id: number) => void;
    onRestore?: (id: number) => void;
    onPermanentDelete?: (id: number) => void;
    onRestoreDefaults?: () => void;
}

const Templates: React.FC<TemplatesProps> = ({ templates, loading, onSave, onDelete, onRestore, onPermanentDelete, onRestoreDefaults }) => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit'>('create');
    const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({ title: '', content: '', type: 'Personal' });
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
    const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    // Initial tab determination when editing
    React.useEffect(() => {
        if (showModal && modalType === 'edit') {
            if (currentTemplate.imageUrl) setActiveTab('image');
            else if (currentTemplate.videoUrl) setActiveTab('video');
            else setActiveTab('text');
        } else if (showModal && modalType === 'create') {
            setActiveTab('text');
        }
    }, [showModal, modalType]);

    const handleTabChange = (tab: 'text' | 'image' | 'video') => {
        setActiveTab(tab);
        if (tab === 'text') {
            setCurrentTemplate(prev => ({ ...prev, imageUrl: '', videoUrl: '', mediaCaption: '' }));
        } else if (tab === 'image') {
            setCurrentTemplate(prev => ({ ...prev, videoUrl: '', content: '' }));
        } else if (tab === 'video') {
            setCurrentTemplate(prev => ({ ...prev, imageUrl: '', content: '' }));
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation for file size (allowed for images)
        if (type === 'image') {
            const maxSize = 10 * 1024 * 1024; // 10MB for images
            if (file.size > maxSize) {
                alert(`Image is too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
                return;
            }

            setUploading(true);
            const token = localStorage.getItem('fm_token');
            const formData = new FormData();
            formData.append('image', file);

            try {
                const res = await fetch('/api/templates/upload-image', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    setCurrentTemplate(prev => ({ ...prev, imageUrl: data.imageUrl, videoUrl: '' }));
                } else {
                    alert('Failed to upload image. Please try again.');
                }
            } catch (err) {
                console.error('Upload error:', err);
                alert('An error occurred during upload.');
            } finally {
                setUploading(false);
            }
        }
    };

    const activeTemplates = templates.filter(t => !t.deleted);
    const deletedTemplates = templates.filter(t => t.deleted);

    const openCreateModal = () => {
        setModalType('create');
        setCurrentTemplate({ title: '', content: '', type: 'Personal' });
        setShowModal(true);
    };

    const openEditModal = (template: Template) => {
        setModalType('edit');
        setCurrentTemplate({ ...template });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Manual validation for conditional requirement
        if (!currentTemplate.title?.trim()) {
            alert('Please provide a template title.');
            return;
        }

        if (activeTab === 'text' && !currentTemplate.content?.trim()) {
            alert('Please provide message content for the text template.');
            return;
        }

        if (activeTab === 'image' && !currentTemplate.imageUrl) {
            alert('Please upload an image for the image template.');
            return;
        }

        if (activeTab === 'video' && !currentTemplate.videoUrl?.trim()) {
            alert('Please provide a video URL.');
            return;
        }

        if (onSave) onSave(currentTemplate);
        setShowModal(false);
    };

    const handleDelete = (id: number) => {
        setTemplateToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (templateToDelete !== null && onDelete) {
            onDelete(templateToDelete);
        }
        setShowDeleteConfirm(false);
        setTemplateToDelete(null);
    };

    const handleRestore = (id: number) => {
        if (onRestore) onRestore(id);
    };



    const handleSystemRestore = () => {
        if (confirm('This will add all system default templates to your library. Your current custom templates will be preserved. Continue?') && onRestoreDefaults) {
            onRestoreDefaults();
            setShowRestoreModal(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Template copied to clipboard!');
    };

    return (
        <div className="flex-1">
            <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-end gap-6">
                <div className="hidden">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <span className="h-1 w-8 bg-red-500 rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Templates Library</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Messaging Templates</h2>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Standardized responses for quick WhatsApp engagement.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                    <button
                        onClick={() => setShowRestoreModal(true)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                        <i className="fa-solid fa-trash-can"></i> Trash {deletedTemplates.length > 0 && <span className="bg-slate-100 text-slate-400 px-1.5 rounded-md text-[10px] ml-1">{deletedTemplates.length}</span>}
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <i className="fa-solid fa-plus"></i> Create New
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <i className="fa-solid fa-circle-notch fa-spin text-red-500 text-4xl"></i>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="template-card bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative group h-full flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${template.type === 'Personal' ? 'bg-purple-50 text-purple-600' :
                                    template.type === 'System' ? 'bg-blue-50 text-blue-600' :
                                        'bg-orange-50 text-orange-600'
                                    }`}>
                                    {template.type}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(template.content)}
                                    className="copy-btn opacity-0 translate-x-2 transition-all w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"
                                >
                                    <i className="fa-solid fa-copy text-xs"></i>
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{template.title}</h3>

                            {/* Media Preview in Card */}
                            {(template.imageUrl || template.videoUrl) && (
                                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 relative group/media">
                                    {template.imageUrl ? (
                                        <img src={template.imageUrl} className="w-full h-full object-cover" alt="Template Media" />
                                    ) : (
                                        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                                            <video
                                                src={template.videoUrl}
                                                className="w-full h-full object-contain"
                                                controls
                                                preload="metadata"
                                            />
                                        </div>
                                    )}
                                    {template.mediaCaption && (
                                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-3">
                                            <p className="text-white text-[10px] font-bold truncate">
                                                <i className="fa-solid fa-quote-left mr-2 opacity-50"></i>
                                                {template.mediaCaption}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-slate-500 text-sm leading-relaxed flex-1">{template.content}</p>

                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: #TMP-0{template.id}</span>
                                <div className="flex gap-2 text-right">
                                    <button
                                        onClick={() => openEditModal(template)}
                                        className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all"
                                    >
                                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        <i className="fa-solid fa-trash text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Template Management Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {modalType === 'create' ? 'Create Template' : 'Edit Template'}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Design your WhatsApp response format.</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('text')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <i className="fa-solid fa-align-left text-[12px]"></i>
                                    <span>Text</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('image')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'image' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <i className="fa-solid fa-image text-[12px]"></i>
                                    <span>Image</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('video')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'video' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <i className="fa-solid fa-video text-[12px]"></i>
                                    <span>Video</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Template Title</label>
                                <input
                                    type="text"
                                    value={currentTemplate.title}
                                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
                                    placeholder="e.g., Welcome Greeting"
                                />
                            </div>

                            {activeTab === 'text' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Message Content</label>
                                        <textarea
                                            value={currentTemplate.content}
                                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                                            rows={8}
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all resize-none font-sans"
                                            placeholder="Write your message here... Use [name] for recipient."
                                        ></textarea>
                                        <p className="text-[10px] text-slate-400 mt-2 ml-1">Use <code className="bg-slate-100 px-1 rounded font-bold">[name]</code> for recipient name and <code className="bg-slate-100 px-1 rounded font-bold">[business]</code> for store name.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Template Image</label>
                                        <div className="relative">
                                            {currentTemplate.imageUrl ? (
                                                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 aspect-video group/img shadow-sm">
                                                    <img src={currentTemplate.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentTemplate(prev => ({ ...prev, imageUrl: '' }))}
                                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover/img:opacity-100"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all overflow-hidden relative">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <i className="fa-solid fa-image text-slate-400 text-2xl"></i>
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload Image</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} disabled={uploading} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Media Caption (Optional)</label>
                                        <input
                                            type="text"
                                            value={currentTemplate.mediaCaption || ''}
                                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, mediaCaption: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
                                            placeholder="Add a caption for your image..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'video' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Video Source URL</label>

                                        {/* Video Preview in Modal */}
                                        {currentTemplate.videoUrl && (
                                            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-slate-100 aspect-video bg-slate-900 relative group/vid shadow-sm">
                                                <video
                                                    src={currentTemplate.videoUrl}
                                                    className="w-full h-full object-contain"
                                                    controls
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentTemplate(prev => ({ ...prev, videoUrl: '' }))}
                                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover/vid:opacity-100 z-10"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                                </button>
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            value={currentTemplate.videoUrl || ''}
                                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, videoUrl: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                                            placeholder="https://example.com/video.mp4"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 ml-1">Note: Only direct video links are supported. Paste the URL above.</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Media Caption (Optional)</label>
                                        <input
                                            type="text"
                                            value={currentTemplate.mediaCaption || ''}
                                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, mediaCaption: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
                                            placeholder="Add a caption for your video..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-paper-plane text-xs"></i>
                                    <span>{modalType === 'create' ? 'Create Template' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fa-solid fa-trash-can text-3xl"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Delete Template?</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">This action is permanent and cannot be undone. Are you sure you want to remove this template from your library?</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trash / Restore Templates Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Trash Bin</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Recently deleted templates can be restored to your library.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSystemRestore}
                                    className="h-10 px-4 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center gap-2 hover:bg-amber-200 transition-all"
                                    title="Restore System Defaults"
                                >
                                    <i className="fa-solid fa-rotate-left"></i>
                                    <span>Defaults</span>
                                </button>
                                <button
                                    onClick={() => setShowRestoreModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {deletedTemplates.length === 0 ? (
                                <div className="text-center py-20 px-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                        <i className="fa-solid fa-trash-can text-2xl"></i>
                                    </div>
                                    <p className="text-slate-400 font-bold">Trash bin is empty</p>
                                </div>
                            ) : (
                                deletedTemplates.map((template) => (
                                    <div key={template.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group">
                                        <div className="flex-1 overflow-hidden mr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{template.id}</span>
                                                <h4 className="font-bold text-slate-800 truncate">{template.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{template.content}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRestore(template.id)}
                                                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <i className="fa-solid fa-rotate-left"></i>
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => onPermanentDelete && onPermanentDelete(template.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                                                title="Delete Permanently"
                                            >
                                                <i className="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                                Restored templates will immediately reappear in your main library grid.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;
