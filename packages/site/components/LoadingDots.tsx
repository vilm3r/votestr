const LoadingDots = () => (
  <div className="absolute top-0 left-0 right-0 bottom-0">
    <div className="flex h-full items-center justify-center gap-4 pt-1">
      <div
        style={{ animationDelay: '0.1s' }}
        className="h-4 w-4 animate-bounce rounded-full bg-white p-2"
      ></div>
      <div
        style={{ animationDelay: '0.2s' }}
        className="h-4 w-4 animate-bounce rounded-full bg-white p-2"
      ></div>
      <div
        style={{ animationDelay: '0.3s' }}
        className="h-4 w-4 animate-bounce rounded-full bg-white p-2"
      ></div>
    </div>
  </div>
);

export default LoadingDots;
