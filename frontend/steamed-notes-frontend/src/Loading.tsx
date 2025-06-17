type LoadingScreenProps = {
  msg: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ msg }) => {
  return (
    <div className="fixed inset-0 bg-yellow-50 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg max-w-md text-center">
        <div className="flex justify-center mb-4">
          <span className="text-4xl animate-pulse">✏️</span>
        </div>
        <p className="text-xl font-mono text-gray-800">
          {msg}
          <span className="inline-block w-0.5 h-5 bg-gray-800 animate-blink ml-1 align-middle" />
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;