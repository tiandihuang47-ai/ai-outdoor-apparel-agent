interface StepWizardProps {
  steps: string[];
  currentStep: number;
}

export default function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div className="w-full py-6">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <li
              key={step}
              className={`flex flex-col items-center flex-1 relative ${
                isCompleted
                  ? 'text-emerald-400'
                  : isActive
                  ? 'text-cyan-400'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 mb-2 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400'
                    : isActive
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 border-slate-600'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className="text-xs md:text-sm font-medium text-center">
                {step}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                    isCompleted ? 'bg-emerald-400/50' : 'bg-slate-700'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
