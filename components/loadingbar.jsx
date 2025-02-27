const LoadingBar = () => {
    return (
      <div className="w-full h-[5px] bg-gray-700 relative overflow-hidden rounded-md">
        <div className="h-full w-full bg-white absolute animate-loading-bar"></div>
      </div>
    )
  }
  
  export default LoadingBar
  