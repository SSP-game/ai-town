import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'react-toastify';
import surveyConfig from '../../data/survey-config.json';

interface SurveyViewProps {
  userId: Id<'users'>;
  onComplete: () => void;
}

type QuestionType = 'scale' | 'choice' | 'text' | 'multi-choice' | 'boolean' | 'matrix';

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  description: string;
  required: boolean;
  // Scale specific
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  defaultValue?: number | string | string[] | boolean | Record<string, number>;
  // Choice specific
  options?: { value: string; label: string; description?: string }[];
  // Multi-choice specific (uses options)
  minSelections?: number;
  maxSelections?: number;
  // Boolean specific
  trueLabel?: string;
  falseLabel?: string;
  // Matrix specific
  subQuestions?: { id: string; label: string }[];
  scaleOptions?: { value: number; label: string }[];
  // Text specific
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

interface Section {
  id: string;
  title: string;
  color: string;
  questions: Question[];
}

interface SurveyConfig {
  title: string;
  description: string;
  sections: Section[];
}

const colorMap: Record<string, string> = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  pink: 'text-pink-400',
};

export default function SurveyView({ userId, onComplete }: SurveyViewProps) {
  const submitSurvey = useMutation(api.survey.submitSurvey);
  const config = surveyConfig as SurveyConfig;

  // Initialize answers from config
  const initializeAnswers = () => {
    const answers: Record<string, any> = {};
    config.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.defaultValue !== undefined) {
          answers[question.id] = question.defaultValue;
        } else if (question.type === 'scale') {
          answers[question.id] = 3;
        } else if (question.type === 'text') {
          answers[question.id] = '';
        } else if (question.type === 'multi-choice') {
          answers[question.id] = [];
        } else if (question.type === 'boolean') {
          answers[question.id] = false;
        } else if (question.type === 'matrix') {
          const matrixAnswers: Record<string, number> = {};
          question.subQuestions?.forEach((sq) => {
            matrixAnswers[sq.id] = 3;
          });
          answers[question.id] = matrixAnswers;
        }
      });
    });
    return answers;
  };

  const [answers, setAnswers] = useState(initializeAnswers());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare answers for submission
      const submissionAnswers: any = {};
      config.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const value = answers[question.id];
          // Only include optional text fields if they have content
          if (question.type === 'text' && !question.required && !value) {
            submissionAnswers[question.id] = undefined;
          } else {
            submissionAnswers[question.id] = value;
          }
        });
      });

      await submitSurvey({
        userId,
        answers: submissionAnswers,
      });

      toast.success('Survey submitted successfully!');
      onComplete();
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScaleQuestion = ({ question }: { question: Question }) => (
    <div>
      <label className="block text-lg font-semibold mb-2 text-brown-100">
        {question.label}
        {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
      </label>
      {question.description && (
        <p className="text-sm text-brown-300 mb-3">{question.description}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-brown-400 w-24 text-right">{question.lowLabel}</span>
        <div className="flex gap-2 flex-1">
          {Array.from(
            { length: (question.max || 5) - (question.min || 1) + 1 },
            (_, i) => i + (question.min || 1)
          ).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setAnswers({ ...answers, [question.id]: num })}
              className={`flex-1 py-2 px-4 rounded transition-all ${
                answers[question.id] === num
                  ? 'bg-clay-700 text-white border-2 border-clay-600'
                  : 'bg-brown-700 text-brown-200 hover:bg-brown-600 border-2 border-brown-600'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-brown-400 w-24">{question.highLabel}</span>
      </div>
    </div>
  );

  const ChoiceQuestion = ({ question }: { question: Question }) => {
    // Check if any option has a description to determine layout
    const hasDescriptions = question.options?.some(opt => opt.description);

    return (
      <div>
        <label className="block text-lg font-semibold mb-2 text-brown-100">
          {question.label}
          {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
        </label>
        {question.description && (
          <p className="text-sm text-brown-300 mb-3">{question.description}</p>
        )}
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={answers[question.id] === option.value}
                onChange={() => setAnswers({ ...answers, [question.id]: option.value })}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="text-brown-100">{option.label}</span>
                {option.description && (
                  <div className="text-sm text-brown-400 mt-1">{option.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const TextQuestion = ({ question }: { question: Question }) => (
    <div>
      <label className="block text-lg font-semibold mb-2 text-brown-100">
        {question.label}
        {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
      </label>
      {question.description && (
        <p className="text-sm text-brown-300 mb-2">{question.description}</p>
      )}
      <textarea
        value={answers[question.id] || ''}
        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
        className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:outline-none focus:border-brown-400"
        rows={question.rows || 4}
        placeholder={question.placeholder || 'Write your response here'}
      />
    </div>
  );

  const MultiChoiceQuestion = ({ question }: { question: Question }) => {
    const selectedValues = (answers[question.id] || []) as string[];

    const toggleOption = (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      setAnswers({ ...answers, [question.id]: newValues });
    };

    return (
      <div>
        <label className="block text-lg font-semibold mb-2 text-brown-100">
          {question.label}
          {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
        </label>
        {question.description && (
          <p className="text-sm text-brown-300 mb-3">{question.description}</p>
        )}
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="mt-1"
              />
              <span className="text-brown-100">{option.label}</span>
            </label>
          ))}
        </div>
        {(question.minSelections || question.maxSelections) && (
          <p className="text-xs text-brown-400 mt-2">
            {question.minSelections && question.maxSelections
              ? `Select ${question.minSelections}-${question.maxSelections} options`
              : question.minSelections
              ? `Select at least ${question.minSelections} option(s)`
              : `Select up to ${question.maxSelections} option(s)`}
          </p>
        )}
      </div>
    );
  };

  const BooleanQuestion = ({ question }: { question: Question }) => (
    <div>
      <label className="block text-lg font-semibold mb-2 text-brown-100">
        {question.label}
        {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
      </label>
      {question.description && (
        <p className="text-sm text-brown-300 mb-3">{question.description}</p>
      )}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setAnswers({ ...answers, [question.id]: true })}
          className={`flex-1 py-3 px-6 rounded transition-all font-semibold border-2 ${
            answers[question.id] === true
              ? 'bg-clay-700 text-white border-clay-600'
              : 'bg-brown-700 text-brown-200 hover:bg-brown-600 border-brown-600'
          }`}
        >
          {question.trueLabel || 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setAnswers({ ...answers, [question.id]: false })}
          className={`flex-1 py-3 px-6 rounded transition-all font-semibold border-2 ${
            answers[question.id] === false
              ? 'bg-clay-700 text-white border-clay-600'
              : 'bg-brown-700 text-brown-200 hover:bg-brown-600 border-brown-600'
          }`}
        >
          {question.falseLabel || 'No'}
        </button>
      </div>
    </div>
  );

  const MatrixQuestion = ({ question }: { question: Question }) => {
    const matrixAnswers = (answers[question.id] || {}) as Record<string, number>;

    return (
      <div>
        <label className="block text-lg font-semibold mb-2 text-brown-100">
          {question.label}
          {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
        </label>
        {question.description && (
          <p className="text-sm text-brown-300 mb-3">{question.description}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b-2 border-brown-600 text-brown-100"></th>
                {question.scaleOptions?.map((opt) => (
                  <th key={opt.value} className="text-center p-2 border-b-2 border-brown-600 text-sm text-brown-200">
                    {opt.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.subQuestions?.map((subQ) => (
                <tr key={subQ.id} className="border-b border-brown-700">
                  <td className="p-2 text-sm text-brown-100">{subQ.label}</td>
                  {question.scaleOptions?.map((opt) => (
                    <td key={opt.value} className="text-center p-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newMatrixAnswers = { ...matrixAnswers, [subQ.id]: opt.value };
                          setAnswers({ ...answers, [question.id]: newMatrixAnswers });
                        }}
                        className={`w-8 h-8 rounded-full transition-all border-2 ${
                          matrixAnswers[subQ.id] === opt.value
                            ? 'bg-clay-700 border-clay-600'
                            : 'bg-brown-700 hover:bg-brown-600 border-brown-600'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'scale':
        return <ScaleQuestion key={question.id} question={question} />;
      case 'choice':
        return <ChoiceQuestion key={question.id} question={question} />;
      case 'text':
        return <TextQuestion key={question.id} question={question} />;
      case 'multi-choice':
        return <MultiChoiceQuestion key={question.id} question={question} />;
      case 'boolean':
        return <BooleanQuestion key={question.id} question={question} />;
      case 'matrix':
        return <MatrixQuestion key={question.id} question={question} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brown-900 text-brown-100 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="box bg-brown-800 mb-8">
          <div className="bg-brown-700 p-4">
            <h1 className="text-3xl font-display text-brown-100 text-center">{config.title}</h1>
          </div>
          <div className="p-4">
            <p className="text-center text-brown-200">{config.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {config.sections.map((section) => (
            <div key={section.id} className="box bg-brown-800">
              <div className="bg-brown-700 p-3">
                <h2 className="text-2xl font-display text-brown-100">
                  {section.title}
                </h2>
              </div>
              <div className="p-4 space-y-6">
                {section.questions.map((question) => renderQuestion(question))}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full button text-white shadow-solid text-lg cursor-pointer"
          >
            <div className="h-full bg-clay-700 text-center py-3">
              <span>{isSubmitting ? 'Submitting...' : 'Submit Survey'}</span>
            </div>
          </button>
        </form>

        <p className="text-center text-sm text-brown-400 mt-6">
          Thank you for taking the time to complete this survey. Your mental well-being matters.
        </p>
      </div>
    </div>
  );
}
