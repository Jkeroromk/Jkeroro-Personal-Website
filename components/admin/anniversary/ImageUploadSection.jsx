import FileUpload from '@/components/ui/FileUpload'

export default function ImageUploadSection({
  uploading,
  uploadKey,
  onFileSelect,
}) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-3">Upload New Background</h3>
      {uploading && (
        <div className="mb-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-300 text-sm">Updating background image...</p>
        </div>
      )}
      <FileUpload
        key={uploadKey}
        type="image"
        onFileSelect={onFileSelect}
        maxSize={10}
      />
      <p className="text-gray-400 text-sm mt-2">
        Recommended: Landscape image, at least 550x400px
      </p>
    </div>
  )
}

