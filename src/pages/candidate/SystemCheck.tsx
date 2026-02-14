import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  runSystemCheck,
  type SystemCheckResult,
} from "../../hooks/useSystemCheck";

export default function SystemCheck() {
  const [result, setResult] = useState<SystemCheckResult | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId") || "demo";

  useEffect(() => {
    console.log("🔍 Starting system check...");
    console.log(`📋 Exam ID: ${examId}`);
    runSystemCheck().then((res) => {
      console.log("✅ System check complete:", res);
      setResult(res);
    });
  }, [examId]);

  const handleNext = () => {
    console.log("➡️ Navigating to hardware check");
    navigate(`/hardware-check?examId=${examId}`);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Running system check...</p>
        </div>
      </div>
    );
  }

  const Item = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between p-4 border rounded">
      <span className="font-medium">{label}</span>
      <span className={ok ? "text-green-600" : "text-red-600"}>
        {ok ? "✓ Ready" : "✕ Failed"}
      </span>
    </div>
  );

  const allPassed =
    result.camera && result.microphone && result.browser && result.speaker;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">System Check</h1>
        <p className="text-center text-gray-600 mb-8">
          Verifying browser compatibility and basic permissions
        </p>

        <div className="space-y-4 mb-8">
          <Item label="Browser Compatibility" ok={result.browser} />
          <Item label="Camera Access" ok={result.camera} />
          <Item label="Microphone Access" ok={result.microphone} />
          <Item label="Speaker" ok={result.speaker} />
        </div>

        {allPassed ? (
          <button
            onClick={handleNext}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
          >
            ✓ Continue to Hardware Check
          </button>
        ) : (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">
              Please fix the failed checks before continuing
            </p>
            <p className="text-red-600 text-sm mt-2">
              Make sure to grant all required permissions and use a compatible
              browser
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
