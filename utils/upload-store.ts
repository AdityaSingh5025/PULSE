import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UploadState {
    videoUrl: string;
    thumbnailUrl: string;
    videoProgress: number;
    thumbnailProgress: number;
    isVideoUploading: boolean;
    isThumbnailUploading: boolean;
    videoError: string | null;
    thumbnailError: string | null;
    title: string;
    description: string;
}

interface UploadActions {
    setVideoUrl: (url: string) => void;
    setThumbnailUrl: (url: string) => void;
    setVideoProgress: (progress: number) => void;
    setThumbnailProgress: (progress: number) => void;
    setIsVideoUploading: (isUploading: boolean) => void;
    setIsThumbnailUploading: (isUploading: boolean) => void;
    setVideoError: (error: string | null) => void;
    setThumbnailError: (error: string | null) => void;
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    resetVideoUpload: () => void;
    resetThumbnailUpload: () => void;
    resetAll: () => void;
}

const initialState: UploadState = {
    videoUrl: '',
    thumbnailUrl: '',
    videoProgress: 0,
    thumbnailProgress: 0,
    isVideoUploading: false,
    isThumbnailUploading: false,
    videoError: null,
    thumbnailError: null,
    title: '',
    description: '',
};

export const useUploadStore = create<UploadState & UploadActions>()(
    persist(
        (set) => ({
            ...initialState,
            setVideoUrl: (url) => set({ videoUrl: url }),
            setThumbnailUrl: (url) => set({ thumbnailUrl: url }),
            setVideoProgress: (progress) => set({ videoProgress: progress }),
            setThumbnailProgress: (progress) => set({ thumbnailProgress: progress }),
            setIsVideoUploading: (isUploading) => set({ isVideoUploading: isUploading }),
            setIsThumbnailUploading: (isUploading) => set({ isThumbnailUploading: isUploading }),
            setVideoError: (error) => set({ videoError: error }),
            setThumbnailError: (error) => set({ thumbnailError: error }),
            setTitle: (title) => set({ title }),
            setDescription: (description) => set({ description }),
            resetVideoUpload: () =>
                set({
                    videoUrl: '',
                    videoProgress: 0,
                    isVideoUploading: false,
                    videoError: null,
                }),
            resetThumbnailUpload: () =>
                set({
                    thumbnailUrl: '',
                    thumbnailProgress: 0,
                    isThumbnailUploading: false,
                    thumbnailError: null,
                }),
            resetAll: () => set(initialState),
        }),
        {
            name: 'upload-storage',
            partialize: (state) => ({
                videoUrl: state.videoUrl,
                thumbnailUrl: state.thumbnailUrl,
                videoProgress: state.videoProgress,
                thumbnailProgress: state.thumbnailProgress,
                title: state.title,
                description: state.description,
            }),
        }
    )
);
