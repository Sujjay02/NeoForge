import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, File, Trash2, Copy, Check, Box } from 'lucide-react';
import { UploadedFile } from '../types';

interface AssetManagerProps {
  assets: UploadedFile[];
  onAddAsset: (asset: UploadedFile) => void;
  onRemoveAsset: (index: number) => void;
  onClose: () => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  onAddAsset,
  onRemoveAsset,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result?.toString() || '';
      // Extract base64 data without the data URL prefix
      const base64 = result.split(',')[1] || '';
      onAddAsset({
        data: base64,
        mimeType: file.type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const copyDataUrl = (asset: UploadedFile, index: number) => {
    const dataUrl = `data:${asset.mimeType};base64,${asset.data}`;
    navigator.clipboard.writeText(dataUrl);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-zinc-400" />;
    }
    if (mimeType.includes('gltf') || mimeType.includes('glb') || mimeType.includes('obj')) {
      return <Box className="w-8 h-8 text-zinc-400" />;
    }
    return <File className="w-8 h-8 text-zinc-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Asset Manager</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={`m-4 p-8 border-2 border-dashed rounded-xl text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
          <p className="text-zinc-600 dark:text-zinc-400">Drag and drop files here, or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.gltf,.glb,.obj"
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-zinc-400 mt-2">
            Supports images and 3D models (.gltf, .glb, .obj)
          </p>
        </div>

        {/* Asset List */}
        <div className="px-4 pb-4 max-h-60 overflow-y-auto">
          {assets.length === 0 ? (
            <p className="text-center text-zinc-500 py-4">No assets uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset, idx) => (
                <div
                  key={idx}
                  className="relative group border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800"
                >
                  {asset.mimeType.startsWith('image/') ? (
                    <img
                      src={`data:${asset.mimeType};base64,${asset.data}`}
                      alt={asset.fileName || 'Asset'}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center">
                      {getFileIcon(asset.mimeType)}
                    </div>
                  )}
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => copyDataUrl(asset, idx)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Copy data URL"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveAsset(idx)}
                      className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg transition-colors"
                      title="Remove asset"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  {/* Filename */}
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate px-2 py-1 border-t border-zinc-200 dark:border-zinc-700">
                    {asset.fileName || 'Unnamed'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with instructions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 text-center">
            Copy the data URL and paste it in your prompt or code to use the asset
          </p>
        </div>
      </div>
    </div>
  );
};
