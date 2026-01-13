"use client" // This component must be a client component

import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
import { useRef, useState } from "react";

interface fileuploadProps {
    onSuccess?: (response: any) => void;
    onProgress?: (progress: number) => void;
    fileType?: "image" | "video";
}

const Fileupload = ({onSuccess , onProgress, fileType}:fileuploadProps) => {
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState(null as string | null);
   const [progress, setProgress] = useState(0);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const abortController = new AbortController();

   const validateFile = (file: File) => {
    if (fileType === "video") {
        if (!file.type.startsWith("video/")) {
            setError("Please upload a valid video file");
            return false;
        }
        if (file.size > 100 * 1024 * 1024) { 
            setError("File size should be less than 100MB");
            return false;
        }
    }
    return true;
   };

   const getAuthParams = async () => {
    const response = await fetch('/api/auth/imagekit');
    if (!response.ok) {
      throw new Error('Failed to get auth params');
    }
    return response.json();
   };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setError(null);
    }
   };

   const handleUpload = async () => {
        // Access the file input element using the ref
        const fileInput = fileInputRef.current;
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            setError("Please select a file to upload");
            return;
        }

        // Extract the first file from the file input
        const file = fileInput.files[0];

        if (!validateFile(file)) return;

        // Retrieve authentication parameters for the upload.
        let authParams;
        try {
            authParams = await getAuthParams();
        } catch (authError) {
            console.error("Failed to authenticate for upload:", authError);
            setError("Authentication failed");
            return;
        }
        const { signature, expire, token, publicKey } = authParams;

        setUploading(true);
        setError(null);

        // Call the ImageKit SDK upload function with the required parameters and callbacks.
        try {
            const uploadResponse = await upload({
                // Authentication parameters
                expire,
                token,
                signature,
                publicKey,
                file,
                fileName: file.name, // Optionally set a custom file name
                // Progress callback to update upload progress state
                onProgress: (event) => {
                    const prog = (event.loaded / event.total) * 100;
                    setProgress(prog);
                    onProgress?.(prog);
                },
                // Abort signal to allow cancellation of the upload if needed.
                abortSignal: abortController.signal,
            });
            console.log("Upload response:", uploadResponse);
            onSuccess?.(uploadResponse);
        } catch (error) {
            // Handle specific error types provided by the ImageKit SDK.
            if (error instanceof ImageKitAbortError) {
                console.error("Upload aborted:", error.reason);
                setError("Upload aborted");
            } else if (error instanceof ImageKitInvalidRequestError) {
                console.error("Invalid request:", error.message);
                setError("Invalid request");
            } else if (error instanceof ImageKitUploadNetworkError) {
                console.error("Network error:", error.message);
                setError("Network error");
            } else if (error instanceof ImageKitServerError) {
                console.error("Server error:", error.message);
                setError("Server error");
            } else {
                // Handle any other errors that may occur.
                console.error("Upload error:", error);
                setError("Upload failed");
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <input
                type="file"
                accept={fileType === "image" ? "image/*" : fileType === "video" ? "video/*" : "*/*"}
                onChange={handleFileChange}
                ref={fileInputRef}
            />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? `Uploading... ${progress.toFixed(0)}%` : 'Upload'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
    );
};
