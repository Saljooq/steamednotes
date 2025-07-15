import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">About Steamed Notes</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">About us</h2>
            <br/>
            <p className="mt-2 text-gray-700">
              After struggling with finding the right tools to capture his thoughts without emptying his wallet, we decided to create Steamed Notes - providing the right mix of simplicity and convenience without breaking bank.  
            </p>
            <br/>
            <p className="mt-2 text-gray-700">
              Steamed Notes is a lightweight, user-friendly note-taking application designed to help you capture, organize, and navigate your thoughts efficiently.   
            </p>
            <br/>
            <p className="mt-2 text-gray-700">
              Whether you're jotting down quick ideas, managing tasks, or keeping track of important information, Steamed Notes provides a seamless experience with intuitive shortcuts and a clean interface.
            </p>
            <br/>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">About Our Founder</h2>
            <br/>
            <img
                src="/FounderPic-min.jpg"
                alt="Steamed Notes Founder"
                className="w-48 h-48 object-cover rounded-full shadow-md mb-4"
                loading="lazy"
              />
            <p className="mt-2 text-gray-700">
              Saljooq Altaf is a Software Engineer. After graduating from Iowa State University with Summa Cum Laude, he joined Kingland Systems as a Software Engineer to create their own in-house Data Lakehouse. 
            </p> 
            <br/>
            <p className="mt-2 text-gray-700">
              Since then he has taken on several pivotal projects including Load Testing Automation, Jira migration to cloud, and Enabling Third Party Access for Kingland.
            </p> 
            <br/>
            <p className="mt-2 text-gray-700">
                Additionally, he has taken on side projects including this one, you can find more on <a className="text-indigo-600 hover:text-indigo-500" href="https://github.com/Saljooq">github</a>. You can find a more complete profile <a  className="text-indigo-600 hover:text-indigo-500" href="https://www.linkedin.com/in/saljooq-altaf-49259735/">here</a>
            </p>
          </div>
          <br/>
          <br/>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">Helpful links</h2>
            <br />
            <Link to="/shortcuts" className="text-indigo-600 hover:text-indigo-500">- Shortcuts</Link>
            <br />
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-500">- Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;