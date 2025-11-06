export default function ImagePositionControls({
  imageOffsetX,
  imageOffsetY,
  selectedImageIndex,
  totalImages,
  onPositionChange,
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="mb-2">
        <p className="text-sm text-gray-400">
          调整位置 (当前预览: Image {selectedImageIndex + 1} / {totalImages})
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Horizontal Position: {imageOffsetX}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={imageOffsetX}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value)
            onPositionChange(newValue, imageOffsetY)
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Vertical Position: {imageOffsetY}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={imageOffsetY}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value)
            onPositionChange(imageOffsetX, newValue)
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}

