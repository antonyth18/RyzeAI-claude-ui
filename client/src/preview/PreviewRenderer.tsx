import React, { useEffect, useRef } from 'react';
import { getIframeHTML } from './iframeTemplate';

interface PreviewRendererProps {
    code: string;
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({ code }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            const iframeHTML = getIframeHTML(code);
            iframeRef.current.srcdoc = iframeHTML;
        }
    }, [code]);

    return (
        <iframe
            ref={iframeRef}
            title="Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0 bg-white"
        />
    );
};
