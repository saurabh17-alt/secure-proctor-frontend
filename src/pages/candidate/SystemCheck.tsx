import { useEffect, useState } from "react";
import {
  runSystemCheck,
  type SystemCheckResult,
} from "../../hooks/useSystemCheck";

export default function SystemCheck() {
  const [result, setResult] = useState<SystemCheckResult | null>(null);

  useEffect(() => {
    runSystemCheck().then(setResult);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Running system check...</p>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">System Check</h1>

        <div className="space-y-4">
          <Item label="Camera Access" ok={result.camera} />
          <Item label="Microphone Access" ok={result.microphone} />
          <Item label="Browser Compatibility" ok={result.browser} />
          <Item label="Speaker" ok={result.speaker} />
        </div>
      </div>
    </div>
  );
}
