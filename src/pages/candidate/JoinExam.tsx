import { useNavigate } from "react-router-dom";

export default function JoinExam() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Join Exam</h1>
        <p className="text-gray-600 text-center mb-4">
          Enter your exam credentials to begin
        </p>
        <button
          className="w-full py-2 bg-black text-white rounded"
          onClick={() => navigate("/system-check")}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
