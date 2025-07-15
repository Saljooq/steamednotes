import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="mt-8 text-center space-x-4">
      <Link to="/about" className="text-indigo-600 hover:text-indigo-500">About</Link>
      <Link to="/shortcuts" className="text-indigo-600 hover:text-indigo-500">Shortcuts</Link>
    </footer>
  );
};

export default Footer;