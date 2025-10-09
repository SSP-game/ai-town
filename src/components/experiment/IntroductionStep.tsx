interface IntroductionStepProps {
  introduction: string;
  onContinue: () => void;
}

export default function IntroductionStep({ introduction, onContinue }: IntroductionStepProps) {
  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="box bg-brown-800">
        <div className="bg-brown-700 p-5 text-center">
          <h2 className="text-3xl font-display text-brown-100">Study Introduction</h2>
        </div>
        <div className="p-6 space-y-6 text-brown-100 leading-relaxed">
          <p className="whitespace-pre-wrap text-left">{introduction}</p>
          <div className="bg-brown-900/40 border border-brown-700 rounded p-4 text-sm text-brown-200">
            <p>
              You’ll next complete a short questionnaire and then wait in the lobby until a full
              cohort is ready. Once the session starts, you will chat one-on-one with an AI
              companion before entering the town to interact freely.
            </p>
          </div>
          <button
            onClick={onContinue}
            className="w-full button text-white shadow-solid text-lg cursor-pointer pointer-events-auto"
          >
            <div className="h-full bg-clay-700 text-center py-3">
              <span>Continue</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
