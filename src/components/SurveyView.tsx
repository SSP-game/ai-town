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

type QuestionType = 'scale' | 'choice' | 'text';

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
  defaultValue?: number | string;
  // Choice specific
  options?: { value: string; label: string }[];
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
    <div className="mb-6">
      <label className="block text-lg font-semibold mb-2">
        {question.label}
        {question.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-gray-300 mb-3">{question.description}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-24 text-right">{question.lowLabel}</span>
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
                  ? 'bg-blue-600 text-white scale-110'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 w-24">{question.highLabel}</span>
      </div>
    </div>
  );

  const ChoiceQuestion = ({ question }: { question: Question }) => (
    <div className="mb-6">
      <label className="block text-lg font-semibold mb-2">
        {question.label}
        {question.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-gray-300 mb-3">{question.description}</p>
      )}
      <div className={`grid grid-cols-${question.options?.length || 3} gap-3`}>
        {question.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setAnswers({ ...answers, [question.id]: option.value })}
            className={`py-3 px-4 rounded transition-all capitalize ${
              answers[question.id] === option.value
                ? 'bg-green-600 text-white scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const TextQuestion = ({ question }: { question: Question }) => (
    <div className="mb-4">
      <label className="block text-lg font-semibold mb-2">
        {question.label}
        {question.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-gray-300 mb-2">{question.description}</p>
      )}
      <textarea
        value={answers[question.id] || ''}
        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
        className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        rows={question.rows || 3}
        placeholder={question.placeholder}
      />
    </div>
  );

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'scale':
        return <ScaleQuestion key={question.id} question={question} />;
      case 'choice':
        return <ChoiceQuestion key={question.id} question={question} />;
      case 'text':
        return <TextQuestion key={question.id} question={question} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">{config.title}</h1>
        <p className="text-center text-gray-300 mb-8">{config.description}</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {config.sections.map((section) => (
            <div key={section.id} className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
              <h2 className={`text-2xl font-bold mb-4 ${colorMap[section.color] || 'text-white'}`}>
                {section.title}
              </h2>
              {section.questions.map((question) => renderQuestion(question))}
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                isSubmitting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Thank you for taking the time to complete this survey. Your mental well-being matters.
        </p>
      </div>
    </div>
  );
}
