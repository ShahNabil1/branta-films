import React from 'react';
import {createRoot} from 'react-dom/client';
import {VideoPlayer} from './components/player/VideoPlayer';
import {VideoUploadStatus} from './components/admin/VideoUploadStatus';
export function mount(){createRoot(document.body.appendChild(document.createElement('div'))).render(<div className="p-6"><VideoPlayer title="Mobile check" getSource={async()=>({url:'/check.webm',expiresAt:Date.now()+900000})} onProgress={()=>{}}/><div className="admin-theme light mt-4"><VideoUploadStatus status={{name:'Episode 01.mp4',total:1024**3,loaded:512*1024**2,elapsed:100,speed:512*1024**2/100,phase:'uploading'}} onRetry={()=>{}}/></div></div>)}
